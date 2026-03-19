# API Spec

API endpoints will be implemented as Supabase Edge Functions and PostgREST queries.

Planned capabilities:

- Auth: Google OAuth, email magic link
- CRUD: workspaces, spaces, folders, collections, tabs
- Sharing: create/revoke share links
- Collaboration: members and roles
- AI: classify tabs and summarize collections
- Sync: push pending ops and receive ack

## Edge Function: sync_ops

POST `/functions/v1/sync_ops`

```json
{ "ops": [ { "id": "op_123", "type": "update", "entity": "tab", "payload": {} } ] }
```

Response:

```json
{ "syncedIds": ["op_123"], "failedIds": [] }
```
