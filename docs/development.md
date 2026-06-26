# Development

## Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)
- Python 3 (only for building these docs)

## First-time setup

```bash
npm install

cp .env.example .env
# open .env and paste in your ANTHROPIC_API_KEY

npx playwright install chromium   # browser binary the crawler uses (large, one-time)

npm run db:push                   # create the local SQLite database
npm run db:seed                   # load centers from src/config/centers.ts
```

Edit `src/config/centers.ts` to set your peer list, then re-run `npm run db:seed`. Exactly one
center is the **focus** (`isFocus: true`) — CSC, the center everything is compared against.

## Running the pipeline

```bash
npm run pipeline    # crawl + extract + compare, end to end

# …or stage by stage while iterating
npm run crawl
npm run extract
npm run compare
tsx src/pipeline/cli.ts discover   # AI peer discovery (currently a stub)
```

## The dashboard

```bash
npm run dev         # http://localhost:3000
```

Landscape overview + per-center drill-down with the side-by-side comparison against CSC.

## Other commands

```bash
npm run build       # production build (also full typecheck + lint)
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm run db:studio   # inspect/edit the database in a browser
```

There is no test suite yet — `npm run build` and `npm run typecheck` are the current correctness
gates.

## Building these docs

The documentation site is MkDocs (Material theme), separate from the Node app.

```bash
pip install -r docs/requirements.txt
mkdocs serve        # http://127.0.0.1:8000 with live reload
mkdocs build        # static site into ./site
```

When you finish a working session, add an entry to **[Session Notes](sessions.md)** — newest at the
top.

## Project layout

```
src/
  app/                     # Next.js dashboard
  config/                  # centers.ts, dimensions.ts (edit these)
  lib/                     # anthropic.ts (client + models), db.ts (Prisma)
  pipeline/                # crawl, extract, compare, discover, cli
prisma/
  schema.prisma            # database schema
  seed.ts                  # loads centers from config
docs/                      # this documentation site
```
