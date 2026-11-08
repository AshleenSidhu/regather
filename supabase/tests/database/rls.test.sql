-- Regather security tests (pgTAP). Run with: npx supabase test db
-- Signs in as different fake people and confirms access is blocked where it must be.
-- Fixtures: partners A and B; moderators mA, mB; parents p1,p2 (A, circle P), p3 (B, circle P3);
-- youth y1,y2 (A, circle Y); mentors mentP (circle P), mentY (circle Y, young adult).

begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- ---------- helpers ----------
create schema tests;
grant usage on schema tests to anon, authenticated, service_role;

create function tests.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
grant execute on function tests.act_as(uuid) to anon, authenticated, service_role;

create function tests.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('role', 'anon', true);
end $$;
grant execute on function tests.as_anon() to anon, authenticated, service_role;

create temp table ctx (k text primary key, v text);
grant all on ctx to public;

-- ---------- fixtures (as postgres) ----------
insert into public.partners (id, name, kind) values
  ('10000000-0000-0000-0000-000000000001', 'Test ER Program A', 'er'),
  ('10000000-0000-0000-0000-000000000002', 'Test Clinic B', 'clinic');

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'ma@example.test'),
  ('a0000000-0000-0000-0000-000000000002', 'mb@example.test'),
  ('a0000000-0000-0000-0000-000000000011', 'p1@example.test'),
  ('a0000000-0000-0000-0000-000000000012', 'p2@example.test'),
  ('a0000000-0000-0000-0000-000000000013', 'p3@example.test'),
  ('a0000000-0000-0000-0000-000000000021', 'y1@example.test'),
  ('a0000000-0000-0000-0000-000000000022', 'y2@example.test'),
  ('a0000000-0000-0000-0000-000000000031', 'mentp@example.test'),
  ('a0000000-0000-0000-0000-000000000032', 'menty@example.test'),
  ('a0000000-0000-0000-0000-000000000041', 'n1@example.test'),
  ('a0000000-0000-0000-0000-000000000042', 'n2@example.test'),
  ('a0000000-0000-0000-0000-000000000043', 'n3@example.test'),
  ('a0000000-0000-0000-0000-000000000044', 'n4@example.test');

insert into public.partner_staff (user_id, partner_id) values
  ('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002');

insert into public.profiles (id, nickname, role, audience) values
  ('a0000000-0000-0000-0000-000000000011', 'Sam', 'parent', 'adult'),
  ('a0000000-0000-0000-0000-000000000012', 'Robin', 'parent', 'adult'),
  ('a0000000-0000-0000-0000-000000000013', 'Casey', 'parent', 'adult'),
  ('a0000000-0000-0000-0000-000000000021', 'Pip', 'youth', 'minor'),
  ('a0000000-0000-0000-0000-000000000022', 'Wren', 'youth', 'minor'),
  ('a0000000-0000-0000-0000-000000000031', 'Dana', 'mentor', 'adult'),
  ('a0000000-0000-0000-0000-000000000032', 'Jules', 'mentor', 'adult');

insert into public.profile_details (user_id, partner_id, age_band, trust_level, onboarded_at, situation_tags, stage, times_of_day) values
  ('a0000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', '25_plus', 0, now(), '{anxiety}', 'newly_diagnosed', '{night}'),
  ('a0000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000001', '25_plus', 0, now(), '{anxiety}', 'newly_diagnosed', '{night}'),
  ('a0000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000002', '25_plus', 0, now(), '{anxiety}', 'newly_diagnosed', '{night}'),
  ('a0000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000001', '13_15', 0, now(), '{anxiety}', 'newly_diagnosed', '{night}'),
  ('a0000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000001', '13_15', 0, now(), '{anxiety}', 'newly_diagnosed', '{night}'),
  ('a0000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000001', '25_plus', 3, now(), '{}', null, '{}'),
  ('a0000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000001', '18_24', 3, now(), '{}', null, '{}');

