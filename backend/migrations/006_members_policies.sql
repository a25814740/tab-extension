-- Migration: workspace_members policies
alter table workspace_members enable row level security;

create policy if not exists "members_read_for_workspace"
  on workspace_members for select
  using (
    exists (
      select 1
      from workspace_members m
      where m.workspace_id = workspace_members.workspace_id
        and m.user_id = auth.uid()
    )
  );

create policy if not exists "members_insert_by_owner_admin"
  on workspace_members for insert
  with check (
    exists (
      select 1
      from workspace_members m
      where m.workspace_id = workspace_members.workspace_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

create policy if not exists "members_update_by_owner_admin"
  on workspace_members for update
  using (
    exists (
      select 1
      from workspace_members m
      where m.workspace_id = workspace_members.workspace_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

create policy if not exists "members_delete_by_owner_admin"
  on workspace_members for delete
  using (
    exists (
      select 1
      from workspace_members m
      where m.workspace_id = workspace_members.workspace_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );
