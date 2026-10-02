import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";

test("preprocess", () => {
  const schema = Schema.preprocess((data) => [data], Schema.string().array());
  const value = Schema.parse("asdf");
  expect(value).toEqual(["asdf"]);
  expectTypeOf<(typeof schema)["_input"]>().toEqualTypeOf<unknown>();
});

test("async preprocess", async () => {
  const schema = Schema.preprocess(async (data) => {
    return [data];
  }, Schema.string().array());
  const value = await Schema.safeParseAsync("asdf");
  expect(value.data).toEqual(["asdf"]);
  expect(value).toMatchInlineSnapshot(`
    {
      "data": [
        "asdf",
      ],
      "success": true,
    }
  `);
});

test("ctx.addIssue accepts string", () => {
  const schema = Schema.preprocess((_, ctx) => {
    ctx.addIssue("bad stuff");
  }, Schema.string());
  const result = Schema.safeParse("asdf");
  expect(result.error!.issues).toHaveLength(1);
  expect(result).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "message": "bad stuff",
        "code": "custom",
        "path": []
      }
    ]],
      "success": false,
    }
  `);
});

test("preprocess ctx.addIssue with parse", () => {
  const a = Schema.preprocess((data, ctx) => {
    ctx.addIssue({
      input: data,
      code: "custom",
      message: `${data} is not one of our allowed strings`,
    });
    return data;
  }, Schema.string());

  const result = a.safeParse("asdf");

  // expect(result.error!.toJSON()).toContain("not one of our allowed strings");

  expect(result.error!.issues).toHaveLength(1);
  expect(result).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "custom",
        "message": "asdf is not one of our allowed strings",
        "path": []
      }
    ]],
      "success": false,
    }
  `);
});

test("preprocess ctx.addIssue fatal by default", () => {
  const schema = Schema.preprocess((data, ctx) => {
    ctx.addIssue({
      code: "custom",
      message: `custom error`,
    });

    return data;
  }, Schema.string());
  const result = Schema.safeParse(1234);

  expect(result.error!.issues).toHaveLength(1);
  expect(result).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "custom",
        "message": "custom error",
        "path": []
      }
    ]],
      "success": false,
    }
  `);
});

test("preprocess ctx.addIssue fatal true", () => {
  const schema = Schema.preprocess((data, ctx) => {
    ctx.addIssue({
      input: data,
      code: "custom",
      origin: "custom",
      message: `custom error`,
      fatal: true,
    });
    return data;
  }, Schema.string());

  const result = Schema.safeParse(1234);

  expect(result.error!.issues).toHaveLength(1);
  expect(result).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "custom",
        "origin": "custom",
        "message": "custom error",
        "fatal": true,
        "path": []
      }
    ]],
      "success": false,
    }
  `);
});

test("async preprocess ctx.addIssue with parseAsync", async () => {
  const schema = Schema.preprocess(async (data, ctx) => {
    ctx.addIssue({
      input: data,
      code: "custom",
      message: `${data} is not one of our allowed strings`,
    });
    return data;
  }, Schema.string());

  const result = await Schema.safeParseAsync("asdf");

  expect(result.error!.issues).toHaveLength(1);
  expect(result).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "custom",
        "message": "asdf is not one of our allowed strings",
        "path": []
      }
    ]],
      "success": false,
    }
  `);
});

test("Schema.NEVER in preprocess", () => {
  const foo = Schema.preprocess((val, ctx) => {
    if (!val) {
      ctx.addIssue({ input: val, code: "custom", message: "bad" });
      return Schema.NEVER;
    }
    return val;
  }, Schema.number());

  type foo = Schema.infer<typeof foo>;
  expectTypeOf<foo>().toEqualTypeOf<number>();
  const result = foo.safeParse(undefined);

  expect(result.error!.issues).toHaveLength(1);
  expect(result).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "custom",
        "message": "bad",
        "path": []
      }
    ]],
      "success": false,
    }
  `);
});

