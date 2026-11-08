-- Regather: sending messages, crisis detection, flags, SOS.
-- There is NO direct INSERT/UPDATE/DELETE grant on messages. Every message goes through
-- send_message(), which checks membership, rate-limits, sanitizes, strips contact info
-- for low-trust users, and runs the keyword crisis check. Flagged messages are never
-- deleted or hidden: the sender gets crisis:true so the UI shows the crisis card.

create function public.send_message(
  p_circle_id uuid,
  p_thread_id uuid,
  p_body text,
  p_kind public.message_kind default 'text',
  p_score smallint default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_trust smallint;
  v_partner uuid;
  v_thread public.threads%rowtype;
  v_clean text;
  v_stored text;
  v_sev public.flag_severity;
  v_id uuid;
  v_context text;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if num_nonnulls(p_circle_id, p_thread_id) <> 1 then
    raise exception 'invalid target' using errcode = '22023';
  end if;

  select d.trust_level, d.partner_id into v_trust, v_partner
  from public.profile_details d where d.user_id = v_uid;
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_circle_id is not null then
    if not private.can_access_circle(p_circle_id) then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    v_context := 'circle';
  else
    select * into v_thread from public.threads t where t.id = p_thread_id;
    if not found or v_uid not in (v_thread.user_a, v_thread.user_b) then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    v_context := v_thread.kind::text;
  end if;

  if p_kind = 'checkin' then
    if p_circle_id is null or p_score is null or p_score not between 1 and 5 then
      raise exception 'invalid check-in' using errcode = '22023';
    end if;
  elsif p_score is not null then
    raise exception 'invalid message' using errcode = '22023';
  end if;

  if not private.hit_rate_limit('msg:' || v_uid::text, 10, 30) then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  if p_kind = 'checkin' then
    v_clean := p_score::text;
  else
    v_clean := private.sanitize_text(p_body);
    if char_length(v_clean) not between 1 and 2000 then
      return jsonb_build_object('ok', false, 'error', 'invalid_body');
    end if;
  end if;

  -- low-trust users cannot exchange contact details
  v_stored := case when v_trust < 2 and p_kind = 'text' then private.redact_pii(v_clean) else v_clean end;

  insert into public.messages (circle_id, thread_id, sender_id, kind, body, checkin_score, redacted)
  values (p_circle_id, p_thread_id, v_uid, p_kind, v_stored, case when p_kind = 'checkin' then p_score end,
          v_stored <> v_clean)
  returning id into v_id;

  if p_kind = 'text' then
    v_sev := private.crisis_check(v_clean);
    if v_sev is not null then
      insert into public.flags (partner_id, message_id, sender_id, source, severity, context, snapshot)
      values (v_partner, v_id, v_uid, 'keyword', v_sev, v_context, v_clean);
    end if;
  end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'crisis', v_sev is not null,
                            'redacted', v_stored <> v_clean);
end;
$$;

-- Second-opinion flag from the optional AI classifier (service role only).
create function public.add_ai_flag(p_message_id uuid, p_severity public.flag_severity) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  m public.messages%rowtype;
  v_partner uuid;
  v_context text;
  v_id uuid;
begin
  select * into m from public.messages x where x.id = p_message_id;
  if not found then
    return null;
  end if;
  -- one flag per message is enough; don't spam moderators
  if exists (select 1 from public.flags f where f.message_id = m.id) then
    return null;
  end if;
  select d.partner_id into v_partner from public.profile_details d where d.user_id = m.sender_id;
  v_context := case
    when m.circle_id is not null then 'circle'
    else (select t.kind::text from public.threads t where t.id = m.thread_id)
  end;
  insert into public.flags (partner_id, message_id, sender_id, source, severity, context, snapshot)
  values (v_partner, m.id, m.sender_id, 'ai', p_severity, v_context, m.body)
  returning id into v_id;
  return v_id;
end;
$$;

-- "I need help" button. Records that someone asked for help; no message text.
create function public.trigger_sos() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_partner uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select d.partner_id into v_partner from public.profile_details d where d.user_id = v_uid;
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not private.hit_rate_limit('sos:' || v_uid::text, 3, 600) then
    return jsonb_build_object('ok', true, 'throttled', true);
  end if;
  insert into public.flags (partner_id, sender_id, source, severity, context)
  values (v_partner, v_uid, 'sos', 'high', 'sos');
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function
  public.send_message(uuid, uuid, text, public.message_kind, smallint),
  public.add_ai_flag(uuid, public.flag_severity),
  public.trigger_sos()
from public, anon, authenticated;
grant execute on function
  public.send_message(uuid, uuid, text, public.message_kind, smallint),
  public.trigger_sos()
to authenticated;
grant execute on function public.add_ai_flag(uuid, public.flag_severity) to service_role;
