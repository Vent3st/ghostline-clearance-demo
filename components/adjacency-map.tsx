"use client";

import { useState } from "react";

import type { ReportModel } from "@/lib/report";

/**
 * Critical-adjacency proximity map with hover summaries. Subject centered; each site
 * placed on a golden-angle spoke (non-equidistant, so labels separate), radius scaled
 * to distance, then nudged outward/around until its label clears every other label and
 * the center. Hovering a site shows a high-level summary. Ring guides are unlabeled so
 * nothing overlaps the sites; each site carries its own distance.
 */

const ADJ_COLOR: Record<string, string> = {
  Utility: "var(--address)",
  Government: "var(--primary)",
  Military: "var(--crit)",
  "Company HQ": "var(--org)",
  Institution: "var(--phone)",
  Infrastructure: "var(--muted)",
};

const W = 1000, H = 620, cx = 500, cy = 300;
const xStretch = 1.5, rMin = 135, rMax = 250;

export function AdjacencyMap({
  adj,
  subjectName,
}: {
  adj: ReportModel["adjacency"];
  /** Display alias of the subject at the centre. Falls back to "SUBJECT" when absent. */
  subjectName?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const dists = adj.map((a) => a.distanceMi);
  const maxMi = Math.max(6, ...dists);
  const minMi = dists.length ? Math.min(...dists) : 0;
  const spanMi = Math.max(0.1, maxMi - minMi);
  const rOf = (mi: number) => rMin + ((mi - minMi) / spanMi) * (rMax - rMin);
  const short = (s: string) => {
    const t = s.split(" (")[0].split(" — ")[0];
    return t.length > 22 ? `${t.slice(0, 21)}…` : t;
  };

  // Deterministic collision-avoiding placement.
  const placed: { x: number; y: number; a: ReportModel["adjacency"][number] }[] = [];
  const halfW = 95, halfH = 30;
  adj.forEach((a, i) => {
    let ang = i * 137.508 * (Math.PI / 180) - Math.PI / 2;
    let r = rOf(a.distanceMi);
    let x = cx + r * Math.cos(ang) * xStretch;
    let y = cy + r * Math.sin(ang);
    for (let t = 0; t < 48; t++) {
      x = cx + r * Math.cos(ang) * xStretch;
      y = cy + r * Math.sin(ang);
      const insideCenter = Math.hypot((x - cx) / xStretch, y - cy) < rMin - 6;
      const clash = placed.some((p) => Math.abs(p.x - x) < halfW * 2 && Math.abs(p.y - y) < halfH * 2);
      const inBounds = x > 118 && x < W - 118 && y > 54 && y < H - 54;
      if (!insideCenter && !clash && inBounds) break;
      if (t % 2 === 0) r += 24; else ang += 0.45;
      if (r > rMax + 130) r = rMin;
    }
    placed.push({ x, y, a });
  });

  const rings = [rMin, (rMin + rMax) / 2, rMax];
  const hv = hover != null ? placed[hover] : null;

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Critical-adjacency proximity map" style={{ width: "100%", height: "auto", display: "block" }} onMouseLeave={() => setHover(null)}>
        {/* unlabeled proximity rings — closer to center = closer to the subject */}
        {rings.map((r, i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={r * xStretch} ry={r} fill="none" stroke="var(--hairline-2)" strokeDasharray="2 7" opacity="0.7" />
        ))}
        {placed.map((p, i) => (
          <line key={`e${i}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--hairline)" strokeWidth={hover === i ? 2.25 : 1.5} opacity={hover != null && hover !== i ? 0.3 : 1} />
        ))}
        {/* subject clearly at center */}
        <circle cx={cx} cy={cy} r="27" fill="none" stroke="var(--primary)" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
        <circle cx={cx} cy={cy} r="17" fill="var(--primary)" stroke="var(--ground)" strokeWidth="4" />
        {/* The centre is the subject, so name them rather than printing "SUBJECT". HOME
            drops to a second muted line: it qualifies the point without competing with
            the name, and a long alias no longer has to share one line with it. */}
        <text x={cx} y={cy + 44} textAnchor="middle" fontFamily="var(--mono)" fontSize="13" fontWeight="700" fill="var(--ink)">
          {(subjectName ?? "Subject").toUpperCase()}
        </text>
        <text x={cx} y={cy + 59} textAnchor="middle" fontFamily="var(--mono)" fontSize="10.5" fill="var(--muted)">HOME</text>
        {placed.map((p, i) => {
          const above = p.y < cy - 6;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} style={{ cursor: "pointer", outline: "none" }} opacity={hover != null && hover !== i ? 0.5 : 1}>
              <title>{`${p.a.name} — ${p.a.relevance} (${p.a.type}, ${p.a.distanceMi} mi, conf ${p.a.confidence.toFixed(2)})`}</title>
              <circle cx={p.x} cy={p.y} r={hover === i ? 12 : 10} fill={ADJ_COLOR[p.a.type]} stroke="var(--ground)" strokeWidth="2.5" />
              <text x={p.x} y={above ? p.y - 33 : p.y + 43} textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill="var(--muted)">{p.a.type} · {p.a.distanceMi} mi</text>
              <text x={p.x} y={above ? p.y - 17 : p.y + 27} textAnchor="middle" fontFamily="var(--sans)" fontSize="13.5" fontWeight="600" fill="var(--ink)">{short(p.a.name)}</text>
            </g>
          );
        })}
      </svg>

      {hv ? (
        <div
          style={{
            position: "absolute",
            left: `${(hv.x / W) * 100}%`,
            top: `${(hv.y / H) * 100}%`,
            transform: "translate(-50%, calc(-100% - 16px))",
            pointerEvents: "none",
            width: "min(260px, 70vw)",
            background: "var(--panel, #131C2C)",
            border: "1px solid var(--hairline, #26324a)",
            borderRadius: 10,
            padding: "10px 12px",
            boxShadow: "0 10px 30px -12px rgba(0,0,0,.7)",
            zIndex: 5,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 9, height: 9, borderRadius: 999, background: ADJ_COLOR[hv.a.type], flex: "0 0 auto" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{hv.a.name}</span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "var(--ink)" }}>{hv.a.relevance}</p>
          <p style={{ margin: "6px 0 0", fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--muted)" }}>
            {hv.a.type} · {hv.a.distanceMi} mi from subject · confidence {hv.a.confidence.toFixed(2)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
