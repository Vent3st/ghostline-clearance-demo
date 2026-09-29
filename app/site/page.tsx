"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import {
  ShieldCheck,
  Shield,
  Check,
  Lock,
  ScrollText,
  Clock,
  AlertCircle,
  FileCheck,
  Users,
  Network,
  Boxes,
} from "lucide-react";

const dot = (v: string) => ({ ["--dot"]: v } as CSSProperties);

export default function SitePage() {
  const [flagged, setFlagged] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFlagged(true);
      return;
    }
    const t = setTimeout(() => setFlagged(true), 1600);
    return () => clearTimeout(t);
  }, []);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
      return;
    }
    setSubmitted(true);
  }

  return (
    <div className="gl-site">
      <header className="nav">
        <div className="wrap">
          <a className="brand" href="#top">
            <ShieldCheck size={22} aria-hidden />
            Ghostline
          </a>
          <nav className="links" aria-label="Primary">
            <a href="#journeys">Two journeys</a>
            <a href="#graph">Graph intelligence</a>
            <a href="#guardrails">Guardrails</a>
            <a href="#faq">FAQ</a>
          </nav>
          <a href="/subjects" className="btn btn-primary btn-sm">Launch demo →</a>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <span className="eyebrow">Live screening · Clearance-grade vetting</span>
              <h1>
                From the front-desk line to the <span className="em">clearance file.</span>
              </h1>
              <p className="lede">
                Ghostline screens a visitor against your watchlists in seconds — and, when it
                matters, escalates the same subject into a sourced, connection-mapped
                investigation. One platform, two depths.
              </p>
              <div className="cta">
                <a href="/subjects" className="btn btn-primary">Launch the demo →</a>
                <a href="#book" className="btn btn-ghost">Book a demo</a>
              </div>
              <div className="trust">
                <span><b>&lt;3s</b> live screen</span>
                <span><b>Clearance-grade</b> depth on demand</span>
                <span><b>Every</b> decision logged</span>
              </div>
            </div>

            <div className="desk" aria-label="Front desk screening demo">
              <div className="desk-top">
                <span className="t">Front Desk · Lincoln Elementary</span>
                <span className="live"><span className="dot" />Live</span>
              </div>
              <div className="desk-body">
                <div className="visitor">
                  <span className="avatar">MK</span>
                  <span className="mid"><span className="who">Maria Klein</span><span className="meta">Parent · pickup · 2:41 PM</span></span>
                  <span className="chip ok">✓ Cleared</span>
                </div>
                <div className="visitor">
                  <span className="avatar">DO</span>
                  <span className="mid"><span className="who">David Osei</span><span className="meta">Contractor · HVAC · 2:43 PM</span></span>
                  <span className="chip ok">✓ Cleared</span>
                </div>
                <div className="visitor is-flag">
                  <span className="avatar">RH</span>
                  <span className="mid"><span className="who">R. Hale</span><span className="meta">Walk-in · no appointment · 2:44 PM</span></span>
                  {flagged ? (
                    <span className="chip flag">⚑ Flagged</span>
                  ) : (
                    <span className="chip scan">Screening…</span>
                  )}
                </div>
                <div className="audit">
                  <div><span className="k">14:44:07</span> registry match · <span style={{ color: "var(--flag)" }}>custody watchlist hit</span></div>
                  <div><span className="k">14:44:07</span> desk notified · badge withheld</div>
                  <div><span className="esc">→ escalate to deep vetting</span> · connections + history</div>
                  <div><span className="k">sha256</span> a1f9…7c2 · sealed to audit log</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        <section id="journeys">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow">Two journeys, one platform</span>
              <h2>Buy the depth you need.</h2>
              <p>Instant screening at the door, or a full clearance-grade investigation — the same subject, the same audit trail, two levels of depth.</p>
            </div>
            <div className="journeys">
              <div className="jrn a">
                <span className="tag">Journey 1 · for front desks, events, facilities</span>
                <h3>Live screening</h3>
                <p className="desc">High-volume watchlist screening at check-in. Fast enough for an arrival line, defensible enough for a custody dispute.</p>
                <ul>
                  <li><Check size={16} aria-hidden />Registries + your banned-persons &amp; custody lists</li>
                  <li><Check size={16} aria-hidden />Sub-3-second result · printed visitor badge</li>
                  <li><Check size={16} aria-hidden />Quiet flag to the desk — no scene</li>
                </ul>
                <div className="guard"><Shield size={16} aria-hidden /><span><b>Guardrail that sells:</b> consent-scoped, one entry at a time, every check sealed to a tamper-evident trail.</span></div>
                <div className="foot"><a href="/site/screening">See what a live screen surfaces →</a></div>
              </div>

              <div className="jrn b">
                <span className="tag">Journey 2 · for security teams, investigators, vetting</span>
                <h3>Deep security &amp; clearance</h3>
                <p className="desc">In-depth background checks and clearance-grade vetting: identity resolution, full history, connection graph and risk indicators — sourced and confidence-scored for a trust decision.</p>
                <ul>
                  <li><Check size={16} aria-hidden />Address, vehicle, court, corporate &amp; associate history</li>
                  <li><Check size={16} aria-hidden />Connection graph — links a checklist misses</li>
                  <li><Check size={16} aria-hidden />Every finding cited, timestamped, confidence-scored</li>
                </ul>
                <div className="guard"><Shield size={16} aria-hidden /><span><b>Guardrail that sells:</b> permissible-purpose gated, chain-of-custody export ready for counsel or an adjudicator.</span></div>
                <div className="foot"><a href="/subjects">Run a live clearance →</a> · <a href="/site/clearance">sample dossier</a></div>
              </div>
            </div>
          </div>
        </section>

        <section id="how">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow">How it works</span>
              <h2>One check-in. Escalates only when it needs to.</h2>
              <p>Fast at the door, deep on demand — the same subject flows from a screen to an investigation without re-keying a thing.</p>
            </div>
            <div className="steps">
              <div className="step"><span className="n">Step 1</span><h4>Scan or type a name</h4><p>License scan or manual entry. No app, no account for the visitor — the desk stays in control.</p></div>
              <div className="step"><span className="n">Step 2</span><h4>Screen against every list</h4><p>National &amp; state registries, plus your banned-persons and custody / court-order watchlists — matched in seconds.</p></div>
              <div className="step"><span className="n">Step 3</span><h4>Badge, flag, or <span className="esc">escalate</span></h4><p>Cleared visitors get a badge. A hit seals a hashed record — and, one click, becomes a deep clearance-grade investigation on that subject.</p></div>
            </div>
          </div>
        </section>

        <section id="graph" className="graph">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow">Proprietary graph intelligence</span>
              <h2>The connections a checklist can&apos;t see.</h2>
              <p>Most tools return a list. Ghostline returns a resolved subject and the web around them — the difference between a record and an understanding.</p>
            </div>
            <div className="graph-grid">
              <div className="gcards">
                <div className="gc" style={dot("var(--person)")}>
                  <div className="ic"><Users size={18} aria-hidden /></div>
                  <h4>One resolved entity</h4>
                  <p>Fragments — names, addresses, plates, phones — fuse into a single, confidence-scored subject instead of a pile of near-matches.</p>
                </div>
                <div className="gc" style={dot("var(--org)")}>
                  <div className="ic"><Network size={18} aria-hidden /></div>
                  <h4>Connection mapping</h4>
                  <p>Surfaces the links between people, addresses, vehicles and organizations that a flat report leaves buried — and shows why each edge exists.</p>
                </div>
                <div className="gc" style={dot("var(--address)")}>
                  <div className="ic"><Boxes size={18} aria-hidden /></div>
                  <h4>Purpose-built collectors</h4>
                  <p>Specialized collectors reach public and licensed sources general tools skip, normalized straight into the graph. How they work stays proprietary.</p>
                </div>
              </div>

              <div className="gviz" aria-label="Illustration: one subject resolved from mixed signals with mapped connections">
                <svg viewBox="0 0 440 405" role="img">
                  <g className="edges">
                    <path className="edge" d="M220,150 L140,108" />
                    <path className="edge" d="M220,150 L320,120" />
                    <path className="edge" d="M220,150 L292,236" />
                    <path className="edge" d="M220,150 L146,246" />
                    <path className="edge" d="M146,246 L108,322" />
                    <path className="edge pred" d="M292,236 L352,312" />
                    <path className="edge pred" d="M320,120 L388,92" />
                  </g>
                  <g className="node"><circle className="shape" cx="220" cy="150" r="19" fill="var(--person)" /><text x="220" y="186" textAnchor="middle">Subject · 0.87</text></g>
                  <g className="node"><rect className="shape" x="126" y="94" width="28" height="28" rx="5" fill="var(--address)" /><text x="140" y="138" textAnchor="middle">Address ×4</text></g>
                  <g className="node float b"><path className="shape" d="M320 104 l14 24 h-28 z" fill="var(--org)" /><text x="320" y="150" textAnchor="middle">LLC</text></g>
                  <g className="node float c"><circle className="shape" cx="292" cy="236" r="13" fill="var(--phone)" /><text x="292" y="268" textAnchor="middle">Phone</text></g>
                  <g className="node float"><circle className="shape" cx="146" cy="246" r="13" fill="var(--person)" /><text x="146" y="278" textAnchor="middle">Associate</text></g>
                  <g className="node"><rect className="shape" x="97" y="311" width="22" height="22" rx="5" fill="var(--address)" /></g>
                  <g className="node float c" opacity={0.6}><circle className="shape" cx="352" cy="312" r="10" fill="var(--phone)" /></g>
                </svg>
                <span className="cap">— predicted edge · resolves on next collector pass</span>
              </div>
            </div>
            <div className="legend">
              <span><i style={{ background: "var(--person)" }} />Person</span>
              <span><i style={{ background: "var(--address)" }} />Address</span>
              <span><i style={{ background: "var(--phone)" }} />Phone</span>
              <span><i style={{ background: "var(--org)" }} />Organization</span>
              <span>— — predicted / unconfirmed</span>
            </div>
            <p className="moat-note"><b>Sourced, not scraped-and-hoped.</b> The collection and resolution methods are proprietary — but every node and edge you see is still cited to its source and timestamp, so a finding holds up in a report, a clearance file, or a courtroom. No trade secrets shared on this page.</p>
          </div>
        </section>

        <section id="guardrails">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow">Guardrails are a feature</span>
              <h2>Built to pass procurement and legal — not around them.</h2>
              <p>Every constraint below is a reason a school board, a security lead, or a court will say yes.</p>
            </div>
            <div className="cgrid">
              <div className="cc"><div className="badge"><Lock size={16} aria-hidden /></div><h4>Consent &amp; purpose gates</h4><p>An operator attests a legitimate purpose before any deeper pull runs.</p><span className="sell">Defensible by default</span></div>
              <div className="cc"><div className="badge"><ScrollText size={16} aria-hidden /></div><h4>Tamper-evident audit log</h4><p>Every screen and query hashed, timestamped, reviewable by counsel.</p><span className="sell">Every decision is provable</span></div>
              <div className="cc"><div className="badge"><Clock size={16} aria-hidden /></div><h4>Retention controls</h4><p>You set how long entries live; auto-purge on your schedule.</p><span className="sell">Data minimization you configure</span></div>
              <div className="cc"><div className="badge"><ShieldCheck size={16} aria-hidden /></div><h4>Scoped to permissible purpose</h4><p>Registry-based screening and permissible-purpose research under FCRA / DPPA / state PI law.</p><span className="sell">Aligned with the rules that govern it</span></div>
              <div className="cc"><div className="badge"><AlertCircle size={16} aria-hidden /></div><h4>One subject at a time</h4><p>No bulk-scraping mode; ingests breach intelligence but never resells it.</p><span className="sell">No liability from mass data</span></div>
              <div className="cc"><div className="badge"><FileCheck size={16} aria-hidden /></div><h4>Chain of custody</h4><p>Export a signed, hashed package a court or adjudicator will accept.</p><span className="sell">Findings that hold up</span></div>
            </div>
          </div>
        </section>

        <section id="faq">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow">Questions buyers ask</span>
              <h2>The answers procurement and security need first.</h2>
            </div>
            <div className="faq">
              <details className="q"><summary>What&apos;s the difference between the two journeys?</summary><p className="a">Live screening is an instant watchlist check at check-in. Deep security &amp; clearance is a full, sourced investigation of one subject — history, connections and risk — for a trust or clearance decision. Same platform, same audit trail.</p></details>
              <details className="q"><summary>Which lists and sources do you use?</summary><p className="a">Live screening runs national and state registries plus the lists you own. Deep vetting adds address, vehicle, court, corporate and associate records via purpose-built collectors. The collection methods are proprietary; every result is cited to its source.</p></details>
              <details className="q"><summary>What is &ldquo;graph intelligence&rdquo;?</summary><p className="a">We resolve fragments into one confidence-scored subject and map the connections between people, addresses, vehicles and organizations — surfacing links a flat report misses, each with the evidence for why it exists.</p></details>
              <details className="q"><summary>Is this FCRA-compliant?</summary><p className="a">Ghostline is scoped as consented, registry-based screening and permissible-purpose research under applicable FCRA / DPPA / state PI law — not an employment or tenant-screening tool, and never certified as one.</p></details>
              <details className="q"><summary>What do you keep, and for how long?</summary><p className="a">Only what a screen or investigation needs, on the retention window you set. Entries auto-purge on schedule; nothing is sold or shared, and breach data is never resold.</p></details>
              <details className="q"><summary>Can findings hold up in a clearance file or court?</summary><p className="a">Yes — every finding is cited and timestamped, and you can export a signed, hashed chain-of-custody package for counsel or an adjudicator.</p></details>
            </div>
          </div>
        </section>

        <section id="book" className="book">
          <div className="wrap">
            <div className="book-grid">
              <div>
                <span className="eyebrow">Now in pilots</span>
                <h2 className="booktitle">See a screen — and a full investigation — on your data.</h2>
                <ul className="pts">
                  <li><Check size={18} aria-hidden /><span><b>A 20-minute walkthrough</b> — a live check-in, then the same subject escalated into a connection-mapped investigation.</span></li>
                  <li><Check size={18} aria-hidden /><span><b>No commitment</b> — see the audit trail, retention controls and chain-of-custody export first.</span></li>
                  <li><Check size={18} aria-hidden /><span><b>Both depths</b> — for schools &amp; venues, or for security, investigations and clearance vetting.</span></li>
                </ul>
              </div>

              <form className="bform" onSubmit={onSubmit} noValidate>
                <div className="row2">
                  <div className="field"><label htmlFor="name">Full name</label><input id="name" name="name" type="text" autoComplete="name" required /></div>
                  <div className="field"><label htmlFor="role">Role</label><input id="role" name="role" type="text" placeholder="e.g. Security lead" required /></div>
                </div>
                <div className="field"><label htmlFor="org">Organization</label><input id="org" name="org" type="text" required /></div>
                <div className="row2">
                  <div className="field"><label htmlFor="email">Work email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
                  <div className="field"><label htmlFor="interest">Interested in</label>
                    <select id="interest" name="interest" defaultValue="Live screening"><option>Live screening</option><option>Deep security &amp; clearance</option><option>Both</option></select>
                  </div>
                </div>
                <div className="field"><label htmlFor="msg">Anything we should know? <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span></label><textarea id="msg" name="msg" /></div>
                <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitted}>Book a demo</button>
                <p className="hint">Front-end mockup — not connected to a backend. Nothing is sent.</p>
                {submitted && <div className="ok-msg" role="status">Thanks — this is where a booking confirmation would appear.</div>}
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="brand"><ShieldCheck size={22} aria-hidden />Ghostline</div>
          <nav aria-label="Footer"><a href="#journeys">Two journeys</a><a href="#graph">Graph intelligence</a><a href="#guardrails">Guardrails</a><a href="#faq">FAQ</a><a href="#book">Book a demo</a><a href="/site/privacy">Privacy</a><a href="/site/terms">Terms</a></nav>
          <p className="legal">Design mockup for internal review. Sample data only; collection and resolution methods are proprietary and not described here. GHOSTLINE™ — © 2026 Ghostline. Sellable as consented, registry-based screening and permissible-purpose research under applicable screening / PI-licensing rules (FCRA / DPPA / state PI law).</p>
        </div>
      </footer>
    </div>
  );
}
