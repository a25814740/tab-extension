-- Initial schema placeholder for Supabase.
-- TODO: Convert to migrations and add RLS policies.

create table if not exists workspaces (
  id uuid primary key,
  owner_id uuid not null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);