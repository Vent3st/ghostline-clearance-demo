/**
 * Generate components/brand-icons.ts from the simple-icons package.
 *
 * Usage:  node scripts/gen_brand_icons.mjs
 * Deps:   simple-icons (devDependency only — the generated file has no runtime dep)
 *
 * Why generate instead of importing: simple-icons is a 3,463-icon package. Inlining
 * the ~15 marks this demo uses keeps them out of the client bundle and means the app
 * builds with no extra runtime dependency.
 */
import { writeFileSync } from "node:fs";
import * as si from "simple-icons";

// Platform label in the data -> simple-icons export. LinkedIn is deliberately absent:
// the brand had its icon removed from Simple Icons, so no freely-licensed mark exists
// and the UI falls back to a generic glyph rather than copying the logo.
const MAP = {
  GitHub: "siGithub",
  X: "siX",
  Instagram: "siInstagram",
  Reddit: "siReddit",
  TikTok: "siTiktok",
  Facebook: "siFacebook",
  Strava: "siStrava",
  Pinterest: "siPinterest",
  Twitch: "siTwitch",
  YouTube: "siYoutube",
  Mastodon: "siMastodon",
  Letterboxd: "siLetterboxd",
  "Google Scholar": "siGooglescholar",
  ResearchGate: "siResearchgate",
  Behance: "siBehance",
};

const rows = [];
for (const [label, key] of Object.entries(MAP)) {
  const icon = si[key];
  if (!icon) {
    console.warn(`skipped ${label}: ${key} not in simple-icons`);
    continue;
  }
  rows.push(
    `  ${JSON.stringify(label)}: { title: ${JSON.stringify(icon.title)}, hex: "#${icon.hex}", path: ${JSON.stringify(icon.path)} },`,
  );
}

writeFileSync(
  "components/brand-icons.ts",
  `/**
 * Brand marks for the social surface. GENERATED — run scripts/gen_brand_icons.mjs.
 *
 * Source: simple-icons v${si.siGithub ? "16" : "?"}, whose icon files are released under
 * CC0-1.0 (public domain). Each entry is one 24x24 path.
 *
 * The marks remain the trademarks of their respective owners. They are used here only
 * to identify the platform an account sits on — nominative use, no affiliation with or
 * endorsement by any platform is implied, and the data they label is fictional.
 *
 * LinkedIn is absent on purpose: the brand had its icon removed from Simple Icons, so
 * there is no freely-licensed mark, and the UI falls back to a generic glyph instead of
 * copying the logo.
 */

export interface BrandMark {
  title: string;
  hex: string;
  /** Single SVG path in a 0 0 24 24 viewBox. */
  path: string;
}

export const BRAND_MARKS: Record<string, BrandMark> = {
${rows.join("\n")}
};
`,
);
console.log(`wrote components/brand-icons.ts with ${rows.length} marks`);
