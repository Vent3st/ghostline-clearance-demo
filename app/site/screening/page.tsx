import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Screening — Sample Result · Ghostline",
  description:
    "A sample of what one Ghostline live screen returns at the front desk — instant watchlist result, match detail, printed badge, throughput and a sealed audit record. Fictional data.",
};

export default function ScreeningReport() {
  return (
    <div className="gl-report">
      <div className="ribbon">Sample result · fictional visitors · illustrative data only</div>

      <header className="nav">
        <div className="wrap">
          <a className="brand" href="/site">
            <svg className="mark" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2 3 6v6c0 5 3.8 8.4 9 10 5.2-1.6 9-5 9-10V6l-9-4Z" stroke="var(--primary)" strokeWidth="1.6" /><path d="m8.5 12 2.4 2.4L15.7 9.6" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Ghostline
          </a>
          <nav className="links" aria-label="Primary">
            <a href="#result">The result</a><a href="#badge">Badge</a><a href="#throughput">Throughput</a>
            <a href="/site/clearance">Deep dossier ↗</a>
          </nav>
          <a href="/site#book" className="btn btn-primary btn-sm">Book a demo</a>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap">
            <span className="eyebrow">Live screening · sample result</span>
            <h1>What a live screen surfaces — in <span className="em">under 3 seconds.</span></h1>
            <p className="lede">One walk-in at the front desk. Here&apos;s exactly what the desk sees, what the visitor gets, and what&apos;s sealed to the record. Fictional data, shown to make the value obvious.</p>
            <div className="cta"><a href="/site#book" className="btn btn-primary">Book a demo</a><a href="/site/clearance" className="btn btn-ghost">See a deep dossier →</a></div>
          </div>
        </section>

        <section id="result">
          <div className="wrap">
            <div className="sec-head"><span className="eyebrow">A flagged walk-in</span><h2>Instant result, with the reason attached.</h2></div>
            <div className="card pad">
              <div className="result">
                <div className="who">
                  <div className="avatar" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="23" r="12" stroke="currentColor" strokeWidth="3" /><path d="M12 55a20 20 0 0 1 40 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg><span className="redact" /></div>
                  <h3>R. Hale</h3>
                  <div className="meta">Walk-in · no appt<br />2:44 PM</div>
                </div>
                <div className="verdict flag">
                  <div className="top">
                    <span className="big"><span className="icn"><svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2 1.5 19h19L11 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M11 8.5v4.4M11 15.6v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></span>Flagged — do not admit</span>
                    <span className="sub">screen completed<br /><b style={{ color: "var(--ink)" }}>2.4s</b></span>
                  </div>
                  <div className="reasons">
                    <span className="rchip">⚑ State sex-offender registry</span>
                    <span className="rchip">⚑ District custody watchlist</span>
                  </div>
                  <div className="matchbar"><span className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>Match confidence</span><div className="track" data-tip="94% · name+DOB ✓ · photo similarity 0.91 · last known ZIP ✓"><div className="fill" style={{ width: "94%" }} /></div><span className="mono" style={{ color: "var(--crit)" }}>94%</span></div>
                  <div className="fields">
                    <span className="f">name + DOB <b>✓</b></span>
                    <span className="f">photo similarity <b>0.91</b></span>
                    <span className="f">last known ZIP <b>✓</b></span>
                  </div>
                  <div className="deskline"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5 2.5 4v3.5c0 3 2.3 5.1 5.5 6 3.2-.9 5.5-3 5.5-6V4L8 1.5Z" stroke="currentColor" strokeWidth="1.4" /></svg><span><b>What the desk sees:</b> a quiet on-screen alert and a withheld badge — no announcement, no scene. The record is sealed and, one click, escalates to a full investigation.</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="badge">
          <div className="wrap">
            <div className="sec-head"><span className="eyebrow">The other 96%</span><h2>Cleared visitors barely notice.</h2></div>
            <div className="two">
              <div className="card pad cleared">
                <div className="v"><span className="icn"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="m4 10 4 4 8-8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>Cleared — Maria Klein</div>
                <p>Parent, here for 2:40 pickup. No match on any list; badge printed automatically.</p>
                <div className="flow"><span className="st on">Scan</span>→<span className="st on">Screen</span>→<span className="st on">Cleared</span>→<span className="st on">Badge printed</span></div>
                <p style={{ fontFamily: "var(--mono)", fontSize: 11 }}>elapsed 1.9s · sealed to audit log</p>
              </div>
              <div className="badge" aria-label="Sample printed visitor badge">
                <div className="ph" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="23" r="12" stroke="currentColor" strokeWidth="3" /><path d="M12 55a20 20 0 0 1 40 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg></div>
                <div>
                  <div className="top">✓ Visitor · Cleared</div>
                  <h4>Maria Klein</h4>
                  <div className="r">Parent · Pickup — Rm 14</div>
                </div>
                <div className="foot">
                  <span>Lincoln Elementary · 2026-09-18<br />Expires 4:00 PM · escort not required</span>
                  <span className="qr" aria-hidden="true">
                    <i /><i className="o" /><i /><i /><i className="o" /><i /><i /><i className="o" /><i /><i /><i className="o" /><i /><i className="o" /><i className="o" /><i /><i /><i className="o" /><i /><i /><i className="o" /><i /><i className="o" /><i /><i className="o" /><i />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how">
          <div className="wrap">
            <div className="sec-head"><span className="eyebrow">Anatomy of a 2.4-second screen</span><h2>Four things, one tap.</h2></div>
            <div className="screen-tl">
              <div className="st4"><span className="t">0.0s</span><h4>Scan / type</h4><p>License scan or a typed name at the desk. No visitor app.</p></div>
              <div className="st4"><span className="t">0.6s</span><h4>Match every list</h4><p>Registries + your banned-persons &amp; custody lists, in parallel.</p></div>
              <div className="st4 flag"><span className="t">2.1s</span><h4>Verdict</h4><p>Cleared → badge. Hit → quiet alert with the reason.</p></div>
              <div className="st4"><span className="t">2.4s</span><h4>Seal</h4><p>Hashed, timestamped entry written to the audit log.</p></div>
            </div>
          </div>
        </section>

        <section id="throughput">
          <div className="wrap">
            <div className="sec-head"><span className="eyebrow">A morning at the front desk</span><h2>Built for the arrival rush.</h2><p>Sample volume from one campus, 7–11 AM.</p></div>
            <div className="two">
              <div className="card pad">
                <p className="chart-title">Visitors screened per hour</p>
                <div className="cols" role="img" aria-label="Visitors screened per hour: 7AM 18, 8AM 47, 9AM 31, 10AM 22, 11AM 15">
                  <div className="col"><div className="cbar" style={{ height: "38%" }} data-tip="7 AM: 18" /><span className="cx">7A</span></div>
                  <div className="col"><div className="cbar" style={{ height: "100%" }} data-tip="8 AM: 47 (peak)" /><span className="cx">8A</span></div>
                  <div className="col"><div className="cbar" style={{ height: "66%" }} data-tip="9 AM: 31" /><span className="cx">9A</span></div>
                  <div className="col"><div className="cbar" style={{ height: "47%" }} data-tip="10 AM: 22" /><span className="cx">10A</span></div>
                  <div className="col"><div className="cbar" style={{ height: "32%" }} data-tip="11 AM: 15" /><span className="cx">11A</span></div>
                </div>
                <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", margin: "14px 0 0" }}>133 screened · median 2.1s · no line backup</p>
              </div>
              <div className="card pad">
                <p className="chart-title">Outcomes</p>
                <div className="donutwrap">
                  <svg width="150" height="150" viewBox="0 0 42 42" aria-label="Outcomes: 129 cleared, 4 flagged">
                    <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--good)" strokeWidth="7" data-tip="129 cleared &amp; badged · 97%" />
                    <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--crit)" strokeWidth="7" strokeDasharray="3 97" strokeDashoffset="25" strokeLinecap="butt" data-tip="4 flagged · desk alerted · 3%" />
                    <text x="21" y="20.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="var(--ink)">133</text>
                    <text x="21" y="27" textAnchor="middle" fontSize="3.2" fill="var(--muted)" fontFamily="var(--mono)">SCREENED</text>
                  </svg>
                  <div className="lg">
                    <div className="row"><i style={{ background: "var(--good)" }} /><span><b>129</b> <span className="k">cleared &amp; badged</span></span></div>
                    <div className="row"><i style={{ background: "var(--crit)" }} /><span><b>4</b> <span className="k">flagged · desk alerted</span></span></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="audit-strip">
              <div><span className="k">08:12:04</span> · visitor #47 · <span className="flag">registry + custody match</span> · badge withheld · desk alerted</div>
              <div><span className="k">08:12:04</span> · sha256 a1f9…7c2 · sealed · operator purpose: visitor-safety</div>
              <div><span className="k">08:12:05</span> · escalation offered → deep security &amp; clearance</div>
            </div>
          </div>
        </section>

        <section className="cta-band">
          <div className="wrap">
            <span className="eyebrow" style={{ justifyContent: "center" }}>Fast at the door, deep on demand</span>
            <h2>Run a screen on your own watchlists.</h2>
            <p>A 20-minute walkthrough at your front desk — then watch one flag escalate into a full dossier.</p>
            <div className="cta"><a href="/site#book" className="btn btn-primary">Book a demo</a><a href="/site/clearance" className="btn btn-ghost">See a deep dossier →</a></div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="brand"><svg className="mark" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2 3 6v6c0 5 3.8 8.4 9 10 5.2-1.6 9-5 9-10V6l-9-4Z" stroke="var(--primary)" strokeWidth="1.6" /></svg>Ghostline</div>
          <nav aria-label="Legal" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}><a href="/site/privacy">Privacy</a><a href="/site/terms">Terms</a></nav>
          <p className="legal">Design mockup · all visitors, matches and volumes above are fictional sample data, not real people or records. GHOSTLINE™ — © 2026 Ghostline. Consented, registry-based visitor screening under applicable screening / PI-licensing rules.</p>
        </div>
      </footer>
    </div>
  );
}
