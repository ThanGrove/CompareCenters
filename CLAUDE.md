# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

cmpCenters crawls the UVA Contemplative Sciences Center (CSC, csc.virginia.edu) and peer
contemplative / well-being centers, uses Claude to extract a structured picture of each, and
produces a comparative assessment of CSC against each peer. Output is an interactive dashboard.
Comparison runs across three dimensions: **Programs & Offerings**, **Research & Scholarship**,
and **Messaging & Positioning**.

**Hybrid architecture** (see `docs/adr/0001-python-pipeline-typescript-dashboard.md`): a **Python**
pipeline does the crawling + AI work; a **TypeScript / Next.js** dashboard presents the results. They
don't call each other — the **database is the seam** (pipeline writes, dashboard reads). Prisma owns
the schema and generates two clients (JS for the dashboard, Python for the pipeline).

## Commands

The two halves have separate toolchains.

```bash
# --- Setup ---
npm install                                  # Node deps + JS Prisma client (dashboard)
cp .env.example .env                          # add ANTHROPIC_API_KEY
npm run db:push                               # create SQLite DB from prisma/schema.prisma

python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m prisma generate --generator py      # Python Prisma client
python -m playwright install chromium         # crawler browser binary (large)
python -m pipeline seed                       # load config/centers.json

# --- Pipeline (Python; venv active) ---
python -m pipeline all       # crawl + extract + compare
python -m pipeline crawl     # | extract | compare | discover | seed  (individually)

# --- Dashboard (Node) ---
npm run dev                  # http://localhost:3000
npm run build                # production build (also typecheck + lint)
npm run typecheck            # tsc --noEmit
npm run db:studio            # inspect/edit the database

# --- Correctness gates (no test suite yet) ---
npm run build                            # TS side
python -m py_compile pipeline/*.py       # Python side (syntax)
```

## Architecture

```
Python pipeline (pipeline/)                          TS dashboard (src/app/)
 Discovery → Crawl → Extract → Compare  ─writes─▶  [ DB ]  ─reads─▶  overview + drill-down
```

- **Discovery** (`pipeline/discover.py`) — stub; intended Claude web-search peer suggestion.
- **Crawl** (`pipeline/crawl.py`) — polite same-host BFS via Playwright (priority frontier, throttled,
  page-capped). Saves raw HTML under `data/crawl/<crawlId>/` + a `Crawl`/`Page` snapshot. Snapshots
  are kept so later stages re-run without re-crawling.
- **Extract** (`pipeline/extract.py`) — per dimension, Claude → normalized `Extraction` (summary +
  findings + evidence URLs).
- **Compare** (`pipeline/compare.py`) — per peer × dimension, Claude assesses CSC vs the peer →
  `Comparison` (markdown + structured scores).
- **Dashboard** (`src/app/`) — `page.tsx` landscape overview; `centers/[slug]/page.tsx` drill-down.
  Reads Prisma directly; `force-dynamic`.

`pipeline/cli.py` is the stage runner (`python -m pipeline <stage>`).

## Conventions that matter

- **Model choice is deliberate and cost-aware** (`pipeline/ai.py`): extraction over many pages uses
  cheap/fast Haiku (`EXTRACT_MODEL`); comparison is reasoning-heavy so it uses Opus (`COMPARE_MODEL`).
- **Structured AI output uses a forced tool call** (both languages), not the newer structured-output
  API — portable across SDK versions. The tool's `input_schema` is the desired shape; read the result
  off the `tool_use` block's `input`. Do the same for any new structured AI step.
- **The DB is the contract.** Don't add an HTTP API between the halves. Pipeline writes via the
  Prisma Python client; dashboard reads via the Prisma JS client. The JSON shapes in
  `Extraction.data` / `Comparison.data` are mirrored in `src/lib/types.ts` (TS) and written by
  `pipeline/extract.py` / `compare.py` (Python) — keep them in sync.
- **One schema, two clients.** `prisma/schema.prisma` has named generators `client` (JS) and `py`
  (Python). The Node `postinstall` runs `prisma generate --generator client`; the Python side runs
  `python -m prisma generate --generator py`. Don't run a bare `prisma generate` (it tries both).
- **Config is shared JSON** (`config/dimensions.json`, `config/centers.json`) read by both halves.
  `src/config/dimensions.ts` just adds TS types over the JSON. Add a dimension/center there once.
- **Crawl politely** — peers are real institutions; keep the throttle and page cap.

## State / not yet done

- The Python pipeline is a scaffold — structurally complete and it compiles, but it has not been run
  end to end yet (needs the venv, generated Python client, browsers, and an API key). First real run
  is Sprint 0.
- Discovery is a stub (`run_discover`).
- The dashboard renders extractions and comparison narratives but does not yet surface the structured
  `Comparison.data` scores (Sprint 1).
- Crawl respects throttle + same-host scope but does not parse `robots.txt`/sitemaps yet.
- `data/crawl/` (raw HTML), `*.db`, `.venv/`, and `__pycache__/` are git-ignored.

Full architecture, roadmap (sprints/spikes), and decisions live in `docs/` (MkDocs).
