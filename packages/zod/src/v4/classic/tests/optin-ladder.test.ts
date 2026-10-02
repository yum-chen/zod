import { expect, expectTypeOf, test } from "vitest";
import { Schema } from "schema/v4";

/* ------------------------------------------------------------------ *
 * TYPE-LEVEL — the dangerous half. Defaults must stay OPTIONAL in
 * Schema.input and REQUIRED in Schema.output, exactly as before the ladder.
 * ------------------------------------------------------------------ */
test("ladder: Schema.input / Schema.output unchanged by the extra rung", () => {
  const objDefault = Schema.object({ a: Schema.string().default("D"), b: Schema.number() });
  expectTypeOf<Schema.input<typeof objDefault>>().toEqualTypeOf<{ a?: string | undefined; b: number }>();
  expectTypeOf<Schema.output<typeof objDefault>>().toEqualTypeOf<{ a: string; b: number }>();

  const objPrefault = Schema.object({ a: Schema.string().prefault("P"), b: Schema.number() });
  expectTypeOf<Schema.input<typeof objPrefault>>().toEqualTypeOf<{ a?: string | undefined; b: number }>();
  expectTypeOf<Schema.output<typeof objPrefault>>().toEqualTypeOf<{ a: string; b: number }>();

  const objOptional = Schema.object({ a: Schema.string().optional() });
  expectTypeOf<Schema.input<typeof objOptional>>().toEqualTypeOf<{ a?: string | undefined }>();

  const objTransform = Schema.object({
    a: z
      .string()
      .default("")
      .transform((v) => v.length),
  });
  expectTypeOf<Schema.input<typeof objTransform>>().toEqualTypeOf<{ a?: string | undefined }>();
  expectTypeOf<Schema.output<typeof objTransform>>().toEqualTypeOf<{ a: number }>();

  const standalone = Schema.string().default("D");
  expectTypeOf<Schema.input<typeof standalone>>().toEqualTypeOf<string | undefined>();
  expectTypeOf<Schema.output<typeof standalone>>().toEqualTypeOf<string>();

  // a trailing defaulted tuple slot stays optional in the input tuple
  const tup = Schema.tuple([Schema.string(), Schema.number().default(1)]);
  expectTypeOf<Schema.input<typeof tup>>().toEqualTypeOf<[string, (number | undefined)?]>();

  const partialed = objDefault.partial();
  expectTypeOf<Schema.input<typeof partialed>>().toEqualTypeOf<{ a?: string | undefined; b?: number | undefined }>();
});

/* ------------------------------------------------------------------ *
 * RUNTIME
 * ------------------------------------------------------------------ */
test("ladder: the #6321 regression is fixed", () => {
  const arr = z
    .string()
    .default("")
    .transform((v) => (v ? v.split(",") : []));
  expect(Schema.object({ a: arr }).partial().parse({})).toEqual({ a: [] });
  expect(Schema.object({ a: arr }).partial().parse({ a: undefined })).toEqual({ a: [] });
  expect(Schema.object({ a: arr }).partial().parse({ a: "x,y" })).toEqual({ a: ["x", "y"] });
  expect(arr.optional().parse(undefined)).toEqual([]);
  expect(
    z
      .string()
      .prefault("hi")
      .transform((v) => v.length)
      .optional()
      .parse(undefined)
  ).toBe(2);
});

test("ladder: key-level admissibility across every rung", () => {
  expect(Schema.object({ a: Schema.string().default("D") }).parse({})).toEqual({ a: "D" });
  expect(Schema.object({ a: Schema.string().prefault("P") }).parse({})).toEqual({ a: "P" });
  expect(Schema.object({ a: Schema.string().optional() }).parse({})).toEqual({});
  expect(Schema.object({ a: Schema.transform(() => "T") }).parse({})).toEqual({ a: "T" });
  expect(Schema.object({ a: Schema.string().catch("C") }).parse({})).toEqual({ a: "C" });
  expect(Schema.object({ a: Schema.string() }).safeParse({}).success).toBe(false);
});

test("ladder: exactOptional keeps its distinct meaning", () => {
  expect(Schema.object({ a: Schema.string().exactOptional() }).parse({})).toEqual({});
  expect(Schema.object({ a: Schema.string().exactOptional() }).safeParse({ a: undefined }).success).toBe(false);
});

