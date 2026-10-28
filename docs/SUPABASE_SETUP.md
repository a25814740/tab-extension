# Supabase Setup

## Tables

Use Supabase CLI migrations from `supabase/migrations`:

1. Ensure project is linked:
   - `supabase link --project-ref zhfibzpgabqgqgixgisk`
2. Push latest migration:
   - `supabase db push`

Current consolidated migration:
- `supabase/migrations/202603260001_membership_theme_store.sql`
  - Membership / entitlement permission fixes
  - `workspace_members.id` default fix
  - Theme / template marketplace base tables (`theme_assets`, `theme_asset_purchases`, `theme_asset_installs`)

## RLS

Business metadata and marketplace policies are included in the migration above.
Legacy SQL in `backend/migrations/*` is kept for reference only.

## Edge Functions

Deploy from `supabase/functions/*` with:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Extension Config

In the New Tab sidebar, set:

- Supabase URL
- Supabase anon key

Then use `Sync Now` to validate the pipeline.
