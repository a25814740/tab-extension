-- Migration: grants + RLS policies for workspace sharing and membership flows

grant usage on schema public to authenticated;

grant select, insert, update, delete on table public.workspaces to authenticated;
grant select, insert, update, delete on table public.workspace_members to authenticated;
grant select, insert, update, delete on table public.share_links to authenticated;
grant select, update on table public.profiles to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.share_links enable row level security;

alter table public.share_links alter column created_by set default auth.uid();
alter table public.share_links alter column created_at set default now();

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'workspaces' and policyname = 'workspaces_select_access'
  ) then
    execute $sql$
      create policy workspaces_select_access
      on public.workspaces
      for select
      to authenticated
      using (
        auth.uid() = owner_id
        or exists (
          select 1 from public.workspace_members m
          where m.workspace_id = workspaces.id and m.user_id = auth.uid()
        )
      )
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'workspaces' and policyname = 'workspaces_insert_owner'
  ) then
    execute $sql$
      create policy workspaces_insert_owner
      on public.workspaces
      for insert
      to authenticated
      with check (auth.uid() = owner_id)
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'workspaces' and policyname = 'workspaces_update_access'
  ) then
    execute $sql$
      create policy workspaces_update_access
      on public.workspaces
      for update
      to authenticated
      using (
        auth.uid() = owner_id
        or exists (
          select 1 from public.workspace_members m
          where m.workspace_id = workspaces.id
            and m.user_id = auth.uid()
            and m.role in ('owner', 'admin')
        )
      )
      with check (
        auth.uid() = owner_id
        or exists (
          select 1 from public.workspace_members m
          where m.workspace_id = workspaces.id
            and m.user_id = auth.uid()
            and m.role in ('owner', 'admin')
        )
      )
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'workspaces' and policyname = 'workspaces_delete_owner'
  ) then
    execute $sql$
      create policy workspaces_delete_owner
      on public.workspaces
      for delete
      to authenticated
      using (auth.uid() = owner_id)
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'workspace_members' and policyname = 'members_insert_owner_or_admin'
  ) then
    execute $sql$
      create policy members_insert_owner_or_admin
      on public.workspace_members
      for insert
      to authenticated
      with check (
        exists (
          select 1 from public.workspaces w
          where w.id = workspace_members.workspace_id
            and w.owner_id = auth.uid()
        )
        or exists (
          select 1 from public.workspace_members m
          where m.workspace_id = workspace_members.workspace_id
            and m.user_id = auth.uid()
            and m.role in ('owner', 'admin')
        )
      )
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'workspace_members' and policyname = 'members_update_owner_or_admin'
  ) then
    execute $sql$
      create policy members_update_owner_or_admin
      on public.workspace_members
      for update
      to authenticated
      using (
        exists (
          select 1 from public.workspaces w
          where w.id = workspace_members.workspace_id
            and w.owner_id = auth.uid()
        )
        or exists (
          select 1 from public.workspace_members m
          where m.workspace_id = workspace_members.workspace_id
            and m.user_id = auth.uid()
            and m.role in ('owner', 'admin')
        )
      )
      with check (
        exists (
          select 1 from public.workspaces w
          where w.id = workspace_members.workspace_id
            and w.owner_id = auth.uid()
        )
        or exists (
          select 1 from public.workspace_members m
          where m.workspace_id = workspace_members.workspace_id
            and m.user_id = auth.uid()
            and m.role in ('owner', 'admin')
        )
      )
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'workspace_members' and policyname = 'members_delete_owner_or_admin'
  ) then
    execute $sql$
      create policy members_delete_owner_or_admin
      on public.workspace_members
      for delete
      to authenticated
      using (
        exists (
          select 1 from public.workspaces w
          where w.id = workspace_members.workspace_id
            and w.owner_id = auth.uid()
        )
        or exists (
          select 1 from public.workspace_members m
          where m.workspace_id = workspace_members.workspace_id
            and m.user_id = auth.uid()
            and m.role in ('owner', 'admin')
        )
      )
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'share_links' and policyname = 'share_links_select_access'
  ) then
    execute $sql$
      create policy share_links_select_access
      on public.share_links
      for select
      to authenticated
      using (
        is_public = true
        or exists (
          select 1 from public.workspaces w
          where w.id = share_links.workspace_id
            and w.owner_id = auth.uid()
        )
        or exists (
          select 1 from public.workspace_members m
          where m.workspace_id = share_links.workspace_id
            and m.user_id = auth.uid()
        )
      )
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'share_links' and policyname = 'share_links_insert_access'
  ) then
    execute $sql$
      create policy share_links_insert_access
      on public.share_links
      for insert
      to authenticated
      with check (
        exists (
          select 1 from public.workspaces w
          where w.id = share_links.workspace_id
            and w.owner_id = auth.uid()
        )
        or exists (
          select 1 from public.workspace_members m
          where m.workspace_id = share_links.workspace_id
            and m.user_id = auth.uid()
            and m.role in ('owner', 'admin', 'editor')
        )
      )
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'share_links' and policyname = 'share_links_update_access'
  ) then
    execute $sql$
      create policy share_links_update_access
      on public.share_links
      for update
      to authenticated
      using (
        exists (
          select 1 from public.workspaces w
          where w.id = share_links.workspace_id
            and w.owner_id = auth.uid()
        )
        or exists (
          select 1 from public.workspace_members m
          where m.workspace_id = share_links.workspace_id
            and m.user_id = auth.uid()
            and m.role in ('owner', 'admin', 'editor')
        )
      )
      with check (
        exists (
          select 1 from public.workspaces w
          where w.id = share_links.workspace_id
            and w.owner_id = auth.uid()
        )
        or exists (
          select 1 from public.workspace_members m
          where m.workspace_id = share_links.workspace_id
            and m.user_id = auth.uid()
            and m.role in ('owner', 'admin', 'editor')
        )
      )
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'share_links' and policyname = 'share_links_delete_access'
  ) then
    execute $sql$
      create policy share_links_delete_access
      on public.share_links
      for delete
      to authenticated
      using (
        exists (
          select 1 from public.workspaces w
          where w.id = share_links.workspace_id
            and w.owner_id = auth.uid()
        )
        or exists (
          select 1 from public.workspace_members m
          where m.workspace_id = share_links.workspace_id
            and m.user_id = auth.uid()
            and m.role in ('owner', 'admin', 'editor')
        )
      )
    $sql$;
  end if;
end $$;
