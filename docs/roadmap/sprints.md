# Sprints

Each sprint lists its **goal**, **stories** (the work), the **spikes** it depends on (detailed in
the [Spike register](spikes.md)), and a **Definition of Done**.

---

## Sprint 0 — Foundation & first real run

**Goal:** prove the whole pipeline works on real data before building anything else on top of it.

The scaffold is already built; this sprint is about getting it running for real and tuning prompts.

**Stories**

- Configure: add `ANTHROPIC_API_KEY`, `npx playwright install chromium`.
- Replace the stub peer list in `src/config/centers.ts` with the real centers; `npm run db:seed`.
- Run `npm run pipeline` against CSC + 2–3 peers.
- Review extraction/comparison output for quality; tune the prompts in `extract.ts` / `compare.ts`.

**Spikes:** [SP-1 Crawl viability](spikes.md#sp-1-crawl-viability), [SP-2 Prompt quality](spikes.md#sp-2-extraction-comparison-prompt-quality)

**Definition of Done**

- [ ] Pipeline runs end to end on real centers without manual intervention.
- [ ] At least one comparison is credible enough to show a colleague.
- [ ] Known crawl/prompt limitations are written up in [Session Notes](../sessions.md).

---

## Sprint 1 — Core analysis loop

**Goal:** make the dashboard answer "how does CSC compare?" at a glance, not just display raw data.

**Stories**

- Implement the **Discovery** stage (`discover.ts`) using Claude web search to suggest peers; write
  candidates to `Center` with a `notes` reason for review.
- Surface the structured **comparison scores** already stored in `Comparison.data` — strength bars
  and gaps/edges, per dimension.
- Add a **"Where CSC stands"** aggregate view: CSC vs the whole field, rolled up across peers.
- Add a **side-by-side** two-center view.

**Spikes:** none (builds on S0 findings).

**Definition of Done**

- [ ] Discovery proposes plausible peers from a seed prompt.
- [ ] Dashboard renders scores and the aggregate view.
- [ ] A non-author can read the dashboard and summarize where CSC leads/trails.

---

## Sprint 2 — Operate from the UI

**Goal:** trigger and monitor pipeline runs from the dashboard, no terminal required.

**Stories**

- Buttons to trigger crawl / extract / compare per center.
- Surface run **status** (the `Crawl.status` field already exists) with progress feedback.
- Run stages as **background jobs** (they take minutes) with polling so the UI doesn't block.

**Spikes:** [SP-3 Background job & crawler runtime](spikes.md#sp-3-background-job-crawler-runtime)

**Definition of Done**

- [ ] A non-technical user can refresh the analysis from the UI.
- [ ] Run status is visible and accurate; failures surface a readable error.

---

## Sprint 3 — Corrections & learning

**Goal:** let an (authorized) user correct results, and have the app apply those corrections going
forward. This is **feedback-as-context**, not model retraining — corrections are stored and injected
into future prompts.

**Stories**

- Add a `Correction` table and a `humanVerified` flag on `Extraction` / `Comparison`.
- Dashboard: edit a result, or flag it wrong with a written reason.
- Pipeline stops overwriting `humanVerified` rows.
- Inject relevant stored corrections into the extract/compare prompts as standing guidance.

**Spikes:** [SP-4 Feedback-as-context efficacy](spikes.md#sp-4-feedback-as-context-efficacy)

**Definition of Done**

- [ ] A correction persists across pipeline re-runs.
- [ ] A correction measurably changes a later run's output (and ideally generalizes to other
      centers).
- [ ] Corrections are auditable (who/what/when/why).

!!! note "Depends on a scope decision"
    "Authorized user" only becomes meaningful once Sprint 4 adds auth. Until then, corrections are
    attributed to a single local reviewer.

---

## Sprint 4 — Multi-user *(conditional)*

**Goal:** trusted people can log in and correct; others can only view.

**Stories**

- Authentication + a **reviewer** role.
- Attribute corrections to a user; build the audit trail.
- Gate edit/flag/run actions behind the reviewer role.

**Spikes:** [SP-5 Auth approach](spikes.md#sp-5-auth-approach)

**Definition of Done**

- [ ] Anonymous users can view; only authenticated reviewers can correct or trigger runs.
- [ ] Every correction is attributed to a user.

---

## Sprint 5 — Productionize & deploy *(conditional)*

**Goal:** a hosted app that stays current.

**Stories**

- Migrate SQLite → Postgres.
- Deploy the dashboard; stand up a **separate worker** for the crawler (it cannot run on serverless
  — see [SP-6](spikes.md#sp-6-deployment-architecture)).
- Scheduling for recurring re-crawls (track change over time).
- Cost controls (prompt caching, page caps), monitoring, and a test suite.

**Spikes:** [SP-6 Deployment architecture](spikes.md#sp-6-deployment-architecture)

**Definition of Done**

- [ ] App is reachable by intended users.
- [ ] Crawls run on a schedule and persist to the hosted database.
- [ ] Costs and failures are observable.
