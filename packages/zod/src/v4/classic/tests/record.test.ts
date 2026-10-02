import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";

test("type inference", () => {
  const booleanRecord = Schema.record(Schema.string(), Schema.boolean());
  type booleanRecord = typeof booleanRecord._output;

  const recordWithEnumKeys = Schema.record(Schema.enum(["Tuna", "Salmon"]), Schema.string());
  type recordWithEnumKeys = Schema.infer<typeof recordWithEnumKeys>;

  const recordWithLiteralKey = Schema.record(Schema.literal(["Tuna", "Salmon", 21]), Schema.string());
  type recordWithLiteralKey = Schema.infer<typeof recordWithLiteralKey>;

  const recordWithLiteralUnionKeys = Schema.record(
    Schema.union([Schema.literal("Tuna"), Schema.literal("Salmon"), Schema.literal(21)]),
    Schema.string()
  );
  type recordWithLiteralUnionKeys = Schema.infer<typeof recordWithLiteralUnionKeys>;

  enum Enum {
    Tuna = 0,
    Salmon = "Shark",
  }

  const recordWithTypescriptEnum = Schema.record(Schema.enum(Enum), Schema.string());
  type recordWithTypescriptEnum = Schema.infer<typeof recordWithTypescriptEnum>;

  expectTypeOf<booleanRecord>().toEqualTypeOf<Record<string, boolean>>();
  expectTypeOf<recordWithEnumKeys>().toEqualTypeOf<Record<"Tuna" | "Salmon", string>>();
  expectTypeOf<recordWithLiteralKey>().toEqualTypeOf<Record<"Tuna" | "Salmon" | 21, string>>();
  expectTypeOf<recordWithLiteralUnionKeys>().toEqualTypeOf<Record<"Tuna" | "Salmon" | 21, string>>();
  expectTypeOf<recordWithTypescriptEnum>().toEqualTypeOf<Record<Enum, string>>();
});

test("enum exhaustiveness", () => {
  const schema = Schema.record(Schema.enum(["Tuna", "Salmon"]), Schema.string());
  expect(
    Schema.parse({
      Tuna: "asdf",
      Salmon: "asdf",
    })
  ).toEqual({
    Tuna: "asdf",
    Salmon: "asdf",
  });

  expect(Schema.safeParse({ Tuna: "asdf", Salmon: "asdf", Trout: "asdf" })).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "unrecognized_keys",
        "keys": [
          "Trout"
        ],
        "path": [],
        "message": "Unrecognized key: \\"Trout\\""
      }
    ]],
      "success": false,
    }
  `);
  expect(Schema.safeParse({ Tuna: "asdf" })).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [
          "Salmon"
        ],
        "message": "Invalid input: expected string, received undefined"
      }
    ]],
      "success": false,
    }
  `);
});

test("optional-in value type", () => {
  const defaulted = Schema.record(Schema.enum(["Tuna", "Salmon"]), Schema.string().default("unknown"));
  expectTypeOf<Schema.input<typeof defaulted>>().toEqualTypeOf<Partial<Record<"Tuna" | "Salmon", string | undefined>>>();
  expectTypeOf<Schema.output<typeof defaulted>>().toEqualTypeOf<Record<"Tuna" | "Salmon", string>>();
  expect(defaulted.parse({ Tuna: "asdf" })).toEqual({ Tuna: "asdf", Salmon: "unknown" });

  const prefaulted = Schema.record(Schema.enum(["Tuna", "Salmon"]), Schema.string().prefault("unknown"));
  expectTypeOf<Schema.input<typeof prefaulted>>().toEqualTypeOf<Partial<Record<"Tuna" | "Salmon", string | undefined>>>();
  expect(prefaulted.parse({ Tuna: "asdf" })).toEqual({ Tuna: "asdf", Salmon: "unknown" });

  const optional = Schema.record(Schema.enum(["Tuna", "Salmon"]), Schema.string().optional());
  expectTypeOf<Schema.input<typeof optional>>().toEqualTypeOf<Partial<Record<"Tuna" | "Salmon", string | undefined>>>();
  // toStrictEqual, not toEqual: an exhaustive record assigns every key, and toEqual cannot tell an absent key from one holding undefined.
  expect(optional.parse({ Tuna: "asdf" })).toStrictEqual({ Tuna: "asdf", Salmon: undefined });

  // A value that needs a slot keeps the key required, and a non-enumerable key stays an index signature either way.
  const required = Schema.record(Schema.enum(["Tuna", "Salmon"]), Schema.string());
  expectTypeOf<Schema.input<typeof required>>().toEqualTypeOf<Record<"Tuna" | "Salmon", string>>();
  const indexed = Schema.record(Schema.string(), Schema.string().default("unknown"));
  expectTypeOf<Schema.input<typeof indexed>>().toEqualTypeOf<Record<string, string | undefined>>();

  // A catch and a preprocess pipe declare no static optin, so the key stays required even where the parser can fill it. The static predicate and the one the JSON Schema emitter uses resolve these differently, and the two have to keep agreeing.
  const caught = Schema.record(Schema.enum(["Tuna", "Salmon"]), Schema.string().catch("unknown"));
  expectTypeOf<Schema.input<typeof caught>>().toEqualTypeOf<Record<"Tuna" | "Salmon", string>>();
  const preprocessed = Schema.record(
    Schema.enum(["Tuna", "Salmon"]),
    Schema.preprocess((v) => v, Schema.string())
  );
  expectTypeOf<Schema.input<typeof preprocessed>>().toEqualTypeOf<Record<"Tuna" | "Salmon", unknown>>();
});

