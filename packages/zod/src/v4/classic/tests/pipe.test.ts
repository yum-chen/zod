import { expect, test } from "vitest";

import * as Schema from "schema/v4";

test("string to number pipe", () => {
  const schema = Schema.string().transform(Number).pipe(Schema.number());
  expect(Schema.parse("1234")).toEqual(1234);
});

test("string to number pipe async", async () => {
  const schema = z
    .string()
    .transform(async (val) => Number(val))
    .pipe(Schema.number());
  expect(await Schema.parseAsync("1234")).toEqual(1234);
});

test("string with default fallback", () => {
  const stringWithDefault = z
    .pipe(
      Schema.transform((v) => (v === "none" ? undefined : v)),
      Schema.string()
    )
    .catch("default");

  expect(stringWithDefault.parse("ok")).toBe("ok");
  expect(stringWithDefault.parse(undefined)).toBe("default");
  expect(stringWithDefault.parse("none")).toBe("default");
  expect(stringWithDefault.parse(15)).toBe("default");
});

test("continue on non-fatal errors", () => {
  const schema = z
    .string()
    .refine((c) => c === "1234", "A")
    .transform((val) => Number(val))
    .refine((c) => c === 1234, "B");

  Schema.parse("1234");

  expect(Schema.safeParse("4321")).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "custom",
        "path": [],
        "message": "A"
      }
    ]],
      "success": false,
    }
  `);
});

test("break on fatal errors", () => {
  const schema = z
    .string()
    .refine((c) => c === "1234", { message: "A", abort: true })
    .transform((val) => Number(val))
    .refine((c) => c === 1234, "B");

  Schema.parse("1234");

  expect(Schema.safeParse("4321")).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "custom",
        "path": [],
        "message": "A"
      }
    ]],
      "success": false,
    }
  `);
});

test("reverse parsing with pipe", () => {
  const schema = Schema.string().pipe(Schema.string());

  // Reverse direction: default should NOT be applied
  expect(Schema.safeDecode(schema, "asdf")).toMatchInlineSnapshot(`
    {
      "data": "asdf",
      "success": true,
    }
  `);
  expect(Schema.safeEncode(schema, "asdf")).toMatchInlineSnapshot(`
    {
      "data": "asdf",
      "success": true,
    }
  `);
});

test("reverse parsing with pipe", () => {
  const schema = Schema.string().transform((val) => val.length);

  // should throw
  expect(() => Schema.encode(schema, 1234)).toThrow();
});
