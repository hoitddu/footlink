alter table public.match_requests
drop constraint if exists match_requests_status_check;

alter table public.match_requests
add constraint match_requests_status_check
check (status in ('pending', 'accepted', 'confirmed', 'rejected', 'withdrawn', 'expired'));

drop index if exists public.match_requests_active_unique_idx;

create unique index if not exists match_requests_active_unique_idx
on public.match_requests(match_id, requester_profile_id)
where status in ('pending', 'accepted', 'confirmed');

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

  update public.match_requests
  set
    status = 'confirmed',
    decided_at = now(),
    host_note = coalesce(nullif(p_host_note, ''), host_note),
    updated_at = now()
  where id = p_request_id;

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

  update public.match_requests
  set
    status = 'accepted',
    decided_at = now(),
    host_note = coalesce(nullif(p_host_note, ''), host_note),
    updated_at = now()
  where id = p_request_id;

  return p_request_id;
end;
$$;

grant execute on function public.confirm_match_request(uuid, text) to authenticated;
grant execute on function public.cancel_match_request_confirmation(uuid, text) to authenticated;
