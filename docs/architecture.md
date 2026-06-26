# Architecture

cmpCenters is one TypeScript project — the dashboard and the data pipeline share the same code and
database. A five-stage pipeline writes into a local database in order; the dashboard reads the
result.

```
Discovery → Crawl → Extract → Compare → Dashboard
```

## Stages

| Stage | Code | What it does |
|---|---|---|
| **Discovery** | `src/pipeline/discover.ts` | *(stub)* Use Claude web search to suggest additional peer centers and append them to the `Center` table. Seed peers live in `src/config/centers.ts`. |
| **Crawl** | `src/pipeline/crawl.ts` | Polite same-host BFS via Playwright — priority-ordered frontier (about/programs/research/people), throttled, page-capped. Cleans HTML to text with Cheerio; saves raw HTML under `data/crawl/<crawlId>/` plus a `Crawl` + `Page` snapshot. |
| **Extract** | `src/pipeline/extract.ts` | For each dimension, sends a crawl's page text to Claude and stores a normalized `Extraction` (summary + findings + evidence URLs). |
| **Compare** | `src/pipeline/compare.ts` | For each peer × dimension, sends CSC's extraction and the peer's extraction to Claude and stores a `Comparison` (markdown assessment + structured strengths/gaps). |
| **Dashboard** | `src/app/` | `page.tsx` is the landscape overview; `centers/[slug]/page.tsx` is the per-center drill-down with the side-by-side comparison. Pages read Prisma directly and are `force-dynamic`. |

`src/pipeline/cli.ts` is the stage runner behind the `crawl` / `extract` / `compare` / `pipeline`
npm scripts.

Crawl snapshots are retained, so extraction and comparison can re-run without re-crawling.

## Tech stack

| Concern | Choice |
|---|---|
| Language / framework | TypeScript, Next.js (App Router) |
| Crawling | Playwright (+ Cheerio for HTML cleanup) |
| AI | Anthropic SDK (Claude) |
| Storage | Prisma + SQLite |
| UI | React + Tailwind CSS |

## Data model

Defined in `prisma/schema.prisma`. Stages populate these in order:

```
Center ──< Crawl ──< Page
   │          │
   │          └──< Extraction >── (per dimension)
   │
   └──< Comparison (peer vs focus, per dimension)
```

- **Center** — a tracked center. Exactly one has `isFocus: true` (CSC); the rest are peers.
- **Crawl / Page** — one crawl run and its fetched pages (cleaned text + pointer to raw HTML).
- **Extraction** — Claude's structured record for one `(crawl, dimension)`.
- **Comparison** — Claude's assessment of CSC vs one peer for one dimension.

## Conventions that matter

- **Model choice is deliberate and cost-aware** (`src/lib/anthropic.ts`): extraction runs over many
  pages so it uses cheap/fast **Haiku** (`EXTRACT_MODEL`); comparison is reasoning-heavy so it uses
  **Opus** (`COMPARE_MODEL`).
- **Structured AI output uses a forced tool call**, not the newer structured-output API — the pinned
  SDK version doesn't type that surface. A single forced tool whose `input_schema` is the desired
  shape returns reliable JSON via the `tool_use` block's `input`. Use the same pattern for any new
  structured AI step.
- **Dimensions and centers are config-driven** (`src/config/`). Add one and the pipeline and
  dashboard pick it up.
- **`@/*`** path alias maps to `src/*`.
- **Crawl politely** — peers are real institutions; keep the throttle and page cap, and reuse
  existing snapshots over re-crawling.
