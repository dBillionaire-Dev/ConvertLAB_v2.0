-- Clinexia accounts and subscriptions (run once in the Supabase SQL editor; safe to re-run).
-- DORMANT: nothing here is used until BILLING_ENABLED=true is set on the server. Accounts live in Supabase Auth (auth.users);
-- these tables hold profiles, organisations, seats, subscriptions, orders and the audit trail. Every table has row level
-- security ON with NO policies: only the server (service role) reads or writes them, never the browser.
-- Money is stored in KOBO (1 naira = 100 kobo).

create table if not exists public.billing_settings (
  id integer primary key default 1 check (id = 1),
  config jsonb not null default '{}'::jsonb,            -- price/discount overrides, merged over the code defaults
  updated_at timestamptz not null default now()
);
insert into public.billing_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.billing_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  account_type text not null check (account_type in ('individual','enterprise')),
  background text check (background in ('medical','non_medical')),
  role text,                                            -- descriptive only; never used for access decisions
  created_at timestamptz not null default now()
);

create table if not exists public.billing_organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  org_type text not null check (org_type in ('laboratory','hospital','pharmacy','clinic','university','other_healthcare')),
  contact_phone text,
  country text,
  owner_user_id uuid not null references auth.users(id),
  seats integer not null default 0 check (seats between 0 and 5000),   -- paid seats; set by a verified payment or a platform admin
  managed_status text not null default 'none' check (managed_status in ('none','requested','verified','rejected')),
  suspended boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.billing_organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','staff')),
  all_specialties boolean not null default true,
  specialties text[] not null default '{}',
  joined_at timestamptz not null default now(),
  unique (org_id, user_id)                              -- a person can join an organisation only once
);
create index if not exists billing_memberships_user_idx on public.billing_memberships (user_id);
create unique index if not exists billing_one_owner_idx on public.billing_memberships (org_id) where role = 'owner';

create table if not exists public.billing_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.billing_organisations(id) on delete cascade,
  email text not null check (email = lower(email)),
  role text not null check (role in ('admin','staff')),
  all_specialties boolean not null default false,
  specialties text[] not null default '{}',
  token_hash text not null unique,                      -- only the hash is stored; the link carries the token
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  expires_at timestamptz not null,
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create unique index if not exists billing_invitations_pending_idx on public.billing_invitations (org_id, email) where status = 'pending';

create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  org_id uuid references public.billing_organisations(id) on delete cascade,
  plan text not null check (plan in ('specialty','all_access')),
  specialties text[] not null default '{}',
  seats integer not null default 1 check (seats between 1 and 5000),
  status text not null default 'pending' check (status in ('pending','active','past_due','cancelled','expired')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((user_id is null) <> (org_id is null))         -- belongs to exactly one person or one organisation
);
create unique index if not exists billing_subscriptions_user_idx on public.billing_subscriptions (user_id) where user_id is not null;
create unique index if not exists billing_subscriptions_org_idx on public.billing_subscriptions (org_id) where org_id is not null;

