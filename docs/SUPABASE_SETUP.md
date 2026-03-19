# Supabase Setup

## Tables

Run the SQL migrations in order:

1. `backend/migrations/001_workspaces.sql`
2. `backend/migrations/002_core_tables.sql`
3. `backend/migrations/003_indexes.sql`

## RLS

Apply `backend/policies/rls.sql` in the SQL editor.

## Edge Functions

Deploy `backend/functions/sync_ops.ts` with:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Extension Config

In the New Tab sidebar, set:

- Supabase URL
- Supabase anon key

Then use `Sync Now` to validate the pipeline.