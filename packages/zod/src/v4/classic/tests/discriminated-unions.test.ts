import { expect, expectTypeOf, test } from "vitest";

import * as Schema from "schema/v4";

test("_values", () => {
  expect(Schema.string()._schema.values).toEqual(undefined);
  expect(Schema.enum(["a", "b"])._schema.values).toEqual(new Set(["a", "b"]));
  expect(Schema.nativeEnum({ a: "A", b: "B" })._schema.values).toEqual(new Set(["A", "B"]));
  expect(Schema.literal("test")._schema.values).toEqual(new Set(["test"]));
  expect(Schema.literal(123)._schema.values).toEqual(new Set([123]));
  expect(Schema.literal(true)._schema.values).toEqual(new Set([true]));
  expect(Schema.literal(BigInt(123))._schema.values).toEqual(new Set([BigInt(123)]));
  expect(Schema.undefined()._schema.values).toEqual(new Set([undefined]));
  expect(Schema.null()._schema.values).toEqual(new Set([null]));

  const t = Schema.literal("test");
  expect(t.optional()._schema.values).toEqual(new Set(["test", undefined]));
  expect(t.nullable()._schema.values).toEqual(new Set(["test", null]));
  expect(t.default("test")._schema.values).toEqual(new Set(["test"]));
  expect(t.catch("test")._schema.values).toEqual(new Set(["test"]));

  const pre = Schema.preprocess((val) => String(val), Schema.string()).pipe(Schema.literal("test"));
  expect(pre._schema.values).toEqual(undefined);

  const post = Schema.literal("test").transform((_) => Math.random());
  expect(post._schema.values).toEqual(new Set(["test"]));

  // Test that readonly literals pass through their values property
  expect(Schema.literal("test").readonly()._schema.values).toEqual(new Set(["test"]));
});

test("valid parse - object", () => {
  expect(
    z
      .discriminatedUnion("type", [
        Schema.object({ type: Schema.literal("a"), a: Schema.string() }),
        Schema.object({ type: Schema.literal("b"), b: Schema.string() }),
      ])
      .parse({ type: "a", a: "abc" })
  ).toEqual({ type: "a", a: "abc" });
});

test("valid - include discriminator key (deprecated)", () => {
  expect(
    z
      .discriminatedUnion("type", [
        Schema.object({ type: Schema.literal("a"), a: Schema.string() }),
        Schema.object({ type: Schema.literal("b"), b: Schema.string() }),
      ])
      .parse({ type: "a", a: "abc" })
  ).toEqual({ type: "a", a: "abc" });
});

test("valid - optional discriminator (object)", () => {
  const schema = Schema.discriminatedUnion("type", [
    Schema.object({ type: Schema.literal("a").optional(), a: Schema.string() }),
    Schema.object({ type: Schema.literal("b"), b: Schema.string() }),
  ]);
  expect(Schema.parse({ type: "a", a: "abc" })).toEqual({ type: "a", a: "abc" });
  expect(Schema.parse({ a: "abc" })).toEqual({ a: "abc" });
});

test("valid - discriminator value of various primitive types", () => {
  const schema = Schema.discriminatedUnion("type", [
    Schema.object({ type: Schema.literal("1"), val: Schema.string() }),
    Schema.object({ type: Schema.literal(1), val: Schema.string() }),
    Schema.object({ type: Schema.literal(BigInt(1)), val: Schema.string() }),
    Schema.object({ type: Schema.literal("true"), val: Schema.string() }),
    Schema.object({ type: Schema.literal(true), val: Schema.string() }),
    Schema.object({ type: Schema.literal("null"), val: Schema.string() }),
    Schema.object({ type: Schema.null(), val: Schema.string() }),
    Schema.object({ type: Schema.literal("undefined"), val: Schema.string() }),
    Schema.object({ type: Schema.undefined(), val: Schema.string() }),
  ]);

  expect(Schema.parse({ type: "1", val: "val" })).toEqual({ type: "1", val: "val" });
  expect(Schema.parse({ type: 1, val: "val" })).toEqual({ type: 1, val: "val" });
  expect(Schema.parse({ type: BigInt(1), val: "val" })).toEqual({
    type: BigInt(1),
    val: "val",
  });
  expect(Schema.parse({ type: "true", val: "val" })).toEqual({
    type: "true",
    val: "val",
  });
  expect(Schema.parse({ type: true, val: "val" })).toEqual({
    type: true,
    val: "val",
  });
  expect(Schema.parse({ type: "null", val: "val" })).toEqual({
    type: "null",
    val: "val",
  });
  expect(Schema.parse({ type: null, val: "val" })).toEqual({
    type: null,
    val: "val",
  });
  expect(Schema.parse({ type: "undefined", val: "val" })).toEqual({
    type: "undefined",
    val: "val",
  });
  expect(Schema.parse({ type: undefined, val: "val" })).toEqual({
    type: undefined,
    val: "val",
  });

  const fail = Schema.safeParse({
    type: "not_a_key",
    val: "val",
  });
  expect(fail.error).toBeInstanceOf(Schema.SchemaError);
});

