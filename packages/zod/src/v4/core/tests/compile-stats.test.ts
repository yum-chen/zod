import { expect, test } from "vitest";
import * as Schema from "../../index.js";

// Verifies that the compile-mode setup file is wired up correctly. Vitest's `isolate: true` resets module state per test file, so the counter only sees this file's compile attempts. We construct + parse a few schemas here to produce signal, then assert the post-processor saw them.
//
// When run under the default project (without the setup file), the counter is absent and the test self-skips.

interface CompileStats {
  attempts: number;
  successes: number;
  fallbacks: number;
}

test("compile-mode post-processor is installed and compiles supported schemas", () => {
  const stats = (globalThis as any).__schemaCompileStats as CompileStats | undefined;
  if (!stats) return; // Default project — compile mode disabled.

  const before = { ...stats };

  // Trigger compile via a handful of supported shapes
  const cases: Array<[Schema.SchemaType, unknown]> = [
    [Schema.string(), "hi"],
    [Schema.number(), 1],
    [Schema.object({ name: Schema.string() }), { name: "ok" }],
    [Schema.array(Schema.number()), [1, 2, 3]],
    [Schema.union([Schema.string(), Schema.number()]), "x"],
  ];
  for (const [schema, input] of cases) {
    Schema.safeParse(input);
  }

  expect(stats.attempts - before.attempts).toBeGreaterThanOrEqual(cases.length);
  expect(stats.successes - before.successes).toBeGreaterThanOrEqual(cases.length);
});
