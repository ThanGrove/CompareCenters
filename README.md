# cmpCenters

Compare the UVA **Contemplative Sciences Center** (CSC, [csc.virginia.edu](https://csc.virginia.edu))
against peer contemplative / mindfulness / well-being centers.

cmpCenters crawls each center's website, uses Claude to extract a structured picture of it, and then
produces a comparative assessment of CSC against every peer — viewable as an interactive dashboard.

> 📚 Full documentation (architecture, the sprint/spike roadmap, decisions/ADRs, and session notes)
> lives in `docs/` as a MkDocs site. Browse it with:
> ```bash
> python3 -m venv .venv && source .venv/bin/activate
> pip install -r docs/requirements.txt
> mkdocs serve   # http://127.0.0.1:8000
> ```
> (A virtual environment is required — system Python is externally managed.)

The comparison runs across three dimensions:

- **Programs & Offerings** — courses, workshops, retreats, student/community programming
- **Research & Scholarship** — research areas, faculty, publications, grants
- **Messaging & Positioning** — mission language, framing, tone, intended audience

## How it works

cmpCenters is a **hybrid**: a **Python pipeline** does the crawling and AI work; a **TypeScript /
Next.js dashboard** presents the results. They don't call each other — the **database is the seam**
(the pipeline writes rows, the dashboard reads them). See
[ADR-0001](docs/adr/0001-python-pipeline-typescript-dashboard.md) for why.

```
        Python pipeline                                  TS dashboard
 Discovery → Crawl → Extract → Compare  ──writes──▶  [ DB ]  ──reads──▶  overview + drill-down
```

- **Crawl** politely walks each center's site (rate-limited, capped) and saves a snapshot.
- **Extract** has Claude turn the page text into structured records, per dimension.
- **Compare** has Claude assess CSC against each peer, per dimension — a written assessment plus
  structured strengths/gaps.

Snapshots are stored, so you can re-run extraction and comparison without re-crawling.

## Tech stack

| Half | Stack |
|---|---|
| Pipeline (`pipeline/`) | Python — Playwright (crawl), Anthropic SDK (Claude: Haiku to extract, Opus to compare), Prisma Python client (DB) |
| Dashboard (`src/app/`) | TypeScript, Next.js (App Router), React, Tailwind |
| Schema / storage | Prisma + SQLite — one schema, two generated clients (JS + Python) |

## Setup

Requires Node.js 18+, Python 3.10+, and an [Anthropic API key](https://console.anthropic.com/).

```bash
# Dashboard (Node) + database
npm install
cp .env.example .env                 # add your ANTHROPIC_API_KEY
npm run db:push                      # create the SQLite database

# Pipeline (Python, in a virtualenv)
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m prisma generate --generator py    # Python Prisma client
python -m playwright install chromium       # browser binary (large, one-time)

python -m pipeline seed              # load centers from config/centers.json
```

### Choose who to compare against

Edit `config/centers.json`, then re-run `python -m pipeline seed`. Exactly one center is the
**focus** (`isFocus: true`) — CSC, the center everything is compared against. The seeded peers are
starting-point guesses; replace them with the centers you actually care about. The dimension list is
`config/dimensions.json` (read by both halves).

## Running it

With the Python venv active (`source .venv/bin/activate`):

```bash
python -m pipeline all       # crawl everyone, extract, compare

# …or stage by stage
python -m pipeline crawl
python -m pipeline extract
python -m pipeline compare
```

Then view the results:

```bash
npm run dev                  # http://localhost:3000
```

The dashboard has a **landscape overview** (all centers + pipeline progress) and a **per-center
drill-down** showing each center's extracted profile and, for peers, the side-by-side comparison
with CSC. It only reads the database — run the pipeline to populate it.

### Cost note

Extraction runs over a lot of page text, so it uses the cheaper, faster **Haiku** model. Comparison
is the reasoning-heavy step, so it uses **Opus**. Change these in `pipeline/ai.py` (`EXTRACT_MODEL` /
`COMPARE_MODEL`) to trade cost for quality.

## Project layout

```
pipeline/                  # Python pipeline (crawl, extract, compare, discover, seed, cli)
config/                    # shared JSON config read by both halves (centers, dimensions)
src/
  app/                     # Next.js dashboard (overview + per-center pages)
  config/  lib/            # TS types over the JSON config; Prisma client + read shapes
prisma/schema.prisma       # database schema — generates a JS and a Python client
requirements.txt           # Python deps          package.json — Node deps
docs/                      # documentation site (MkDocs)
```

## Status

Working: the dashboard builds, and the Python pipeline (crawl, extract, compare) is structurally
complete and compiles. Not yet done: a first real end-to-end run, the **Discovery** stage (stub),
in-dashboard comparison scores, the corrections/learning feature, auth, and deployment. See the
[roadmap](docs/roadmap/index.md).

## Local-first

This runs entirely on your machine — the SQLite database (`dev.db`), crawl snapshots
(`data/crawl/`), and the Python venv (`.venv/`) are local and git-ignored. Nothing is deployed.
