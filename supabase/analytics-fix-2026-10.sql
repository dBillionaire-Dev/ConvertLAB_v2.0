-- Clinexia analytics fix (October 2026)
-- Run once in the Supabase SQL Editor. Safe to re-run.
--
-- What it changes
--   1. convertlab_usage_summary_v3 now reports a real 7-day figure. `thisWeek`
--      used to be a copy of `today`, so the dashboard had no number that could be
--      compared with the "this week" count a user sees on their own device.
--   2. Adds calculationsLast7Days per user, next to the existing 14-day figure.
--   3. Adds an index so the per-user counts stay fast as events grow.
--
-- No data is modified or deleted.

create index if not exists calculation_events_anonymous_occurred_idx
  on public.calculation_events (anonymous_id, occurred_at desc);

create or replace function public.convertlab_usage_summary_v3()
returns json
language sql
security definer
set search_path = public
as $$
  with bounds as (
    select (now() at time zone 'Africa/Lagos')::date as local_today
  ),
  totals as (
    select
      count(*)::int as total,
      count(*) filter (where occurred_at >= ((select local_today from bounds)::timestamp at time zone 'Africa/Lagos'))::int as today,
      count(*) filter (where occurred_at >= (((select local_today from bounds) - 6)::timestamp at time zone 'Africa/Lagos'))::int as last_7_days,
      count(*) filter (where occurred_at >= (((select local_today from bounds) - 13)::timestamp at time zone 'Africa/Lagos'))::int as last_14_days,
      count(*) filter (where was_offline = true)::int as offline_synced,
      count(*) filter (where app_version = '2.0.0-history-backfill')::int as history_backfilled
    from public.calculation_events
  ),
  users as (
    select
      count(*)::int as total_users,
      count(*) filter (where last_seen_at >= ((select local_today from bounds)::timestamp at time zone 'Africa/Lagos'))::int as users_today,
      count(*) filter (where last_seen_at >= (((select local_today from bounds) - 13)::timestamp at time zone 'Africa/Lagos'))::int as users_last_14_days,
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
        count(e.id) filter (
          where e.occurred_at >= ((select local_today from bounds)::timestamp at time zone 'Africa/Lagos')
        )::int as "calculationsToday",
        count(e.id) filter (
          where e.occurred_at >= (((select local_today from bounds) - 6)::timestamp at time zone 'Africa/Lagos')
        )::int as "calculationsLast7Days",
        count(e.id) filter (
          where e.occurred_at >= (((select local_today from bounds) - 13)::timestamp at time zone 'Africa/Lagos')
        )::int as "calculationsLast14Days",
        count(e.id)::int as "totalCalculations",
        (array_agg(e.calculator_name order by e.occurred_at desc)
          filter (where e.id is not null))[1] as "lastCalculatorName"
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
        count(e.id) filter (where e.occurred_at >= ((select local_today from bounds)::timestamp at time zone 'Africa/Lagos'))::int as "calculationsToday",
        count(e.id) filter (where e.occurred_at >= (((select local_today from bounds) - 6)::timestamp at time zone 'Africa/Lagos'))::int as "calculationsLast7Days",
        count(e.id) filter (where e.occurred_at >= (((select local_today from bounds) - 13)::timestamp at time zone 'Africa/Lagos'))::int as "calculationsLast14Days",
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
      select to_char(d.day::date, 'YYYY-MM-DD') as date,
             count(e.id)::int as uses
      from generate_series(
        (select local_today from bounds) - 13,
        (select local_today from bounds),
        interval '1 day'
      ) d(day)
      left join public.calculation_events e
        on e.occurred_at >= (d.day::date::timestamp at time zone 'Africa/Lagos')
       and e.occurred_at < ((d.day::date + 1)::timestamp at time zone 'Africa/Lagos')
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
    'thisWeek', totals.last_7_days,
    'last7Days', totals.last_7_days,
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


-- ---------------------------------------------------------------------------
-- Optional diagnostics (read only). Compare these with what a user's own
-- device shows to confirm the gap has closed after they next open the app.
-- Windows use Africa/Lagos calendar days, the same as the dashboard.
--
-- Per-device calculations over the last 7 and 14 days:
--
-- select d.display_name,
--        count(e.id) filter (where e.occurred_at >= ((((now() at time zone 'Africa/Lagos')::date - 6))::timestamp at time zone 'Africa/Lagos'))  as last_7_days,
--        count(e.id) filter (where e.occurred_at >= ((((now() at time zone 'Africa/Lagos')::date - 13))::timestamp at time zone 'Africa/Lagos')) as last_14_days,
--        count(e.id) filter (where e.was_offline) as synced_from_offline,
--        count(e.id) filter (where e.app_version = '2.0.0-history-backfill') as recovered_from_history
-- from public.convertlab_devices d
-- left join public.calculation_events e on e.anonymous_id = d.anonymous_id
-- group by d.display_name
-- order by last_14_days desc;
