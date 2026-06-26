# Development

Two halves, two toolchains: the **dashboard** is Node/Next.js, the **pipeline** is Python. They share
one database (Prisma owns the schema). See [ADR-0001](adr/0001-python-pipeline-typescript-dashboard.md).

## Prerequisites

- Node.js 18+ (dashboard)
- Python 3.10+ (pipeline and docs)
- An [Anthropic API key](https://console.anthropic.com/)

## Setup

```bash
# 1. Install Node deps and generate the JS Prisma client (dashboard)
npm install

# 2. Env + database (Prisma owns the schema)
cp .env.example .env          # then add ANTHROPIC_API_KEY
npm run db:push               # create the SQLite database from prisma/schema.prisma

# 3. Python pipeline, in a virtualenv (system Python is PEP 668 "externally managed")
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m prisma generate --generator py   # generate the Python Prisma client
python -m playwright install chromium      # browser binary the crawler uses (large, one-time)

# 4. Seed centers from config/centers.json
python -m pipeline seed
```

Edit `config/centers.json` to set your peer list, then re-run `python -m pipeline seed`. Exactly one
center is the **focus** (`isFocus: true`) — CSC, the center everything is compared against. The
dimension list lives in `config/dimensions.json` (read by both halves).

## Running the pipeline

With the venv active (`source .venv/bin/activate`):

```bash
python -m pipeline all        # crawl + extract + compare, end to end

# …or stage by stage while iterating
python -m pipeline crawl
python -m pipeline extract
python -m pipeline compare
python -m pipeline discover   # AI peer discovery (stub)
```

## The dashboard

```bash
npm run dev         # http://localhost:3000
```

Landscape overview + per-center drill-down with the side-by-side comparison against CSC. The
dashboard only reads the database — run the pipeline to populate it.

## Other commands

```bash
npm run build       # production build of the dashboard (also typecheck + lint)
npm run typecheck   # tsc --noEmit
npm run db:studio   # inspect/edit the database in a browser
```

No test suite yet — `npm run build` (TS) and `python -m py_compile pipeline/*.py` (Python) are the
current correctness gates.

## Building these docs

MkDocs (Material theme), separate from the app. Reuse the same venv (or a fresh one):

```bash
source .venv/bin/activate
pip install -r docs/requirements.txt
mkdocs serve        # http://127.0.0.1:8000 with live reload
mkdocs build        # static site into ./site
```

When you finish a working session, add an entry to **[Session Notes](sessions.md)** — newest at the
top.

## Project layout

```
pipeline/                  # Python pipeline
  crawl.py extract.py compare.py discover.py seed.py
  ai.py db.py config.py cli.py
config/                    # shared JSON config (read by both halves)
  centers.json dimensions.json
src/                       # Next.js dashboard
  app/                     # overview + per-center pages
  config/dimensions.ts     # types over config/dimensions.json
  lib/                     # db.ts (Prisma client), types.ts (read shapes)
prisma/schema.prisma       # database schema — two generated clients (js + py)
requirements.txt           # Python deps        package.json — Node deps
docs/                      # this documentation site
```
