alter table public.matches
add column if not exists duration_minutes integer
not null
default 120
check (duration_minutes > 0 and duration_minutes <= 480);

alter table public.matches
add column if not exists futsal_format text
check (futsal_format in ('4vs4', '5vs5', '6vs6'));

update public.matches
set duration_minutes = 120
where duration_minutes is null;

update public.matches
set futsal_format = '5vs5'
where sport_type = 'futsal' and futsal_format is null;
