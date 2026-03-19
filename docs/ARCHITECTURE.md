# Architecture

## Frontend

Two React apps share a domain layer and UI primitives:

- New Tab Dashboard (`apps/newtab`)
- Side Panel (`apps/sidepanel`)

## Extension

Manifest V3 extension with a service worker and shared messaging types. New tab override and side panel use the built assets.

## Backend

Supabase is assumed for auth, data, and realtime collaboration. The extension only stores cached data locally.

## Sync

Local-first pending ops are queued in `chrome.storage.local`, flushed periodically via a sync client, and acknowledged by the server.
