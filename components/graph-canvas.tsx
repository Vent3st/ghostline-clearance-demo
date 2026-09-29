"use client";

import { memo, useMemo, useState } from "react";
import Link from "next/link";

import type { GraphEdge } from "@/lib/graph";
import { VIEW_H, VIEW_W, type Placed } from "@/lib/layout-graph";
import { scoreBand } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const KIND_FILL: Record<string, string> = {
  person: "var(--ent-person)",
  address: "var(--ent-address)",
  phone: "var(--ent-phone)",
};

/**
 * Node glyph. Shape encodes kind as well as colour — colour alone would fail for
 * viewers with a colour-vision deficiency and in greyscale.
 *
 * Defined at module scope, not inside the canvas (rerender-no-inline-components).
 */
const NodeGlyph = memo(function NodeGlyph({
  node,
  selected,
  onSelect,
}: {
  node: Placed;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const fill = KIND_FILL[node.kind] ?? "var(--muted-foreground)";
  const anchor = Boolean(node.anchorSlug);
  const r = anchor ? 13 : 8;
  const shared = node.subjects.length > 1;

  return (
    <g
      tabIndex={0}
      role="button"
      aria-label={`${node.label}, ${node.kind}, seen in ${node.subjects.length} subject${
        node.subjects.length === 1 ? "" : "s"
      }`}
      onClick={() => onSelect(node.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(node.id);
        }
      }}
      className="cursor-pointer focus:outline-none"
    >
      {node.kind === "address" ? (
        <rect
          x={node.x - r}
          y={node.y - r}
          width={r * 2}
          height={r * 2}
          rx={2}
          fill={fill}
          stroke={selected ? "var(--primary)" : "var(--background)"}
          strokeWidth={selected ? 3 : 1.5}
        />
      ) : node.kind === "phone" ? (
        <polygon
          points={`${node.x},${node.y - r} ${node.x + r},${node.y + r} ${node.x - r},${node.y + r}`}
          fill={fill}
          stroke={selected ? "var(--primary)" : "var(--background)"}
          strokeWidth={selected ? 3 : 1.5}
        />
      ) : (
        <circle
          cx={node.x}
          cy={node.y}
          r={r}
          fill={fill}
          stroke={selected ? "var(--primary)" : "var(--background)"}
          strokeWidth={selected ? 3 : 1.5}
        />
      )}

      {shared ? (
        <circle
          cx={node.x}
          cy={node.y}
          r={r + 4}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={1}
          strokeDasharray="2 2"
          opacity={0.75}
        />
      ) : null}

      {/* Labels are drawn in a later pass so nodes never paint over them. */}
    </g>
  );
});

