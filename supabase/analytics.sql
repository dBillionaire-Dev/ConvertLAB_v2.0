-- ConvertLAB anonymous calculation analytics
-- Run this once in the Supabase SQL Editor.

create table if not exists public.calculation_events (
  id uuid primary key,
  anonymous_id text not null,
  calculator_id text not null,
  calculator_name text not null,
  category text not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  app_version text not null,
  was_offline boolean not null default false,
  source text not null default 'web',
  environment text not null default 'production'
);

create index if not exists calculation_events_calculator_idx
  on public.calculation_events (calculator_id);

create index if not exists calculation_events_category_idx
  on public.calculation_events (category);

create index if not exists calculation_events_occurred_at_idx
  on public.calculation_events (occurred_at);

alter table public.calculation_events
  add column if not exists was_offline boolean not null default false;

alter table public.calculation_events
  add column if not exists source text not null default 'web';

alter table public.calculation_events
  add column if not exists environment text not null default 'production';

alter table public.calculation_events enable row level security;

-- No public/browser policies are created. The Next.js server uses the
-- Supabase service-role key for inserts and management queries.

create or replace function public.convertlab_usage_summary_v2()
returns json
language sql
security definer
set search_path = public
as $$
  with bounds as (
    select
      current_date::date as today,
      (current_date - interval '6 days')::date as week_start,
      (current_date - interval '13 days')::date as chart_start
  ),
  totals as (
    select
      count(*)::int as total,
      count(*) filter (where occurred_at >= current_date)::int as today,
      count(*) filter (where occurred_at >= current_date - interval '6 days')::int as this_week,
      count(*) filter (where was_offline = true)::int as offline_synced,
      count(*) filter (where app_version = '2.0.0-history-backfill')::int as history_backfilled
    from public.calculation_events
  ),
  top_calculators as (
    select coalesce(json_agg(row_to_json(x) order by x.uses desc), '[]'::json)
    from (
      select calculator_id as "calculatorId", max(calculator_name) as "calculatorName", count(*)::int as uses
      from public.calculation_events
      group by calculator_id
      order by count(*) desc
      limit 10
    ) x
  ),
  categories as (
    select coalesce(json_agg(row_to_json(x) order by x.uses desc), '[]'::json)
    from (
      select category, count(*)::int as uses
      from public.calculation_events
      group by category
      order by count(*) desc
    ) x
  ),
  sources as (
    select coalesce(json_agg(row_to_json(x) order by x.uses desc), '[]'::json)
    from (
      select source, count(*)::int as uses
      from public.calculation_events
      group by source
      order by count(*) desc
    ) x
  ),
  environments as (
    select coalesce(json_agg(row_to_json(x) order by x.uses desc), '[]'::json)
    from (
      select environment, count(*)::int as uses
      from public.calculation_events
      group by environment
      order by count(*) desc
    ) x
  ),
  versions as (
    select coalesce(json_agg(row_to_json(x) order by x.uses desc), '[]'::json)
    from (
      select app_version as "appVersion", count(*)::int as uses
      from public.calculation_events
      group by app_version
      order by count(*) desc
    ) x
  ),
  daily as (
    select coalesce(json_agg(row_to_json(x) order by x.date), '[]'::json)
    from (
      select to_char(d.day, 'YYYY-MM-DD') as date,
             count(e.id)::int as uses
      from generate_series(
        (select chart_start from bounds),
        current_date,
        interval '1 day'
      ) d(day)
      left join public.calculation_events e
        on e.occurred_at >= d.day
       and e.occurred_at < d.day + interval '1 day'
      group by d.day
      order by d.day
    ) x
  ),
  last_event as (
    select row_to_json(x) as event
    from (
      select calculator_name as "calculatorName",
             source,
             environment,
             app_version as "appVersion",
             received_at as "receivedAt"
      from public.calculation_events
      order by received_at desc
      limit 1
    ) x
  )
  select json_build_object(
    'total', totals.total,
    'today', totals.today,
    'thisWeek', totals.this_week,
    'offlineSynced', totals.offline_synced,
    'historyBackfilled', totals.history_backfilled,
    'topCalculators', (select * from top_calculators),
    'categories', (select * from categories),
    'sources', (select * from sources),
    'environments', (select * from environments),
    'versions', (select * from versions),
    'daily', (select * from daily),
    'lastEvent', (select event from last_event)
  )
  from totals;
$$;

revoke all on function public.convertlab_usage_summary_v2() from public;
grant execute on function public.convertlab_usage_summary_v2() to service_role;
notify pgrst, 'reload schema';

-- Anonymous device/presence directory. A device is identified only by the
-- locally generated anonymous ID; no IP address or personal identity is stored.
create table if not exists public.convertlab_devices (
  anonymous_id text primary key,
  display_name text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_calculation_at timestamptz,
  source text not null default 'web',
  environment text not null default 'production',
  app_version text not null default 'unknown'
);

