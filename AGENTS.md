# AGENTS.md

## Execution policy
- Do not ask the user whether to continue to the next phase.
- Automatically proceed phase by phase until blocked by:
  1. missing external credentials or secrets,
  2. irreversible or risky actions,
  3. major architectural conflicts that cannot be resolved safely.

## Progress reporting
- After each phase, provide a short status update:
  - completed work
  - files changed
  - remaining blockers
  - next step
- Then continue automatically to the next phase.

## Planning source of truth
- Use the latest project plan document in the repo as the source of truth.
- If an exact filename is missing, find the closest matching plan file and continue without waiting.

<!-- - ## UI scope constraint
Do not deepen high-fidelity UI implementation yet.
- Prioritize architecture, data model, auth, sync, billing, trial, entitlement, and tests. -->
## UI scope constraint
- The project is currently in UI stabilization phase for New Tab v0.3.
- High-priority work now includes layout stabilization, component cleanup, interaction states, and executable UI implementation.
- Do not redesign the product from scratch.
- Follow these files as the source of truth for current UI work:
  - `docs/ui-spec.md`
  - `docs/product-rules.md`
  - `docs/ui-v0.3-todo.md`
  - `docs/codex-prompt.md`
- Architecture, auth, sync, billing, and tests remain important, but the current active work is UI stabilization unless blocked.
- Do not ask the user whether to proceed; continue until blocked by real implementation blockers.

## Data boundary
- Do not store full user tab/collection primary data in Supabase as the long-term design.
- Use Google Drive appDataFolder as the primary cloud content store for v1 personal plan.

- If implementation details are unspecified, make the most reasonable decision consistent with the current UI documents and continue without asking.