-- Placeholder RLS policies. Replace with real policies per table.
alter table workspaces enable row level security;
alter table spaces enable row level security;
alter table folders enable row level security;
alter table collections enable row level security;
alter table tab_items enable row level security;
alter table share_links enable row level security;
alter table activity_logs enable row level security;
alter table ai_suggestions enable row level security;

-- Basic policies: authenticated users can read/write their own workspace data.
create policy "workspaces_select" on workspaces
  for select using (auth.uid() = owner_id);

create policy "workspaces_modify" on workspaces
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "spaces_select" on spaces
  for select using (
    exists (
      select 1 from workspaces w where w.id = workspace_id and w.owner_id = auth.uid()
    )
  );

create policy "spaces_modify" on spaces
  for all using (
    exists (
      select 1 from workspaces w where w.id = workspace_id and w.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from workspaces w where w.id = workspace_id and w.owner_id = auth.uid()
    )
  );

create policy "folders_select" on folders
  for select using (
    exists (
      select 1 from workspaces w where w.id = workspace_id and w.owner_id = auth.uid()
    )
  );

create policy "folders_modify" on folders
  for all using (
    exists (
      select 1 from workspaces w where w.id = workspace_id and w.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from workspaces w where w.id = workspace_id and w.owner_id = auth.uid()
    )
  );

create policy "collections_select" on collections
  for select using (
    exists (
      select 1 from workspaces w where w.id = workspace_id and w.owner_id = auth.uid()
    )
  );

create policy "collections_modify" on collections
  for all using (
    exists (
      select 1 from workspaces w where w.id = workspace_id and w.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from workspaces w where w.id = workspace_id and w.owner_id = auth.uid()
    )
  );

create policy "tab_items_select" on tab_items
  for select using (
    exists (
      select 1 from collections c
      join workspaces w on w.id = c.workspace_id
      where c.id = collection_id and w.owner_id = auth.uid()
    )
  );

create policy "tab_items_modify" on tab_items
  for all using (
    exists (
      select 1 from collections c
      join workspaces w on w.id = c.workspace_id
      where c.id = collection_id and w.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from collections c
      join workspaces w on w.id = c.workspace_id
      where c.id = collection_id and w.owner_id = auth.uid()
    )
  );

create policy "share_links_select" on share_links
  for select using (
    exists (
      select 1 from workspaces w where w.id = workspace_id and w.owner_id = auth.uid()
    )
    or is_public = true
  );

create policy "share_links_modify" on share_links
  for all using (
    exists (
      select 1 from workspaces w where w.id = workspace_id and w.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from workspaces w where w.id = workspace_id and w.owner_id = auth.uid()
    )
  );
