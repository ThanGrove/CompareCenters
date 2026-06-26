// The three comparison dimensions chosen for this project. Each drives both the
// extraction prompt (what to pull from a center's pages) and the comparison
// prompt (what CSC is assessed against). Add a dimension here and the pipeline
// + dashboard pick it up.

export type DimensionId = "programs" | "research" | "messaging";

export interface Dimension {
  id: DimensionId;
  label: string;
  // Guidance handed to Claude during extraction — what a good record contains.
  extractionGuidance: string;
}

export const DIMENSIONS: Dimension[] = [
  {
    id: "programs",
    label: "Programs & Offerings",
    extractionGuidance:
      "Courses, workshops, retreats, certificates, student and community programming. " +
      "Capture program names, audiences (students/faculty/public), formats, and cadence.",
  },
  {
    id: "research",
    label: "Research & Scholarship",
    extractionGuidance:
      "Research areas, labs, named faculty/scholars, notable publications, grants, " +
      "and partnerships. Capture the topical focus and the apparent scale of output.",
  },
  {
    id: "messaging",
    label: "Messaging & Positioning",
    extractionGuidance:
      "Mission and vision language, how the center frames contemplative work, its stated " +
      "values, tone, and intended audience. Capture representative phrases verbatim where useful.",
  },
];

export const DIMENSION_IDS: DimensionId[] = DIMENSIONS.map((d) => d.id);
