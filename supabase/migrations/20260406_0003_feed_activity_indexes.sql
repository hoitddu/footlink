-- Feed hot path:
-- The browse flow always filters open matches with remaining slots,
-- always constrains listing_type by mode, and sorts by start_at.
-- We optimize that exact path instead of adding broader low-signal indexes.

create index if not exists matches_open_listing_start_at_cover_idx
on public.matches (listing_type, start_at)
include (
  id,
  creator_profile_id,
  mode,
  title,
  region_slug,
  lat,
  lng,
  fee,
  remaining_slots,
  min_group_size,
  max_group_size,
  skill_level,
  status
)
where status = 'open' and remaining_slots > 0;

-- Initial onboarding and most browse entries carry a skill filter.
-- This narrower index reduces scans when the feed is filtered by level.
create index if not exists matches_open_listing_skill_start_at_cover_idx
on public.matches (listing_type, skill_level, start_at)
include (
  id,
  creator_profile_id,
  mode,
  title,
  region_slug,
  lat,
  lng,
  fee,
  remaining_slots,
  min_group_size,
  max_group_size,
  status
)
where status = 'open' and remaining_slots > 0;

-- Activity notifications:
-- Hosts frequently check only pending requests for their active listings.
create index if not exists match_requests_match_pending_created_at_idx
on public.match_requests (match_id, created_at desc)
where status = 'pending';

-- Requesters frequently open recent decision states only.
create index if not exists match_requests_requester_decision_created_at_idx
on public.match_requests (requester_profile_id, created_at desc)
where status in ('accepted', 'confirmed', 'rejected');
