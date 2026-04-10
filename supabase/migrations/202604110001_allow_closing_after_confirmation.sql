create or replace function public.cancel_host_match(
  p_match_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
  v_has_confirmed boolean := false;
begin
  perform public.close_expired_matches();

  select *
  into v_match
  from public.matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'MATCH_NOT_FOUND';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = v_match.creator_profile_id
      and p.auth_user_id = auth.uid()
  ) then
    raise exception 'MATCH_FORBIDDEN';
  end if;

  if v_match.status in ('cancelled', 'matched', 'closed') then
    return v_match.id;
  end if;

  if exists (
    select 1
    from public.match_requests mr
    where mr.match_id = v_match.id
      and mr.status = 'accepted'
  ) then
    raise exception 'MATCH_DELETE_HAS_ACCEPTED_REQUESTS';
  end if;

  select exists (
    select 1
    from public.match_requests mr
    where mr.match_id = v_match.id
      and mr.status = 'confirmed'
  )
  into v_has_confirmed;

  update public.matches
  set
    status = case
      when v_has_confirmed then 'matched'
      else 'cancelled'
    end,
    updated_at = now()
  where id = v_match.id;

  update public.match_requests
  set
    status = 'rejected',
    host_note = coalesce(host_note, '호스트가 모집을 마감했습니다.'),
    decided_at = coalesce(decided_at, now()),
    updated_at = now()
  where match_id = v_match.id
    and status = 'pending';

  return v_match.id;
end;
$$;

grant execute on function public.cancel_host_match(uuid) to authenticated;
