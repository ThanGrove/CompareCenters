"""Compare stage: for each peer x dimension, Claude assesses CSC (the focus
center) against the peer, grounded in the two extractions. Stores a narrative
assessment plus structured strengths/gaps in a Comparison row."""
import json

from .ai import COMPARE_MODEL, anthropic, tool_result
from .config import DIMENSIONS
from .db import get_db

COMPARISON_SCHEMA = {
    "type": "object",
    "properties": {
        "assessment": {
            "type": "string",
            "description": "Markdown narrative comparing the focus center to the peer on this dimension.",
        },
        "focusStrength": {"type": "integer", "description": "0-100 strength of the focus center."},
        "peerStrength": {"type": "integer", "description": "0-100 strength of the peer."},
        "notableGaps": {
            "type": "array", "items": {"type": "string"},
            "description": "Where the focus center trails the peer.",
        },
        "notableEdges": {
            "type": "array", "items": {"type": "string"},
            "description": "Where the focus center leads the peer.",
        },
    },
    "required": ["assessment", "focusStrength", "peerStrength", "notableGaps", "notableEdges"],
    "additionalProperties": False,
}


async def _latest_extraction(db, center_id: str, dimension: str) -> str:
    ex = await db.extraction.find_first(
        where={"centerId": center_id, "dimension": dimension},
        order={"createdAt": "desc"},
    )
    return ex.data if ex else "{}"


async def _compare_dimension(db, dimension: dict, focus, peer) -> None:
    focus_data = await _latest_extraction(db, focus.id, dimension["id"])
    peer_data = await _latest_extraction(db, peer.id, dimension["id"])

    message = await anthropic.messages.create(
        model=COMPARE_MODEL,
        max_tokens=4000,
        system=(
            "You are an analyst comparing contemplative / well-being centers. Compare "
            f'the FOCUS center to the PEER on the "{dimension["label"]}" dimension, grounded '
            "only in the structured extractions provided. Be specific, balanced, and "
            "actionable — name concrete strengths and gaps the focus center could act on."
        ),
        tools=[{
            "name": "record_comparison",
            "description": f'Record the structured "{dimension["label"]}" comparison.',
            "input_schema": COMPARISON_SCHEMA,
        }],
        tool_choice={"type": "tool", "name": "record_comparison"},
        messages=[{
            "role": "user",
            "content": f"FOCUS center: {focus.name}\nExtraction:\n{focus_data}\n\n"
                       f"PEER center: {peer.name}\nExtraction:\n{peer_data}\n\n"
                       "Produce the comparison.",
        }],
    )

    parsed = tool_result(message, "record_comparison")
    await db.comparison.delete_many(where={"peerId": peer.id, "dimension": dimension["id"]})
    await db.comparison.create(
        data={
            "dimension": dimension["id"],
            "peer": {"connect": {"id": peer.id}},
            "assessment": parsed.get("assessment", ""),
            "data": json.dumps({
                "focusStrength": parsed.get("focusStrength"),
                "peerStrength": parsed.get("peerStrength"),
                "notableGaps": parsed.get("notableGaps"),
                "notableEdges": parsed.get("notableEdges"),
            }),
            "model": COMPARE_MODEL,
        }
    )
    print(f"  compared {focus.name} vs {peer.name} on {dimension['id']}")


async def run_compare() -> None:
    """Compare CSC (the focus center) against every peer, across all dimensions."""
    async with get_db() as db:
        focus = await db.center.find_first(where={"isFocus": True})
        if focus is None:
            print("  no focus center (isFocus=true) found; seed one first")
            return
        peers = await db.center.find_many(where={"isFocus": False})

        for peer in peers:
            for dimension in DIMENSIONS:
                await _compare_dimension(db, dimension, focus, peer)
