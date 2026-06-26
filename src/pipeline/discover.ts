// Discovery stage (stub).
//
// Goal: given the seed peer list, use Claude web search to surface additional
// comparable contemplative / mindfulness / well-being centers the user doesn't
// already know about, and append them to the Center table for review.
//
// Left as a stub deliberately — the user has a partial peer list and wants AI
// help finding more. Implement with the web_search server tool:
//
//   const message = await anthropic.messages.create({
//     model: COMPARE_MODEL,
//     max_tokens: 4000,
//     tools: [{ type: "web_search_20260209", name: "web_search" }],
//     messages: [{ role: "user", content: "Find university/independent centers ..." }],
//   });
//
// then parse out candidate names + homepages and upsert them as peers with a
// `notes` field recording why each was suggested.

export async function runDiscover(): Promise<void> {
  console.log(
    "  discover: not yet implemented — see src/pipeline/discover.ts for the plan.",
  );
}
