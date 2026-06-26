import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, COMPARE_MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/db";
import { DIMENSIONS, type Dimension } from "@/config/dimensions";

const COMPARISON_SCHEMA: Anthropic.Tool.InputSchema = {
  type: "object",
  properties: {
    assessment: {
      type: "string",
      description: "Markdown narrative comparing the focus center to the peer on this dimension.",
    },
    focusStrength: { type: "integer", description: "0-100 strength of the focus center." },
    peerStrength: { type: "integer", description: "0-100 strength of the peer." },
    notableGaps: {
      type: "array",
      items: { type: "string" },
      description: "Where the focus center trails the peer.",
    },
    notableEdges: {
      type: "array",
      items: { type: "string" },
      description: "Where the focus center leads the peer.",
    },
  },
  required: ["assessment", "focusStrength", "peerStrength", "notableGaps", "notableEdges"],
  additionalProperties: false,
};

// Load a center's extraction for one dimension (the structured `data` JSON).
async function loadExtraction(centerId: string, dimension: string): Promise<string> {
  const ex = await prisma.extraction.findFirst({
    where: { centerId, dimension },
    orderBy: { createdAt: "desc" },
  });
  return ex?.data ?? "{}";
}

async function compareDimension(
  dimension: Dimension,
  focus: { id: string; name: string },
  peer: { id: string; name: string },
): Promise<void> {
  const [focusData, peerData] = await Promise.all([
    loadExtraction(focus.id, dimension.id),
    loadExtraction(peer.id, dimension.id),
  ]);

  // The strong model does the actual comparative reasoning; a forced tool call
  // returns the structured result.
  const message = await anthropic.messages.create({
    model: COMPARE_MODEL,
    max_tokens: 4000,
    system:
      `You are an analyst comparing contemplative / well-being centers. Compare the ` +
      `FOCUS center to the PEER on the "${dimension.label}" dimension, grounded only in ` +
      `the structured extractions provided. Be specific, balanced, and actionable — ` +
      `name concrete strengths and gaps the focus center could act on.`,
    tools: [
      {
        name: "record_comparison",
        description: `Record the structured "${dimension.label}" comparison.`,
        input_schema: COMPARISON_SCHEMA,
      },
    ],
    tool_choice: { type: "tool", name: "record_comparison" },
    messages: [
      {
        role: "user",
        content:
          `FOCUS center: ${focus.name}\nExtraction:\n${focusData}\n\n` +
          `PEER center: ${peer.name}\nExtraction:\n${peerData}\n\n` +
          `Produce the comparison.`,
      },
    ],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  const parsed = (toolUse?.input ?? {}) as {
    assessment?: string;
    focusStrength?: number;
    peerStrength?: number;
    notableGaps?: string[];
    notableEdges?: string[];
  };

  await prisma.comparison.deleteMany({
    where: { peerId: peer.id, dimension: dimension.id },
  });
  await prisma.comparison.create({
    data: {
      dimension: dimension.id,
      peerId: peer.id,
      assessment: parsed.assessment ?? "",
      data: JSON.stringify({
        focusStrength: parsed.focusStrength,
        peerStrength: parsed.peerStrength,
        notableGaps: parsed.notableGaps,
        notableEdges: parsed.notableEdges,
      }),
      model: COMPARE_MODEL,
    },
  });
  console.log(`  compared ${focus.name} vs ${peer.name} on ${dimension.id}`);
}

// Compare CSC (the focus center) against every peer, across all dimensions.
export async function runCompare(): Promise<void> {
  const focus = await prisma.center.findFirst({ where: { isFocus: true } });
  if (!focus) {
    console.log("  no focus center (isFocus=true) found; seed one first");
    return;
  }
  const peers = await prisma.center.findMany({ where: { isFocus: false } });

  for (const peer of peers) {
    for (const dimension of DIMENSIONS) {
      await compareDimension(dimension, focus, peer);
    }
  }
}
