# Ghostline — Clearance-Vetting Workbench (Demo)

**Live demo → https://ghostline-clearance-demo.vercel.app**

No login, no signup, no API keys. Land on the page, click **Launch demo →**, and you are in
the clearance queue.

A front-end demo of **Ghostline**: screen a visitor against watchlists in seconds,
then escalate the same subject into a sourced, connection-mapped, confidence-scored
clearance dossier. One platform, two depths.

> **This is a demonstration built for review.** Every subject, name, address, phone,
> score, and record is **fictional sample data**, generated for illustration. It is
> not a background check or a consumer report, and it is not FCRA/DPPA/ICRAA-compliant.
> The production system's data sources and collection/resolution methods are **not**
> in this repository.

## The 60-second path through it

1. **https://ghostline-clearance-demo.vercel.app** — the marketing landing page. `/` redirects here.
2. Click **Launch demo →** (top-right, or in the hero) — no gate, no form.
3. **`/subjects`** — the clearance queue, 12 subjects under deterministic pseudonyms.
4. Open **Marcus "Cash" Reyes** — the sourced dossier: confidence gauge, critical-adjacency map,
   relatives at High/Medium/Low likelihood, chain-of-custody panel.
5. **Unlock Deep Clearance** on that page — OCEAN profile, SF-86 adjudicator matrix, sanctions
   checks, source-class coverage matrix.
6. **`/graph`** — the relationship graph across all subjects.

## What to look at

- **`/site`** — the marketing landing page (two journeys: live screening + deep clearance),
  with sample screening and dossier pages at `/site/screening` and `/site/clearance`.
- **`/subjects`** — the workbench queue. Every subject is shown under a deterministic
  pseudonym. Open one for a full clearance report.
- **A subject page** (`/subjects/<alias>`) renders, from bundled sample data:
  - identity resolution + confidence gauge,
  - a **critical-adjacency map** (utilities / government / military / HQs / institutions
    near the subject's cities),
  - a **connection graph** (click through to the full interactive graph for that subject),
  - address history, relatives & associates (High/Medium/Low likelihood), licensing,
    and a sources / chain-of-custody panel,
  - a **Deep Clearance** premium panel — OCEAN psychometric profile, behavioral indices,
    an SF-86 adjudicator matrix, LE & sanctions checks, a data-source coverage matrix
    (by generic source **class** and legal regime), and a public-signal inference taxonomy.
- **`/graph`** — the relationship graph across all subjects; `?focus=<alias>` zooms to one.

## Design notes

- **Pseudonymization is structural.** Display names come from a deterministic alias hash
  of the subject slug, so what you see is decoupled from the underlying record. URLs use
  alias slugs, never a real name.
- **Data-driven.** The report, deep dossier, adjacency map, and graph are all built from
  each subject's sample record under `data/subjects/<slug>/`.
- **Source classes only.** The deep dossier names *kinds* of records (court dockets,
  property, sanctions screening, …) and their legal regime — never a commercial provider,
  and never a collection method.

## Run it

No API keys or environment variables required.

```bash
npm ci          # lockfile is committed; `npm install` works too
npm run dev
# open http://localhost:3000
```

For a production build (what the live demo serves):

```bash
npm run build && npm run start
```

Stack: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Radix/shadcn.

## License

Proprietary — see [LICENSE](./LICENSE). Published for evaluation only; fictional data only.