create index if not exists convertlab_devices_last_seen_idx
  on public.convertlab_devices (last_seen_at);

create index if not exists convertlab_devices_last_calculation_idx
  on public.convertlab_devices (last_calculation_at);

alter table public.convertlab_devices enable row level security;

revoke all on table public.convertlab_devices from public;
revoke all on table public.convertlab_devices from anon;
revoke all on table public.convertlab_devices from authenticated;
grant all on table public.convertlab_devices to service_role;

-- Keep the anonymous device directory in sync with calculation events. This
-- makes the device/user population authoritative even if a presence heartbeat
-- is missed. No IP address or personal identity is stored.
create or replace function public.convertlab_display_name(p_anonymous_id text)
returns text
language sql
immutable
strict
as $$
  select 'User-' || left(upper(right(regexp_replace(p_anonymous_id, '[^a-zA-Z0-9]', '', 'g'), 8)), 6);
$$;

create or replace function public.convertlab_sync_device_from_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.convertlab_devices (
    anonymous_id, display_name, first_seen_at, last_seen_at,
    last_calculation_at, source, environment, app_version
  )
  values (
    new.anonymous_id,
    public.convertlab_display_name(new.anonymous_id),
    coalesce(new.occurred_at, now()),
    now(),
    new.occurred_at,
    coalesce(new.source, 'web'),
    coalesce(new.environment, 'production'),
    coalesce(new.app_version, 'unknown')
  )
  on conflict (anonymous_id) do update set
    last_seen_at = greatest(public.convertlab_devices.last_seen_at, now()),
    last_calculation_at = greatest(
      coalesce(public.convertlab_devices.last_calculation_at, '-infinity'::timestamptz),
      excluded.last_calculation_at
    ),
    source = excluded.source,
    environment = excluded.environment,
    app_version = excluded.app_version;

  return new;
end;
$$;

drop trigger if exists calculation_events_sync_device on public.calculation_events;
create trigger calculation_events_sync_device
after insert on public.calculation_events
for each row execute function public.convertlab_sync_device_from_event();

-- Backfill the device directory from every calculation ever recorded.
-- Existing rows are updated without changing their stable anonymous IDs.
insert into public.convertlab_devices (
  anonymous_id, display_name, first_seen_at, last_seen_at,
  last_calculation_at, source, environment, app_version
)
select
  e.anonymous_id,
  public.convertlab_display_name(e.anonymous_id),
  min(e.occurred_at),
  max(e.occurred_at),
  max(e.occurred_at),
  (array_agg(e.source order by e.occurred_at desc))[1],
  (array_agg(e.environment order by e.occurred_at desc))[1],
  (array_agg(e.app_version order by e.occurred_at desc))[1]
from public.calculation_events e
group by e.anonymous_id
on conflict (anonymous_id) do update set
  first_seen_at = least(public.convertlab_devices.first_seen_at, excluded.first_seen_at),
  last_calculation_at = greatest(
    coalesce(public.convertlab_devices.last_calculation_at, '-infinity'::timestamptz),
    excluded.last_calculation_at
  ),
  source = excluded.source,
  environment = excluded.environment,
  app_version = excluded.app_version;

