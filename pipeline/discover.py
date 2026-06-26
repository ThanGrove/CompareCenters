"""Discovery stage (stub).

Goal: use Claude web search to surface additional comparable contemplative /
mindfulness / well-being centers beyond the seed list, and append them to the
Center table for review.

Left as a stub deliberately — the user has a partial peer list and wants AI help
finding more. Implement with the web_search server tool:

    message = await anthropic.messages.create(
        model=COMPARE_MODEL,
        max_tokens=4000,
        tools=[{"type": "web_search_20260209", "name": "web_search"}],
        messages=[{"role": "user", "content": "Find university/independent centers ..."}],
    )

then parse candidate names + homepages and upsert them as peers with a `notes`
field recording why each was suggested.
"""


async def run_discover() -> None:
    print("  discover: not yet implemented — see pipeline/discover.py for the plan.")
