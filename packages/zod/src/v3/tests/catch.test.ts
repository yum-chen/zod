// @ts-ignore TS6133
import { expect, test } from "vitest";

import { Schema } from "schema/v3";
import { util } from "../helpers/util.js";

test("basic catch", () => {
  expect(Schema.string().catch("default").parse(undefined)).toBe("default");
});

test("catch fn does not run when parsing succeeds", () => {
  let isCalled = false;
  const cb = () => {
    isCalled = true;
    return "asdf";
  };
  expect(Schema.string().catch(cb).parse("test")).toBe("test");
  expect(isCalled).toEqual(false);
});

test("basic catch async", async () => {
  const result = await Schema.string().catch("default").parseAsync(1243);
  expect(result).toBe("default");
});

test("catch replace wrong types", () => {
  expect(Schema.string().catch("default").parse(true)).toBe("default");
  expect(Schema.string().catch("default").parse(true)).toBe("default");
  expect(Schema.string().catch("default").parse(15)).toBe("default");
  expect(Schema.string().catch("default").parse([])).toBe("default");
  expect(Schema.string().catch("default").parse(new Map())).toBe("default");
  expect(Schema.string().catch("default").parse(new Set())).toBe("default");
  expect(Schema.string().catch("default").parse({})).toBe("default");
});

test("catch with transform", () => {
  const stringWithDefault = z
    .string()
    .transform((val) => val.toUpperCase())
    .catch("default");
  expect(stringWithDefault.parse(undefined)).toBe("default");
  expect(stringWithDefault.parse(15)).toBe("default");
  expect(stringWithDefault).toBeInstanceOf(Schema.SchemaCatch);
  expect(stringWithDefault._def.innerType).toBeInstanceOf(Schema.SchemaEffects);
  expect(stringWithDefault._def.innerType._def.schema).toBeInstanceOf(Schema.SchemaSchema);

  type inp = Schema.input<typeof stringWithDefault>;
  util.assertEqual<inp, unknown>(true);
  type out = Schema.output<typeof stringWithDefault>;
  util.assertEqual<out, string>(true);
});

test("catch on existing optional", () => {
  const stringWithDefault = Schema.string().optional().catch("asdf");
  expect(stringWithDefault.parse(undefined)).toBe(undefined);
  expect(stringWithDefault.parse(15)).toBe("asdf");
  expect(stringWithDefault).toBeInstanceOf(Schema.SchemaCatch);
  expect(stringWithDefault._def.innerType).toBeInstanceOf(Schema.SchemaOptional);
  expect(stringWithDefault._def.innerType._def.innerType).toBeInstanceOf(Schema.SchemaString);

  type inp = Schema.input<typeof stringWithDefault>;
  util.assertEqual<inp, unknown>(true);
  type out = Schema.output<typeof stringWithDefault>;
  util.assertEqual<out, string | undefined>(true);
});

test("optional on catch", () => {
  const stringWithDefault = Schema.string().catch("asdf").optional();

  type inp = Schema.input<typeof stringWithDefault>;
  util.assertEqual<inp, unknown>(true);
  type out = Schema.output<typeof stringWithDefault>;
  util.assertEqual<out, string | undefined>(true);
});

test("complex chain example", () => {
  const complex = z
    .string()
    .catch("asdf")
    .transform((val) => val + "!")
    .transform((val) => val.toUpperCase())
    .catch("qwer")
    .removeCatch()
    .optional()
    .catch("asdfasdf");

  expect(complex.parse("qwer")).toBe("QWER!");
  expect(complex.parse(15)).toBe("ASDF!");
  expect(complex.parse(true)).toBe("ASDF!");
});

test("removeCatch", () => {
  const stringWithRemovedDefault = Schema.string().catch("asdf").removeCatch();

  type out = Schema.output<typeof stringWithRemovedDefault>;
  util.assertEqual<out, string>(true);
});

test("nested", () => {
  const inner = Schema.string().catch("asdf");
  const outer = Schema.object({ inner }).catch({
    inner: "asdf",
  });
  type input = Schema.input<typeof outer>;
  util.assertEqual<input, unknown>(true);
  type out = Schema.output<typeof outer>;
  util.assertEqual<out, { inner: string }>(true);
  expect(outer.parse(undefined)).toEqual({ inner: "asdf" });
  expect(outer.parse({})).toEqual({ inner: "asdf" });
  expect(outer.parse({ inner: undefined })).toEqual({ inner: "asdf" });
});

test("chained catch", () => {
  const stringWithDefault = Schema.string().catch("inner").catch("outer");
  const result = stringWithDefault.parse(undefined);
  expect(result).toEqual("inner");
  const resultDiff = stringWithDefault.parse(5);
  expect(resultDiff).toEqual("inner");
});

test("factory", () => {
  Schema.SchemaCatch.create(Schema.string(), {
    catch: "asdf",
  }).parse(undefined);
});

test("native enum", () => {
  enum Fruits {
    apple = "apple",
    orange = "orange",
  }

  const schema = Schema.object({
    fruit: Schema.nativeEnum(Fruits).catch(Fruits.apple),
  });

  expect(Schema.parse({})).toEqual({ fruit: Fruits.apple });
  expect(Schema.parse({ fruit: 15 })).toEqual({ fruit: Fruits.apple });
});

test("enum", () => {
  const schema = Schema.object({
    fruit: Schema.enum(["apple", "orange"]).catch("apple"),
  });

  expect(Schema.parse({})).toEqual({ fruit: "apple" });
  expect(Schema.parse({ fruit: true })).toEqual({ fruit: "apple" });
  expect(Schema.parse({ fruit: 15 })).toEqual({ fruit: "apple" });
});

test("reported issues with nested usage", () => {
  const schema = Schema.object({
    string: Schema.string(),
    obj: Schema.object({
      sub: Schema.object({
        lit: Schema.literal("a"),
        subCatch: Schema.number().catch(23),
      }),
      midCatch: Schema.number().catch(42),
    }),
    number: Schema.number().catch(0),
    bool: Schema.boolean(),
  });

  try {
    Schema.parse({
      string: {},
      obj: {
        sub: {
          lit: "b",
          subCatch: "24",
        },
        midCatch: 444,
      },
      number: "",
      bool: "yes",
    });
  } catch (error) {
    const issues = (error as Schema  .SchemaError).issues;

    expect(issues.length).toEqual(3);
    expect(issues[0].message).toMatch("string");
    expect(issues[1].message).toMatch("literal");
    expect(issues[2].message).toMatch("boolean");
  }
});

test("catch error", () => {
  let catchError: Schema.SchemaError | undefined = undefined;

  const schema = Schema.object({
    age: Schema.number(),
    name: Schema.string().catch((ctx) => {
      catchError = ctx.error;

      return "John Doe";
    }),
  });

  const result = Schema.safeParse({
    age: null,
    name: null,
  });

  expect(result.success).toEqual(false);
  expect(!result.success && result.error.issues.length).toEqual(1);
  expect(!result.success && result.error.issues[0].message).toMatch("number");

  expect(catchError).toBeInstanceOf(Schema.SchemaError);
  expect(catchError !== undefined && (catchError as Schema  .SchemaError).issues.length).toEqual(1);
  expect(catchError !== undefined && (catchError as Schema  .SchemaError).issues[0].message).toMatch("string");
});

test("ctx.input", () => {
  const schema = Schema.string().catch((ctx) => {
    return String(ctx.input);
  });

  expect(Schema.parse(123)).toEqual("123");
});
