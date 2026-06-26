"""Seed the Center table from config/centers.json. Idempotent — upserts by slug,
so editing the config and re-running keeps things in sync. (Replaces the old
TS prisma/seed.ts now that the pipeline is Python.)"""
from .config import CENTERS
from .db import get_db


async def run_seed() -> None:
    async with get_db() as db:
        for c in CENTERS:
            fields = {
                "name": c["name"],
                "homepage": c["homepage"],
                "isFocus": c.get("isFocus", False),
                "notes": c.get("notes"),
            }
            await db.center.upsert(
                where={"slug": c["slug"]},
                data={"create": {"slug": c["slug"], **fields}, "update": fields},
            )
            print(f"seeded {c['name']}")
