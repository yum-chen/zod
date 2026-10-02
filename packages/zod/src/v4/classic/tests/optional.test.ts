// @ts-ignore TS6133
import { expect, expectTypeOf, test } from "vitest";

import * as Schema from "schema/v4";

test(".optional()", () => {
  const schema = Schema.string().optional();
  expect(Schema.parse("adsf")).toEqual("adsf");
  expect(Schema.parse(undefined)).toEqual(undefined);
  expect(Schema.safeParse(null).success).toEqual(false);

  expectTypeOf<typeof Schema._output>().toEqualTypeOf<string | undefined>();
});

test("unwrap", () => {
  const unwrapped = Schema.string().optional().unwrap();
  expect(unwrapped).toBeInstanceOf(Schema.SchemaString);
});

test("optionality", () => {
  const a = Schema.string();
  expect(a._schema.optin).toEqual(undefined);
  expect(a._schema.optout).toEqual(undefined);

  const b = Schema.string().optional();
  expect(b._schema.optin).toEqual("optional");
  expect(b._schema.optout).toEqual("optional");

  const c = Schema.string().default("asdf");
  expect(c._schema.optin).toEqual("defaulted");
  expect(c._schema.optout).toEqual(undefined);

  const d = Schema.string().optional().nullable();
  expect(d._schema.optin).toEqual("optional");
  expect(d._schema.optout).toEqual("optional");

  const e = Schema.string().default("asdf").nullable();
  expect(e._schema.optin).toEqual("defaulted");
  expect(e._schema.optout).toEqual(undefined);

  // Schema.undefined should NOT be optional
  const f = Schema.undefined();
  expect(f._schema.optin).toEqual(undefined);
  expect(f._schema.optout).toEqual(undefined);
  expectTypeOf<typeof f._schema.optin>().toEqualTypeOf<"optional" | "defaulted" | undefined>();
  expectTypeOf<typeof f._schema.optout>().toEqualTypeOf<"optional" | undefined>();

  // Schema.union should be optional if any of the types are optional
  const g = Schema.union([Schema.string(), Schema.undefined()]);
  expect(g._schema.optin).toEqual(undefined);
  expect(g._schema.optout).toEqual(undefined);
  expectTypeOf<typeof g._schema.optin>().toEqualTypeOf<"optional" | "defaulted" | undefined>();
  expectTypeOf<typeof g._schema.optout>().toEqualTypeOf<"optional" | undefined>();

  const h = Schema.union([Schema.string(), Schema.optional(Schema.string())]);
  expect(h._schema.optin).toEqual("optional");
  expect(h._schema.optout).toEqual("optional");
  expectTypeOf<typeof h._schema.optin>().toEqualTypeOf<"optional" | "defaulted">();
  expectTypeOf<typeof h._schema.optout>().toEqualTypeOf<"optional">();
});

test("pipe optionality", () => {
  Schema.string().optional()._schema.optin;
  const a = Schema.string().optional().pipe(Schema.string());
  expect(a._schema.optin).toEqual("optional");
  expect(a._schema.optout).toEqual(undefined);
  expectTypeOf<typeof a._schema.optin>().toEqualTypeOf<"optional" | "defaulted">();
  expectTypeOf<typeof a._schema.optout>().toEqualTypeOf<"optional" | undefined>();

  const b = z
    .string()
    .transform((val) => (Math.random() ? val : undefined))
    .pipe(Schema.string().optional());
  expect(b._schema.optin).toEqual(undefined);
  expect(b._schema.optout).toEqual("optional");
  expectTypeOf<typeof b._schema.optin>().toEqualTypeOf<"optional" | "defaulted" | undefined>();
  expectTypeOf<typeof b._schema.optout>().toEqualTypeOf<"optional">();

  const c = Schema.string().default("asdf").pipe(Schema.string());
  expect(c._schema.optin).toEqual("defaulted");
  expect(c._schema.optout).toEqual(undefined);

  const d = z
    .string()
    .transform((val) => (Math.random() ? val : undefined))
    .pipe(Schema.string().default("asdf"));
  expect(d._schema.optin).toEqual(undefined);
  expect(d._schema.optout).toEqual(undefined);
});

test("pipe optionality inside objects", () => {
  const schema = Schema.object({
    a: Schema.string().optional(),
    b: Schema.string().optional().pipe(Schema.string()),
    c: Schema.string().default("asdf").pipe(Schema.string()),
    d: z
      .string()
      .transform((val) => (Math.random() ? val : undefined))
      .pipe(Schema.string().optional()),
    e: z
      .string()
      .transform((val) => (Math.random() ? val : undefined))
      .pipe(Schema.string().default("asdf")),
  });

  type SchemaIn = Schema.input<typeof schema>;
  expectTypeOf<SchemaIn>().toEqualTypeOf<{
    a?: string | undefined;
    b?: string | undefined;
    c?: string | undefined;
    d: string;
    e: string;
  }>();

  type SchemaOut = Schema.output<typeof schema>;
  expectTypeOf<SchemaOut>().toEqualTypeOf<{
    a?: string | undefined;
    b: string;
    c: string;
    d?: string | undefined;
    e: string;
  }>();
});

