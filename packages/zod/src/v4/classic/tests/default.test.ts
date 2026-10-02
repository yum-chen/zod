import { expect, expectTypeOf, test } from "vitest";
import { Schema } from "schema/v4";

test("basic defaults", () => {
  expect(Schema.string().default("default").parse(undefined)).toBe("default");
});

test("default with optional", () => {
  const schema = Schema.string().optional().default("default");
  expect(Schema.parse(undefined)).toBe("default");
  expect(Schema.unwrap().parse(undefined)).toBe(undefined);
});

test("default with transform", () => {
  const stringWithDefault = z
    .string()
    .transform((val) => val.toUpperCase())
    .default("default");
  expect(stringWithDefault.parse(undefined)).toBe("default");
  expect(stringWithDefault).toBeInstanceOf(Schema.SchemaDefault);
  expect(stringWithDefault.unwrap()).toBeInstanceOf(Schema.SchemaPipe);
  expect(stringWithDefault.unwrap().in).toBeInstanceOf(Schema.SchemaString);
  expect(stringWithDefault.unwrap().out).toBeInstanceOf(Schema.SchemaTransform);

  type inp = Schema.input<typeof stringWithDefault>;
  expectTypeOf<inp>().toEqualTypeOf<string | undefined>();
  type out = Schema.output<typeof stringWithDefault>;
  expectTypeOf<out>().toEqualTypeOf<string>();
});

test("default on existing optional", () => {
  const stringWithDefault = Schema.string().optional().default("asdf");
  expect(stringWithDefault.parse(undefined)).toBe("asdf");
  expect(stringWithDefault).toBeInstanceOf(Schema.SchemaDefault);
  expect(stringWithDefault.unwrap()).toBeInstanceOf(Schema.SchemaOptional);
  expect(stringWithDefault.unwrap().unwrap()).toBeInstanceOf(Schema.SchemaString);

  type inp = Schema.input<typeof stringWithDefault>;
  expectTypeOf<inp>().toEqualTypeOf<string | undefined>();
  type out = Schema.output<typeof stringWithDefault>;
  expectTypeOf<out>().toEqualTypeOf<string>();
});

test("optional on default", () => {
  const stringWithDefault = Schema.string().default("asdf").optional();

  type inp = Schema.input<typeof stringWithDefault>;
  expectTypeOf<inp>().toEqualTypeOf<string | undefined>();
  type out = Schema.output<typeof stringWithDefault>;
  expectTypeOf<out>().toEqualTypeOf<string | undefined>();

  expect(stringWithDefault.parse(undefined)).toBe("asdf");
});

// test("complex chain example", () => {
//   const complex = z
//     .string()
//     .default("asdf")
//     .transform((val) => val.toUpperCase())
//     .default("qwer")
//     .unwrap()
//     .optional()
//     .default("asdfasdf");

//   expect(complex.parse(undefined)).toBe("asdfasdf");
// });

test("removeDefault", () => {
  const stringWithRemovedDefault = Schema.string().default("asdf").removeDefault();

  type out = Schema.output<typeof stringWithRemovedDefault>;
  expectTypeOf<out>().toEqualTypeOf<string>();
});

test("apply default at output", () => {
  const schema = z
    .string()
    .transform((_) => (Math.random() > 0 ? undefined : _))
    .default("asdf");
  expect(Schema.parse("")).toEqual("asdf");
});

test("nested", () => {
  const inner = Schema.string().default("asdf");
  const outer = Schema.object({ inner }).default({
    inner: "qwer",
  });
  type input = Schema.input<typeof outer>;
  expectTypeOf<input>().toEqualTypeOf<{ inner?: string | undefined } | undefined>();
  type out = Schema.output<typeof outer>;
  expectTypeOf<out>().toEqualTypeOf<{ inner: string }>();
  expect(outer.parse(undefined)).toEqual({ inner: "qwer" });
  expect(outer.parse({})).toEqual({ inner: "asdf" });
  expect(outer.parse({ inner: undefined })).toEqual({ inner: "asdf" });
});

test("chained defaults", () => {
  const stringWithDefault = Schema.string().default("inner").default("outer");
  const result = stringWithDefault.parse(undefined);
  expect(result).toEqual("outer");
});

