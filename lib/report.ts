import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { connection } from "next/server";

import { RAW_DIR, assertInside, isSafeSegment } from "./paths";
import { aliasForName, aliasForSlug, type Alias } from "./identity";
import { adjudication } from "@/lib/adjudication";
import { buildLicensing, type Licensing } from "./licensing";

/**
 * Structured clearance-report model, built from a subject's raw pull.
 *
 * Names are aliased at the FIELD level here (subject → aliasForSlug, relatives →
 * aliasForName) — never by regex over rendered text — so there is no substring
 * corruption and the report reads cleanly. The clearance-report component renders
 * this model in the marketing `/clearance` visual language.
 */

interface RawName { firstName?: string; middleName?: string; lastName?: string }
interface RawAddr {
  addressHash?: string; fullAddress?: string; city?: string; state?: string;
  firstReportedDate?: string; lastReportedDate?: string;
}
interface RawPhone { phoneNumber?: string; company?: string; phoneType?: string }
interface RawEmployer {
  company?: string; title?: string; city?: string; state?: string;
  fromDate?: string; toDate?: string; isCurrent?: boolean;
}
interface RawRel extends RawName { relativeType?: string; score?: number; city?: string; state?: string; sharedHouseholdIds?: string[] }
interface RawPerson {
  entityId?: string; fullName?: string; name?: RawName; age?: number; dob?: string;
  addresses?: RawAddr[]; phoneNumbers?: RawPhone[]; emailAddresses?: unknown[];
  relativesSummary?: RawRel[]; akas?: RawName[];
  employers?: RawEmployer[]; occupation?: string;
}

export interface ReportNode { id: string; label: string; kind: "person" | "address" | "phone" | "org"; x: number; y: number; pred?: boolean }
export interface ReportEdge { a: string; b: string; pred?: boolean }

export type AdjType = "Utility" | "Government" | "Military" | "Company HQ" | "Institution" | "Infrastructure";
export interface Adjacency { name: string; type: AdjType; city: string; distanceMi: number; relevance: string; confidence: number }

export interface ReportModel {
  alias: Alias;
  akas: string[];
  age: number | null;
  dobYear: string | null;
  location: string | null;
  isMock: boolean;
  confidence: number;
  risk: "low" | "elevated";
  quickstats: { sourceFamilies: number; recordsFused: number; connections: number; riskFlags: number };
  addresses: { full: string; city: string | null; first: string | null; last: string | null }[];
  phones: { number: string; carrier: string | null; type: string | null }[];
  relatives: { name: string; relationship: string; score: number | null; location: string | null }[];
  emails: number;
  /** Identity surface carried over from the written-dossier format (counts only — no name or address leaks). */
  surface: {
    akaVariants: number;
    emailClasses: string;
    householdIds: number;
    span: string | null;
    entityTail: string | null;
    tenureSince: string | null;
  };
  /** Employment history — company, role and tenure, newest first. */
  employment: { company: string; title: string | null; location: string | null; from: string | null; to: string | null; current: boolean }[];
  occupation: string | null;
  recordsByCategory: { label: string; count: number; tone?: "warn" }[];
  activityByYear: { year: string; count: number }[];
  graph: { nodes: ReportNode[]; edges: ReportEdge[] };
  /** Critical sites (utilities/gov/military/HQ/education/infra) near the subject's cities. */
  adjacency: Adjacency[];
  risks: { title: string; source: string; sev: "warning" | "info" }[];
  licensing: Licensing;
  sources: { name: string; count: number | string; conf?: string }[];
  sealedAt: string;
  hashHead: string;
}

