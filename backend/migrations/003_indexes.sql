-- Migration: indexes
create index if not exists idx_spaces_workspace on spaces(workspace_id);
create index if not exists idx_folders_workspace on folders(workspace_id);
create index if not exists idx_folders_space on folders(space_id);
create index if not exists idx_folders_parent on folders(parent_folder_id);
create index if not exists idx_collections_workspace on collections(workspace_id);
create index if not exists idx_collections_space on collections(space_id);
create index if not exists idx_collections_folder on collections(folder_id);
create index if not exists idx_tab_items_collection on tab_items(collection_id);
create index if not exists idx_share_links_token on share_links(token);
create index if not exists idx_workspace_members_workspace on workspace_members(workspace_id);