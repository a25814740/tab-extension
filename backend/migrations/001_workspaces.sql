-- Migration: workspaces
create table if not exists workspaces (
  id uuid primary key,
  owner_id uuid not null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);