-- Regather: private chat connections, mentor requests, candy-gram notes.
-- Youth and adults can never connect or exchange notes: every check below is enforced
-- here in the database, not just in the UI.

create function private.shares_circle(p_a uuid, p_b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.circle_members a
    join public.circle_members b on b.circle_id = a.circle_id
    where a.user_id = p_a and b.user_id = p_b
  );
$$;

create function private.ensure_thread(p_kind public.thread_kind, p_circle uuid, p_x uuid, p_y uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  insert into public.threads (kind, circle_id, user_a, user_b)
  values (p_kind, p_circle, least(p_x, p_y), greatest(p_x, p_y))
  on conflict (kind, user_a, user_b) do nothing
  returning id into v_id;
  if v_id is null then
    select t.id into v_id from public.threads t
    where t.kind = p_kind and t.user_a = least(p_x, p_y) and t.user_b = greatest(p_x, p_y);
  end if;
  return v_id;
end;
$$;

-- ---------- private chats (youth with youth, parent with parent) ----------

create function public.request_connection(p_other uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_me public.profiles%rowtype;
  v_them public.profiles%rowtype;
  v_existing public.connections%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select * into v_me from public.profiles p where p.id = v_uid;
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into v_them from public.profiles p where p.id = p_other;
  if not found or p_other = v_uid then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- same role AND same audience (youth<->youth, parent<->parent); never staff or mentors
  if v_me.role in ('mentor', 'partner')
     or v_me.role <> v_them.role
     or v_me.audience <> v_them.audience
     or not private.shares_circle(v_uid, p_other) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not private.hit_rate_limit('conn:' || v_uid::text, 10, 3600) then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  select * into v_existing from public.connections c
  where least(c.requester_id, c.addressee_id) = least(v_uid, p_other)
    and greatest(c.requester_id, c.addressee_id) = greatest(v_uid, p_other);

  if found then
    if v_existing.status = 'requested' and v_existing.addressee_id = v_uid then
      update public.connections set status = 'accepted' where id = v_existing.id;
      return jsonb_build_object('ok', true, 'status', 'accepted',
        'thread_id', private.ensure_thread('private', null, v_uid, p_other));
    end if;
    -- never reveal a decline to the requester
    return jsonb_build_object('ok', true,
      'status', case when v_existing.status = 'accepted' then 'accepted' else 'requested' end);
  end if;

  insert into public.connections (requester_id, addressee_id) values (v_uid, p_other);
  return jsonb_build_object('ok', true, 'status', 'requested');
end;
$$;

create function public.respond_connection(p_id uuid, p_accept boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_conn public.connections%rowtype;
  v_a public.profiles%rowtype;
  v_b public.profiles%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select * into v_conn from public.connections c
  where c.id = p_id and c.addressee_id = v_uid and c.status = 'requested'
  for update;
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not p_accept then
    update public.connections set status = 'declined' where id = v_conn.id;
    return jsonb_build_object('ok', true, 'status', 'declined');
  end if;

  select * into v_a from public.profiles p where p.id = v_conn.requester_id;
  select * into v_b from public.profiles p where p.id = v_conn.addressee_id;
  if v_a.role <> v_b.role or v_a.audience <> v_b.audience then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.connections set status = 'accepted' where id = v_conn.id;
  return jsonb_build_object('ok', true, 'status', 'accepted',
    'thread_id', private.ensure_thread('private', null, v_conn.requester_id, v_conn.addressee_id));
end;
$$;

-- ---------- mentor 1:1 (moderated) ----------

create function public.request_mentor() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_role public.app_role;
  v_circle uuid;
  v_mentor uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select p.role into v_role from public.profiles p where p.id = v_uid;
  if not found or v_role in ('mentor', 'partner') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select c.id, c.mentor_id into v_circle, v_mentor
  from public.circle_members m join public.circles c on c.id = m.circle_id
  where m.user_id = v_uid;
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_mentor is null then
    return jsonb_build_object('ok', false, 'error', 'no_mentor');
  end if;

  if not private.hit_rate_limit('mreq:' || v_uid::text, 5, 3600) then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  insert into public.mentor_requests (requester_id, circle_id, mentor_id)
  values (v_uid, v_circle, v_mentor)
  on conflict (requester_id, circle_id) do nothing;
  return jsonb_build_object('ok', true);
end;
$$;

create function public.respond_mentor_request(p_id uuid, p_accept boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  r public.mentor_requests%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select * into r from public.mentor_requests x
  where x.id = p_id and x.mentor_id = v_uid and x.status = 'requested'
  for update;
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not p_accept then
    update public.mentor_requests set status = 'declined' where id = r.id;
    return jsonb_build_object('ok', true, 'status', 'declined');
  end if;
  update public.mentor_requests set status = 'accepted' where id = r.id;
  return jsonb_build_object('ok', true, 'status', 'accepted',
    'thread_id', private.ensure_thread('mentor', r.circle_id, r.requester_id, r.mentor_id));
end;
$$;

-- ---------- candy-gram notes ----------

create function public.send_note(
  p_recipient uuid,
  p_sticker public.note_sticker,
  p_color text,
  p_body text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_me public.profiles%rowtype;
  v_them public.profiles%rowtype;
  v_trust smallint;
  v_partner uuid;
  v_clean text;
  v_stored text;
  v_sev public.flag_severity;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select * into v_me from public.profiles p where p.id = v_uid;
  if not found or v_me.role = 'partner' then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into v_them from public.profiles p where p.id = p_recipient;
  if not found or p_recipient = v_uid or v_them.role = 'partner' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- same audience only (no adult <-> minor), and an existing relationship
  if v_me.audience <> v_them.audience
     or not (
       private.shares_circle(v_uid, p_recipient)
       or exists (
         select 1 from public.connections c
         where c.status = 'accepted'
           and ((c.requester_id = v_uid and c.addressee_id = p_recipient)
             or (c.addressee_id = v_uid and c.requester_id = p_recipient))
       )
     ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not private.hit_rate_limit('note:' || v_uid::text, 20, 86400) then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  v_clean := private.sanitize_text(p_body);
  if char_length(v_clean) not between 1 and 280 then
    return jsonb_build_object('ok', false, 'error', 'invalid_body');
  end if;
  if p_color is null or p_color not in ('blush', 'lake', 'mint', 'lilac', 'peach') then
    return jsonb_build_object('ok', false, 'error', 'invalid_color');
  end if;

  select d.trust_level, d.partner_id into v_trust, v_partner
  from public.profile_details d where d.user_id = v_uid;
  v_stored := case when v_trust < 2 then private.redact_pii(v_clean) else v_clean end;

  insert into public.comfort_notes (sender_id, recipient_id, sticker, color, body, redacted)
  values (v_uid, p_recipient, p_sticker, p_color, v_stored, v_stored <> v_clean)
  returning id into v_id;

  v_sev := private.crisis_check(v_clean);
  if v_sev is not null then
    insert into public.flags (partner_id, note_id, sender_id, source, severity, context, snapshot)
    values (v_partner, v_id, v_uid, 'keyword', v_sev, 'note', v_clean);
  end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'crisis', v_sev is not null);
end;
$$;

revoke all on function
  public.request_connection(uuid), public.respond_connection(uuid, boolean),
  public.request_mentor(), public.respond_mentor_request(uuid, boolean),
  public.send_note(uuid, public.note_sticker, text, text)
from public, anon;
grant execute on function
  public.request_connection(uuid), public.respond_connection(uuid, boolean),
  public.request_mentor(), public.respond_mentor_request(uuid, boolean),
  public.send_note(uuid, public.note_sticker, text, text)
to authenticated;
