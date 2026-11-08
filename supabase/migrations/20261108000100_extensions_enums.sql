-- Regather: extensions, private schema, enums.
-- Security baseline: nothing in `public` is reachable by default. Every table and
-- function must be granted explicitly in later migrations.

create extension if not exists pgcrypto with schema extensions;

-- `private` is NOT in the API's exposed schemas, so PostgREST never serves it.
-- RLS policies call helper functions in here, so `authenticated` needs USAGE.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- New functions get no EXECUTE for anyone by default; each one is granted on purpose.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon, authenticated;

create type public.app_role as enum ('parent', 'youth', 'young_adult', 'mentor', 'partner');
create type public.age_band as enum ('13_15', '16_17', '18_24', '25_plus');
create type public.audience as enum ('minor', 'adult');
create type public.circle_kind as enum ('parent', 'youth', 'young_adult');
create type public.stage as enum ('just_after_crisis', 'newly_diagnosed', 'long_term');
create type public.situation_tag as enum (
  'er_discharge', 'anxiety', 'depression', 'self_harm', 'eating_concerns',
  'substance_use', 'school_stress', 'bullying', 'grief', 'family_conflict'
);
create type public.time_of_day as enum ('morning', 'afternoon', 'evening', 'night');
create type public.child_age_band as enum ('under_13', '13_15', '16_17', '18_plus');
create type public.thread_kind as enum ('mentor', 'private');
create type public.message_kind as enum ('text', 'checkin');
create type public.flag_source as enum ('keyword', 'ai', 'sos');
create type public.flag_severity as enum ('medium', 'high');
create type public.flag_status as enum ('open', 'reviewing', 'resolved');
create type public.request_status as enum ('requested', 'accepted', 'declined');
create type public.note_sticker as enum ('shell', 'lily', 'axolotl');
