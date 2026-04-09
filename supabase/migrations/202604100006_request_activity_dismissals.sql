create table if not exists public.request_activity_dismissals (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid not null references public.match_requests(id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (profile_id, request_id)
);

create index if not exists request_activity_dismissals_profile_id_idx
on public.request_activity_dismissals(profile_id, dismissed_at desc);

alter table public.request_activity_dismissals enable row level security;

drop policy if exists "request_activity_dismissals_select_own" on public.request_activity_dismissals;
create policy "request_activity_dismissals_select_own"
on public.request_activity_dismissals
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "request_activity_dismissals_insert_own" on public.request_activity_dismissals;
create policy "request_activity_dismissals_insert_own"
on public.request_activity_dismissals
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_id
      and p.auth_user_id = auth.uid()
  )
);
