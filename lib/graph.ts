import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { connection } from "next/server";

import { RAW_DIR, assertInside, isSafeSegment } from "./paths";

/**
 * Entity graph derived from each subject's sample person record.
 *
 * Source: `<subject>/person*.json`. The `persons[]` objects are already
 * entity-resolved (`entityId`), carry date windows, and give per-edge scores.
 *
 * Coverage is partial: only subjects with a person record appear. That is a data
 * gap, not a finding of "no relationships", and callers must present it as such.
 */

export type EntityKind = "person" | "address" | "phone" | "org";

export interface GraphNode {
  id: string;
  kind: EntityKind;
  label: string;
  /** Subject slugs this node was seen in. Length > 1 means it bridges subjects. */
  subjects: string[];
  /** Present for person nodes that are themselves a pulled subject. */
  anchorSlug?: string;
  detail?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  kind: "resident" | "phone" | "relative" | "employer";
  /** Relative score (100/150/475-style), not a 0–1 probability. */
  score?: number;
  label?: string;
  /** True when co-residency is evidenced by a shared household id. */
  sharedHousehold?: boolean;
}

export interface ResidencySpan {
  personId: string;
  personLabel: string;
  addressId: string;
  addressLabel: string;
  /** Epoch ms; null when the pull carried no usable date. */
  from: number | null;
  to: number | null;
}

export interface SubjectGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  residency: ResidencySpan[];
  /** Subjects with a usable person pull. */
  covered: string[];
  /** Subjects with a _raw dir but no parseable person file. */
  rawButUnusable: string[];
}

/* ------------------------------------------------------------------ *
 * Raw shapes — only the fields actually read. The upstream payload has
 * many more; deliberately not typed exhaustively.
 * ------------------------------------------------------------------ */

interface RawName {
  firstName?: string;
  middleName?: string;
  lastName?: string;
}
interface RawAddress {
  addressHash?: string;
  fullAddress?: string;
  firstReportedDate?: string;
  lastReportedDate?: string;
}
interface RawPhone {
  phoneNumber?: string;
  phoneType?: string;
}
interface RawRelative extends RawName {
  entityId?: string;
  relativeType?: string;
  relativeLevel?: string;
  score?: number;
  sharedHouseholdIds?: string[];
  city?: string;
  state?: string;
}
interface RawPerson {
  entityId?: string;
  fullName?: string;
  name?: RawName;
  age?: number;
  addresses?: RawAddress[];
  phoneNumbers?: RawPhone[];
  employers?: { company?: string; title?: string; isCurrent?: boolean }[];
  relativesSummary?: RawRelative[];
}
interface RawEnvelope {
  persons?: RawPerson[];
}

function personName(p: { fullName?: string; name?: RawName }): string {
  if (p.fullName?.trim()) return p.fullName.trim();
  const n = p.name;
  return [n?.firstName, n?.middleName, n?.lastName].filter(Boolean).join(" ").trim();
}

function relativeName(r: RawRelative): string {
  return [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" ").trim();
}

