-- Regather: invite redemption, onboarding, circle matching.
-- Every function here is SECURITY DEFINER, has a fixed search_path, does its own
-- permission checks, and is granted only to the roles that need it. Role, audience,
-- age band and partner come from the invite code and are never sent by the client.
-- Expected failures RETURN {ok:false,error:...} (so rate-limit counters persist);
-- permission violations RAISE.

create function private.circle_summary(p_circle uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'kind', c.kind,
    'member_count', (select count(*) from public.circle_members m where m.circle_id = c.id),
    'mentor_nickname', (select p.nickname from public.profiles p where p.id = c.mentor_id),
    'cohort_start', c.cohort_start
  )
  from public.circles c where c.id = p_circle;
$$;

-- ---------- service-role only: rate limit + invite redemption ----------

create function public.rl_hit(p_bucket text, p_max int, p_window_seconds int) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if p_bucket is null or char_length(p_bucket) > 120 or p_max < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate limit arguments';
  end if;
  return private.hit_rate_limit(p_bucket, p_max, p_window_seconds);
end;
$$;

create function public.invite_is_redeemable(p_code text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.invite_codes c
    where c.code_hash = private.hash_code(private.normalize_code(p_code))
      and c.revoked_at is null and c.expires_at > now() and c.uses < c.max_uses
  );
$$;

create function public.redeem_invite(p_user_id uuid, p_code text, p_nickname text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_inv public.invite_codes%rowtype;
  v_nick text := private.sanitize_text(p_nickname);
begin
  if p_user_id is null or not exists (select 1 from auth.users u where u.id = p_user_id) then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  if v_nick !~ '^[[:alnum:] ._-]{2,24}$' or v_nick ~ '@' or v_nick ~ '[0-9]{5,}' then
    return jsonb_build_object('ok', false, 'error', 'invalid_nickname');
  end if;

  select * into v_inv
  from public.invite_codes c
  where c.code_hash = private.hash_code(private.normalize_code(p_code))
    and c.revoked_at is null and c.expires_at > now() and c.uses < c.max_uses
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  update public.invite_codes set uses = uses + 1 where id = v_inv.id;

  insert into public.profiles (id, nickname, role, audience)
  values (
    p_user_id, v_nick, v_inv.role,
    case when v_inv.role = 'youth' then 'minor'::public.audience else 'adult'::public.audience end
  );

  insert into public.profile_details (user_id, partner_id, invite_id, age_band, trust_level)
  values (p_user_id, v_inv.partner_id, v_inv.id, v_inv.age_band,
          case when v_inv.role = 'mentor' then 3 else 0 end);

  return jsonb_build_object('ok', true, 'role', v_inv.role);
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'already_registered');
end;
$$;

revoke all on function
  public.rl_hit(text, int, int), public.invite_is_redeemable(text), public.redeem_invite(uuid, text, text)
from public, anon, authenticated;
grant execute on function
  public.rl_hit(text, int, int), public.invite_is_redeemable(text), public.redeem_invite(uuid, text, text)
to service_role;

-- ---------- onboarding ----------

