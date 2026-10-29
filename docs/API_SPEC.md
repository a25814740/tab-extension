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

### Authorization

- 需帶使用者 JWT（`Authorization: Bearer <access_token>`），否則 401。
- 每個 op 套用前都會由 `supabase/functions/sync_ops/authorize.ts` 檢查：呼叫者必須是目標 workspace 的 owner，或 `workspace_members.role` 為 `owner` / `admin` / `editor`（viewer 不可寫）。
- update / delete 以資料庫中既有列的 `workspace_id` 判定（tab 透過 collection），不信任 payload；payload 中的 `space_id` / `folder_id` / `parent_folder_id` / `collection_id` 必須屬於同一 workspace，且不可把列搬到其他 workspace。
- 未授權或資料庫錯誤的 op 會列在 `failedIds`。

### Required Env

- `FUNCTION_SUPABASE_URL`
- `FUNCTION_SUPABASE_SERVICE_ROLE_KEY`