test("preprocess as the second property of object", () => {
  const schema = Schema.object({
    nonEmptyStr: Schema.string().min(1),
    positiveNum: Schema.preprocess((v) => Number(v), Schema.number().positive()),
  });
  const result = Schema.safeParse({
    nonEmptyStr: "",
    positiveNum: "",
  });

  expect(result.error!.issues).toHaveLength(2);
  expect(result).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "origin": "string",
        "code": "too_small",
        "minimum": 1,
        "inclusive": true,
        "path": [
          "nonEmptyStr"
        ],
        "message": "Too small: expected string to have >=1 characters"
      },
      {
        "origin": "number",
        "code": "too_small",
        "minimum": 0,
        "inclusive": false,
        "path": [
          "positiveNum"
        ],
        "message": "Too small: expected number to be >0"
      }
    ]],
      "success": false,
    }
  `);
});

test("preprocess validates with sibling errors", () => {
  const schema = Schema.object({
    missing: Schema.string().refine(() => false),
    preprocess: Schema.preprocess((data: any) => data?.trim(), Schema.string().regex(/ asdf/)),
  });

  const result = Schema.safeParse({ preprocess: " asdf" });

  expect(result.error!.issues).toHaveLength(2);
  expect(result).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [
          "missing"
        ],
        "message": "Invalid input: expected string, received undefined"
      },
      {
        "origin": "string",
        "code": "invalid_format",
        "format": "regex",
        "pattern": "/ asdf/",
        "path": [
          "preprocess"
        ],
        "message": "Invalid string: must match pattern / asdf/"
      }
    ]],
      "success": false,
    }
  `);
});

test("perform transform with non-fatal issues", () => {
  const A = z
    .string()
    .refine((_) => false)
    .min(4)
    .transform((val) => val.length)
    .pipe(Schema.number())
    .refine((_) => false);
  expect(A.safeParse("asdfasdf").error!.issues).toHaveLength(1);
  expect(A.safeParse("asdfasdf").error).toMatchInlineSnapshot(`
    [SchemaError: [
      {
        "code": "custom",
        "path": [],
        "message": "Invalid input"
      }
    ]]
  `);
});

test("preprocess accepts absent object keys (4.3 parity)", () => {
  const schema = Schema.object({ a: Schema.preprocess((v) => v ?? "X", Schema.string()) });
  expect(Schema.parse({})).toEqual({ a: "X" });
  expect(Schema.parse({ a: "hi" })).toEqual({ a: "hi" });
  expect(Schema.parse({ a: undefined })).toEqual({ a: "X" });

  // Outer optional clobbers preprocess output on undefined input
  expect(
    z
      .preprocess((v) => v ?? "X", Schema.string())
      .optional()
      .parse(undefined)
  ).toBeUndefined();
  expect(
    z
      .preprocess((v) => v ?? "X", Schema.string())
      .optional()
      .parse("hi")
  ).toBe("hi");
  expect(Schema.object({ a: Schema.preprocess((v) => v ?? "X", Schema.string()).optional() }).parse({})).toEqual({});

  // Top-level direct call unchanged
  expect(Schema.preprocess((v) => v ?? "X", Schema.string()).parse(undefined)).toBe("X");
});

// https://github.com/colinhacks/schema/issues/5917
test("optional propagates through preprocess inside object", () => {
  const outer = Schema.object({ x: Schema.preprocess((v) => v, Schema.number()).optional() });
  const inner = Schema.object({ x: Schema.preprocess((v) => v, Schema.number().optional()) });

  expect(outer.safeParse({}).success).toBe(true);
  expect(inner.safeParse({}).success).toBe(true);

  expect(outer.safeParse({ x: 1 })).toEqual({ success: true, data: { x: 1 } });
  expect(inner.safeParse({ x: 1 })).toEqual({ success: true, data: { x: 1 } });

  expect(inner._schema.def.shape.x._schema.optin).toBe("optional");
  expect(inner._schema.def.shape.x._schema.optout).toBe("optional");
});

test("preprocess is a structural subtype of SchemaPipe", () => {
  const schema = Schema.preprocess((v) => v, Schema.string());
  expect(schema).toBeInstanceOf(Schema.SchemaPipe);
  expect(schema).toBeInstanceOf(Schema.SchemaPreprocess);
  expect(Schema._schema.def.type).toBe("pipe");
});

test("preprocess does not propagate values/propValues from inner schema", () => {
  const inner = Schema.preprocess((v) => v, Schema.literal("test"));
  expect(inner._schema.values).toBeUndefined();
  expect(inner._schema.propValues).toBeUndefined();
});

test("preprocess as discriminator throws at construction (no propValues to inherit)", () => {
  const schema = Schema.discriminatedUnion("kind", [
    Schema.object({ kind: Schema.preprocess((v: any) => String(v).toUpperCase(), Schema.literal("A")), a: Schema.string() }),
    Schema.object({ kind: Schema.preprocess((v: any) => String(v).toUpperCase(), Schema.literal("B")), b: Schema.number() }),
  ]);
  expect(() => Schema.parse({ kind: "a", a: "x" })).toThrow(/Invalid discriminated union option/);
});

test("preprocess as record key does not restrict accepted keys", () => {
  const schema = Schema.record(
    Schema.preprocess((v: any) => String(v).toLowerCase(), Schema.enum(["a", "b"])),
    Schema.string()
  );
  expect(Schema.safeParse({ A: "x", B: "y" })).toEqual({ success: true, data: { a: "x", b: "y" } });
});
