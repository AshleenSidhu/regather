-- Regather: Realtime + Storage.
-- postgres_changes only on tables protected by RLS (messages, flags): Realtime checks
-- each subscriber's RLS before delivering a row.
-- Presence and broadcast use PRIVATE channels, authorized below.
-- Also turn OFF "Allow public access" under Realtime settings in the dashboard.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.messages;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.flags;
    exception when duplicate_object then null;
    end;
  else
    create publication supabase_realtime for table public.messages, public.flags;
  end if;
end $$;

-- Channel authorization: topics are circle:<uuid>, thread:<uuid>, partner:<uuid>.
-- private.topic_allowed() validates the topic format before casting and checks membership.
do $$
begin
  if to_regclass('realtime.messages') is not null then
    execute $p$
      create policy regather_channel_read on realtime.messages
        for select to authenticated
        using (private.topic_allowed((select realtime.topic())))
    $p$;
    execute $p$
      create policy regather_channel_write on realtime.messages
        for insert to authenticated
        with check (private.topic_allowed((select realtime.topic())))
    $p$;
  end if;
end $$;

-- Private bucket for doodles (stretch feature). Files live under <user id>/..., are
-- never public, and are served to recipients only via short-lived signed URLs that the
-- server mints after checking the note.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('doodles', 'doodles', false, 1048576, array['image/png'])
on conflict (id) do nothing;

create policy doodles_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'doodles' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy doodles_owner_select on storage.objects
  for select to authenticated
  using (bucket_id = 'doodles' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy doodles_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'doodles' and (storage.foldername(name))[1] = (select auth.uid())::text);