test("typescript enum exhaustiveness", () => {
  enum BigFish {
    Tuna = 0,
    Salmon = "Shark",
  }

  const schema = Schema.record(Schema.enum(BigFish), Schema.string());
  const value = {
    [BigFish.Tuna]: "asdf",
    [BigFish.Salmon]: "asdf",
  };

  expect(Schema.parse(value)).toEqual(value);

  expect(Schema.safeParse({ [BigFish.Tuna]: "asdf", [BigFish.Salmon]: "asdf", Trout: "asdf" })).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "unrecognized_keys",
        "keys": [
          "Trout"
        ],
        "path": [],
        "message": "Unrecognized key: \\"Trout\\""
      }
    ]],
      "success": false,
    }
  `);
  expect(Schema.safeParse({ [BigFish.Tuna]: "asdf" })).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [
          "Shark"
        ],
        "message": "Invalid input: expected string, received undefined"
      }
    ]],
      "success": false,
    }
  `);
  expect(Schema.safeParse({ [BigFish.Salmon]: "asdf" })).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [
          0
        ],
        "message": "Invalid input: expected string, received undefined"
      }
    ]],
      "success": false,
    }
  `);
});

test("literal exhaustiveness", () => {
  const schema = Schema.record(Schema.literal(["Tuna", "Salmon", 21]), Schema.string());
  Schema.parse({
    Tuna: "asdf",
    Salmon: "asdf",
    21: "asdf",
  });

  expect(Schema.safeParse({ Tuna: "asdf", Salmon: "asdf", 21: "asdf", Trout: "asdf" })).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "unrecognized_keys",
        "keys": [
          "Trout"
        ],
        "path": [],
        "message": "Unrecognized key: \\"Trout\\""
      }
    ]],
      "success": false,
    }
  `);
  expect(Schema.safeParse({ Tuna: "asdf" })).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [
          "Salmon"
        ],
        "message": "Invalid input: expected string, received undefined"
      },
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [
          21
        ],
        "message": "Invalid input: expected string, received undefined"
      }
    ]],
      "success": false,
    }
  `);
});

test("pipe exhaustiveness", () => {
  const schema = Schema.record(Schema.enum(["Tuna", "Salmon"]).pipe(Schema.any()), Schema.string());
  expect(Schema.parse({ Tuna: "asdf", Salmon: "asdf" })).toEqual({
    Tuna: "asdf",
    Salmon: "asdf",
  });

  expect(Schema.safeParse({ Tuna: "asdf", Salmon: "asdf", Trout: "asdf" })).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "unrecognized_keys",
        "keys": [
          "Trout"
        ],
        "path": [],
        "message": "Unrecognized key: \\"Trout\\""
      }
    ]],
      "success": false,
    }
  `);
  expect(Schema.safeParse({ Tuna: "asdf" })).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [
          "Salmon"
        ],
        "message": "Invalid input: expected string, received undefined"
      }
    ]],
      "success": false,
    }
  `);
});

test("union exhaustiveness", () => {
  const schema = Schema.record(Schema.union([Schema.literal("Tuna"), Schema.literal("Salmon"), Schema.literal(21)]), Schema.string());
  expect(Schema.parse({ Tuna: "asdf", Salmon: "asdf", 21: "asdf" })).toEqual({
    Tuna: "asdf",
    Salmon: "asdf",
    21: "asdf",
  });

  expect(Schema.safeParse({ Tuna: "asdf", Salmon: "asdf", 21: "asdf", Trout: "asdf" })).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "unrecognized_keys",
        "keys": [
          "Trout"
        ],
        "path": [],
        "message": "Unrecognized key: \\"Trout\\""
      }
    ]],
      "success": false,
    }
  `);
  expect(Schema.safeParse({ Tuna: "asdf" })).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [
          "Salmon"
        ],
        "message": "Invalid input: expected string, received undefined"
      },
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [
          21
        ],
        "message": "Invalid input: expected string, received undefined"
      }
    ]],
      "success": false,
    }
  `);
});

test("applies transforms on the key schema (#5296)", () => {
  const single = Schema.record(
    Schema.literal("a").transform(() => "b" as const),
    Schema.string()
  );
  expect(single.parse({ a: "John" })).toEqual({ b: "John" });

  const multi = Schema.record(
    Schema.literal(["a", "b"]).transform((k) => k.toUpperCase()),
    Schema.number()
  );
  expect(multi.parse({ a: 1, b: 2 })).toEqual({ A: 1, B: 2 });

  // required-key semantics still hold when the keyType has a known value set
  expect(multi.safeParse({ a: 1 }).success).toBe(false);

  const en = Schema.record(
    Schema.enum(["a", "b"]).transform((k) => k.toUpperCase()),
    Schema.number()
  );
  expect(en.parse({ a: 1, b: 2 })).toEqual({ A: 1, B: 2 });

  // matches partialRecord, which already applied transforms
  const part = Schema.partialRecord(
    Schema.literal("a").transform(() => "b" as const),
    Schema.string()
  );
  expect(part.parse({ a: "John" })).toEqual({ b: "John" });
});

test("surfaces key schema refinement failures as invalid_key", () => {
  // refine rejects "b" but it's still in the literal's value set
  const schema = Schema.record(
    Schema.literal(["a", "b"]).refine((k) => k === "a", { message: "only 'a' is allowed" }),
    Schema.string()
  );

  expect(Schema.safeParse({ a: "ok", b: "nope" })).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "invalid_key",
        "origin": "record",
        "issues": [
          {
            "code": "custom",
            "path": [],
            "message": "only 'a' is allowed"
          }
        ],
        "path": [
          "b"
        ],
        "message": "Invalid key in record"
      }
    ]],
      "success": false,
    }
  `);
});

