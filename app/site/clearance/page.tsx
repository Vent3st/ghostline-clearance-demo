import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deep Security & Clearance — Sample Dossier · Ghostline",
  description:
    "A sample of what Ghostline's deep security & clearance dossier surfaces on one subject — resolved identity, a connection graph, records, risk indicators and sourced chain-of-custody. Fictional data.",
};

export default function ClearanceReport() {
  return (
    <div className="gl-report">
      <div className="ribbon">Sample dossier · fictional subject · illustrative data only</div>

      <header className="nav">
        <div className="wrap">
          <a className="brand" href="/site">
            <svg className="mark" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2 3 6v6c0 5 3.8 8.4 9 10 5.2-1.6 9-5 9-10V6l-9-4Z" stroke="var(--primary)" strokeWidth="1.6" /><circle cx="12" cy="11" r="2.4" stroke="var(--primary)" strokeWidth="1.5" /></svg>
            Ghostline
          </a>
          <nav className="links" aria-label="Primary">
            <a href="#graph">Connections</a><a href="#risk">Risk</a><a href="#records">Records</a><a href="#sources">Sources</a>
            <a href="/site/screening">Live screening ↗</a>
          </nav>
          <a href="/site#book" className="btn btn-primary btn-sm">Book a demo</a>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap">
            <span className="eyebrow">Deep security &amp; clearance · sample dossier</span>
            <h1>Inside a <span className="em">clearance-grade</span> dossier.</h1>
            <p className="lede">One subject, resolved and connected — the history, the network, the risk indicators, and the sources behind every claim. Everything below is fictional sample data, shown to make the value obvious at a glance.</p>
            <div className="cta"><a href="/site#book" className="btn btn-primary">Book a demo</a><a href="/site/screening" className="btn btn-ghost">See a live screen →</a></div>
          </div>
        </section>

        <section id="subject">
          <div className="wrap">
            <div className="card pad">
              <div className="subject">
                <div className="avatar" aria-hidden="true">
                  <svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="23" r="12" stroke="currentColor" strokeWidth="3" /><path d="M12 55a20 20 0 0 1 40 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                  <span className="redact" />
                </div>
                <div className="id">
                  <h3>Jordan A. Reyes <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>· SAMPLE SUBJECT</span></h3>
                  <div className="sub"><span>DOB 1988 (est.)</span><span>Queens, NY</span><span>Resolved from 3 partial inputs</span></div>
                  <div className="aka">Also seen as <b>J. Reyes</b>, <b>Jordan Andres Reyes</b>, <b>“JAR”</b></div>
                </div>
                <div className="gaugebox">
                  <svg width="104" height="104" viewBox="0 0 104 104" aria-label="Identity confidence 0.91">
                    <circle cx="52" cy="52" r="42" fill="none" stroke="var(--hairline)" strokeWidth="9" />
                    <circle cx="52" cy="52" r="42" fill="none" stroke="var(--good)" strokeWidth="9" strokeLinecap="round" strokeDasharray="264" strokeDashoffset="24" transform="rotate(-90 52 52)" />
                    <text x="52" y="48" textAnchor="middle" fontFamily="var(--sans)" fontSize="24" fontWeight="700" fill="var(--ink)">0.91</text>
                    <text x="52" y="66" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--muted)">CONFIDENCE</text>
                  </svg>
                  <div className="risk elevated">⬤ Risk: Elevated</div>
                </div>
              </div>
              <div className="quickstats">
                <div className="qs"><div className="v">22</div><div className="k">source families</div></div>
                <div className="qs"><div className="v">38</div><div className="k">records fused</div></div>
                <div className="qs"><div className="v">14</div><div className="k">connections</div></div>
                <div className="qs"><div className="v">4</div><div className="k">risk flags</div></div>
              </div>
            </div>
          </div>
        </section>

        <section id="graph">
          <div className="wrap">
            <div className="sec-head"><span className="eyebrow">Connection graph</span><h2>The web around the subject.</h2><p>Entities resolved and linked across sources. Dashed edges are predicted — unconfirmed until the next collector pass.</p></div>
            <div className="net" aria-label="Connection graph: subject linked to addresses, vehicles, phones, associates and organizations">
              <svg viewBox="0 0 1080 460" role="img">
                <g className="edges">
                  <path className="edge" d="M540,230 L300,120" /><path className="edge" d="M540,230 L800,110" />
                  <path className="edge" d="M540,230 L250,300" /><path className="edge" d="M540,230 L830,300" />
                  <path className="edge" d="M540,230 L470,400" /><path className="edge" d="M540,230 L640,60" />
                  <path className="edge" d="M300,120 L150,190" /><path className="edge" d="M830,300 L960,380" />
                  <path className="edge pred" d="M470,400 L650,410" /><path className="edge pred" d="M800,110 L940,150" />
                </g>
                <g className="node subj" data-tip="Subject · identity confidence 0.91 · resolved from 3 partial inputs · 14 connections"><circle className="shape" cx="540" cy="230" r="26" fill="var(--person)" /><text x="540" y="272" textAnchor="middle">Jordan Reyes</text><text className="role" x="540" y="286" textAnchor="middle">SUBJECT · 0.91</text></g>
                <g className="node" data-tip="Astoria, NY · current address (2021–) · route overlaps protected ZIP"><rect className="shape" x="286" y="106" width="30" height="30" rx="6" fill="var(--address)" /><text x="301" y="152" textAnchor="middle">Astoria, NY</text><text className="role" x="301" y="166" textAnchor="middle">ADDRESS · 2021–</text></g>
                <g className="node" data-tip="Nassau Co. · 1.2 mi from protected party ⚑ · flagged vs active order"><rect className="shape" x="136" y="176" width="26" height="26" rx="6" fill="var(--address)" /><text x="149" y="220" textAnchor="middle">Nassau Co.</text><text className="role" x="149" y="234" textAnchor="middle">ADDR · 1.2mi ⚑</text></g>
                <g className="node" data-tip="Corona, Queens NY · 2016–2019 · overlaps 2019 harassment plea"><rect className="shape" x="238" y="286" width="26" height="26" rx="6" fill="var(--address)" /><text x="251" y="330" textAnchor="middle">Corona, NY</text><text className="role" x="251" y="344" textAnchor="middle">ADDR · 2016–19</text></g>
                <g className="node float" data-tip="Reyes Hauling LLC · formed 2022 · registered agent shares subject's address"><path className="shape" d="M640 40 l16 30 h-32 z" fill="var(--org)" /><text x="640" y="92" textAnchor="middle">Reyes Hauling LLC</text><text className="role" x="640" y="106" textAnchor="middle">ORG · 2022</text></g>
                <g className="node" data-tip="DoorDash · employer · delivery route through protected party's ZIP"><path className="shape" d="M800 92 l15 28 h-30 z" fill="var(--org)" /><text x="800" y="140" textAnchor="middle">DoorDash</text><text className="role" x="800" y="154" textAnchor="middle">EMPLOYER</text></g>
                <g className="node float c" data-tip="(347) •••-••12 · mobile · surfaced in 7 breaches"><circle className="shape" cx="830" cy="300" r="15" fill="var(--phone)" /><text x="830" y="332" textAnchor="middle">(347) •••-••12</text><text className="role" x="830" y="346" textAnchor="middle">PHONE · mobile</text></g>
                <g className="node float" data-tip="7 breach exposures · incl. one stalking-forum mirror"><circle className="shape" cx="960" cy="380" r="12" fill="var(--phone)" /><text x="960" y="408" textAnchor="middle">breach ×7</text><text className="role" x="960" y="422" textAnchor="middle">EXPOSURE</text></g>
                <g className="node" data-tip="M. Reyes · relative · shared address 2016–2019"><circle className="shape" cx="470" cy="400" r="15" fill="var(--person)" /><text x="470" y="432" textAnchor="middle">M. Reyes</text><text className="role" x="470" y="446" textAnchor="middle">RELATIVE</text></g>
                <g className="node float c" opacity={0.72} data-tip="Unknown associate · predicted link · unconfirmed"><circle className="shape" cx="650" cy="410" r="12" fill="var(--person)" strokeDasharray="3 3" /><text x="650" y="438" textAnchor="middle">unknown assoc.</text></g>
                <g className="node float" opacity={0.72} data-tip="Predicted phone · unconfirmed · resolves next collector pass"><circle className="shape" cx="940" cy="150" r="11" fill="var(--phone)" strokeDasharray="3 3" /></g>
              </svg>
            </div>
            <div className="legend">
              <span><i style={{ background: "var(--person)" }} />Person</span>
              <span><i style={{ background: "var(--address)" }} />Address</span>
              <span><i style={{ background: "var(--phone)" }} />Phone / exposure</span>
              <span><i style={{ background: "var(--org)" }} />Organization</span>
              <span>— — predicted / unconfirmed</span>
              <span>⚑ within 1.2 mi of protected party</span>
            </div>
          </div>
        </section>

        <section id="risk">
          <div className="wrap">
            <div className="sec-head"><span className="eyebrow">Risk indicators</span><h2>What the system flags — and why.</h2></div>
            <div className="risks">
              <div className="rk critical">
                <span className="ico"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.6 1 14h14L8 1.6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M8 6.5v3.2M8 11.6v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></span>
                <div><h4>Residence within 1.2 mi of a protected party</h4><div className="src">source · property records + protective-order registry · confidence 0.88</div></div>
                <span className="sev critical">▲ Critical</span>
              </div>
              <div className="rk serious">
                <span className="ico"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="3" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M6 7h4M6 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></span>
                <div><h4>Active restraining order (2023, Nassau Co.)</h4><div className="src">source · court records · ex-parte, civil · confidence 0.93</div></div>
                <span className="sev serious">◆ Serious</span>
              </div>
              <div className="rk serious">
                <span className="ico"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 9l5-5 3 3 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                <div><h4>Prior misdemeanor — harassment (2019)</h4><div className="src">source · court records · plea · confidence 0.9</div></div>
                <span className="sev serious">◆ Serious</span>
              </div>
              <div className="rk warning">
                <span className="ico"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" /><path d="M8 5v3.4M8 10.6v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></span>
                <div><h4>Email &amp; phone in 7 known breaches</h4><div className="src">source · breach intelligence · incl. one stalking-forum mirror · confidence 0.82</div></div>
                <span className="sev warning">● Warning</span>
              </div>
            </div>
          </div>
        </section>

        <section id="records">
          <div className="wrap">
            <div className="sec-head"><span className="eyebrow">Records breakdown</span><h2>What was found, by type and over time.</h2></div>
            <div className="two">
              <div className="card pad">
                <p className="chart-title">Records by category (38 total)</p>
                <div className="bars">
                  <div className="bar"><span className="bl">Court</span><div className="track"><div className="fill" style={{ width: "100%" }} data-tip="Court: 9" /></div><span className="bv">9</span></div>
                  <div className="bar"><span className="bl">Address</span><div className="track"><div className="fill" style={{ width: "78%" }} data-tip="Address: 7" /></div><span className="bv">7</span></div>
                  <div className="bar"><span className="bl">Property</span><div className="track"><div className="fill" style={{ width: "67%" }} data-tip="Property: 6" /></div><span className="bv">6</span></div>
                  <div className="bar"><span className="bl">Corporate</span><div className="track"><div className="fill" style={{ width: "56%" }} data-tip="Corporate: 5" /></div><span className="bv">5</span></div>
                  <div className="bar"><span className="bl">Vehicle</span><div className="track"><div className="fill" style={{ width: "44%" }} data-tip="Vehicle: 4" /></div><span className="bv">4</span></div>
                  <div className="bar"><span className="bl">Breach</span><div className="track"><div className="fill" style={{ width: "78%", background: "var(--warn)" }} data-tip="Breach: 7" /></div><span className="bv">7</span></div>
                </div>
              </div>
              <div className="card pad">
                <p className="chart-title">Recorded activity by year</p>
                <div className="cols" role="img" aria-label="Activity by year, 2016 to 2026, peaking in 2022 and 2023">
                  <div className="col"><div className="cbar" style={{ height: "22%" }} data-tip="2016: 2" /><span className="cx">&apos;16</span></div>
                  <div className="col"><div className="cbar" style={{ height: "33%" }} data-tip="2017: 3" /><span className="cx">&apos;17</span></div>
                  <div className="col"><div className="cbar" style={{ height: "22%" }} data-tip="2018: 2" /><span className="cx">&apos;18</span></div>
                  <div className="col"><div className="cbar" style={{ height: "44%" }} data-tip="2019: 4" /><span className="cx">&apos;19</span></div>
                  <div className="col"><div className="cbar" style={{ height: "33%" }} data-tip="2020: 3" /><span className="cx">&apos;20</span></div>
                  <div className="col"><div className="cbar" style={{ height: "55%" }} data-tip="2021: 5" /><span className="cx">&apos;21</span></div>
                  <div className="col"><div className="cbar" style={{ height: "100%" }} data-tip="2022: 9" /><span className="cx">&apos;22</span></div>
                  <div className="col"><div className="cbar" style={{ height: "89%", background: "var(--serious)" }} data-tip="2023: 8 (incl. restraining order)" /><span className="cx">&apos;23</span></div>
                  <div className="col"><div className="cbar" style={{ height: "33%" }} data-tip="2024: 3" /><span className="cx">&apos;24</span></div>
                  <div className="col"><div className="cbar" style={{ height: "22%" }} data-tip="2025: 2" /><span className="cx">&apos;25</span></div>
                  <div className="col"><div className="cbar" style={{ height: "12%" }} data-tip="2026: 1" /><span className="cx">&apos;26</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="addresses">
          <div className="wrap">
            <div className="sec-head"><span className="eyebrow">Address history</span><h2>Where they&apos;ve been — and how close it gets.</h2></div>
            <div className="addr">
              <div className="map card" aria-label="Stylized map: four prior addresses, one within 1.2 miles of the protected party">
                <svg viewBox="0 0 400 296" role="img">
                  <g className="grid"><path d="M0 74h400M0 148h400M0 222h400M100 0v296M200 0v296M300 0v296" /></g>
                  <path className="road" d="M20 250 C 120 200, 160 120, 300 90" />
                  <path className="road" d="M60 40 C 120 120, 220 160, 380 210" />
                  <circle className="protected" cx="150" cy="120" r="52" />
                  <g><circle cx="300" cy="90" r="8" fill="var(--address)" stroke="var(--ground)" strokeWidth="2" /><text x="300" y="78" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--muted)">2021– Astoria</text></g>
                  <g><circle cx="150" cy="120" r="9" fill="var(--crit)" stroke="var(--ground)" strokeWidth="2" /><text x="150" y="146" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--crit)">1.2mi ⚑</text></g>
                  <g><circle cx="250" cy="210" r="7" fill="var(--address)" stroke="var(--ground)" strokeWidth="2" /><text x="250" y="228" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--muted)">2019 Corona</text></g>
                  <g><circle cx="70" cy="60" r="7" fill="var(--address)" stroke="var(--ground)" strokeWidth="2" /><text x="70" y="48" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--muted)">2016 LI City</text></g>
                  <g><rect x="132" y="102" width="4" height="4" fill="var(--crit)" /><text x="196" y="118" fontFamily="var(--mono)" fontSize="9" fill="var(--muted)">◎ protected party</text></g>
                </svg>
              </div>
              <div className="tline">
                <div className="ev"><span className="yr">2016</span><div><h4>Long Island City, NY</h4><p>First verified address · rental</p><div className="src">source · address records, property records</div></div></div>
                <div className="ev"><span className="yr">2019</span><div><h4>Corona, Queens NY</h4><p>Overlaps 2019 harassment plea</p><div className="src">source · address records + court</div></div></div>
                <div className="ev flag"><span className="yr">2021</span><div><h4>Astoria, NY — current</h4><p>Delivery route includes protected party&apos;s ZIP</p><div className="src">source · property records + employer route</div></div></div>
                <div className="ev flag"><span className="yr">2023</span><div><h4>⚑ Within 1.2 mi of protected party</h4><p>Flagged against active protective order</p><div className="src">source · protective-order registry</div></div></div>
              </div>
            </div>
          </div>
        </section>

        <section id="vehicles">
          <div className="wrap">
            <div className="sec-head"><span className="eyebrow">Vehicles</span><h2>Registered vehicles &amp; public sightings.</h2></div>
            <div className="vgrid">
              <div className="vcard flag">
                <div className="vi" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M3 15l2-6a3 3 0 0 1 3-2h10a3 3 0 0 1 3 2l2 6M3 15h20M4 15v4h3v-4M19 15v4h3v-4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="8" cy="18.5" r="1.6" fill="currentColor" /><circle cx="18" cy="18.5" r="1.6" fill="currentColor" /></svg></div>
                <div><h4>2022 Honda Civic</h4><div className="vm">NY · plate ••• 4821 · reg 2022–present</div><div className="vt">⚑ Registered to current address · 3 public sightings on a route through the protected party&apos;s ZIP</div></div>
              </div>
              <div className="vcard">
                <div className="vi" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M3 16l1-7a3 3 0 0 1 3-2h9l4 4v5M3 16h20M4 16v3h3v-3M19 16v3h3v-3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="8" cy="18.5" r="1.6" fill="currentColor" /><circle cx="18" cy="18.5" r="1.6" fill="currentColor" /></svg></div>
                <div><h4>2015 Ford Transit</h4><div className="vm">NY · plate ••• 9032 · commercial</div><div className="vt">Registered to Reyes Hauling LLC — linked via corporate filing</div></div>
              </div>
            </div>
          </div>
        </section>

        <section id="assets">
          <div className="wrap">
            <div className="sec-head"><span className="eyebrow">Business &amp; assets · public filings</span><h2>Entities, property and liens.</h2><p>Public and licensed filings only — corporate, property and UCC records. No credit data.</p></div>
            <div className="assets">
              <div className="card pad">
                <p className="chart-title">Filing footprint</p>
                <div className="bars">
                  <div className="bar"><span className="bl">LLC / DBA</span><div className="track"><div className="fill" style={{ width: "40%", background: "var(--org)" }} data-tip="Corporate filings: 2 (Reyes Hauling LLC + 1 DBA)" /></div><span className="bv">2</span></div>
                  <div className="bar"><span className="bl">Property</span><div className="track"><div className="fill" style={{ width: "20%", background: "var(--address)" }} data-tip="Property parcels: 1 (rental, no owned parcels)" /></div><span className="bv">1</span></div>
                  <div className="bar"><span className="bl">UCC liens</span><div className="track"><div className="fill" style={{ width: "20%", background: "var(--warn)" }} data-tip="UCC lien: 1 (equipment finance, 2022)" /></div><span className="bv">1</span></div>
                  <div className="bar"><span className="bl">Biz address</span><div className="track"><div className="fill" style={{ width: "40%", background: "var(--org)" }} data-tip="Business addresses: 2" /></div><span className="bv">2</span></div>
                </div>
              </div>
              <div className="card pad">
                <p className="chart-title">Entities &amp; encumbrances</p>
                <div className="alist">
                  <div className="al"><span className="n"><b>Reyes Hauling LLC</b> · formed 2022 · NY</span><span className="st">Active</span></div>
                  <div className="al"><span className="n">DBA “JAR Logistics” · 2023</span><span className="st">Active</span></div>
                  <div className="al"><span className="n">Equipment finance UCC-1 · 2022</span><span className="st lien">Lien</span></div>
                  <div className="al"><span className="n">Registered agent shares addr w/ subject</span><span className="st">Link</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="sources">
          <div className="wrap">
            <div className="sec-head"><span className="eyebrow">Sources &amp; chain of custody</span><h2>Every claim, cited. Every export, sealed.</h2><p>Methods are proprietary — but each finding traces to a source and a timestamp, and the package is signed and hashed.</p></div>
            <div className="sources">
              <div className="card pad">
                <p className="chart-title">Where the 38 records came from</p>
                <div className="srclist">
                  <div className="sr"><span className="n">Court &amp; protective-order records</span><span className="m">12 · 0.93</span></div>
                  <div className="sr"><span className="n">Property &amp; address (public + licensed)</span><span className="m">13 · 0.9</span></div>
                  <div className="sr"><span className="n">Corporate / business filings</span><span className="m">5 · 0.95</span></div>
                  <div className="sr"><span className="n">Vehicle &amp; DMV-derived</span><span className="m">4 · 0.86</span></div>
                  <div className="sr"><span className="n">Breach intelligence</span><span className="m">7 · 0.82</span></div>
                  <div className="sr"><span className="n">Purpose-built collectors</span><span className="m">proprietary</span></div>
                </div>
              </div>
              <div className="custody">
                <div className="row"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5 3 4v4.5c0 3.5 2.6 5.8 6 6.9 3.4-1.1 6-3.4 6-6.9V4L9 1.5Z" stroke="currentColor" strokeWidth="1.5" /><path d="m6.2 9 1.9 1.9L12 6.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg><span><b>Signed evidence package</b> — PDF report + ZIP of source artifacts + SHA-256 manifest, archived to the Wayback Machine in-session.</span></div>
                <div className="row"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 4h12M3 9h12M3 14h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg><span><b>Tamper-evident audit log</b> — every query recorded with a purpose attestation, reviewable by counsel or an adjudicator.</span></div>
                <div className="hash">manifest · sha256 3f9a1c7e…d42b · sealed 2026-09-18T14:22:07Z · operator purpose: clearance-vetting</div>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-band">
          <div className="wrap">
            <span className="eyebrow" style={{ justifyContent: "center" }}>This is one subject, in minutes</span>
            <h2>See a dossier built on your case.</h2>
            <p>A 20-minute walkthrough: from a single input to a connected, sourced, court-ready file.</p>
            <div className="cta"><a href="/site#book" className="btn btn-primary">Book a demo</a><a href="/site/screening" className="btn btn-ghost">See a live screen →</a></div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="brand"><svg className="mark" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2 3 6v6c0 5 3.8 8.4 9 10 5.2-1.6 9-5 9-10V6l-9-4Z" stroke="var(--primary)" strokeWidth="1.6" /></svg>Ghostline</div>
          <nav aria-label="Legal" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}><a href="/site/privacy">Privacy</a><a href="/site/terms">Terms</a></nav>
          <p className="legal">Design mockup · every name, record, address and score above is fictional sample data, not a real person or record. Collection and resolution methods are proprietary and not described here. GHOSTLINE™ — © 2026 Ghostline. Permissible-purpose research under applicable FCRA / DPPA / state PI law.</p>
        </div>
      </footer>
    </div>
  );
}
