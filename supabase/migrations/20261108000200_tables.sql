-- Regather: tables. RLS is enabled here; policies and grants are in migration 4.
-- Data minimization: nickname, age band and city picklist only. No real names,
-- birthdays or exact locations anywhere.

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  kind text not null check (kind in ('er', 'clinic', 'nonprofit', 'campus')),
  created_at timestamptz not null default now()
);

create table public.partner_staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  partner_id uuid not null references public.partners (id) on delete cascade,
  is_moderator boolean not null default true,
  created_at timestamptz not null default now()
);
create index partner_staff_partner_idx on public.partner_staff (partner_id);

create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  code_hash bytea not null unique,
  role public.app_role not null,
  age_band public.age_band not null,
  label text check (label is null or char_length(label) <= 40),
  max_uses int not null default 1 check (max_uses between 1 and 10),
  uses int not null default 0,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint invite_uses_within_max check (uses <= max_uses),
  constraint invite_role_not_partner check (role <> 'partner'),
  constraint invite_role_age_match check (
    (role = 'youth' and age_band in ('13_15', '16_17'))
    or (role = 'young_adult' and age_band = '18_24')
    or (role in ('parent', 'mentor') and age_band in ('18_24', '25_plus'))
  ),
  constraint invite_max_ttl check (expires_at <= created_at + interval '30 days')
);
create index invite_codes_partner_idx on public.invite_codes (partner_id);

-- Visible to peers. Role and audience are set only by the server from the invite code.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null,
  role public.app_role not null,
  audience public.audience not null,
  sticker public.note_sticker not null default 'axolotl',
  created_at timestamptz not null default now(),
  constraint profile_nickname_format check (
    nickname ~ '^[[:alnum:] ._-]{2,24}$'
    and nickname !~ '@'
    and nickname !~ '[0-9]{5,}'
  ),
  constraint profile_audience_matches_role check (
    (role = 'youth' and audience = 'minor')
    or (role <> 'youth' and audience = 'adult')
  )
);

-- Private to the user (and the server). Holds everything sensitive or privileged.
create table public.profile_details (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  partner_id uuid not null references public.partners (id),
  invite_id uuid references public.invite_codes (id) on delete set null,
  age_band public.age_band not null,
  trust_level smallint not null default 0 check (trust_level between 0 and 3),
  city text check (city is null or city in (
    'calgary', 'edmonton', 'vancouver', 'victoria', 'winnipeg',
    'toronto', 'ottawa', 'montreal', 'halifax', 'other'
  )),
  situation_tags public.situation_tag[] not null default '{}'
    check (cardinality(situation_tags) <= 5),
  stage public.stage,
  child_age_band public.child_age_band,
  language text not null default 'en' check (language in ('en', 'fr', 'es', 'pa', 'zh', 'tl', 'ar', 'other')),
  times_of_day public.time_of_day[] not null default '{}'
    check (cardinality(times_of_day) <= 4),
  norms_accepted_at timestamptz,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);
create index profile_details_partner_idx on public.profile_details (partner_id);

create table public.circles (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  kind public.circle_kind not null,
  audience public.audience not null,
  name text not null check (char_length(name) between 2 and 40),
  tags public.situation_tag[] not null default '{}',
  stage public.stage,
  age_band public.age_band,
  times public.time_of_day[] not null default '{}',
  mentor_id uuid references public.profiles (id) on delete set null,
  max_members smallint not null default 8 check (max_members between 2 and 12),
  cohort_start date not null default current_date,
  created_at timestamptz not null default now(),
  constraint circle_audience_matches_kind check (
    (kind = 'youth' and audience = 'minor')
    or (kind <> 'youth' and audience = 'adult')
  )
);
create index circles_partner_kind_idx on public.circles (partner_id, kind);
create index circles_mentor_idx on public.circles (mentor_id);

create table public.circle_members (
  circle_id uuid not null references public.circles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id),
  unique (user_id) -- one circle at a time for the MVP
);