// An absent key never materializes a value from a schema that only claims the middle rung, however that schema answers `undefined`. The top rung still substitutes, and an explicitly present `undefined` still runs the inner.
test.each([true, false])("ladder: an absent key stays absent on the middle rung (jitless=%s)", (jitless) => {
  const opts = { jitless };
  expect(Schema.object({ a: Schema.coerce.string().exactOptional() }).parse({}, opts)).toStrictEqual({});
  expect(Schema.object({ a: Schema.string().catch("C").exactOptional() }).parse({}, opts)).toStrictEqual({});
  expect(Schema.object({ a: Schema.preprocess((v) => v ?? "X", Schema.string()).exactOptional() }).parse({}, opts)).toStrictEqual({});
  expect(Schema.object({ a: Schema.union([Schema.coerce.string(), Schema.string().optional()]) }).parse({}, opts)).toStrictEqual({});

  expect(Schema.object({ a: Schema.string().default("D").exactOptional() }).parse({}, opts)).toStrictEqual({ a: "D" });
  expect(Schema.object({ a: Schema.string().prefault("P").exactOptional() }).parse({}, opts)).toStrictEqual({ a: "P" });
  expect(Schema.object({ a: Schema.coerce.string().exactOptional() }).parse({ a: undefined }, opts)).toStrictEqual({
    a: "undefined",
  });
  expect(Schema.object({ a: Schema.coerce.string() }).parse({ a: undefined }, opts)).toStrictEqual({ a: "undefined" });
});

test("ladder: an absent tuple slot on the middle rung truncates the tail", () => {
  expect(Schema.tuple([Schema.string(), Schema.coerce.string().exactOptional()]).parse(["x"])).toStrictEqual(["x"]);
  expect(Schema.tuple([Schema.string(), Schema.string().catch("C").exactOptional()]).parse(["x"])).toStrictEqual(["x"]);
  expect(Schema.tuple([Schema.string(), Schema.string().default("D").exactOptional()]).parse(["x"])).toStrictEqual(["x", "D"]);
});

// Schema.compile() assembles its own output, so the gate has to be mirrored there or compile mode silently keeps the invented value.
test("ladder: compile mode agrees with the interpreted and JIT paths on absent middle-rung slots", () => {
  const objects = [
    [Schema.object({ a: Schema.coerce.string().exactOptional() }), {}],
    [Schema.object({ a: Schema.string().catch("C").exactOptional() }), {}],
    [Schema.object({ a: Schema.string().default("D").exactOptional() }), { a: "D" }],
    [Schema.object({ a: Schema.string().catch("C") }), { a: "C" }],
  ] as const;
  for (const [schema, expected] of objects) {
    expect(Schema.compile(schema).parse({})).toStrictEqual(expected);
    expect(Schema.parse({}, { jitless: true })).toStrictEqual(expected);
    expect(Schema.parse({})).toStrictEqual(expected);
  }

  const tuples = [
    [Schema.tuple([Schema.string(), Schema.coerce.string().exactOptional()]), ["x"]],
    [Schema.tuple([Schema.string(), Schema.string().default("D").exactOptional()]), ["x", "D"]],
  ] as const;
  for (const [schema, expected] of tuples) {
    expect(Schema.compile(schema).parse(["x"])).toStrictEqual(expected);
    expect(Schema.parse(["x"], { jitless: true })).toStrictEqual(expected);
  }
});

test("ladder: tuple minimum length respects every rung", () => {
  expect(Schema.tuple([Schema.string().default("D")]).parse([])).toEqual(["D"]);
  expect(Schema.tuple([Schema.string().prefault("P")]).parse([])).toEqual(["P"]);
  expect(Schema.tuple([Schema.string().optional()]).parse([])).toEqual([]);
  expect(Schema.tuple([Schema.string()]).safeParse([]).success).toBe(false);
  expect(Schema.tuple([Schema.string(), Schema.number().default(1)]).parse(["x"])).toEqual(["x", 1]);
});

