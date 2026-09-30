import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * The dossier data is read at request time from `process.cwd()/data/subjects`
   * (see `lib/paths.ts`). Turbopack cannot trace a path built at runtime, so
   * without this the serverless bundle ships without `data/` and every subject
   * route 404s in production while working locally.
   */
  outputFileTracingIncludes: {
    "/**": ["./data/**"],
  },
};

export default nextConfig;
