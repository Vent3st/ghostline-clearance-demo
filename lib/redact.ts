import "server-only";

import { aliasForName, identityForRealSlug, listEntityNames, titleCase } from "./identity";

/**
 * Render-time pseudonymization for a subject's surfaces (dossier body, critical
 * flag, raw JSON view, graph labels).
 *
 * Build one redactor per subject; it maps:
 *  - every variant of the SUBJECT's name (+ first/last tokens) → the subject alias,
 *  - every relative/associate's FULL name → that person's own alias.
 *
 * Relative aliasing is full-name only (no token split) so shared family surnames
 * don't collide. Distinctive strings (len ≥ 5) are also replaced inside emails,
 * @handles and URLs, where there is no word boundary.
 */

export interface Redaction {
  re: RegExp;
  rep: string;
}

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function buildRedactor(realSlug: string): Promise<Redaction[]> {
  const [{ subjectNames, otherNames }, self] = await Promise.all([
    listEntityNames(realSlug),
    identityForRealSlug(realSlug),
  ]);

  const pairs: { re: RegExp; rep: string; len: number }[] = [];
  // embedMin = shortest length at which we ALSO scrub the string when it has no word
  // boundary (inside emails/@handles/URLs). 5 for relatives (collision-safe); 4 for the
  // subject's own tokens, since a short surname still shows up inside an email local-part.
  const add = (real: string, rep: string, embedMin = 5) => {
    const t = real.trim();
    if (t.length < 3 || !rep) return;
    pairs.push({ re: new RegExp(`\\b${esc(t)}\\b`, "gi"), rep, len: t.length });
    // Boundary-free (embedded) replacement is only safe when the replacement does
    // NOT contain the search string — otherwise a prefix token corrupts a longer
    // word, e.g. a token that is a prefix of its own replacement would double it.
    if (t.length >= embedMin && !rep.toLowerCase().includes(t.toLowerCase())) {
      pairs.push({ re: new RegExp(esc(t), "gi"), rep, len: t.length });
    }
  };

  // ---- subject: full-name variants + tokens → subject alias ----
  const subjAll = new Set<string>([...subjectNames, self.name].filter(Boolean));
  const aFirst = self.alias.alias.split(" ")[0];
  const aLast = self.alias.alias.split(" ").slice(-1)[0];

  const firstSet = new Set<string>();
  const lastSet = new Set<string>();
  const tokens = new Set<string>();
  for (const n of subjAll) {
    add(n, self.alias.alias);
    const parts = n.split(/\s+/).filter((w) => w.length >= 3);
    if (parts[0]) firstSet.add(parts[0].toLowerCase());
    if (parts.length > 1) lastSet.add(parts[parts.length - 1].toLowerCase());
    for (const p of parts) tokens.add(titleCase(p));
  }
  for (const t of tokens) {
    const rep = firstSet.has(t.toLowerCase()) && !lastSet.has(t.toLowerCase()) ? aFirst : aLast;
    add(t, rep, 4); // subject tokens: scrub embedded down to 4 chars
  }

  // ---- relatives/associates: full name → their own alias ----
  // Case-insensitive skip of names that are really the subject (a case-only variant
  // would otherwise get a second, redundant rule — harmless for connection since
  // aliasForName resolves it back to the same subject alias, but cleaner to skip).
  const subjAllLc = new Set([...subjAll].map((s) => s.toLowerCase()));
  for (const n of otherNames) {
    if (subjAllLc.has(n.toLowerCase())) continue;
    const a = await aliasForName(n);
    add(n, a.alias);
  }

  // Longest match first so full names win over their tokens.
  pairs.sort((a, b) => b.len - a.len);
  return pairs.map(({ re, rep }) => ({ re, rep }));
}

export function applyRedactions(text: string, redactor: Redaction[]): string {
  let out = text;
  for (const { re, rep } of redactor) out = out.replace(re, rep);
  return out;
}
