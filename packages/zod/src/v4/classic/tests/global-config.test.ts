import { afterEach, expect, test } from "vitest";
import * as Schema from "schema/v4";
import * as core from "schema/v4/core";

// `globalConfig` is attached to `globalThis.__schema_globalConfig` so that a
// single config object is shared across CJS/ESM builds and across multiple
// bundled copies of Schema in a monorepo. This mirrors the existing
// `globalRegistry` -> `globalThis.__schema_globalRegistry` treatment.
//
// See #5789 for the footgun this fixes: users with both CJS and ESM instances of Schema loaded had to call `Schema.config({ jitless: true })` twice — once per instance — because each module-scope `globalConfig` was a different object. With this change, one call updates state seen by every loaded copy.

afterEach(() => {
  // Don't leak config mutations into other test files.
  delete core.globalConfig.jitless;
});

test("globalConfig is singleton and attached to globalThis", () => {
  expect(core.globalConfig).toBe((globalThis as any).__schema_globalConfig);
});

test("Schema.config writes are observed via globalThis.__schema_globalConfig", () => {
  Schema.config({ jitless: true });
  expect((globalThis as any).__schema_globalConfig.jitless).toBe(true);
});

test("pre-set globalThis.__schema_globalConfig is preserved on import", () => {
  // Object identity is preserved across reloads of the module: anyone who pre-populates `globalThis.__schema_globalConfig` before Schema loads (e.g. an inline script before the bundle) keeps that exact object as the source of truth. Mutating it directly is equivalent to Schema.config().
  const direct = (globalThis as any).__schema_globalConfig;
  direct.jitless = true;
  expect(core.globalConfig.jitless).toBe(true);
  expect(Schema.config()).toBe(core.globalConfig);
});
