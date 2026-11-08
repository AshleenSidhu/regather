-- Regather: grants + RLS policies. Deny by default: every table already has RLS on and
-- no privileges (migration 2). Below we grant back only what each table needs, and
-- every table gets at least one policy. Writes happen only through SECURITY DEFINER
-- functions (migrations 5-8), never directly from the client.

-- ---------- partners & staff ----------
grant select on public.partners to authenticated;
create policy partners_select_staff on public.partners
  for select to authenticated
  using (private.is_partner_staff(id));

grant select on public.partner_staff to authenticated;
create policy partner_staff_select_self on public.partner_staff
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------- invite codes (hash is never selectable) ----------
grant select (id, partner_id, role, age_band, label, max_uses, uses, expires_at, revoked_at, created_by, created_at)
  on public.invite_codes to authenticated;
create policy invite_codes_select_staff on public.invite_codes
  for select to authenticated
  using (private.is_partner_staff(partner_id));

-- ---------- profiles ----------
grant select on public.profiles to authenticated;
create policy profiles_select_visible on public.profiles
  for select to authenticated
  using (private.can_read_profile(id));

-- Only nickname and sticker are user-editable. Role/audience can never be changed here.
grant update (nickname, sticker) on public.profiles to authenticated;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------- profile details (self only, read-only from the client) ----------
grant select on public.profile_details to authenticated;
create policy profile_details_select_self on public.profile_details
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------- circles ----------
grant select on public.circles to authenticated;
create policy circles_select_member_or_staff on public.circles
  for select to authenticated
  using (private.can_access_circle(id) or private.is_partner_staff(partner_id));

grant select on public.circle_members to authenticated;
create policy circle_members_select_same_circle on public.circle_members
  for select to authenticated
  using (private.can_access_circle(circle_id));

-- ---------- threads & messages ----------
grant select on public.threads to authenticated;
create policy threads_select_participant on public.threads
  for select to authenticated
  using (private.can_read_thread(id));

grant select on public.messages to authenticated;
create policy messages_select_allowed on public.messages
  for select to authenticated
  using (
    (circle_id is not null and private.can_access_circle(circle_id))
    or (thread_id is not null and private.can_read_thread(thread_id))
  );

-- ---------- requests & connections ----------
grant select on public.mentor_requests to authenticated;
create policy mentor_requests_select_parties on public.mentor_requests
  for select to authenticated
  using (requester_id = (select auth.uid()) or mentor_id = (select auth.uid()));

grant select on public.connections to authenticated;
create policy connections_select_parties on public.connections
  for select to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));

-- ---------- comfort notes ----------
grant select on public.comfort_notes to authenticated;
create policy comfort_notes_select_parties on public.comfort_notes
  for select to authenticated
  using (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()));

grant update (saved_to_jar) on public.comfort_notes to authenticated;
create policy comfort_notes_update_recipient on public.comfort_notes
  for update to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

-- ---------- flags & audit log: moderators of the partner only ----------
grant select on public.flags to authenticated;
create policy flags_select_moderators on public.flags
  for select to authenticated
  using (private.is_moderator(partner_id));

grant select on public.audit_log to authenticated;
create policy audit_log_select_moderators on public.audit_log
  for select to authenticated
  using (private.is_moderator(partner_id));

-- ---------- internal tables: policy exists, but nobody but definer functions can reach them ----------
create policy crisis_keywords_deny_all on private.crisis_keywords for all to authenticated using (false);
create policy rate_limits_deny_all on private.rate_limits for all to authenticated using (false);

-- ---------- mentors must be real mentors (and young adults for youth circles) ----------
create function private.check_circle_mentor() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_role public.app_role;
  v_band public.age_band;
  v_partner uuid;
begin
  if new.mentor_id is null then
    return new;
  end if;
  select p.role, d.age_band, d.partner_id into v_role, v_band, v_partner
  from public.profiles p
  join public.profile_details d on d.user_id = p.id
  where p.id = new.mentor_id;
  if v_role is distinct from 'mentor' then
    raise exception 'circle mentor must have the mentor role';
  end if;
  if v_partner is distinct from new.partner_id then
    raise exception 'circle mentor must belong to the same partner';
  end if;
  if new.kind = 'youth' and v_band is distinct from '18_24' then
    raise exception 'youth circle mentors must be young adults (18-24)';
  end if;
  return new;
end;
$$;

create trigger circles_check_mentor
  before insert or update of mentor_id on public.circles
  for each row execute function private.check_circle_mentor();

-- ---------- views (security_invoker, so the underlying RLS still applies) ----------
create view public.partner_codes with (security_invoker = true) as
  select id, partner_id, role, age_band, label, max_uses, uses, expires_at, revoked_at, created_at
  from public.invite_codes;

create view public.partner_flag_queue with (security_invoker = true) as
  select f.id, f.partner_id, f.created_at, f.severity, f.source, f.context, f.status,
         f.snapshot, f.review_note, f.reviewed_at, p.nickname as sender_nickname
  from public.flags f
  left join public.profiles p on p.id = f.sender_id;

revoke all on public.partner_codes, public.partner_flag_queue from public, anon, authenticated;
grant select on public.partner_codes, public.partner_flag_queue to authenticated;

-- ---------- service role (server-only key) ----------
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
revoke all on all sequences in schema public from public, anon, authenticated;
