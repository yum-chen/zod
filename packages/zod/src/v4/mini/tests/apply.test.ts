import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "../index.js";

test("basic apply (number)", () => {
  const setCommonNumberChecks = <T extends Schema.SchemaMiniNumber>(schema: T) => {
    return Schema.check(Schema.minimum(0), Schema.maximum(100));
  };

  const schema = Schema.nullable(Schema.number().apply(setCommonNumberChecks));

  expect(() => Schema.parse(schema, -1)).toThrowError();
  expect(() => Schema.parse(schema, 101)).toThrowError();
  expect(Schema.parse(schema, 0)).toBe(0);
  expect(Schema.parse(schema, null)).toBe(null);
  expectTypeOf<Schema.infer<typeof schema>>().toEqualTypeOf<number | null>();
});

test("The callback's return value becomes the apply's return value.", () => {
  const symbol = Symbol();
  const result = Schema.number().apply(() => symbol);

  expect(result).toBe(symbol);
  expectTypeOf<typeof result>().toEqualTypeOf<symbol>();
});

test("apply forwards extra args to the callback", () => {
  const calls: unknown[] = [];
  const capture = (schema: Schema.SchemaMiniString, ...args: unknown[]) => {
    calls.push(schema, ...args);
    return schema;
  };

  const schema = Schema.string();
  const result = Schema.apply(capture, "id", 42);

  expect(calls[0]).toBe(schema);
  expect(calls[1]).toBe("id");
  expect(calls[2]).toBe(42);
  expect(Schema.parse(result, "value")).toBe("value");
  expectTypeOf<Schema.infer<typeof result>>().toEqualTypeOf<string>();
});

test("apply type-checks the extra args", () => {
  const withMin = (schema: Schema.SchemaMiniString, n: number) => Schema.check(Schema.minLength(n));

  expect(Schema.parse(Schema.string().apply(withMin, 3), "abcd")).toBe("abcd");
  expectTypeOf(
    Schema.number().apply<Schema.SchemaMiniNumber>((schema) => Schema.check(Schema.minimum(0)))
  ).toEqualTypeOf<Schema.SchemaMiniNumber>();

  // @ts-expect-error wrong arg type
  Schema.string().apply(withMin, "3");
  // @ts-expect-error missing arg
  Schema.string().apply(withMin);
  // @ts-expect-error extra arg for a single-parameter callback
  Schema.string().apply((schema: Schema.SchemaMiniString) => schema, 3);
});
