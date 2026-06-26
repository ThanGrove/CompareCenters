import { anthropic, EXTRACT_MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/db";
import type Anthropic from "@anthropic-ai/sdk";
import { DIMENSIONS, type Dimension } from "@/config/dimensions";
import type { DimensionExtraction } from "./types";

// JSON schema constraining each extraction — the forced tool's input schema, so
// the tool input comes back in exactly this shape (no prose to scrape).
const EXTRACTION_SCHEMA: Anthropic.Tool.InputSchema = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "2-4 sentence synthesis of this dimension for this center.",
    },
    items: {
      type: "array",
      items: { type: "string" },
      description: "Concrete findings (programs, research areas, messaging phrases).",
    },
    evidenceUrls: {
      type: "array",
      items: { type: "string" },
      description: "URLs of pages the findings were drawn from.",
    },
  },
  required: ["summary", "items", "evidenceUrls"],
  additionalProperties: false,
};

async function extractDimension(
  dimension: Dimension,
  centerName: string,
  pages: { url: string; title: string | null; text: string }[],
): Promise<DimensionExtraction> {
  // Concatenate page text with URL markers so Claude can cite evidence.
  const corpus = pages
    .map((p) => `### ${p.title ?? p.url}\n[${p.url}]\n${p.text}`)
    .join("\n\n")
    .slice(0, 180000); // keep well under Haiku's 200K context

  // A forced tool call gives us reliably structured JSON (the tool input)
  // without depending on the newer structured-output API surface.
  const message = await anthropic.messages.create({
    model: EXTRACT_MODEL,
    max_tokens: 4000,
    system:
      `You extract structured information about contemplative / well-being centers ` +
      `from their website text. Focus only on the "${dimension.label}" dimension. ` +
      dimension.extractionGuidance +
      ` Only use what is supported by the provided pages; do not invent details.`,
    tools: [
      {
        name: "record_extraction",
        description: `Record the structured "${dimension.label}" extraction.`,
        input_schema: EXTRACTION_SCHEMA,
      },
    ],
    tool_choice: { type: "tool", name: "record_extraction" },
    messages: [
      {
        role: "user",
        content:
          `Center: ${centerName}\n\nPages:\n\n${corpus}\n\n` +
          `Extract the "${dimension.label}" information.`,
      },
    ],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  const parsed = (toolUse?.input ?? {}) as Omit<DimensionExtraction, "dimension">;
  return { dimension: dimension.id, ...parsed };
}

// Extract all dimensions for the latest complete crawl of a center.
export async function runExtract(centerId: string): Promise<void> {
  const center = await prisma.center.findUniqueOrThrow({ where: { id: centerId } });
  const crawl = await prisma.crawl.findFirst({
    where: { centerId, status: "complete" },
    orderBy: { finishedAt: "desc" },
    include: { pages: true },
  });
  if (!crawl) {
    console.log(`  no complete crawl for ${center.name}; run crawl first`);
    return;
  }

  for (const dimension of DIMENSIONS) {
    const extraction = await extractDimension(dimension, center.name, crawl.pages);
    await prisma.extraction.upsert({
      where: { crawlId_dimension: { crawlId: crawl.id, dimension: dimension.id } },
      create: {
        centerId,
        crawlId: crawl.id,
        dimension: dimension.id,
        data: JSON.stringify(extraction),
        model: EXTRACT_MODEL,
      },
      update: { data: JSON.stringify(extraction), model: EXTRACT_MODEL },
    });
    console.log(`  extracted ${dimension.id} for ${center.name}`);
  }
}
