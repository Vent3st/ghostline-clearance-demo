import { Info } from "lucide-react";

import { buildGraph } from "@/lib/graph";
import { listSubjects } from "@/lib/dossier";
import { layoutGraph } from "@/lib/layout-graph";
import { requireCase } from "@/lib/gate";
import { aliasForName, aliasForSlug, resolveToRealSlug, slugifyName, subjectRegistry } from "@/lib/identity";
import { GraphCanvas } from "@/components/graph-canvas";
import { ResidencyTimeline } from "@/components/residency-timeline";

export const metadata = { title: "Graph — Ghostline Workbench" };

export default async function GraphPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  await requireCase("subject_index", "graph");

  // ?focus=<alias slug> expands that subject's full neighborhood (from a dossier link).
  const { focus } = await searchParams;
  const focusReal = focus ? await resolveToRealSlug(focus) : null;

  const [graph, subjects, reg] = await Promise.all([
    buildGraph(focusReal ?? undefined, Boolean(focusReal)),
    listSubjects(),
    subjectRegistry(),
  ]);
  const focusName = focusReal ? reg.byRealSlug.get(focusReal)?.alias.alias ?? null : null;

  // Alias any slug — including raw-only subjects (e.g. a "_raw"-only dir) that have
  // no dossier entry and so aren't in the registry. aliasForSlug is deterministic
  // for any slug, so nothing serialized to the client carries a real name.
  const aslug = (slug: string) =>
    reg.byRealSlug.get(slug)?.aliasSlug ?? slugifyName(aliasForSlug(slug).alias);
  // Node/edge ids that embed a slug take the "p:slug:<slug>" form; rewrite just that.
  const scrubId = (id: string) =>
    id.startsWith("p:slug:") ? `p:slug:${aslug(id.slice("p:slug:".length))}` : id;

  // Pseudonymize person labels (subjects + relatives resolve to the same alias used
  // everywhere else, so the graph stays logically connected); addresses/phones kept.
  const nodes = await Promise.all(
    graph.nodes.map(async (n) => ({
      ...n,
      id: scrubId(n.id),
      label: n.kind === "person" ? (await aliasForName(n.label)).alias : n.label,
      anchorSlug: n.anchorSlug ? aslug(n.anchorSlug) : n.anchorSlug,
      subjects: n.subjects.map(aslug),
    })),
  );
  const edges = graph.edges.map((e) => ({ ...e, source: scrubId(e.source), target: scrubId(e.target) }));
  const residency = await Promise.all(
    graph.residency.map(async (r) => ({
      ...r,
      personId: scrubId(r.personId),
      personLabel: (await aliasForName(r.personLabel)).alias,
    })),
  );
  const placed = layoutGraph(nodes, edges);

  const aliasName = (slug: string) => reg.byRealSlug.get(slug)?.alias.alias ?? aliasForSlug(slug).alias;
  const missing = subjects
    .map((s) => s.slug)
    .filter((s) => !graph.covered.includes(s))
    .map(aliasName);

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-none flex-wrap items-baseline gap-x-4 gap-y-1 border-b px-5 py-3">
        <h1 className="text-sm font-semibold">
          Relationship graph
          {focusName ? <span className="ml-2 font-normal text-muted-foreground">· focused on {focusName}</span> : null}
        </h1>
        <p className="font-mono text-[11px] text-muted-foreground">
          {graph.covered.length} subjects · {placed.length} entities ·{" "}
          {graph.edges.length} links
        </p>
      </header>

      {/*
        Coverage is stated up front, not hidden. A subject absent from this graph
        has no raw pull on disk — that is a gap in collection, not a finding that
        the person has no relationships. Leaving it unsaid would let the canvas
        imply a negative conclusion it has not earned.
      */}
      {missing.length > 0 || graph.rawButUnusable.length > 0 ? (
        <div className="flex flex-none gap-2.5 border-b bg-muted/40 px-5 py-2">
          <Info className="mt-0.5 size-3.5 flex-none text-muted-foreground" aria-hidden />
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Built from raw pulls, which exist for{" "}
            <strong className="text-foreground">
              {graph.covered.length} of {subjects.length}
            </strong>{" "}
            subjects.{" "}
            {missing.length > 0 ? (
              <>
                Absent from this view:{" "}
                <span className="font-mono">{missing.slice(0, 6).join(", ")}</span>
                {missing.length > 6 ? ` +${missing.length - 6} more` : ""}.{" "}
              </>
            ) : null}
            {graph.rawButUnusable.length > 0 ? (
              <>
                Returned no person records:{" "}
                <span className="font-mono">{graph.rawButUnusable.map(aliasName).join(", ")}</span>.{" "}
              </>
            ) : null}
            Missing here means <em>not collected</em>, not <em>no relationships</em>.
          </p>
        </div>
      ) : null}

      {placed.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          No raw pulls available to build a graph from.
        </p>
      ) : (
        <>
          <GraphCanvas nodes={placed} edges={edges} focused={Boolean(focusReal)} />
          <ResidencyTimeline spans={residency} />
        </>
      )}
    </div>
  );
}