export function GraphCanvas({
  nodes,
  edges,
  focused = false,
}: {
  nodes: Placed[];
  edges: GraphEdge[];
  focused?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  // Built once per render rather than scanning `nodes` inside the edge loop.
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Auto-fit the viewBox to the actual nodes so the graph fills the canvas — a
  // focused ego-network zooms in, the full graph zooms out, both stay readable.
  const viewBox = useMemo(() => {
    if (nodes.length === 0) return `0 0 ${VIEW_W} ${VIEW_H}`;
    const pad = 80;
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
    return `${minX} ${minY} ${Math.max(1, maxX - minX)} ${Math.max(1, maxY - minY)}`;
  }, [nodes]);
  const node = selected ? byId.get(selected) : null;

  const neighbours = useMemo(() => {
    if (!selected) return [];
    return edges
      .filter((e) => e.source === selected || e.target === selected)
      .map((e) => {
        const other = byId.get(e.source === selected ? e.target : e.source);
        return other ? { edge: e, other } : null;
      })
      .filter((v): v is { edge: GraphEdge; other: Placed } => Boolean(v));
  }, [selected, edges, byId]);

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-h-0 overflow-hidden">
        <svg
          viewBox={viewBox}
          className="size-full"
          role="img"
          aria-label={`Entity graph, ${nodes.length} nodes. A list view of the same data follows.`}
        >
          {edges.map((e, i) => {
            const a = byId.get(e.source);
            const b = byId.get(e.target);
            if (!a || !b) return null;
            const active = selected === e.source || selected === e.target;
            // Relative scores run ~100–475, not 0–1.
            const w = e.score ? Math.min(3.2, 0.8 + e.score / 220) : 1;
            return (
              <line
                key={`${e.source}-${e.target}-${i}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={
                  e.sharedHousehold ? "var(--ent-address)" : "var(--muted-foreground)"
                }
                strokeWidth={active ? w + 1 : w}
                strokeDasharray={e.sharedHousehold ? undefined : "0"}
                opacity={selected ? (active ? 0.95 : 0.15) : 0.4}
              />
            );
          })}

          {nodes.map((n) => (
            <NodeGlyph
              key={n.id}
              node={n}
              selected={selected === n.id}
              onSelect={setSelected}
            />
          ))}

          {/*
            Label pass, after every glyph. Only anchors and the selection get a
            label — labelling shared nodes too produced an unreadable pile where a
            group of relatives sat between the same two subjects. Drawing labels
            last stops the surrounding ring from painting over the subject names,
            which are the ones that must stay readable.
          */}
          {nodes
            .filter((n) => focused || n.anchorSlug || selected === n.id)
            .map((n) => (
              <text
                key={`label-${n.id}`}
                x={n.x}
                y={n.y + (n.anchorSlug ? 13 : 8) + 13}
                textAnchor="middle"
                className="pointer-events-none fill-foreground text-[10px] font-medium"
                style={{
                  paintOrder: "stroke",
                  stroke: "var(--background)",
                  strokeWidth: 4,
                }}
              >
                {n.label.length > 26 ? `${n.label.slice(0, 25)}…` : n.label}
              </text>
            ))}
        </svg>
      </div>

      <aside className="min-h-0 overflow-auto border-t p-4 lg:border-l lg:border-t-0">
        {node ? (
          <>
            <h2 className="text-sm font-semibold">{node.label}</h2>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {node.kind}
              {node.detail ? ` · ${node.detail}` : ""}
            </p>

            <p className="mt-3 font-mono text-[11px] text-muted-foreground">
              Seen in {node.subjects.length} subject
              {node.subjects.length === 1 ? "" : "s"}
            </p>
            <ul className="mt-1 space-y-0.5">
              {node.subjects.map((s) => (
                <li key={s}>
                  <Link
                    href={`/subjects/${s}`}
                    className="font-mono text-[11px] text-primary hover:underline"
                  >
                    {s}
                  </Link>
                </li>
              ))}
            </ul>

            {node.anchorSlug ? (
              <Button asChild size="sm" className="mt-4 w-full">
                <Link href={`/subjects/${node.anchorSlug}`}>Open dossier</Link>
              </Button>
            ) : null}

            <p className="mt-5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Connections ({neighbours.length})
            </p>
            <ul className="mt-1 space-y-1">
              {neighbours.slice(0, 40).map(({ edge, other }, i) => (
                <li key={`${other.id}-${i}`} className="text-[12px]">
                  <button
                    onClick={() => setSelected(other.id)}
                    className="text-left hover:underline"
                  >
                    {other.label}
                  </button>
                  <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                    {edge.label ?? edge.kind}
                    {scoreBand(edge.score) ? ` · ${scoreBand(edge.score)} likelihood` : ""}
                    {edge.sharedHousehold ? " · shared household" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Nothing selected</p>
            <p className="mt-1.5 leading-relaxed">
              Select a node to see what it connects to and why.
            </p>
            <dl className="mt-4 space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center gap-2">
                <svg width="12" height="12" aria-hidden>
                  <circle cx="6" cy="6" r="5.5" fill="var(--ent-person)" />
                </svg>
                person
              </div>
              <div className="flex items-center gap-2">
                <svg width="12" height="12" aria-hidden>
                  <rect width="12" height="12" rx="2" fill="var(--ent-address)" />
                </svg>
                address
              </div>
              <div className="flex items-center gap-2">
                <svg width="12" height="12" aria-hidden>
                  <polygon points="6,0 12,12 0,12" fill="var(--ent-phone)" />
                </svg>
                phone
              </div>
              <div className="mt-2 flex items-center gap-2">
                <svg width="12" height="12" aria-hidden>
                  <circle
                    cx="6"
                    cy="6"
                    r="5"
                    fill="none"
                    stroke="var(--primary)"
                    strokeDasharray="2 2"
                  />
                </svg>
                shared by 2+ subjects
              </div>
            </dl>
            <p className="mt-4 leading-relaxed">
              Position is meaningful: a node sitting between two subjects is shared by
              them.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
