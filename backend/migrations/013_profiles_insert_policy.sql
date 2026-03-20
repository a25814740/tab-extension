-- Migration: allow authenticated users to insert their own profile

grant insert on table public.profiles to authenticated;

create policy if not exists "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);