test("optional prop with pipe", () => {
  const schema = Schema.object({
    id: z
      .union([Schema.number(), Schema.string().nullish()])
      .transform((val) => (val === null || val === undefined ? val : Number(val)))
      .pipe(Schema.number())
      .optional(),
  });

  Schema.parse({});
  Schema.parse({}, { jitless: true });
});

test("object absent keys require optin optional", () => {
  const valueUndefined = Schema.object({
    value: Schema.undefined(),
    union: Schema.union([Schema.string(), Schema.undefined()]),
  });

  expect(valueUndefined.safeParse({}).error!.issues).toMatchInlineSnapshot(`
    [
      {
        "code": "invalid_type",
        "expected": "nonoptional",
        "message": "Invalid input: expected nonoptional, received undefined",
        "path": [
          "value",
        ],
      },
      {
        "code": "invalid_type",
        "expected": "nonoptional",
        "message": "Invalid input: expected nonoptional, received undefined",
        "path": [
          "union",
        ],
      },
    ]
  `);
  expect(valueUndefined.safeParse({}, { jitless: true }).success).toEqual(false);
  expect(valueUndefined.parse({ value: undefined, union: undefined })).toEqual({
    value: undefined,
    union: undefined,
  });

  const optionalOutOnly = Schema.object({
    value: z
      .string()
      .transform((val) => (Math.random() ? val : undefined))
      .pipe(Schema.string().optional()),
  });
  expect(optionalOutOnly.safeParse({}).success).toEqual(false);
  expect(optionalOutOnly.safeParse({}, { jitless: true }).success).toEqual(false);

  const defaulted = Schema.object({ value: Schema.string().default("fallback") });
  expect(defaulted.parse({})).toEqual({ value: "fallback" });
  expect(defaulted.parse({}, { jitless: true })).toEqual({ value: "fallback" });
});

// exactOptional tests
test(".exactOptional()", () => {
  const schema = Schema.string().exactOptional();
  expect(Schema.parse("asdf")).toEqual("asdf");
  expect(Schema.safeParse(undefined).success).toEqual(false);
  expect(Schema.safeParse(null).success).toEqual(false);

  // Type should NOT include undefined
  expectTypeOf<typeof Schema._output>().toEqualTypeOf<string>();
  expectTypeOf<typeof Schema._input>().toEqualTypeOf<string>();
});

test("exactOptional unwrap", () => {
  const unwrapped = Schema.string().exactOptional().unwrap();
  expect(unwrapped).toBeInstanceOf(Schema.SchemaString);
});

test("exactOptional optionality", () => {
  const a = Schema.string().exactOptional();
  expect(a._schema.optin).toEqual("optional");
  expect(a._schema.optout).toEqual("optional");
  expectTypeOf<typeof a._schema.optin>().toEqualTypeOf<"optional" | "defaulted">();
  expectTypeOf<typeof a._schema.optout>().toEqualTypeOf<"optional">();
});

test("exactOptional in objects - absent keys", () => {
  const schema = Schema.object({
    a: Schema.string().exactOptional(),
  });

  // Absent key should pass
  expect(Schema.parse({})).toEqual({});
  expect(Schema.parse({}, { jitless: true })).toEqual({});

  // Present key with valid value should pass
  expect(Schema.parse({ a: "hello" })).toEqual({ a: "hello" });
  expect(Schema.parse({ a: "hello" }, { jitless: true })).toEqual({ a: "hello" });
});

test("exactOptional in objects - explicit undefined rejected", () => {
  const schema = Schema.object({
    a: Schema.string().exactOptional(),
  });

  // Explicit undefined should fail
  expect(Schema.safeParse({ a: undefined }).success).toEqual(false);
  expect(Schema.safeParse({ a: undefined }, { jitless: true }).success).toEqual(false);
});

test("exactOptional type inference in objects", () => {
  const schema = Schema.object({
    a: Schema.string().exactOptional(),
    b: Schema.string().optional(),
  });

  type SchemaIn = Schema.input<typeof schema>;
  expectTypeOf<SchemaIn>().toEqualTypeOf<{
    a?: string;
    b?: string | undefined;
  }>();

  type SchemaOut = Schema.output<typeof schema>;
  expectTypeOf<SchemaOut>().toEqualTypeOf<{
    a?: string;
    b?: string | undefined;
  }>();
});

test("exactOptional vs optional comparison", () => {
  const optionalSchema = Schema.object({ a: Schema.string().optional() });
  const exactOptionalSchema = Schema.object({ a: Schema.string().exactOptional() });

  // Both accept absent keys
  expect(optionalSchema.parse({})).toEqual({});
  expect(exactOptionalSchema.parse({})).toEqual({});

  // Both accept valid values
  expect(optionalSchema.parse({ a: "hi" })).toEqual({ a: "hi" });
  expect(exactOptionalSchema.parse({ a: "hi" })).toEqual({ a: "hi" });

  // optional() accepts explicit undefined
  expect(optionalSchema.parse({ a: undefined })).toEqual({ a: undefined });

  // exactOptional() rejects explicit undefined
  expect(exactOptionalSchema.safeParse({ a: undefined }).success).toEqual(false);
});

