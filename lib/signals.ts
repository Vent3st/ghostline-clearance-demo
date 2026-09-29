import "server-only";

import { cache } from "react";

import { buildReportModel } from "./report";

/**
 * Public-signal inference taxonomy — what a records-based workup can and cannot resolve.
 *
 * Each row is a general, publicly documented assessment concept (personality from
 * language, socioeconomic inference from area data, social-graph role, etc.), paired
 * with whether the evidence actually on file can resolve it. The honest half is the
 * point: most concepts are NOT resolvable from a records pull, some are excluded as
 * meta-analytically dominated (deception cues, facial affect), and one is a discredited
 * fail-gate (physiognomy). No proprietary method or provider is described.
 */

export type Resolvability =
  | "Resolvable"
  | "Area-level only"
  | "Weak proxy"
  | "Required control"
  | "Not resolvable"
  | "Excluded — policy"
  | "Excluded — dominated"
  | "Frontier — unverified";

interface DomainDef {
  domain: string;
  signal: string;
  need: string;
}

export interface SignalRow {
  domain: string;
  signal: string;
  status: Resolvability;
  basis: string;
}

export interface SignalModel {
  rows: SignalRow[];
  resolvable: number;
  /** Resolvable only under a stated constraint (area-level, weak proxy, control-only). */
  constrained: number;
  excluded: number;
  /** Headline status for the inferred psychometric panel. */
  panelStatus: string;
}

/** Generic, clean 1–2 word domain labels. Public concepts only. */
const DEFS: DomainDef[] = [
  { domain: "Personality", signal: "lexical & network structure", need: "graph" },
  { domain: "Social graph", signal: "degree & brokerage in the relative graph", need: "graph" },
  { domain: "Language style", signal: "open-vocabulary lexicon", need: "text" },
  { domain: "Socioeconomic", signal: "area-level census linkage", need: "area" },
  { domain: "Environment", signal: "dwelling type & tenure", need: "records" },
  { domain: "Chronotype", signal: "timestamped activity cadence", need: "timestamps" },
  { domain: "Spending", signal: "transaction psychometrics", need: "txn" },
  { domain: "Credit risk", signal: "behavioral risk scoring", need: "txn" },
  { domain: "Digital affect", signal: "app-use phenotypes", need: "device" },
  { domain: "Fairness audit", signal: "bias audit of scored outputs", need: "audit" },
  { domain: "Voice", signal: "vocal prosody", need: "policy" },
  { domain: "Deception", signal: "behavioral cues", need: "dominated" },
  { domain: "Facial affect", signal: "image inference", need: "dominated" },
  { domain: "Physiognomy", signal: "anthropometric signatures", need: "dominated" },
  { domain: "Cognitive ability", signal: "digital-footprint proxies", need: "frontier" },
];

export const buildSignalModel = cache(async (slug: string, _vacuousScreens = 0): Promise<SignalModel> => {
  const r = await buildReportModel(slug);
  const rel = r?.relatives.length ?? 0;
  const addr = r?.addresses.length ?? 0;

  const resolve = (need: string): [Resolvability, string] => {
    switch (need) {
      case "graph":
        return rel >= 3
          ? ["Resolvable", `${rel} relative/associate edges on file — degree and brokerage computable`]
          : ["Not resolvable", `only ${rel} edges on file — below a usable ego-network`];
      case "area":
        return addr >= 1
          ? ["Area-level only", "address tract available; individual attribution is an ecological fallacy"]
          : ["Not resolvable", "no address on file"];
      case "records":
        return addr >= 1
          ? ["Weak proxy", "dwelling type and tenure only — no interior/possession observation"]
          : ["Not resolvable", "no property surface on file"];
      case "audit":
        return ["Required control", "applied to every scored output in this report"];
      case "text":
        return ["Not resolvable", "no consented text corpus licensed for this subject"];
      case "device":
        return ["Not resolvable", "no consented device telemetry or app-use stream"];
      case "timestamps":
        return ["Not resolvable", "records carry report dates, not a timestamped behavioral stream"];
      case "txn":
        return ["Not resolvable", "transaction and credit data are GLBA/FCRA-gated and not pulled"];
      case "policy":
        return ["Excluded — policy", "no consented audio capture in a vetting workup"];
      case "dominated":
        return ["Excluded — dominated", "meta-analytically weak or discredited — excluded by construction"];
      case "frontier":
        return ["Frontier — unverified", "no replication base yet; tracked, not relied on"];
      default:
        return ["Not resolvable", "no supporting evidence class on file"];
    }
  };

  const rows: SignalRow[] = DEFS.map((d) => {
    const [status, basis] = resolve(d.need);
    return { domain: d.domain, signal: d.signal, status, basis };
  });

  return {
    rows,
    resolvable: rows.filter((x) => x.status === "Resolvable").length,
    constrained: rows.filter((x) => ["Area-level only", "Weak proxy", "Required control"].includes(x.status)).length,
    excluded: rows.filter((x) => x.status.startsWith("Excluded")).length,
    panelStatus: "INFERRED · UNFALSIFIED — no criterion measure on file",
  };
});
