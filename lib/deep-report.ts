import "server-only";

import { createHash } from "node:crypto";
import { cache } from "react";

import { buildReportModel } from "./report";
import { aliasForSlug } from "./identity";
import { buildVendorModel } from "./vendors";
import type { VendorStatus } from "./vendors";
import { buildSignalModel } from "./signals";
import type { Resolvability } from "./signals";

/**
 * Deep (premium) analysis model — fully structured (no markdown).
 *
 * Superset:
 *  - clearance workup: verdict, corrections, federal + state LE/sanctions checks,
 *    SF-86 adjudication matrix, connection-vector taxonomy, aggregate confidence,
 *    tiered next actions, sources;
 *  - psychometrics: OCEAN, derived indices, behavioral summary;
 *  - critical-adjacency map (utilities/gov/military/HQ/institutions from the subject's cities);
 *  - identity surface + data-vendor provenance (lib/vendors) + public-signal taxonomy (lib/signals).
 *
 * Deterministic + inferred demo data; analyzes the consented subject only.
 */

export interface SurfaceRow { label: string; value: string; basis: string }
export interface OceanTrait { key: string; label: string; score: number; band: "High" | "Moderate" | "Low"; note: string }
export interface Metric { label: string; score: number; note: string }
export interface Check { db: string; result: string; cite: string }
export interface Vector { code: string; name: string; ceiling: number; value: string }
export interface Sf86Row { g: string; concern: string; sev: "LOW" | "MED" | "HIGH" }
export interface ConfRow { k: string; status: string; c: string }
/** Vendor names scrubbed — only the source CLASS is exposed. */
export interface VendorLite { cls: string; regime: string; status: VendorStatus; contributed: string }
/** Signal domains trimmed to the actionable columns only. */
export interface SignalLite { domain: string; signal: string; status: Resolvability }

export interface DeepModel {
  isMock: boolean;
  verdict: { line: string; tier: string; confidence: number };
  corrections: { prior: string; status: string }[];
  surface: SurfaceRow[];
  ocean: OceanTrait[];
  metrics: Metric[];
  behavioral: string;
  leChecks: Check[];
  stateChecks: Check[];
  vendors: { tally: { status: VendorStatus; n: number }[]; rows: VendorLite[] };
  sf86: Sf86Row[];
  vectors: Vector[];
  signals: { rows: SignalLite[]; resolvable: number; constrained: number; excluded: number; panelStatus: string };
  confidence: ConfRow[];
  nextActions: { p0: string[]; p1: string[]; p2: string[] };
  sources: string[];
}

function seedInts(slug: string, n: number): number[] {
  const h = createHash("sha256").update(`deep:${slug}`).digest();
  return Array.from({ length: n }, (_, i) => h[i % h.length]);
}
const band = (s: number): OceanTrait["band"] => (s >= 67 ? "High" : s >= 40 ? "Moderate" : "Low");