test("invalid - null", () => {
  try {
    Schema.discriminatedUnion("type", [
      Schema.object({ type: Schema.literal("a"), a: Schema.string() }),
      Schema.object({ type: Schema.literal("b"), b: Schema.string() }),
    ]).parse(null);
    throw new Error();
  } catch (e: any) {
    // [
    //   {
    //     code: Schema.SchemaIssueCode.invalid_type,
    //     expected: Schema.SchemaParsedType.object,
    //     input: null,
    //     message: "Expected object, received null",
    //     received: Schema.SchemaParsedType.null,
    //     path: [],
    //   },
    // ];
    expect(e.issues).toMatchInlineSnapshot(`
      [
        {
          "code": "invalid_type",
          "expected": "object",
          "message": "Invalid input: expected object, received null",
          "path": [],
        },
      ]
    `);
  }
});

test("invalid discriminator value", () => {
  const result = z
    .discriminatedUnion("type", [
      Schema.object({ type: Schema.literal("a"), a: Schema.string() }),
      Schema.object({ type: Schema.literal("b"), b: Schema.string() }),
    ])
    .safeParse({ type: "x", a: "abc" });

  expect(result).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "invalid_union",
        "errors": [],
        "note": "No matching discriminator",
        "discriminator": "type",
        "options": [
          "a",
          "b"
        ],
        "path": [
          "type"
        ],
        "message": "Invalid discriminator value. Expected 'a' | 'b'"
      }
    ]],
      "success": false,
    }
  `);
});

test("invalid discriminator value - unionFallback", () => {
  const result = z
    .discriminatedUnion(
      "type",
      [Schema.object({ type: Schema.literal("a"), a: Schema.string() }), Schema.object({ type: Schema.literal("b"), b: Schema.string() })],
      { unionFallback: true }
    )
    .safeParse({ type: "x", a: "abc" });
  expect(result).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "invalid_union",
        "errors": [
          [
            {
              "code": "invalid_value",
              "values": [
                "a"
              ],
              "path": [
                "type"
              ],
              "message": "Invalid input: expected \\"a\\""
            }
          ],
          [
            {
              "code": "invalid_value",
              "values": [
                "b"
              ],
              "path": [
                "type"
              ],
              "message": "Invalid input: expected \\"b\\""
            },
            {
              "expected": "string",
              "code": "invalid_type",
              "path": [
                "b"
              ],
              "message": "Invalid input: expected string, received undefined"
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

test("valid discriminator value, invalid data", () => {
  const result = z
    .discriminatedUnion("type", [
      Schema.object({ type: Schema.literal("a"), a: Schema.string() }),
      Schema.object({ type: Schema.literal("b"), b: Schema.string() }),
    ])
    .safeParse({ type: "a", b: "abc" });

  // [
  //   {
  //     code: Schema.SchemaIssueCode.invalid_type,
  //     expected: Schema.SchemaParsedType.string,
  //     message: "Required",
  //     path: ["a"],
  //     received: Schema.SchemaParsedType.undefined,
  //   },
  // ];
  expect(result).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [
          "a"
        ],
        "message": "Invalid input: expected string, received undefined"
      }
    ]],
      "success": false,
    }
  `);
});

