"""Pipeline runner.

    python -m pipeline seed       # load centers from config/centers.json
    python -m pipeline crawl      # crawl every center
    python -m pipeline extract    # extract dimensions from each latest crawl
    python -m pipeline compare    # compare CSC vs each peer
    python -m pipeline all        # crawl + extract + compare
    python -m pipeline discover   # AI peer discovery (stub)

Run individual stages while iterating; run `all` for a full refresh.
"""
import asyncio
import sys

from .compare import run_compare
from .crawl import run_crawl
from .db import get_db
from .discover import run_discover
from .extract import run_extract
from .seed import run_seed


async def _crawl_all() -> None:
    async with get_db() as db:
        centers = await db.center.find_many()
    for c in centers:
        print(f"crawling {c.name}…")
        try:
            await run_crawl(c.id)
        except Exception as err:  # one center failing shouldn't stop the rest
            print(f"  failed: {err}")


async def _extract_all() -> None:
    async with get_db() as db:
        centers = await db.center.find_many()
    for c in centers:
        print(f"extracting {c.name}…")
        await run_extract(c.id)


async def main() -> None:
    stage = sys.argv[1] if len(sys.argv) > 1 else "all"
    if stage == "seed":
        await run_seed()
    elif stage == "discover":
        await run_discover()
    elif stage == "crawl":
        await _crawl_all()
    elif stage == "extract":
        await _extract_all()
    elif stage == "compare":
        await run_compare()
    elif stage == "all":
        await _crawl_all()
        await _extract_all()
        await run_compare()
    else:
        print(f"unknown stage: {stage}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