create or replace function public.convertlab_usage_summary_v3()
returns json
language sql
security definer
set search_path = public
as $$
  with totals as (
    select
      count(*)::int as total,
      count(*) filter (where occurred_at >= current_date)::int as today,
      count(*) filter (where occurred_at >= current_date - interval '13 days')::int as last_14_days,
      count(*) filter (where was_offline = true)::int as offline_synced,
      count(*) filter (where app_version = '2.0.0-history-backfill')::int as history_backfilled
    from public.calculation_events
  ),
  users as (
    select
      count(*)::int as total_users,
      count(*) filter (where last_seen_at >= current_date)::int as users_today,
      count(*) filter (where last_seen_at >= current_date - interval '13 days')::int as users_last_14_days,
      count(*) filter (
        where greatest(
          last_seen_at,
          coalesce(last_calculation_at, '-infinity'::timestamptz)
        ) >= now() - interval '5 minutes'
      )::int as active_users
    from public.convertlab_devices
  ),
  active_users as (
    select coalesce(json_agg(row_to_json(x) order by x."lastSeenAt" desc), '[]'::json)
    from (
      select
        d.anonymous_id as "anonymousId",
        d.display_name as "displayName",
        d.source,
        d.environment,
        d.app_version as "appVersion",
        d.first_seen_at as "firstSeenAt",
        d.last_seen_at as "lastSeenAt",
        d.last_calculation_at as "lastCalculationAt",
        count(e.id) filter (where e.occurred_at >= current_date)::int as "calculationsToday"
      from public.convertlab_devices d
      left join public.calculation_events e on e.anonymous_id = d.anonymous_id
      where greatest(
        d.last_seen_at,
        coalesce(d.last_calculation_at, '-infinity'::timestamptz)
      ) >= now() - interval '5 minutes'
      group by d.anonymous_id, d.display_name, d.source, d.environment, d.app_version,
               d.first_seen_at, d.last_seen_at, d.last_calculation_at
      order by d.last_seen_at desc
      limit 100
    ) x
  ),
  all_users as (
    select coalesce(json_agg(row_to_json(x) order by x."lastSeenAt" desc), '[]'::json)
    from (
      select
        d.anonymous_id as "anonymousId",
        d.display_name as "displayName",
        d.source,
        d.environment,
        d.app_version as "appVersion",
        d.first_seen_at as "firstSeenAt",
        d.last_seen_at as "lastSeenAt",
        latest.last_calculation_at as "lastCalculationAt",
        latest.calculator_name as "lastCalculatorName",
        count(e.id) filter (where e.occurred_at >= current_date)::int as "calculationsToday",
        count(e.id) filter (where e.occurred_at >= current_date - interval '13 days')::int as "calculationsLast14Days",
        count(e.id)::int as "totalCalculations"
      from public.convertlab_devices d
      left join public.calculation_events e on e.anonymous_id = d.anonymous_id
      left join lateral (
        select
          ce.occurred_at as last_calculation_at,
          ce.calculator_name
        from public.calculation_events ce
        where ce.anonymous_id = d.anonymous_id
        order by ce.occurred_at desc, ce.received_at desc
        limit 1
      ) latest on true
      group by d.anonymous_id, d.display_name, d.source, d.environment, d.app_version,
               d.first_seen_at, d.last_seen_at, latest.last_calculation_at, latest.calculator_name
    ) x
  ),
  top_calculators as (
    select coalesce(json_agg(row_to_json(x) order by x.uses desc), '[]'::json)
    from (
      select calculator_id as "calculatorId", max(calculator_name) as "calculatorName", count(*)::int as uses
      from public.calculation_events
      group by calculator_id
      order by count(*) desc
      limit 10
    ) x
  ),
  categories as (
    select coalesce(json_agg(row_to_json(x) order by x.uses desc), '[]'::json)
    from (
      select category, count(*)::int as uses
      from public.calculation_events
      group by category
      order by count(*) desc
    ) x
  ),
  sources as (
    select coalesce(json_agg(row_to_json(x) order by x.uses desc), '[]'::json)
    from (
      select source, count(*)::int as uses
      from public.calculation_events
      group by source
      order by count(*) desc
    ) x
  ),
  environments as (
    select coalesce(json_agg(row_to_json(x) order by x.uses desc), '[]'::json)
    from (
      select environment, count(*)::int as uses
      from public.calculation_events
      group by environment
      order by count(*) desc
    ) x
  ),
  versions as (
    select coalesce(json_agg(row_to_json(x) order by x.uses desc), '[]'::json)
    from (
      select app_version as "appVersion", count(*)::int as uses
      from public.calculation_events
      group by app_version
      order by count(*) desc
    ) x
  ),
  daily as (
    select coalesce(json_agg(row_to_json(x) order by x.date), '[]'::json)
    from (
      select to_char(d.day, 'YYYY-MM-DD') as date,
             count(e.id)::int as uses
      from generate_series(current_date - interval '13 days', current_date, interval '1 day') d(day)
      left join public.calculation_events e
        on e.occurred_at >= d.day and e.occurred_at < d.day + interval '1 day'
      group by d.day
      order by d.day
    ) x
  ),
  last_event as (
    select row_to_json(x) as event
    from (
      select calculator_name as "calculatorName",
             source,
             environment,
             app_version as "appVersion",
             received_at as "receivedAt"
      from public.calculation_events
      order by received_at desc
      limit 1
    ) x
  )
  select json_build_object(
    'total', totals.total,
    'today', totals.today,
    'last14Days', totals.last_14_days,
    'thisWeek', totals.today,
    'offlineSynced', totals.offline_synced,
    'historyBackfilled', totals.history_backfilled,
    'activeUsers', users.active_users,
    'uniqueUsersToday', users.users_today,
    'uniqueUsersLast14Days', users.users_last_14_days,
    'totalUsers', users.total_users,
    'activeUsersList', (select * from active_users),
    'allUsersList', (select * from all_users),
    'topCalculators', (select * from top_calculators),
    'categories', (select * from categories),
    'sources', (select * from sources),
    'environments', (select * from environments),
    'versions', (select * from versions),
    'daily', (select * from daily),
    'lastEvent', (select event from last_event)
  )
  from totals, users;
$$;

revoke all on function public.convertlab_usage_summary_v3() from public;
grant execute on function public.convertlab_usage_summary_v3() to service_role;
notify pgrst, 'reload schema';