test("wrong schema - missing discriminator", () => {
  // An option whose properties can be listed is checked when the union is constructed.
  expect(() => Schema.discriminatedUnion("type", [Schema.object({ value: Schema.string() })])).toThrow(
    /Invalid discriminated union option at index "0"/
  );
  expect(() =>
    Schema.discriminatedUnion("type", [Schema.object({ type: Schema.literal("a"), a: Schema.string() }), Schema.object({ b: Schema.string() })])
  ).toThrow(/Invalid discriminated union option at index "1"/);

  // An option whose shape cannot be listed without resolving it — a pipe here — is left to the lookup map, and fails on the first object parsed.
  const viaPipe = Schema.discriminatedUnion("type", [
    Schema.object({ value: Schema.literal("x") }).pipe(Schema.object({ value: Schema.literal("x") })),
  ]);
  expect(() => viaPipe.safeParse({ value: "x" })).toThrow(/Invalid discriminated union option at index "0"/);
});

test("the construction check follows shape through both of its phases", () => {
  // `shape` answers from the object the caller passed until the first read, then from a frozen copy. A key list derived at either moment would disagree with it at the other and reject an option that does carry the discriminator.
  const mutatedBeforeRead: Record<string, Schema.SchemaType> = { value: Schema.string() };
  const A = Schema.object(mutatedBeforeRead);
  mutatedBeforeRead.type = Schema.literal("a");
  expect(
    Schema.discriminatedUnion("type", [A, Schema.object({ type: Schema.literal("b") })]).parse({ type: "a", value: "x" })
  ).toEqual({ type: "a", value: "x" });

  const mutatedAfterRead: Record<string, Schema.SchemaType> = { type: Schema.literal("a"), value: Schema.string() };
  const B = Schema.object(mutatedAfterRead);
  B.parse({ type: "a", value: "x" });
  delete mutatedAfterRead.type;
  expect(() => Schema.discriminatedUnion("type", [B])).not.toThrow();
});

test("deriving a schema neither clobbers nor is inherited by the source", () => {
  // `.describe()` and friends reuse the def by identity, so the source keeps its own check.
  const A = Schema.object({ value: Schema.literal("x") });
  A.describe("just documenting this");
  expect(() => Schema.discriminatedUnion("type", [A])).toThrow(/Invalid discriminated union option/);
  expect(() => Schema.discriminatedUnion("type", [A.describe("d")])).toThrow(/Invalid discriminated union option/);

  // A def rebuilt by a builder is a different object, so it inherits nothing and is left to the lookup map.
  const Base = Schema.object({ status: Schema.literal("failed"), message: Schema.string() });
  expect(() => Schema.discriminatedUnion("code", [Base.extend({ code: Schema.literal(400) })])).not.toThrow();
});

test("mutually-recursive getter options are checked without resolving them", () => {
  // `Object.keys` lists a shape's keys without invoking them, so the check sees `child` without running the getter that references the union being constructed.
  const variantA = Schema.object({
    kind: Schema.literal("a"),
    get child() {
      return tree.optional();
    },
  });
  const variantB = Schema.object({
    kind: Schema.literal("b"),
    get sibling() {
      return tree.optional();
    },
  });
  const tree = Schema.discriminatedUnion("kind", [variantA, variantB]);

  expect(tree.parse({ kind: "a", child: { kind: "b" } })).toEqual({ kind: "a", child: { kind: "b" } });
});

// removed to account for unions of unions
// test("wrong schema - duplicate discriminator values", () => {
//   try {
//     Schema.discriminatedUnion("type",[
//       Schema.object({ type: Schema.literal("a"), a: Schema.string() }),
//       Schema.object({ type: Schema.literal("a"), b: Schema.string() }),
//     ]);
//     throw new Error();
//   } catch (e: any) {
//     expect(e.message.includes("Duplicate discriminator value")).toEqual(true);
//   }
// });

test("async - valid", async () => {
  const schema = await Schema.discriminatedUnion("type", [
    Schema.object({
      type: Schema.literal("a"),
      a: z
        .string()
        .refine(async () => true)
        .transform(async (val) => Number(val)),
    }),
    Schema.object({
      type: Schema.literal("b"),
      b: Schema.string(),
    }),
  ]);
  const data = { type: "a", a: "1" };
  const result = await Schema.safeParseAsync(data);
  expect(result.data).toEqual({ type: "a", a: 1 });
});

