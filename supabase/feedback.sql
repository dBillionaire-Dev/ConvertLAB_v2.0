-- Clinexia user feedback (run once in the Supabase SQL editor; safe to re-run).
-- Privacy: answers are anonymous. The only identifier is the same random anonymous id the usage statistics use,
-- kept so one device cannot submit twice per round. No name, email, phone or IP address is collected.

create table if not exists public.feedback_settings (
  id integer primary key default 1 check (id = 1),     -- a single settings row
  enabled boolean not null default true,
  survey_version integer not null default 1,           -- raise it to ask everyone again
  remind_after_hours integer not null default 7 check (remind_after_hours between 0 and 24),
  max_reminders integer not null default 3 check (max_reminders between 0 and 50),
  updated_at timestamptz not null default now()
);
insert into public.feedback_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.feedback_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  survey_version integer not null,
  anonymous_id text not null,
  environment text not null default 'production',
  platform text,
  app_version text,
  rating integer not null check (rating between 1 and 5),
  background text not null check (background in ('medical','non_medical')),
  role text not null,
  devices text[] not null default '{}',
  use_context text not null check (use_context in ('personal','office','both')),
  office_type text,
  pay_interest text not null check (pay_interest in ('yes','maybe','no')),
  pay_who text,
  price_individual text,
  price_team text,
  improve text,
  missing text,
  other text,
  unique (anonymous_id, survey_version)
);
create index if not exists feedback_responses_version_idx on public.feedback_responses (survey_version, created_at desc);

alter table public.feedback_settings enable row level security;
alter table public.feedback_responses enable row level security;
-- No policies: only the server (service role) reads or writes these tables.
