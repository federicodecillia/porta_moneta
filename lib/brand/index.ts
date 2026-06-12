import { parseBrandConfig } from "./parse";

// NEXT_PUBLIC_* is inlined at build time in client bundles and read from
// process.env on the server; each client deploy is its own build, so both
// sides always agree.
export const brand = parseBrandConfig(process.env.NEXT_PUBLIC_BRAND_JSON);

export type { BrandConfig, BrandTheme } from "./types";
