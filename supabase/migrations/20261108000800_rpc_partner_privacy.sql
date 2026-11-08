-- Regather: partner/moderator functions and privacy (export). Every moderator action
-- writes to audit_log (no message text). Partners are scoped to their own partner row,
-- derived from partner_staff, never taken as an argument.

create function private.my_partner() returns uuid
language sql stable security definer set search_path = '' as $$
  select s.partner_id from public.partner_staff s where s.user_id = (select auth.uid());
$$;

create function private.audit(p_partner uuid, p_action text, p_target_type text, p_target uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_log (partner_id, actor_id, action, target_type, target_id)
  values (p_partner, (select auth.uid()), p_action, p_target_type, p_target);
$$;

-- ---------- invite codes ----------

create function public.create_invite_code(
  p_role public.app_role,
  p_age_band public.age_band,
  p_max_uses int,
  p_ttl_days int,
  p_label text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_partner uuid := private.my_partner();
  v_alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; -- 32 symbols = 5 bits each
  v_bytes bytea := extensions.gen_random_bytes(16);
  v_code text := '';
  v_id uuid;
  v_expires timestamptz;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if v_partner is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_max_uses not between 1 and 10 or p_ttl_days not between 1 and 30 then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;
  if not private.hit_rate_limit('mkcode:' || v_uid::text, 30, 3600) then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  for i in 0..15 loop -- 16 symbols x 5 bits = 80 bits of randomness
    v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, i) & 31) + 1, 1);
  end loop;

  v_expires := now() + make_interval(days => p_ttl_days);

  begin
    insert into public.invite_codes (partner_id, code_hash, role, age_band, label, max_uses, expires_at, created_by)
    values (v_partner, private.hash_code(v_code), p_role, p_age_band,
            nullif(left(private.sanitize_text(p_label), 40), ''), p_max_uses, v_expires, v_uid)
    returning id into v_id;
  exception when check_violation then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end;

  perform private.audit(v_partner, 'create_invite_code', 'invite_code', v_id);

  -- the plaintext code is returned exactly once and is never stored
  return jsonb_build_object(
    'ok', true,
    'id', v_id,
    'code', 'RGTH-' || substr(v_code, 1, 4) || '-' || substr(v_code, 5, 4) || '-'
            || substr(v_code, 9, 4) || '-' || substr(v_code, 13, 4),
    'expires_at', v_expires
  );
end;
$$;

create function public.revoke_invite_code(p_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_partner uuid := private.my_partner();
  v_rows int;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if v_partner is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.invite_codes set revoked_at = now()
  where id = p_id and partner_id = v_partner and revoked_at is null;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform private.audit(v_partner, 'revoke_invite_code', 'invite_code', p_id);
  return jsonb_build_object('ok', true);
end;
$$;

-- ---------- flags ----------

create function public.review_flag(p_id uuid, p_status public.flag_status, p_note text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_partner uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select f.partner_id into v_partner from public.flags f where f.id = p_id;
  if not found or not private.is_moderator(v_partner) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.flags set
    status = p_status,
    review_note = nullif(left(private.sanitize_text(p_note), 500), ''),
    reviewed_by = (select auth.uid()),
    reviewed_at = now()
  where id = p_id;
  perform private.audit(v_partner, 'review_flag:' || p_status::text, 'flag', p_id);
  return jsonb_build_object('ok', true);
end;
$$;

-- Moderators may read a mentor thread, but only through this function, which audits it.
create function public.moderator_read_thread(p_thread_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_partner uuid;
  v_messages jsonb;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select c.partner_id into v_partner
  from public.threads t join public.circles c on c.id = t.circle_id
  where t.id = p_thread_id and t.kind = 'mentor';
  if not found or not private.is_moderator(v_partner) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform private.audit(v_partner, 'view_mentor_thread', 'thread', p_thread_id);
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', m.id, 'sender_nickname', p.nickname, 'body', m.body, 'created_at', m.created_at
    ) order by m.created_at), '[]'::jsonb)
  into v_messages
  from public.messages m join public.profiles p on p.id = m.sender_id
  where m.thread_id = p_thread_id;
  return jsonb_build_object('ok', true, 'messages', v_messages);
end;
$$;

-- Counts only. Partners never get circle message text.
create function public.partner_circle_activity()
returns table (
  circle_id uuid, circle_name text, kind public.circle_kind, members int,
  messages_24h int, last_message_at timestamptz, mentor_nickname text
)
language sql stable security definer set search_path = '' as $$
  select
    c.id, c.name, c.kind,
    (select count(*)::int from public.circle_members m where m.circle_id = c.id),
    (select count(*)::int from public.messages x
       where x.circle_id = c.id and x.created_at > now() - interval '24 hours'),
    (select max(x.created_at) from public.messages x where x.circle_id = c.id),
    (select p.nickname from public.profiles p where p.id = c.mentor_id)
  from public.circles c
  where private.is_partner_staff(c.partner_id)
  order by c.created_at;
$$;

-- ---------- privacy: data export (deletion is cascade-on-auth.users via the server) ----------

create function public.export_my_data() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  return jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = v_uid),
    'details', (select to_jsonb(d) - 'invite_id' from public.profile_details d where d.user_id = v_uid),
    'circle', (select private.circle_summary(m.circle_id) from public.circle_members m where m.user_id = v_uid),
    'messages_sent', coalesce((
      select jsonb_agg(jsonb_build_object('body', x.body, 'kind', x.kind, 'created_at', x.created_at)
                       order by x.created_at)
      from public.messages x where x.sender_id = v_uid), '[]'::jsonb),
    'notes_sent', coalesce((
      select jsonb_agg(jsonb_build_object('body', n.body, 'sticker', n.sticker, 'created_at', n.created_at)
                       order by n.created_at)
      from public.comfort_notes n where n.sender_id = v_uid), '[]'::jsonb),
    'notes_received', coalesce((
      select jsonb_agg(jsonb_build_object('body', n.body, 'sticker', n.sticker, 'created_at', n.created_at)
                       order by n.created_at)
      from public.comfort_notes n where n.recipient_id = v_uid), '[]'::jsonb),
    'connections', coalesce((
      select jsonb_agg(jsonb_build_object('status', c.status, 'created_at', c.created_at))
      from public.connections c where v_uid in (c.requester_id, c.addressee_id)), '[]'::jsonb)
  );
end;
$$;

revoke all on function
  public.create_invite_code(public.app_role, public.age_band, int, int, text),
  public.revoke_invite_code(uuid),
  public.review_flag(uuid, public.flag_status, text),
  public.moderator_read_thread(uuid),
  public.partner_circle_activity(),
  public.export_my_data()
from public, anon;
grant execute on function
  public.create_invite_code(public.app_role, public.age_band, int, int, text),
  public.revoke_invite_code(uuid),
  public.review_flag(uuid, public.flag_status, text),
  public.moderator_read_thread(uuid),
  public.partner_circle_activity(),
  public.export_my_data()
to authenticated;
