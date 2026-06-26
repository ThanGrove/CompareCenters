# cmpCenters

Compare the UVA **Contemplative Sciences Center** (CSC, [csc.virginia.edu](https://csc.virginia.edu))
against peer contemplative / mindfulness / well-being centers.

cmpCenters crawls each center's website, uses Claude to extract a structured picture of it, and then
produces a comparative assessment of CSC against every peer — viewable as an interactive dashboard.

## Comparison dimensions

| Dimension | What it captures |
|---|---|
| **Programs & Offerings** | Courses, workshops, retreats, student/community programming |
| **Research & Scholarship** | Research areas, faculty, publications, grants |
| **Messaging & Positioning** | Mission language, framing, tone, intended audience |

## The pipeline at a glance

```
Discovery  →  Crawl  →  Extract  →  Compare  →  Dashboard
 (find       (fetch    (Claude     (Claude     (browse the
  peers)      pages)    structures   compares    findings &
                        each site)   CSC vs each  comparison)
                                     peer)
```

See **[Architecture](architecture.md)** for how the stages fit together, the
**[Roadmap](roadmap/index.md)** for the sprint/spike plan to a fully functional app, and
**[Session Notes](sessions.md)** for the running log of what's been done and decided.

## Status

The scaffold is built and verified (type-checks and builds): crawl, extract, compare, and the
dashboard work. Not yet built: the Discovery stage, in-dashboard comparison scores, the
corrections/learning feature, authentication, and deployment. The roadmap sequences all of that.

!!! note "Local-first"
    Today the app runs entirely on one machine — the SQLite database and crawl snapshots are local
    and git-ignored. Whether it stays local or gets deployed for others is an open
    [decision](decisions.md).
