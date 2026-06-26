import Anthropic from "@anthropic-ai/sdk";

// One shared client. Reads ANTHROPIC_API_KEY from the environment (.env).
export const anthropic = new Anthropic();

// Model selection is deliberate and cost-aware (see CLAUDE.md):
//
// - EXTRACT runs once per crawled center per dimension, over many pages of
//   text. It's a structured-extraction task, so we use the cheap, fast Haiku.
// - COMPARE runs the actual comparative reasoning (CSC vs each peer). This is
//   the quality-sensitive step, so we use the most capable Opus model.
//
// Swap these if you want to trade cost for quality or vice versa.
export const EXTRACT_MODEL = "claude-haiku-4-5";
export const COMPARE_MODEL = "claude-opus-4-8";

// Pull the concatenated text of the first text blocks out of a response.
export function responseText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}
