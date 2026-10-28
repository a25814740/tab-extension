-- Migration: share_links defaults to prevent null id/created fields

create extension if not exists pgcrypto;

alter table public.share_links
  alter column id set default gen_random_uuid();

alter table public.share_links
  alter column created_at set default now();

alter table public.share_links
  alter column created_by set default auth.uid();
