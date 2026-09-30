import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { createHash } from "node:crypto";

import { RAW_DIR } from "./paths";
import { listSubjects } from "./dossier";

/**
 * Identity + pseudonym layer.
 *
 * One deterministic alias per person, keyed so that the same person always renders
 * under the same alias — on their own page, as someone else's relative, in the
 * command bar, and in the graph. That is what keeps the pseudonymized graph
 * *logically connected*: subject "Marcus" and "Marcus" as Elena's relative resolve
 * to the same alias.
 *
 * - Subjects are keyed on their SLUG (so a subject's alias is stable regardless of
 *   name spelling, and curated demo subjects keep their hand-picked identity).
 * - Everyone else (relatives/associates) is keyed on their NAME.
 * - A relative whose name matches a subject's canonical name resolves THROUGH to
 *   that subject's alias — this is the join that keeps the graph connected.
 */

// NOTE: order + length are load-bearing — aliasForSlug hashes modulo these lengths,
// so changing them re-maps every subject's alias (and its URL slug). Keep stable.
const FIRST = [
  "Avery", "Jordan", "Riley", "Sasha", "Morgan", "Quinn", "Reese", "Drew",
  "Cameron", "Emerson", "Rowan", "Skyler", "Blake", "Parker", "Hayden", "Elliot",
  "Marlow", "Sage", "Devon", "Lane", "Wren", "Nova", "Cassidy", "Frankie", "Kit",
];
const LAST = [
  "Vega", "Marlowe", "Castellan", "Okafor", "Brandt", "Nakamura", "Sorensen",
  "Delacroix", "Ashford", "Rivas", "Holloway", "Kessler", "Amara", "Bellamy",
  "Cardoza", "Winslow", "Ferro", "Sabin", "Voss", "Calloway", "Marsh", "Pike",
];
const NICK = [
  "Ghost", "Cipher", "Echo", "Vault", "Harbor", "Slate", "Ember", "Cobalt",
  "Drift", "Onyx", "Halcyon", "Beacon", "Tally", "Ridge", "Mesa", "Cove",
  "Flint", "Marlin", "Quill", "Aster", "Vesper", "Juno",
];
const ACCENTS = ["var(--p-sand)", "var(--p-sky)", "var(--p-mint)", "var(--p-lilac)"];

export interface Alias {
  alias: string;
  nick: string;
  codename: string;
  initials: string;
  accent: string;
  isDemo: boolean;
}