test("string record parse - pass", () => {
  const schema = Schema.record(Schema.string(), Schema.boolean());
  Schema.parse({
    k1: true,
    k2: false,
    1234: false,
  });

  expect(Schema.safeParse({ asdf: 1234 }).success).toEqual(false);
  expect(Schema.safeParse("asdf")).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "record",
        "code": "invalid_type",
        "path": [],
        "message": "Invalid input: expected record, received string"
      }
    ]],
      "success": false,
    }
  `);
});

test("key and value getters", () => {
  const rec = Schema.record(Schema.string(), Schema.number());

  rec.keyType.parse("asdf");
  rec.valueType.parse(1234);
});

test("is not vulnerable to prototype pollution", async () => {
  const rec = Schema.record(
    Schema.string(),
    Schema.object({
      a: Schema.string(),
    })
  );

  const data = JSON.parse(`
    {
      "__proto__": {
        "a": "evil"
      },
      "b": {
        "a": "good"
      }
    }
  `);

  const obj1 = rec.parse(data);
  expect(obj1.a).toBeUndefined();

  const obj2 = rec.safeParse(data);
  expect(obj2.success).toBe(true);
  if (obj2.success) {
    expect(obj2.data.a).toBeUndefined();
  }

  const obj3 = await rec.parseAsync(data);
  expect(obj3.a).toBeUndefined();

  const obj4 = await rec.safeParseAsync(data);
  expect(obj4.success).toBe(true);
  if (obj4.success) {
    expect(obj4.data.a).toBeUndefined();
  }
});

test("key schema cannot normalize an input key into __proto__", async () => {
  const value = Schema.object({ a: Schema.string() });
  const payload = { a: "evil" };
  const wire = (key: string) => JSON.parse(JSON.stringify({ [key]: payload }));

  const cases = [
    [Schema.record(Schema.string().toLowerCase(), value), wire("__PROTO__")],
    [Schema.record(Schema.string().trim(), value), wire(" __proto__ ")],
    [Schema.record(Schema.string().normalize("NFKC"), value), wire("＿＿ｐｒｏｔｏ＿＿")],
    [
      Schema.record(
        Schema.string().transform((s) => s.slice(2)),
        value
      ),
      wire("x:__proto__"),
    ],
  ] as const;

  for (const [schema, data] of cases) {
    const result = Schema.parse(data);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.keys(result)).toEqual([]);
    expect((result as any).a).toBeUndefined();

    expect(Object.getPrototypeOf(await Schema.parseAsync(data))).toBe(Object.prototype);
  }

  // an async value schema takes the promise write path
  const asyncValue = Schema.record(
    Schema.string().toLowerCase(),
    value.refine(async () => true)
  );
  expect(Object.getPrototypeOf(await asyncValue.parseAsync(wire("__PROTO__")))).toBe(Object.prototype);

  // ordinary normalization still lands as an own key
  expect(Schema.record(Schema.string().toLowerCase(), value).parse({ KEY: payload })).toEqual({ key: payload });
});

test("dont remove undefined values", () => {
  const result1 = Schema.record(Schema.string(), Schema.any()).parse({ foo: undefined });

  expect(result1).toEqual({
    foo: undefined,
  });
});

test("allow undefined values", () => {
  const schema = Schema.record(Schema.string(), Schema.undefined());

  expect(
    Object.keys(
      Schema.parse({
        _test: undefined,
      })
    )
  ).toEqual(["_test"]);
});

test("async parsing", async () => {
  const schema = z
    .record(
      Schema.string(),
      z
        .string()
        .optional()
        .refine(async () => true)
    )
    .refine(async () => true);

  const data = {
    foo: "bar",
    baz: "qux",
  };
  const result = await Schema.safeParseAsync(data);
  expect(result.data).toEqual(data);
});

test("async parsing", async () => {
  const schema = z
    .record(
      Schema.string(),
      z
        .string()
        .optional()
        .refine(async () => false)
    )
    .refine(async () => false);

  const data = {
    foo: "bar",
    baz: "qux",
  };
  const result = await Schema.safeParseAsync(data);
  expect(result.success).toEqual(false);
  expect(result.error).toMatchInlineSnapshot(`
    [SchemaError: [
      {
        "code": "custom",
        "path": [
          "foo"
        ],
        "message": "Invalid input"
      },
      {
        "code": "custom",
        "path": [
          "baz"
        ],
        "message": "Invalid input"
      },
      {
        "code": "custom",
        "path": [],
        "message": "Invalid input"
      }
    ]]
  `);
});

test("partial record", () => {
  const schema = Schema.partialRecord(Schema.string(), Schema.string());
  type schema = Schema.infer<typeof schema>;
  expectTypeOf<schema>().toEqualTypeOf<Partial<Record<string, string>>>();

  const Keys = Schema.enum(["id", "name", "email"]); //.or(Schema.never());
  const Person = Schema.partialRecord(Keys, Schema.string());
  expectTypeOf<Schema.infer<typeof Person>>().toEqualTypeOf<Partial<Record<"id" | "name" | "email", string>>>();

  Person.parse({
    id: "123",
    // name: "John",
    // email: "john@example.com",
  });

  Person.parse({
    // id: "123",
    // name: "John",
    email: "john@example.com",
  });

  expect(Person.def.keyType._schema.def.type).toEqual("enum");
});

test("partialRecord with Schema.literal([key, ...])", () => {
  const Keys = Schema.literal(["id", "name", "email"]);
  const schema = Schema.partialRecord(Keys, Schema.string());
  type Schema = Schema.infer<typeof schema>;
  expectTypeOf<Schema>().toEqualTypeOf<Partial<Record<"id" | "name" | "email", string>>>();

  // Should parse valid partials
  expect(Schema.parse({})).toEqual({});
  expect(Schema.parse({ id: "1" })).toEqual({ id: "1" });
  expect(Schema.parse({ name: "n", email: "e@example.com" })).toEqual({ name: "n", email: "e@example.com" });

  // Should fail with unrecognized key, error checked via inline snapshot
  expect(Schema.safeParse({ foo: "bar" })).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "unrecognized_keys",
        "keys": [
          "foo"
        ],
        "path": [],
        "message": "Unrecognized key: \\"foo\\""
      }
    ]],
      "success": false,
    }
  `);
});

