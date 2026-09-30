import Link from "next/link";
import { Activity, AtSign, BookOpen, Bookmark, Briefcase, Camera, Clapperboard, Code, Globe, GraduationCap, Hash, Link2, MessagesSquare, Mic, Music, Palette, Play, Tv, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BRAND_MARKS } from "@/components/brand-icons";
import type { ReportModel } from "@/lib/report";
import { bandColor, scoreBand } from "@/lib/utils";
import { AdjacencyMap } from "./adjacency-map";

/**
 * Renders a subject's clearance report in the marketing `/clearance` visual language
 * (see marketing/app/clearance). Data-driven from lib/report.ts (names aliased at the
 * field level). Only the report body — the workbench supplies the page chrome.
 */

const KIND_COLOR: Record<string, string> = {
  person: "var(--person)",
  address: "var(--address)",
  phone: "var(--phone)",
  org: "var(--org)",
};

const ADJ_COLOR: Record<string, string> = {
  Utility: "var(--address)",
  Government: "var(--primary)",
  Military: "var(--crit)",
  "Company HQ": "var(--org)",
  Institution: "var(--phone)",
  Infrastructure: "var(--muted)",
};

/** Critical-adjacency proximity map — subject/home at center, sites placed by distance. */
/**
 * Platform glyphs.
 *
 * lucide-react v1 ships no brand icons, and copying brand marks into a proprietary
 * demo is not worth the trademark question, so each platform maps to a meaningful
 * shipped glyph instead: what the platform is for, not whose logo it is. Tinted by
 * kind, because the professional/casual split is the distinction that matters here.
 */
const SOCIAL_ICON: Record<string, LucideIcon> = {
  LinkedIn: Briefcase,
  GitHub: Code,
  "Google Scholar": GraduationCap,
  ResearchGate: BookOpen,
  Behance: Palette,
  "Personal site": Globe,
  "Speaker profile": Mic,
  X: Hash,
  Instagram: Camera,
  Reddit: MessagesSquare,
  TikTok: Music,
  Facebook: Users,
  Strava: Activity,
  Pinterest: Bookmark,
  Twitch: Tv,
  YouTube: Play,
  Mastodon: AtSign,
  Letterboxd: Clapperboard,
};

