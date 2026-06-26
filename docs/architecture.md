# Architecture

cmpCenters is a **hybrid**: a **Python pipeline** does the crawling and AI work, and a **TypeScript /
Next.js dashboard** presents the results. The two halves never call each other directly — the
**database is the seam**: the pipeline writes rows, the dashboard reads them. See
[ADR-0001](adr/0001-python-pipeline-typescript-dashboard.md) for why.

```
        Python pipeline (pipeline/)                     TS dashboard (src/app/)
 Discovery → Crawl → Extract → Compare  ──writes──▶  [ database ]  ──reads──▶  overview + drill-down
```

## The two halves

| Half | Language | Lives in | Talks to the DB via |
|---|---|---|---|
| Pipeline (crawl, extract, compare, discover, seed) | Python | `pipeline/` | Prisma Python client (`prisma`) |
| Dashboard (overview, per-center drill-down) | TypeScript / Next.js | `src/app/` | Prisma JS client (`@prisma/client`) |

**Prisma owns the schema** (`prisma/schema.prisma`) as the single source of truth. Two clients are
generated from it — JS for the dashboard, Python for the pipeline — so both sides agree on the shape
and writes are byte-compatible. Shared config (the dimension list) is **JSON** in `config/`, read by
both languages.

## Pipeline stages

| Stage | Code | What it does |
|---|---|---|
| **Discovery** | `pipeline/discover.py` | *(stub)* Claude web search to suggest peer centers. |
| **Crawl** | `pipeline/crawl.py` | Polite same-host BFS via Playwright — priority-ordered frontier, throttled, page-capped. Saves raw HTML to `data/crawl/<crawlId>/` plus a `Crawl` + `Page` snapshot. |
| **Extract** | `pipeline/extract.py` | Per dimension, Claude turns page text into a normalized `Extraction` (summary + findings + evidence URLs). |
| **Compare** | `pipeline/compare.py` | Per peer × dimension, Claude assesses CSC vs the peer → a `Comparison` (narrative + structured scores). |
| **Seed** | `pipeline/seed.py` | Loads `config/centers.json` into the `Center` table. |

`pipeline/cli.py` is the stage runner (`python -m pipeline <stage>`). Crawl snapshots are retained so
extraction/comparison can re-run without re-crawling.

## Tech stack

| Concern | Choice |
|---|---|
| Pipeline | Python — Playwright (crawl), Anthropic SDK (AI), Prisma Python client (DB) |
| Dashboard | TypeScript, Next.js (App Router), React, Tailwind |
| Schema / storage | Prisma + SQLite (one schema, two generated clients) |

## Data model

Defined in `prisma/schema.prisma`. The pipeline populates these in order:

```
Center ──< Crawl ──< Page
   │          │
   │          └──< Extraction >── (per dimension)
   │
   └──< Comparison (peer vs focus, per dimension)
```

- **Center** — a tracked center. Exactly one has `isFocus: true` (CSC); the rest are peers.
- **Crawl / Page** — one crawl run and its fetched pages (cleaned text + pointer to raw HTML).
- **Extraction** — Claude's structured record for one `(crawl, dimension)`, JSON in `data`.
- **Comparison** — Claude's assessment of CSC vs one peer for one dimension.

The JSON shapes the dashboard reads (`Extraction.data`, `Comparison.data`) are mirrored in
`src/lib/types.ts` (TS) and written by `pipeline/extract.py` / `pipeline/compare.py` (Python) — keep
those in sync.

## Conventions that matter

- **Model choice is deliberate and cost-aware** (`pipeline/ai.py`): extraction over many pages uses
  cheap/fast **Haiku** (`EXTRACT_MODEL`); comparison is reasoning-heavy so it uses **Opus**
  (`COMPARE_MODEL`).
- **Structured AI output uses a forced tool call** (both languages) — the tool's `input_schema` is
  the desired shape; read the result off the `tool_use` block's `input`. Portable across SDK
  versions.
- **Dimensions and centers are config-driven** (`config/*.json`). Add one and both halves pick it up.
- **Crawl politely** — peers are real institutions; keep the throttle and page cap, and reuse
  existing snapshots over re-crawling.
