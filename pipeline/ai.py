"""Claude client and model choices for the pipeline.

Model selection is deliberate and cost-aware (see CLAUDE.md):
  - EXTRACT runs once per center per dimension over many pages of text — a
    structured-extraction task, so the cheap/fast Haiku.
  - COMPARE runs the actual comparative reasoning (CSC vs each peer) — the
    quality-sensitive step, so the most capable Opus.

Structured output uses a forced tool call (not the newer structured-output API),
so it's portable across SDK versions: the tool's input schema is the desired
shape, and the result comes back on the tool_use block's `input`.
"""
from anthropic import AsyncAnthropic

# Reads ANTHROPIC_API_KEY from the environment (.env).
anthropic = AsyncAnthropic()

EXTRACT_MODEL = "claude-haiku-4-5"
COMPARE_MODEL = "claude-opus-4-8"


def tool_result(message, tool_name: str) -> dict:
    """Pull the input dict off the forced tool_use block, or {} if absent."""
    for block in message.content:
        if block.type == "tool_use" and block.name == tool_name:
            return dict(block.input)
    return {}
