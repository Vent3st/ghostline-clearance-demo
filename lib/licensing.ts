import "server-only";

import { createHash } from "node:crypto";

/**
 * Professional licensing & credentials, matched to the subject's job/role.
 *
 * Realistic, role-appropriate credential sets (FINRA/NASAA, CPA, CFP, CompTIA/AWS,
 * DRE/CalRE, NMLS, RN, etc.) with deterministic registration numbers and dates.
 * Illustrative demo data — IDs are generated, not real registry lookups.
 */

export type LicenseStatus = "Active" | "Registered" | "Expired";
export interface License { name: string; issuer: string; id: string; status: LicenseStatus; since: string; renews: string }
export interface Licensing { role: string; note: string; licenses: License[] }

type IdKind = "crd" | "dre" | "nmls" | "cpa" | "bar" | "rn" | "cert" | "state" | "faa" | "clearance" | "cage";

interface Item { name: string; issuer: string; idKind: IdKind }
interface RoleDef { role: string; note: string; items: Item[] }

const ROLES: Record<string, RoleDef> = {
  financial_broker: {
    role: "Financial services — registered representative",
    note: "Broker-dealer registration; FINRA/NASAA exams on file.",
    items: [
      { name: "SIE — Securities Industry Essentials", issuer: "FINRA", idKind: "crd" },
      { name: "Series 7 — General Securities Representative", issuer: "FINRA", idKind: "crd" },
      { name: "Series 63 — Uniform Securities Agent State Law", issuer: "NASAA / FINRA", idKind: "crd" },
    ],
  },
  investment_adviser: {
    role: "Investment adviser / financial planner",
    note: "IAR-eligible; fiduciary planning credentials.",
    items: [
      { name: "Series 65 — Uniform Investment Adviser Law", issuer: "NASAA", idKind: "crd" },
      { name: "CFP — Certified Financial Planner", issuer: "CFP Board", idKind: "cert" },
    ],
  },
  accountant: {
    role: "Public accounting",
    note: "State CPA license; Uniform CPA Exam complete.",
    items: [
      { name: "CPA — Certified Public Accountant", issuer: "State Board of Accountancy", idKind: "cpa" },
      { name: "CMA — Certified Management Accountant", issuer: "IMA", idKind: "cert" },
    ],
  },
  compliance: {
    role: "Compliance / risk / AML",
    note: "Financial-crime and audit credentials.",
    items: [
      { name: "CAMS — Anti-Money Laundering Specialist", issuer: "ACAMS", idKind: "cert" },
      { name: "CFE — Certified Fraud Examiner", issuer: "ACFE", idKind: "cert" },
    ],
  },
  it_cyber: {
    role: "IT / cybersecurity",
    note: "Vendor + practitioner security certifications.",
    items: [
      { name: "Security+ (SY0-701)", issuer: "CompTIA", idKind: "cert" },
      { name: "AWS Solutions Architect – Associate", issuer: "Amazon Web Services", idKind: "cert" },
      { name: "CISSP", issuer: "ISC²", idKind: "cert" },
    ],
  },
  real_estate: {
    role: "Real estate",
    note: "State real-estate licensure; mortgage origination.",
    items: [
      { name: "Real Estate Broker License", issuer: "CA DRE (CalRE)", idKind: "dre" },
      { name: "SAFE MLO — Mortgage Loan Originator", issuer: "NMLS", idKind: "nmls" },
    ],
  },
  healthcare_rn: {
    role: "Healthcare — registered nurse",
    note: "State RN licensure; resuscitation certifications.",
    items: [
      { name: "RN — Registered Nurse (NCLEX-RN)", issuer: "State Board of Nursing", idKind: "rn" },
      { name: "ACLS — Advanced Cardiac Life Support", issuer: "American Heart Association", idKind: "cert" },
    ],
  },
  insurance: {
    role: "Insurance producer",
    note: "State producer licensure.",
    items: [
      { name: "Life & Health Producer License", issuer: "State Dept. of Insurance", idKind: "state" },
      { name: "Property & Casualty Producer License", issuer: "State Dept. of Insurance", idKind: "state" },
    ],
  },
  trades: {
    role: "Skilled trades — HVAC/mechanical",
    note: "Federal + trade certifications.",
    items: [
      { name: "EPA Section 608 (Universal)", issuer: "EPA", idKind: "cert" },
      { name: "NATE — HVAC Certification", issuer: "NATE", idKind: "cert" },
    ],
  },
  legal: {
    role: "Legal",
    note: "State bar admission.",
    items: [
      { name: "Attorney — State Bar admission", issuer: "State Bar", idKind: "bar" },
    ],
  },
  aviation: {
    role: "Aviation",
    note: "FAA airman certification.",
    items: [
      { name: "Part 107 — Remote Pilot", issuer: "FAA", idKind: "faa" },
      { name: "Private Pilot Certificate", issuer: "FAA", idKind: "faa" },
    ],
  },
  military: {
    role: "Military service (veteran)",
    note: "DD-214 on file; DoD security clearance.",
    items: [
      { name: "Security Clearance — Secret", issuer: "DoD Consolidated Adjudications Facility", idKind: "clearance" },
      { name: "DD-214 — Honorable discharge", issuer: "U.S. Army / NPRC", idKind: "state" },
    ],
  },
  government: {
    role: "Federal civil service",
    note: "Public-trust position; periodic reinvestigation.",
    items: [
      { name: "Public Trust determination", issuer: "OPM", idKind: "state" },
      { name: "e-QIP / SF-86 on file", issuer: "DCSA", idKind: "clearance" },
    ],
  },
  defense_dod: {
    role: "Defense contracting (DoD)",
    note: "Cleared facility; federal contractor registration.",
    items: [
      { name: "Facility Security Clearance", issuer: "DCSA (NISP)", idKind: "clearance" },
      { name: "CAGE code · SAM registration", issuer: "DLA / SAM.gov", idKind: "cage" },
    ],
  },
  plumbing: {
    role: "Skilled trades — plumbing",
    note: "State master-plumber licensure.",
    items: [
      { name: "Master Plumber License", issuer: "State Contractors Board", idKind: "state" },
      { name: "Backflow Prevention Certification", issuer: "State / ABPA", idKind: "cert" },
    ],
  },
  hedge_fund: {
    role: "Hedge fund / private markets",
    note: "Registered adviser; alternative-investment credential.",
    items: [
      { name: "Series 65 — Investment Adviser Law", issuer: "NASAA", idKind: "crd" },
      { name: "CAIA — Chartered Alternative Investment Analyst", issuer: "CAIA Association", idKind: "cert" },
      { name: "Series 7 — General Securities Rep", issuer: "FINRA", idKind: "crd" },
    ],
  },
};