// Defensive inference coverage: every schema that propagates `optout` participates in object-key optionality inference. If anyone ever changes the set of values that `optout` can take (or how OptionalOutSchema matches them), these assertions must continue to hold or downstream `Schema.infer<typeof obj>` types silently flip required keys.
test("object key optionality through optout propagation", () => {
  const direct = Schema.object({ k: Schema.string().optional() });
  expectTypeOf<Schema.infer<typeof direct>>().toEqualTypeOf<{ k?: string | undefined }>();

  const exact = Schema.object({ k: Schema.string().exactOptional() });
  expectTypeOf<Schema.infer<typeof exact>>().toEqualTypeOf<{ k?: string }>();

  // nullable() preserves the inner type's optout
  const nullableOpt = Schema.object({ k: Schema.string().optional().nullable() });
  expectTypeOf<Schema.infer<typeof nullableOpt>>().toEqualTypeOf<{ k?: string | null | undefined }>();

  // optional() wrapping nullable() — still optional out
  const optNullable = Schema.object({ k: Schema.string().nullable().optional() });
  expectTypeOf<Schema.infer<typeof optNullable>>().toEqualTypeOf<{ k?: string | null | undefined }>();

  // union containing an optional member must mark the key as optional
  const unionWithOpt = Schema.object({ k: Schema.union([Schema.string(), Schema.string().optional()]) });
  expectTypeOf<Schema.infer<typeof unionWithOpt>>().toEqualTypeOf<{ k?: string | undefined }>();

  // pipe ending in optional()
  const pipedToOpt = Schema.object({
    k: z
      .string()
      .transform((v) => (Math.random() ? v : undefined))
      .pipe(Schema.string().optional()),
  });
  expectTypeOf<Schema.output<typeof pipedToOpt>>().toEqualTypeOf<{ k?: string | undefined }>();

  // mixed shape pinning required vs optional keys end-to-end
  const mixed = Schema.object({
    req: Schema.string(),
    opt: Schema.string().optional(),
    exact: Schema.string().exactOptional(),
    def: Schema.string().default("x"),
    nullableOpt: Schema.string().optional().nullable(),
  });
  expectTypeOf<Schema.output<typeof mixed>>().toEqualTypeOf<{
    req: string;
    opt?: string | undefined;
    exact?: string;
    def: string;
    nullableOpt?: string | null | undefined;
  }>();
});

// Defensive: tuple optional-tail inference also reads optout. The PR that introduced `"includeUndefined"` had to update TupleOutputTypeWithOptionals; pin the result so any future flag change has to keep this contract.
test("tuple tail optionality through optout propagation", () => {
  const trailingOptional = Schema.tuple([Schema.string(), Schema.number().optional()]);
  expectTypeOf<Schema.output<typeof trailingOptional>>().toEqualTypeOf<[string, (number | undefined)?]>();

  const trailingExact = Schema.tuple([Schema.string(), Schema.number().exactOptional()]);
  expectTypeOf<Schema.output<typeof trailingExact>>().toEqualTypeOf<[string, number?]>();

  // Interior optional must NOT make the tail optional
  const interiorOptional = Schema.tuple([Schema.string(), Schema.number().optional(), Schema.string()]);
  expectTypeOf<Schema.output<typeof interiorOptional>>().toEqualTypeOf<[string, number | undefined, string]>();
});

// An absent optional key whose check fails has its issue swallowed; the value the check wrote must go with it, on the JIT fastpass as well as the interpreted path.
test("swallowed issue on an absent optional key drops its value", async () => {
  const schema = Schema.object({
    a: z
      .string()
      .optional()
      .superRefine((_v, ctx) => {
        ctx.addIssue({ code: "custom", message: "bad" });
        ctx.value = "leaked";
      }),
  });

  for (const result of [
    Schema.safeParse({}),
    Schema.safeParse({}, { jitless: true }),
    await Schema.safeParseAsync({}),
  ]) {
    expect(result.success).toEqual(true);
    expect("a" in result.data!).toEqual(false);
  }

  // A present key keeps both the issue and its value.
  expect(Schema.safeParse({ a: "x" }).success).toEqual(false);
  expect(Schema.safeParse({ a: "x" }, { jitless: true }).success).toEqual(false);
});

test("optional does not swallow an issue it did not cause", () => {
  // A pipe hands its `out` schema the caller's issues array so an unrecognized key can survive to an enclosing intersection. A defaulted inner substituting for absence must not read that as its own failing and drop it.
  const result = z
    .strictObject({ a: Schema.string() })
    .transform((): number | undefined => undefined)
    .pipe(Schema.number().default(5).optional())
    .safeParse({ a: "x", extra: 1 });

  expect(result.success).toBe(false);
  expect(result.error!.issues.map((i) => i.code)).toEqual(["unrecognized_keys"]);
});
