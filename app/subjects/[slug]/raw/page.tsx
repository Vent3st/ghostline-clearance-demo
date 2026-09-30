import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleX } from "lucide-react";

import { listRaw, readRaw } from "@/lib/dossier";
import { requireCase } from "@/lib/gate";
import { identityForRealSlug, resolveToRealSlug } from "@/lib/identity";
import { applyRedactions, buildRedactor } from "@/lib/redact";
import { Badge } from "@/components/ui/badge";

function fmtSize(n: number) {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} kB`;
}

export default async function RawPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ file?: string }>;
}) {
  const [{ slug: seg }, { file }] = await Promise.all([params, searchParams]);

  const realSlug = await resolveToRealSlug(seg);
  if (!realSlug) notFound();

  await requireCase(file ? "raw_view" : "raw_index", realSlug, file ? { file } : undefined);

  const [entries, identity, redactor] = await Promise.all([
    listRaw(realSlug),
    identityForRealSlug(realSlug),
    buildRedactor(realSlug),
  ]);
  if (!entries) notFound();

  // readRaw re-checks the requested path against this subject's own listing, so a
  // crafted ?file= cannot reach outside the subject's raw directory.
  const content = file ? await readRaw(realSlug, file) : null;
  // Pseudonymize the raw payload for display too, so no surface leaks the real name.
  const shown = content ? applyRedactions(content, redactor) : null;

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-none flex-wrap items-baseline gap-x-3 border-b px-5 py-3">
        <Link
          href={`/subjects/${identity.aliasSlug}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          ← {identity.alias.alias}
        </Link>
        <h1 className="font-mono text-[11px] text-muted-foreground">
          raw pulls · {entries.length} files
        </h1>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]">
        <ul className="min-h-0 overflow-auto border-b md:border-r md:border-b-0">
          {entries.map((e) => {
            const active = e.rel === file;
            // Every subject carries one JSON envelope, and its filename is an internal
            // convention rather than anything a reviewer needs. Label it for what it is
            // and keep the real name in the tooltip. A subject with several JSON files
            // keeps the filename, so the rows stay distinguishable.
            const jsonCount = entries.filter((x) => x.rel.endsWith(".json")).length;
            const label =
              e.rel.endsWith(".json") && jsonCount === 1 ? "Raw JSON" : e.rel;
            return (
              <li key={e.rel} className="cv-auto">
                <Link
                  href={`/subjects/${identity.aliasSlug}/raw?file=${encodeURIComponent(e.rel)}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 border-b px-4 py-2 font-mono text-[11px] transition-colors hover:bg-accent ${
                    active ? "bg-accent text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate" title={e.rel}>
                    {label}
                  </span>
                  {e.isError ? (
                    <Badge
                      variant="outline"
                      className="gap-1 border-destructive/50 text-[9px] text-destructive"
                    >
                      <CircleX className="size-2.5" aria-hidden />
                      error
                    </Badge>
                  ) : null}
                  <span className="tnum flex-none">{fmtSize(e.size)}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="min-h-0 overflow-auto p-4">
          {shown ? (
            <pre className="rounded-lg border bg-card p-3 font-mono text-[11px] leading-relaxed">
              {shown}
            </pre>
          ) : (
            <p className="p-4 text-sm text-muted-foreground">
              Select a file to view its contents.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
