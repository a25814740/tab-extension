# Setup

## Requirements

- Node.js 20+
- pnpm 9+

## Install

```bash
pnpm install
```

## Build

```bash
pnpm build
```

## Load Extension

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Load the `extension` directory.

## Supabase Config (Optional)

If you want auth and sync to work, add your Supabase project URL and anon key in the New Tab sidebar under "Auth & Sync".

## Supabase Edge Function

Deploy `backend/functions/sync_ops.ts` with env vars:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Supabase Full Setup

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

## Tests

```bash
pnpm test
pnpm --filter @toby/tests test:e2e
```
