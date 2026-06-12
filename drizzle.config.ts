import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Drizzle Kit runs outside the Next.js bundle, so it does not pick up
// .env.local automatically. Use Next.js's loader so the same env-file
// resolution rules apply (.env.local overrides .env, etc.).
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
