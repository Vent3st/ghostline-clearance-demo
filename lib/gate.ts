import "server-only";

import { getActiveCase } from "./case-store";
import type { ActiveCase, AuditAction } from "./types";

/**
 * Access gate — demo build.
 *
 * In the full product this enforces an open case with a declared permissible
 * purpose and writes a tamper-evident audit entry before any subject data
 * renders. The public demo has no gate and no audit sink: it exposes only
 * fictional sample data, so this returns the standing demo case and renders.
 * The parameters are kept so the call sites match the product's shape.
 */
export async function requireCase(
  _action: AuditAction,
  _target: string | null,
  _detail?: Record<string, unknown>,
): Promise<ActiveCase> {
  return getActiveCase();
}
