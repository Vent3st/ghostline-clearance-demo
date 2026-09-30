import Link from "next/link";
import {
  ArrowRight,
  Database,
  FileText,
  FolderOpen,
  Network,
  ShieldCheck,
  Share2,
} from "lucide-react";

import { listSubjects } from "@/lib/dossier";
import { buildGraph } from "@/lib/graph";
import { requireCase } from "@/lib/gate";
import { aliasForSlug, slugifyName, subjectRegistry } from "@/lib/identity";
import { StatTiles } from "@/components/stat-tiles";

export const metadata = { title: "Subjects — Ghostline Workbench" };

export default async function SubjectsPage() {
  await requireCase("subject_index", null);

  const [subjects, graph, reg] = await Promise.all([
    listSubjects(),
    buildGraph(),
    subjectRegistry(),
  ]);
  const graphable = new Set(graph.covered);

  const rows = subjects
    .map((s) => {
      // Registry is built from the same listSubjects(), so this is normally present;
      // fall back to a computed identity rather than crashing if the lists diverge.
      const identity =
        reg.byRealSlug.get(s.slug) ??
        (() => {
          const alias = aliasForSlug(s.slug);
          return { realSlug: s.slug, name: s.slug, alias, aliasSlug: slugifyName(alias.alias) };
        })();
      return {
        ...s,
        id: identity.alias,
        aliasSlug: identity.aliasSlug,
        inGraph: graphable.has(s.slug),
        hasDossier: Boolean(s.latest),
      };
    })
    // Demo (fictional) subjects lead; then by pseudonym for a stable order.
    .sort((a, b) => {
      if (a.id.isDemo !== b.id.isDemo) return a.id.isDemo ? -1 : 1;
      return a.id.alias.localeCompare(b.id.alias);
    });

  const nDossier = rows.filter((r) => r.hasDossier).length;
  const nRaw = rows.filter((r) => r.hasRaw).length;
  const nGraph = rows.filter((r) => r.inGraph).length;

  return (
    <div className="flex h-full flex-col">
      <header className="flex-none border-b px-6 py-5">
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden />
          Clearance workbench · consented vetting
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Clearance queue</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Every subject is shown under a pseudonym. Open one to escalate into a
          sourced, confidence-scored clearance dossier.
        </p>

        <div className="mt-4">
          <StatTiles
            stats={[
              { label: "Subjects", value: rows.length, icon: FolderOpen, color: "var(--p-sand)" },
              { label: "Dossiers", value: nDossier, icon: FileText, color: "var(--p-sky)" },
              { label: "Raw pulls", value: nRaw, icon: Database, color: "var(--p-mint)" },
              { label: "In graph", value: nGraph, icon: Network, color: "var(--p-lilac)" },
            ]}
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <Link
              key={r.slug}
              href={`/subjects/${r.aliasSlug}`}
              className="group cv-auto flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-foreground/25 hover:bg-accent/40"
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="grid size-10 flex-none place-items-center rounded-lg font-mono text-sm font-semibold"
                  style={{
                    background: `color-mix(in srgb, ${r.id.accent} 20%, transparent)`,
                    color: r.id.accent,
                  }}
                >
                  {r.id.initials}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold tracking-tight">
                    {r.id.alias}{" "}
                    <span className="font-normal text-muted-foreground">
                      &ldquo;{r.id.nick}&rdquo;
                    </span>
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {r.id.codename}
                    {(r.latest?.date ?? r.pulled) ? ` · pulled ${r.latest?.date ?? r.pulled}` : " · undated"}
                    {r.id.isDemo ? " · demo" : ""}
                  </p>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-1">
                  {r.hasDossier ? (
                    <Chip icon={FileText} label="dossier" color="var(--p-sky)" />
                  ) : null}
                  {r.hasRaw ? (
                    <Chip icon={Database} label="raw" color="var(--p-mint)" />
                  ) : null}
                  {r.inGraph ? (
                    <Chip icon={Share2} label="graph" color="var(--p-lilac)" />
                  ) : null}
                  {!r.hasDossier && !r.hasRaw ? (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      directory only
                    </span>
                  ) : null}
                </div>
                <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                  Open clearance
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Chip({
  icon: Icon,
  label,
  color,
}: {
  icon: typeof FileText;
  label: string;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px]"
      style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
    >
      <Icon className="size-2.5" aria-hidden />
      {label}
    </span>
  );
}