test("async - invalid", async () => {
  // try {
  const a = Schema.discriminatedUnion("type", [
    Schema.object({
      type: Schema.literal("a"),
      a: z
        .string()
        .refine(async () => true)
        .transform(async (val) => val),
    }),
    Schema.object({
      type: Schema.literal("b"),
      b: Schema.string(),
    }),
  ]);
  const result = await a.safeParseAsync({ type: "a", a: 1 });

  // expect(JSON.parse(e.message)).toEqual([
  //   {
  //     code: "invalid_type",
  //     expected: "string",
  //     input: 1,
  //     received: "number",
  //     path: ["a"],
  //     message: "Expected string, received number",
  //   },
  // ]);
  expect(result.error).toMatchInlineSnapshot(`
    [SchemaError: [
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [
          "a"
        ],
        "message": "Invalid input: expected string, received number"
      }
    ]]
  `);
});

test("valid - literals with .default or .pipe", () => {
  const schema = Schema.discriminatedUnion("type", [
    Schema.object({
      type: Schema.literal("foo").default("foo"),
      a: Schema.string(),
    }),
    Schema.object({
      type: Schema.literal("custom"),
      method: Schema.string(),
    }),
    Schema.object({
      type: Schema.literal("bar").transform((val) => val),
      c: Schema.string(),
    }),
  ]);
  expect(Schema.parse({ type: "foo", a: "foo" })).toEqual({
    type: "foo",
    a: "foo",
  });
});

test("enum and nativeEnum", () => {
  enum MyEnum {
    d = 0,
    e = "e",
  }

  const schema = Schema.discriminatedUnion("key", [
    Schema.object({
      key: Schema.literal("a"),
      // Add other properties specific to this option
    }),
    Schema.object({
      key: Schema.enum(["b", "c"]),
      // Add other properties specific to this option
    }),
    Schema.object({
      key: Schema.nativeEnum(MyEnum),
      // Add other properties specific to this option
    }),
  ]);

  type schema = Schema.infer<typeof schema>;
  expectTypeOf<schema>().toEqualTypeOf<{ key: "a" } | { key: "b" | "c" } | { key: MyEnum.d | MyEnum.e }>();

  Schema.parse({ key: "a" });
  Schema.parse({ key: "b" });
  Schema.parse({ key: "c" });
  Schema.parse({ key: MyEnum.d });
  Schema.parse({ key: MyEnum.e });
  Schema.parse({ key: "e" });
});

test("branded", () => {
  const schema = Schema.discriminatedUnion("key", [
    Schema.object({
      key: Schema.literal("a"),
      // Add other properties specific to this option
    }),
    Schema.object({
      key: Schema.literal("b").brand<"asdfasdf">(),
      // Add other properties specific to this option
    }),
  ]);

  type schema = Schema.infer<typeof schema>;
  expectTypeOf<schema>().toEqualTypeOf<{ key: "a" } | { key: "b" & Schema.core.$brand<"asdfasdf"> }>();

  Schema.parse({ key: "a" });
  Schema.parse({ key: "b" });
  expect(() => {
    Schema.parse({ key: "c" });
  }).toThrow();
});

test("optional and nullable", () => {
  const schema = Schema.discriminatedUnion("key", [
    Schema.object({
      key: Schema.literal("a").optional(),
      a: Schema.literal(true),
    }),
    Schema.object({
      key: Schema.literal("b").nullable(),
      b: Schema.literal(true),
      // Add other properties specific to this option
    }),
  ]);

  type schema = Schema.infer<typeof schema>;
  expectTypeOf<schema>().toEqualTypeOf<{ key?: "a" | undefined; a: true } | { key: "b" | null; b: true }>();

  Schema.parse({ key: "a", a: true });
  Schema.parse({ key: undefined, a: true });
  Schema.parse({ key: "b", b: true });
  Schema.parse({ key: null, b: true });
  expect(() => {
    Schema.parse({ key: null, a: true });
  }).toThrow();
  expect(() => {
    Schema.parse({ key: "b", a: true });
  }).toThrow();

  const value = Schema.parse({ key: null, b: true });

  if (!("key" in value)) value.a;
  if (value.key === undefined) value.a;
  if (value.key === "a") value.a;
  if (value.key === "b") value.b;
  if (value.key === null) value.b;
});

