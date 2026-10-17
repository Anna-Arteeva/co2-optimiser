import raw from "@/data/factors.json";
import type { FactorData } from "./model";

export const data = raw as FactorData;

/** Stack order and color per category. Color follows the category, never its rank. */
export const categoryColor: Record<string, string> = {
  mobility: "var(--series-1)",
  housing: "var(--series-2)",
  electricity: "var(--series-3)",
  food: "var(--series-4)",
  consumption: "var(--series-5)",
  infrastructure: "var(--locked)",
};
