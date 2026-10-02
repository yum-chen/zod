import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type ViteUserConfig, defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Re-runs the schema package tests with global AOT compilation enabled. Catches
// any divergence between the compiled fast path and the runtime parser across
// the existing test corpus. Wired into the default `nub run test` run via the
// projects array in vitest.config.ts; can also be invoked directly via
// `nub run test:compile`.
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
    name: { label: "compile-mode", color: "magenta" },
    watch: false,
    isolate: true,
    silent: true,
    include: ["packages/schema/src/**/*.test.ts"],
    setupFiles: [resolve(__dirname, "scripts/fail-on-console.ts"), resolve(__dirname, "scripts/enable-compile.ts")],
    typecheck: { enabled: false },
  },
}) as ViteUserConfig;
