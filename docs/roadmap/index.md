# Roadmap overview

The path from the current scaffold to a fully functional app, framed as **sprints** (time-boxed
delivery iterations that ship a usable increment) and **spikes** (time-boxed investigations that
buy down a specific risk and produce knowledge, not shippable features).

Sprints are sized at roughly **1–2 weeks** of focused effort. They're sequenced by dependency and
value: each ships something usable, and the spikes inside a sprint resolve the uncertainty that
sprint depends on.

## Sprint summary

| Sprint | Goal | Ships |
|---|---|---|
| **S0 — Foundation & first real run** | Prove the core thesis end to end | One credible comparison you trust |
| **S1 — Core analysis loop** | Make the dashboard genuinely answer "how does CSC compare?" | Discovery + scores + aggregate view |
| **S2 — Operate from the UI** | Run the pipeline without the terminal | In-app runs with status |
| **S3 — Corrections & learning** | Let the app improve as it's corrected | Feedback captured + fed back into prompts |
| **S4 — Multi-user** | Trusted reviewers log in and correct | Auth + reviewer role |
| **S5 — Productionize & deploy** | A hosted app that stays current | Postgres + deploy + scheduling |

See **[Sprints](sprints.md)** for the detail of each, and **[Spikes](spikes.md)** for the spike
register.

## Two forks that decide scope

These two decisions determine whether Sprints 4–5 happen at all — see
**[Decisions](../decisions.md)**:

1. **Local-only, or deployed for others?**
2. **Multi-user auth, or just you (single reviewer)?**

Until these are settled, treat S0–S3 as the committed plan and S4–S5 as conditional.
