-- Regather: private helper functions.
-- All are SECURITY DEFINER with a fixed, empty search_path (everything is schema-
-- qualified), so they cannot be hijacked and can read tables without recursing
-- through RLS. Only the few used inside RLS policies are executable by `authenticated`.

-- ---------- access helpers (used by RLS policies) ----------

create function private.is_partner_staff(p_partner uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.partner_staff s
    where s.partner_id = p_partner and s.user_id = (select auth.uid())
  );
$$;

create function private.is_moderator(p_partner uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.partner_staff s
    where s.partner_id = p_partner and s.user_id = (select auth.uid()) and s.is_moderator
  );
$$;

-- member of the circle, or its assigned mentor
create function private.can_access_circle(p_circle uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.circle_members m
    where m.circle_id = p_circle and m.user_id = (select auth.uid())
  ) or exists (
    select 1 from public.circles c
    where c.id = p_circle and c.mentor_id = (select auth.uid())
  );
$$;

-- participants only. Moderators read mentor threads through an audited function instead.
create function private.can_read_thread(p_thread uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.threads t
    where t.id = p_thread
      and (select auth.uid()) in (t.user_a, t.user_b)
  );
$$;

create function private.can_read_profile(p_profile uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select
    p_profile = (select auth.uid())
    or exists (
      select 1 from public.circle_members a
      join public.circle_members b on b.circle_id = a.circle_id
      where a.user_id = (select auth.uid()) and b.user_id = p_profile
    )
    or exists (
      select 1 from public.circles c
      join public.circle_members m on m.circle_id = c.id
      where (c.mentor_id = p_profile and m.user_id = (select auth.uid()))
         or (c.mentor_id = (select auth.uid()) and m.user_id = p_profile)
    )
    or exists (
      select 1 from public.threads t
      where (t.user_a = (select auth.uid()) and t.user_b = p_profile)
         or (t.user_b = (select auth.uid()) and t.user_a = p_profile)
    )
    or exists (
      select 1 from public.connections x
      where (x.requester_id = (select auth.uid()) and x.addressee_id = p_profile)
         or (x.addressee_id = (select auth.uid()) and x.requester_id = p_profile)
    )
    or exists (
      select 1 from public.partner_staff s
      join public.profile_details d on d.partner_id = s.partner_id
      where s.user_id = (select auth.uid()) and d.user_id = p_profile
    );
$$;

-- Realtime channel authorization. Topics are strictly validated BEFORE casting.
create function private.topic_allowed(p_topic text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when p_topic ~ '^circle:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then private.can_access_circle(substr(p_topic, 8)::uuid)
    when p_topic ~ '^thread:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then private.can_read_thread(substr(p_topic, 8)::uuid)
    when p_topic ~ '^partner:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then private.is_moderator(substr(p_topic, 9)::uuid)
    else false
  end;
$$;

revoke all on function
  private.is_partner_staff(uuid), private.is_moderator(uuid), private.can_access_circle(uuid),
  private.can_read_thread(uuid), private.can_read_profile(uuid), private.topic_allowed(text)
from public, anon;
grant execute on function
  private.is_partner_staff(uuid), private.is_moderator(uuid), private.can_access_circle(uuid),
  private.can_read_thread(uuid), private.can_read_profile(uuid), private.topic_allowed(text)
to authenticated;

-- ---------- text safety (used only by other definer functions) ----------

-- Strip control characters, zero-width characters and bidi overrides, then trim.
create function private.sanitize_text(p_text text) returns text
language sql immutable set search_path = '' as $$
  select btrim(regexp_replace(
    coalesce(p_text, ''),
    '[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁠-⁩﻿]',
    '', 'g'));
$$;

-- Hide emails, phone numbers, links, street addresses and postal codes.
create function private.redact_pii(p_text text) returns text
language plpgsql immutable set search_path = '' as $$
declare v text := p_text;
begin
  v := regexp_replace(v, '[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}', '[hidden]', 'g');
  v := regexp_replace(v, '(https?://|www\.)\S+', '[hidden]', 'gi');
  v := regexp_replace(v, '\(?\+?\d[\d\s().\-]{6,}\d', '[hidden]', 'g');
  v := regexp_replace(
    v,
    '\m\d{1,6}\s+([[:alpha:]]+\s+){0,3}(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|lane|ln|way|court|ct|crescent|cres|place|pl|trail|tr)\M\.?',
    '[hidden]', 'gi');
  v := regexp_replace(v, '\m[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d\M', '[hidden]', 'g');
  return v;
end;
$$;

create function private.crisis_check(p_text text) returns public.flag_severity
language plpgsql stable security definer set search_path = '' as $$
declare
  v text;
  v_sev public.flag_severity;
begin
  v := lower(translate(coalesce(p_text, ''), '’‘', ''''''));
  v := regexp_replace(v, '[\s_]+', ' ', 'g');
  select k.severity into v_sev
  from private.crisis_keywords k
  where position(k.term in v) > 0
  order by (k.severity = 'high') desc
  limit 1;
  return v_sev;
end;
$$;

-- Fixed-window rate limiter. Returns true if the call is allowed.
create function private.hit_rate_limit(p_bucket text, p_max int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_window timestamptz :=
    to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits int;
begin
  insert into private.rate_limits as r (bucket, window_start, hits)
  values (p_bucket, v_window, 1)
  on conflict (bucket, window_start) do update set hits = r.hits + 1
  returning r.hits into v_hits;

  -- opportunistic cleanup of old windows
  if random() < 0.02 then
    delete from private.rate_limits where window_start < now() - interval '2 days';
  end if;

  return v_hits <= p_max;
end;
$$;

-- Accept RGTH-XXXX-XXXX-XXXX-XXXX in any case/spacing; forgive O/I/L typos.
create function private.normalize_code(p_code text) returns text
language plpgsql immutable set search_path = '' as $$
declare v text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if left(v, 4) = 'RGTH' and length(v) = 20 then
    v := substr(v, 5);
  end if;
  return translate(v, 'OIL', '011');
end;
$$;

create function private.hash_code(p_normalized text) returns bytea
language sql immutable set search_path = '' as $$
  select extensions.digest(p_normalized, 'sha256');
$$;

-- crisis keywords (server-side only; never shipped to the browser)
insert into private.crisis_keywords (term, severity) values
  ('kill myself', 'high'),
  ('killing myself', 'high'),
  ('end my life', 'high'),
  ('ending my life', 'high'),
  ('take my own life', 'high'),
  ('suicide', 'high'),
  ('suicidal', 'high'),
  ('want to die', 'high'),
  ('wanna die', 'high'),
  ('wish i was dead', 'high'),
  ('wish i were dead', 'high'),
  ('better off dead', 'high'),
  ('end it all', 'high'),
  ('no reason to live', 'high'),
  ('dont want to be alive', 'high'),
  ('don''t want to be alive', 'high'),
  ('dont want to live', 'high'),
  ('don''t want to live', 'high'),
  ('overdose', 'high'),
  ('hurt myself', 'medium'),
  ('hurting myself', 'medium'),
  ('self harm', 'medium'),
  ('self-harm', 'medium'),
  ('cut myself', 'medium'),
  ('cutting myself', 'medium'),
  ('can''t go on', 'medium'),
  ('cant go on', 'medium')
on conflict (term) do nothing;
