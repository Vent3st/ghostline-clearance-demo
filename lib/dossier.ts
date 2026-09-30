import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { connection } from "next/server";
import { parse as parseYaml } from "yaml";

import {
  DATA_DIR,
  RAW_DIR,
  assertInside,
  isSafeSegment,
  isSubjectDirName,
} from "./paths";
import type {
  Dossier,
  DossierFrontmatter,
  DossierRef,
  SubjectSummary,
} from "./types";

/**
 * Read access to the collected dossier output.
 *
 * ── Why every function here calls `await connection()` ────────────────────────
 * Next 16 prerenders components whose work is only synchronous/deterministic I/O
 * into the static HTML shell at build time (see
 * node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md). Without a
 * request-time signal, these filesystem reads would be executed during
 * `next build` and real subject PII would be baked into `.next/` artifacts and
 * served stale.
 *
 * `connection()` marks the work as request-bound and excludes it — and everything
 * that renders from it — from prerendering. It lives in these helpers rather than
 * in the pages so that every present and future caller inherits the guard and no
 * new call site can forget it.
 *
 * Do not remove these calls to "optimise" the pages. The build being slower is not
 * the tradeoff; the tradeoff is PII in build output.
 */

const DOSSIER_RE = /^DOSSIER.*\.md$/i;
const CONVENTIONAL_RE = /^DOSSIER_(\d{4}-\d{2}-\d{2})\.md$/;
/** Premium deep-clearance dossiers, kept out of the default (standard) selection. */
const DEEP_RE = /^DOSSIER_DEEP.*\.md$/i;

/**
 * Split YAML frontmatter from the markdown body.
 *
 * Hand-rolled rather than gray-matter: gray-matter resolves its optional parser
 * engines through dynamic requires, which defeats static analysis and drags a
 * broad trace into the server bundle (bundle-analyzable-paths). The format here
 * is a fixed `---` fence, so the split is trivial and the YAML parse is a single
 * static import.
 *
 * A malformed or absent frontmatter block yields `{}` and the whole file as body,
 * which is the correct outcome for pre-convention dossiers that have none.
 */
function splitFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  // Tolerate a leading BOM and CRLF line endings.
  const text = raw.replace(/^﻿/, "");
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { data: {}, body: text };

  const body = text.slice(m[0].length);
  try {
    const parsed: unknown = parseYaml(m[1]);
    return {
      data: parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {},
      body,
    };
  } catch {
    // Bad YAML shouldn't hide the dossier — show the prose, drop the metadata.
    return { data: {}, body };
  }
}

function toDossierRef(file: string): DossierRef {
  const m = CONVENTIONAL_RE.exec(file);
  return { file, date: m ? m[1] : null, conventional: Boolean(m) };
}

/** Newest conventional dossier wins; legacy names sort after, by name descending. */
function pickLatest(refs: DossierRef[]): DossierRef | null {
  if (refs.length === 0) return null;
  const dated = refs.filter((r) => r.date).sort((a, b) => b.date!.localeCompare(a.date!));
  if (dated.length > 0) return dated[0];
  return [...refs].sort((a, b) => b.file.localeCompare(a.file))[0];
}

async function readdirSafe(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

/**
 * The whitelist. Subject slugs are only ever validated against this listing —
 * never sanitised, never trusted from the request.
 *
 * Wrapped in React.cache(): a single request typically validates a slug several
 * times over (page render, metadata, raw listing), and each call would otherwise
 * re-read the directory. cache() dedupes them per request without caching across
 * requests, so a subject added on disk still appears on the next load.
 */
export const listSubjectSlugs = cache(async (): Promise<string[]> => {
  await connection();
  const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && isSubjectDirName(e.name))
    .map((e) => e.name)
    .sort();
});

/** Set form for O(1) membership; same per-request dedup as above. */
const subjectSlugSet = cache(async (): Promise<ReadonlySet<string>> => {
  return new Set(await listSubjectSlugs());
});

export async function isKnownSubject(slug: string): Promise<boolean> {
  // Cheap synchronous guard first — a malformed slug never reaches the filesystem.
  if (!isSafeSegment(slug)) return false;
  return (await subjectSlugSet()).has(slug);
}

/** Returns null when the slug is not a real subject directory. */
export async function resolveSubjectDir(slug: string): Promise<string | null> {
  if (!(await isKnownSubject(slug))) return null;

  const dir = path.join(DATA_DIR, slug);
  if (!assertInside(DATA_DIR, dir)) return null;
  return dir;
}

