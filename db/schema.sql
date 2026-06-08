-- World Cup 2026 prediction pool schema

create table if not exists players (
  id          serial primary key,
  name        text not null unique,
  pin_hash    text,                       -- null until the player sets a PIN on first login
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- A match is any fixture (group stage or knockout).
create table if not exists matches (
  id            serial primary key,
  round         text not null,            -- group | r32 | r16 | qf | sf | final
  group_name    text,                     -- A..L for group stage, null otherwise
  ordinal       int not null,             -- ordering within a round
  kickoff       timestamptz,              -- match start; predictions lock at this time
  team1         text not null,            -- may be 'TBD' for knockout
  team2         text not null,
  points        int not null,             -- points awarded for a correct pick
  -- actual result, filled in by admin:
  score1        int,
  score2        int,
  result        text,                     -- team1 | team2 | draw | null (not played yet)
  status        text not null default 'scheduled', -- scheduled | finished
  created_at    timestamptz not null default now()
);

create table if not exists predictions (
  id          serial primary key,
  player_id   int not null references players(id) on delete cascade,
  match_id    int not null references matches(id) on delete cascade,
  pick        text not null,              -- team1 | team2 | draw
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (player_id, match_id)
);

-- Lucky Round: each player picks the champion before the QF starts.
create table if not exists champion_picks (
  id          serial primary key,
  player_id   int not null references players(id) on delete cascade,
  team        text not null,
  points      int not null default 50,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (player_id)
);

-- Single-row settings table for tournament-wide flags.
create table if not exists settings (
  id              int primary key default 1,
  champion        text,                   -- actual champion, set by admin
  champion_lock   timestamptz,            -- champion picks lock at this time (QF start)
  constraint settings_singleton check (id = 1)
);

insert into settings (id) values (1) on conflict (id) do nothing;

create index if not exists idx_predictions_match on predictions(match_id);
create index if not exists idx_predictions_player on predictions(player_id);
create index if not exists idx_matches_round on matches(round);
