"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import type { GraphEdge } from "@/lib/graph";
import { VIEW_H, VIEW_W, type Placed } from "@/lib/layout-graph";
import { scoreBand } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const KIND_FILL: Record<string, string> = {
  person: "var(--ent-person)",
  address: "var(--ent-address)",
  phone: "var(--ent-phone)",
  org: "var(--ent-org)",
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
      {node.kind === "org" ? (
        <rect
          x={node.x - r * 0.85}
          y={node.y - r * 0.85}
          width={r * 1.7}
          height={r * 1.7}
          rx={2}
          fill={fill}
          stroke={selected ? "var(--foreground)" : shared ? "var(--foreground)" : "none"}
          strokeWidth={selected ? 2 : shared ? 1 : 0}
        />
      ) : node.kind === "address" ? (
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

  /**
   * Zoom / pan.
   *
   * The transform lives in a ref and is written straight onto the <g> with
   * setAttribute, so a wheel tick or a drag frame costs one attribute write and
   * zero React renders — the 300-node graph stays smooth. React state is only
   * used for selection, which genuinely changes the tree.
   */
  const svgRef = useRef<SVGSVGElement | null>(null);
  const worldRef = useRef<SVGGElement | null>(null);
  const zoomLabelRef = useRef<HTMLSpanElement | null>(null);
  const view = useRef({ k: 1, tx: 0, ty: 0 });
  const drag = useRef<{ x: number; y: number; x0: number; y0: number; scale: number; panning: boolean } | null>(null);
  const raf = useRef<number | null>(null);

  const MIN_K = 0.4;
  const MAX_K = 8;

  // Coalesced to one write per animation frame: a trackpad emits wheel events far
  // faster than the screen refreshes, and panning fires per pointermove.
  const apply = useCallback(() => {
    if (raf.current !== null) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      const { k, tx, ty } = view.current;
      worldRef.current?.setAttribute("transform", `translate(${tx} ${ty}) scale(${k})`);
      if (zoomLabelRef.current) zoomLabelRef.current.textContent = `${Math.round(k * 100)}%`;
    });
  }, []);

  useEffect(() => () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
  }, []);

  // Wheel zoom about the pointer. Registered manually because React's onWheel is
  // passive, and preventDefault is required to stop the page scrolling.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const pt = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(ctm.inverse());
      const { k, tx, ty } = view.current;
      // Exponential in the wheel delta: continuous under a trackpad, and a pinch
      // (ctrl+wheel on macOS) scales by the same curve instead of jumping.
      const step = ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaY;
      const next = Math.min(MAX_K, Math.max(MIN_K, k * Math.exp(-step * 0.0016)));
      if (next === k) return;
      // Keep the point under the cursor fixed: world = (vb - t) / k.
      view.current = {
        k: next,
        tx: pt.x - ((pt.x - tx) / k) * next,
        ty: pt.y - ((pt.y - ty) / k) * next,
      };
      apply();
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [apply]);

  /**
   * Pan starts only once the pointer has actually moved. Capturing on pointerdown
   * redirected the whole gesture to the <svg>, so the click never reached a node
   * glyph and selection stopped working — the side panel stayed on "nothing
   * selected". A 3px threshold keeps click-to-select and drag-to-pan separate.
   */
  const onPointerDown = useCallback((ev: React.PointerEvent<SVGSVGElement>) => {
    if (ev.button !== 0) return;
    const ctm = svgRef.current?.getScreenCTM();
    drag.current = {
      x: ev.clientX,
      y: ev.clientY,
      x0: ev.clientX,
      y0: ev.clientY,
      scale: ctm ? ctm.a : 1,
      panning: false,
    };
  }, []);

  const onPointerMove = useCallback(
    (ev: React.PointerEvent<SVGSVGElement>) => {
      const d = drag.current;
      if (!d) return;
      if (!d.panning) {
        if (Math.hypot(ev.clientX - d.x0, ev.clientY - d.y0) < 3) return;
        d.panning = true;
        ev.currentTarget.setPointerCapture(ev.pointerId);
      }
      const sc = d.scale || 1;
      view.current.tx += (ev.clientX - d.x) / sc;
      view.current.ty += (ev.clientY - d.y) / sc;
      d.x = ev.clientX;
      d.y = ev.clientY;
      apply();
    },
    [apply],
  );

  const endDrag = useCallback((ev: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (d?.panning && ev.currentTarget.hasPointerCapture(ev.pointerId)) {
      ev.currentTarget.releasePointerCapture(ev.pointerId);
    }
    drag.current = null;
  }, []);

  const zoomBy = useCallback(
    (f: number) => {
      const svg = svgRef.current;
      const [vx, vy, vw, vh] = viewBox.split(" ").map(Number);
      const cx = vx + vw / 2, cy = vy + vh / 2;
      void svg;
      const { k, tx, ty } = view.current;
      const next = Math.min(MAX_K, Math.max(MIN_K, k * f));
      if (next === k) return;
      view.current = {
        k: next,
        tx: cx - ((cx - tx) / k) * next,
        ty: cy - ((cy - ty) / k) * next,
      };
      apply();
    },
    [apply, viewBox],
  );

  const resetView = useCallback(() => {
    view.current = { k: 1, tx: 0, ty: 0 };
    apply();
  }, [apply]);

  // A new graph (focus change) invalidates the old pan/zoom.
  useEffect(() => {
    view.current = { k: 1, tx: 0, ty: 0 };
    apply();
  }, [viewBox, apply]);

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="relative min-h-0 overflow-hidden">
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md border bg-background/90 p-1 shadow-sm backdrop-blur">
          <button
            type="button"
            onClick={() => zoomBy(1 / 1.3)}
            aria-label="Zoom out"
            className="size-7 rounded text-sm leading-none hover:bg-muted"
          >
            −
          </button>
          <span
            ref={zoomLabelRef}
            aria-live="off"
            className="min-w-[3.25rem] text-center font-mono text-[11px] text-muted-foreground"
          >
            100%
          </span>
          <button
            type="button"
            onClick={() => zoomBy(1.3)}
            aria-label="Zoom in"
            className="size-7 rounded text-sm leading-none hover:bg-muted"
          >
            +
          </button>
          <button
            type="button"
            onClick={resetView}
            aria-label="Reset zoom and position"
            className="ml-0.5 rounded px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-muted"
          >
            reset
          </button>
        </div>
        <svg
          ref={svgRef}
          viewBox={viewBox}
          className="size-full touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          role="img"
          aria-label={`Entity graph, ${nodes.length} nodes. A list view of the same data follows.`}
        >
          <g ref={worldRef}>
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
                vectorEffect="non-scaling-stroke"
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
          </g>
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
