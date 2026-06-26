import type { DimensionId } from "@/config/dimensions";

// A page after crawling: cleaned text plus provenance.
export interface CrawledPage {
  url: string;
  title: string;
  text: string;
  rawHtml: string;
}

// The structured shape Claude returns per dimension during extraction. Kept
// intentionally loose — `items` is a list of findings, `summary` is a short
// synthesis. Stored as JSON in Extraction.data.
export interface DimensionExtraction {
  dimension: DimensionId;
  summary: string;
  items: string[];
  evidenceUrls: string[];
}

export interface ComparisonResult {
  dimension: DimensionId;
  assessment: string; // markdown narrative
  // Optional structured scoring the dashboard can chart.
  scores?: {
    focusStrength: number; // 0-100, CSC's strength on this dimension
    peerStrength: number; // 0-100, the peer's strength
    notableGaps: string[];
    notableEdges: string[];
  };
}
