alter table public.profiles
  add column if not exists phone_number text,
  add column if not exists default_contact_type text;

alter table public.profiles
  drop constraint if exists profiles_default_contact_type_check;

alter table public.profiles
  add constraint profiles_default_contact_type_check
  check (default_contact_type is null or default_contact_type in ('openchat', 'phone'));

update public.profiles
set default_contact_type = case
  when coalesce(nullif(open_chat_link, ''), '') <> '' then 'openchat'
  when coalesce(nullif(phone_number, ''), '') <> '' then 'phone'
  else default_contact_type
end
where default_contact_type is null;

alter table public.matches
  drop constraint if exists matches_contact_type_check;

alter table public.matches
  add constraint matches_contact_type_check
  check (contact_type in ('request_only', 'openchat', 'phone'));

alter table public.match_requests
  drop constraint if exists match_requests_entry_channel_check;

alter table public.match_requests
  add constraint match_requests_entry_channel_check
  check (entry_channel in ('request_only', 'openchat', 'phone'));

create or replace function public.accept_match_request(p_request_id uuid, p_host_note text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.match_requests%rowtype;
  v_match public.matches%rowtype;
  v_host public.profiles%rowtype;
  v_contact_value text;
begin
  select *
  into v_request
  from public.match_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'REQUEST_NOT_FOUND';
  end if;

  select *
  into v_host
  from public.profiles
  where id = v_request.host_profile_id;

  if v_host.auth_user_id is distinct from auth.uid() then
    raise exception 'HOST_FORBIDDEN';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'REQUEST_NOT_PENDING';
  end if;

  select *
  into v_match
  from public.matches
  where id = v_request.match_id
  for update;

  if not found then
    raise exception 'MATCH_NOT_FOUND';
  end if;

  if v_match.status <> 'open' then
    raise exception 'MATCH_NOT_OPEN';
  end if;

  if v_match.remaining_slots < v_request.requested_count then
    raise exception 'INSUFFICIENT_REMAINING_SLOTS';
  end if;

  v_contact_value := nullif(v_match.contact_link, '');

  if v_contact_value is null then
    if v_match.contact_type = 'phone' then
      v_contact_value := nullif(v_host.phone_number, '');
    else
      v_contact_value := nullif(v_host.open_chat_link, '');
    end if;
  end if;

  if v_contact_value is null then
    raise exception 'CONTACT_LINK_REQUIRED';
  end if;

  update public.match_requests
  set
    status = 'accepted',
    decided_at = now(),
    host_note = coalesce(nullif(p_host_note, ''), host_note),
    accepted_contact_link = v_contact_value,
    updated_at = now()
  where id = p_request_id;

  update public.matches
  set
    remaining_slots = remaining_slots - v_request.requested_count,
    status = case
      when remaining_slots - v_request.requested_count <= 0 then 'matched'
      else status
    end,
    updated_at = now()
  where id = v_match.id;

  update public.match_requests
  set
    status = 'expired',
    decided_at = now(),
    host_note = coalesce(host_note, '정원이 모두 마감됐습니다.'),
    updated_at = now()
  where match_id = v_match.id
    and id <> p_request_id
    and status = 'pending'
    and exists (
      select 1
      from public.matches m
      where m.id = v_match.id
        and m.status = 'matched'
    );

  return p_request_id;
end;
$$;
