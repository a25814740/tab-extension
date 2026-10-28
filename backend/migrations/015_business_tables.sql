-- Migration: business metadata tables (plan B)
create extension if not exists pgcrypto;

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_type text not null,
  status text not null,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  paid_starts_at timestamptz,
  paid_ends_at timestamptz,
  payment_provider text,
  provider_subscription_id text,
  provider_order_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_key text not null,
  is_enabled boolean not null default false,
  expires_at timestamptz,
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  currency text not null default 'TWD',
  status text not null,
  provider text not null,
  provider_transaction_id text,
  provider_order_id text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  invited_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.sync_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  status text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create unique index if not exists idx_memberships_user on public.memberships(user_id);
create unique index if not exists idx_entitlements_user_feature on public.entitlements(user_id, feature_key);
create index if not exists idx_payments_user on public.payments(user_id);
create index if not exists idx_payments_provider_order on public.payments(provider_order_id);
create index if not exists idx_payments_provider_tx on public.payments(provider_transaction_id);
create index if not exists idx_payment_events_user on public.payment_events(user_id);
create index if not exists idx_referrals_inviter on public.referrals(inviter_user_id);
create unique index if not exists idx_sync_connections_user_provider on public.sync_connections(user_id, provider);
