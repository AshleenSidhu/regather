-- Regather: second-opinion flag for candy-gram notes (service role only), mirroring add_ai_flag.

create function public.add_ai_note_flag(p_note_id uuid, p_severity public.flag_severity) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  n public.comfort_notes%rowtype;
  v_partner uuid;
  v_id uuid;
begin
  select * into n from public.comfort_notes x where x.id = p_note_id;
  if not found then
    return null;
  end if;
  if exists (select 1 from public.flags f where f.note_id = n.id) then
    return null;
  end if;
  select d.partner_id into v_partner from public.profile_details d where d.user_id = n.sender_id;
  insert into public.flags (partner_id, note_id, sender_id, source, severity, context, snapshot)
  values (v_partner, n.id, n.sender_id, 'ai', p_severity, 'note', n.body)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.add_ai_note_flag(uuid, public.flag_severity) from public, anon, authenticated;
grant execute on function public.add_ai_note_flag(uuid, public.flag_severity) to service_role;
