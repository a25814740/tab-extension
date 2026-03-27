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

## Environment

Create env values from `docs/env.md` and wire them into your local setup.

## Google OAuth (Drive Sync)

- Add Google OAuth credentials for a Chrome extension.
- Request scope: `https://www.googleapis.com/auth/drive.appdata`.
- Use `chrome.identity` to request tokens only when the user enables sync.
- Update `extension/manifest.json` `oauth2.client_id` with your Google OAuth client id.

## Supabase (Business Metadata)

Supabase stores business data only (trial, entitlements, payments, audit).
See `docs/SUPABASE_SETUP.md` for schema/migration notes.

## Tests

```bash
pnpm test
pnpm --filter @toby/tests test:e2e
```
