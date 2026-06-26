"""Crawl stage: a polite same-host BFS per center, throttled and page-capped.
Saves raw HTML to disk and a Crawl + Page snapshot to the database so extraction
can re-run without re-crawling."""
import asyncio
import hashlib
import os
import re
from datetime import datetime, timezone
from urllib.parse import urlparse

from playwright.async_api import async_playwright

from .config import CRAWL_DIR
from .db import get_db

MAX_PAGES = int(os.environ.get("CRAWL_MAX_PAGES_PER_CENTER", "25"))
THROTTLE_MS = int(os.environ.get("CRAWL_THROTTLE_MS", "1500"))

# Pages most likely to carry comparison-relevant content — used to prioritize
# the crawl frontier so the page budget is spent well.
PRIORITY_HINTS = [
    "about", "program", "research", "people", "faculty",
    "mission", "event", "course", "study",
]


def _priority(url: str) -> int:
    u = url.lower()
    return sum(1 for h in PRIORITY_HINTS if h in u)


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()[:20000]  # cap to bound extraction cost


async def _crawl_site(homepage: str) -> list[dict]:
    """Same-host, priority-ordered, throttled BFS. Returns cleaned pages."""
    host = urlparse(homepage).hostname
    visited: set[str] = set()
    frontier: list[str] = [homepage]
    pages: list[dict] = []

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        try:
            while frontier and len(pages) < MAX_PAGES:
                frontier.sort(key=_priority, reverse=True)  # highest priority first
                url = frontier.pop(0)
                if url in visited:
                    continue
                visited.add(url)

                try:
                    await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    html = await page.content()
                    title = await page.title()
                    body = await page.inner_text("body")
                except Exception:
                    continue

                text = _clean(body)
                if len(text) > 200:
                    pages.append({"url": url, "title": title, "text": text, "raw_html": html})

                # Browser returns absolute, already-resolved hrefs.
                hrefs = await page.eval_on_selector_all(
                    "a[href]", "els => els.map(e => e.href)"
                )
                for href in hrefs:
                    parsed = urlparse(href)
                    if parsed.scheme in ("http", "https") and parsed.hostname == host:
                        clean = href.split("#")[0]
                        if clean not in visited:
                            frontier.append(clean)

                await asyncio.sleep(THROTTLE_MS / 1000)  # be polite to peer institutions
        finally:
            await browser.close()

    return pages


async def run_crawl(center_id: str) -> str:
    """Crawl one center and persist a snapshot. Returns the crawl id."""
    async with get_db() as db:
        center = await db.center.find_unique(where={"id": center_id})
        if center is None:
            raise ValueError(f"no center {center_id}")
        crawl = await db.crawl.create(
            data={"center": {"connect": {"id": center_id}}, "status": "running"}
        )

        try:
            pages = await _crawl_site(center.homepage)
            raw_base = CRAWL_DIR / crawl.id
            raw_base.mkdir(parents=True, exist_ok=True)

            for pg in pages:
                digest = hashlib.sha1(pg["url"].encode()).hexdigest()[:16]
                rel = f"data/crawl/{crawl.id}/{digest}.html"
                (raw_base / f"{digest}.html").write_text(pg["raw_html"])
                await db.page.create(
                    data={
                        "crawl": {"connect": {"id": crawl.id}},
                        "url": pg["url"],
                        "title": pg["title"],
                        "text": pg["text"],
                        "rawPath": rel,
                    }
                )

            await db.crawl.update(
                where={"id": crawl.id},
                data={
                    "status": "complete",
                    "finishedAt": datetime.now(timezone.utc),
                    "pageCount": len(pages),
                },
            )
            print(f"  crawled {len(pages)} pages for {center.name}")
            return crawl.id
        except Exception as err:
            await db.crawl.update(
                where={"id": crawl.id},
                data={"status": "failed", "finishedAt": datetime.now(timezone.utc), "error": str(err)},
            )
            raise
