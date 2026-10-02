import { expect, expectTypeOf, test } from "vitest";

import * as Schema from "schema/v4";

test("function parsing", () => {
  const schema = Schema.union([Schema.string().refine(() => false), Schema.number().refine(() => false)]);
  const result = Schema.safeParse("asdf");
  expect(result.success).toEqual(false);
});

test("union 2", () => {
  const result = Schema.union([Schema.number(), Schema.string().refine(() => false)]).safeParse("a");
  expect(result.success).toEqual(false);
});

test("return valid over invalid", () => {
  const schema = Schema.union([
    Schema.object({
      email: Schema.string().email(),
    }),
    Schema.string(),
  ]);
  expect(Schema.parse("asdf")).toEqual("asdf");
  expect(Schema.parse({ email: "asdlkjf@lkajsdf.com" })).toEqual({
    email: "asdlkjf@lkajsdf.com",
  });
});

test("return errors from both union arms", () => {
  const result = Schema.union([Schema.number(), Schema.boolean()]).safeParse("a");
  expect(result.success).toEqual(false);
  if (!result.success) {
    expect(result.error.issues).toMatchInlineSnapshot(`
      [
        {
          "code": "invalid_union",
          "errors": [
            [
              {
                "code": "invalid_type",
                "expected": "number",
                "message": "Invalid input: expected number, received string",
                "path": [],
              },
            ],
            [
              {
                "code": "invalid_type",
                "expected": "boolean",
                "message": "Invalid input: expected boolean, received string",
                "path": [],
              },
            ],
          ],
          "message": "Invalid input",
          "path": [],
        },
      ]
    `);
  }
});

test("options getter", async () => {
  const union = Schema.union([Schema.string(), Schema.number()]);
  union.options[0].parse("asdf");
  union.options[1].parse(1234);
  await union.options[0].parseAsync("asdf");
  await union.options[1].parseAsync(1234);
});

test("readonly union", async () => {
  const options = [Schema.string(), Schema.number()] as const;
  const union = Schema.union(options);
  union.parse("asdf");
  union.parse(12);
});

test("union inferred types", () => {
  const test = Schema.object({}).or(Schema.array(Schema.object({})));

  type Test = Schema.output<typeof test>; // <— any
  expectTypeOf<Test>().toEqualTypeOf<Record<string, never> | Array<Record<string, never>>>();
});

test("union values", () => {
  const schema = Schema.union([Schema.literal("a"), Schema.literal("b"), Schema.literal("c")]);

  expect(Schema._schema.values).toMatchInlineSnapshot(`
    Set {
      "a",
      "b",
      "c",
    }
  `);
});

test("non-aborted errors", () => {
  const zItemTest = Schema.union([
    Schema.object({
      date: Schema.number(),
      startDate: Schema.optional(Schema.null()),
      endDate: Schema.optional(Schema.null()),
    }),
    z
      .object({
        date: Schema.optional(Schema.null()),
        startDate: Schema.number(),
        endDate: Schema.number(),
      })
      .refine((data) => data.startDate !== data.endDate, {
        error: "startDate and endDate must be different",
        path: ["endDate"],
      }),
  ]);

  const res = zItemTest.safeParse({
    date: null,
    startDate: 1,
    endDate: 1,
  });

  expect(res).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "custom",
        "path": [
          "endDate"
        ],
        "message": "startDate and endDate must be different"
      }
    ]],
      "success": false,
    }
  `);
});

test("surface continuable errors only if they exist", () => {
  const schema = Schema.union([Schema.boolean(), Schema.uuid(), Schema.jwt()]);

  expect(Schema.safeParse("asdf")).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "invalid_union",
        "errors": [
          [
            {
              "expected": "boolean",
              "code": "invalid_type",
              "path": [],
              "message": "Invalid input: expected boolean, received string"
            }
          ],
          [
            {
              "origin": "string",
              "code": "invalid_format",
              "format": "uuid",
              "pattern": "/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/",
              "path": [],
              "message": "Invalid UUID"
            }
          ],
          [
            {
              "code": "invalid_format",
              "format": "jwt",
              "path": [],
              "message": "Invalid JWT"
            }
          ]
        ],
        "path": [],
        "message": "Invalid input"
      }
    ]],
      "success": false,
    }
  `);
});

