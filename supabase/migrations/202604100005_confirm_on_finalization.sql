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

  return p_request_id;
end;
$$;

create or replace function public.confirm_match_request(
  p_request_id uuid,
  p_host_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.match_requests%rowtype;
  v_host public.profiles%rowtype;
  v_match public.matches%rowtype;
  v_remaining_after integer;
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

  if v_request.status <> 'accepted' then
    raise exception 'REQUEST_NOT_ACCEPTED';
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

  v_remaining_after := v_match.remaining_slots - v_request.requested_count;

  update public.match_requests
  set
    status = 'confirmed',
    decided_at = now(),
    host_note = coalesce(nullif(p_host_note, ''), host_note),
    updated_at = now()
  where id = p_request_id;

  update public.matches
  set
    remaining_slots = v_remaining_after,
    status = case
      when v_remaining_after <= 0 then 'matched'
      else 'open'
    end,
    updated_at = now()
  where id = v_match.id;

  if v_remaining_after <= 0 then
    update public.match_requests
    set
      status = 'expired',
      decided_at = now(),
      host_note = coalesce(host_note, '정원이 모두 마감됐습니다.'),
      updated_at = now()
    where match_id = v_match.id
      and id <> p_request_id
      and status in ('pending', 'accepted');
  end if;

  return p_request_id;
end;
$$;

create or replace function public.cancel_match_request_confirmation(
  p_request_id uuid,
  p_host_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.match_requests%rowtype;
  v_host public.profiles%rowtype;
  v_match public.matches%rowtype;
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

  if v_request.status <> 'confirmed' then
    raise exception 'REQUEST_NOT_CONFIRMED';
  end if;

  select *
  into v_match
  from public.matches
  where id = v_request.match_id
  for update;

  if not found then
    raise exception 'MATCH_NOT_FOUND';
  end if;

  update public.match_requests
  set
    status = 'accepted',
    decided_at = now(),
    host_note = coalesce(nullif(p_host_note, ''), host_note),
    updated_at = now()
  where id = p_request_id;

  update public.matches
  set
    remaining_slots = least(total_slots, remaining_slots + v_request.requested_count),
    status = 'open',
    updated_at = now()
  where id = v_match.id;

  return p_request_id;
end;
$$;

create or replace function public.reject_match_request(
  p_request_id uuid,
  p_host_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.match_requests%rowtype;
  v_host public.profiles%rowtype;
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

  if v_request.status not in ('pending', 'accepted') then
    raise exception 'REQUEST_NOT_REJECTABLE';
  end if;

  update public.match_requests
  set
    status = 'rejected',
    decided_at = now(),
    host_note = coalesce(nullif(p_host_note, ''), host_note),
    updated_at = now()
  where id = p_request_id;

  return p_request_id;
end;
$$;

grant execute on function public.accept_match_request(uuid, text) to authenticated;
grant execute on function public.confirm_match_request(uuid, text) to authenticated;
grant execute on function public.cancel_match_request_confirmation(uuid, text) to authenticated;
grant execute on function public.reject_match_request(uuid, text) to authenticated;