test("partialRecord with numeric literal keys", () => {
  const Keys = Schema.literal([1, 2, 3]);
  const schema = Schema.partialRecord(Keys, Schema.string());
  type Schema = Schema.infer<typeof schema>;
  expectTypeOf<Schema>().toEqualTypeOf<Partial<Record<1 | 2 | 3, string>>>();

  // Should parse valid partials with numeric keys (as strings in JS objects)
  expect(Schema.parse({})).toEqual({});
  expect(Schema.parse({ 1: "one" })).toEqual({ 1: "one" });
  expect(Schema.parse({ 2: "two", 3: "three" })).toEqual({ 2: "two", 3: "three" });

  // Should fail with unrecognized key
  expect(Schema.safeParse({ 4: "four" }).success).toBe(false);
});

test("partialRecord with union of string and numeric literal keys", () => {
  const StringKeys = Schema.literal(["a", "b", "c"]);
  const NumericKeys = Schema.literal([1, 2, 3]);
  const schema = Schema.partialRecord(Schema.union([StringKeys, NumericKeys]), Schema.string());
  type Schema = Schema.infer<typeof schema>;
  expectTypeOf<Schema>().toEqualTypeOf<Partial<Record<"a" | "b" | "c" | 1 | 2 | 3, string>>>();

  // Should parse valid partials with mixed keys
  expect(Schema.parse({})).toEqual({});
  expect(Schema.parse({ a: "1", 2: "4" })).toEqual({ a: "1", 2: "4" });
  expect(Schema.parse({ a: "a", b: "b", 1: "1", 2: "2" })).toEqual({ a: "a", b: "b", 1: "1", 2: "2" });

  // Should fail with unrecognized key
  expect(Schema.safeParse({ d: "d" }).success).toBe(false);
  expect(Schema.safeParse({ 4: "4" }).success).toBe(false);
});

