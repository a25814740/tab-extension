-- Migration: break recursive RLS dependencies between workspaces and workspace_members

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.workspaces to authenticated;
grant select, insert, update, delete on table public.workspace_members to authenticated;
grant select, insert, update, delete on table public.share_links to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.share_links enable row level security;

-- Drop previous policies that may create recursive checks.
drop policy if exists "workspaces_select" on public.workspaces;
drop policy if exists "workspaces_modify" on public.workspaces;
drop policy if exists "workspaces_select_access" on public.workspaces;
drop policy if exists "workspaces_insert_owner" on public.workspaces;
drop policy if exists "workspaces_update_access" on public.workspaces;
drop policy if exists "workspaces_delete_owner" on public.workspaces;

drop policy if exists "members_read_for_workspace" on public.workspace_members;
drop policy if exists "members_insert_by_owner_admin" on public.workspace_members;
drop policy if exists "members_update_by_owner_admin" on public.workspace_members;
drop policy if exists "members_delete_by_owner_admin" on public.workspace_members;
drop policy if exists "members_select_self_or_owner" on public.workspace_members;
drop policy if exists "members_insert_owner_only" on public.workspace_members;
drop policy if exists "members_update_owner_only" on public.workspace_members;
drop policy if exists "members_delete_owner_only" on public.workspace_members;
drop policy if exists "members_insert_owner_or_admin" on public.workspace_members;
drop policy if exists "members_update_owner_or_admin" on public.workspace_members;
drop policy if exists "members_delete_owner_or_admin" on public.workspace_members;

drop policy if exists "share_links_select" on public.share_links;
drop policy if exists "share_links_modify" on public.share_links;
drop policy if exists "share_links_select_access" on public.share_links;
drop policy if exists "share_links_insert_access" on public.share_links;
drop policy if exists "share_links_update_access" on public.share_links;
drop policy if exists "share_links_delete_access" on public.share_links;

-- Workspaces: owner-only policies to avoid circular references.
create policy "workspaces_select_owner"
on public.workspaces
for select
to authenticated
using (owner_id = auth.uid());

create policy "workspaces_insert_owner"
on public.workspaces
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "workspaces_update_owner"
on public.workspaces
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "workspaces_delete_owner"
on public.workspaces
for delete
to authenticated
using (owner_id = auth.uid());

-- Workspace members: user can read own row; owner can manage all rows in their workspace.
create policy "members_select_self_or_owner"
on public.workspace_members
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.workspaces w
    where w.id = workspace_members.workspace_id
      and w.owner_id = auth.uid()
  )
);

create policy "members_insert_owner_only"
on public.workspace_members
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workspaces w
    where w.id = workspace_members.workspace_id
      and w.owner_id = auth.uid()
  )
);

create policy "members_update_owner_only"
on public.workspace_members
for update
to authenticated
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = workspace_members.workspace_id
      and w.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workspaces w
    where w.id = workspace_members.workspace_id
      and w.owner_id = auth.uid()
  )
);

create policy "members_delete_owner_only"
on public.workspace_members
for delete
to authenticated
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = workspace_members.workspace_id
      and w.owner_id = auth.uid()
  )
);

-- Share links: public read allowed by token flow; authenticated read/write by owner or allowed member.
create policy "share_links_select_access"
on public.share_links
for select
to authenticated
using (
  is_public = true
  or created_by = auth.uid()
  or exists (
    select 1
    from public.workspaces w
    where w.id = share_links.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = share_links.workspace_id
      and m.user_id = auth.uid()
  )
);

create policy "share_links_insert_access"
on public.share_links
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workspaces w
    where w.id = share_links.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = share_links.workspace_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'editor')
  )
);

create policy "share_links_update_access"
on public.share_links
for update
to authenticated
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = share_links.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = share_links.workspace_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.workspaces w
    where w.id = share_links.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = share_links.workspace_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'editor')
  )
);

create policy "share_links_delete_access"
on public.share_links
for delete
to authenticated
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = share_links.workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = share_links.workspace_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'editor')
  )
);
