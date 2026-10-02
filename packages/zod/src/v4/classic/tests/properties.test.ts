import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";

test("Schema.properties is a check", () => {
  const s = Schema.object({ a: Schema.string(), b: Schema.string() }).check(Schema.properties({ a: Schema.literal("x"), b: Schema.literal("y") }));

  // asserts in place: extra keys pass, and every failing key reports
  expect(s.safeParse({ a: "x", b: "y", extra: 1 }).success).toBe(true);
  expect(s.safeParse({ a: "!", b: "!" }).error!.issues.map((i) => i.path)).toEqual([["a"], ["b"]]);

  // the base already typed the value, so the properties are asserted on whatever it produced — a string's length, as Schema  .property() does
  const long = Schema.string().check(Schema.properties({ length: Schema.number().min(3) }));
  expect(long.parse("abc")).toBe("abc");
  expect(long.safeParse("ab").error!.issues.map((i) => i.path)).toEqual([["length"]]);
  expect(
    z
      .compile(long)
      .safeParse("ab")
      .error!.issues.map((i) => i.path)
  ).toEqual([["length"]]);

  // not a schema
  // @ts-expect-error a check has no parse of its own
  Schema.properties({ a: Schema.string() }).parse;
});

test("Schema.properties discards transformed output", () => {
  // asserts and never writes back, exactly as Schema  .property() behaves; a nested object schema rebuilds its output even without transforms, so identity cannot distinguish the two
  const s = Schema.any().check(Schema.properties({ a: Schema.string().transform((s) => s.toUpperCase()) }));
  const input = { a: "hi" };
  expect(s.parse(input)).toBe(input);
  expect(input.a).toBe("hi");
});

test("Schema.instanceof().properties()", () => {
  const httpsUrl = Schema.instanceof(URL).properties({ protocol: Schema.literal("https:") });
  expectTypeOf<Schema.infer<typeof httpsUrl>>().toEqualTypeOf<URL & { protocol: "https:" }>();

  const u = new URL("https://example.com");
  expect(httpsUrl.parse(u)).toBe(u);
  expect(httpsUrl.safeParse(new URL("http://example.com")).error!.issues.map((i) => i.path)).toEqual([["protocol"]]);

  // chains, and each call narrows further
  const chained = httpsUrl.properties({ port: Schema.literal("") });
  expectTypeOf<Schema.infer<typeof chained>>().toEqualTypeOf<URL & { protocol: "https:" } & { port: "" }>();
  expect(chained.safeParse(u).success).toBe(true);
  expect(chained.safeParse(new URL("https://example.com:8443")).error!.issues.map((i) => i.path)).toEqual([["port"]]);

  // nothing is written back, so the narrowing is over the shape's input side
  const W = Schema.instanceof(URL).properties({ search: Schema.string().transform((s) => s.length) });
  expectTypeOf<Schema.infer<typeof W>>().toEqualTypeOf<URL & { search: string }>();
});

test("Schema.instanceof().properties() constrains the shape to the instance type", () => {
  const file = Schema.instanceof(File).properties({ name: Schema.string(), size: Schema.number().max(1024) });
  expectTypeOf<Schema.infer<typeof file>>().toEqualTypeOf<File & { name: string; size: number }>();

  // @ts-expect-error no such property on File
  Schema.instanceof(File).properties({ nmae: Schema.string() });

  // @ts-expect-error File["size"] is a number
  Schema.instanceof(File).properties({ size: Schema.string() });

  // methods are out of the shape, so an object literal's inherited toString can't collide with the constraint
  // @ts-expect-error
  Schema.instanceof(File).properties({ text: Schema.any() });

  // a literal still narrows a wider property
  const png = Schema.instanceof(File).properties({ type: Schema.literal("image/png") });
  expectTypeOf<Schema.infer<typeof png>>().toEqualTypeOf<File & { type: "image/png" }>();
});

test("Schema.properties spreads into .check()", () => {
  // the 4.5 array call sites: the check yields itself from Symbol.iterator
  const p = Schema.properties({ a: Schema.literal("x") });
  expect([...p]).toEqual([p]);

  const s = Schema.object({ a: Schema.string() }).check(...Schema.properties({ a: Schema.literal("x") }));
  expect(s.safeParse({ a: "x" }).success).toBe(true);
  expect(s.safeParse({ a: "!" }).error!.issues.map((i) => i.path)).toEqual([["a"]]);
});

test("Schema.properties compiles inside a container", () => {
  const outer = Schema.compile(Schema.object({ url: Schema.instanceof(URL).properties({ protocol: Schema.literal("https:") }) }));
  expect(outer.safeParse({ url: new URL("http://example.com") }).error!.issues.map((i) => i.path)).toEqual([
    ["url", "protocol"],
  ]);
});

test("Schema.properties async", async () => {
  const s = Schema.any().check(Schema.properties({ a: Schema.string().refine(async (s) => s.length > 1) }));
  const ok = { a: "hi" };
  await expect(s.parseAsync(ok)).resolves.toBe(ok);
  const bad = await s.safeParseAsync({ a: "!" });
  expect(bad.error!.issues.map((i) => i.path)).toEqual([["a"]]);
});

test("Schema.properties validates symbol keys", () => {
  const sym = Symbol("tag");
  const s = Schema.any().check(Schema.properties({ [sym]: Schema.string() }));
  expect(s.safeParse({ [sym]: "ok" }).success).toBe(true);
  expect(s.safeParse({ [sym]: 123 }).error!.issues.map((i) => i.path)).toEqual([[sym]]);
  expect(
    z
      .compile(s)
      .safeParse({ [sym]: 123 })
      .error!.issues.map((i) => i.path)
  ).toEqual([[sym]]);
});

test("Schema.properties compiled and interpreted agree on a nullish value", () => {
  // a base that permits null reaches the check with one; the compiled property read must not throw where the runtime reports an issue
  const s = Schema.any().check(...Schema.properties({ a: Schema.string() }));
  const expected = [["invalid_type", []]];
  expect(s.safeParse(null).error!.issues.map((i) => [i.code, i.path])).toEqual(expected);
  expect(
    z
      .compile(s)
      .safeParse(null)
      .error!.issues.map((i) => [i.code, i.path])
  ).toEqual(expected);
});

test("Schema.properties with a custom when refuses to compile", () => {
  // `when` is not publicly settable, since it gates the assertion inside the run loop. A hand-built def can still carry one, and compiling it must refuse rather than run the shape unconditionally: a union branch compiles to its own IIFE, so a wrong rejection is absorbed as a branch failure with no fallback.
  const p = new Schema.core.$SchemaCheckProperties({ check: "properties", shape: { a: Schema.literal("x") }, when: () => false });
  const s = Schema.union([Schema.any().check(p), Schema.object({ b: Schema.string() })]);
  const input = { a: "wrong", b: "hello" };
  expect(Schema.compile(s).safeParse(input)).toEqual(s.safeParse(input));
});

test("Schema.properties survives shape mutation", () => {
  // key and schema are snapshotted together; caching one and reading the other live paired a stale key with a missing schema
  const shape: Record<string, Schema.SchemaType> = { a: Schema.string() };
  const s = Schema.any().check(Schema.properties(shape));
  expect(s.safeParse({ a: "x" }).success).toBe(true);
  delete shape.a;
  expect(s.safeParse({ a: "x" }).success).toBe(true);
  shape.b = Schema.string();
  expect(s.safeParse({ a: "x" }).success).toBe(true);
});
