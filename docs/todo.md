# TODO

This file tracks incomplete work. Keep entries short and actionable.

## Phase 1

- [ ] Replace `專案計劃書.md` with planning doc source of truth
- [ ] Rewrite `進度清單.md` to match Plan B priorities
- [ ] Align docs to data boundaries (Supabase vs Drive vs Local)

## Phase 2

- [ ] Create domain enums for trial/entitlement/plan/feature flags
- [ ] Add Google Drive sync provider interface package
- [ ] Add Supabase schema/migrations for business metadata only
- [ ] Add env.example

## Phase 3

- [ ] Implement trial/entitlement core logic
- [ ] Implement local data layer migrations (schema versioning)
- [ ] Add minimal account/pricing/billing shells

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