const HASH_POOL = [
  "financial_broker", "investment_adviser", "accountant", "compliance", "it_cyber",
  "real_estate", "healthcare_rn", "insurance", "trades", "legal", "aviation",
];

const OVERRIDE: Record<string, string> = {
  // Curated demo trio.
  "demo-marcus-reyes": "financial_broker",
  "demo-elena-marlowe": "investment_adviser",
  "demo-trevor-osborne": "real_estate",
  // Fictional cast — varied professions across the connection graph.
  "corwin-ashby": "military",
  "delia-marsh": "government",
  "rex-tanner": "plumbing",
  "vivian-crane": "legal",
  "sterling-vaughn": "hedge_fund",
  "neal-brackett": "it_cyber",
  "pearl-okonkwo": "healthcare_rn",
  "dashiell-vane": "aviation",
  "harlan-frost": "defense_dod",
};

function digits(h: Buffer, start: number, n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += (h[(start + i) % h.length] % 10).toString();
  return s;
}
function makeId(kind: IdKind, h: Buffer): string {
  switch (kind) {
    case "crd": return `CRD# ${digits(h, 2, 7)}`;
    case "dre": return `CalRE #0${digits(h, 3, 7)}`;
    case "nmls": return `NMLS #${digits(h, 4, 7)}`;
    case "cpa": return `CPA #${digits(h, 5, 6)}`;
    case "bar": return `Bar #${digits(h, 6, 6)}`;
    case "rn": return `RN #${digits(h, 7, 6)}`;
    case "faa": return `FTN A${digits(h, 8, 7)}`;
    case "state": return `Lic. #${digits(h, 9, 7)}`;
    case "cert": return `Cert #${digits(h, 10, 6)}`;
    case "clearance": return `Case #${digits(h, 2, 8)}`;
    case "cage": return `CAGE ${digits(h, 4, 5)}`;
  }
}

export function buildLicensing(slug: string): Licensing {
  const h = createHash("sha256").update(`lic:${slug}`).digest();
  const roleKey = OVERRIDE[slug] ?? HASH_POOL[h[0] % HASH_POOL.length];
  const def = ROLES[roleKey];

  const licenses: License[] = def.items.map((it, i) => {
    const ih = createHash("sha256").update(`lic:${slug}:${i}`).digest();
    const sinceY = 2006 + (ih[1] % 17); // 2006..2022
    // one credential occasionally lapsed, like a real registry
    const expired = ih[2] % 9 === 0;
    const renewsY = expired ? sinceY + 2 + (ih[3] % 3) : 2026 + (ih[3] % 2);
    return {
      name: it.name,
      issuer: it.issuer,
      id: makeId(it.idKind, ih),
      status: expired ? "Expired" : it.issuer === "FINRA" || it.issuer.includes("FINRA") ? "Registered" : "Active",
      since: String(sinceY),
      renews: expired ? `lapsed ${renewsY}` : `renews ${renewsY}`,
    };
  });

  return { role: def.role, note: def.note, licenses };
}
