import type { LucideIcon } from "lucide-react";

export interface Stat {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  /** Small qualifier under the value — say what the number excludes. */
  note?: string;
}

/**
 * Key stats.
 *
 * One number per tile, its icon carrying the category so the row stays scannable
 * without reading every label. Values use tabular figures so the row does not
 * shift as counts change.
 */
export function StatTiles({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, color, note }) => (
        <div key={label} className="rounded-lg border bg-card px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <Icon className="size-3.5 flex-none" style={{ color }} aria-hidden />
            <span className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              {label}
            </span>
          </div>
          <p className="mt-1 text-2xl font-semibold tracking-tight tnum">{value}</p>
          {note ? (
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{note}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
