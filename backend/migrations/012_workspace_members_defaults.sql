-- Migration: workspace_members defaults to prevent null id

create extension if not exists pgcrypto;

alter table public.workspace_members
  alter column id set default gen_random_uuid();
