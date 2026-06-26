"""Extract stage: for each dimension, Claude turns a center's crawled pages into
a normalized record (summary + findings + evidence URLs). Stored as JSON in
Extraction.data — the shape the dashboard reads (see src/lib/types.ts)."""
import json

from .ai import EXTRACT_MODEL, anthropic, tool_result
from .config import DIMENSIONS
from .db import get_db

# Forced-tool input schema — guarantees parseable JSON in exactly this shape.
EXTRACTION_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {
            "type": "string",
            "description": "2-4 sentence synthesis of this dimension for this center.",
        },
        "items": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Concrete findings (programs, research areas, messaging phrases).",
        },
        "evidenceUrls": {
            "type": "array",
            "items": {"type": "string"},
            "description": "URLs of pages the findings were drawn from.",
        },
    },
    "required": ["summary", "items", "evidenceUrls"],
    "additionalProperties": False,
}


async def _extract_dimension(dimension: dict, center_name: str, pages: list) -> dict:
    corpus = "\n\n".join(
        f"### {p.title or p.url}\n[{p.url}]\n{p.text}" for p in pages
    )[:180000]  # keep well under Haiku's 200K context

    message = await anthropic.messages.create(
        model=EXTRACT_MODEL,
        max_tokens=4000,
        system=(
            "You extract structured information about contemplative / well-being "
            f'centers from their website text. Focus only on the "{dimension["label"]}" '
            "dimension. " + dimension["extractionGuidance"] +
            " Only use what is supported by the provided pages; do not invent details."
        ),
        tools=[{
            "name": "record_extraction",
            "description": f'Record the structured "{dimension["label"]}" extraction.',
            "input_schema": EXTRACTION_SCHEMA,
        }],
        tool_choice={"type": "tool", "name": "record_extraction"},
        messages=[{
            "role": "user",
            "content": f"Center: {center_name}\n\nPages:\n\n{corpus}\n\n"
                       f'Extract the "{dimension["label"]}" information.',
        }],
    )

    parsed = tool_result(message, "record_extraction")
    return {"dimension": dimension["id"], **parsed}


async def run_extract(center_id: str) -> None:
    """Extract all dimensions for a center's latest complete crawl."""
    async with get_db() as db:
        center = await db.center.find_unique(where={"id": center_id})
        if center is None:
            raise ValueError(f"no center {center_id}")
        crawl = await db.crawl.find_first(
            where={"centerId": center_id, "status": "complete"},
            order={"finishedAt": "desc"},
            include={"pages": True},
        )
        if crawl is None:
            print(f"  no complete crawl for {center.name}; run crawl first")
            return

        for dimension in DIMENSIONS:
            extraction = await _extract_dimension(dimension, center.name, crawl.pages or [])
            data = json.dumps(extraction)
            await db.extraction.upsert(
                where={"crawlId_dimension": {"crawlId": crawl.id, "dimension": dimension["id"]}},
                data={
                    "create": {
                        "center": {"connect": {"id": center_id}},
                        "crawl": {"connect": {"id": crawl.id}},
                        "dimension": dimension["id"],
                        "data": data,
                        "model": EXTRACT_MODEL,
                    },
                    "update": {"data": data, "model": EXTRACT_MODEL},
                },
            )
            print(f"  extracted {dimension['id']} for {center.name}")
