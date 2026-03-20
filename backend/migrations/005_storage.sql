-- Migration: storage bucket for workspace logos
insert into storage.buckets (id, name, public)
values ('workspace-logos', 'workspace-logos', true)
on conflict (id) do update set public = true;

-- RLS for logo objects
alter table storage.objects enable row level security;

create policy if not exists "workspace_logos_public_read"
  on storage.objects for select
  using (bucket_id = 'workspace-logos');

create policy if not exists "workspace_logos_auth_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'workspace-logos');

create policy if not exists "workspace_logos_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'workspace-logos');

create policy if not exists "workspace_logos_auth_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'workspace-logos');
