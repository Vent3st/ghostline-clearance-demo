import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Translate a records-based relative/association score (~100–475) into a plain
 * likelihood band. A raw number confuses end users; High/Medium/Low is actionable.
 */
export function scoreBand(score: number | null | undefined): "High" | "Medium" | "Low" | null {
  if (score == null) return null;
  if (score >= 400) return "High";
  if (score >= 200) return "Medium";
  return "Low";
}

/** Token color for a likelihood band (readable in the report/graph palettes). */
export function bandColor(band: "High" | "Medium" | "Low" | null): string {
  return band === "High" ? "var(--good, #4FB894)" : band === "Medium" ? "var(--warn, #D8A24A)" : "var(--muted, #7E8BA3)";
}