function nm(n?: RawName): string {
  return [n?.firstName, n?.middleName, n?.lastName].filter(Boolean).join(" ").trim();
}
const WEBMAIL = /(gmail|yahoo|hotmail|outlook|live|aol|icloud|me|proton(mail)?|gmx|mail)\./i;
/** Email surface as provider CLASSES, never the address — a personal domain can carry a name. */
function emailClasses(list: unknown[]): string {
  let web = 0, other = 0;
  for (const e of list) {
    const addr = typeof e === "string" ? e : typeof (e as { emailAddress?: string })?.emailAddress === "string" ? (e as { emailAddress: string }).emailAddress : "";
    const dom = addr.split("@")[1] ?? "";
    if (!dom) continue;
    if (WEBMAIL.test(dom)) web++;
    else other++;
  }
  const parts: string[] = [];
  if (web) parts.push(`${web} webmail`);
  if (other) parts.push(`${other} corporate / self-hosted`);
  return parts.join(" · ") || "none on file";
}
function yearOf(s?: string): string | null {
  const m = /(\d{4})/.exec(s ?? "");
  return m ? m[1] : null;
}

/** Representative critical sites per city (demo cities); generic fallback otherwise. */
const CITY_ADJ: Record<string, Adjacency[]> = {
  austin: [
    { name: "Austin Energy (municipal utility)", type: "Utility", city: "Austin, TX", distanceMi: 2.4, relevance: "residential utility grid overlap", confidence: 0.7 },
    { name: "IRS Austin Submission Processing Center", type: "Government", city: "Austin, TX", distanceMi: 6.1, relevance: "federal facility in commute radius", confidence: 0.6 },
    { name: "University of Texas at Austin", type: "Institution", city: "Austin, TX", distanceMi: 3.2, relevance: "alumni-pipeline / research adjacency", confidence: 0.55 },
    { name: "Austin-Bergstrom Intl Airport", type: "Infrastructure", city: "Austin, TX", distanceMi: 8.0, relevance: "transit-hub proximity", confidence: 0.6 },
  ],
  "round rock": [
    { name: "Dell Technologies — Global HQ", type: "Company HQ", city: "Round Rock, TX", distanceMi: 1.1, relevance: "major-employer HQ adjacency", confidence: 0.72 },
  ],
  "el paso": [
    { name: "Fort Bliss (U.S. Army)", type: "Military", city: "El Paso, TX", distanceMi: 5.3, relevance: "military installation in origin region", confidence: 0.75 },
    { name: "El Paso Electric (utility)", type: "Utility", city: "El Paso, TX", distanceMi: 3.0, relevance: "utility grid of childhood region", confidence: 0.65 },
    { name: "CBP El Paso Sector HQ (DHS)", type: "Government", city: "El Paso, TX", distanceMi: 7.4, relevance: "federal border-agency facility", confidence: 0.6 },
  ],
  arlington: [
    { name: "The Pentagon (DoD)", type: "Military", city: "Arlington, VA", distanceMi: 3.5, relevance: "DoD headquarters in commute radius", confidence: 0.72 },
    { name: "DARPA Headquarters", type: "Government", city: "Arlington, VA", distanceMi: 2.1, relevance: "defense-research agency adjacency", confidence: 0.6 },
    { name: "Fort Myer (JBM-HH)", type: "Military", city: "Arlington, VA", distanceMi: 2.8, relevance: "military installation adjacency", confidence: 0.65 },
    { name: "Reagan National Airport", type: "Infrastructure", city: "Arlington, VA", distanceMi: 4.0, relevance: "transit-hub proximity", confidence: 0.6 },
  ],
  bethesda: [
    { name: "National Institutes of Health", type: "Government", city: "Bethesda, MD", distanceMi: 2.2, relevance: "federal research campus", confidence: 0.6 },
    { name: "Walter Reed Nat'l Military Medical Center", type: "Military", city: "Bethesda, MD", distanceMi: 3.1, relevance: "military medical installation", confidence: 0.65 },
    { name: "Pepco (utility)", type: "Utility", city: "Bethesda, MD", distanceMi: 2.5, relevance: "residential utility grid overlap", confidence: 0.6 },
  ],
  norfolk: [
    { name: "Naval Station Norfolk (U.S. Navy)", type: "Military", city: "Norfolk, VA", distanceMi: 4.4, relevance: "largest naval base in origin region", confidence: 0.78 },
    { name: "Dominion Energy (utility)", type: "Utility", city: "Norfolk, VA", distanceMi: 2.6, relevance: "residential utility grid overlap", confidence: 0.6 },
    { name: "Old Dominion University", type: "Institution", city: "Norfolk, VA", distanceMi: 3.4, relevance: "regional education institution", confidence: 0.5 },
  ],
  houston: [
    { name: "NASA Johnson Space Center", type: "Government", city: "Houston, TX", distanceMi: 9.0, relevance: "federal facility in metro", confidence: 0.55 },
    { name: "CenterPoint Energy (utility)", type: "Utility", city: "Houston, TX", distanceMi: 3.0, relevance: "residential utility grid overlap", confidence: 0.6 },
    { name: "University of Houston", type: "Institution", city: "Houston, TX", distanceMi: 4.2, relevance: "regional education institution", confidence: 0.5 },
  ],
};

