# Decisions

A lightweight log of decisions that shape the project — settled ones for the record, and the open
ones that gate future sprints. Decisions weighty enough to need their full context get an
[Architecture Decision Record](adr/README.md); this page is the index.

## Settled

| Decision | Choice | Why |
|---|---|---|
| Output form | Interactive dashboard | Explorable; supports drill-down and side-by-side |
| Comparison dimensions | Programs, Research, Messaging | The three that matter for positioning CSC |
| Stack | **Python pipeline + TS dashboard (hybrid)** | Maintainer is Python-fluent; Python fits crawl/AI; dashboard wants TS. Full rationale → [ADR-0001](adr/0001-python-pipeline-typescript-dashboard.md). *(Supersedes the original "TypeScript end-to-end" choice.)* |
| Storage | Prisma + SQLite | Zero-setup, queryable, easy to migrate to Postgres later; one schema generates both clients |
| Extraction model | Haiku (`EXTRACT_MODEL`) | Runs over many pages; cheap/fast |
| Comparison model | Opus (`COMPARE_MODEL`) | Reasoning-heavy; quality matters |
| Structured AI output | Forced tool call | Portable across SDK versions; reliable JSON |
| Runtime (for now) | Local-first | Simplest; nothing deployed yet |

## Open — these gate Sprints 4–5

### D-1 · Local-only, or deployed for others?

Determines whether Sprint 5 happens and forces the crawler-runtime question (the Playwright crawler
cannot run on Vercel serverless — see [SP-6](roadmap/spikes.md#sp-6-deployment-architecture)).
**Status: undecided.**

### D-2 · Multi-user auth, or single reviewer?

Determines whether Sprint 4 (auth + roles) happens, and what "authorized user" means for the
corrections feature in Sprint 3. **Status: undecided.**

!!! tip "How to record a decision"
    When D-1 or D-2 is settled, move it to **Settled** with a one-line reason and note it in
    [Session Notes](sessions.md).
