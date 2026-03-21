# Architecture

## Overview

This project is a Manifest V3 Chrome extension with a local-first data model. The user’s primary content data is stored locally and synced to Google Drive `appDataFolder`. Supabase is used only for business data (trial, entitlement, payment, audit, metadata).

## Frontend

Two React apps share a domain layer and UI primitives:

- New Tab Dashboard (`apps/newtab`)
- Side Panel (`apps/sidepanel`)

## Extension

Manifest V3 extension with a service worker and shared messaging types. New tab override and side panel use built assets under `extension/`.

## Data Boundaries

- Local storage: `chrome.storage.local` holds UI state, cache, draft, dirty flags, last sync markers.
- Google Drive `appDataFolder`: collections, folders, tabs, ordering, metadata, schema version.
- Supabase: business metadata only (users, profiles, trial, entitlements, payments, payment events, referrals, sync connection metadata, audit logs).

## Sync

Local-first state is serialized and synced as a snapshot to Google Drive `appDataFolder`.
- Manual sync (Sync Now) and startup sync check.
- Conflict handling is minimal (latest-write-wins by `updatedAt`).

## Auth & Billing

- Google OAuth via `chrome.identity` for Drive access.
- PAYUNi webhook/callback skeleton updates entitlements in Supabase.