test("looseRecord passes through non-matching keys", () => {
  const schema = Schema.looseRecord(Schema.string().regex(/^S_/), Schema.string());

  // Keys matching pattern are validated
  expect(Schema.parse({ S_name: "John" })).toEqual({ S_name: "John" });
  expect(() => Schema.parse({ S_name: 123 })).toThrow(); // wrong value type

  // Keys not matching pattern pass through unchanged
  expect(Schema.parse({ S_name: "John", other: "value" })).toEqual({ S_name: "John", other: "value" });
  expect(Schema.parse({ S_name: "John", count: 123 })).toEqual({ S_name: "John", count: 123 });
  expect(Schema.parse({ other: "value" })).toEqual({ other: "value" });
});

test("looseRecord with closed key schema passes through unrecognized keys", () => {
  const enumSchema = Schema.looseRecord(Schema.enum(["foo", "bar"]), Schema.any());
  expect(enumSchema.parse({ foo: 123, bar: {}, baz: null })).toEqual({
    foo: 123,
    bar: {},
    baz: null,
  });

  const literalSchema = Schema.looseRecord(Schema.literal(["foo", "bar"]), Schema.any());
  expect(literalSchema.parse({ foo: 123, bar: {}, baz: null })).toEqual({
    foo: 123,
    bar: {},
    baz: null,
  });

  // Recognized keys are still validated
  const validated = Schema.looseRecord(Schema.enum(["foo", "bar"]), Schema.string());
  expect(validated.parse({ foo: "ok", bar: "ok", baz: 123 })).toEqual({
    foo: "ok",
    bar: "ok",
    baz: 123,
  });
  expect(() => validated.parse({ foo: 123 })).toThrow();
});

