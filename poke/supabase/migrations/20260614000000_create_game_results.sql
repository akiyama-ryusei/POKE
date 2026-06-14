create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  level integer not null check (level between 1 and 3),
  turns integer not null check (turns > 0),
  winner text not null check (winner in ('player', 'enemy')),
  created_at timestamptz not null default now()
);

create index if not exists game_results_level_turns_idx
  on public.game_results (level, turns);

create index if not exists game_results_created_at_idx
  on public.game_results (created_at desc);

alter table public.game_results enable row level security;

drop policy if exists "Anyone can add game results" on public.game_results;
create policy "Anyone can add game results"
  on public.game_results
  for insert
  to anon
  with check (
    level between 1 and 3
    and turns > 0
    and winner in ('player', 'enemy')
  );

drop policy if exists "Anyone can read game results" on public.game_results;
create policy "Anyone can read game results"
  on public.game_results
  for select
  to anon
  using (true);

create or replace view public.level_turn_histogram as
select
  level,
  turns,
  count(*)::integer as clear_count
from public.game_results
where winner = 'player'
group by level, turns;

grant usage on schema public to anon;
grant insert, select on table public.game_results to anon;
grant select on public.level_turn_histogram to anon;
