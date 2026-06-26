# Decisions

A lightweight log of decisions that shape the project — settled ones for the record, and the open
ones that gate future sprints.

## Settled

| Decision | Choice | Why |
|---|---|---|
| Output form | Interactive dashboard | Explorable; supports drill-down and side-by-side |
| Comparison dimensions | Programs, Research, Messaging | The three that matter for positioning CSC |
| Stack | TypeScript end-to-end (Next.js) | One language for dashboard + pipeline; simplest to maintain solo |
| Storage | Prisma + SQLite | Zero-setup, queryable, easy to migrate to Postgres later |
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
