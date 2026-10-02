import { expect, expectTypeOf, test } from "vitest";
import { Schema } from "schema/v4";

test.each([false, true])("undefined prefault preserves object keys (jitless: %s)", async (jitless) => {
  const previous = Schema.config().jitless;
  Schema.config({ jitless });
  try {
    let calls = 0;
    const field = Schema.union([Schema.string(), Schema.undefined()]).prefault(() => {
      calls++;
      return undefined;
    });
    const schema = Schema.object({ a: field });
    expectTypeOf<Schema.output<typeof field>>().toEqualTypeOf<string | undefined>();
    expectTypeOf<Schema.input<typeof schema>>().toEqualTypeOf<{ a?: string | undefined }>();
    expectTypeOf<Schema.output<typeof schema>>().toEqualTypeOf<{ a: string | undefined }>();
    expect(Schema.parse({})).toStrictEqual({ a: undefined });
    expect(calls).toBe(1);
    expect(Schema.parse({ a: undefined })).toStrictEqual({ a: undefined });
    expect(calls).toBe(2);
    expect(await Schema.parseAsync({})).toStrictEqual({ a: undefined });
    expect(calls).toBe(3);
    expect(Schema.parse({ a: "value" })).toStrictEqual({ a: "value" });
    expect(Schema.safeParse({ a: 123 }).success).toBe(false);
    expect(calls).toBe(3);

    const literal = Schema.prefault(Schema.string().optional(), undefined);
    expect(Schema.core.compileFn(Schema.object({ a: literal }))({})).toStrictEqual({ a: undefined });
    for (const wrapped of [literal, literal.readonly(), literal.nullable(), Schema.lazy(() => literal)]) {
      expect(Schema.object({ a: wrapped }).parse({})).toStrictEqual({ a: undefined });
    }
    expect(Schema.object({ a: literal.optional() }).parse({})).toStrictEqual({});
    expect(Schema.object({ a: literal.optional() }).parse({ a: undefined })).toStrictEqual({ a: undefined });
    expect(Schema.tuple([literal]).parse([])).toStrictEqual([undefined]);
  } finally {
    Schema.config({ jitless: previous });
  }
});

test("prefault preserves transformed undefined output", async () => {
  const field = z
    .string()
    .transform(() => undefined)
    .prefault("fallback");
  expectTypeOf<Schema.output<typeof field>>().toEqualTypeOf<undefined>();
  expect(field.parse(undefined)).toBeUndefined();
  const schema = Schema.object({ a: field, optional: Schema.string().optional() });
  expectTypeOf<Schema.output<typeof schema>>().toEqualTypeOf<{ a: undefined; optional?: string | undefined }>();
  expect(Schema.parse({})).toStrictEqual({ a: undefined });
  expect(Schema.core.compileFn(schema)({})).toStrictEqual({ a: undefined });
  expect(Schema.compile(schema).parse({})).toStrictEqual({ a: undefined });
  expect(
    await z
      .object({
        a: z
          .string()
          .transform(async () => undefined)
          .prefault("fallback"),
      })
      .parseAsync({})
  ).toStrictEqual({ a: undefined });
  expect(
    z
      .object({
        a: z
          .string()
          .prefault("fallback")
          .transform(() => undefined),
      })
      .parse({})
  ).toStrictEqual({ a: undefined });
});

test("basic prefault", () => {
  const a = Schema.prefault(Schema.string().trim(), "  default  ");
  expect(a).toBeInstanceOf(Schema.SchemaPrefault);
  expect(a.parse("  asdf  ")).toEqual("asdf");
  expect(a.parse(undefined)).toEqual("default");

  type inp = Schema.input<typeof a>;
  expectTypeOf<inp>().toEqualTypeOf<string | undefined>();
  type out = Schema.output<typeof a>;
  expectTypeOf<out>().toEqualTypeOf<string>();
});

test("prefault inside object", () => {
  // test optinality
  const a = Schema.object({
    name: Schema.string().optional(),
    age: Schema.number().default(1234),
    email: Schema.string().prefault("1234"),
  });

  type inp = Schema.input<typeof a>;
  expectTypeOf<inp>().toEqualTypeOf<{
    name?: string | undefined;
    age?: number | undefined;
    email?: string | undefined;
  }>();

  type out = Schema.output<typeof a>;
  expectTypeOf<out>().toEqualTypeOf<{
    name?: string | undefined;
    age: number;
    email: string;
  }>();
});

test("object schema with prefault should return shallow clone", () => {
  const schema = z
    .object({
      a: Schema.string(),
    })
    .prefault({ a: "x" });
  const result1 = Schema.parse(undefined);
  const result2 = Schema.parse(undefined);
  expect(result1).not.toBe(result2);
  expect(result1).toEqual(result2);
});

test("direction-aware prefault", () => {
  const schema = Schema.string().prefault("hello");

  // Forward direction (regular parse): prefault should be applied
  expect(Schema.parse(undefined)).toBe("hello");

  // Reverse direction (encode): prefault should NOT be applied, undefined should fail validation
  expect(Schema.safeEncode(schema, undefined as any)).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [],
        "message": "Invalid input: expected string, received undefined"
      }
    ]],
      "success": false,
    }
  `);

  // But valid values should still work in reverse
  expect(Schema.encode(schema, "world")).toBe("world");
});
