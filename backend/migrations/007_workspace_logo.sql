-- Migration: workspace logo url + invite stats
alter table workspaces add column if not exists logo_url text;
alter table workspaces add column if not exists invite_count integer default 0;
alter table workspaces add column if not exists points integer default 0;