insert into public.circles (id, partner_id, kind, audience, name, tags, stage, age_band, times, mentor_id) values
  ('c0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'parent', 'adult', 'Willow', '{anxiety}', 'newly_diagnosed', '25_plus', '{night}', 'a0000000-0000-0000-0000-000000000031'),
  ('c0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'youth', 'minor', 'Lily', '{anxiety}', 'newly_diagnosed', '13_15', '{night}', 'a0000000-0000-0000-0000-000000000032'),
  ('c0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'parent', 'adult', 'Reed', '{anxiety}', 'newly_diagnosed', '25_plus', '{night}', null);

insert into public.circle_members (circle_id, user_id) values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000011'),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000012'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000021'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000022'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000013');

insert into public.messages (circle_id, sender_id, body) values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000011', 'hello parents'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000021', 'hello youth');

-- =====================================================================
-- 1. Anonymous / leaked publishable key: nothing is reachable
-- =====================================================================
select tests.as_anon();
select throws_ok($$select count(*) from public.profiles$$, '42501', null, 'anon cannot read profiles');
select throws_ok($$select count(*) from public.profile_details$$, '42501', null, 'anon cannot read profile_details');
select throws_ok($$select count(*) from public.messages$$, '42501', null, 'anon cannot read messages');
select throws_ok($$select count(*) from public.circles$$, '42501', null, 'anon cannot read circles');
select throws_ok($$select count(*) from public.circle_members$$, '42501', null, 'anon cannot read circle_members');
select throws_ok($$select count(*) from public.threads$$, '42501', null, 'anon cannot read threads');
select throws_ok($$select count(*) from public.flags$$, '42501', null, 'anon cannot read flags');
select throws_ok($$select count(*) from public.invite_codes$$, '42501', null, 'anon cannot read invite_codes');
select throws_ok($$select count(*) from public.audit_log$$, '42501', null, 'anon cannot read audit_log');
select throws_ok($$select count(*) from public.comfort_notes$$, '42501', null, 'anon cannot read comfort_notes');
select throws_ok($$select count(*) from public.connections$$, '42501', null, 'anon cannot read connections');
select throws_ok($$select count(*) from public.mentor_requests$$, '42501', null, 'anon cannot read mentor_requests');
select throws_ok($$select count(*) from public.partners$$, '42501', null, 'anon cannot read partners');
select throws_ok($$select count(*) from public.partner_staff$$, '42501', null, 'anon cannot read partner_staff');
select throws_ok($$select count(*) from public.partner_flag_queue$$, '42501', null, 'anon cannot read flag queue view');
select throws_ok($$select count(*) from public.partner_codes$$, '42501', null, 'anon cannot read codes view');
select throws_ok($$select public.send_message('c0000000-0000-0000-0000-000000000001', null, 'hi')$$, '42501', null, 'anon cannot send messages');
select throws_ok($$select public.join_best_circle()$$, '42501', null, 'anon cannot join circles');
select throws_ok($$select public.create_invite_code('youth', '13_15', 1, 7, 'x')$$, '42501', null, 'anon cannot create codes');
select throws_ok($$select public.redeem_invite('a0000000-0000-0000-0000-000000000041', 'x', 'Nope')$$, '42501', null, 'anon cannot redeem invites');
reset role;

-- =====================================================================
-- 2. Profiles: role/age/trust/partner cannot be changed by the user
-- =====================================================================
select tests.act_as('a0000000-0000-0000-0000-000000000011'); -- p1
select is((select count(*)::int from public.profiles), 3, 'p1 sees only own circle (p1, p2, mentor)');
select is_empty($$select 1 from public.profiles where id = 'a0000000-0000-0000-0000-000000000021'$$, 'parent cannot read a youth profile');
select is_empty($$select 1 from public.profiles where id = 'a0000000-0000-0000-0000-000000000013'$$, 'parent cannot read another partner''s parent');
select is_empty($$select 1 from public.profile_details where user_id = 'a0000000-0000-0000-0000-000000000012'$$, 'p1 cannot read p2 details');
select is((select count(*)::int from public.profile_details), 1, 'p1 reads only own details');
select throws_ok($$update public.profiles set role = 'mentor' where id = 'a0000000-0000-0000-0000-000000000011'$$, '42501', null, 'cannot change own role');
select throws_ok($$update public.profiles set audience = 'minor' where id = 'a0000000-0000-0000-0000-000000000011'$$, '42501', null, 'cannot change own audience');
select throws_ok($$update public.profile_details set trust_level = 3 where user_id = 'a0000000-0000-0000-0000-000000000011'$$, '42501', null, 'cannot raise own trust level');
select throws_ok($$update public.profile_details set age_band = '13_15' where user_id = 'a0000000-0000-0000-0000-000000000011'$$, '42501', null, 'cannot change own age band');
select throws_ok($$update public.profile_details set partner_id = '10000000-0000-0000-0000-000000000002' where user_id = 'a0000000-0000-0000-0000-000000000011'$$, '42501', null, 'cannot change own partner');
select throws_ok($$insert into public.profiles (id, nickname, role, audience) values (gen_random_uuid(), 'Fake', 'mentor', 'adult')$$, '42501', null, 'cannot insert profiles');
select lives_ok($$update public.profiles set nickname = 'Sam B' where id = 'a0000000-0000-0000-0000-000000000011'$$, 'can change own nickname');
select throws_ok($$update public.profiles set nickname = 'me@mail.com' where id = 'a0000000-0000-0000-0000-000000000011'$$, '23514', null, 'nickname cannot be an email');
update public.profiles set nickname = 'Hijack' where id = 'a0000000-0000-0000-0000-000000000012';
reset role;
select is((select nickname from public.profiles where id = 'a0000000-0000-0000-0000-000000000012'), 'Robin', 'updating someone else''s profile changes nothing');

select tests.act_as('a0000000-0000-0000-0000-000000000021'); -- y1
select is((select count(*)::int from public.profiles), 3, 'y1 sees only youth circle (y1, y2, young-adult mentor)');
reset role;

-- =====================================================================
-- 3. Circles & messages: members only; no direct writes
-- =====================================================================
select tests.act_as('a0000000-0000-0000-0000-000000000011'); -- p1
select is((select count(*)::int from public.circles), 1, 'p1 sees only circle P');
select is_empty($$select 1 from public.messages where circle_id = 'c0000000-0000-0000-0000-000000000002'$$, 'parent cannot read youth circle messages');
select is_empty($$select 1 from public.circle_members where circle_id = 'c0000000-0000-0000-0000-000000000002'$$, 'parent cannot list youth circle members');
select throws_ok($$insert into public.messages (circle_id, sender_id, body) values ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000011', 'direct')$$, '42501', null, 'no direct message inserts');
select throws_ok($$update public.messages set body = 'edited'$$, '42501', null, 'no direct message updates');
select throws_ok($$delete from public.messages$$, '42501', null, 'no direct message deletes');
select throws_ok($$insert into public.circle_members (circle_id, user_id) values ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000011')$$, '42501', null, 'cannot add self to any circle directly');
select throws_ok($$select public.send_message('c0000000-0000-0000-0000-000000000002', null, 'let me in')$$, '42501', null, 'parent cannot message a youth circle');
select throws_ok($$select public.send_message(null, null, 'nowhere')$$, '22023', null, 'message needs exactly one target');
select is((select public.send_message('c0000000-0000-0000-0000-000000000001', null, 'hi everyone')->>'ok'), 'true', 'member can send to own circle');
select is((select count(*)::int from public.messages), 2, 'p1 sees circle P messages');
select is((select (public.send_message('c0000000-0000-0000-0000-000000000001', null, 'call me on 403-555-0199 or sam@mail.com')->>'redacted')), 'true', 'phone and email are redacted for low-trust users');
select is((select count(*)::int from public.messages where body like '%555%' or body like '%@%'), 0, 'no phone number or email was stored');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000013'); -- p3 (other partner)
select is_empty($$select 1 from public.messages where circle_id = 'c0000000-0000-0000-0000-000000000001'$$, 'other partner''s parent cannot read circle P');
select throws_ok($$select public.send_message('c0000000-0000-0000-0000-000000000001', null, 'intruder')$$, '42501', null, 'non-member cannot post to circle P');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000032'); -- mentY
select is((select count(*)::int from public.messages where circle_id = 'c0000000-0000-0000-0000-000000000002'), 1, 'mentor can read own youth circle');
select is_empty($$select 1 from public.messages where circle_id = 'c0000000-0000-0000-0000-000000000001'$$, 'mentor cannot read circles they do not mentor');
reset role;

-- rate limiting: 10 per 30s
select tests.act_as('a0000000-0000-0000-0000-000000000012'); -- p2
select is(
  (select count(*)::int from (
     select public.send_message('c0000000-0000-0000-0000-000000000001', null, 'spam ' || g) r from generate_series(1, 12) g
   ) s where r->>'ok' = 'true'),
  10, 'message rate limit allows 10 per window');
select is(
  (select count(*)::int from (
     select public.send_message('c0000000-0000-0000-0000-000000000001', null, 'more') r
   ) s where r->>'error' = 'rate_limited'),
  1, 'message beyond the limit is rejected');
reset role;

-- =====================================================================
-- 4. Crisis flags: created server-side, never readable by regular users
-- =====================================================================
select tests.act_as('a0000000-0000-0000-0000-000000000021'); -- y1
select is((select public.send_message('c0000000-0000-0000-0000-000000000002', null, 'i just want to die')->>'crisis'), 'true', 'crisis keyword returns crisis=true to the sender');
select is((select count(*)::int from public.messages where body like '%want to die%'), 1, 'flagged message is NOT deleted');
select is((select count(*)::int from public.flags), 0, 'sender cannot read flags');
select is((select public.trigger_sos()->>'ok'), 'true', 'SOS button works');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000022'); -- y2
select is((select count(*)::int from public.flags), 0, 'other youth cannot read flags');
select is((select count(*)::int from public.partner_flag_queue), 0, 'regular users see nothing in the flag queue view');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000001'); -- mA
select cmp_ok((select count(*)::int from public.flags), '>=', 2, 'moderator A sees flags (keyword + SOS)');
insert into ctx select 'flagid', id::text from public.flags order by created_at limit 1;
select is((select count(*)::int from public.partner_flag_queue), (select count(*)::int from public.flags), 'flag queue view matches (security_invoker)');
select throws_ok($$update public.flags set status = 'resolved'$$, '42501', null, 'moderator cannot update flags directly');
select is((select public.review_flag((select v from ctx where k = 'flagid')::uuid, 'resolved', 'checked in with family')->>'ok'), 'true', 'moderator can review a flag via function');
select cmp_ok((select count(*)::int from public.audit_log where action like 'review_flag:%'), '>=', 1, 'review was audited');
select throws_ok($$insert into public.audit_log (partner_id, action) values ('10000000-0000-0000-0000-000000000001', 'forged')$$, '42501', null, 'audit log cannot be written directly');
select throws_ok($$delete from public.audit_log$$, '42501', null, 'audit log cannot be deleted');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000002'); -- mB
select is((select count(*)::int from public.flags), 0, 'moderator B cannot see partner A flags');
select is((select count(*)::int from public.partner_flag_queue), 0, 'moderator B cannot see A flags via view');
select is((select count(*)::int from public.audit_log), 0, 'moderator B cannot see A audit log');
select throws_ok(
  format($$select public.review_flag(%L, 'resolved', 'x')$$, (select v from ctx where k = 'flagid')),
  '42501', null, 'moderator B cannot review A flags');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000011'); -- p1
select is((select count(*)::int from public.flags), 0, 'parents cannot read flags');
select is((select count(*)::int from public.audit_log), 0, 'parents cannot read audit log');
reset role;

-- =====================================================================
-- 5. Private chats: both sides accept, same role and audience only
-- =====================================================================
select tests.act_as('a0000000-0000-0000-0000-000000000011'); -- p1
select throws_ok($$select public.request_connection('a0000000-0000-0000-0000-000000000021')$$, '42501', null, 'adult cannot connect to a minor');
select throws_ok($$select public.request_connection('a0000000-0000-0000-0000-000000000013')$$, '42501', null, 'cannot connect to someone outside your circle');
select throws_ok($$select public.request_connection('a0000000-0000-0000-0000-000000000031')$$, '42501', null, 'cannot connect to a mentor');
select is((select public.request_connection('a0000000-0000-0000-0000-000000000012')->>'status'), 'requested', 'parent can request a parent in the same circle');
select is((select count(*)::int from public.threads), 0, 'no thread until the other side accepts');
select throws_ok($$insert into public.connections (requester_id, addressee_id, status) values ('a0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000021', 'accepted')$$, '42501', null, 'connections cannot be inserted directly');
insert into ctx select 'conn', c.id::text from public.connections c limit 1;
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000021'); -- y1 (not a party)
select throws_ok(format($$select public.respond_connection(%L, true)$$, (select v from ctx where k = 'conn')), '42501', null, 'third party cannot accept a connection');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000011'); -- p1 (requester)
select throws_ok(format($$select public.respond_connection(%L, true)$$, (select v from ctx where k = 'conn')), '42501', null, 'requester cannot accept their own request');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000012'); -- p2 accepts
insert into ctx select 'thread', (public.respond_connection((select v from ctx where k = 'conn')::uuid, true)->>'thread_id');
select isnt((select v from ctx where k = 'thread'), null::text, 'accepting creates a private thread');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000011'); -- p1
select is((select public.send_message(null, (select v from ctx where k = 'thread')::uuid, 'just us')->>'ok'), 'true', 'participant can message the private thread');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000013'); -- p3
select is((select count(*)::int from public.threads), 0, 'outsider cannot see the private thread');
select is_empty($$select 1 from public.messages where body = 'just us'$$, 'outsider cannot read private messages');
select throws_ok(format($$select public.send_message(null, %L, 'hi')$$, (select v from ctx where k = 'thread')), '42501', null, 'outsider cannot post to the private thread');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000001'); -- mA
select is((select count(*)::int from public.threads), 0, 'moderators cannot read private threads');
select is_empty($$select 1 from public.messages where body = 'just us'$$, 'partners cannot read private chats (unless flagged)');
reset role;

-- =====================================================================
-- 6. Mentor requests and moderated threads
-- =====================================================================
select tests.act_as('a0000000-0000-0000-0000-000000000022'); -- y2
select is((select public.request_mentor()->>'ok'), 'true', 'member can ask their mentor for a 1:1');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000021'); -- y1
select is((select count(*)::int from public.mentor_requests), 0, 'other youth cannot see the mentor request');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000031'); -- mentP (wrong mentor)
select is((select count(*)::int from public.mentor_requests), 0, 'other circle''s mentor cannot see the request');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000032'); -- mentY
select is((select count(*)::int from public.mentor_requests), 1, 'the circle mentor sees the request');
insert into ctx select 'mthread', (public.respond_mentor_request((select id from public.mentor_requests limit 1), true)->>'thread_id');
select isnt((select v from ctx where k = 'mthread'), null::text, 'accepting creates a mentor thread');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000022'); -- y2
select is((select public.send_message(null, (select v from ctx where k = 'mthread')::uuid, 'hi Jules')->>'ok'), 'true', 'youth can message the mentor thread');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000001'); -- mA
select is((select count(*)::int from public.threads), 0, 'moderators have no direct table access to mentor threads');
select is((select jsonb_array_length(public.moderator_read_thread((select v from ctx where k = 'mthread')::uuid)->'messages')), 1, 'moderator reads the mentor thread via the audited function');
select cmp_ok((select count(*)::int from public.audit_log where action = 'view_mentor_thread'), '>=', 1, 'viewing a mentor thread is audited');
select throws_ok(format($$select public.moderator_read_thread(%L)$$, (select v from ctx where k = 'thread')), '42501', null, 'moderators cannot read private (non-mentor) threads');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000002'); -- mB
select throws_ok(format($$select public.moderator_read_thread(%L)$$, (select v from ctx where k = 'mthread')), '42501', null, 'other partner''s moderator cannot read the mentor thread');
reset role;

-- =====================================================================
-- 7. Candy-gram notes
-- =====================================================================
select tests.act_as('a0000000-0000-0000-0000-000000000011'); -- p1
select throws_ok($$select public.send_note('a0000000-0000-0000-0000-000000000021', 'shell', 'blush', 'hello')$$, '42501', null, 'adult cannot send a note to a minor');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000032'); -- mentY
select throws_ok($$select public.send_note('a0000000-0000-0000-0000-000000000021', 'shell', 'blush', 'hello')$$, '42501', null, 'mentor cannot send a note to a minor');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000021'); -- y1
select is((select public.send_note('a0000000-0000-0000-0000-000000000022', 'axolotl', 'lilac', '<img src=x onerror=alert(1)>')->>'ok'), 'true', 'youth can send a note to a youth in their circle');
select is((select public.send_note('a0000000-0000-0000-0000-000000000022', 'lily', 'mint', 'hi' || chr(8238) || 'there' || chr(8203))->>'ok'), 'true', 'note with invisible characters is accepted');
select is((select public.send_note('a0000000-0000-0000-0000-000000000022', 'shell', 'peach', 'i want to die')->>'crisis'), 'true', 'crisis check also runs on notes');
select throws_ok($$select public.send_note('a0000000-0000-0000-0000-000000000013', 'shell', 'peach', 'hello')$$, '42501', null, 'cannot send a note outside your circle/connections');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000022'); -- y2
select is((select count(*)::int from public.comfort_notes), 3, 'recipient sees their notes');
select is((select body from public.comfort_notes where body like '<img%'), '<img src=x onerror=alert(1)>', 'note HTML is stored as inert text (UI renders text only)');
select is((select count(*)::int from public.comfort_notes where body = 'hithere'), 1, 'bidi and zero-width characters are stripped');
select lives_ok($$update public.comfort_notes set saved_to_jar = true where body = 'hithere'$$, 'recipient can save to jar');
select throws_ok($$update public.comfort_notes set body = 'rewritten'$$, '42501', null, 'note body cannot be edited');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000011'); -- p1
select is((select count(*)::int from public.comfort_notes), 0, 'third parties cannot read notes');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000001'); -- mA
select cmp_ok((select count(*)::int from public.flags where context = 'note'), '>=', 1, 'flagged note reaches the moderator');
reset role;

-- =====================================================================
-- 8. Partner isolation and invite codes
-- =====================================================================
select tests.act_as('a0000000-0000-0000-0000-000000000001'); -- mA
insert into ctx select 'code', public.create_invite_code('youth', '13_15', 1, 7, 'demo')->>'code';
insert into ctx select 'code2', public.create_invite_code('parent', '25_plus', 2, 7, 'demo2')->>'code';
insert into ctx select 'codeid', id::text from public.invite_codes limit 1;
select matches((select v from ctx where k = 'code'), '^RGTH-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$', 'code has the long random format');
select is((select count(*)::int from public.invite_codes), 2, 'partner A sees its own codes');
select throws_ok($$select code_hash from public.invite_codes$$, '42501', null, 'code hashes are never selectable');
select is((select count(*)::int from public.partner_codes), 2, 'codes view works for partner A');
select is((select (public.create_invite_code('partner', '25_plus', 1, 7, 'x')->>'ok')), 'false', 'cannot mint codes for the partner role');
select is((select (public.create_invite_code('youth', '25_plus', 1, 7, 'x')->>'ok')), 'false', 'role and age band must match');
select is((select (public.create_invite_code('youth', '13_15', 99, 7, 'x')->>'ok')), 'false', 'max uses is capped');
select is((select (public.create_invite_code('youth', '13_15', 1, 90, 'x')->>'ok')), 'false', 'expiry is capped at 30 days');
select is((select count(*)::int from public.partner_circle_activity()), 2, 'activity shows A''s circles');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000002'); -- mB
select is((select count(*)::int from public.invite_codes), 0, 'partner B cannot see A''s codes');
select is((select count(*)::int from public.partner_codes), 0, 'partner B cannot see A''s codes via view');
select throws_ok(
  format($$select public.revoke_invite_code(%L)$$, (select v from ctx where k = 'codeid')),
  '42501', null, 'partner B cannot revoke partner A''s code');
select is((select count(*)::int from public.partner_circle_activity()), 1, 'activity shows only B''s circle');
select is((select count(*)::int from public.circles), 1, 'partner B sees only its circle');
select is((select count(*)::int from public.profiles), 1, 'partner B sees only its own members');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000011'); -- p1
select throws_ok($$select public.create_invite_code('youth', '13_15', 1, 7, 'x')$$, '42501', null, 'non-staff cannot create codes');
select is((select count(*)::int from public.partner_circle_activity()), 0, 'non-staff get no circle activity');
select is((select count(*)::int from public.invite_codes), 0, 'non-staff see no codes');
reset role;

-- =====================================================================
-- 9. Invite redemption (service role only), brute-force resistance
-- =====================================================================
set local role service_role;
select is((select public.invite_is_redeemable((select v from ctx where k = 'code'))), true, 'fresh code is redeemable');
select is((select public.invite_is_redeemable('RGTH-AAAA-BBBB-CCCC-DDDD')), false, 'random code is not redeemable');
select is((select public.redeem_invite('a0000000-0000-0000-0000-000000000041', 'RGTH-AAAA-BBBB-CCCC-DDDD', 'Newbie')->>'error'), 'invalid_code', 'wrong code is rejected');
select is((select public.redeem_invite('a0000000-0000-0000-0000-000000000041', (select v from ctx where k = 'code'), 'a@b.co')->>'error'), 'invalid_nickname', 'email-like nickname is rejected');
select is((select public.redeem_invite('a0000000-0000-0000-0000-000000000041', (select v from ctx where k = 'code'), 'Newbie')->>'ok'), 'true', 'valid code redeems');
select is((select public.redeem_invite('a0000000-0000-0000-0000-000000000042', (select v from ctx where k = 'code'), 'Second')->>'error'), 'invalid_code', 'single-use code cannot be reused');
select is((select count(*)::int from (select public.rl_hit('test:brute', 5, 600) r from generate_series(1, 6)) s where r = false), 1, 'rate limiter blocks the 6th attempt');
reset role;

select is((select role::text from public.profiles where id = 'a0000000-0000-0000-0000-000000000041'), 'youth', 'role comes from the code');
select is((select audience::text from public.profiles where id = 'a0000000-0000-0000-0000-000000000041'), 'minor', 'audience comes from the code');
select is((select age_band::text from public.profile_details where user_id = 'a0000000-0000-0000-0000-000000000041'), '13_15', 'age band comes from the code');
select is((select partner_id from public.profile_details where user_id = 'a0000000-0000-0000-0000-000000000041'), '10000000-0000-0000-0000-000000000001'::uuid, 'partner comes from the code');
select is((select octet_length(code_hash) from public.invite_codes order by created_at limit 1), 32, 'only a sha256 hash is stored');

-- expired and revoked codes
insert into public.invite_codes (partner_id, code_hash, role, age_band, expires_at, created_at)
  values ('10000000-0000-0000-0000-000000000001', private.hash_code('EXPIRED000000000'), 'parent', '25_plus', now() - interval '1 day', now() - interval '2 days');
insert into public.invite_codes (partner_id, code_hash, role, age_band, expires_at, revoked_at)
  values ('10000000-0000-0000-0000-000000000001', private.hash_code('REVOKED000000000'), 'parent', '25_plus', now() + interval '1 day', now());
set local role service_role;
select is((select public.invite_is_redeemable('EXPIRED000000000')), false, 'expired code is rejected');
select is((select public.invite_is_redeemable('REVOKED000000000')), false, 'revoked code is rejected');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000011'); -- authenticated user
select throws_ok($$select public.redeem_invite('a0000000-0000-0000-0000-000000000042', 'x', 'Nope')$$, '42501', null, 'signed-in users cannot call redeem_invite');
select throws_ok($$select public.rl_hit('x', 1, 1)$$, '42501', null, 'signed-in users cannot call rl_hit');
select throws_ok($$select public.invite_is_redeemable('x')$$, '42501', null, 'signed-in users cannot probe codes');
select throws_ok($$select public.add_ai_flag(gen_random_uuid(), 'high')$$, '42501', null, 'signed-in users cannot add AI flags');
select throws_ok($$select public.add_ai_note_flag(gen_random_uuid(), 'high')$$, '42501', null, 'signed-in users cannot add AI note flags');
reset role;

-- =====================================================================
-- 10. Onboarding and matching
-- =====================================================================
select tests.act_as('a0000000-0000-0000-0000-000000000041'); -- n1 (new youth)
select is((select public.join_best_circle()->>'error'), 'onboarding_required', 'cannot join before onboarding');
select is((select public.complete_onboarding('{anxiety,school_stress}', 'newly_diagnosed', null, 'en', '{night}', 'calgary', false)->>'error'), 'norms_required', 'norms must be accepted');
select is((select public.complete_onboarding('{anxiety,school_stress}', 'newly_diagnosed', null, 'en', '{night}', 'calgary', true)->>'ok'), 'true', 'onboarding completes');
select is((select public.complete_onboarding('{anxiety}', 'long_term', null, 'en', '{night}', 'calgary', true)->>'error'), 'already_onboarded', 'onboarding cannot be re-run');
select is((select public.join_best_circle()->'circle'->>'name'), 'Lily', 'matches into the best open youth circle at the same partner');
select is((select public.join_best_circle()->'circle'->>'name'), 'Lily', 'joining twice is idempotent');
select is((select count(*)::int from public.circle_members where user_id = 'a0000000-0000-0000-0000-000000000041'), 1, 'only one membership');
reset role;

select tests.act_as('a0000000-0000-0000-0000-000000000032'); -- mentor
select throws_ok($$select public.complete_onboarding('{}', null, null, 'en', '{}', null, true)$$, '42501', null, 'mentors do not go through onboarding');
select is((select public.join_best_circle()->>'error'), 'not_applicable', 'mentors are assigned, not matched');
reset role;

-- a full circle makes a new one (with the partner's mentor assigned)
update public.circles set max_members = 2 where id = 'c0000000-0000-0000-0000-000000000001';
insert into public.profiles (id, nickname, role, audience) values ('a0000000-0000-0000-0000-000000000043', 'Newparent', 'parent', 'adult');
insert into public.profile_details (user_id, partner_id, age_band, onboarded_at, situation_tags, stage, times_of_day)
  values ('a0000000-0000-0000-0000-000000000043', '10000000-0000-0000-0000-000000000001', '25_plus', now(), '{anxiety}', 'newly_diagnosed', '{night}');
select tests.act_as('a0000000-0000-0000-0000-000000000043');
select isnt((select public.join_best_circle()->'circle'->>'id'), 'c0000000-0000-0000-0000-000000000001', 'a full circle is never overfilled');
select is((select public.join_best_circle()->'circle'->>'mentor_nickname'), 'Dana', 'a new circle gets a partner mentor');
reset role;
select is((select count(*)::int from public.circle_members where circle_id = 'c0000000-0000-0000-0000-000000000001'), 2, 'circle P still has 2 members');

select has_function('public', 'join_best_circle', array[]::text[], 'join_best_circle takes no arguments, so the client never picks a circle_id');

-- =====================================================================
-- 11. Realtime channel authorization
-- =====================================================================
select tests.act_as('a0000000-0000-0000-0000-000000000011'); -- p1
select is(private.topic_allowed('circle:c0000000-0000-0000-0000-000000000001'), true, 'member may join own circle channel');
select is(private.topic_allowed('circle:c0000000-0000-0000-0000-000000000002'), false, 'non-member cannot join another circle''s channel');
select is(private.topic_allowed('thread:' || (select v from ctx where k = 'thread')), true, 'participant may join own thread channel');
select is(private.topic_allowed('partner:10000000-0000-0000-0000-000000000001'), false, 'non-staff cannot join the partner channel');
select is(private.topic_allowed('circle:not-a-uuid'), false, 'malformed topics are denied');
select is(private.topic_allowed('circle:c0000000-0000-0000-0000-000000000001'' or true --'), false, 'injection-shaped topics are denied');
select is(private.topic_allowed('public:anything'), false, 'unknown topic prefixes are denied');
reset role;
select tests.act_as('a0000000-0000-0000-0000-000000000013'); -- p3
select is(private.topic_allowed('circle:c0000000-0000-0000-0000-000000000001'), false, 'other partner cannot join circle P channel');
select is(private.topic_allowed('thread:' || (select v from ctx where k = 'thread')), false, 'outsider cannot join the private thread channel');
reset role;
select tests.act_as('a0000000-0000-0000-0000-000000000001'); -- mA
select is(private.topic_allowed('partner:10000000-0000-0000-0000-000000000001'), true, 'moderator may join own partner channel');
select is(private.topic_allowed('partner:10000000-0000-0000-0000-000000000002'), false, 'moderator cannot join another partner channel');
select is(private.topic_allowed('circle:c0000000-0000-0000-0000-000000000001'), false, 'moderators cannot eavesdrop on circle channels');
reset role;
select ok(exists (select 1 from pg_policies where schemaname = 'realtime' and tablename = 'messages' and policyname = 'regather_channel_read'), 'realtime read policy exists');
select ok(exists (select 1 from pg_policies where schemaname = 'realtime' and tablename = 'messages' and policyname = 'regather_channel_write'), 'realtime write policy exists');
select ok(exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'messages'), 'messages is published for postgres_changes');

-- =====================================================================
-- 12. Storage, text safety, structure
-- =====================================================================
select is((select public from storage.buckets where id = 'doodles'), false, 'doodles bucket is private');
insert into storage.objects (bucket_id, name) values ('doodles', 'a0000000-0000-0000-0000-000000000011/d.png');
select tests.act_as('a0000000-0000-0000-0000-000000000012'); -- p2
select is((select count(*)::int from storage.objects where bucket_id = 'doodles'), 0, 'other users cannot read someone''s doodle');
reset role;
select tests.act_as('a0000000-0000-0000-0000-000000000011'); -- p1
select is((select count(*)::int from storage.objects where bucket_id = 'doodles'), 1, 'owner can read own doodle');
reset role;

select is(private.crisis_check('I don’t want to be alive'), 'high'::public.flag_severity, 'curly apostrophes are normalized for crisis detection');
select is(private.crisis_check('I   want   TO   die'), 'high'::public.flag_severity, 'case and spacing are normalized');
select is(private.crisis_check('had a good day'), null, 'ordinary text is not flagged');
select is(private.redact_pii('email me at a.b@c.com'), 'email me at [hidden]', 'emails are redacted');
select is(private.redact_pii('call (403) 555-0199 now'), 'call [hidden] now', 'phone numbers are redacted');
select alike(private.redact_pii('I live at 123 Main Street NW'), '%[hidden]%', 'street addresses are redacted');
select alike(private.redact_pii('postal T2P 1J9'), '%[hidden]%', 'postal codes are redacted');
select alike(private.redact_pii('see https://example.com/x'), '%[hidden]%', 'links are redacted');
select is(private.redact_pii('I am 15 years old'), 'I am 15 years old', 'ordinary numbers are left alone');
select is(private.sanitize_text('a' || chr(8238) || 'b' || chr(8203) || chr(1) || 'c'), 'abc', 'control, bidi and zero-width characters are removed');

-- every public table has RLS enabled and at least one policy
select is(
  (select count(*)::int from pg_tables t where t.schemaname = 'public' and not t.rowsecurity),
  0, 'RLS is enabled on every public table');
select is(
  (select count(*)::int from pg_tables t where t.schemaname = 'public'
     and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = t.tablename)),
  0, 'every public table has at least one policy');
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'v'
      and not coalesce((select 'security_invoker=true' = any (c.reloptions)), false)),
  0, 'every public view is security_invoker');
select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private') and p.prosecdef
      and not coalesce((select 'search_path=""' = any (p.proconfig)), false)),
  0, 'every SECURITY DEFINER function has a fixed empty search_path');
