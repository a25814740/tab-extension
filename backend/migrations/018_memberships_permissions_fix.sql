-- Repair migration: memberships API 403 (permissions + safe defaults)

create extension if not exists pgcrypto;

alter table if exists public.memberships
  alter column id set default gen_random_uuid();

grant usage on schema public to authenticated;
grant select, insert, update on table public.memberships to authenticated;
grant select on table public.entitlements to authenticated;

grant all privileges on table public.memberships to service_role;
grant all privileges on table public.entitlements to service_role;

alter table if exists public.memberships enable row level security;
alter table if exists public.entitlements enable row level security;

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