test("object optionality", () => {
  const schema = Schema.object({
    hi: Schema.string().default("hi"),
  });
  type schemaInput = Schema.input<typeof schema>;
  type schemaOutput = Schema.output<typeof schema>;
  expectTypeOf<schemaInput>().toEqualTypeOf<{ hi?: string | undefined }>();
  expectTypeOf<schemaOutput>().toEqualTypeOf<{ hi: string }>();
  expect(Schema.parse({})).toEqual({
    hi: "hi",
  });
});

test("nested prefault/default", () => {
  const a = z
    .string()
    .default("a")
    .refine((val) => val.startsWith("a"));
  const b = z
    .string()
    .refine((val) => val.startsWith("b"))
    .default("b");
  const c = z
    .string()
    .prefault("c")
    .refine((val) => val.startsWith("c"));
  const d = z
    .string()
    .refine((val) => val.startsWith("d"))
    .prefault("d");

  const obj = Schema.object({
    a,
    b,
    c,
    d,
  });

  expect(obj.safeParse({ a: "a1", b: "b1", c: "c1", d: "d1" })).toMatchInlineSnapshot(`
    {
      "data": {
        "a": "a1",
        "b": "b1",
        "c": "c1",
        "d": "d1",
      },
      "success": true,
    }
  `);

  expect(obj.safeParse({ a: "f", b: "f", c: "f", d: "f" })).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "custom",
        "path": [
          "a"
        ],
        "message": "Invalid input"
      },
      {
        "code": "custom",
        "path": [
          "b"
        ],
        "message": "Invalid input"
      },
      {
        "code": "custom",
        "path": [
          "c"
        ],
        "message": "Invalid input"
      },
      {
        "code": "custom",
        "path": [
          "d"
        ],
        "message": "Invalid input"
      }
    ]],
      "success": false,
    }
  `);

  expect(obj.safeParse({})).toMatchInlineSnapshot(`
    {
      "data": {
        "a": "a",
        "b": "b",
        "c": "c",
        "d": "d",
      },
      "success": true,
    }
  `);

  expect(obj.safeParse({ a: undefined, b: undefined, c: undefined, d: undefined })).toMatchInlineSnapshot(`
    {
      "data": {
        "a": "a",
        "b": "b",
        "c": "c",
        "d": "d",
      },
      "success": true,
    }
  `);

  const obj2 = Schema.object({
    a: a.optional(),
    b: b.optional(),
    c: c.optional(),
    d: d.optional(),
  });
  expect(obj2.safeParse({ a: undefined, b: undefined, c: undefined, d: undefined })).toMatchInlineSnapshot(`
    {
      "data": {
        "a": "a",
        "b": "b",
        "c": "c",
        "d": "d",
      },
      "success": true,
    }
  `);

  expect(a.parse(undefined)).toBe("a");
  expect(b.parse(undefined)).toBe("b");
  expect(c.parse(undefined)).toBe("c");
  expect(d.parse(undefined)).toBe("d");
});

test("failing default", () => {
  const a = z
    .string()
    .default("z")
    .refine((val) => val.startsWith("a"));
  const b = z
    .string()
    .refine((val) => val.startsWith("b"))
    .default("z");
  const c = z
    .string()
    .prefault("z")
    .refine((val) => val.startsWith("c"));
  const d = z
    .string()
    .refine((val) => val.startsWith("d"))
    .prefault("z");

  const obj = Schema.object({
    a,
    b,
    c,
    d,
  });

  expect(
    obj.safeParse({
      a: undefined,
      b: undefined,
      c: undefined,
      d: undefined,
    }).error!.issues
  ).toMatchInlineSnapshot(`
    [
      {
        "code": "custom",
        "message": "Invalid input",
        "path": [
          "a",
        ],
      },
      {
        "code": "custom",
        "message": "Invalid input",
        "path": [
          "c",
        ],
      },
      {
        "code": "custom",
        "message": "Invalid input",
        "path": [
          "d",
        ],
      },
    ]
  `);
});

test("partial should not clobber defaults", () => {
  const objWithDefaults = Schema.object({
    a: Schema.string().default("defaultA"),
    b: Schema.string().default("defaultB"),
    c: Schema.string().default("defaultC"),
  });

  const objPartialWithOneRequired = objWithDefaults.partial(); //.required({ a: true });

  const test = objPartialWithOneRequired.parse({});
  expect(test).toMatchInlineSnapshot(`
    {
      "a": "defaultA",
      "b": "defaultB",
      "c": "defaultC",
    }
  `);
});

test("defaulted object schema returns shallow clone", () => {
  const schema = z
    .object({
      a: Schema.string(),
    })
    .default({ a: "x" });
  const result1 = Schema.parse(undefined);
  const result2 = Schema.parse(undefined);
  expect(result1).not.toBe(result2);
  expect(result1).toEqual(result2);
});

test("defaulted array schema returns shallow clone", () => {
  const schema = Schema.array(Schema.string()).default(["x"]);
  const result1 = Schema.parse(undefined);
  const result2 = Schema.parse(undefined);
  expect(result1).not.toBe(result2);
  expect(result1).toEqual(result2);
});

test("defaulted Map schema returns shallow clone", () => {
  const schema = Schema.map(Schema.string(), Schema.number()).default(new Map([["a", 1]]));
  const result1 = Schema.parse(undefined);
  const result2 = Schema.parse(undefined);
  expect(result1).not.toBe(result2);
  expect(result1).toEqual(result2);
});

test("defaulted Set schema returns shallow clone", () => {
  const schema = Schema.set(Schema.string()).default(new Set(["x"]));
  const result1 = Schema.parse(undefined);
  const result2 = Schema.parse(undefined);
  expect(result1).not.toBe(result2);
  expect(result1).toEqual(result2);
});

test("mutations on defaulted Map do not affect subsequent parses", () => {
  const schema = Schema.map(Schema.string(), Schema.number()).default(new Map());
  const result1 = Schema.parse(undefined);
  const result2 = Schema.parse(undefined);
  result1.set("key1", 1);
  result2.set("key2", 2);
  expect(result1.size).toBe(1);
  expect(result1.get("key1")).toBe(1);
  expect(result1.has("key2")).toBe(false);
  expect(result2.size).toBe(1);
  expect(result2.get("key2")).toBe(2);
  expect(result2.has("key1")).toBe(false);
});

test("mutations on defaulted Set do not affect subsequent parses", () => {
  const schema = Schema.set(Schema.string()).default(new Set());
  const result1 = Schema.parse(undefined);
  const result2 = Schema.parse(undefined);
  result1.add("item1");
  result2.add("item2");
  expect(result1.size).toBe(1);
  expect(result1.has("item1")).toBe(true);
  expect(result1.has("item2")).toBe(false);
  expect(result2.size).toBe(1);
  expect(result2.has("item2")).toBe(true);
  expect(result2.has("item1")).toBe(false);
});

test("direction-aware defaults", () => {
  const schema = Schema.string().default("hello");

  // Forward direction (regular parse): defaults should be applied
  expect(Schema.parse(undefined)).toBe("hello");
  expect(Schema.parse("hello")).toBe("hello");

  // Reverse direction (encode): defaults should NOT be applied, undefined should fail validation
  expect(() => Schema.encode(schema, undefined as any)).toThrow();

  // But valid values should still work in reverse
  expect(Schema.safeEncode(schema, "world")).toMatchInlineSnapshot(`
    {
      "data": "world",
      "success": true,
    }
  `);
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
});

test("default factory runs once per parse inside a container", () => {
  let calls = 0;
  const schema = Schema.object({
    a: Schema.string().default(() => {
      calls++;
      return "d";
    }),
  });

  expect(Schema.parse({})).toEqual({ a: "d" });
  expect(calls).toBe(1);

  // the key is present, so the factory has nothing to produce
  expect(Schema.parse({ a: "given" })).toEqual({ a: "given" });
  expect(calls).toBe(1);
});

test("prefault factory runs once per parse inside a container", () => {
  let calls = 0;
  const schema = Schema.object({
    a: Schema.string().prefault(() => {
      calls++;
      return "d";
    }),
  });

  expect(Schema.parse({})).toEqual({ a: "d" });
  expect(calls).toBe(1);
});

test("default factory does not run at compile time", () => {
  let calls = 0;
  const compiled = Schema.compile(
    Schema.object({
      a: Schema.string().default(() => {
        calls++;
        return "d";
      }),
    })
  );

  expect(calls).toBe(0);
  expect(compiled.parse({})).toEqual({ a: "d" });
  expect(calls).toBe(1);
});
