# Spike register

A **spike** is a time-boxed investigation to resolve a specific uncertainty before committing to
building. Each produces a finding (and usually a short note in [Session Notes](../sessions.md)), not
a shippable feature. Time-box each to **1–2 days** unless noted.

| ID | Spike | Risk it buys down | In sprint |
|---|---|---|---|
| SP-1 | Crawl viability | Can we actually capture real peer sites? | S0 |
| SP-2 | Prompt quality | Does Claude produce credible output? | S0 |
| SP-3 | Background job & crawler runtime | How do long runs execute under the UI? | S2 |
| SP-4 | Feedback-as-context efficacy | Do corrections actually improve output? | S3 |
| SP-5 | Auth approach | Which auth fits a small reviewer set? | S4 |
| SP-6 | Deployment architecture | How does the crawler run when deployed? | S5 |

---

## SP-1 — Crawl viability

**Question:** Does the Playwright crawler capture enough useful content from real peer sites?

**Investigate:** JS-heavy/SPA sites, `robots.txt`/sitemap handling, pagination, pages behind
search, and whether the page cap + priority hints land on the right content.

**Output:** a list of sites that crawl cleanly vs. need special handling, and whether to add
sitemap parsing now or later.

---

## SP-2 — Extraction & comparison prompt quality

**Question:** Are the extracted records and comparisons accurate and useful?

**Investigate:** run on a few centers; check for hallucinated programs/research, missed content, and
whether the comparison is specific and actionable. Try prompt variants and the Haiku-vs-stronger
model tradeoff for extraction.

**Output:** tuned prompts and a documented model/quality/cost choice.

---

## SP-3 — Background job & crawler runtime

**Question:** How should multi-minute crawl/extract/compare runs execute when triggered from the UI?

**Investigate:** in-process job vs. a queue/worker; how to report status and stream progress; how
Playwright behaves when invoked from a Next.js route.

**Output:** a chosen job-execution approach for Sprint 2 (and a head start on SP-6).

---

## SP-4 — Feedback-as-context efficacy

**Question:** Does injecting stored corrections into prompts actually improve later runs — and
generalize beyond the corrected center?

**Investigate:** correct a known-bad output, re-run, and measure whether it sticks and whether a
*different* center benefits. Compare correction formats (verbatim fix vs. rule-style guidance vs.
few-shot example).

**Output:** the correction representation Sprint 3 should store and inject.

---

## SP-5 — Auth approach

**Question:** What's the lightest auth that fits a small set of named reviewers?

**Investigate:** hosted options vs. a minimal email-allowlist; how roles attach to corrections; what
deployment target it implies.

**Output:** an auth choice for Sprint 4 (only if multi-user is confirmed).

---

## SP-6 — Deployment architecture

**Question:** How does the Playwright crawler run in a deployed setup, given it can't run on Vercel
serverless functions?

**Investigate:** separate always-on worker vs. scheduled container vs. a managed browser service;
how it shares the (Postgres) database with the dashboard; cost.

**Output:** a deployment topology for Sprint 5 (only if deployment is confirmed).
