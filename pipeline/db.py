"""Database access via the Prisma Python client, generated from the same
prisma/schema.prisma the dashboard uses. The DB is the seam between the Python
pipeline (writer) and the TS dashboard (reader) — see docs/adr/0001."""
from contextlib import asynccontextmanager

from prisma import Prisma


@asynccontextmanager
async def get_db():
    """Yield a connected Prisma client, disconnecting on exit.

        async with get_db() as db:
            await db.center.find_many()
    """
    db = Prisma()
    await db.connect()
    try:
        yield db
    finally:
        await db.disconnect()
