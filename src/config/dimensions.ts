// The comparison dimensions, loaded from the shared JSON config that the Python
// pipeline also reads (config/dimensions.json) so they're defined once. This
// module just adds types for the dashboard.
import dimensionsJson from "../../config/dimensions.json";

export type DimensionId = "programs" | "research" | "messaging";

export interface Dimension {
  id: DimensionId;
  label: string;
  extractionGuidance: string;
}

export const DIMENSIONS = dimensionsJson as Dimension[];

export const DIMENSION_IDS: DimensionId[] = DIMENSIONS.map((d) => d.id);
