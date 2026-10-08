create table if not exists public.creator_payout_ledger (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  currency text not null default 'TWD',
  gross_revenue_twd integer not null default 0 check (gross_revenue_twd >= 0),
  creator_share_percent integer not null default 70 check (creator_share_percent between 0 and 100),
  creator_share_twd integer not null default 0 check (creator_share_twd >= 0),
  platform_fee_twd integer not null default 0 check (platform_fee_twd >= 0),
  payout_amount_twd integer not null default 0 check (payout_amount_twd >= 0),
  payout_status text not null default 'pending' check (payout_status in ('pending', 'approved', 'paid', 'reversed', 'cancelled')),
  payout_method text not null default 'manual_bank_transfer',
  payout_reference text,
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (creator_user_id, period_start, period_end)
);

create index if not exists idx_creator_payout_ledger_creator_status
on public.creator_payout_ledger(creator_user_id, payout_status);

create index if not exists idx_creator_payout_ledger_period
on public.creator_payout_ledger(period_start, period_end);

grant select on table public.creator_payout_ledger to authenticated;
grant all privileges on table public.creator_payout_ledger to service_role;

alter table public.creator_payout_ledger enable row level security;

drop policy if exists "creator_payout_ledger_select_own" on public.creator_payout_ledger;
create policy "creator_payout_ledger_select_own"
on public.creator_payout_ledger
for select
to authenticated
using (creator_user_id = auth.uid());

drop policy if exists "creator_payout_ledger_service_all" on public.creator_payout_ledger;
create policy "creator_payout_ledger_service_all"
on public.creator_payout_ledger
for all
to service_role
using (true)
with check (true);
