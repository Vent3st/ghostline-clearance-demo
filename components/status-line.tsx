import { CircleCheck } from "lucide-react";

import type { ActiveCase } from "@/lib/types";

/**
 * Persistent status line, borrowed from tmux/vim because the audience already
 * reads that idiom. In this public demo it states plainly that the data is
 * fictional sample data.
 */
export function StatusLine({ activeCase: _activeCase }: { activeCase: ActiveCase | null }) {
  return (
    <footer className="flex flex-none flex-wrap items-center gap-x-5 gap-y-1 border-t bg-card px-3 py-1 font-mono text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <CircleCheck className="size-3 text-good" aria-hidden />
        DEMO <span className="text-foreground">fictional sample data</span>
      </span>
      <span>clearance-vetting workbench</span>
      <span className="ml-auto">⌘K command</span>
    </footer>
  );
}
