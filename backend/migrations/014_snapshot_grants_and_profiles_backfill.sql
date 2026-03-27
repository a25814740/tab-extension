-- Migration: fix workspace_snapshot grants + backfill missing profiles

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.spaces to service_role;
grant select, insert, update, delete on table public.folders to service_role;
grant select, insert, update, delete on table public.collections to service_role;
grant select, insert, update, delete on table public.tab_items to service_role;

-- Ensure authenticated users can write their own profile row when needed.
grant insert on table public.profiles to authenticated;

create policy if not exists "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Backfill profiles for users created before profile trigger/policies were set.
insert into public.profiles (id, email, full_name, name, avatar_url)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  coalesce(u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'full_name'),
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
on conflict (id) do update
set
  email = coalesce(public.profiles.email, excluded.email),
  full_name = coalesce(public.profiles.full_name, excluded.full_name),
  name = coalesce(public.profiles.name, excluded.name),
  avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);
