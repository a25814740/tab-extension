# AGENTS.md

## Execution policy
- Do not ask the user for ordinary product or implementation decisions.
- Automatically proceed phase by phase until blocked by:
  1. missing external credentials,
  2. irreversible destructive actions,
  3. production deployment,
  4. unclear legal/compliance risk.

## Scope policy
- Prioritize MVP stability over feature expansion.
- Do not add new feature lines.
- Focus first on:
  1. scope reduction,
  2. App.tsx decomposition,
  3. appStore.ts decomposition,
  4. real test coverage,
  5. payment/membership cleanup only after core stability.

## Required docs
Always read first if present:
- review-report.md
- docs/PROJECT_STATUS.md
- docs/MVP_SCOPE.md
- docs/ARCHITECTURE_BOUNDARIES.md
- docs/TEST_GATE.md
- docs/EXECUTION_PLAN.md
- docs/DELIVERY_REPORT.md
- docs/AUTONOMY_RULES.md
- .codex/ROLE_PM.md
- .codex/ROLE_TECH_LEAD.md
- .codex/ROLE_FRONTEND.md
- .codex/ROLE_EXTENSION_BACKEND.md
- .codex/ROLE_QA.md

## Completion rule
After each phase:
- update docs/PROJECT_STATUS.md
- update docs/DELIVERY_REPORT.md
- summarize blockers and next step

## Reasoning effort policy
- Choose reasoning effort based on task size, scope, ambiguity, and risk.
- low: small, local, repetitive, clearly-scoped review
- medium: normal code review, feature review, local refactor
- high: cross-module refactor, architecture-sensitive review, dependency-sensitive changes
- xhigh: hardest review tasks, long-running high-impact review, or changes that are difficult to verify

## Review output rule
After each code review, always write the following section into the markdown review file:

## Recommended reasoning effort
- recommended_reasoning_effort: low | medium | high | xhigh
- why_this_level:
- when_to_downgrade:
- when_to_upgrade:

## Review model policy
- Use gpt-5.4-mini for routine code review when saving usage is a priority.
- Use gpt-5.4 for final approval, architecture review, cross-module changes, and high-risk review.