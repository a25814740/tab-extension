-- Migration: business metadata RLS policies (plan B)
alter table public.memberships enable row level security;
alter table public.entitlements enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.referrals enable row level security;
alter table public.sync_connections enable row level security;
alter table public.audit_logs enable row level security;

create policy if not exists "memberships_select_own"
  on public.memberships for select
  to authenticated
  using (user_id = auth.uid());

create policy if not exists "memberships_insert_own"
  on public.memberships for insert
  to authenticated
  with check (user_id = auth.uid());

create policy if not exists "memberships_write_service"
  on public.memberships for all
  to service_role
  using (true)
  with check (true);

create policy if not exists "entitlements_select_own"
  on public.entitlements for select
  to authenticated
  using (user_id = auth.uid());

create policy if not exists "entitlements_write_service"
  on public.entitlements for all
  to service_role
  using (true)
  with check (true);

create policy if not exists "payments_select_own"
  on public.payments for select
  to authenticated
  using (user_id = auth.uid());

create policy if not exists "payments_write_service"
  on public.payments for all
  to service_role
  using (true)
  with check (true);

create policy if not exists "payment_events_select_own"
  on public.payment_events for select
  to authenticated
  using (user_id = auth.uid());

create policy if not exists "payment_events_write_service"
  on public.payment_events for all
  to service_role
  using (true)
  with check (true);

create policy if not exists "referrals_select_own"
  on public.referrals for select
  to authenticated
  using (inviter_user_id = auth.uid() or invited_user_id = auth.uid());

create policy if not exists "referrals_insert_own"
  on public.referrals for insert
  to authenticated
  with check (inviter_user_id = auth.uid());

create policy if not exists "referrals_write_service"
  on public.referrals for all
  to service_role
  using (true)
  with check (true);

create policy if not exists "sync_connections_select_own"
  on public.sync_connections for select
  to authenticated
  using (user_id = auth.uid());

create policy if not exists "sync_connections_insert_own"
  on public.sync_connections for insert
  to authenticated
  with check (user_id = auth.uid());

create policy if not exists "sync_connections_update_own"
  on public.sync_connections for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy if not exists "sync_connections_write_service"
  on public.sync_connections for all
  to service_role
  using (true)
  with check (true);

create policy if not exists "audit_logs_select_own"
  on public.audit_logs for select
  to authenticated
  using (user_id = auth.uid());

create policy if not exists "audit_logs_write_service"
  on public.audit_logs for all
  to service_role
  using (true)
  with check (true);
