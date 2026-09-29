"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Network, UserRound } from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";

export interface CommandSubject {
  slug: string;
  label: string;
  claims: number;
}

/**
 * The front door.
 *
 * Prefix switches mode: `>` actions, otherwise subject search. The subject list is
 * passed in already serialised so filtering never round-trips.
 */
export function CommandBar({ subjects = [] }: { subjects?: CommandSubject[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  const mode = query.startsWith(">") ? "actions" : "subjects";

  // Strip the mode prefix before matching, so ">gr" doesn't try to match ">".
  const term = useMemo(
    () => (mode === "subjects" ? query : query.slice(1)).trim().toLowerCase(),
    [mode, query],
  );

  const matches = useMemo(() => {
    if (mode !== "subjects") return [];
    const pool = term
      ? subjects.filter(
          (s) => s.label.toLowerCase().includes(term) || s.slug.includes(term),
        )
      : subjects;
    return pool.slice(0, 12);
  }, [mode, term, subjects]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command bar"
      description="Search subjects, or use a prefix for other modes."
    >
      {/*
        shouldFilter={false}: the query carries a mode prefix (">") that cmdk's
        built-in matcher would try to match against item values and fail. Filtering
        is done here instead, after the prefix is stripped.
      */}
      <Command shouldFilter={false}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search subjects…  >actions"
      />
      <CommandList>
        <CommandEmpty>Nothing matches.</CommandEmpty>

        {mode === "subjects" && matches.length > 0 ? (
          <CommandGroup heading="Subjects">
            {matches.map((s) => (
              <CommandItem
                key={s.slug}
                value={s.slug}
                onSelect={() => go(`/subjects/${s.slug}`)}
              >
                <UserRound className="size-4" aria-hidden />
                <span className="flex-1 truncate">{s.label}</span>
                <span className="text-xs text-muted-foreground tnum">
                  {s.claims} files
                </span>
                <CommandShortcut>open</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {mode === "actions" ? (
          <CommandGroup heading="Actions">
            <CommandItem value="graph" onSelect={() => go("/graph")}>
              <Network className="size-4" aria-hidden />
              Open relationship graph
            </CommandItem>
          </CommandGroup>
        ) : null}
      </CommandList>
      </Command>
    </CommandDialog>
  );
}
