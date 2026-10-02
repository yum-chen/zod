import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/v3";

test("test", () => {
  expect(true).toBe(true);
});

test("test2", () => {
  expect(() => Schema.string().parse(234)).toThrowErrorMatchingInlineSnapshot(`
    [SchemaError: [
      {
        "code": "invalid_type",
        "expected": "string",
        "received": "number",
        "path": [],
        "message": "Expected string, received number"
      }
    ]]
  `);
});

test("async validation", async () => {
  const testTuple = z
    .tuple([Schema.string().refine(async () => true), Schema.number().refine(async () => true)])
    .refine(async () => true);
  expectTypeOf<typeof testTuple._output>().toEqualTypeOf<[string, number]>();

  const val = await testTuple.parseAsync(["asdf", 1234]);
  expect(val).toEqual(val);

  const r1 = await testTuple.safeParseAsync(["asdf", "asdf"]);
  expect(r1.success).toEqual(false);
  expect(r1.error!).toMatchInlineSnapshot(`
    [SchemaError: [
      {
        "code": "invalid_type",
        "expected": "number",
        "received": "string",
        "path": [
          1
        ],
        "message": "Expected number, received string"
      }
    ]]
  `);
});
