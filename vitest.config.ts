import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type ViteUserConfig, defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    conditions: ["@schema/source", "default"],
    externalConditions: ["@schema/source", "default"],
  },
  ssr: {
    resolve: {
      conditions: ["@schema/source", "default"],
      externalConditions: ["@schema/source", "default"],
    },
  },
  test: {
    projects: ["packages/*", "./vitest.compile.config.ts"],
    watch: false,
    isolate: true,
    setupFiles: [resolve(__dirname, "scripts/fail-on-console.ts")],
    typecheck: {
      include: ["**/*.test.ts"],
      enabled: true,
      ignoreSourceErrors: false,
      checker: "tsc",
      tsconfig: "./tsconfig.json",
    },
    silent: true,
  },
}) as ViteUserConfig;