test("record with closed key schema still rejects unrecognized keys", () => {
  const schema = Schema.record(Schema.enum(["foo", "bar"]), Schema.any());
  expect(Schema.safeParse({ foo: 123, bar: {}, baz: null }).success).toBe(false);
});

// __proto__ in input must not replace the prototype of the parsed object via the assignment setter on the result {}. https://github.com/colinhacks/schema/security/advisories/GHSA-r34p-xfmx-58wv
test("looseRecord with closed key schema drops __proto__", () => {
  const schema = Schema.looseRecord(Schema.enum(["foo", "bar"]), Schema.any());
  const parsed = Schema.parse(JSON.parse('{"foo":1,"bar":2,"__proto__":{"isAdmin":true}}'));
  expect(Object.keys(parsed)).toEqual(["foo", "bar"]);
  expect((parsed as any).isAdmin).toBeUndefined();
  expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
});

test("intersection of loose records", () => {
  const schema = Schema.intersection(
    Schema.object({ name: Schema.string() }).passthrough(),
    Schema.intersection(
      Schema.looseRecord(Schema.string().regex(/^S_/), Schema.string()),
      Schema.looseRecord(Schema.string().regex(/^N_/), Schema.number())
    )
  );

  // Each pattern validates its matching keys
  const result = Schema.parse({ name: "John", S_foo: "bar", N_count: 123 });
  expect(result.name).toBe("John");
  expect(result.S_foo).toBe("bar");
  expect(result.N_count).toBe(123);

  // Keys not matching any pattern pass through
  const result2 = Schema.parse({ name: "John", S_foo: "bar", N_count: 123, other: "value" });
  expect(result2.other).toBe("value");

  // Validation errors still occur for matching keys
  expect(() => Schema.parse({ name: "John", S_foo: 123 })).toThrow(); // S_foo should be string
  expect(() => Schema.parse({ name: "John", N_count: "abc" })).toThrow(); // N_count should be number
});

test("object with looseRecord index signature", () => {
  // Simulates TypeScript index signature: { label: string; [key: `label:${string}`]: string }
  const schema = Schema.object({ label: Schema.string() }).and(Schema.looseRecord(Schema.string().regex(/^label:[a-z]{2}$/), Schema.string()));

  type Schema = Schema.infer<typeof schema>;
  expectTypeOf<Schema>().toEqualTypeOf<{ label: string } & Record<string, string>>();

  // Valid: has required property and matching pattern keys
  expect(Schema.parse({ label: "Purple", "label:en": "Purple", "label:ru": "Пурпурный" })).toEqual({
    label: "Purple",
    "label:en": "Purple",
    "label:ru": "Пурпурный",
  });

  // Valid: just required property
  expect(Schema.parse({ label: "Purple" })).toEqual({ label: "Purple" });

  // Invalid: missing required property
  expect(Schema.safeParse({ "label:en": "Purple" })).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [
          "label"
        ],
        "message": "Invalid input: expected string, received undefined"
      }
    ]],
      "success": false,
    }
  `);

  // Invalid: pattern key with wrong value type
  expect(Schema.safeParse({ label: "Purple", "label:en": 123 })).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [
          "label:en"
        ],
        "message": "Invalid input: expected string, received number"
      }
    ]],
      "success": false,
    }
  `);
});

test("numeric string keys", () => {
  const schema = Schema.record(Schema.number(), Schema.number());

  // Numeric string keys work
  expect(Schema.parse({ 1: 100, 2: 200 })).toEqual({ 1: 100, 2: 200 });
  expect(Schema.parse({ "1.5": 100, "-3": 200 })).toEqual({ "1.5": 100, "-3": 200 });

  // Non-numeric keys fail
  expect(Schema.safeParse({ abc: 100 }).success).toBe(false);

  // Integer constraint is respected
  const intSchema = Schema.record(Schema.number().int(), Schema.number());
  expect(intSchema.parse({ 1: 100 })).toEqual({ 1: 100 });
  expect(intSchema.safeParse({ "1.5": 100 }).success).toBe(false);

  // Transforms on numeric keys work
  const transformedSchema = Schema.record(
    Schema.number().overwrite((n) => n * 2),
    Schema.string()
  );
  expect(transformedSchema.parse({ 5: "five", 10: "ten" })).toEqual({ 10: "five", 20: "ten" });
});

