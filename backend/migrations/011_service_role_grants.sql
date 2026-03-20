-- Migration: grant required privileges to service_role for Edge Functions

grant usage on schema public to service_role;

grant select, insert, update, delete on table public.share_links to service_role;
grant select, insert, update, delete on table public.workspaces to service_role;
grant select, insert, update, delete on table public.workspace_members to service_role;
grant select on table public.profiles to service_role;
