# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

cmpCenters crawls the UVA Contemplative Sciences Center (CSC, csc.virginia.edu) and peer
contemplative / well-being centers, uses Claude to extract a structured picture of each, and
produces a comparative assessment of CSC against each peer. Output is an interactive dashboard.
Comparison runs across three dimensions: **Programs & Offerings**, **Research & Scholarship**,
and **Messaging & Positioning**.

TypeScript end-to-end: Next.js (App Router) for both the dashboard and the pipeline, Playwright +
Cheerio for crawling, the Anthropic SDK for extraction/comparison, Prisma + SQLite for storage.

## Commands

```bash
# First-time setup
npm install
cp .env.example .env          # then add ANTHROPIC_API_KEY
npx playwright install chromium   # the crawler needs a browser binary (large download)
npm run db:push               # create the SQLite schema
npm run db:seed               # load centers from src/config/centers.ts

# Pipeline (each stage is independently runnable while iterating)
npm run crawl                 # crawl every center -> Crawl/Page rows
npm run extract               # Claude extracts dimensions from latest crawl -> Extraction rows
npm run compare               # Claude compares CSC vs each peer -> Comparison rows
npm run pipeline              # crawl + extract + compare end to end
tsx src/pipeline/cli.ts discover   # AI-assisted peer discovery (currently a stub)

# Dashboard
npm run dev                   # http://localhost:3000
npm run build                 # production build (also full typecheck + lint)

# Checks & DB
npm run typecheck             # tsc --noEmit
npm run lint                  # next lint
npm run db:studio             # Prisma Studio — inspect/edit rows
```

There is no test suite yet. `npm run build` and `npm run typecheck` are the current correctness gates.

## Architecture

The pipeline is five stages that write into SQLite in order; the dashboard reads the result.

```
Discovery → Crawl → Extract → Compare → Dashboard
```

- **Discovery** (`src/pipeline/discover.ts`) — stub. Intended to use Claude web search to suggest
  additional peer centers and append them to the `Center` table. Seed peers live in
  `src/config/centers.ts`.
- **Crawl** (`src/pipeline/crawl.ts`) — per center, a polite same-host BFS via Playwright: a
  priority-ordered frontier (favoring about/programs/research/people pages), throttled
  (`CRAWL_THROTTLE_MS`), capped (`CRAWL_MAX_PAGES_PER_CENTER`). Cleans HTML to text with Cheerio,
  saves raw HTML under `data/crawl/<crawlId>/` and a `Crawl` + `Page` snapshot. Snapshots are kept
  so extraction/comparison can re-run without re-crawling.
- **Extract** (`src/pipeline/extract.ts`) — for each dimension, sends a crawl's page text to Claude
  and gets back a normalized `DimensionExtraction` (summary + findings + evidence URLs), one
  `Extraction` row per `(crawl, dimension)`.
- **Compare** (`src/pipeline/compare.ts`) — for each peer × dimension, sends CSC's extraction and the
  peer's extraction to Claude and stores a `Comparison` (markdown assessment + structured
  strengths/gaps).
- **Dashboard** (`src/app/`) — `page.tsx` is the landscape overview; `centers/[slug]/page.tsx` is the
  per-center drill-down with the side-by-side CSC comparison. Pages read Prisma directly and are
  `force-dynamic`.

`src/pipeline/cli.ts` is the stage runner behind the `crawl`/`extract`/`compare`/`pipeline` scripts.

## Conventions that matter

- **Model choice is deliberate and cost-aware** (`src/lib/anthropic.ts`): extraction runs over many
  pages, so it uses cheap/fast Haiku (`EXTRACT_MODEL`); comparison is the reasoning-heavy step, so it
  uses Opus (`COMPARE_MODEL`). Change these constants to trade cost for quality.
- **Structured AI output uses a forced tool call**, not `output_config`/structured-outputs. The
  installed SDK version doesn't type the newer structured-output surface; a single forced tool whose
  `input_schema` is the desired shape is the portable pattern. Read the result off the `tool_use`
  block's `input`. Do the same for any new structured AI step.
- **Dimensions and centers are config-driven.** Add a dimension in `src/config/dimensions.ts` or a
  peer in `src/config/centers.ts` (then `npm run db:seed`); the pipeline and dashboard pick it up.
  Exactly one center has `isFocus: true` (CSC) — it's the subject every comparison is against.
- **The `@/*` path alias** maps to `src/*` (see `tsconfig.json`).
- **Crawl politely.** Peers are real institutions — keep the throttle and page cap, and prefer
  reusing an existing crawl snapshot over re-crawling.

## State / not yet done

- Discovery is a stub (`runDiscover`).
- The dashboard renders extractions and comparisons but does not yet surface the structured
  `Comparison.data` scores (strength bars, gaps/edges) — those are stored but unused.
- Crawl respects a throttle and same-host scope but does not parse `robots.txt`/sitemaps yet.
- `data/crawl/` (raw HTML) and `*.db` are git-ignored.
