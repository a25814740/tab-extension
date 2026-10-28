-- Taboard migration:
-- 1) Membership permission fixes + safer defaults
-- 2) Theme/Template marketplace base tables

create extension if not exists pgcrypto;

-- -----------------------------
-- Membership / entitlement base
-- -----------------------------

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_type text not null default 'trial',
  status text not null default 'trial_active',
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  paid_starts_at timestamptz,
  paid_ends_at timestamptz,
  payment_provider text,
  provider_subscription_id text,
  provider_order_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_key text not null,
  is_enabled boolean not null default false,
  expires_at timestamptz,
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  currency text not null default 'TWD',
  status text not null default 'pending',
  provider text not null,
  provider_transaction_id text,
  provider_order_id text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_memberships_user on public.memberships(user_id);
create unique index if not exists idx_entitlements_user_feature on public.entitlements(user_id, feature_key);
create index if not exists idx_payments_user on public.payments(user_id);
create index if not exists idx_payments_provider_order on public.payments(provider_order_id);
create index if not exists idx_payment_events_user on public.payment_events(user_id);

grant usage on schema public to authenticated;
grant select, insert, update on table public.memberships to authenticated;
grant select on table public.entitlements to authenticated;
grant select on table public.payments to authenticated;
grant select on table public.payment_events to authenticated;

grant all privileges on table public.memberships to service_role;
grant all privileges on table public.entitlements to service_role;
grant all privileges on table public.payments to service_role;
grant all privileges on table public.payment_events to service_role;

alter table public.memberships enable row level security;
alter table public.entitlements enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;

drop policy if exists "memberships_select_own" on public.memberships;
create policy "memberships_select_own"
on public.memberships
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "memberships_insert_own" on public.memberships;
create policy "memberships_insert_own"
on public.memberships
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "memberships_update_own" on public.memberships;
create policy "memberships_update_own"
on public.memberships
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "memberships_write_service" on public.memberships;
create policy "memberships_write_service"
on public.memberships
for all
to service_role
using (true)
with check (true);

drop policy if exists "entitlements_select_own" on public.entitlements;
create policy "entitlements_select_own"
on public.entitlements
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "entitlements_write_service" on public.entitlements;
create policy "entitlements_write_service"
on public.entitlements
for all
to service_role
using (true)
with check (true);

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
on public.payments
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "payments_write_service" on public.payments;
create policy "payments_write_service"
on public.payments
for all
to service_role
using (true)
with check (true);

drop policy if exists "payment_events_select_own" on public.payment_events;
create policy "payment_events_select_own"
on public.payment_events
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "payment_events_write_service" on public.payment_events;
create policy "payment_events_write_service"
on public.payment_events
for all
to service_role
using (true)
with check (true);

-- Ensure workspace_members.id auto-fills if SQL insert omits id.
do $$
declare
  id_type text;
begin
  select data_type
  into id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'workspace_members'
    and column_name = 'id'
  limit 1;

  if id_type = 'uuid' then
    execute 'alter table public.workspace_members alter column id set default gen_random_uuid()';
  elsif id_type is not null then
    execute 'alter table public.workspace_members alter column id set default (gen_random_uuid()::text)';
  end if;
end $$;

-- --------------------------------
-- Theme / template marketplace base
-- --------------------------------

create table if not exists public.theme_assets (
  id uuid primary key default gen_random_uuid(),
  asset_type text not null check (asset_type in ('theme', 'template')),
  slug text not null unique,
  name text not null,
  description text not null default '',
  author_user_id uuid references auth.users(id) on delete set null,
  author_name text not null default '',
  is_official boolean not null default false,
  is_public boolean not null default false,
  price_twd integer not null default 0 check (price_twd >= 0),
  revenue_share_percent integer not null default 70 check (revenue_share_percent between 0 and 100),
  preview text not null default '',
  tags text[] not null default '{}'::text[],
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.theme_asset_purchases (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.theme_assets(id) on delete cascade,
  buyer_user_id uuid not null references auth.users(id) on delete cascade,
  amount_twd integer not null default 0,
  status text not null default 'pending',
  payment_provider text,
  provider_order_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.theme_asset_installs (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.theme_assets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid,
  is_active boolean not null default true,
  installed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(asset_id, user_id, workspace_id)
);

create index if not exists idx_theme_assets_public on public.theme_assets(is_public, is_official, asset_type);
create index if not exists idx_theme_assets_author on public.theme_assets(author_user_id);
create index if not exists idx_theme_purchase_buyer on public.theme_asset_purchases(buyer_user_id);
create index if not exists idx_theme_install_user on public.theme_asset_installs(user_id);

grant select on table public.theme_assets to anon;
grant select, insert, update, delete on table public.theme_assets to authenticated;
grant select, insert, update, delete on table public.theme_asset_purchases to authenticated;
grant select, insert, update, delete on table public.theme_asset_installs to authenticated;

grant all privileges on table public.theme_assets to service_role;
grant all privileges on table public.theme_asset_purchases to service_role;
grant all privileges on table public.theme_asset_installs to service_role;

alter table public.theme_assets enable row level security;
alter table public.theme_asset_purchases enable row level security;
alter table public.theme_asset_installs enable row level security;

drop policy if exists "theme_assets_select_public" on public.theme_assets;
create policy "theme_assets_select_public"
on public.theme_assets
for select
to anon, authenticated
using (is_public or is_official or author_user_id = auth.uid());

drop policy if exists "theme_assets_insert_own" on public.theme_assets;
create policy "theme_assets_insert_own"
on public.theme_assets
for insert
to authenticated
with check (author_user_id = auth.uid() and is_official = false);

drop policy if exists "theme_assets_update_own" on public.theme_assets;
create policy "theme_assets_update_own"
on public.theme_assets
for update
to authenticated
using (author_user_id = auth.uid() and is_official = false)
with check (author_user_id = auth.uid() and is_official = false);

drop policy if exists "theme_assets_delete_own" on public.theme_assets;
create policy "theme_assets_delete_own"
on public.theme_assets
for delete
to authenticated
using (author_user_id = auth.uid() and is_official = false);

drop policy if exists "theme_assets_service_all" on public.theme_assets;
create policy "theme_assets_service_all"
on public.theme_assets
for all
to service_role
using (true)
with check (true);

drop policy if exists "theme_purchase_select_own" on public.theme_asset_purchases;
create policy "theme_purchase_select_own"
on public.theme_asset_purchases
for select
to authenticated
using (buyer_user_id = auth.uid());

drop policy if exists "theme_purchase_insert_own" on public.theme_asset_purchases;
create policy "theme_purchase_insert_own"
on public.theme_asset_purchases
for insert
to authenticated
with check (buyer_user_id = auth.uid());

drop policy if exists "theme_purchase_service_all" on public.theme_asset_purchases;
create policy "theme_purchase_service_all"
on public.theme_asset_purchases
for all
to service_role
using (true)
with check (true);

drop policy if exists "theme_install_select_own" on public.theme_asset_installs;
create policy "theme_install_select_own"
on public.theme_asset_installs
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "theme_install_insert_own" on public.theme_asset_installs;
create policy "theme_install_insert_own"
on public.theme_asset_installs
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "theme_install_update_own" on public.theme_asset_installs;
create policy "theme_install_update_own"
on public.theme_asset_installs
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "theme_install_delete_own" on public.theme_asset_installs;
create policy "theme_install_delete_own"
on public.theme_asset_installs
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "theme_install_service_all" on public.theme_asset_installs;
create policy "theme_install_service_all"
on public.theme_asset_installs
for all
to service_role
using (true)
with check (true);
