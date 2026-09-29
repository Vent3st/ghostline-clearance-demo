import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Network, Users } from "lucide-react";

import "./globals.css";
import { getActiveCase } from "@/lib/case-store";
import { listSubjects } from "@/lib/dossier";
import { subjectRegistry } from "@/lib/identity";
import { CommandBar } from "@/components/command-bar";
import { StatusLine } from "@/components/status-line";
import { Toaster } from "@/components/ui/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// globals.css maps --font-sans / --font-geist-mono into the shadcn theme tokens.
const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ghostline Workbench",
  description: "Clearance-vetting workbench demo — fictional sample data only.",
};

const NAV = [
  { href: "/subjects", label: "Subjects", icon: Users },
  { href: "/graph", label: "Graph", icon: Network },
];

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const activeCase = await getActiveCase();

  // Subject names are PII. They only cross into the client bundle once a case is
  // open — a closed gate means the command bar has nothing to leak. Only the three
  // fields the palette actually renders are sent (server-serialization).
  let subjects: { slug: string; label: string; claims: number }[] = [];
  if (activeCase) {
    const [subs, reg] = await Promise.all([listSubjects(), subjectRegistry()]);
    subjects = subs.map((s) => {
      const id = reg.byRealSlug.get(s.slug)!;
      return {
        slug: id.aliasSlug, // navigate by alias slug, never the real slug
        label: `${id.alias.alias} "${id.alias.nick}" · ${id.alias.codename}`,
        claims: s.dossiers.length,
      };
    });
  }

  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <body className="flex h-screen flex-col overflow-hidden antialiased">
        <TooltipProvider delayDuration={300}>
          <div className="flex min-h-0 flex-1">
            <nav
              aria-label="Sections"
              className="flex w-12 flex-none flex-col items-center gap-1 border-r bg-card pt-2"
            >
              {NAV.map(({ href, label, icon: Icon }) => (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={href}
                      className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <Icon className="size-4" aria-hidden />
                      <span className="sr-only">{label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              ))}
            </nav>

            <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
          </div>

          <StatusLine activeCase={activeCase} />
          <CommandBar subjects={subjects} />
          <Toaster position="top-center" />
        </TooltipProvider>
      </body>
    </html>
  );
}
