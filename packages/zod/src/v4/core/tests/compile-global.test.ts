// Tests the `schema/compile` subpath module — the user-facing API for enabling global AOT compilation. Importing this file (or running it under compile-mode where the setup file already imported `schema/compile`) installs the post-processor for the duration of this vitest worker. Vitest's `isolate: true` puts each test file in its own worker, so the install doesn't leak to other files.

import { expect, test } from "vitest";
import "schema/compile";
import * as Schema from "schema/v4";
import * as core from "schema/v4/core";

test("schema/compile sets globalConfig.postProcessor", () => {
  expect(typeof core.globalConfig.postProcessor).toBe("function");
});

test("Schema.compile is exported from the public namespace", () => {
  expect(typeof Schema.compile).toBe("function");
  const schema = Schema.compile(Schema.object({ name: Schema.string() }));
  expect(Schema.parse({ name: "ok" })).toEqual({ name: "ok" });
});

test("schemas constructed after import are compiled on first parse", () => {
  const schema = Schema.object({ name: Schema.string(), age: Schema.number() });

  // First parse: shim fires, compiles, replaces self.
  const r1 = Schema.safeParse({ name: "ok", age: 1 });
  expect(r1.success).toBe(true);

  // Second parse: directly through compiled wrapper.
  const r2 = Schema.safeParse({ name: "ok", age: 2 });
  expect(r2.success).toBe(true);

  const bad = Schema.safeParse({ name: 1, age: "x" });
  expect(bad.success).toBe(false);
});

test("user callbacks run at most twice on invalid input", () => {
  let refines = 0;
  const schema = Schema.object({
    a: Schema.string().refine((v) => {
      refines++;
      return v.length > 1;
    }),
  });
  Schema.safeParse({ a: "ok" }); // trigger lazy compile

  refines = 0;
  expect(Schema.safeParse({ a: "x" }).success).toBe(false);
  expect(refines).toBe(2);

  refines = 0;
  expect(() => Schema.parse({ a: "x" })).toThrow();
  expect(refines).toBe(2);

  // Explicit Schema.compile of a shim-managed schema keeps the same contract.
  const compiled = Schema.compile(schema);
  refines = 0;
  expect(compiled.safeParse({ a: "x" }).success).toBe(false);
  expect(refines).toBe(2);
});

test("global mode respects the jitless config", () => {
  core.config({ jitless: true });
  try {
    const schema = Schema.object({ a: Schema.string() });
    expect(Schema.safeParse({ a: "x" }).success).toBe(true);
    // The shim restored the runtime parser instead of compiling: a compiled wrapper carries __originalRun, the bare runtime does not.
    expect((Schema._schema.run as { __originalRun?: unknown }).__originalRun).toBeUndefined();
  } finally {
    core.config({ jitless: undefined });
  }
});

test("schemas with unsupported features fall back without crashing", () => {
  const schema = Schema.string().refine(async () => true);
  // First call attempts compile, falls back. Subsequent calls use runtime. Sync parse of an async-refined schema is its own runtime concern; we only care that the post-processor doesn't crash with a compile error.
  expect(() => Schema.safeParse("ok")).not.toThrow(/SchemaCompile/);
});

test("global mode installs the validator validate reads", () => {
  const schema = Schema.looseObject({ name: Schema.string() });
  Schema.parse({ name: "ok", extra: 1 }); // shim fires and compiles

  // Without this the shim leaves no validator behind, validate misses its fast path and answers from the runtime parser instead. Correct, so nothing else in the suite notices, and several times slower.
  const bag = Schema._schema.bag as { validator?: (input: unknown) => unknown };
  expect(typeof bag.validator).toBe("function");

  // a verdict rather than a rebuilt object, so this is the assert-mode codegen and not the parser
  expect(bag.validator!({ name: "ok", extra: 1 })).toBe(true);

  expect(Schema.validate(schema, { name: "ok", extra: 1 })).toBe(true);
  expect(Schema.validate(schema, { name: 1 })).toBe(false);
});
