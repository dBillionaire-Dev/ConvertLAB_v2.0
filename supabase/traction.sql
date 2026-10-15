-- Clinexia traction metrics (run once in the Supabase SQL editor; safe to re-run).
-- Privacy: only event type, tool id, platform, app version, anonymous random id and timestamp.
-- No IP address, patient data, calculator inputs or results are stored.

-- 1. Per-visitor, per-day presence (first-party). Fed by the existing heartbeat.
create table if not exists public.visitor_days (
  day date not null,
  anonymous_id text not null,
  platform text not null check (platform in ('web','pwa','android','windows')),
  app_version text,
  sessions integer not null default 0,
  heartbeats integer not null default 0,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (day, anonymous_id, platform)
);
create index if not exists visitor_days_day_idx on public.visitor_days (day);

-- A heartbeat starts a new session when it is the visitor's first of the day or
-- more than 30 minutes after their previous one (decided server-side, so older app versions work too).
create or replace function public.traction_touch_visitor_day(
  p_anonymous_id text, p_platform text, p_app_version text
) returns void language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Africa/Lagos')::date;
begin
  insert into public.visitor_days (day, anonymous_id, platform, app_version, sessions, heartbeats)
  values (d, p_anonymous_id, p_platform, p_app_version, 1, 1)
  on conflict (day, anonymous_id, platform) do update set
    app_version = coalesce(excluded.app_version, public.visitor_days.app_version),
    sessions = public.visitor_days.sessions
      + case when now() - public.visitor_days.last_seen_at > interval '30 minutes' then 1 else 0 end,
    heartbeats = public.visitor_days.heartbeats + 1,
    last_seen_at = now();
end $$;

-- 2. PWA install events (one per anonymous id). `appinstalled` is not fired by Safari/iOS, so this undercounts.
create table if not exists public.pwa_install_events (
  anonymous_id text primary key,
  platform text not null check (platform in ('pwa','android','windows','web')),
  app_version text,
  installed_at timestamptz not null default now()
);

create or replace function public.traction_record_install(
  p_anonymous_id text, p_platform text, p_app_version text
) returns void language sql security definer set search_path = public as $$
  insert into public.pwa_install_events (anonymous_id, platform, app_version)
  values (p_anonymous_id, p_platform, p_app_version)
  on conflict (anonymous_id) do nothing;
$$;

-- 3. Activity view: one row per production visitor per day per platform (Africa/Lagos day).
--    Active = at least one calculation OR at least one heartbeat that day.
create or replace view public.traction_activity_days as
  select (occurred_at at time zone 'Africa/Lagos')::date as day, anonymous_id, source as platform
  from public.calculation_events where environment = 'production'
  union
  select day, anonymous_id, platform from public.visitor_days;

-- 4. Rollup tables (written by scripts/traction/rebuild-rollups.mjs).
create table if not exists public.daily_rollups (
  date date not null,
  platform text not null check (platform in ('all','web','pwa','android','windows')),
  active_users integer not null,
  new_users integer not null,
  returning_users integer not null,
  sessions integer,            -- null = not recorded yet on that day
  tool_uses integer not null,
  primary key (date, platform)
);

create table if not exists public.tool_usage_daily (
  date date not null,
  tool_id text not null,
  tool_name text,
  uses integer not null,
  primary key (date, tool_id)
);

-- 5. External sources.
create table if not exists public.search_console_daily (
  date date not null,
  query text not null,
  page text not null,
  country text not null,
  device text not null,
  clicks integer not null,
  impressions integer not null,
  ctr double precision not null,
  position double precision not null,
  row_hash text generated always as (md5(query || '|' || page || '|' || country || '|' || device)) stored,
  unique (date, row_hash)
);
create index if not exists search_console_daily_date_idx on public.search_console_daily (date);

create table if not exists public.apk_downloads_snapshots (
  snapshot_date date not null,
  release_tag text not null,
  asset_name text not null,
  download_count integer not null,
  captured_at timestamptz not null default now(),
  published_at timestamptz,
  is_baseline boolean not null default false,
  primary key (release_tag, asset_name, snapshot_date)
);

create table if not exists public.pwa_installs_daily (
  date date primary key,
  installs integer not null
);

-- 6. Manual revenue entries.
create table if not exists public.revenue_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  source text not null check (source in ('ads','sponsorship','other')),
  amount_usd numeric(12,2) not null check (amount_usd >= 0),
  notes text,
  entered_manually boolean not null default true,
  created_at timestamptz not null default now()
);

-- 7. Job log (powers "last synced" in the coverage panel).
create table if not exists public.traction_job_runs (
  job text primary key,
  ran_at timestamptz not null default now(),
  status text not null,
  detail text
);

-- 8. Aggregate helpers used by the admin dashboard.
create or replace function public.traction_distinct_active(p_from date, p_to date, p_platform text default null)
returns integer language sql stable security definer set search_path = public as $$
  select count(distinct anonymous_id)::integer from public.traction_activity_days
  where day between p_from and p_to and (p_platform is null or platform = p_platform);
$$;

create or replace function public.traction_monthly_active(p_from date)
returns table (month date, mau integer) language sql stable security definer set search_path = public as $$
  select date_trunc('month', day)::date, count(distinct anonymous_id)::integer
  from public.traction_activity_days where day >= p_from group by 1 order by 1;
$$;

-- Lock everything down: only the server (service role) touches these.
alter table public.visitor_days enable row level security;
alter table public.pwa_install_events enable row level security;
alter table public.daily_rollups enable row level security;
alter table public.tool_usage_daily enable row level security;
alter table public.search_console_daily enable row level security;
alter table public.apk_downloads_snapshots enable row level security;
alter table public.pwa_installs_daily enable row level security;
alter table public.revenue_entries enable row level security;
alter table public.traction_job_runs enable row level security;
revoke all on function public.traction_touch_visitor_day(text,text,text) from public, anon, authenticated;
revoke all on function public.traction_record_install(text,text,text) from public, anon, authenticated;
revoke all on function public.traction_distinct_active(date,date,text) from public, anon, authenticated;
revoke all on function public.traction_monthly_active(date) from public, anon, authenticated;
revoke all on public.traction_activity_days from public, anon, authenticated;