/** Source emits M/D/YYYY. Returns epoch ms, or null when unusable. */
function parseDate(s: string | undefined): number | null {
  if (!s) return null;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const t = Date.UTC(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  return Number.isNaN(t) ? null : t;
}

/** How much signal a person payload carries — used to pick between pull variants. */
function richness(p: RawPerson): number {
  return (p.relativesSummary?.length ?? 0) + (p.addresses?.length ?? 0) + (p.phoneNumbers?.length ?? 0);
}

/**
 * Best person record for a subject.
 *
 * Selection is by *content*, not filename. Subjects have several pulls and the
 * naming has drifted well past `person*.json` — at least one subject directory
 * stores its pulls under subject-named files instead, which a name pattern misses
 * entirely. So: read every top-level JSON, keep the ones that parse to an envelope
 * with a non-empty `persons[]`, and take the richest.
 *
 * NB: do not name real subjects or their files in comments here. Source comments
 * are embedded verbatim in the generated sourcemaps under `.next/`, so anything
 * written above ships with the build.
 *
 * Non-person payloads in the same directory (`divorce.json`, …) simply lack
 * `persons[]` and drop out on their own. Error payloads are skipped by name and,
 * failing that, by having no persons either.
 */
const loadPerson = cache(async (slug: string): Promise<RawPerson | null> => {
  if (!isSafeSegment(slug)) return null;

  const dir = path.join(RAW_DIR, slug);
  if (!assertInside(RAW_DIR, dir)) return null;

  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch {
    return null;
  }

  const candidates = names.filter(
    (n) => n.endsWith(".json") && !n.includes(".error."),
  );

  const parsed = await Promise.all(
    candidates.map(async (n) => {
      try {
        const env = JSON.parse(await fs.readFile(path.join(dir, n), "utf8")) as RawEnvelope;
        return env.persons?.[0] ?? null;
      } catch {
        return null; // Unreadable or malformed pull — skip, don't fail the graph.
      }
    }),
  );

  let best: RawPerson | null = null;
  for (const p of parsed) {
    if (p && (!best || richness(p) > richness(best))) best = p;
  }
  return best;
});

/** Subjects that have a _raw directory at all. */
export const listRawSubjects = cache(async (): Promise<string[]> => {
  await connection();
  try {
    const entries = await fs.readdir(RAW_DIR, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
});

/**
 * Build the graph.
 *
 * Default view is the anchor subjects plus *bridge* entities — anything shared by
 * two or more anchors. Including every relative of every subject would blow past
 * the SVG node budget (~49 relatives × 8 subjects) and bury the signal that
 * actually matters, which is where subjects touch each other.
 *
 * Pass `expand` with a slug to also include that subject's full neighbourhood.
 * Pass `only = true` with `expand` to render ONLY that subject's ego-network
 * (its own people/addresses/phones) — used by the per-subject focused graph.
 */
export const buildGraph = cache(async (expand?: string, only = false): Promise<SubjectGraph> => {
  await connection();

  const slugs = await listRawSubjects();
  const people = await Promise.all(
    slugs.map(async (slug) => ({ slug, person: await loadPerson(slug) })),
  );

  const covered: string[] = [];
  const rawButUnusable: string[] = [];

  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const residency: ResidencySpan[] = [];

  // Which anchors touched each non-anchor entity — drives bridge detection.
  const seenBy = new Map<string, Set<string>>();
  const touch = (id: string, slug: string) => {
    const s = seenBy.get(id) ?? new Set<string>();
    s.add(slug);
    seenBy.set(id, s);
  };

  const addNode = (n: GraphNode) => {
    const existing = nodes.get(n.id);
    if (existing) {
      for (const s of n.subjects) {
        if (!existing.subjects.includes(s)) existing.subjects.push(s);
      }
      existing.anchorSlug ??= n.anchorSlug;
      return existing;
    }
    nodes.set(n.id, n);
    return n;
  };

  for (const { slug, person } of people) {
    if (!person) {
      rawButUnusable.push(slug);
      continue;
    }
    covered.push(slug);

    const anchorId = person.entityId ? `p:${person.entityId}` : `p:slug:${slug}`;
    const anchorLabel = personName(person) || slug;

    addNode({
      id: anchorId,
      kind: "person",
      label: anchorLabel,
      subjects: [slug],
      anchorSlug: slug,
      detail: person.age ? `age ${person.age}` : undefined,
    });

    for (const a of person.addresses ?? []) {
      if (!a.addressHash) continue;
      const id = `a:${a.addressHash}`;
      addNode({
        id,
        kind: "address",
        label: a.fullAddress ?? a.addressHash,
        subjects: [slug],
      });
      touch(id, slug);
      edges.push({ source: anchorId, target: id, kind: "resident" });
      residency.push({
        personId: anchorId,
        personLabel: anchorLabel,
        addressId: id,
        addressLabel: a.fullAddress ?? a.addressHash,
        from: parseDate(a.firstReportedDate),
        to: parseDate(a.lastReportedDate),
      });
    }

    for (const ph of person.phoneNumbers ?? []) {
      if (!ph.phoneNumber) continue;
      const id = `t:${ph.phoneNumber}`;
      addNode({
        id,
        kind: "phone",
        label: ph.phoneNumber,
        subjects: [slug],
        detail: ph.phoneType ?? undefined,
      });
      touch(id, slug);
      edges.push({ source: anchorId, target: id, kind: "phone" });
    }

    // Employers become shared org nodes. A company that appears for two subjects is a
    // coworker bridge, which is why the graph shows organisational ties and not just
    // households and phones.
    for (const em of person.employers ?? []) {
      const co = em.company?.trim();
      if (!co) continue;
      const id = `o:${co.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      addNode({
        id,
        kind: "org",
        label: co,
        subjects: [slug],
        detail: em.title ?? undefined,
      });
      touch(id, slug);
      edges.push({
        source: anchorId,
        target: id,
        kind: "employer",
        label: em.isCurrent ? "employer (current)" : "employer (former)",
      });
    }

    for (const r of person.relativesSummary ?? []) {
      if (!r.entityId) continue;
      const id = `p:${r.entityId}`;
      const label = relativeName(r);
      if (!label) continue;

      addNode({
        id,
        kind: "person",
        label,
        subjects: [slug],
        detail: [r.city, r.state].filter(Boolean).join(", ") || undefined,
      });
      touch(id, slug);
      edges.push({
        source: anchorId,
        target: id,
        kind: "relative",
        score: r.score,
        label: r.relativeType,
        sharedHousehold: (r.sharedHouseholdIds?.length ?? 0) > 0,
      });
    }
  }

  // Keep anchors, anything bridging two or more anchors, and the expanded subject.
  // In `only` mode keep just the focused subject's own ego-network.
  const keep = new Set<string>();
  for (const n of nodes.values()) {
    if (only && expand) {
      if (n.subjects.includes(expand)) keep.add(n.id);
      continue;
    }
    const bridges = (seenBy.get(n.id)?.size ?? 0) > 1;
    const inExpanded = expand ? n.subjects.includes(expand) : false;
    if (n.anchorSlug || bridges || inExpanded) keep.add(n.id);
  }

  return {
    nodes: [...nodes.values()].filter((n) => keep.has(n.id)),
    edges: edges.filter((e) => keep.has(e.source) && keep.has(e.target)),
    residency: residency.filter((r) => keep.has(r.personId) && keep.has(r.addressId)),
    covered,
    rawButUnusable,
  };
});