/** Curated aliases for the fictional demo subjects (keyed by slug). */
const SLUG_OVERRIDE: Record<string, Alias> = {
  "demo-marcus-reyes": { alias: "Marcus Reyes", nick: "Cash", codename: "GL-4A1", initials: "MR", accent: "var(--p-sky)", isDemo: true },
  "demo-elena-marlowe": { alias: "Elena Marlowe", nick: "Lark", codename: "GL-4A2", initials: "EM", accent: "var(--p-mint)", isDemo: true },
  "demo-trevor-osborne": { alias: "Trevor Osborne", nick: "Ozzy", codename: "GL-4A3", initials: "TO", accent: "var(--p-lilac)", isDemo: true },
  // The wider fictional cast. Curated so the roster is stable and reviewable.
  "avery-okafor": { alias: "Avery Okafor", nick: "Echo", codename: "GL-965B", initials: "AO", accent: "var(--p-lilac)", isDemo: false },
  "cameron-sorensen": { alias: "Cameron Sorensen", nick: "Aster", codename: "GL-3A1C", initials: "CS", accent: "var(--p-lilac)", isDemo: false },
  "devon-brandt": { alias: "Devon Brandt", nick: "Mesa", codename: "GL-76CA", initials: "DB", accent: "var(--p-sand)", isDemo: false },
  "devon-holloway": { alias: "Devon Holloway", nick: "Cobalt", codename: "GL-DA8E", initials: "DH", accent: "var(--p-mint)", isDemo: false },
  "drew-ferro": { alias: "Drew Ferro", nick: "Ridge", codename: "GL-E83C", initials: "DF", accent: "var(--p-mint)", isDemo: false },
  "elliot-cardoza": { alias: "Elliot Cardoza", nick: "Ember", codename: "GL-0F3A", initials: "EC", accent: "var(--p-sky)", isDemo: false },
  "elliot-winslow": { alias: "Elliot Winslow", nick: "Onyx", codename: "GL-BE0F", initials: "EW", accent: "var(--p-mint)", isDemo: false },
  "frankie-amara": { alias: "Frankie Amara", nick: "Cove", codename: "GL-DF64", initials: "FA", accent: "var(--p-mint)", isDemo: false },
  "hayden-amara": { alias: "Hayden Amara", nick: "Harbor", codename: "GL-5938", initials: "HA", accent: "var(--p-mint)", isDemo: false },
  "hayden-ferro": { alias: "Hayden Ferro", nick: "Tally", codename: "GL-2752", initials: "HF", accent: "var(--p-sand)", isDemo: false },
  "hayden-okafor": { alias: "Hayden Okafor", nick: "Echo", codename: "GL-A4DF", initials: "HO", accent: "var(--p-lilac)", isDemo: false },
  "jordan-calloway": { alias: "Jordan Calloway", nick: "Harbor", codename: "GL-973F", initials: "JC", accent: "var(--p-lilac)", isDemo: false },
  "jordan-ferro": { alias: "Jordan Ferro", nick: "Vesper", codename: "GL-E252", initials: "JF", accent: "var(--p-lilac)", isDemo: false },
  "jordan-sorensen": { alias: "Jordan Sorensen", nick: "Ridge", codename: "GL-97B6", initials: "JS", accent: "var(--p-mint)", isDemo: false },
  "kit-amara": { alias: "Kit Amara", nick: "Drift", codename: "GL-954E", initials: "KA", accent: "var(--p-mint)", isDemo: false },
  "lane-delacroix": { alias: "Lane Delacroix", nick: "Halcyon", codename: "GL-45E3", initials: "LD", accent: "var(--p-sand)", isDemo: false },
  "lane-nakamura": { alias: "Lane Nakamura", nick: "Mesa", codename: "GL-779F", initials: "LN", accent: "var(--p-sand)", isDemo: false },
  "lane-nakamura-77b5": { alias: "Lane Nakamura", nick: "Onyx", codename: "GL-77B5", initials: "LN", accent: "var(--p-sand)", isDemo: false },
  "marlow-amara": { alias: "Marlow Amara", nick: "Ember", codename: "GL-A622", initials: "MA", accent: "var(--p-lilac)", isDemo: false },
  "marlow-ferro": { alias: "Marlow Ferro", nick: "Cobalt", codename: "GL-D826", initials: "MF", accent: "var(--p-sky)", isDemo: false },
  "marlow-holloway": { alias: "Marlow Holloway", nick: "Echo", codename: "GL-F120", initials: "MH", accent: "var(--p-sky)", isDemo: false },
  "parker-sorensen": { alias: "Parker Sorensen", nick: "Cipher", codename: "GL-BCF8", initials: "PS", accent: "var(--p-sky)", isDemo: false },
  "quinn-winslow": { alias: "Quinn Winslow", nick: "Halcyon", codename: "GL-057D", initials: "QW", accent: "var(--p-sand)", isDemo: false },
  "reese-brandt": { alias: "Reese Brandt", nick: "Mesa", codename: "GL-8304", initials: "RB", accent: "var(--p-lilac)", isDemo: false },
  "riley-rivas": { alias: "Riley Rivas", nick: "Ghost", codename: "GL-E335", initials: "RR", accent: "var(--p-sky)", isDemo: false },
  "skyler-brandt": { alias: "Skyler Brandt", nick: "Halcyon", codename: "GL-3DF6", initials: "SB", accent: "var(--p-lilac)", isDemo: false },
  "wren-sabin": { alias: "Wren Sabin", nick: "Harbor", codename: "GL-4653", initials: "WS", accent: "var(--p-sand)", isDemo: false },
};

export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Canonical display name a subject slug implies (demo- prefix stripped). */
export function subjectNameFromSlug(slug: string): string {
  return titleCase(slug.replace(/^demo-/, "").replace(/-/g, " "));
}

export function slugifyName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function aliasFromHash(seed: string, isDemo: boolean): Alias {
  const h = createHash("sha256").update(seed).digest();
  const first = FIRST[h[0] % FIRST.length];
  const last = LAST[h[1] % LAST.length];
  return {
    alias: `${first} ${last}`,
    nick: NICK[h[2] % NICK.length],
    codename: "GL-" + h.toString("hex").slice(0, 4).toUpperCase(),
    initials: (first[0] + last[0]).toUpperCase(),
    accent: ACCENTS[h[3] % ACCENTS.length],
    isDemo,
  };
}

/** Subject alias — keyed on slug so it is stable and curated for demo subjects. */
export function aliasForSlug(slug: string): Alias {
  return SLUG_OVERRIDE[slug] ?? aliasFromHash(slug, slug.startsWith("demo-"));
}

/* ------------------------- registry (slug ↔ aliasSlug) ------------------------- */

export interface SubjectIdentity {
  realSlug: string;
  name: string; // canonical name from slug
  alias: Alias;
  aliasSlug: string; // URL-safe, no real name
}

