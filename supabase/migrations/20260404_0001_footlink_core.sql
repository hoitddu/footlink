create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  nickname text not null,
  age integer not null check (age > 0),
  role text not null default 'player' check (role in ('player', 'captain')),
  preferred_mode text check (preferred_mode in ('solo', 'small_group', 'team')),
  preferred_regions text[] not null default '{}',
  skill_level text not null check (skill_level in ('beginner', 'low', 'mid', 'high')),
  open_chat_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  creator_profile_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('solo', 'small_group', 'team')),
  listing_type text not null check (listing_type in ('mercenary', 'partial_join', 'team_match')),
  title text not null,
  region_slug text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  start_at timestamptz not null,
  fee integer not null default 0 check (fee >= 0),
  total_slots integer not null check (total_slots > 0),
  remaining_slots integer not null check (remaining_slots >= 0 and remaining_slots <= total_slots),
  min_group_size integer not null check (min_group_size > 0),
  max_group_size integer not null check (max_group_size >= min_group_size),
  skill_level text not null check (skill_level in ('beginner', 'low', 'mid', 'high')),
  contact_type text not null check (contact_type in ('request_only', 'openchat')),
  contact_link text,
  note text,
  status text not null default 'open' check (status in ('open', 'matched', 'closed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_type_mode_check check (
    (listing_type = 'team_match' and mode = 'team')
    or (listing_type = 'mercenary' and mode = 'solo')
    or (listing_type = 'partial_join' and mode = 'small_group')
  )
);

create table if not exists public.match_requests (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  requester_profile_id uuid not null references public.profiles(id) on delete cascade,
  host_profile_id uuid not null references public.profiles(id) on delete cascade,
  requested_count integer not null check (requested_count > 0),
  message text,
  entry_channel text not null check (entry_channel in ('request_only', 'openchat')),
  status text not null check (status in ('pending', 'accepted', 'rejected', 'withdrawn', 'expired')),
  host_note text,
  accepted_contact_link text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists matches_status_start_at_idx on public.matches(status, start_at);
create index if not exists matches_region_status_start_at_idx on public.matches(region_slug, status, start_at);
create index if not exists matches_creator_profile_id_start_at_idx on public.matches(creator_profile_id, start_at desc);
create index if not exists match_requests_requester_created_at_idx on public.match_requests(requester_profile_id, created_at desc);
create index if not exists match_requests_host_created_at_idx on public.match_requests(host_profile_id, created_at desc);
create index if not exists match_requests_match_created_at_idx on public.match_requests(match_id, created_at desc);

create unique index if not exists match_requests_active_unique_idx
on public.match_requests(match_id, requester_profile_id)
where status in ('pending', 'accepted');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_matches_updated_at on public.matches;
create trigger set_matches_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

drop trigger if exists set_match_requests_updated_at on public.match_requests;
create trigger set_match_requests_updated_at
before update on public.match_requests
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.match_requests enable row level security;

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
on public.profiles
for select
to anon, authenticated
using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (auth.uid() = auth_user_id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

drop policy if exists "matches_select_public" on public.matches;
create policy "matches_select_public"
on public.matches
for select
to anon, authenticated
using (status in ('open', 'matched', 'closed'));

drop policy if exists "matches_insert_creator" on public.matches;
create policy "matches_insert_creator"
on public.matches
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = creator_profile_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "matches_update_creator" on public.matches;
create policy "matches_update_creator"
on public.matches
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = creator_profile_id
      and p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = creator_profile_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "match_requests_select_owner_or_host" on public.match_requests;
create policy "match_requests_select_owner_or_host"
on public.match_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id in (requester_profile_id, host_profile_id)
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "match_requests_insert_requester" on public.match_requests;
create policy "match_requests_insert_requester"
on public.match_requests
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = requester_profile_id
      and p.auth_user_id = auth.uid()
  )
);

create or replace function public.accept_match_request(
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
  v_match public.matches%rowtype;
  v_host public.profiles%rowtype;
  v_contact_link text;
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

  v_contact_link := nullif(v_match.contact_link, '');
  if v_contact_link is null then
    v_contact_link := nullif(v_host.open_chat_link, '');
  end if;

  if v_contact_link is null then
    raise exception 'CONTACT_LINK_REQUIRED';
  end if;

  update public.match_requests
  set
    status = 'accepted',
    decided_at = now(),
    host_note = coalesce(nullif(p_host_note, ''), host_note),
    accepted_contact_link = v_contact_link,
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

  if v_request.status <> 'pending' then
    raise exception 'REQUEST_NOT_PENDING';
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

create or replace function public.withdraw_match_request(
  p_request_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.match_requests%rowtype;
  v_requester public.profiles%rowtype;
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
  into v_requester
  from public.profiles
  where id = v_request.requester_profile_id;

  if v_requester.auth_user_id is distinct from auth.uid() then
    raise exception 'REQUESTER_FORBIDDEN';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'REQUEST_NOT_PENDING';
  end if;

  update public.match_requests
  set
    status = 'withdrawn',
    decided_at = now(),
    updated_at = now()
  where id = p_request_id;

  return p_request_id;
end;
$$;

grant execute on function public.accept_match_request(uuid, text) to authenticated;
grant execute on function public.reject_match_request(uuid, text) to authenticated;
grant execute on function public.withdraw_match_request(uuid) to authenticated;