create table public.threads (
  id uuid primary key default gen_random_uuid(),
  kind public.thread_kind not null,
  circle_id uuid references public.circles (id) on delete cascade,
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint thread_users_ordered check (user_a < user_b),
  unique (kind, user_a, user_b)
);
create index threads_user_a_idx on public.threads (user_a);
create index threads_user_b_idx on public.threads (user_b);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid references public.circles (id) on delete cascade,
  thread_id uuid references public.threads (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  kind public.message_kind not null default 'text',
  body text not null check (char_length(body) between 1 and 2000),
  checkin_score smallint check (checkin_score between 1 and 5),
  redacted boolean not null default false,
  created_at timestamptz not null default now(),
  constraint message_one_target check (num_nonnulls(circle_id, thread_id) = 1),
  constraint message_checkin_has_score check (kind <> 'checkin' or checkin_score is not null)
);
create index messages_circle_idx on public.messages (circle_id, created_at desc);
create index messages_thread_idx on public.messages (thread_id, created_at desc);
create index messages_sender_idx on public.messages (sender_id);

create table public.mentor_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  circle_id uuid not null references public.circles (id) on delete cascade,
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  status public.request_status not null default 'requested',
  created_at timestamptz not null default now(),
  unique (requester_id, circle_id)
);
create index mentor_requests_mentor_idx on public.mentor_requests (mentor_id);
create index mentor_requests_circle_idx on public.mentor_requests (circle_id);

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status public.request_status not null default 'requested',
  created_at timestamptz not null default now(),
  constraint connection_not_self check (requester_id <> addressee_id)
);
create unique index connections_pair_idx
  on public.connections (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index connections_addressee_idx on public.connections (addressee_id);
create index connections_requester_idx on public.connections (requester_id);

create table public.comfort_notes (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'candy_gram' check (kind = 'candy_gram'),
  sticker public.note_sticker not null default 'shell',
  color text not null default 'blush' check (color in ('blush', 'lake', 'mint', 'lilac', 'peach')),
  body text not null check (char_length(body) between 1 and 280),
  redacted boolean not null default false,
  saved_to_jar boolean not null default false,
  created_at timestamptz not null default now(),
  constraint note_not_self check (sender_id <> recipient_id)
);
create index comfort_notes_recipient_idx on public.comfort_notes (recipient_id, created_at desc);
create index comfort_notes_sender_idx on public.comfort_notes (sender_id);

-- Crisis flags. Readable only by moderators of the partner. The snapshot is a
-- moderator-only copy so the flag survives even if the sender deletes their account.
create table public.flags (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  message_id uuid references public.messages (id) on delete set null,
  note_id uuid references public.comfort_notes (id) on delete set null,
  sender_id uuid references public.profiles (id) on delete set null,
  source public.flag_source not null,
  severity public.flag_severity not null,
  context text not null check (context in ('circle', 'private', 'mentor', 'note', 'sos')),
  snapshot text,
  status public.flag_status not null default 'open',
  review_note text check (review_note is null or char_length(review_note) <= 500),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index flags_partner_idx on public.flags (partner_id, status, created_at desc);
create index flags_message_idx on public.flags (message_id);
create index flags_note_idx on public.flags (note_id);
create index flags_sender_idx on public.flags (sender_id);

create table public.audit_log (
  id bigint generated always as identity primary key,
  partner_id uuid not null references public.partners (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  created_at timestamptz not null default now()
  -- deliberately no message text
);
create index audit_log_partner_idx on public.audit_log (partner_id, created_at desc);

-- Internal tables (schema `private`, never exposed).
create table private.crisis_keywords (
  term text primary key,
  severity public.flag_severity not null
);

create table private.rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (bucket, window_start)
);
create index rate_limits_window_idx on private.rate_limits (window_start);

-- Deny by default: RLS on, and no privileges for anyone until migration 4.
do $$
declare t text;
begin
  foreach t in array array[
    'partners', 'partner_staff', 'invite_codes', 'profiles', 'profile_details',
    'circles', 'circle_members', 'threads', 'messages', 'mentor_requests',
    'connections', 'comfort_notes', 'flags', 'audit_log'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
  end loop;
end $$;

alter table private.crisis_keywords enable row level security;
alter table private.rate_limits enable row level security;
revoke all on private.crisis_keywords, private.rate_limits from public, anon, authenticated;
