import type { Metadata } from "next";

import "./site.css";
import { SiteTooltips } from "./site-tooltips";

export const metadata: Metadata = {
  title: "Ghostline — Screening & Clearance-Grade Vetting",
  description:
    "Screen a visitor against your watchlists in seconds, and escalate the same subject into a sourced, connection-mapped investigation. One platform, two depths.",
};

// Marketing pages render full-bleed, escaping the product chrome from the root
// layout (which fixes body to h-screen). .gl-site-root is a fixed, scrollable
// overlay; each page supplies its own scope class (.gl-site landing / .gl-report
// reports). See site.css.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="gl-site-root">
      {children}
      <SiteTooltips />
    </div>
  );
}
