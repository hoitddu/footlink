alter table public.profiles
add column if not exists preferred_sport text
check (preferred_sport in ('futsal', 'soccer'));

alter table public.matches
add column if not exists sport_type text
not null
default 'futsal'
check (sport_type in ('futsal', 'soccer'));

update public.matches
set sport_type = 'futsal'
where sport_type is null;

create index if not exists matches_open_sport_start_at_cover_idx
on public.matches (sport_type, start_at)
include (
  id,
  creator_profile_id,
  mode,
  listing_type,
  title,
  region_slug,
  lat,
  lng,
  fee,
  remaining_slots,
  contact_type,
  contact_link,
  status
)
where status = 'open' and remaining_slots > 0;

create index if not exists matches_open_region_sport_start_at_idx
on public.matches (region_slug, sport_type, start_at)
where status = 'open' and remaining_slots > 0;
