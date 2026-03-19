# Toby-like Extension

A Chrome extension (Manifest V3) that provides a workspace-first tab management workflow with a new tab dashboard and side panel.

## Packages

- `apps/newtab`: New Tab Dashboard
- `apps/sidepanel`: Side Panel UI
- `apps/shared-ui`: Shared UI primitives
- `packages/core`: Domain models, schemas, sync utilities
- `packages/chrome-adapters`: Chrome API wrappers
- `packages/api-client`: Supabase client wrapper
- `packages/ai`: Rule-based grouping and AI abstraction
- `extension`: Manifest and service worker

## Quick Start

1. Install dependencies with `pnpm install`.
2. Build apps: `pnpm build`.
3. Load the `extension` folder in Chrome via `chrome://extensions` and enable Developer Mode.

## Scripts

- `pnpm lint`
- `pnpm test`
- `pnpm build`

See [docs/SETUP.md](docs/SETUP.md) for details.