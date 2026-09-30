import type { ResidencySpan } from "@/lib/graph";

/**
 * Co-residency timeline (V3 signature).
 *
 * Overlap is literal: bars on a shared time axis, so two people at the same
 * address in the same window line up vertically. This is the thing the markdown
 * dossiers cannot express — "X and Y overlapped at this address from 2019 to
 * 2021" is currently something you reconstruct by reading two tables side by side.
 *
 * Server component: it is pure layout maths over data the page already has, so
 * there is no reason to ship it to the client.
 */
export function ResidencyTimeline({ spans }: { spans: ResidencySpan[] }) {
  const dated = spans.filter((s) => s.from !== null);
  if (dated.length === 0) {
    return (
      <p className="px-5 py-4 text-sm text-muted-foreground">
        No dated address windows in the current selection.
      </p>
    );
  }

  // The axis ends at the latest date the data itself reports, not at wall-clock
  // "now". Two reasons: rendering stays pure and deterministic (no Date.now()
  // during render), and the chart describes the pull rather than implying currency
  // it doesn't have — these records were last reported when they were last
  // reported, and a bar running to today would overstate that.
  const min = Math.min(...dated.map((s) => s.from!));
  const horizon = Math.max(...dated.map((s) => s.to ?? s.from!));
  const span = Math.max(1, horizon - min);

  // Group by person so each gets a lane.
  const lanes = new Map<string, { label: string; spans: ResidencySpan[] }>();
  for (const s of dated) {
    const lane = lanes.get(s.personId) ?? { label: s.personLabel, spans: [] };
    lane.spans.push(s);
    lanes.set(s.personId, lane);
  }

  // Addresses appearing under more than one person are the shared ones.
  const addrCount = new Map<string, Set<string>>();
  for (const s of dated) {
    const set = addrCount.get(s.addressId) ?? new Set<string>();
    set.add(s.personId);
    addrCount.set(s.addressId, set);
  }

  const year = (t: number) => new Date(t).getUTCFullYear();
  const ticks = 5;

  return (
    <section className="border-t" aria-label="Co-residency timeline">
      <h2 className="px-5 pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        Co-residency · {lanes.size} people · overlap means shared address
      </h2>

      <div className="max-h-[30vh] overflow-auto px-5 py-2">
        {[...lanes.entries()].map(([id, lane]) => (
          <div key={id} className="mb-1 grid grid-cols-[130px_minmax(0,1fr)] items-center gap-3">
            <span className="truncate text-right text-[11px]" title={lane.label}>
              {lane.label}
            </span>
            <div className="relative h-[18px] rounded bg-muted/50">
              {lane.spans.map((s, i) => {
                const from = s.from!;
                const to = s.to ?? horizon;
                const left = ((from - min) / span) * 100;
                const width = Math.max(1.2, ((to - from) / span) * 100);
                const shared = (addrCount.get(s.addressId)?.size ?? 0) > 1;
                return (
                  <div
                    key={`${s.addressId}-${i}`}
                    title={`${s.addressLabel} · ${year(from)}–${
                      s.to ? year(to) : "still reported"
                    }`}
                    /*
                      One hue, two states. The previous version painted white text on a
                      55%-transparent green and outlined the shared ones in the primary
                      accent — two competing hues plus text that lost contrast as the
                      fill faded. Now the state is carried by tint depth and border
                      weight within the address hue, and the label uses --foreground so
                      it stays legible in both themes.
                    */
                    className="absolute top-0 flex h-[18px] items-center overflow-hidden rounded-[3px] border px-1.5 text-[9px] font-medium text-foreground"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      background: shared
                        ? "color-mix(in srgb, var(--ent-address) 34%, var(--card))"
                        : "color-mix(in srgb, var(--ent-address) 15%, var(--card))",
                      borderColor: shared
                        ? "var(--ent-address)"
                        : "color-mix(in srgb, var(--ent-address) 38%, transparent)",
                      boxShadow: shared
                        ? "inset 2px 0 0 0 var(--ent-address)"
                        : undefined,
                    }}
                  >
                    <span className="truncate">{s.addressLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-3 pt-1">
          <span />
          <div className="flex justify-between font-mono text-[9px] text-muted-foreground">
            {Array.from({ length: ticks }, (_, i) => (
              <span key={i}>{year(min + (span / (ticks - 1)) * i)}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
