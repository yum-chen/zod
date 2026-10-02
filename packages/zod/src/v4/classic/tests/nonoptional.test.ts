import { expect, expectTypeOf, test } from "vitest";
import { Schema } from "schema/v4";

test("nonoptional", () => {
  const schema = Schema.string().nonoptional();
  expectTypeOf<typeof Schema._input>().toEqualTypeOf<string>();
  expectTypeOf<typeof Schema._output>().toEqualTypeOf<string>();

  const result = Schema.safeParse(undefined);
  expect(result.success).toBe(false);
  expect(result).toMatchInlineSnapshot(`
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

test("nonoptional with default", () => {
  const schema = Schema.string().optional().nonoptional();
  expectTypeOf<typeof Schema._input>().toEqualTypeOf<string>();
  expectTypeOf<typeof Schema._output>().toEqualTypeOf<string>();

  const result = Schema.safeParse(undefined);
  expect(result.success).toBe(false);
  expect(result).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "invalid_type",
        "expected": "nonoptional",
        "path": [],
        "message": "Invalid input: expected nonoptional, received undefined"
      }
    ]],
      "success": false,
    }
  `);
});

test("nonoptional in object", () => {
  const schema = Schema.object({ hi: Schema.string().optional().nonoptional() });

  expectTypeOf<typeof Schema._input>().toEqualTypeOf<{ hi: string }>();
  expectTypeOf<typeof Schema._output>().toEqualTypeOf<{ hi: string }>();
  const r1 = Schema.safeParse({ hi: "asdf" });
  expect(r1.success).toEqual(true);

  const r2 = Schema.safeParse({ hi: undefined });
  // expect(Schema.safeParse({ hi: undefined }).success).toEqual(false);
  expect(r2.success).toEqual(false);
  expect(r2.error).toMatchInlineSnapshot(`
    [SchemaError: [
      {
        "code": "invalid_type",
        "expected": "nonoptional",
        "path": [
          "hi"
        ],
        "message": "Invalid input: expected nonoptional, received undefined"
      }
    ]]
  `);

  const r3 = Schema.safeParse({});
  expect(r3.success).toEqual(false);
  expect(r3.error).toMatchInlineSnapshot(`
    [SchemaError: [
      {
        "code": "invalid_type",
        "expected": "nonoptional",
        "path": [
          "hi"
        ],
        "message": "Invalid input: expected nonoptional, received undefined"
      }
    ]]
  `);
});

test("encoding", () => {
  const schema = Schema.string().optional().nonoptional();
  expect(Schema.encode(schema, "hello")).toEqual("hello");
  expect(() => Schema.encode(schema, undefined as any)).toThrowErrorMatchingInlineSnapshot(`
    [SchemaError: [
      {
        "code": "invalid_type",
        "expected": "nonoptional",
        "path": [],
        "message": "Invalid input: expected nonoptional, received undefined"
      }
    ]]
  `);
});
