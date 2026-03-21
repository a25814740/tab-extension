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

- [ ] Implement Google OAuth flow for Drive sync
- [ ] Implement appDataFolder sync (save/restore/manual sync/startup check)
- [ ] Add conflict handling (latest-write-wins)

## Phase 5

- [ ] Add PAYUNi payment skeleton + webhook handler
- [ ] Wire entitlement update after payment
- [ ] Enforce expiry behavior in extension

## Phase 6

- [ ] Add tests (unit + minimal e2e)
- [ ] Fix lint/typecheck/build pipelines
- [ ] Document remaining UI refactors