// Schema.xor() tests
test("Schema.xor() - exactly one match succeeds", () => {
  const schema = Schema.xor([Schema.string(), Schema.number()]);
  expect(Schema.parse("hello")).toBe("hello");
  expect(Schema.parse(42)).toBe(42);
});

test("Schema.xor() - zero matches fails", () => {
  const schema = Schema.xor([Schema.string(), Schema.number()]);
  const result = Schema.safeParse(true);
  expect(result.success).toBe(false);
});

test("Schema.xor() - multiple matches fails", () => {
  const schema = Schema.xor([Schema.string(), Schema.any()]);
  const result = Schema.safeParse("hello");
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues).toMatchInlineSnapshot(`
      [
        {
          "code": "invalid_union",
          "errors": [],
          "inclusive": false,
          "matches": [
            0,
            1,
          ],
          "message": "Invalid input: more than one option matched",
          "path": [],
        },
      ]
    `);
  }
});

test("Schema.xor() - multiple matches reports every matching option", () => {
  // non-strict objects strip unknown keys, so both branches accept the extra key
  const name = Schema.object({ name: Schema.string() });
  const version = name.extend({ version: Schema.string() });
  const result = Schema.xor([name, version, Schema.unknown()]).safeParse({ name: "windows", version: "10" });
  expect(result.success).toBe(false);
  if (!result.success) {
    const issue = result.error.issues[0] as Schema  .core.$SchemaIssueInvalidUnion;
    expect(issue.inclusive).toBe(false);
    expect((issue as Extract<typeof issue, { inclusive: false }>).matches).toEqual([0, 1, 2]);
    expect(issue.message).toBe("Invalid input: more than one option matched");
  }
});

test("Schema.xor() - zero matches keeps the per-option errors", () => {
  const result = Schema.xor([Schema.string(), Schema.number()]).safeParse(true);
  expect(result.success).toBe(false);
  if (!result.success) {
    const issue = result.error.issues[0] as Schema  .core.$SchemaIssueInvalidUnion;
    expect(issue.errors).toHaveLength(2);
    expect(issue.message).toBe("Invalid input");
  }
});

test("Schema.xor() with custom error message", () => {
  const schema = Schema.xor([Schema.string(), Schema.number()], "Expected exactly one of string or number");
  const result = Schema.safeParse(true);
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0].message).toBe("Expected exactly one of string or number");
  }
});

test("Schema.xor() type inference", () => {
  const schema = Schema.xor([Schema.string(), Schema.number(), Schema.boolean()]);
  type Result = Schema.infer<typeof schema>;
  expectTypeOf<Result>().toEqualTypeOf<string | number | boolean>();
});

test("Schema.union([]) constructs and rejects all input", () => {
  const schema = Schema.union([]);
  expectTypeOf<Schema.infer<typeof schema>>().toEqualTypeOf<never>();
  const result = Schema.safeParse("anything");
  expect(result.success).toEqual(false);
  if (!result.success) {
    expect(result.error.issues).toMatchInlineSnapshot(`
      [
        {
          "code": "invalid_union",
          "errors": [],
          "message": "Invalid input",
          "path": [],
        },
      ]
    `);
  }
});

test("Schema.xor([]) constructs and rejects all input", () => {
  const schema = Schema.xor([]);
  expectTypeOf<Schema.infer<typeof schema>>().toEqualTypeOf<never>();
  const result = Schema.safeParse("anything");
  expect(result.success).toEqual(false);
  if (!result.success) {
    expect(result.error.issues).toMatchInlineSnapshot(`
      [
        {
          "code": "invalid_union",
          "errors": [],
          "message": "Invalid input",
          "path": [],
        },
      ]
    `);
  }
});

test("Schema.discriminatedUnion with empty options constructs and rejects", () => {
  const schema = Schema.discriminatedUnion("type", [] as any);
  const nonObject = Schema.safeParse("nope");
  expect(nonObject.success).toEqual(false);
  if (!nonObject.success) {
    expect(nonObject.error.issues[0].code).toBe("invalid_type");
  }
  const obj = Schema.safeParse({ type: "x" });
  expect(obj.success).toEqual(false);
  if (!obj.success) {
    expect(obj.error.issues[0].code).toBe("invalid_union");
    expect((obj.error.issues[0] as any).errors).toEqual([]);
    expect((obj.error.issues[0] as any).options).toEqual([]);
  }
});