/** 1_200 -> "1.2k", 48_000 -> "48k" — reach is an order-of-magnitude claim, not a count. */
function fmtReach(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}k`;
  }
  return String(n);
}

export function ClearanceReport({ model: m, graphHref }: { model: ReportModel; graphHref?: string }) {
  const C = 2 * Math.PI * 42; // gauge circumference
  const offset = C * (1 - m.confidence);
  const maxCat = Math.max(1, ...m.recordsByCategory.map((r) => r.count));
  const maxYear = Math.max(1, ...m.activityByYear.map((y) => y.count));

  const netSvg = (
    <svg viewBox="0 0 1080 460" role="img" aria-label="Connection graph">
      <g className="edges">
        {m.graph.edges.map((e, i) => {
          const a = m.graph.nodes.find((n) => n.id === e.a)!;
          const b = m.graph.nodes.find((n) => n.id === e.b)!;
          return <path key={i} className={`edge${e.pred ? " pred" : ""}`} d={`M${a.x},${a.y} L${b.x},${b.y}`} />;
        })}
      </g>
      {m.graph.nodes.map((n) => (
        <g className={`node${n.id === "subj" ? " subj" : ""}`} key={n.id}>
          {n.kind === "address" ? (
            <rect className="shape" x={n.x - 14} y={n.y - 14} width="28" height="28" rx="6" fill={KIND_COLOR[n.kind]} />
          ) : n.kind === "org" ? (
            <path className="shape" d={`M${n.x} ${n.y - 16} l16 30 h-32 z`} fill={KIND_COLOR[n.kind]} />
          ) : (
            <circle className="shape" cx={n.x} cy={n.y} r={n.id === "subj" ? 26 : 15} fill={KIND_COLOR[n.kind]} />
          )}
          <text x={n.x} y={n.y + (n.id === "subj" ? 42 : 30)} textAnchor="middle">{n.label}</text>
          {n.id === "subj" ? <text className="role" x={n.x} y={n.y + 56} textAnchor="middle">SUBJECT · {m.confidence.toFixed(2)}</text> : null}
        </g>
      ))}
    </svg>
  );

  return (
    <div className="gl-report">
      <section id="subject" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <div className="card pad">
            <div className="subject">
              <div className="avatar" aria-hidden="true">
                <svg viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="23" r="12" stroke="currentColor" strokeWidth="3" />
                  <path d="M12 55a20 20 0 0 1 40 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
              <div className="id">
                <h3>
                  {m.alias.alias}{" "}
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>
                    · {m.alias.codename}
                  </span>
                </h3>
                <div className="sub">
                  {m.dobYear ? <span>DOB {m.dobYear} (est.)</span> : m.age ? <span>age {m.age}</span> : null}
                  {m.location ? <span>{m.location}</span> : null}
                  <span>Resolved from {m.quickstats.recordsFused} records</span>
                </div>
                <div className="aka">
                  Also seen as {m.akas.map((a, i) => <b key={i}>{a}{i < m.akas.length - 1 ? ", " : ""}</b>)}
                </div>
              </div>
              <div className="gaugebox">
                <svg width="104" height="104" viewBox="0 0 104 104" aria-label={`Identity confidence ${m.confidence.toFixed(2)}`}>
                  <circle cx="52" cy="52" r="42" fill="none" stroke="var(--hairline)" strokeWidth="9" />
                  <circle cx="52" cy="52" r="42" fill="none" stroke="var(--good)" strokeWidth="9" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset} transform="rotate(-90 52 52)" />
                  <text x="52" y="48" textAnchor="middle" fontFamily="var(--sans)" fontSize="24" fontWeight="700" fill="var(--ink)">{m.confidence.toFixed(2)}</text>
                  <text x="52" y="66" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--muted)">CONFIDENCE</text>
                </svg>
                <div className={`risk ${m.risk === "elevated" ? "elevated" : ""}`}>⬤ Risk: {m.risk === "elevated" ? "Elevated" : "Low"}</div>
              </div>
            </div>
            <div className="quickstats">
              <div className="qs"><div className="v">{m.quickstats.sourceFamilies}</div><div className="k">source families</div></div>
              <div className="qs"><div className="v">{m.quickstats.recordsFused}</div><div className="k">records fused</div></div>
              <div className="qs"><div className="v">{m.quickstats.connections}</div><div className="k">connections</div></div>
              <div className="qs"><div className="v">{m.quickstats.riskFlags}</div><div className="k">risk flags</div></div>
            </div>
          </div>
        </div>
      </section>

      {m.adjacency.length > 0 ? (
        <section id="adjacency">
          <div className="wrap">
            <div className="sec-head"><span className="eyebrow">Critical adjacency · utilities, government, military, HQs &amp; institutions</span><h2>Proximity to critical sites.</h2><p>Career- and education-relevant sites near the subject&apos;s cities.</p></div>
            <div className="card" style={{ padding: 14 }}><AdjacencyMap adj={m.adjacency} subjectName={m.alias.alias} focusHref={graphHref} /></div>
            <div className="legend" style={{ marginTop: 10 }}>
              <span><i style={{ background: "var(--address)" }} />Utility</span>
              <span><i style={{ background: "var(--primary)" }} />Government</span>
              <span><i style={{ background: "var(--crit)" }} />Military</span>
              <span><i style={{ background: "var(--org)" }} />Company HQ</span>
              <span><i style={{ background: "var(--phone)" }} />Institution</span>
              <span><i style={{ background: "var(--muted)" }} />Infrastructure</span>
            </div>
            <div className="card pad" style={{ marginTop: 14 }}>
              <p className="chart-title">Critical sites near the subject</p>
              <div className="srclist">
                {m.adjacency.map((a, i) => (
                  <div className="sr" key={i}>
                    <span className="n"><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: ADJ_COLOR[a.type], marginRight: 8 }} /><b>{a.name}</b> · {a.relevance}</span>
                    <span className="m">{a.type} · {a.distanceMi} mi · conf {a.confidence.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <p style={{ margin: "8px 2px 0", fontSize: 11, color: "var(--muted)" }}>Inferred adjacency for a consented clearance workup — illustrative, not verified geolocation.</p>
          </div>
        </section>
      ) : null}

      {m.graph.nodes.length > 1 ? (
        <section id="graph">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow">Connection graph</span>
              <h2>The web around the subject.</h2>
              <p>People, family, associates, addresses and phones linked to the subject.</p>
            </div>
            {graphHref ? (
              <Link href={graphHref} className="net" style={{ display: "block", cursor: "pointer" }} aria-label="Open the full interactive graph for this subject">
                {netSvg}
              </Link>
            ) : (
              <div className="net">{netSvg}</div>
            )}
            <div className="legend">
              <span><i style={{ background: "var(--person)" }} />Person</span>
              <span><i style={{ background: "var(--address)" }} />Address</span>
              <span><i style={{ background: "var(--phone)" }} />Phone</span>
            </div>
          </div>
        </section>
      ) : null}

      {(m.licensing.licenses.length > 0 || m.employment.length > 0) ? (
        <section id="licensing">
          <div className="wrap">
            <div className="sec-head"><span className="eyebrow">Professional licensing &amp; credentials</span><h2>{m.licensing.role}.</h2><p>{m.licensing.note}</p></div>
            {m.employment.length > 0 ? (
              <div className="card pad" style={{ marginBottom: 14 }}>
                <p className="chart-title">Employment &amp; affiliations</p>
                <div className="srclist">
                  {m.employment.map((e, i) => (
                    <div className="sr" key={i}>
                      <span className="n"><b>{e.company}</b>{e.title ? ` · ${e.title}` : ""}</span>
                      <span className="m">
                        {e.current ? <span style={{ color: "var(--good)" }}>current</span> : "former"}
                        {e.location ? ` · ${e.location}` : ""}
                        {e.from ? ` · ${e.from} → ${e.to ?? "present"}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="card pad">
              <div className="srclist">
                {m.licensing.licenses.map((l, i) => (
                  <div className="sr" key={i}>
                    <span className="n">
                      <b>{l.name}</b> · {l.issuer} · <span style={{ fontFamily: "var(--mono)" }}>{l.id}</span>
                    </span>
                    <span className="m">
                      <span style={{ color: l.status === "Expired" ? "var(--warn)" : "var(--good)" }}>{l.status}</span>
                      {" · "}since {l.since} · {l.renews}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}



      {m.addresses.length > 0 ? (
        <section id="addresses">
          <div className="wrap">
            <div className="sec-head"><span className="eyebrow">Address history</span><h2>Where they&apos;ve been.</h2></div>
            <div className="tline">
              {m.addresses.map((a, i) => (
                <div className="ev" key={i}>
                  <span className="yr">{a.first ? (a.first.match(/\d{4}/)?.[0] ?? "—") : "—"}</span>
                  <div>
                    <h4>{a.full}</h4>
                    <p>{a.first ?? "?"} → {a.last ?? "present"}</p>
                    <div className="src">source · address records + property records</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {m.social.length > 0 ? (
        <section id="social">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow">Public account surface · professional &amp; casual</span>
              <h2>Social media &amp; digital footprint.</h2>
              <p>
                {m.socialFootprint ? `${m.socialFootprint} footprint — ` : ""}
                {m.social.filter((x) => x.kind === "professional").length} professional ·{" "}
                {m.social.filter((x) => x.kind === "casual").length} casual
                {(() => {
                  const reach = m.social.reduce((a, x) => a + (x.followers ?? 0), 0);
                  return reach > 0 ? ` · ${fmtReach(reach)} combined reach.` : ".";
                })()}{" "}
                Accounts are attributed by handle and corroborating detail, not confirmed by the
                platform.
              </p>
            </div>
            <div className="two">
              {(["professional", "casual"] as const).map((kind) => {
                const rows = m.social.filter((x) => x.kind === kind);
                if (rows.length === 0) return null;
                return (
                  <div className="card pad" key={kind}>
                    <p className="chart-title">
                      {kind === "professional" ? "Professional" : "Casual"} · {rows.length}
                    </p>
                    <div className="srclist">
                      {rows.map((x, i) => (
                        <div className="sr" key={i}>
                          <span className="n" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {(() => {
                              // Official mark where one is freely licensed (CC0, see
                              // components/brand-icons.ts); a generic glyph otherwise, so
                              // nothing is a hand-copied logo.
                              const brand = BRAND_MARKS[x.platform];
                              const Icon = SOCIAL_ICON[x.platform] ?? Link2;
                              return (
                                <span
                                  aria-hidden
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 22,
                                    height: 22,
                                    flex: "0 0 auto",
                                    borderRadius: 5,
                                    background: brand
                                      ? `color-mix(in srgb, ${brand.hex} 14%, transparent)`
                                      : kind === "professional"
                                        ? "color-mix(in srgb, var(--primary) 16%, transparent)"
                                        : "color-mix(in srgb, var(--phone) 18%, transparent)",
                                    color: kind === "professional" ? "var(--primary)" : "var(--phone)",
                                  }}
                                >
                                  {brand ? (
                                    <svg
                                      width="13"
                                      height="13"
                                      viewBox="0 0 24 24"
                                      role="img"
                                      aria-hidden
                                      fill={brand.hex}
                                    >
                                      <path d={brand.path} />
                                    </svg>
                                  ) : (
                                    <Icon size={13} strokeWidth={2} />
                                  )}
                                </span>
                              );
                            })()}
                            <b>{x.platform}</b>{" "}
                            <span style={{ fontFamily: "var(--mono)" }}>@{x.handle}</span>
                            {x.verified ? (
                              <span style={{ color: "var(--good)", marginLeft: 6 }}>· verified</span>
                            ) : null}
                          </span>
                          <span className="m">
                            {x.followers != null ? `${fmtReach(x.followers)} followers · ` : ""}
                            {x.visibility ?? "unknown"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ margin: "8px 2px 0", fontSize: 11, color: "var(--muted)" }}>
              Handles only — no platform API was queried and no private content is represented.
              Fictional sample data.
            </p>
          </div>
        </section>
      ) : null}

      {m.relatives.length > 0 ? (
        <section id="relatives">
          <div className="wrap">
            <div className="sec-head"><span className="eyebrow">Relatives &amp; associates</span><h2>The people around the subject.</h2></div>
            <div className="card pad">
              <div className="srclist">
                {m.relatives.map((r, i) => (
                  <div className="sr" key={i}>
                    <span className="n"><b>{r.name}</b> · {r.relationship}{r.location ? ` · ${r.location}` : ""}</span>
                    <span className="m" style={{ color: bandColor(scoreBand(r.score)) }}>{scoreBand(r.score) ? `${scoreBand(r.score)} likelihood` : "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section id="risk">
        <div className="wrap">
          <div className="sec-head"><span className="eyebrow">Risk indicators</span><h2>What the system flags — and why.</h2></div>
          <div className="risks">
            {m.risks.map((r, i) => (
              <div className={`rk ${r.sev === "warning" ? "warning" : ""}`} key={i}>
                <span className="ico">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" /><path d="M8 5v3.4M8 10.6v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </span>
                <div><h4>{r.title}</h4><div className="src">{r.source}</div></div>
                {/* Only warnings carry a severity chip. "○ Info" repeated down every
                    row was noise: the absence of a chip already means informational. */}
                {r.sev === "warning" ? <span className="sev warning">● Warning</span> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {(m.recordsByCategory.length > 0 || m.activityByYear.length > 0) ? (
        <section id="records">
          <div className="wrap">
            <div className="sec-head"><span className="eyebrow">Records breakdown</span><h2>What was found, by type and over time.</h2></div>
            <div className="two">
              <div className="card pad">
                <p className="chart-title">Records by category ({m.quickstats.recordsFused} total)</p>
                <div className="bars">
                  {m.recordsByCategory.map((r) => (
                    <div className="bar" key={r.label}>
                      <span className="bl">{r.label}</span>
                      <div className="track"><div className="fill" style={{ width: `${Math.round((r.count / maxCat) * 100)}%`, ...(r.tone === "warn" ? { background: "var(--warn)" } : {}) }} title={`${r.label}: ${r.count}`} /></div>
                      <span className="bv">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              {m.activityByYear.length > 0 ? (
                <div className="card pad">
                  <p className="chart-title">Recorded activity by year</p>
                  <div className="cols">
                    {m.activityByYear.map((y) => (
                      <div className="col" key={y.year}>
                        <div className="cbar" style={{ height: `${Math.round((y.count / maxYear) * 100)}%` }} title={`${y.year}: ${y.count}`} />
                        <span className="cx">&apos;{y.year.slice(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

    </div>
  );
}

/**
 * Chain of custody. Rendered by the subject page AFTER the premium deep-clearance
 * panel, so the seal closes the whole dossier rather than the standard report only.
 * Keeps the .gl-report wrapper because the dossier CSS is scoped to it.
 */
export function SourcesSection({ model: m }: { model: ReportModel }) {
  return (
    <div className="gl-report">
      <section id="sources">
        <div className="wrap">
          <div className="sec-head"><span className="eyebrow">Sources &amp; chain of custody</span><h2>Every claim, cited. Every export, sealed.</h2></div>
          <div className="sources">
            <div className="card pad">
              <p className="chart-title">Where the records came from</p>
              <div className="srclist">
                {m.sources.map((s, i) => (
                  <div className="sr" key={i}><span className="n">{s.name}</span><span className="m">{s.count}{s.conf ? ` · ${s.conf}` : ""}</span></div>
                ))}
              </div>
            </div>
            <div className="custody">
              <div className="row">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5 3 4v4.5c0 3.5 2.6 5.8 6 6.9 3.4-1.1 6-3.4 6-6.9V4L9 1.5Z" stroke="currentColor" strokeWidth="1.5" /><path d="m6.2 9 1.9 1.9L12 6.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span><b>Signed evidence package</b> — report + source artifacts + SHA-256 manifest.</span>
              </div>
              <div className="row">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 4h12M3 9h12M3 14h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                <span><b>Tamper-evident audit log</b> — every query recorded with a purpose attestation.</span>
              </div>
              <div className="hash">manifest · sha256 {m.hashHead} · sealed {m.sealedAt} · purpose: clearance-vetting</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