create table if not exists public.billing_orders (
  reference text primary key,
  subscription_id uuid not null references public.billing_subscriptions(id) on delete cascade,
  user_id uuid references auth.users(id),
  org_id uuid references public.billing_organisations(id),
  payer_user_id uuid not null references auth.users(id),
  amount_kobo bigint not null check (amount_kobo > 0),
  currency text not null default 'NGN',
  status text not null default 'pending' check (status in ('pending','paid','mismatch')),
  target jsonb not null,                                -- plan, specialties, seats the payment buys
  quote jsonb not null,                                 -- the full price breakdown, including any discount, as charged
  period_months integer not null default 1 check (period_months between 1 and 24),
  provider_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists billing_orders_sub_idx on public.billing_orders (subscription_id, created_at desc);

create table if not exists public.billing_webhook_events (
  event_key text primary key,                           -- duplicate deliveries collide here
  type text not null,
  received_at timestamptz not null default now()
);

create table if not exists public.billing_audit_events (
  id bigserial primary key,
  at timestamptz not null default now(),
  org_id uuid,
  actor_user_id uuid,
  actor_kind text not null default 'user' check (actor_kind in ('user','platform_admin','system')),
  action text not null,
  detail jsonb not null default '{}'::jsonb              -- never put passwords, tokens or card data here
);
create index if not exists billing_audit_org_idx on public.billing_audit_events (org_id, at desc);

alter table public.billing_settings enable row level security;
alter table public.billing_profiles enable row level security;
alter table public.billing_organisations enable row level security;
alter table public.billing_memberships enable row level security;
alter table public.billing_invitations enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.billing_orders enable row level security;
alter table public.billing_webhook_events enable row level security;
alter table public.billing_audit_events enable row level security;

-- ---------------------------------------------------------------------------------------------------------------------
-- Atomic operations. Each takes a row lock on the organisation (or order) so concurrent requests cannot over-allocate seats
-- or apply one payment twice.
-- ---------------------------------------------------------------------------------------------------------------------

-- Seat rule: members + pending, unexpired invitations must stay within billing_organisations.seats.
create or replace function public.billing_create_invitation(
  p_org uuid, p_email text, p_role text, p_all boolean, p_specs text[], p_token_hash text, p_expires timestamptz, p_by uuid
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_seats integer; v_members integer; v_pending integer; v_id uuid;
begin
  select seats into v_seats from billing_organisations where id = p_org for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'no_capacity'); end if;

  update billing_invitations set status = 'expired' where org_id = p_org and status = 'pending' and expires_at <= now();

  if exists (select 1 from billing_memberships m join auth.users u on u.id = m.user_id where m.org_id = p_org and lower(u.email) = lower(p_email)) then
    return jsonb_build_object('ok', false, 'reason', 'already_member');
  end if;
  if exists (select 1 from billing_invitations where org_id = p_org and email = lower(p_email) and status = 'pending') then
    return jsonb_build_object('ok', false, 'reason', 'duplicate_invite');
  end if;

  select count(*) into v_members from billing_memberships where org_id = p_org;
  select count(*) into v_pending from billing_invitations where org_id = p_org and status = 'pending' and expires_at > now();
  if v_members + v_pending >= v_seats then return jsonb_build_object('ok', false, 'reason', 'no_capacity'); end if;

  insert into billing_invitations (org_id, email, role, all_specialties, specialties, token_hash, expires_at, invited_by)
  values (p_org, lower(p_email), p_role, p_all, coalesce(p_specs, '{}'), p_token_hash, p_expires, p_by)
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

create or replace function public.billing_accept_invitation(p_token_hash text, p_user uuid, p_email text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v billing_invitations%rowtype;
begin
  select * into v from billing_invitations where token_hash = p_token_hash for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'invalid'); end if;
  if v.status = 'accepted' then return jsonb_build_object('ok', false, 'reason', 'used'); end if;
  if v.status = 'revoked' then return jsonb_build_object('ok', false, 'reason', 'revoked'); end if;
  if v.status = 'expired' or v.expires_at <= now() then return jsonb_build_object('ok', false, 'reason', 'expired'); end if;
  if lower(p_email) <> v.email then return jsonb_build_object('ok', false, 'reason', 'wrong_email'); end if;

  perform 1 from billing_organisations where id = v.org_id for update;
  if exists (select 1 from billing_memberships where org_id = v.org_id and user_id = p_user) then
    return jsonb_build_object('ok', false, 'reason', 'already_member');
  end if;
  insert into billing_memberships (org_id, user_id, role, all_specialties, specialties)
  values (v.org_id, p_user, v.role, v.all_specialties, v.specialties);
  update billing_invitations set status = 'accepted' where id = v.id;      -- the seat was already reserved by the invitation
  return jsonb_build_object('ok', true, 'org_id', v.org_id);
end $$;

-- Marks an order paid and activates the subscription in ONE transaction. Safe to call any number of times.
-- Policy (no proration): same plan = extend from the later of now/current end; a different plan = fresh period from now.
create or replace function public.billing_apply_paid_order(p_reference text, p_amount bigint, p_currency text, p_provider_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o billing_orders%rowtype; s billing_subscriptions%rowtype; t jsonb; v_same boolean; v_from timestamptz; v_end timestamptz;
        v_new_specs text[]; v_owner_kind text; v_owner_id uuid;
begin
  select * into o from billing_orders where reference = p_reference for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'unknown_reference'); end if;
  v_owner_kind := case when o.org_id is not null then 'org' else 'user' end;
  v_owner_id := coalesce(o.org_id, o.user_id);

  if o.status = 'paid' then
    return jsonb_build_object('ok', true, 'already', true, 'owner_kind', v_owner_kind, 'owner_id', v_owner_id);
  end if;
  if upper(p_currency) <> o.currency then
    update billing_orders set status = 'mismatch' where reference = p_reference;
    return jsonb_build_object('ok', false, 'reason', 'currency_mismatch');
  end if;
  if p_amount <> o.amount_kobo then
    update billing_orders set status = 'mismatch' where reference = p_reference;
    return jsonb_build_object('ok', false, 'reason', 'amount_mismatch');
  end if;

  select * into s from billing_subscriptions where id = o.subscription_id for update;
  t := o.target;
  select coalesce(array_agg(x order by x), '{}') into v_new_specs from jsonb_array_elements_text(coalesce(t->'specialties', '[]'::jsonb)) x;

  v_same := s.plan = (t->>'plan')
            and s.seats = (t->>'seats')::integer
            and (select coalesce(array_agg(x order by x), '{}') from unnest(s.specialties) x) = v_new_specs;
  v_from := case when v_same and s.current_period_end is not null then greatest(s.current_period_end, now()) else now() end;
  v_end := v_from + make_interval(months => o.period_months);              -- calendar months, end-of-month clamped (database time zone: UTC on Supabase)

  update billing_subscriptions
     set plan = t->>'plan', specialties = v_new_specs, seats = (t->>'seats')::integer, status = 'active',
         current_period_end = v_end, cancel_at_period_end = false, updated_at = now()
   where id = s.id;
  if s.org_id is not null then
    update billing_organisations set seats = (t->>'seats')::integer where id = s.org_id;
  end if;
  update billing_orders set status = 'paid', paid_at = now(), provider_id = p_provider_id where reference = p_reference;
  insert into billing_audit_events (org_id, actor_user_id, actor_kind, action, detail)
  values (o.org_id, o.payer_user_id, 'system', 'payment.applied', jsonb_build_object('reference', p_reference, 'amount_kobo', o.amount_kobo, 'period_end', v_end));
  return jsonb_build_object('ok', true, 'already', false, 'owner_kind', v_owner_kind, 'owner_id', v_owner_id);
end $$;

create or replace function public.billing_claim_webhook(p_key text, p_type text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  insert into billing_webhook_events (event_key, type) values (p_key, p_type) on conflict do nothing;
  return found;
end $$;

revoke all on function public.billing_create_invitation(uuid, text, text, boolean, text[], text, timestamptz, uuid) from public, anon, authenticated;
revoke all on function public.billing_accept_invitation(text, uuid, text) from public, anon, authenticated;
revoke all on function public.billing_apply_paid_order(text, bigint, text, text) from public, anon, authenticated;
revoke all on function public.billing_claim_webhook(text, text) from public, anon, authenticated;
grant execute on function public.billing_create_invitation(uuid, text, text, boolean, text[], text, timestamptz, uuid) to service_role;
grant execute on function public.billing_accept_invitation(text, uuid, text) to service_role;
grant execute on function public.billing_apply_paid_order(text, bigint, text, text) to service_role;
grant execute on function public.billing_claim_webhook(text, text) to service_role;
