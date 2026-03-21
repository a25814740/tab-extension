# TODO

This file tracks incomplete work. Keep entries short and actionable.

## Phase 1

- [x] Replace `專案計劃書.md` with planning doc source of truth
- [x] Rewrite `進度清單.md` to match Plan B priorities
- [x] Align docs to data boundaries (Supabase vs Drive vs Local)

## Phase 2

- [x] Create domain enums for trial/entitlement/plan/feature flags
- [x] Add Google Drive sync provider interface package
- [x] Add Supabase schema/migrations for business metadata only
- [x] Add env.example

## Phase 3

- [x] Implement trial/entitlement core logic
- [x] Implement local data layer migrations (schema versioning)
- [x] Add minimal account/pricing/billing shells

## Phase 4

- [x] Implement Google OAuth flow for Drive sync
- [x] Implement appDataFolder sync (save/restore/manual sync/startup check)
- [x] Add conflict handling (latest-write-wins)

## Phase 5

- [x] Add PAYUNi payment skeleton + webhook handler
- [x] Wire entitlement update after payment
- [x] Enforce expiry behavior in extension

## Phase 6

- [x] Stabilize lint/test/build pipelines
- [x] Exclude Playwright e2e from Vitest runs
- [x] Add minimal Playwright e2e coverage
- [x] Add typecheck pipeline (tsc)
- [ ] Document remaining UI refactors

## UI
- [x] Complete New Tab UI v0.3 stabilization (see `docs/ui-v0.3-todo.md`)

## Pre-Store Blockers
- [x] Replace placeholder space actions (edit/delete) with real data flow
- [x] Wire right sidebar batch actions (add to collection / add to Dock / move to space)
- [x] Connect Dock items to real data + actions (remove placeholder items)
- [x] Implement collection invite flow (replace placeholder notice)
- [x] Ensure extension build artifacts are ignored and not committed
