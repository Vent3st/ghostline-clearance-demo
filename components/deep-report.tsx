import type { DeepModel } from "@/lib/deep-report";
import type { VendorStatus } from "@/lib/vendors";
import type { Resolvability } from "@/lib/signals";

/**
 * Deep-analysis view — fully structured, one `.gl-report` design (marketing palette),
 * no markdown. Union of the clearance workup (verdict, LE/state checks, SF-86, vectors,
 * confidence, next actions), the psychometric panel (OCEAN + indices), the critical-
 * adjacency MAP + table, identity surface, data-vendor provenance, and the public-signal
 * taxonomy (Falsification/Citation columns omitted — actionable only) + calibration.
 */

const SEV_COLOR: Record<string, string> = { LOW: "var(--muted)", MED: "var(--warn)", HIGH: "var(--crit)" };
const STATUS_COLOR: Record<VendorStatus, string> = {
  HIT: "var(--good)", CLEAN: "var(--primary)", GAP: "var(--warn)", "PAID-ONLY": "var(--phone)",
  "KEY-REQUIRED": "var(--org)", "LE-ONLY": "var(--muted)", "AREA-ONLY": "var(--address)", EXCLUDED: "var(--crit)",
};
const RESOLVE_COLOR: Record<Resolvability, string> = {
  Resolvable: "var(--good)", "Area-level only": "var(--address)", "Weak proxy": "var(--address)",
  "Required control": "var(--primary)", "Not resolvable": "var(--muted)",
  "Excluded — policy": "var(--crit)", "Excluded — dominated": "var(--crit)", "Frontier — unverified": "var(--org)",
};

const th: React.CSSProperties = { textAlign: "left", padding: "6px 10px 6px 0", color: "var(--muted)", fontWeight: 600, fontSize: 11.5, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "6px 10px 6px 0", borderTop: "1px solid var(--hairline)", verticalAlign: "top", fontSize: 12.5 };

