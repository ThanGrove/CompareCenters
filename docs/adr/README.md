# Architecture Decision Records

Records of decisions that were *arguable* — where the rationale, alternatives, and consequences are
worth keeping. Not every choice gets an ADR; trivial or obvious ones stay out.

The [Decisions](../decisions.md) page is the at-a-glance index; the ADRs here hold the depth.

| ADR | Title | Status |
|---|---|---|
| [0001](0001-python-pipeline-typescript-dashboard.md) | Python pipeline with a TypeScript dashboard | Accepted |

New ADRs start from [`0000-template.md`](0000-template.md). Number them sequentially.

## Candidate ADRs — pending review

Identified as ADR-worthy but **not yet written** — to review and write up at a later session:

- **Storage: SQLite + Prisma now (vs Postgres).** Deliberate deferral with a known migration cost.
- **Forced tool calls for structured AI output (vs the structured-outputs API).** Driven by the
  pinned SDK version — the "revisit when the SDK updates" kind.
- **Local-first / no auth yet.** Consequences for the corrections feature and multi-user.
- **"Learning" = feedback-as-context, not fine-tuning.** The design stance behind Sprint 3.
- **Proposed (open forks):** deploy vs local-only, and multi-user vs single-reviewer — see
  [Decisions](../decisions.md) D-1 / D-2.