test("multiple discriminators", () => {
  const FreeConfig = Schema.object({
    type: Schema.literal("free"),
    min_cents: Schema.null(),
  });

  // console.log(FreeConfig.shape.type);
  const PricedConfig = Schema.object({
    type: Schema.literal("fiat-price"),
    // min_cents: Schema.int().nullable(),
    min_cents: Schema.null(),
  });

  const Config = Schema.discriminatedUnion("type", [FreeConfig, PricedConfig]);

  Config.parse({
    min_cents: null,
    type: "fiat-price",
    name: "Standard",
  });

  expect(() => {
    Config.parse({
      min_cents: null,
      type: "not real",
      name: "Standard",
    });
  }).toThrow();
});

test("single element union", () => {
  const schema = Schema.object({
    a: Schema.literal("discKey"),
    b: Schema.enum(["apple", "banana"]),
    c: Schema.object({ id: Schema.string() }),
  });

  const input = {
    a: "discKey",
    b: "apple",
    c: {}, // Invalid, as schema requires `id` property
  };

  // Validation must fail here, but it doesn't

  const u = Schema.discriminatedUnion("a", [schema]);
  const result = u.safeParse(input);
  expect(result).toMatchObject({ success: false });
  expect(result).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [
          "c",
          "id"
        ],
        "message": "Invalid input: expected string, received undefined"
      }
    ]],
      "success": false,
    }
  `);

  expect(u.options.length).toEqual(1);
});

test("nested discriminated unions", () => {
  const BaseError = Schema.object({ status: Schema.literal("failed"), message: Schema.string() });
  const MyErrors = Schema.discriminatedUnion("code", [
    BaseError.extend({ code: Schema.literal(400) }),
    BaseError.extend({ code: Schema.literal(401) }),
    BaseError.extend({ code: Schema.literal(500) }),
  ]);

  const MyResult = Schema.discriminatedUnion("status", [
    Schema.object({ status: Schema.literal("success"), data: Schema.string() }),
    MyErrors,
  ]);

  expect(MyErrors._schema.propValues).toMatchInlineSnapshot(`
    {
      "code": Set {
        400,
        401,
        500,
      },
      "status": Set {
        "failed",
      },
    }
  `);
  expect(MyResult._schema.propValues).toMatchInlineSnapshot(`
    {
      "code": Set {
        400,
        401,
        500,
      },
      "status": Set {
        "success",
        "failed",
      },
    }
  `);

  const result = MyResult.parse({ status: "success", data: "hello" });
  expect(result).toMatchInlineSnapshot(`
    {
      "data": "hello",
      "status": "success",
    }
  `);
  const result2 = MyResult.parse({ status: "failed", code: 400, message: "bad request" });
  expect(result2).toMatchInlineSnapshot(`
    {
      "code": 400,
      "message": "bad request",
      "status": "failed",
    }
  `);
  const result3 = MyResult.parse({ status: "failed", code: 401, message: "unauthorized" });
  expect(result3).toMatchInlineSnapshot(`
    {
      "code": 401,
      "message": "unauthorized",
      "status": "failed",
    }
  `);
  const result4 = MyResult.parse({ status: "failed", code: 500, message: "internal server error" });
  expect(result4).toMatchInlineSnapshot(`
    {
      "code": 500,
      "message": "internal server error",
      "status": "failed",
    }
  `);
});

test("readonly literal discriminator", () => {
  const discUnion = Schema.discriminatedUnion("type", [
    Schema.object({ type: Schema.literal("a").readonly(), a: Schema.string() }),
    Schema.object({ type: Schema.literal("b"), b: Schema.number() }),
  ]);

  // Test that both discriminator values are correctly included in propValues
  const propValues = discUnion._schema.propValues;
  expect(propValues?.type?.has("a")).toBe(true);
  expect(propValues?.type?.has("b")).toBe(true);

  // Test that the discriminated union works correctly
  const result1 = discUnion.parse({ type: "a", a: "hello" });
  expect(result1).toEqual({ type: "a", a: "hello" });

  const result2 = discUnion.parse({ type: "b", b: 42 });
  expect(result2).toEqual({ type: "b", b: 42 });

  // Test that invalid discriminator values are rejected
  expect(() => {
    discUnion.parse({ type: "c", a: "hello" });
  }).toThrow();
});

test("pipes", () => {
  const schema = z
    .object({
      type: Schema.literal("foo"),
    })
    .transform((s) => ({ ...s, v: 2 }));

  expect(Schema._schema.propValues).toMatchInlineSnapshot(`
    {
      "type": Set {
        "foo",
      },
    }
  `);

  const schema2 = Schema.object({
    type: Schema.literal("bar"),
  });

  const combinedSchema = Schema.discriminatedUnion("type", [schema, schema2], {
    unionFallback: false,
  });

  combinedSchema.parse({
    type: "foo",
    v: 2,
  });
});

test("def", () => {
  const schema = Schema.discriminatedUnion(
    "type",
    [Schema.object({ type: Schema.literal("play") }), Schema.object({ type: Schema.literal("pause") })],
    { unionFallback: true }
  );

  expect(Schema.def).toBeDefined();
  expect(Schema.def.discriminator).toEqual("type");
  expect(Schema.def.unionFallback).toEqual(true);
});

test("encode with codec discriminator", () => {
  const codec1 = Schema.codec(Schema.literal(1), Schema.literal("one"), {
    decode: () => "one" as const,
    encode: () => 1 as const,
  });

  const codec2 = Schema.codec(Schema.literal(2), Schema.literal("two"), {
    decode: () => "two" as const,
    encode: () => 2 as const,
  });

  const schema = Schema.discriminatedUnion("type", [
    Schema.object({ type: codec1, value: Schema.string() }),
    Schema.object({ type: codec2, value: Schema.number() }),
  ]);

  // decode (forward) should work
  const decoded = Schema.decode({ type: 1, value: "hello" });
  expect(decoded).toEqual({ type: "one", value: "hello" });

  // encode (backward) should also work — the discriminator values differ between forward (1, 2) and backward ("one", "two") directions
  const encoded = Schema.encode(schema, { type: "one", value: "hello" });
  expect(encoded).toEqual({ type: 1, value: "hello" });
});

test("nested encoding does not select a sibling from forward discriminator values", async () => {
  const tag = (value: "a" | "b") =>
    Schema.codec(Schema.literal(value).default(value), Schema.undefined(), {
      decode: () => undefined,
      encode: () => value,
    });
  const inner = Schema.discriminatedUnion("type", [
    Schema.object({ type: tag("a"), value: Schema.literal("a") }),
    Schema.object({ type: tag("b"), value: Schema.literal("b") }),
  ]);
  const outer = Schema.discriminatedUnion("type", [inner, Schema.object({ type: Schema.undefined(), value: Schema.string() })]);
  for (const value of ["a", "b"] as const) {
    const input = { type: undefined, value };
    const expected = { type: value, value };
    expect(Schema.encode(inner, input)).toEqual(expected);
    expect(Schema.encode(outer, input)).toEqual(expected);
    expect(await Schema.encodeAsync(outer, input)).toEqual(expected);
  }
});

test("getDiscriminatedOption", () => {
  const fruit = Schema.object({ type: Schema.literal("fruit"), seeds: Schema.boolean() });
  const veg = Schema.object({ type: Schema.literal("vegetable"), leafy: Schema.boolean() });
  const schema = Schema.discriminatedUnion("type", [fruit, veg]);

  expect(Schema.getDiscriminatedOption(schema, "fruit")).toBe(fruit);
  expect(Schema.getDiscriminatedOption(schema, "vegetable")).toBe(veg);

  // The result is narrowed to the one member, not the union of all of them.
  expectTypeOf(Schema.getDiscriminatedOption(schema, "fruit")).toEqualTypeOf<typeof fruit>();
  expectTypeOf(Schema.getDiscriminatedOption(schema, "vegetable")).toEqualTypeOf<typeof veg>();
  // @ts-expect-error — "unknown" is not a declared discriminator value
  Schema.getDiscriminatedOption(schema, "unknown");
});

test("getDiscriminatedOption — multi-value members and non-string discriminators", () => {
  const a = Schema.object({ type: Schema.literal(["x", "y"]), payload: Schema.string() });
  const b = Schema.object({ type: Schema.literal("z"), payload: Schema.number() });
  const multi = Schema.discriminatedUnion("type", [a, b]);
  expect(Schema.getDiscriminatedOption(multi, "x")).toBe(a);
  expect(Schema.getDiscriminatedOption(multi, "y")).toBe(a);
  expect(Schema.getDiscriminatedOption(multi, "z")).toBe(b);

  const num = Schema.object({ type: Schema.literal(1) });
  const bool = Schema.object({ type: Schema.literal(true) });
  const nul = Schema.object({ type: Schema.null() });
  const mixed = Schema.discriminatedUnion("type", [num, bool, nul]);
  expect(Schema.getDiscriminatedOption(mixed, 1)).toBe(num);
  expect(Schema.getDiscriminatedOption(mixed, true)).toBe(bool);
  expect(Schema.getDiscriminatedOption(mixed, null)).toBe(nul);

  // An omittable discriminator claims undefined, so it resolves like any other value.
  const opt = Schema.object({ type: Schema.literal("a").optional(), a: Schema.string() });
  const req = Schema.object({ type: Schema.literal("b"), b: Schema.string() });
  expect(Schema.getDiscriminatedOption(Schema.discriminatedUnion("type", [opt, req]), undefined)).toBe(opt);
});

test("getDiscriminatedOption caches in the bag and costs nothing until called", () => {
  const schema = Schema.discriminatedUnion("type", [Schema.object({ type: Schema.literal("a") }), Schema.object({ type: Schema.literal("b") })]);

  expect(Schema._schema.bag.optionsMap).toBeUndefined();
  expect(Schema.getDiscriminatedOption(schema, "a")).toBe(Schema.options[0]);
  const map = Schema._schema.bag.optionsMap;
  expect(map).toBeInstanceOf(Map);
  expect(Schema.getDiscriminatedOption(schema, "b")).toBe(Schema.options[1]);
  expect(Schema._schema.bag.optionsMap).toBe(map);

  // A clone recomputes rather than inheriting the cache.
  expect(Schema.clone()._schema.bag.optionsMap).toBeUndefined();
});

test.each(["__proto__", "constructor", "toString", "hasOwnProperty", "valueOf"])(
  "Object.prototype discriminator name: %s",
  (key) => {
    const first = Schema.object({ [key]: Schema.literal("a"), value: Schema.string() });
    const second = Schema.object({ [key]: Schema.literal("b"), value: Schema.number() });
    const schema = Schema.discriminatedUnion(key, [first, second]);

    expect(Schema._schema.propValues?.[key]).toEqual(new Set(["a", "b"]));

    const input = Object.fromEntries([
      [key, "a"],
      ["value", "ok"],
    ]);
    const parsed: any = Schema.parse(input);
    expect(Object.prototype.hasOwnProperty.call(parsed, key)).toBe(key !== "__proto__");
    if (key !== "__proto__") expect(parsed[key]).toBe("a");
    expect(parsed.value).toBe("ok");
  }
);

test("an omittable discriminator claims undefined", () => {
  const omittable = [
    Schema.exactOptional(Schema.literal("a")),
    Schema.optional(Schema.literal("a")),
    Schema.literal("a").default("a"),
    Schema.literal("a").prefault("a"),
    Schema.literal("a").catch("a"),
  ];
  for (const k of omittable) {
    expect(Schema.object({ k })._schema.propValues.k).toEqual(new Set(["a", undefined]));
  }

  // one option omits the key: it claims undefined, so an absent key routes there and the union agrees
  const options = [
    Schema.object({ k: Schema.exactOptional(Schema.literal("a")), x: Schema.string() }),
    Schema.object({ k: Schema.literal("b"), y: Schema.number() }),
  ] as const;
  expect(Schema.discriminatedUnion("k", options).safeParse({ x: "s" }).success).toEqual(true);
  expect(Schema.union(options).safeParse({ x: "s" }).success).toEqual(true);
  expect(Schema.discriminatedUnion("k", options).safeParse({ k: "b", y: 1 }).success).toEqual(true);

  // ambiguous absence does not prevent explicit tags from routing
  for (const k of omittable) {
    const schema = Schema.discriminatedUnion("k", [Schema.object({ k }), Schema.object({ k: Schema.exactOptional(Schema.literal("c")) })]);
    expect(Schema.parse({ k: "a" })).toEqual({ k: "a" });
    expect(Schema.parse({ k: "c" })).toEqual({ k: "c" });
    expect(Schema.safeParse({}).success).toBe(false);
  }
});

test("defaulted discriminators preserve tagged parsing without guessing a member", async () => {
  const a = Schema.object({ type: Schema.literal("a").default("a"), x: Schema.number().positive() });
  const b = Schema.object({ type: Schema.literal("b").default("b"), y: Schema.string() });
  const c = Schema.object({ type: Schema.literal("c").default("c"), z: Schema.boolean() });
  for (const options of [
    [a, b, c],
    [c, b, a],
  ] as const) {
    const schema = Schema.discriminatedUnion("type", options);
    for (const input of [a.parse({ x: 1 }), b.parse({ y: "s" }), c.parse({ Schema: true })]) {
      expect(Schema.parse(input)).toEqual(input);
      expect((await Schema.safeParseAsync(input)).success).toBe(true);
    }
    for (const input of [{ x: 1, y: "s", z: true }, { type: undefined }, { type: "other" }, { type: "a", x: -1 }]) {
      expect(Schema.safeParse(input).success).toBe(false);
      expect((await Schema.safeParseAsync(input)).success).toBe(false);
    }
    const result = Schema.safeParse({});
    expect(result.error?.issues[0]).toMatchObject({
      code: "invalid_union",
      path: ["type"],
      options: options.map((o) => o.shape.type.unwrap().value),
    });
    expect(Schema.getDiscriminatedOption(schema, "a")).toBe(a);
  }
  const unique = Schema.discriminatedUnion("type", [a, b.safeExtend({ type: b.shape.type.unwrap() })]);
  expect(unique.parse({ x: 1 })).toEqual({ type: "a", x: 1 });
});

test("undefined collisions are value-based and discriminator lookup rejects ambiguity", () => {
  const a = Schema.object({ type: Schema.literal("a").optional() });
  const absent = Schema.object({ type: Schema.undefined() });
  for (const options of [
    [a, absent],
    [absent, a],
    [absent, absent, a],
  ] as const) {
    const schema = Schema.discriminatedUnion("type", options);
    expect(Schema.parse({ type: "a" })).toEqual({ type: "a" });
    expect(Schema.safeParse({}).success).toBe(false);
    expect(() => Schema.getDiscriminatedOption(schema, undefined)).toThrow('Ambiguous discriminator value "undefined"');
  }
  const unique = Schema.discriminatedUnion("type", [absent, Schema.object({ type: Schema.literal("a") })]);
  expect(unique.parse({ type: undefined })).toEqual({ type: undefined });
  expect(Schema.getDiscriminatedOption(unique, undefined)).toBe(absent);
});

test("non-undefined discriminator collisions remain schema errors", () => {
  for (const tag of [Schema.literal("a").default("a"), Schema.literal(["a", "b"]), Schema.literal("a").nullable()]) {
    const schema = Schema.discriminatedUnion("type", [Schema.object({ type: tag }), Schema.object({ type: tag })]);
    expect(() => Schema.safeParse({ type: "a" })).toThrow(/Duplicate discriminator value/);
    expect(() => Schema.encode(schema, { type: "a" })).toThrow(/Duplicate discriminator value/);
    expect(() => Schema.getDiscriminatedOption(schema, "a")).toThrow(/Duplicate discriminator value/);
  }
  const nullable = Schema.discriminatedUnion("type", [
    Schema.object({ type: Schema.literal("a").nullable() }),
    Schema.object({ type: Schema.literal("b").nullable() }),
  ]);
  expect(() => nullable.safeParse({ type: "a" })).toThrow('Duplicate discriminator value "null"');
});

test("nested defaulted unions only advertise routable discriminator values", () => {
  const a = Schema.object({ type: Schema.literal("a").default("a"), group: Schema.literal("inner") });
  const b = Schema.object({ type: Schema.literal("b").default("b"), group: Schema.literal("inner") });
  const inner = Schema.discriminatedUnion("type", [a, b]);
  const c = Schema.object({ type: Schema.literal("c").default("c"), group: Schema.literal("outer") });
  expect(inner._schema.propValues.type).toEqual(new Set(["a", "b"]));
  for (const schema of [
    Schema.discriminatedUnion("type", [Schema.lazy(() => inner), c]),
    Schema.discriminatedUnion("group", [inner, c]),
  ]) {
    expect(Schema.parse({ type: "a", group: "inner" })).toEqual({ type: "a", group: "inner" });
    expect(Schema.parse({ group: "outer" })).toEqual({ type: "c", group: "outer" });
    expect(Schema.safeParse({ group: "inner" }).success).toBe(false);
  }
  const fallback = Schema.discriminatedUnion("type", [a, b], { unionFallback: true });
  expect(fallback._schema.propValues.type.has(undefined)).toBe(true);
  expect(fallback.parse({ group: "inner" })).toEqual({ type: "a", group: "inner" });
});
