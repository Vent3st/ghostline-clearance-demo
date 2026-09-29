"use client";

import { useEffect, useState } from "react";

// Global hover tooltips for any element with a [data-tip] attribute (charts, graph
// nodes, bars). Self-contained styles so it works regardless of page scope.
export function SiteTooltips() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const hit = (t: EventTarget | null) =>
      t instanceof Element ? t.closest("[data-tip]") : null;
    function over(e: MouseEvent) {
      const el = hit(e.target);
      if (!el) return;
      setTip({ text: el.getAttribute("data-tip") || "", x: e.clientX, y: e.clientY });
    }
    function move(e: MouseEvent) {
      setTip((p) => (p ? { ...p, x: e.clientX, y: e.clientY } : p));
    }
    function out(e: MouseEvent) {
      if (hit(e.target)) setTip(null);
    }
    document.addEventListener("mouseover", over);
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseout", out);
    return () => {
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseout", out);
    };
  }, []);

  if (!tip) return null;
  const vw = typeof window !== "undefined" ? window.innerWidth : 9999;
  return (
    <div
      role="tooltip"
      style={{
        position: "fixed",
        left: Math.min(tip.x + 14, vw - 250),
        top: tip.y + 16,
        pointerEvents: "none",
        zIndex: 100,
        background: "var(--panel)",
        border: "1px solid var(--hairline)",
        borderRadius: 8,
        padding: "7px 10px",
        fontFamily: "var(--mono)",
        fontSize: 11,
        color: "var(--ink)",
        boxShadow: "var(--shadow)",
        maxWidth: 240,
      }}
    >
      {tip.text}
    </div>
  );
}