select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')),
  0, 'anon can execute no public function');

-- =====================================================================
-- 13. Export and deletion
-- =====================================================================
select tests.act_as('a0000000-0000-0000-0000-000000000021'); -- y1
select cmp_ok(jsonb_array_length(public.export_my_data()->'messages_sent'), '>=', 1, 'export contains own messages');
select is(public.export_my_data()->'profile'->>'nickname', 'Pip', 'export contains own profile');
reset role;

delete from auth.users where id = 'a0000000-0000-0000-0000-000000000021';
select is((select count(*)::int from public.profiles where id = 'a0000000-0000-0000-0000-000000000021'), 0, 'deleting the account deletes the profile');
select is((select count(*)::int from public.profile_details where user_id = 'a0000000-0000-0000-0000-000000000021'), 0, 'deleting the account deletes private details');
select is((select count(*)::int from public.messages where sender_id = 'a0000000-0000-0000-0000-000000000021'), 0, 'deleting the account deletes their messages');
select is((select count(*)::int from public.comfort_notes where sender_id = 'a0000000-0000-0000-0000-000000000021'), 0, 'deleting the account deletes their notes');
select is((select count(*)::int from public.circle_members where user_id = 'a0000000-0000-0000-0000-000000000021'), 0, 'deleting the account removes memberships');
select cmp_ok((select count(*)::int from public.flags where sender_id is null and snapshot is not null), '>=', 1, 'safety flags survive, unlinked from the deleted account');

select * from finish();
rollback;
