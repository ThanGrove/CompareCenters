# Session Notes

A running log of working sessions — what was done, decided, and left open. **Newest entry at the
top.** Keep entries short; link to [Decisions](decisions.md), [Sprints](roadmap/sprints.md), or
[Spikes](roadmap/spikes.md) rather than repeating them.

Template:

```
## YYYY-MM-DD — <short title>
**Done:** …
**Decided:** …
**Open / next:** …
```

---

## 2026-06-26 — Docs site + sprint/spike roadmap

**Done:**

- Added this MkDocs (Material) documentation site: overview, architecture, roadmap (overview /
  sprints / spikes), development guide, decisions, and this session log.
- Reframed the build roadmap as **6 sprints (S0–S5)** and **6 spikes (SP-1–SP-6)**.

**Decided:** documentation lives in `docs/` as MkDocs, separate from the Node app.

**Open / next:** start Sprint 0 (real peer list, API key, first end-to-end run) — see
[Sprints](roadmap/sprints.md).

---

## 2026-06-26 — Roadmap & corrections discussion

**Done:**

- Laid out the path to a fully functional app (later reframed into sprints/spikes).
- Discussed a "learn by correction" capability: concluded it's **feedback-as-context**, not model
  retraining — store corrections, inject into future prompts. Became Sprint 3.

**Decided:** nothing new committed.

**Open / next:** two scope forks remain — [D-1](decisions.md#d-1-local-only-or-deployed-for-others)
(deploy?) and [D-2](decisions.md#d-2-multi-user-auth-or-single-reviewer) (multi-user?).

---

## 2026-06-26 — Scaffold built

**Done:**

- Scaffolded the TypeScript app: Next.js (App Router) + Prisma/SQLite + Playwright + Anthropic SDK.
- Implemented pipeline stages: crawl (Playwright BFS), extract (Haiku), compare (Opus); discover is
  a stub. Dashboard: landscape overview + per-center drill-down.
- Verified: `npm install`, `prisma db push`, `db:seed` (5 centers), `npm run typecheck`, and
  `npm run build` all pass.
- Wrote `CLAUDE.md` and a human-facing `README.md`.

**Decided:** structured AI output uses **forced tool calls** (the pinned SDK doesn't type the newer
structured-output surface). Local-first for now.

**Open / next:** peers in `src/config/centers.ts` are stub guesses — replace with the real list. Add
`ANTHROPIC_API_KEY`; `npx playwright install chromium` before first crawl.

---

## 2026-06-26 — Project planning

**Done:**

- Defined the project: crawl CSC + peer contemplative centers, use Claude for a comparative
  assessment.
- Chose output (dashboard), dimensions (programs / research / messaging), and stack (TypeScript
  end-to-end). See [Decisions](decisions.md).

**Decided:** the settled choices now recorded in [Decisions](decisions.md).

**Open / next:** scaffold the project (done in a later session).