create function public.complete_onboarding(
  p_tags public.situation_tag[],
  p_stage public.stage,
  p_child_age public.child_age_band,
  p_language text,
  p_times public.time_of_day[],
  p_city text,
  p_norms boolean
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_role public.app_role;
  v_rows int;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select p.role into v_role from public.profiles p where p.id = v_uid;
  if not found or v_role in ('partner', 'mentor') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_norms is not true then
    return jsonb_build_object('ok', false, 'error', 'norms_required');
  end if;

  update public.profile_details d set
    situation_tags = coalesce(array(select distinct t from unnest(p_tags) t), '{}'),
    stage = p_stage,
    child_age_band = case when v_role = 'parent' then p_child_age else null end,
    language = coalesce(p_language, 'en'),
    times_of_day = coalesce(array(select distinct t from unnest(p_times) t), '{}'),
    city = p_city,
    norms_accepted_at = now(),
    onboarded_at = now()
  where d.user_id = v_uid and d.onboarded_at is null;
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return jsonb_build_object('ok', false, 'error', 'already_onboarded');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- ---------- circle matching ----------
-- score = 3 x shared tags + 2 same stage + 1 same age band + 1 overlapping times.
-- The client never passes a circle id.

create function public.join_best_circle() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_role public.app_role;
  v_aud public.audience;
  d public.profile_details%rowtype;
  v_kind public.circle_kind;
  v_circle_id uuid;
  v_mentor uuid;
  v_n int;
  v_names text[] := array['Willow', 'Lily', 'Reed', 'Lotus', 'Pebble', 'Brook',
                          'Heron', 'Fern', 'Marsh', 'Moss', 'Cattail', 'Dragonfly'];
  v_name text;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select p.role, p.audience into v_role, v_aud from public.profiles p where p.id = v_uid;
  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_role in ('mentor', 'partner') then
    return jsonb_build_object('ok', false, 'error', 'not_applicable');
  end if;

  select * into d from public.profile_details x where x.user_id = v_uid;
  if d.onboarded_at is null then
    return jsonb_build_object('ok', false, 'error', 'onboarding_required');
  end if;

  -- already placed: idempotent
  select m.circle_id into v_circle_id from public.circle_members m where m.user_id = v_uid;
  if found then
    return jsonb_build_object('ok', true, 'circle', private.circle_summary(v_circle_id));
  end if;

  v_kind := case v_role
    when 'parent' then 'parent'::public.circle_kind
    when 'youth' then 'youth'::public.circle_kind
    else 'young_adult'::public.circle_kind
  end;

  -- serialize matching per partner+kind so two people can't overfill a circle
  perform pg_advisory_xact_lock(hashtextextended(d.partner_id::text || ':' || v_kind::text, 0));

  select c.id into v_circle_id
  from public.circles c
  where c.partner_id = d.partner_id
    and c.kind = v_kind
    and (select count(*) from public.circle_members m where m.circle_id = c.id) < c.max_members
  order by
    (3 * (select count(*) from unnest(c.tags) t where t = any (d.situation_tags))
     + case when d.stage is not null and c.stage = d.stage then 2 else 0 end
     + case when c.age_band = d.age_band then 1 else 0 end
     + case when c.times && d.times_of_day then 1 else 0 end) desc,
    (select count(*) from public.circle_members m where m.circle_id = c.id) desc,
    c.created_at asc
  limit 1;

  if v_circle_id is null then
    select count(*) into v_n from public.circles c where c.partner_id = d.partner_id;
    v_name := v_names[(v_n % cardinality(v_names)) + 1]
      || case when v_n >= cardinality(v_names)
              then ' ' || ((v_n / cardinality(v_names)) + 1)::text else '' end;

    select p.id into v_mentor
    from public.profiles p
    join public.profile_details md on md.user_id = p.id
    where p.role = 'mentor'
      and md.partner_id = d.partner_id
      and (v_kind <> 'youth' or md.age_band = '18_24')
    order by (select count(*) from public.circles x where x.mentor_id = p.id), p.created_at, p.id
    limit 1;

    insert into public.circles (partner_id, kind, audience, name, tags, stage, age_band, times, mentor_id)
    values (d.partner_id, v_kind, v_aud, v_name, d.situation_tags, d.stage, d.age_band, d.times_of_day, v_mentor)
    returning id into v_circle_id;
  end if;

  insert into public.circle_members (circle_id, user_id) values (v_circle_id, v_uid);

  return jsonb_build_object('ok', true, 'circle', private.circle_summary(v_circle_id));
end;
$$;

revoke all on function
  public.complete_onboarding(public.situation_tag[], public.stage, public.child_age_band, text, public.time_of_day[], text, boolean),
  public.join_best_circle()
from public, anon;
grant execute on function
  public.complete_onboarding(public.situation_tag[], public.stage, public.child_age_band, text, public.time_of_day[], text, boolean),
  public.join_best_circle()
to authenticated;
