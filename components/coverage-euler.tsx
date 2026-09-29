import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Coverage as a proportional Euler diagram.
 *
 * The four sets are strictly nested — every graphable subject has raw pulls, every
 * subject with raw pulls has a dossier, every dossier belongs to a collected
 * subject — so this is drawn as true containment rather than the usual three
 * fudged overlapping circles. Nesting *is* the finding: analysable data is a small
 * core inside a much larger collected set.
 *
 * Areas are proportional (r ∝ √n), and the circles share a bottom tangent so every
 * band stays visible instead of hiding behind a concentric ring.
 *
 * If the sets ever stop nesting (a raw pull with no dossier, say), the caller
 * should fall back — this shape would then assert a containment that isn't true.
 */

export interface CoverageSet {
  label: string;
  count: number;
  color: string;
  hint: string;
}

const SIZE = 190;
const PAD = 6;

export function CoverageEuler({ sets }: { sets: CoverageSet[] }) {
  const total = sets[0]?.count ?? 0;
  if (total === 0) return null;

  const rMax = SIZE / 2 - PAD;
  const baseY = SIZE - PAD;

  const circles = sets.map((s) => {
    const r = rMax * Math.sqrt(Math.max(0, s.count) / total);
    return { ...s, r, cy: baseY - r, cx: SIZE / 2 };
  });

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={sets
          .map((s) => `${s.label}: ${s.count}`)
          .join("; ")
          .concat(". Each set contains the next.")}
        className="flex-none"
      >
        {circles.map((c) => (
          <circle
            key={c.label}
            cx={c.cx}
            cy={c.cy}
            r={c.r}
            fill={c.color}
            fillOpacity={0.2}
            stroke={c.color}
            strokeOpacity={0.9}
            strokeWidth={1.5}
          />
        ))}
      </svg>

      {/* Fixed measure: letting this flex to full width strands the counts far
          from their labels and the pairing stops reading. */}
      <dl className="w-full max-w-xs min-w-0 space-y-1.5">
        {sets.map((s, i) => {
          const prev = sets[i - 1];
          const lost = prev ? prev.count - s.count : 0;
          return (
            <div key={s.label} className="flex items-baseline gap-2.5">
              <span
                aria-hidden
                className="size-2.5 flex-none rounded-full"
                style={{ background: s.color }}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <dt className="cursor-help text-[13px] underline decoration-dotted underline-offset-4">
                    {s.label}
                  </dt>
                </TooltipTrigger>
                <TooltipContent side="right">{s.hint}</TooltipContent>
              </Tooltip>
              <dd className="ml-auto flex items-baseline gap-2 font-mono text-[12px] tnum">
                <span className="text-foreground">{s.count}</span>
                {prev ? (
                  <span className="text-muted-foreground">−{lost}</span>
                ) : (
                  <span className="text-muted-foreground">total</span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
