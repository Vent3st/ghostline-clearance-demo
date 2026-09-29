import Link from "next/link";
import { notFound } from "next/navigation";
import { Database, ShieldCheck, TriangleAlert } from "lucide-react";

import { getDossier, listRaw } from "@/lib/dossier";
import { requireCase } from "@/lib/gate";
import { identityForRealSlug, resolveToRealSlug } from "@/lib/identity";
import { applyRedactions, buildRedactor } from "@/lib/redact";
import { buildReportModel } from "@/lib/report";
import { buildDeepModel } from "@/lib/deep-report";
import { Button } from "@/components/ui/button";
import { ClearanceReport } from "@/components/clearance-report";
import { PremiumDossier } from "./premium-dossier";
import "@/app/site/site.css";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: seg } = await params;

  // The URL carries an alias slug (no real name); resolve it to the real slug the
  // data is stored under. Tolerates a real slug too.
  const realSlug = await resolveToRealSlug(seg);
  if (!realSlug) notFound();

  await requireCase("subject_view", realSlug);

  const [dossier, raw, identity, redactor, report] = await Promise.all([
    getDossier(realSlug),
    listRaw(realSlug),
    identityForRealSlug(realSlug),
    buildRedactor(realSlug),
    buildReportModel(realSlug),
  ]);

  if (!dossier && !raw) notFound();

  const fm = dossier?.frontmatter;
  const ali = identity.alias;

  // Deep (premium) analysis is fully structured — no markdown anywhere on the page.
  const deepModel = report ? await buildDeepModel(realSlug) : null;
  const criticalFlag =
    typeof fm?.critical_flag === "string" ? applyRedactions(fm.critical_flag, redactor) : null;

  return (
    <div className="flex h-full flex-col">
      <header className="flex-none border-b bg-card/40 px-6 py-4">
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden />
          Clearance dossier · consented vetting
        </p>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {ali.alias}{" "}
            <span className="font-normal text-muted-foreground">&ldquo;{ali.nick}&rdquo;</span>
          </h1>
          {fm?.age ? (
            <span className="font-mono text-[11px] text-muted-foreground">age {fm.age}</span>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            {fm?.classification ? (
              <span className="rounded-full border border-warn/40 bg-warn/10 px-2.5 py-0.5 font-mono text-[10px] text-warn">
                {String(fm.classification)}
              </span>
            ) : null}
            {raw && raw.length > 0 ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/subjects/${identity.aliasSlug}/raw`}>
                  <Database className="size-3.5" aria-hidden />
                  Raw ({raw.length})
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        <p className="mt-1 font-mono text-[11px] text-muted-foreground">{ali.codename}</p>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        {criticalFlag ? (
          <div className="mx-auto max-w-4xl px-6 pt-6">
            <div className="flex gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <TriangleAlert className="mt-0.5 size-4 flex-none text-destructive" aria-hidden />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-destructive">Critical flag</p>
                <p className="mt-1 text-sm">{criticalFlag}</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Primary view: the structured clearance report (marketing /clearance format). */}
        {report ? (
          <ClearanceReport model={report} graphHref={`/graph?focus=${identity.aliasSlug}`} />
        ) : (
          <div className="mx-auto max-w-4xl px-6 py-6">
            <div className="rounded-lg border border-warn/40 bg-warn/10 p-4">
              <p className="text-sm font-medium text-warn">No structured data yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This subject has no raw pull to build a report from — a gap in collection, not a finding.
              </p>
            </div>
          </div>
        )}

        {deepModel ? (
          <div className="mx-auto max-w-[1160px] px-6 pb-10">
            <PremiumDossier deep={deepModel} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
