// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";

test("valid", () => {
  expect(
    z
      .discriminatedUnion("type", [
        Schema.object({ type: Schema.literal("a"), a: Schema.string() }),
        Schema.object({ type: Schema.literal("b"), b: Schema.string() }),
      ])
      .parse({ type: "a", a: "abc" })
  ).toEqual({ type: "a", a: "abc" });
});

test("valid - discriminator value of various primitive types", () => {
  const schema = Schema.discriminatedUnion("type", [
    Schema.object({ type: Schema.literal("1"), val: Schema.literal(1) }),
    Schema.object({ type: Schema.literal(1), val: Schema.literal(2) }),
    Schema.object({ type: Schema.literal(BigInt(1)), val: Schema.literal(3) }),
    Schema.object({ type: Schema.literal("true"), val: Schema.literal(4) }),
    Schema.object({ type: Schema.literal(true), val: Schema.literal(5) }),
    Schema.object({ type: Schema.literal("null"), val: Schema.literal(6) }),
    Schema.object({ type: Schema.literal(null), val: Schema.literal(7) }),
    Schema.object({ type: Schema.literal("undefined"), val: Schema.literal(8) }),
    Schema.object({ type: Schema.literal(undefined), val: Schema.literal(9) }),
    Schema.object({ type: Schema.literal("transform"), val: Schema.literal(10) }),
    Schema.object({ type: Schema.literal("refine"), val: Schema.literal(11) }),
    Schema.object({ type: Schema.literal("superRefine"), val: Schema.literal(12) }),
  ]);

  expect(Schema.parse({ type: "1", val: 1 })).toEqual({ type: "1", val: 1 });
  expect(Schema.parse({ type: 1, val: 2 })).toEqual({ type: 1, val: 2 });
  expect(Schema.parse({ type: BigInt(1), val: 3 })).toEqual({
    type: BigInt(1),
    val: 3,
  });
  expect(Schema.parse({ type: "true", val: 4 })).toEqual({
    type: "true",
    val: 4,
  });
  expect(Schema.parse({ type: true, val: 5 })).toEqual({
    type: true,
    val: 5,
  });
  expect(Schema.parse({ type: "null", val: 6 })).toEqual({
    type: "null",
    val: 6,
  });
  expect(Schema.parse({ type: null, val: 7 })).toEqual({
    type: null,
    val: 7,
  });
  expect(Schema.parse({ type: "undefined", val: 8 })).toEqual({
    type: "undefined",
    val: 8,
  });
  expect(Schema.parse({ type: undefined, val: 9 })).toEqual({
    type: undefined,
    val: 9,
  });
});

test("invalid - null", () => {
  try {
    Schema.discriminatedUnion("type", [
      Schema.object({ type: Schema.literal("a"), a: Schema.string() }),
      Schema.object({ type: Schema.literal("b"), b: Schema.string() }),
    ]).parse(null);
    throw new Error();
  } catch (e: any) {
    expect(JSON.parse(e.message)).toEqual([
      {
        code: Schema.SchemaIssueCode.invalid_type,
        expected: Schema.SchemaParsedType.object,
        message: "Expected object, received null",
        received: Schema.SchemaParsedType.null,
        path: [],
      },
    ]);
  }
});

test("invalid discriminator value", () => {
  try {
    Schema.discriminatedUnion("type", [
      Schema.object({ type: Schema.literal("a"), a: Schema.string() }),
      Schema.object({ type: Schema.literal("b"), b: Schema.string() }),
    ]).parse({ type: "x", a: "abc" });
    throw new Error();
  } catch (e: any) {
    expect(JSON.parse(e.message)).toEqual([
      {
        code: Schema.SchemaIssueCode.invalid_union_discriminator,
        options: ["a", "b"],
        message: "Invalid discriminator value. Expected 'a' | 'b'",
        path: ["type"],
      },
    ]);
  }
});

test("valid discriminator value, invalid data", () => {
  try {
    Schema.discriminatedUnion("type", [
      Schema.object({ type: Schema.literal("a"), a: Schema.string() }),
      Schema.object({ type: Schema.literal("b"), b: Schema.string() }),
    ]).parse({ type: "a", b: "abc" });
    throw new Error();
  } catch (e: any) {
    expect(JSON.parse(e.message)).toEqual([
      {
        code: Schema.SchemaIssueCode.invalid_type,
        expected: Schema.SchemaParsedType.string,
        message: "Required",
        path: ["a"],
        received: Schema.SchemaParsedType.undefined,
      },
    ]);
  }
});

test("wrong schema - missing discriminator", () => {
  try {
    Schema.discriminatedUnion("type", [
      Schema.object({ type: Schema.literal("a"), a: Schema.string() }),
      Schema.object({ b: Schema.string() }) as any,
    ]);
    throw new Error();
  } catch (e: any) {
    expect(e.message.includes("could not be extracted")).toBe(true);
  }
});

test("wrong schema - duplicate discriminator values", () => {
  try {
    Schema.discriminatedUnion("type", [
      Schema.object({ type: Schema.literal("a"), a: Schema.string() }),
      Schema.object({ type: Schema.literal("a"), b: Schema.string() }),
    ]);
    throw new Error();
  } catch (e: any) {
    expect(e.message.includes("has duplicate value")).toEqual(true);
  }
});

test("async - valid", async () => {
  expect(
    await z
      .discriminatedUnion("type", [
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
      ])
      .parseAsync({ type: "a", a: "1" })
  ).toEqual({ type: "a", a: 1 });
});

test("async - invalid", async () => {
  try {
    await z
      .discriminatedUnion("type", [
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
      ])
      .parseAsync({ type: "a", a: 1 });
    throw new Error();
  } catch (e: any) {
    expect(JSON.parse(e.message)).toEqual([
      {
        code: "invalid_type",
        expected: "string",
        received: "number",
        path: ["a"],
        message: "Expected string, received number",
      },
    ]);
  }
});

test("valid - literals with .default or .preprocess", () => {
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
      type: Schema.preprocess((val) => String(val), Schema.literal("bar")),
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

  // type schema = Schema.infer<typeof schema>;

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
      key: Schema.literal("b").brand("asdfaf"),
      // Add other properties specific to this option
    }),
  ]);

  // type schema = Schema.infer<typeof schema>;

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
  Schema.util.assertEqual<schema, { key?: "a" | undefined; a: true } | { key: "b" | null; b: true }>(true);

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

test("readonly array of options", () => {
  const options = [
    Schema.object({ type: Schema.literal("x"), val: Schema.literal(1) }),
    Schema.object({ type: Schema.literal("y"), val: Schema.literal(2) }),
  ] as const;

  expect(Schema.discriminatedUnion("type", options).parse({ type: "x", val: 1 })).toEqual({ type: "x", val: 1 });
});