test("ladder: the #5941 / #5939 clobber invariants still hold", () => {
  expect(
    z
      .preprocess((v) => v ?? "X", Schema.string())
      .optional()
      .parse(undefined)
  ).toBeUndefined();
  expect(Schema.string().catch("X").optional().parse(undefined)).toBeUndefined();
  expect(
    z
      .string()
      .catch("X")
      .transform((s) => `${s}!`)
      .optional()
      .parse(undefined)
  ).toBeUndefined();
  expect(
    z
      .transform(() => "T")
      .optional()
      .parse(undefined)
  ).toBeUndefined();
  expect(
    z
      .union([Schema.preprocess((v) => v ?? "X", Schema.string()), Schema.number()])
      .optional()
      .parse(undefined)
  ).toBeUndefined();
  expect(Schema.object({ a: Schema.preprocess((v) => v ?? "X", Schema.string()) }).parse({})).toEqual({ a: "X" });
});

test("ladder: the top rung survives every wrapper order", () => {
  expect(Schema.string().default("D").optional().parse(undefined)).toBe("D");
  expect(Schema.string().default("D").optional().optional().parse(undefined)).toBe("D");
  expect(Schema.string().default("D").nullable().optional().parse(undefined)).toBe("D");
  expect(Schema.string().default("D").readonly().optional().parse(undefined)).toBe("D");
  expect(Schema.string().default("D").catch("C").optional().parse(undefined)).toBe("D");
  expect(Schema.string().default("D").pipe(Schema.string()).optional().parse(undefined)).toBe("D");
  expect(
    z
      .union([Schema.string().default("D"), Schema.number()])
      .optional()
      .parse(undefined)
  ).toBe("D");
  expect(
    z
      .lazy(() => Schema.string().default("D"))
      .optional()
      .parse(undefined)
  ).toBe("D");
});

test("ladder: record and catchall paths that read optin", () => {
  expect(Schema.record(Schema.string(), Schema.string().default("D")).parse({ k: undefined })).toEqual({ k: "D" });
  expect(Schema.object({}).catchall(Schema.string().default("D")).parse({ x: undefined })).toEqual({ x: "D" });
});

test("ladder: async parity", async () => {
  const a = z
    .string()
    .default("")
    .transform(async (v) => (v ? v.split(",") : []));
  expect((await a.optional().safeParseAsync(undefined)).data).toEqual([]);
  expect((await Schema.object({ a }).partial().safeParseAsync({})).data).toEqual({ a: [] });
  expect(
    (
      await z
        .preprocess(async (v) => v ?? "X", Schema.string())
        .optional()
        .safeParseAsync(undefined)
    ).data
  ).toBeUndefined();
});

test("ladder: the rung values themselves", () => {
  expect(Schema.string()._schema.optin).toBeUndefined();
  expect(Schema.string().optional()._schema.optin).toBe("optional");
  expect(Schema.transform(() => 1)._schema.optin).toBe("optional");
  expect(Schema.string().catch("C")._schema.optin).toBe("optional");
  expect(Schema.string().default("D")._schema.optin).toBe("defaulted");
  expect(Schema.string().prefault("P")._schema.optin).toBe("defaulted");
  expect(
    z
      .string()
      .default("D")
      .transform((v) => v)._schema.optin
  ).toBe("defaulted");
  expect(Schema.string().default("D").optional()._schema.optin).toBe("defaulted");
  expect(Schema.union([Schema.string().default("D"), Schema.number()])._schema.optin).toBe("defaulted");
  expect(Schema.union([Schema.string().optional(), Schema.number()])._schema.optin).toBe("optional");
});

test("exactOptional overrides the values and pattern optional installs", () => {
  expect(Schema.exactOptional(Schema.enum(["a", "b"]))._schema.values).toEqual(new Set(["a", "b"]));
  // a format carries its pattern on its def; a chained `.regex()` no longer folds into the inner `_schema.pattern`, the template literal derives that itself
  expect(Schema.exactOptional(Schema.stringFormat("abc", /^abc$/))._schema.pattern).toEqual(/^abc$/);
  expect(Schema.templateLiteral(["a", Schema.exactOptional(Schema.literal("b"))]).safeParse("a").success).toEqual(false);
});

// The override is installed once, on a prototype every instance of the type shares, so it has to hold for instances built after the first.
test("exactOptional's override holds for later instances", () => {
  Schema.exactOptional(Schema.enum(["a", "b"]));
  expect(Schema.exactOptional(Schema.enum(["c", "d"]))._schema.values).toEqual(new Set(["c", "d"]));
  expect(Schema.exactOptional(Schema.stringFormat("xyz", /^xyz$/))._schema.pattern).toEqual(/^xyz$/);
});