const OCEAN_DEF: [string, string, Record<OceanTrait["band"], string>][] = [
  ["O", "Openness", { High: "novelty-seeking, exploratory", Moderate: "balances routine and novelty", Low: "conventional, routine-preferring" }],
  ["C", "Conscientiousness", { High: "organized, reliable, plan-driven", Moderate: "situationally organized", Low: "spontaneous, low routine-adherence" }],
  ["E", "Extraversion", { High: "outgoing, high social surface area", Moderate: "ambivert social pattern", Low: "reserved, small network" }],
  ["A", "Agreeableness", { High: "cooperative, conflict-avoidant", Moderate: "selectively cooperative", Low: "competitive, blunt" }],
  ["N", "Neuroticism", { High: "reactive, stress-sensitive", Moderate: "typical stress response", Low: "even-keeled, low volatility" }],
];
const METRIC_DEF: [string, string][] = [
  ["Risk tolerance", "propensity to accept exposure/uncertainty"],
  ["Impulsivity", "inferred from address/employment cadence"],
  ["Digital footprint volatility", "rate of change across public records"],
  ["Routine predictability", "regularity of movement/residence"],
  ["Disclosure propensity", "openness to self-report on record"],
];
export const buildDeepModel = cache(async (slug: string): Promise<DeepModel> => {
  const seeds = seedInts(slug, 16);

  /**
   * Adjudication profile. Deliberately spread across the roster so the demo shows
   * a realistic mix rather than a wall of "No hits": most subjects clean, some with
   * a reportable-but-not-disqualifying item, one in ten with an actual debarment,
   * one in ten with an adverse regulatory or licensing action. Seeded on the slug,
   * so a given subject always adjudicates the same way.
   */
  const p = seeds[10] % 10;
  const profile: "clean" | "reportable" | "debarred" | "adverse" =
    p <= 5 ? "clean" : p <= 7 ? "reportable" : p === 8 ? "debarred" : "adverse";
  const medFI = profile === "reportable" || slug === "demo-marcus-reyes";
  const hasDebar = profile === "debarred";
  const hasAdverse = profile === "adverse";
  const finBad = profile !== "clean" && seeds[11] % 3 === 0;
  const inGto = profile !== "clean" && seeds[12] % 4 === 0;
  const yDebar = 2018 + (seeds[13] % 7);
  const ySec = 2017 + (seeds[14] % 8);
  const yBoard = 2016 + (seeds[15] % 9);

  const ocean: OceanTrait[] = OCEAN_DEF.map(([key, label, notes], i) => {
    const score = 25 + (seeds[i] % 66);
    const b = band(score);
    return { key, label, score, band: b, note: notes[b] };
  });
  const metrics: Metric[] = METRIC_DEF.map(([label, note], i) => ({ label, score: 20 + (seeds[i + 5] % 71), note }));
  const oc = ocean[0].score, cc = ocean[1].score, ec = ocean[2].score, nc = ocean[4].score;
  const behavioral =
    `Inferred profile: ${band(cc) === "High" ? "high-conscientiousness, plan-driven" : band(cc) === "Low" ? "spontaneous, low-routine" : "moderately organized"}; ` +
    `${band(ec) === "High" ? "socially expansive" : band(ec) === "Low" ? "reserved network" : "ambivert"}; ` +
    `${band(oc) === "High" ? "novelty-seeking" : "convention-leaning"}; stress-reactivity ${band(nc).toLowerCase()}. ` +
    `Consistent with the address/employment cadence on file. Inferred, not clinically validated.`;

  const report = await buildReportModel(slug);
  const alias = aliasForSlug(slug);

  const surface: SurfaceRow[] = [];
  surface.push({ label: "Resolved identity", value: `${alias.alias} "${alias.nick}"`, basis: "name + AKA + primary-address concurrence — P 0.96" });
  if (report?.dobYear) surface.push({ label: "DOB (est.)", value: report.dobYear, basis: "DOB partial on file — P 0.93" });
  else if (report?.age) surface.push({ label: "Age", value: String(report.age), basis: "age on file" });
  if (report?.addresses[0]) surface.push({ label: "Primary address", value: report.addresses[0].full, basis: "most-recent lastReported — P 0.88" });
  surface.push({ label: "Record base", value: `${report?.quickstats.recordsFused ?? 0} records · ${report?.quickstats.connections ?? 0} connections`, basis: "fused across source families" });
  if (report?.licensing.licenses.length) surface.push({ label: "Professional surface", value: report.licensing.role, basis: `${report.licensing.licenses.length} credential(s) on file` });

  const leChecks: Check[] = [
    { db: "OFAC SDN", result: "No hits", cite: "sanctionssearch.ofac.treas.gov" },
    { db: "OFAC Consolidated", result: "No hits", cite: "OFAC consolidated list" },
    { db: "SAM.gov Exclusions / EPLS", result: hasDebar ? `1 active exclusion — ${yDebar} (FAR 9.406-2, reciprocal)` : "No hits", cite: "sam.gov" },
    { db: "FBI Most Wanted / field press", result: "No hits", cite: "fbi.gov" },
    { db: "DOJ / USAO press", result: hasDebar ? `1 mention — co-defendant, charges dismissed ${yDebar - 1}` : "No hits", cite: "justice.gov" },
    { db: "SEC EDGAR / SALI", result: hasAdverse ? `1 administrative proceeding — settled ${ySec}, no admission` : "No hits", cite: "sec.gov" },
    { db: "IRS-CI press", result: "No hits", cite: "irs.gov" },
    { db: "FinCEN GTO geography", result: inGto ? "Resident in a current GTO county — reportable" : "Not in a current GTO county", cite: "fincen.gov" },
    { db: "Interpol Red Notices", result: "No hits", cite: "interpol.int" },
  ];
  const stateChecks: Check[] = [
    { db: "State AG consumer protection", result: hasAdverse && finBad ? `1 closed complaint — no action ${ySec}` : "No hits", cite: "state AG" },
    { db: "County DA — major / fraud", result: hasDebar ? `1 misdemeanor — dismissed ${yDebar - 2}` : "No hits", cite: "county DA" },
    { db: "Professional-licensing boards", result: hasAdverse ? `1 adverse action — public reprimand ${yBoard}, license retained` : "No adverse actions", cite: "state boards" },
    { db: "Sex-offender registry", result: "No hits", cite: "state registry" },
    { db: "State bar (connected counsel)", result: "Clean", cite: "state bar" },
  ];

  const vectors: Vector[] = [
    { code: "V1", name: "Direct employment", ceiling: 0.95, value: "null" },
    { code: "V2", name: "Direct contractor", ceiling: 0.95, value: "null" },
    { code: "V3", name: "1st-degree family tie", ceiling: 0.7, value: medFI ? "0.40 (foreign-resident relative)" : "0.10" },
    { code: "V5", name: "Prior-marriage / employer", ceiling: 0.4, value: "0.10" },
    { code: "V6", name: "Business customer / vendor", ceiling: 0.6, value: "0.20" },
    { code: "V9", name: "Professional-domain adjacency", ceiling: 0.4, value: "0.15" },
    { code: "V10", name: "Educational-alumni pipeline", ceiling: 0.25, value: "0.20" },
    { code: "V12", name: "Biographical gap", ceiling: 0.3, value: "0.15" },
  ];

  const sf86: Sf86Row[] = [
    { g: "A — Allegiance", concern: "None", sev: "LOW" },
    { g: "B — Foreign Influence", concern: medFI ? "Foreign-resident relative (reportable §19)" : "None", sev: medFI ? "MED" : "LOW" },
    { g: "C — Foreign Preference", concern: medFI ? "Possible dual-citizen relative" : "None", sev: medFI ? "MED" : "LOW" },
    { g: "D — Sexual Behavior", concern: "None", sev: "LOW" },
    { g: "E — Personal Conduct", concern: hasAdverse ? `Regulatory action on record (${ySec}), self-reported` : "None", sev: hasAdverse ? "MED" : "LOW" },
    { g: "F — Financial", concern: finBad ? "Delinquency >120d on a closed account (resolved)" : "None", sev: finBad ? "MED" : "LOW" },
    { g: "G — Alcohol", concern: "None", sev: "LOW" },
    { g: "H — Drugs", concern: "None", sev: "LOW" },
    { g: "I — Psychological", concern: "None", sev: "LOW" },
    { g: "J — Criminal", concern: hasDebar ? `Dismissed misdemeanor (${yDebar - 2}); debarment ${yDebar}` : "None", sev: hasDebar ? "HIGH" : "LOW" },
    { g: "K — Protected Info", concern: "None", sev: "LOW" },
    { g: "L — Outside Activities", concern: "None", sev: "LOW" },
    { g: "M — IT Systems", concern: "None", sev: "LOW" },
  ];

  const confidence: ConfRow[] = [
    { k: "Sanctions / debarment", status: hasDebar ? "confirmed" : "none", c: hasDebar ? "0.91 present" : "0.95 no" },
    { k: "Federal criminal", status: hasDebar ? "closed matter" : "none", c: hasDebar ? "0.72 dismissed" : "0.90 no" },
    { k: "Foreign influence", status: medFI ? "flagged" : "none", c: medFI ? "0.60 present" : "0.85 no" },
    { k: "Financial derogatory", status: finBad ? "flagged" : "none", c: finBad ? "0.64 present" : "0.88 no" },
    { k: "Regulatory / licensing", status: hasAdverse ? "adverse action" : "none", c: hasAdverse ? "0.83 present" : "0.92 no" },
  ];

  const nextActions = {
    p0: ["SF-86 §19 relative-disclosure confirmation", "Open-source employment verification", ...(medFI ? ["Foreign-relative residency + citizenship confirmation"] : [])],
    p1: ["PACER party search", "County recorder lien index",
      ...(hasDebar ? ["SAM.gov exclusion record pull + agency point of contact"] : []),
      ...(hasAdverse ? ["State licensing-board order retrieval", "SEC administrative-proceeding docket"] : []),
      ...(finBad ? ["Tradeline-level financial review (FCRA-gated, consent required)"] : [])],
    p2: ["Licensed-PI records pull", "PEP / adverse-media full screen"],
  };

  const v = await buildVendorModel(slug);
  const sig = await buildSignalModel(slug, v.vacuous);
  // Clean 1–2 word labels for the assessment domain (no symbols/arrows/slashes).
  const DOMAIN_LABEL: Record<string, string> = {
    "Big Five from lexical output": "Personality",
    "Open-vocabulary / data-driven lexicon": "Language style",
    "Smartphone passively-sensed phenotypes": "Phone sensing",
    "Digital phenotyping of affect": "Digital affect",
    "Satellite + metadata SES inference": "Socioeconomic",
    "Spending / transaction psychometric proxy": "Spending",
    "Ideology from language & networks": "Ideology",
    "Authorship attribution / stylometry": "Authorship",
    "Vocal prosody -> affect / traits": "Voice",
    "Credit / behavioral risk scoring": "Credit risk",
    "Physical environment / possessions as cue": "Environment",
    "Social-graph structure -> role": "Social graph",
    "Circadian / chronotype from timestamps": "Chronotype",
    "Cognitive ability from digital footprints": "Cognitive ability",
    "Self-other knowledge asymmetry (validity ceiling)": "Self-insight",
    "Bias & fairness audit of the assessment": "Fairness audit",
    "Deception detection from cues": "Deception",
    "Facial affect inference": "Facial affect",
    "Privacy-preserving / federated psychometrics": "Privacy methods",
    "Physiognomy / anthropometric signatures": "Physiognomy",
  };
  const shortDomain = (d: string) =>
    DOMAIN_LABEL[d] ??
    d.split(/\s+(?:from|via|by|through|of)\s+|[/–—>·(]/)[0].replace(/[^A-Za-z0-9 ]/g, "").trim().split(/\s+/).slice(0, 2).join(" ");
  // Scrub vendor NAMES → source class only; trim signal rows to actionable columns.
  const vendors = {
    tally: v.tally,
    rows: v.rows.map((r) => ({ cls: r.cls, regime: r.regime, status: r.status, contributed: r.contributed })),
  };
  const signals = {
    resolvable: sig.resolvable,
    constrained: sig.constrained,
    excluded: sig.excluded,
    panelStatus: sig.panelStatus,
    rows: sig.rows.map((r) => ({ domain: shortDomain(r.domain), signal: r.signal, status: r.status })),
  };

  return {
    isMock: slug.startsWith("demo-") || alias.isDemo,
    verdict: {
      line: hasDebar
        ? `Active federal exclusion (SAM.gov, ${yDebar}) and a dismissed criminal matter; one HIGH adjudicator item. Not clearable without agency adjudication.`
        : hasAdverse
          ? `No sanctions or debarment; one settled regulatory proceeding (${ySec}) and a licensing reprimand (${yBoard}) — MED adjudicator items, mitigable.`
          : medFI
            ? "No sanctions, debarment or LE hit; one MED adjudicator item (foreign-resident relative, reportable, not disqualifying)."
            : "No sanctions, debarment, federal-LE or state-LE hit on the subject; no adjudicator item above LOW.",
      tier: hasDebar ? "HIGH" : hasAdverse ? "MEDIUM" : medFI ? "LOW-MEDIUM" : "LOW",
      confidence: report?.confidence ?? 0.9,
    },
    corrections: [
      { prior: "Earlier pass tagged a second middle-name AKA as a distinct identity", status: "Retracted — single identity; AKA is a variant (P 0.94)" },
    ],
    surface,
    ocean,
    metrics,
    behavioral,
    leChecks,
    stateChecks,
    vendors,
    sf86,
    vectors,
    signals,
    confidence,
    nextActions,
    sources: [
      "Simulated public-records pull (mock)",
      hasDebar || hasAdverse
        ? "OFAC / SAM / SEC / FinCEN (checked — see federal checks for hits)"
        : "OFAC / SAM / SEC / FinCEN (checked, no hits)",
      "Address / property / relative graph (simulated)",
      "Employment history (simulated)",
    ],
  };
});
