import "server-only";

import type { ActiveCase } from "./types";

/**
 * Case store — demo build.
 *
 * The full product keeps a file-backed active case (reference + permissible
 * purpose) that gates all subject access. The public demo has no gate: it serves
 * only fictional sample data, so a single standing demo case is always returned.
 */
const DEMO_CASE: ActiveCase = {
  case_ref: "DEMO",
  purpose: "dev_testing",
  justification: "Public hackathon demo — fictional sample data only.",
  opened_at: "1970-01-01T00:00:00.000Z", // stable: avoids a new value each read
  dev_mode: true,
};

export async function getActiveCase(): Promise<ActiveCase> {
  return DEMO_CASE;
}
