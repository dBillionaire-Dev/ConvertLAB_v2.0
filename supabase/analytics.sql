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
