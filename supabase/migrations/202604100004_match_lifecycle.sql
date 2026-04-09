create or replace function public.close_expired_matches()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_closed_count integer := 0;
begin
  update public.matches
  set
    status = 'closed',
    updated_at = now()
  where status in ('open', 'matched')
    and start_at <= now();

  get diagnostics v_closed_count = row_count;

  update public.match_requests mr
  set
    status = 'expired',
    host_note = coalesce(mr.host_note, '경기 시작 시각이 지나 모집이 자동 마감되었습니다.'),
    decided_at = coalesce(mr.decided_at, now()),
    updated_at = now()
  where mr.status = 'pending'
    and exists (
      select 1
      from public.matches m
      where m.id = mr.match_id
        and m.status = 'closed'
        and m.start_at <= now()
    );

  return v_closed_count;
end;
$$;

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

  if v_match.status = 'cancelled' then
    return v_match.id;
  end if;

  if exists (
    select 1
    from public.match_requests mr
    where mr.match_id = v_match.id
      and mr.status in ('accepted', 'confirmed')
  ) then
    raise exception 'MATCH_DELETE_HAS_ACCEPTED_REQUESTS';
  end if;

  update public.matches
  set
    status = 'cancelled',
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
