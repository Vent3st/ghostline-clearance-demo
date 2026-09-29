import "server-only";

/**
 * Back-compat shim. The identity layer moved to lib/identity.ts; this keeps the
 * older `aliasFor(slug)` / `Alias` imports working. Subject aliases are keyed on
 * the slug (stable + curated for demo subjects).
 */
export { aliasForSlug as aliasFor } from "./identity";
export type { Alias } from "./identity";