export const listSubjects = cache(async (): Promise<SubjectSummary[]> => {
  await connection();
  const slugs = await listSubjectSlugs();

  // Independent reads — issue them together rather than sequentially.
  const [rawDirs, perSubject] = await Promise.all([
    readdirSafe(RAW_DIR).then((d) => new Set(d)),
    Promise.all(slugs.map((slug) => readdirSafe(path.join(DATA_DIR, slug)))),
  ]);

  // Pull date comes from the record envelope's requestTime. Without it a subject with
  // no dated DOSSIER_*.md file reads as "undated" even though the pull date is on disk.
  const pulledDates = await Promise.all(
    slugs.map(async (slug, i) => {
      const candidates = perSubject[i].filter((f) => f.endsWith(".json"));
      for (const f of candidates) {
        try {
          const raw = JSON.parse(await fs.readFile(path.join(DATA_DIR, slug, f), "utf8")) as { requestTime?: string };
          const t = typeof raw.requestTime === "string" ? raw.requestTime.slice(0, 10) : "";
          if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
        } catch {
          /* unreadable or not an envelope — try the next file */
        }
      }
      return null;
    }),
  );

  return slugs.map((slug, i) => {
    const dossiers = perSubject[i].filter((f) => DOSSIER_RE.test(f)).map(toDossierRef);
    return {
      slug,
      dossiers,
      latest: pickLatest(dossiers),
      pulled: pulledDates[i],
      hasRaw: rawDirs.has(slug),
    };
  });
});

export async function getDossier(
  slug: string,
  file?: string,
): Promise<Dossier | null> {
  await connection();

  const dir = await resolveSubjectDir(slug);
  if (!dir) return null;

  const files = (await readdirSafe(dir)).filter((f) => DOSSIER_RE.test(f));
  if (files.length === 0) return null;

  let target: string;
  if (file) {
    // Requested filename must be safe AND present in the directory listing.
    if (!isSafeSegment(file) || !files.includes(file)) return null;
    target = file;
  } else {
    // Default view = the standard dossier; deep (premium) files are opt-in.
    const standard = files.filter((f) => !DEEP_RE.test(f));
    const latest = pickLatest((standard.length ? standard : files).map(toDossierRef));
    if (!latest) return null;
    target = latest.file;
  }

  const full = path.join(dir, target);
  if (!assertInside(dir, full)) return null;

  const { data, body } = splitFrontmatter(await fs.readFile(full, "utf8"));
  const fm = data as Partial<DossierFrontmatter>;

  return {
    slug,
    file: target,
    // Older dossiers predate the frontmatter convention; fall back rather than throw.
    frontmatter: { ...fm, title: fm.title ?? slug } as DossierFrontmatter,
    body,
  };
}

/** The newest premium deep-clearance dossier for a subject, or null. */
export async function getDeepDossier(slug: string): Promise<Dossier | null> {
  await connection();
  const dir = await resolveSubjectDir(slug);
  if (!dir) return null;

  const deep = (await readdirSafe(dir))
    .filter((f) => DEEP_RE.test(f))
    .sort((a, b) => b.localeCompare(a));
  if (deep.length === 0) return null;
  return getDossier(slug, deep[0]);
}

/* ---------------- raw pulls ---------------- */

export interface RawEntry {
  /** Path relative to the subject's raw directory, e.g. "reverse_phone/2035551212.json". */
  rel: string;
  size: number;
  /** Runners write "<name>.error.json" when a call fails. */
  isError: boolean;
}

/** One level of endpoint subdirectories, matching the documented raw layout. */
export const listRaw = cache(async (slug: string): Promise<RawEntry[] | null> => {
  await connection();
  if (!(await isKnownSubject(slug))) return null;

  const root = path.join(RAW_DIR, slug);
  if (!assertInside(RAW_DIR, root)) return null;

  // stat every entry in a directory concurrently rather than one at a time.
  async function walk(dir: string, prefix: string, depth: number): Promise<RawEntry[]> {
    const names = (await readdirSafe(dir)).filter((n) => !n.startsWith("."));

    const results = await Promise.all(
      names.map(async (name) => {
        const full = path.join(dir, name);
        const rel = prefix ? `${prefix}/${name}` : name;
        const st = await fs.stat(full);

        if (st.isDirectory()) {
          return depth > 0 ? walk(full, rel, depth - 1) : [];
        }
        if (!name.endsWith(".json")) return [];
        return [{ rel, size: st.size, isError: name.endsWith(".error.json") }];
      }),
    );

    return results.flat();
  }

  const out = await walk(root, "", 1);
  return out.sort((a, b) => a.rel.localeCompare(b.rel));
});

/** Returns the file's text, or null if the slug/relative path does not resolve. */
export async function readRaw(slug: string, rel: string): Promise<string | null> {
  await connection();

  const entries = await listRaw(slug);
  if (!entries) return null;
  // Whitelist again: only paths this subject actually exposes.
  if (!entries.some((e) => e.rel === rel)) return null;

  // Validate each segment independently; a whitelist hit is necessary but the
  // segments still have to be well-formed before they touch the filesystem.
  if (!rel.split("/").every(isSafeSegment)) return null;

  const full = path.join(RAW_DIR, slug, ...rel.split("/"));
  if (!assertInside(path.join(RAW_DIR, slug), full)) return null;

  return fs.readFile(full, "utf8");
}
