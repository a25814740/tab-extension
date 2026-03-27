-- Core tables for spaces, folders, collections, and tabs.
create table if not exists spaces (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  position integer not null default 1000,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists folders (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  space_id uuid not null references spaces(id) on delete cascade,
  parent_folder_id uuid references folders(id) on delete cascade,
  name text not null,
  position integer not null default 1000,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists collections (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  space_id uuid not null references spaces(id) on delete cascade,
  folder_id uuid references folders(id) on delete set null,
  name text not null,
  note text,
  color text,
  position integer not null default 1000,
  created_by uuid not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  archived_at timestamptz
);

create table if not exists tab_items (
  id uuid primary key,
  collection_id uuid not null references collections(id) on delete cascade,
  title text not null,
  url text not null,
  favicon_url text,
  note text,
  position integer not null default 1000,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tags (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  color text
);

create table if not exists collection_tags (
  collection_id uuid not null references collections(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (collection_id, tag_id)
);

create table if not exists workspace_members (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null,
  created_at timestamptz default now()
);

create table if not exists share_links (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  resource_type text not null,
  resource_id uuid not null,
  permission text not null,
  is_public boolean not null default false,
  token text not null,
  created_by uuid not null,
  created_at timestamptz default now(),
  revoked_at timestamptz
);

create table if not exists activity_logs (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  actor_user_id uuid not null,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists ai_suggestions (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  source_type text not null,
  source_id uuid,
  kind text not null,
  input_hash text not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);
