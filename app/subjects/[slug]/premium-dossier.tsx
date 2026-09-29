"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DeepReport } from "@/components/deep-report";
import type { DeepModel } from "@/lib/deep-report";

/**
 * Deep Clearance — premium add-on.
 *
 * The standard dossier is the base deliverable; this deeper, adjudication-grade
 * analysis is the paid upgrade that maps to the marketing "Deep investigation" tier.
 * Fully structured (no markdown); unlocks locally in the demo. "See pricing" routes
 * to the marketing journeys.
 */
export function PremiumDossier({ deep }: { deep: DeepModel }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-8">
      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: "color-mix(in srgb, var(--p-lilac) 40%, transparent)",
          background: "color-mix(in srgb, var(--p-lilac) 8%, transparent)",
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles className="size-4" style={{ color: "var(--p-lilac)" }} aria-hidden />
          <h2 className="text-base font-semibold tracking-tight">Deep Clearance</h2>
          <span
            className="rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
            style={{ background: "color-mix(in srgb, var(--p-lilac) 18%, transparent)", color: "var(--p-lilac)" }}
          >
            Premium add-on
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/site#journeys">
                See pricing
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
            {!open ? (
              <Button size="sm" onClick={() => setOpen(true)}>
                Unlock preview (demo)
              </Button>
            ) : null}
          </div>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Identity surface, OCEAN psychometric profile, behavioral indices, an SF-86
          adjudication matrix, LE &amp; sanctions checks, a data-source coverage matrix
          (class + legal regime), and a public-signal inference taxonomy. Included in the
          Deep Investigation tier.
        </p>

        {open ? (
          <DeepReport model={deep} />
        ) : (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed bg-background/40 px-4 py-6 text-sm text-muted-foreground">
            <Lock className="size-4" aria-hidden />
            Locked — clearance-grade deep analysis. Unlock to preview.
          </div>
        )}
      </div>
    </section>
  );
}
