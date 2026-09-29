import "server-only";

import path from "node:path";

/**
 * Filesystem roots and the path-traversal guard.
 *
 * Every filesystem access in this app resolves through here. Nothing else in the
 * codebase should build a path from a request parameter.
 *
 * This is the public hackathon demo: all subject data is FICTIONAL sample data
 * bundled inside the repository under `data/subjects/`. There is no external data
 * tree and no PII on disk.
 */

/** Bundled, in-repo demo data. One subdirectory per (fictional) subject. */
const DATA_ROOT = path.join(process.cwd(), "data", "subjects");

/** Subject directories are listed from here. */
export const DATA_DIR = DATA_ROOT;

/** Raw sample pulls, one subdirectory per subject (same tree in this demo). */
export const RAW_DIR = DATA_ROOT;

/**
 * Directory entries that are not subjects.
 */
const NOT_SUBJECTS = new Set(["_raw", "_audit", ".DS_Store"]);

export function isSubjectDirName(name: string): boolean {
  return !NOT_SUBJECTS.has(name) && !name.startsWith(".");
}

/**
 * Reject anything that could escape its intended directory.
 *
 * Checked before any filesystem call, against the raw request value — not after
 * a join, and not by stripping characters. A segment either is a plain single
 * path component or it is refused.
 */
export function isSafeSegment(segment: string): boolean {
  if (!segment || segment.length > 255) return false;
  if (segment === "." || segment === "..") return false;
  if (segment.includes("/") || segment.includes("\\")) return false;
  if (segment.includes("\0")) return false;
  if (path.isAbsolute(segment)) return false;
  // basename of a legitimate single segment is itself; anything else is shaped wrong.
  if (path.basename(segment) !== segment) return false;
  return true;
}

/**
 * Final assertion that a resolved path really sits inside its root.
 *
 * Belt-and-braces behind isSafeSegment + the directory-listing whitelist: this
 * catches symlinks pointing out of the tree, which a name check cannot see.
 */
export function assertInside(root: string, candidate: string): boolean {
  const rel = path.relative(root, candidate);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}
