import "server-only";

import { cache } from "react";

import { buildReportModel } from "./report";

/**
 * Data-source coverage matrix — by generic SOURCE CLASS, not by vendor.
 *
 * This demo deliberately names no commercial data providers and describes no
 * collection method. It lists the *kinds* of records a records-based workup draws
 * on (identity/address aggregation, court dockets, sanctions screening, property,
 * etc.), the broad legal regime each sits under, and the three classes excluded by
 * policy (face search, device location, marketing identity graphs).
 *
 * The `control` idea is kept because it is the honest half: a screen that has never
 * returned a positive is indistinguishable from `true`. CLEAN rows without a positive
 * control are counted and reported as *unverified*, not as absence of conduct.
 */

export type VendorStatus =
  | "HIT" | "CLEAN" | "GAP" | "PAID-ONLY" | "KEY-REQUIRED" | "LE-ONLY" | "AREA-ONLY" | "EXCLUDED";
export type Control = "proved" | "none" | "n/a";

interface ClassDef {
  cls: string;
  regime: string;
  /** Drives status: a report-count key (HIT/GAP by count) or a static status key. */
  need: string;
  control: Control;
}

export interface VendorRow {
  cls: string;
  regime: string;
  status: VendorStatus;
  contributed: string;
  control: Control;
}

export interface VendorModel {
  rows: VendorRow[];
  tally: { status: VendorStatus; n: number }[];
  /** CLEAN screens with no positive control — a pass that cannot fail. */
  vacuous: number;
  cleanTotal: number;
  excluded: number;
  note: string;
}

/** Generic, non-proprietary source classes. No provider is named anywhere. */
const DEFS: ClassDef[] = [
  { cls: "Identity & address aggregation", regime: "Public / licensed", need: "addresses", control: "n/a" },
  { cls: "Telephone & contact intelligence", regime: "Public / licensed", need: "phones", control: "n/a" },
  { cls: "Email & handle enrichment", regime: "Public", need: "emails", control: "n/a" },
  { cls: "Relative & associate graph", regime: "Public / licensed", need: "relatives", control: "n/a" },
  { cls: "Professional-licensing registries", regime: "Public", need: "licensing", control: "n/a" },
  { cls: "Court & docket records", regime: "Public (PACER-class)", need: "clean", control: "none" },
  { cls: "Property & parcel records", regime: "Public / licensed", need: "clean", control: "none" },
  { cls: "Corporate & UCC filings", regime: "Public", need: "clean", control: "none" },
  { cls: "Sanctions & watchlist screening", regime: "OFAC / SAM", need: "clean", control: "proved" },
  { cls: "Breach-exposure intelligence", regime: "Contractual", need: "key", control: "n/a" },
  { cls: "Credit / financial derogatory", regime: "FCRA / GLBA (not pulled)", need: "gap", control: "n/a" },
  { cls: "Facial-recognition search", regime: "Excluded by policy", need: "excluded", control: "n/a" },
  { cls: "Device / location telemetry", regime: "Excluded by policy", need: "excluded", control: "n/a" },
  { cls: "Marketing identity graphs", regime: "Excluded by policy", need: "excluded", control: "n/a" },
];

const STATIC: Record<string, VendorStatus> = {
  clean: "CLEAN", gap: "GAP", key: "KEY-REQUIRED", excluded: "EXCLUDED",
};

export const buildVendorModel = cache(async (slug: string): Promise<VendorModel> => {
  const r = await buildReportModel(slug);
  const counts: Record<string, number> = {
    addresses: r?.addresses.length ?? 0,
    phones: r?.phones.length ?? 0,
    emails: r?.emails ?? 0,
    relatives: r?.relatives.length ?? 0,
    licensing: r?.licensing.licenses.length ?? 0,
  };

  const rows: VendorRow[] = DEFS.map((d) => {
    const driven = d.need in counts;
    const n = driven ? counts[d.need] : 0;
    const status: VendorStatus = driven ? (n > 0 ? "HIT" : "GAP") : (STATIC[d.need] ?? "GAP");
    return {
      cls: d.cls,
      regime: d.regime,
      status,
      contributed: status === "HIT" ? `${n} rec` : status === "CLEAN" ? "0 hits" : "—",
      control: d.control,
    };
  });

  const order: VendorStatus[] = ["HIT", "CLEAN", "GAP", "PAID-ONLY", "KEY-REQUIRED", "LE-ONLY", "AREA-ONLY", "EXCLUDED"];
  const tally = order
    .map((status) => ({ status, n: rows.filter((x) => x.status === status).length }))
    .filter((t) => t.n > 0);

  const cleanRows = rows.filter((x) => x.status === "CLEAN");
  const vacuous = cleanRows.filter((x) => x.control !== "proved").length;
  const excluded = rows.filter((x) => x.status === "EXCLUDED").length;

  return {
    rows,
    tally,
    vacuous,
    cleanTotal: cleanRows.length,
    excluded,
    note:
      `${vacuous} of ${cleanRows.length} CLEAN screens carry no positive control — ` +
      `those rows are unverified, not evidence of absence. ` +
      `${excluded} source classes are excluded by policy, in code.`,
  };
});