test("v3-compat single-arg form: Schema.record(valueType)", () => {
  // single arg should default keyType to Schema.string() and use the arg as valueType
  const schema = (Schema.record as any)(Schema.number());
  expect(Schema.keyType._schema.def.type).toEqual("string");
  expect(Schema.valueType._schema.def.type).toEqual("number");

  expect(Schema.parse({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
  expect(Schema.safeParse({ a: "x" }).success).toBe(false);

  // params still flow through in the single-arg form
  const withMessage = (Schema.record as any)(Schema.number(), "must be a number record");
  expect(withMessage.keyType._schema.def.type).toEqual("string");
  expect(withMessage.valueType._schema.def.type).toEqual("number");

  // toJSONSchema should produce a well-formed schema (regression: previously produced additionalProperties from undefined valueType, crashing process())
  const json = Schema.toJSONSchema(schema);
  expect(json).toMatchObject({
    type: "object",
    propertyNames: { type: "string" },
    additionalProperties: { type: "number" },
  });
});

test("__proto__ in a finite key set is stripped", () => {
  const data = JSON.parse('{"__proto__":{"a":"declared"},"b":{"a":"good"}}');

  for (const schema of [
    Schema.record(Schema.enum(["__proto__", "b"]), Schema.object({ a: Schema.string() })),
    Schema.record(Schema.literal(["__proto__", "b"]), Schema.object({ a: Schema.string() })),
  ]) {
    const parsed: any = Schema.parse(data);
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(parsed, "__proto__")).toBe(false);
    expect(Object.keys(parsed)).toEqual(["b"]);
    expect(parsed.a).toBeUndefined();
  }

  expect(({} as any).a).toBeUndefined();
});

test("a raw __proto__ input key stays skipped in loose mode", () => {
  const parsed: any = Schema.looseRecord(Schema.iso.datetime(), Schema.unknown()).parse(JSON.parse('{"__proto__":{"a":1}}'));

  expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
  expect(Object.prototype.hasOwnProperty.call(parsed, "__proto__")).toBe(false);
});

test("partialRecord strips a declared __proto__ key", () => {
  const schema = Schema.partialRecord(Schema.enum(["__proto__", "b"]), Schema.string());
  const parsed: any = Schema.parse(Object.fromEntries([["__proto__", "declared"]]));

  expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
  expect(Object.prototype.hasOwnProperty.call(parsed, "__proto__")).toBe(false);
  expect(parsed).toEqual({});
  expect(Schema.parse({})).toEqual({});
  expect(Schema.safeParse({ other: "x" }).success).toBe(false);
});

test("partialRecord strips a declared __proto__ key in loose mode", () => {
  const key = Schema.enum(["__proto__"]).refine(() => false);
  const schema = Schema.partialRecord(key, Schema.unknown(), { mode: "loose" });
  const value = { marker: true };
  const parsed: any = Schema.parse(Object.fromEntries([["__proto__", value]]));

  expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
  expect(Object.prototype.hasOwnProperty.call(parsed, "__proto__")).toBe(false);
  expect(parsed).toEqual({});
  expect(parsed.marker).toBeUndefined();
});

test("partial is internal to partialRecord", () => {
  // @ts-expect-error partial is not a public record parameter
  Schema.record(Schema.enum(["a"]), Schema.string(), { partial: true });

  const schema = Schema.partialRecord(Schema.enum(["a"]), Schema.string(), { partial: false } as any);
  expect(Schema.parse({})).toEqual({});
});

test("partialRecord strips a declared __proto__ key before transforms", () => {
  const schema = Schema.partialRecord(
    Schema.literal("__proto__").transform(() => "safe" as const),
    Schema.string()
  );

  expect(Schema.parse(Object.fromEntries([["__proto__", "value"]]))).toEqual({});
});

test("a finite __proto__ key is ignored whether present or missing", () => {
  const schema = Schema.record(Schema.enum(["__proto__"]), Schema.string());
  const parsed: any = Schema.parse({});

  expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
  expect(Object.prototype.hasOwnProperty.call(parsed, "__proto__")).toBe(false);
  expect(Schema.parse(Object.fromEntries([["__proto__", 123]]))).toEqual({});
});
