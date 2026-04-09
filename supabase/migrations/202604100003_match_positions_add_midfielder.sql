alter table public.matches
  drop constraint if exists matches_position_targets_check;

alter table public.matches
  add constraint matches_position_targets_check
  check (position_targets <@ array['attack', 'midfielder', 'defense', 'goalkeeper']::text[]);
