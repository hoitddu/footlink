alter table public.matches
  add column if not exists position_targets text[];

update public.matches
set position_targets = '{}'::text[]
where position_targets is null;

alter table public.matches
  alter column position_targets set default '{}'::text[],
  alter column position_targets set not null;

alter table public.matches
  drop constraint if exists matches_position_targets_check;

alter table public.matches
  add constraint matches_position_targets_check
  check (position_targets <@ array['attack', 'defense', 'goalkeeper']::text[]);