export const subjectRegistry = cache(async (): Promise<{
  byRealSlug: Map<string, SubjectIdentity>;
  byAliasSlug: Map<string, SubjectIdentity>;
  byName: Map<string, SubjectIdentity>; // canonical-name (lowercased) → identity
}> => {
  const subs = await listSubjects();
  const byRealSlug = new Map<string, SubjectIdentity>();
  const byAliasSlug = new Map<string, SubjectIdentity>();
  const byName = new Map<string, SubjectIdentity>();
  const used = new Set<string>();

  for (const s of subs) {
    const name = subjectNameFromSlug(s.slug);
    const alias = aliasForSlug(s.slug);
    let as = slugifyName(alias.alias);
    if (used.has(as)) as = `${as}-${alias.codename.replace(/^GL-/, "").toLowerCase()}`;
    used.add(as);

    const id: SubjectIdentity = { realSlug: s.slug, name, alias, aliasSlug: as };
    byRealSlug.set(s.slug, id);
    byAliasSlug.set(as, id);
    byName.set(name.toLowerCase(), id);

    // Index every real name variant this subject actually goes by (raw fullName,
    // name, AKAs) so the same person resolves to this alias wherever they appear —
    // as a graph node, or as someone else's relative. This is the join that keeps
    // the pseudonymized graph logically connected.
    const { subjectNames } = await listEntityNames(s.slug);
    for (const n of subjectNames) {
      const key = titleCase(n).toLowerCase();
      if (key && !byName.has(key)) byName.set(key, id);
    }
  }
  return { byRealSlug, byAliasSlug, byName };
});

/** Resolve an incoming URL segment (aliasSlug OR realSlug) to the real slug. */
export async function resolveToRealSlug(seg: string): Promise<string | null> {
  const reg = await subjectRegistry();
  if (reg.byAliasSlug.has(seg)) return reg.byAliasSlug.get(seg)!.realSlug;
  if (reg.byRealSlug.has(seg)) return seg; // tolerate a real slug too
  return null;
}

export async function identityForRealSlug(realSlug: string): Promise<SubjectIdentity> {
  const reg = await subjectRegistry();
  return (
    reg.byRealSlug.get(realSlug) ?? {
      realSlug,
      name: subjectNameFromSlug(realSlug),
      alias: aliasForSlug(realSlug),
      aliasSlug: slugifyName(aliasForSlug(realSlug).alias),
    }
  );
}

/**
 * Alias for ANY person name. A name that matches a known subject resolves to that
 * subject's alias (the graph-connecting join); otherwise it hashes on the name.
 */
export async function aliasForName(name: string): Promise<Alias> {
  const canon = titleCase(name);
  const reg = await subjectRegistry();
  const hit = reg.byName.get(canon.toLowerCase());
  if (hit) return hit.alias;
  return aliasFromHash(canon, false);
}

/* --------------------------- entity-name extraction --------------------------- */

interface RawName { firstName?: string; middleName?: string; lastName?: string }
interface RawPerson {
  fullName?: string;
  name?: RawName;
  akas?: RawName[];
  relativesSummary?: RawName[];
  associatesSummary?: RawName[];
}

function nm(n?: RawName): string {
  return [n?.firstName, n?.middleName, n?.lastName].filter(Boolean).join(" ").trim();
}

/** Every person name in a subject's raw pull, split into the subject and others. */
export const listEntityNames = cache(
  async (slug: string): Promise<{ subjectNames: string[]; otherNames: string[] }> => {
    const dir = path.join(RAW_DIR, slug);
    let files: string[];
    try {
      files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json") && !f.includes(".error."));
    } catch {
      return { subjectNames: [], otherNames: [] };
    }

    let best: RawPerson | null = null;
    for (const f of files) {
      try {
        const env = JSON.parse(await fs.readFile(path.join(dir, f), "utf8")) as { persons?: RawPerson[] };
        const p = env.persons?.[0];
        if (!p) continue;
        const score = (p.relativesSummary?.length ?? 0) + (p.akas?.length ?? 0);
        if (!best || score > ((best.relativesSummary?.length ?? 0) + (best.akas?.length ?? 0))) best = p;
      } catch {
        /* skip */
      }
    }

    const subjectNames = new Set<string>();
    const otherNames = new Set<string>();
    if (best) {
      if (best.fullName) subjectNames.add(best.fullName.trim());
      if (best.name) subjectNames.add(nm(best.name));
      for (const a of best.akas ?? []) if (nm(a)) subjectNames.add(nm(a));
      for (const r of best.relativesSummary ?? []) if (nm(r)) otherNames.add(nm(r));
      for (const a of best.associatesSummary ?? []) if (nm(a)) otherNames.add(nm(a));
    }
    return {
      subjectNames: [...subjectNames].filter(Boolean),
      otherNames: [...otherNames].filter(Boolean),
    };
  },
);
