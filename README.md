# cmpCenters

Compare the UVA **Contemplative Sciences Center** (CSC, [csc.virginia.edu](https://csc.virginia.edu))
against peer contemplative / mindfulness / well-being centers.

cmpCenters crawls each center's website, uses Claude to extract a structured picture of it, and then
produces a comparative assessment of CSC against every peer — viewable as an interactive dashboard.

> 📚 Full documentation (architecture, the sprint/spike roadmap, decisions, and session notes) lives
> in `docs/` as a MkDocs site. Run `pip install -r docs/requirements.txt && mkdocs serve` to browse it.

The comparison runs across three dimensions:

- **Programs & Offerings** — courses, workshops, retreats, student/community programming
- **Research & Scholarship** — research areas, faculty, publications, grants
- **Messaging & Positioning** — mission language, framing, tone, intended audience

## How it works

A five-stage pipeline writes into a local database; the dashboard reads the result.

```
Discovery  →  Crawl  →  Extract  →  Compare  →  Dashboard
 (find       (fetch    (Claude     (Claude     (browse the
  peers)      pages)    structures   compares    findings &
                        each site)   CSC vs each  comparison)
                                     peer)
```

- **Crawl** politely walks each center's site (rate-limited, capped) and saves a snapshot.
- **Extract** has Claude turn the messy page text into structured records, per dimension.
- **Compare** has Claude assess CSC against each peer, per dimension, producing a written
  assessment plus structured strengths/gaps.

Snapshots are stored, so you can re-run extraction and comparison without re-crawling.

## Tech stack

| Concern | Choice |
|---|---|
| Language / framework | TypeScript, Next.js (App Router) |
| Crawling | Playwright (+ Cheerio for HTML cleanup) |
| AI | Anthropic SDK (Claude) — Haiku for extraction, Opus for comparison |
| Storage | Prisma + SQLite (local file, zero setup) |
| UI | React + Tailwind CSS |

Everything is one TypeScript project — the dashboard and the pipeline share the same code and database.

## Setup

Requires Node.js 18+ and an [Anthropic API key](https://console.anthropic.com/).

```bash
npm install

cp .env.example .env
# open .env and paste in your ANTHROPIC_API_KEY

npx playwright install chromium   # browser binary the crawler uses (large, one-time)

npm run db:push                   # create the local SQLite database
npm run db:seed                   # load the centers from src/config/centers.ts
```

### Choose who to compare against

Edit `src/config/centers.ts` to set your peer list, then re-run `npm run db:seed`. Exactly one
center is the **focus** (`isFocus: true`) — that's CSC, the center everything is compared against.
The seeded peers are starting-point guesses; replace them with the centers you actually care about.

## Running it

```bash
# Full run: crawl everyone, extract, compare
npm run pipeline

# …or run stages individually while iterating
npm run crawl      # fetch pages for every center
npm run extract    # Claude extracts the three dimensions from the latest crawl
npm run compare    # Claude compares CSC vs each peer

# View the results
npm run dev        # open http://localhost:3000
```

The dashboard has a **landscape overview** (all centers + pipeline progress) and a **per-center
drill-down** showing each center's extracted profile and, for peers, the side-by-side comparison
with CSC.

### Cost note

Extraction runs over a lot of page text, so it uses the cheaper, faster **Haiku** model. Comparison
is the reasoning-heavy step, so it uses **Opus**. You can change these in `src/lib/anthropic.ts`
(`EXTRACT_MODEL` / `COMPARE_MODEL`) to trade cost for quality.

## Useful commands

```bash
npm run dev          # dashboard with hot reload
npm run build        # production build (also full typecheck + lint)
npm run typecheck    # tsc --noEmit
npm run db:studio    # inspect/edit the database in a browser
```

## Project layout

```
src/
  app/                     # Next.js dashboard (overview + per-center pages)
  config/
    centers.ts             # the centers to track (edit this)
    dimensions.ts          # the three comparison dimensions
  lib/
    anthropic.ts           # Claude client + model choices
    db.ts                  # Prisma client
  pipeline/
    crawl.ts  extract.ts  compare.ts  discover.ts
    cli.ts                 # stage runner behind the npm scripts
prisma/
  schema.prisma            # database schema
  seed.ts                  # loads centers from config
```

## Status

Working: crawl, extract, compare, and the dashboard. Not yet done: the **Discovery** stage
(AI-assisted peer finding) is a stub; the dashboard stores but doesn't yet chart the structured
comparison scores; the crawler doesn't parse `robots.txt`/sitemaps yet. See `CLAUDE.md` for the
fuller architecture notes.

## Local-first

This runs entirely on your machine — the SQLite database (`dev.db`) and crawl snapshots
(`data/crawl/`) are local and git-ignored. Nothing is deployed.
