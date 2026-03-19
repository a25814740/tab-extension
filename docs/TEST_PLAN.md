# Test Plan

## Unit Tests

- Domain validation (schemas)
- Pending operation queue
- Rule-based grouping

## Integration Tests

- Local cache read/write
- Sync replay ordering

## E2E Tests

- Save current window as collection
- Drag and drop reorder
- Open collection tabs
- Share link revoke

### Playwright

Run:

```bash
pnpm --filter @toby/tests test:e2e
pnpm --filter @toby/tests test:e2e:extension
```

## Manual QA Steps

1. Open New Tab and create a collection by saving the current window.
2. Drag a collection before/after another and verify ordering persists after refresh.
3. Drag a tab between collections and confirm it moves.
4. Remove duplicates and verify tabs are deduped per collection.
5. Configure Supabase URL/anon key and press Sync Now; verify pending ops clear.
