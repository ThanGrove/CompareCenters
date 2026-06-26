// Shapes the dashboard reads out of the database. The Python pipeline writes
// these as JSON into Extraction.data / Comparison.data — keep them in sync with
// pipeline/extract.py and pipeline/compare.py.
import type { DimensionId } from "@/config/dimensions";

export interface DimensionExtraction {
  dimension: DimensionId;
  summary: string;
  items: string[];
  evidenceUrls: string[];
}

export interface ComparisonData {
  focusStrength?: number;
  peerStrength?: number;
  notableGaps?: string[];
  notableEdges?: string[];
}
