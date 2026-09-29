import type { GraphEdge, GraphNode } from "./graph";

/**
 * Deterministic layout.
 *
 * Not a force simulation. Anchors (the pulled subjects) sit evenly on a ring;
 * every other node is placed at the centroid of the anchors that reference it,
 * pushed outward by a hash-derived offset so co-located nodes don't stack.
 *
 * Two reasons this beats a force layout here:
 *  - Position carries meaning. A node sitting between two anchors is *literally*
 *    shared by those two subjects, which is the whole question this view answers.
 *    Force layouts scramble that into "wherever the physics settled".
 *  - It is deterministic and synchronous, so server and client agree, there is no
 *    hydration mismatch, no simulation frames, and nothing to animate or freeze.
 *
 * Math.random() is deliberately not used — the jitter is a hash of the node id, so
 * the same graph always draws identically.
 */

export interface Placed extends GraphNode {
  x: number;
  y: number;
}

export const VIEW_W = 1000;
export const VIEW_H = 620;

/** FNV-1a. Small, fast, and stable across runs. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0xffffffff;
}

export function layoutGraph(nodes: GraphNode[], edges: GraphEdge[]): Placed[] {
  const cx = VIEW_W / 2;
  const cy = VIEW_H / 2;
  const ringR = Math.min(VIEW_W, VIEW_H) * 0.36;

  const anchors = nodes.filter((n) => n.anchorSlug);
  const anchorPos = new Map<string, { x: number; y: number }>();

  anchors.forEach((n, i) => {
    // -90° start so the first anchor sits at the top rather than at 3 o'clock.
    const a = (i / Math.max(1, anchors.length)) * Math.PI * 2 - Math.PI / 2;
    anchorPos.set(n.id, { x: cx + Math.cos(a) * ringR, y: cy + Math.sin(a) * ringR });
  });

  // Which anchors each non-anchor node connects to.
  const links = new Map<string, Set<string>>();
  for (const e of edges) {
    const add = (node: string, anchor: string) => {
      if (!anchorPos.has(anchor) || anchorPos.has(node)) return;
      const s = links.get(node) ?? new Set<string>();
      s.add(anchor);
      links.set(node, s);
    };
    add(e.target, e.source);
    add(e.source, e.target);
  }

  // Group by owner-set, because every node sharing the same owners resolves to the
  // same centroid. Placing them at hash-random angles piles them on top of each
  // other; fanning each group evenly around its centroid keeps them legible while
  // preserving the "sits between its subjects" meaning.
  const groups = new Map<string, string[]>();
  const ownerKey = new Map<string, string>();

  for (const n of nodes) {
    if (anchorPos.has(n.id)) continue;
    const key = [...(links.get(n.id) ?? [])].sort().join("|") || "∅";
    ownerKey.set(n.id, key);
    const g = groups.get(key) ?? [];
    g.push(n.id);
    groups.set(key, g);
  }

  // Stable ordering inside a group so the fan doesn't reshuffle between renders.
  for (const g of groups.values()) g.sort();

  const placedPos = new Map<string, { x: number; y: number }>();

  for (const [key, members] of groups) {
    const owners = key
      .split("|")
      .map((id) => anchorPos.get(id))
      .filter((p): p is { x: number; y: number } => Boolean(p));

    const count = members.length;

    members.forEach((id, i) => {
      // Even angular spacing, offset per group so adjacent groups don't align.
      const angle = (i / count) * Math.PI * 2 + hash(key) * Math.PI * 2;

      if (owners.length === 0) {
        const r = ringR * 1.55;
        placedPos.set(id, { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
        return;
      }

      const mx = owners.reduce((s, p) => s + p.x, 0) / owners.length;
      const my = owners.reduce((s, p) => s + p.y, 0) / owners.length;

      // Radius grows with group size so a crowded group spreads rather than stacks.
      const base = owners.length > 1 ? 54 : 84;
      const r = base + Math.sqrt(count) * 13;

      placedPos.set(id, {
        x: Math.max(30, Math.min(VIEW_W - 30, mx + Math.cos(angle) * r)),
        y: Math.max(30, Math.min(VIEW_H - 30, my + Math.sin(angle) * r)),
      });
    });
  }

  return nodes.map((n) => {
    const p = anchorPos.get(n.id) ?? placedPos.get(n.id) ?? { x: cx, y: cy };
    return { ...n, ...p };
  });
}
