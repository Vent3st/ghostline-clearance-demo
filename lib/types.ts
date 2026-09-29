/**
 * Data-model types for the demo.
 *
 * A structured person record plus the workbench-local types (dossier frontmatter,
 * subject summaries). Illustrative shapes for the sample data — not a production schema.
 */

/** Confidence bands for a resolved match. */
export enum Confidence {
  HIGH = "HIGH", // >= 0.80  auto-merge
  PROBABLE = "PROBABLE", // 0.70–0.79
  POSSIBLE = "POSSIBLE", // 0.50–0.69
  UNLIKELY = "UNLIKELY", // < 0.50
}

export function classifyConfidence(score: number): Confidence {
  if (score >= 0.8) return Confidence.HIGH;
  if (score >= 0.7) return Confidence.PROBABLE;
  if (score >= 0.5) return Confidence.POSSIBLE;
  return Confidence.UNLIKELY;
}

export type Relationship =
  | "SELF" | "FATHER" | "MOTHER" | "SPOUSE" | "SON" | "DAUGHTER"
  | "BROTHER" | "SISTER" | "GRANDFATHER" | "GRANDMOTHER"
  | "GRANDSON" | "GRANDDAUGHTER" | "UNCLE" | "AUNT" | "COUSIN"
  | "IN_LAW" | "STEP_PARENT" | "STEP_CHILD" | "UNKNOWN";

export interface Address {
  street: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  years: string | null;
}

export interface PhoneRecord {
  number: string;
  phone_type: string | null;
  carrier: string | null;
}

export interface RelativeLink {
  name: string;
  age: number | null;
  relationship: Relationship;
  confidence: number;
}

export interface SourceRecord {
  source_name: string;
  match_score: number;
  fields_matched: string[];
  raw_data: Record<string, unknown>;
  retrieved_at: string;
}

export interface PersonRecord {
  full_name: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  suffix: string | null;

  age: number | null;
  dob: string | null;
  sex: string | null;

  current_address: Address | null;
  address_history: Address[];

  phone_numbers: PhoneRecord[];
  email_addresses: string[];

  relatives: RelativeLink[];
  associates: string[];

  employer: string | null;
  occupation: string | null;

  sources: SourceRecord[];
  overall_confidence: number;
  provenance: Record<string, unknown>;
  conflicts: unknown[];
}

/* ------------------------------------------------------------------ *
 * Workbench-local types (no Python counterpart)
 * ------------------------------------------------------------------ */

/**
 * Dossier frontmatter. Every field is optional except `title` — dossiers written
 * before the 2026-06-19 convention lock-in carry almost none of these, and the
 * reader must not assume their presence.
 */
export interface DossierFrontmatter {
  title: string;
  generated?: string;
  subject?: string;
  dob_partial?: string;
  age?: number;
  context?: string;
  classification?: string;
  source_seed?: string;
  critical_flag?: string;
  sources?: string[];
  [key: string]: unknown;
}

export interface DossierRef {
  /** Filename, e.g. "DOSSIER_2026-07-24.md". Not a path. */
  file: string;
  /** Parsed from the filename when it follows convention; null for legacy names. */
  date: string | null;
  /** True for DOSSIER_YYYY-MM-DD.md; false for legacy (DOSSIER_v3.md, _REFRESH_, …). */
  conventional: boolean;
}

export interface SubjectSummary {
  slug: string;
  dossiers: DossierRef[];
  /** Newest conventional dossier, else newest by mtime. */
  latest: DossierRef | null;
  hasRaw: boolean;
}

export interface Dossier {
  slug: string;
  file: string;
  frontmatter: DossierFrontmatter;
  /** Markdown body with frontmatter stripped. Render via react-markdown, never as HTML. */
  body: string;
}

/* ---- governance ---- */

export const PURPOSES = [
  "case_review",
  "active_investigation",
  "address_verification",
  "data_quality_audit",
  "dev_testing",
  "other",
] as const;

export type Purpose = (typeof PURPOSES)[number];

export interface ActiveCase {
  case_ref: string;
  purpose: Purpose;
  /** Required when purpose is "other". */
  justification: string;
  opened_at: string;
  /** True when opened by the dev-mode bypass rather than a person. */
  dev_mode?: boolean;
}

export type AuditAction =
  | "case_open"
  | "case_close"
  | "subject_index"
  | "subject_view"
  | "dossier_view"
  | "raw_index"
  | "raw_view"
  | "search_attempt";

export interface AuditEntry {
  ts: string;
  case_ref: string;
  purpose: Purpose;
  action: AuditAction;
  /** Subject slug, filename, or query — whatever the action acted on. */
  target: string | null;
  actor: string;
  dev_mode: boolean;
  detail?: Record<string, unknown>;
}
