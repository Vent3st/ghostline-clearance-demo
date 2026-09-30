import "server-only";

import { createHash } from "node:crypto";

/**
 * The single source of truth for a subject's adjudication outcome.
 *
 * This used to live inside `deep-report.ts` while `report.ts` asserted
 * unconditionally that there was "No sanctions, debarment, or federal-LE hit on
 * the subject". The two disagreed on the same page: a debarred subject's standard
 * risk row claimed a clean screen while the deep panel reported an active SAM.gov
 * exclusion and a HIGH verdict tier. Both modules now derive the outcome here, so
 * a contradiction is not expressible.
 *
 * Seeded on the slug (namespace kept as `deep:` so existing profiles do not move),
 * which makes a subject adjudicate the same way on every render.
 */

export type AdjudicationProfile = "clean" | "reportable" | "debarred" | "adverse";

export interface Adjudication {
  profile: AdjudicationProfile;
  /** Foreign-influence item: reportable under SF-86 §19, not disqualifying. */
  medFI: boolean;
  /** Active federal exclusion (SAM.gov / EPLS). The only HIGH outcome. */
  hasDebar: boolean;
  /** Settled regulatory proceeding plus a state licensing reprimand. */
  hasAdverse: boolean;
  finBad: boolean;
  inGto: boolean;
  yDebar: number;
  ySec: number;
  yBoard: number;
  /** Hits a federal/state screen would return, for source tallies. */
  screenHits: number;
  /** Raw seed bytes, reused for the psychometric scores. */
  seeds: number[];
}

export function seedInts(slug: string, n: number): number[] {
  const h = createHash("sha256").update(`deep:${slug}`).digest();
  return Array.from({ length: n }, (_, i) => h[i % h.length]);
}

export function adjudication(slug: string): Adjudication {
  const seeds = seedInts(slug, 16);

  // Spread deliberately across the roster so the demo shows a realistic mix rather
  // than a wall of "No hits": most clean, some reportable-but-not-disqualifying,
  // one in ten actually debarred, one in ten with an adverse regulatory action.
  const p = seeds[10] % 10;
  const profile: AdjudicationProfile =
    p <= 5 ? "clean" : p <= 7 ? "reportable" : p === 8 ? "debarred" : "adverse";

  const hasDebar = profile === "debarred";
  const hasAdverse = profile === "adverse";

  return {
    profile,
    medFI: profile === "reportable" || slug === "demo-marcus-reyes",
    hasDebar,
    hasAdverse,
    finBad: profile !== "clean" && seeds[11] % 3 === 0,
    inGto: profile !== "clean" && seeds[12] % 4 === 0,
    yDebar: 2018 + (seeds[13] % 7),
    ySec: 2017 + (seeds[14] % 8),
    yBoard: 2016 + (seeds[15] % 9),
    screenHits: hasDebar ? 2 : hasAdverse ? 2 : 0,
    seeds,
  };
}
