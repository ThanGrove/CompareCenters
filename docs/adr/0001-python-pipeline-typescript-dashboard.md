# ADR-0001 — Python pipeline with a TypeScript dashboard

- **Status:** Accepted
- **Date:** 2026-06-26
- **Supersedes:** the earlier "TypeScript end-to-end" choice (the initial scaffold was all-TS).

## Context

The app has two halves with different centers of gravity:

- **The pipeline** — crawling and AI-driven extraction/comparison. The richer ecosystem for this
  work (Scrapy, mature data/NLP tooling, notebooks for prompt iteration) is **Python's**.
- **The dashboard** — an interactive web UI. That's inherently **React/Next (TS/JS)** territory.

Two facts about the situation tip the decision:

1. **Maintainer fluency.** The maintainer is fluent in Python and JavaScript, weaker in TypeScript.
   For a small/solo project, the language the maintainer is fluent in *today* matters more than
   theoretical elegance — and Python is not a compromise here; for crawl + AI it's arguably the
   better fit.
2. **Deployment.** The Playwright crawler can't run on Vercel-style serverless functions
   (see [SP-6](../roadmap/spikes.md#sp-6-deployment-architecture)). A separate worker is needed
   regardless — and a Python worker is a clean home for it.

The initial scaffold was written all-in-TypeScript. This ADR records the decision to pivot while the
codebase is still a scaffold (cheap to switch now, expensive later).

## Decision

A **hybrid**:

- **Python** owns the pipeline: crawl, extract, compare, discover, seed (`pipeline/`).
- **TypeScript / Next.js** owns the dashboard (`src/app/`) — kept in TS deliberately: the surface is
  small (~3 pages), types earn their keep there, and it's a low-stakes place to strengthen TS.
- **The database is the seam.** No synchronous API between the halves — the Python pipeline writes
  rows; the dashboard reads them.
  - **Prisma owns the schema and migrations** (`prisma/schema.prisma`).
  - The Python side uses the **Prisma Python client** generated from that *same* schema, so there's
    one source of truth and write-compatibility (ids, datetimes) with the dashboard is guaranteed.
- **Shared config is JSON** (`config/dimensions.json`, `config/centers.json`) read by both
  languages, so the dimension list isn't defined twice.

## Consequences

**Positive**

- Pipeline is written in the maintainer's fluent language and the better ecosystem for crawl/AI.
- Notebooks become available for the prompt-quality work ([SP-2](../roadmap/spikes.md#sp-2-extraction-comparison-prompt-quality)).
- Pre-solves the deployment wrinkle: the Python pipeline *is* the future crawler worker
  ([SP-6](../roadmap/spikes.md#sp-6-deployment-architecture)).
- Clean expansion path if analysis later goes data-science-heavy.

**Negative / costs accepted**

- **Two toolchains** (npm + a Python venv) and, eventually, two deploy targets.
- **Lose Prisma's end-to-end generated types** flowing into the pipeline (the dashboard keeps them).
- **Two Prisma client generators** on one schema (JS + Python) — each side runs its own
  `prisma generate --generator <name>`; the Node `postinstall` targets only the JS generator so
  `npm install` doesn't invoke the Python one.

## Alternatives considered

- **All-TypeScript (the original scaffold).** Rejected: it fights the maintainer's fluency and uses
  the weaker ecosystem for the heavy (crawl/AI) half, with no offsetting benefit — the dashboard is
  the only part that genuinely *wants* TS.
- **All-Python, including the dashboard** (Streamlit/Dash). Rejected: weaker for a polished
  interactive dashboard, and you end up writing JS anyway.
- **Python via SQLAlchemy against the DB** instead of the Prisma Python client. Rejected for now: it
  either duplicates the schema (drift risk) or relies on reflection, and hand-written writes risk
  datetime/id-format mismatches with how Prisma encodes rows. Sharing the Prisma schema avoids that.

## Caveat (so "future expansion" doesn't bite)

We adopted Python for **fluency + ecosystem fit**, *not* for a speculative data-science roadmap. Keep
the Python side as simple as the TS scaffold was — don't pull in Scrapy / pandas / embeddings until a
spike proves the need.