function computeAdjacency(cities: string[], fallbackLoc: string | null): Adjacency[] {
  const out: Adjacency[] = [];
  for (const c of cities) {
    const key = c.split(",")[0].trim().toLowerCase();
    if (CITY_ADJ[key]) out.push(...CITY_ADJ[key]);
  }
  if (out.length === 0) {
    const loc = fallbackLoc ?? "region";
    out.push(
      { name: `${loc} municipal utility`, type: "Utility", city: loc, distanceMi: 3, relevance: "residential grid overlap", confidence: 0.5 },
      { name: `${loc} federal building`, type: "Government", city: loc, distanceMi: 6, relevance: "federal facility in radius", confidence: 0.45 },
    );
  }
  // Never emit the same institution twice (a subject with two addresses in one city
  // must not double its sites).
  const seen = new Set<string>();
  return out.filter((a) => {
    const k = a.name.trim().toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const loadBest = cache(async (slug: string): Promise<RawPerson | null> => {
  if (!isSafeSegment(slug)) return null;
  const dir = path.join(RAW_DIR, slug);
  if (!assertInside(RAW_DIR, dir)) return null;
  let files: string[];
  try {
    files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json") && !f.includes(".error."));
  } catch {
    return null;
  }
  let best: RawPerson | null = null;
  const rich = (p: RawPerson) => (p.relativesSummary?.length ?? 0) + (p.addresses?.length ?? 0) + (p.phoneNumbers?.length ?? 0);
  for (const f of files) {
    try {
      const env = JSON.parse(await fs.readFile(path.join(dir, f), "utf8")) as { persons?: RawPerson[] };
      const p = env.persons?.[0];
      if (p && (!best || rich(p) > rich(best))) best = p;
    } catch {
      /* skip */
    }
  }
  return best;
});

export const buildReportModel = cache(async (slug: string): Promise<ReportModel | null> => {
  await connection();
  const p = await loadBest(slug);
  if (!p) return null;

  const alias = aliasForSlug(slug);
  const [aFirst, ...aRest] = alias.alias.split(" ");
  const aLast = aRest.length ? aRest[aRest.length - 1] : aFirst;

  const addresses = (p.addresses ?? [])
    .filter((a) => a.fullAddress || a.addressHash)
    .map((a) => ({
      full: a.fullAddress ?? "—",
      city: [a.city, a.state].filter(Boolean).join(", ") || null,
      first: a.firstReportedDate ?? null,
      last: a.lastReportedDate ?? null,
    }));
  const phones = (p.phoneNumbers ?? [])
    .filter((x) => x.phoneNumber)
    .map((x) => ({ number: x.phoneNumber!, carrier: x.company ?? null, type: x.phoneType ?? null }));
  const emails = Array.isArray(p.emailAddresses) ? p.emailAddresses.length : 0;

  // relatives aliased at the field level (async — resolves subjects→their alias too)
  const relResolved = await Promise.all(
    (p.relativesSummary ?? []).filter((r) => nm(r)).map(async (r) => ({
      name: (await aliasForName(nm(r))).alias,
      relationship: r.relativeType ?? "Associate",
      score: typeof r.score === "number" ? r.score : null,
      location: [r.city, r.state].filter(Boolean).join(", ") || null,
    })),
  );

  const records = addresses.length + phones.length + relResolved.length + emails;
  const confidence = Math.min(0.95, 0.62 + 0.02 * records);

  // activity-by-year from address windows
  const yearCounts = new Map<string, number>();
  for (const a of addresses) {
    for (const y of [yearOf(a.first ?? undefined), yearOf(a.last ?? undefined)]) {
      if (y) yearCounts.set(y, (yearCounts.get(y) ?? 0) + 1);
    }
  }
  const activityByYear = [...yearCounts.entries()].sort((x, y) => x[0].localeCompare(y[0])).map(([year, count]) => ({ year, count }));

  const householdIds = new Set<string>();
  for (const r of p.relativesSummary ?? []) for (const h of r.sharedHouseholdIds ?? []) householdIds.add(h);
  const years = activityByYear.map((y) => y.year);
  const licensingModel = buildLicensing(slug);
  const surface: ReportModel["surface"] = {
    akaVariants: (p.akas ?? []).length,
    emailClasses: emailClasses(Array.isArray(p.emailAddresses) ? p.emailAddresses : []),
    householdIds: householdIds.size,
    span: years.length ? `${years[0]}–${years[years.length - 1]}` : null,
    entityTail: p.entityId ? `…${p.entityId.replace(/\D/g, "").slice(-6) || "n/a"}` : null,
    tenureSince: licensingModel.licenses.length
      ? licensingModel.licenses.map((l) => l.since).sort()[0]
      : null,
  };

  const recordsByCategory: ReportModel["recordsByCategory"] = [
    { label: "Address", count: addresses.length },
    { label: "Phone", count: phones.length },
    { label: "Relatives", count: relResolved.length },
    { label: "Email", count: emails },
  ].filter((r) => r.count > 0);

  // Radial graph: subject center, satellites around — people (family/associates),
  // unique places, and phones. Dedupe so the same city/name/number never repeats.
  const uniqBy = <T,>(arr: T[], key: (t: T) => string): T[] => {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const x of arr) {
      const k = key(x).trim().toLowerCase();
      if (k && !seen.has(k)) { seen.add(k); out.push(x); }
    }
    return out;
  };
  const sats: { label: string; kind: ReportNode["kind"] }[] = [
    ...uniqBy(relResolved, (r) => r.name).slice(0, 7).map((r) => ({ label: r.name, kind: "person" as const })),
    ...uniqBy(addresses.filter((a) => a.city), (a) => a.city!).slice(0, 4).map((a) => ({ label: a.city!, kind: "address" as const })),
    ...uniqBy(phones, (p2) => p2.number).slice(0, 3).map((p2) => ({ label: p2.number, kind: "phone" as const })),
  ];
  const cx = 540, cy = 230, R = 170;
  const nodes: ReportNode[] = [{ id: "subj", label: alias.alias, kind: "person", x: cx, y: cy }];
  const edges: ReportEdge[] = [];
  sats.forEach((s, i) => {
    const ang = (i / Math.max(1, sats.length)) * Math.PI * 2 - Math.PI / 2;
    const rr = R + (i % 2 === 0 ? 0 : 40);
    const id = `n${i}`;
    nodes.push({ id, label: s.label, kind: s.kind, x: Math.round(cx + rr * Math.cos(ang) * 1.7), y: Math.round(cy + rr * Math.sin(ang)) });
    edges.push({ a: "subj", b: id });
  });

  const akas = [`"${alias.nick}"`, `${aFirst[0]}. ${aLast}`];

  const risks: ReportModel["risks"] = [];
  if (addresses.length >= 3) {
    const span = activityByYear.length ? `${activityByYear[0].year}–${activityByYear[activityByYear.length - 1].year}` : "multi-year";
    risks.push({ title: `Address history across ${addresses.length} locations (${span})`, source: "source · address records + property records · confidence 0.86", sev: "info" });
  }
  if (relResolved.some((r) => (r.score ?? 0) >= 400)) {
    risks.push({ title: "High-confidence household / kinship links present", source: "source · relative graph · shared-household ids", sev: "info" });
  }
  // Screen result comes from the shared adjudication, so this row can never
  // contradict the deep panel's federal checks for the same subject.
  const adj = adjudication(slug);
  if (adj.hasDebar) {
    risks.push({
      title: `Active federal exclusion on record (SAM.gov, ${adj.yDebar})`,
      source: "source · SAM.gov exclusions / EPLS · 1 hit",
      sev: "warning",
    });
    risks.push({
      title: `Dismissed criminal matter (${adj.yDebar - 2})`,
      source: "source · county DA index · disposition dismissed",
      sev: "info",
    });
  } else if (adj.hasAdverse) {
    risks.push({
      title: `Settled regulatory proceeding (${adj.ySec}) and licensing reprimand (${adj.yBoard})`,
      source: "source · SEC administrative proceedings + state licensing boards · 2 hits",
      sev: "warning",
    });
  } else {
    risks.push({
      title: "No sanctions, debarment, or federal-LE hit on the subject",
      source: "source · OFAC / SAM / FBI / DOJ · checked, no hits",
      sev: "info",
    });
  }
  if (adj.finBad) {
    risks.push({
      title: "Financial delinquency >120d on a closed account (resolved)",
      source: "source · derogatory tradeline summary · resolved",
      sev: "info",
    });
  }
  if (adj.medFI) {
    risks.push({
      title: "Foreign-resident relative — reportable under SF-86 §19",
      source: "source · relative graph · residency inferred",
      sev: "info",
    });
  }

  const adjacency = computeAdjacency(
    addresses.map((a) => a.city ?? "").filter(Boolean),
    relResolved[0]?.location ?? addresses[0]?.city ?? null,
  );

  const employment = (p.employers ?? [])
    .filter((e) => e.company)
    .map((e) => ({
      company: e.company!,
      title: e.title ?? null,
      location: [e.city, e.state].filter(Boolean).join(", ") || null,
      from: e.fromDate ?? null,
      to: e.toDate ?? null,
      current: Boolean(e.isCurrent),
    }));

  return {
    alias,
    akas,
    age: p.age ?? null,
    dobYear: yearOf(p.dob),
    location: relResolved[0]?.location ?? addresses[0]?.city ?? null,
    isMock: slug.startsWith("demo-"),
    confidence,
    risk: risks.some((r) => r.sev === "warning") ? "elevated" : "low",
    quickstats: {
      sourceFamilies: recordsByCategory.length + 2,
      recordsFused: records,
      connections: relResolved.length + addresses.length + phones.length,
      riskFlags: risks.filter((r) => r.sev === "warning").length,
    },
    addresses,
    phones,
    relatives: relResolved,
    emails,
    surface,
    employment,
    occupation: p.occupation ?? null,
    recordsByCategory,
    activityByYear,
    graph: { nodes, edges },
    adjacency,
    risks,
    licensing: licensingModel,
    sources: [
      { name: "Address & property (public + licensed)", count: addresses.length, conf: "0.9" },
      { name: "Phone / contact", count: phones.length, conf: "0.86" },
      { name: "Relative / associate graph", count: relResolved.length, conf: "0.88" },
      { name: "Employment history", count: employment.length, conf: "0.81" },
      {
        name: "Sanctions / LE screen",
        count: adj.screenHits === 0 ? "0 hits" : `${adj.screenHits} hits`,
        conf: "—",
      },
      { name: "Aggregated public & licensed records", count: "multiple sources" },
    ],
    sealedAt: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
    hashHead: alias.codename.replace("GL-", "").toLowerCase() + "…" + (p.entityId?.slice(-4) ?? "0000"),
  };
});