function Chip({ text, color }: { text: string; color: string }) {
  return <span style={{ whiteSpace: "nowrap", borderRadius: 999, padding: "2px 8px", fontFamily: "var(--mono)", fontSize: 10, background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}>{text}</span>;
}

function radarPoints(scores: number[], cx: number, cy: number, r: number): string {
  return scores.map((s, i) => {
    const ang = (i / scores.length) * Math.PI * 2 - Math.PI / 2;
    const rr = (Math.max(0, Math.min(100, s)) / 100) * r;
    return `${(cx + rr * Math.cos(ang)).toFixed(1)},${(cy + rr * Math.sin(ang)).toFixed(1)}`;
  }).join(" ");
}

export function DeepReport({ model: m }: { model: DeepModel }) {
  const cx = 110, cy = 100, R = 72;
  const scores = m.ocean.map((t) => t.score);
  const axisPts = m.ocean.map((_, i) => {
    const ang = (i / m.ocean.length) * Math.PI * 2 - Math.PI / 2;
    return { lx: cx + (R + 15) * Math.cos(ang), ly: cy + (R + 15) * Math.sin(ang), x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang), key: m.ocean[i].key };
  });

  return (
    <div className="gl-report" style={{ background: "transparent", marginTop: 20 }}>
      <div className="wrap" style={{ padding: 0 }}>
        {/* verdict */}
        <div className="card pad" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ minWidth: 0 }}>
            <span className="eyebrow">Deep clearance · verdict</span>
            <p style={{ margin: "6px 0 0", fontSize: 15, color: "var(--ink)" }}>{m.verdict.line}</p>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: m.verdict.tier === "LOW" ? "var(--good)" : "var(--warn)" }}>{m.verdict.tier}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>RISK TIER</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{m.verdict.confidence.toFixed(2)}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>CONFIDENCE</div>
            </div>
          </div>
        </div>

        {/* identity surface */}
        {m.surface.length > 0 ? (
          <>
            <div className="sec-head" style={{ marginTop: 22 }}><span className="eyebrow">Subject surface · resolved identity &amp; record base</span></div>
            <div className="card pad" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--ink)" }}>
                <tbody>
                  {m.surface.map((r, i) => (
                    <tr key={i}>
                      <td style={{ ...td, width: 180, color: "var(--muted)" }}>{r.label}</td>
                      <td style={td}>{r.value}</td>
                      <td style={{ ...td, fontSize: 11, color: "var(--muted)" }}>{r.basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {/* OCEAN */}
        <div className="sec-head" style={{ marginTop: 22 }}><span className="eyebrow">Psychometric profile · OCEAN (Big Five)</span></div>
        <div className="card pad" style={{ display: "grid", gridTemplateColumns: "minmax(200px,240px) minmax(0,1fr)", gap: 20, alignItems: "center" }}>
          <svg viewBox="0 0 220 200" style={{ width: "100%", maxWidth: 240 }} role="img" aria-label="OCEAN radar">
            {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={radarPoints([100, 100, 100, 100, 100].map((v) => v * f), cx, cy, R)} fill="none" stroke="var(--hairline)" strokeWidth="1" />)}
            {axisPts.map((p) => <line key={p.key} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--hairline)" strokeWidth="1" />)}
            <polygon points={radarPoints(scores, cx, cy, R)} fill="color-mix(in srgb, var(--primary) 30%, transparent)" stroke="var(--primary)" strokeWidth="2" />
            {axisPts.map((p) => <text key={p.key} x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--mono)" fontSize="10" fill="var(--muted)">{p.key}</text>)}
          </svg>
          {/* The "INFERRED · UNFALSIFIED" chip is gone: the panel is headed
              "Psychometric profile" and the behavioural summary below already closes
              with "Inferred, not clinically validated", so the chip restated a
              caveat the reader has twice over. panelStatus stays on the model. */}
          <div style={{ display: "grid", gap: 8 }}>
            {m.ocean.map((t) => (
              <div key={t.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 128, flex: "0 0 auto", fontSize: 13, color: "var(--ink)" }}>{t.label}</span>
                <div style={{ flex: 1, height: 8, borderRadius: 999, background: "var(--hairline)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${t.score}%`, background: "var(--primary)", borderRadius: 999 }} />
                </div>
                <span style={{ width: 108, flex: "0 0 auto", textAlign: "right", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{t.score} · {t.band}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ margin: "10px 2px 0", fontSize: 13, lineHeight: 1.6, color: "var(--muted)" }}>{m.behavioral}</p>

        {/* derived indices */}
        <div className="sec-head" style={{ marginTop: 22 }}><span className="eyebrow">Derived behavioral indices</span></div>
        <div className="card pad" style={{ display: "grid", gap: 8 }}>
          {m.metrics.map((x) => (
            <div key={x.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 180, flex: "0 0 auto", fontSize: 13, color: "var(--ink)" }} title={x.note}>{x.label}</span>
              <div style={{ flex: 1, height: 8, borderRadius: 999, background: "var(--hairline)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${x.score}%`, background: "var(--org)", borderRadius: 999 }} />
              </div>
              <span style={{ width: 32, flex: "0 0 auto", textAlign: "right", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{x.score}</span>
            </div>
          ))}
        </div>

        {/* critical adjacency now lives in the STANDARD dossier (clearance-report.tsx) */}

        {/* LE / state checks */}
        <div className="two" style={{ marginTop: 22 }}>
          <div>
            <div className="sec-head"><span className="eyebrow">Federal LE / sanctions / debarment</span></div>
            <div className="card pad"><div className="srclist">
              {m.leChecks.map((c, i) => <div className="sr" key={i}><span className="n">{c.db}</span><span className="m" style={{ color: "var(--good)" }}>{c.result}</span></div>)}
            </div></div>
          </div>
          <div>
            <div className="sec-head"><span className="eyebrow">State / regional LE</span></div>
            <div className="card pad"><div className="srclist">
              {m.stateChecks.map((c, i) => <div className="sr" key={i}><span className="n">{c.db}</span><span className="m" style={{ color: "var(--good)" }}>{c.result}</span></div>)}
            </div></div>
          </div>
        </div>

        {/* data-source coverage — vendor NAMES scrubbed to source CLASS only */}
        <div className="sec-head" style={{ marginTop: 22 }}><span className="eyebrow">Data-source coverage · class &amp; legal regime</span></div>
        <div className="card pad" style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {m.vendors.tally.map((t) => <Chip key={t.status} text={`${t.status} ${t.n}`} color={STATUS_COLOR[t.status]} />)}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--ink)" }}>
            <thead><tr><th style={th}>Source class</th><th style={th}>Regime</th><th style={th}>Status</th><th style={th}>Rec</th></tr></thead>
            <tbody>
              {m.vendors.rows.map((v, i) => (
                <tr key={i}>
                  <td style={td}>{v.cls}</td>
                  <td style={{ ...td, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{v.regime}</td>
                  <td style={td}><Chip text={v.status} color={STATUS_COLOR[v.status]} /></td>
                  <td style={{ ...td, fontFamily: "var(--mono)", color: "var(--muted)" }}>{v.contributed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SF-86 + vectors */}
        <div className="two" style={{ marginTop: 22 }}>
          <div>
            <div className="sec-head"><span className="eyebrow">SF-86 adjudicator matrix</span></div>
            <div className="card pad" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--ink)" }}>
                <thead><tr><th style={th}>Guideline</th><th style={th}>Concern</th><th style={th}>Sev</th></tr></thead>
                <tbody>{m.sf86.map((r, i) => <tr key={i}><td style={td}>{r.g}</td><td style={{ ...td, color: "var(--muted)" }}>{r.concern}</td><td style={{ ...td, fontFamily: "var(--mono)", color: SEV_COLOR[r.sev] }}>{r.sev}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
          <div>
            <div className="sec-head"><span className="eyebrow">Connection-vector taxonomy</span></div>
            <div className="card pad" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--ink)" }}>
                <thead><tr><th style={th}>Vector</th><th style={th}>Ceiling</th><th style={th}>Value</th></tr></thead>
                <tbody>{m.vectors.map((v, i) => <tr key={i}><td style={td}><span style={{ fontFamily: "var(--mono)", color: "var(--muted)" }}>{v.code}</span> {v.name}</td><td style={{ ...td, fontFamily: "var(--mono)", color: "var(--muted)" }}>{v.ceiling.toFixed(2)}</td><td style={{ ...td, fontFamily: "var(--mono)", color: v.value === "null" ? "var(--muted)" : "var(--ink)" }}>{v.value}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>

        {/* public-signal inference — Falsification + Citation OMITTED */}
        <div className="sec-head" style={{ marginTop: 22 }}><span className="eyebrow">Public-signal inference · what the record base can resolve</span></div>
        <div className="card pad" style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            <Chip text={`RESOLVABLE ${m.signals.resolvable}`} color="var(--good)" />
            <Chip text={`CONSTRAINED ${m.signals.constrained}`} color="var(--address)" />
            <Chip text={`EXCLUDED ${m.signals.excluded}`} color="var(--crit)" />
            <Chip text={`DOMAINS ${m.signals.rows.length}`} color="var(--muted)" />
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--ink)" }}>
            <thead><tr><th style={th}>Assessment domain</th><th style={th}>Signal</th><th style={th}>Status</th></tr></thead>
            <tbody>
              {m.signals.rows.map((d, i) => (
                <tr key={i}>
                  <td style={td}>{d.domain}</td>
                  <td style={{ ...td, color: "var(--muted)" }}>{d.signal}</td>
                  <td style={td}><Chip text={d.status} color={RESOLVE_COLOR[d.status]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* confidence + next actions */}
        <div className="two" style={{ marginTop: 22 }}>
          <div>
            <div className="sec-head"><span className="eyebrow">Aggregate confidence</span></div>
            <div className="card pad"><div className="srclist">
              {m.confidence.map((r, i) => <div className="sr" key={i}><span className="n">{r.k} · {r.status}</span><span className="m">{r.c}</span></div>)}
            </div></div>
          </div>
          <div>
            <div className="sec-head"><span className="eyebrow">Recommended next actions · Pareto</span></div>
            <div className="card pad">
              <p style={{ margin: "0 0 4px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--good)" }}>P0 · free</p>
              <ul style={{ margin: 0, paddingLeft: 18, color: "var(--ink)", fontSize: 13, lineHeight: 1.7 }}>{m.nextActions.p0.map((a, i) => <li key={i}>{a}</li>)}</ul>
              <p style={{ margin: "8px 0 4px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--warn)" }}>P1 · cheap paid</p>
              <ul style={{ margin: 0, paddingLeft: 18, color: "var(--ink)", fontSize: 13, lineHeight: 1.7 }}>{m.nextActions.p1.map((a, i) => <li key={i}>{a}</li>)}</ul>
              <p style={{ margin: "8px 0 4px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--phone)" }}>P2 · robust paid</p>
              <ul style={{ margin: 0, paddingLeft: 18, color: "var(--ink)", fontSize: 13, lineHeight: 1.7 }}>{m.nextActions.p2.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          </div>
        </div>

        {/* Corrections & provenance section omitted for the demo. */}
        <p style={{ margin: "22px 0 0", fontSize: 11, color: "var(--muted)" }}>Inferred/deterministic demo analysis of a consented subject. Not clinical or verified; adjudication is DCSA&apos;s, not OSINT.</p>
      </div>
    </div>
  );
}
