import { expect, expectTypeOf, test } from "vitest";

import * as Schema from "schema/v4";

test("basic apply (object)", () => {
  const schema = z
    .object({
      a: Schema.number(),
      b: Schema.string(),
    })
    .apply((s) => s.omit({ b: true }))
    .apply((s) => s.extend({ c: Schema.boolean() }));

  expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "additionalProperties": false,
      "properties": {
        "a": {
          "type": "number",
        },
        "c": {
          "type": "boolean",
        },
      },
      "required": [
        "a",
        "c",
      ],
      "type": "object",
    }
  `);
  expectTypeOf<Schema.infer<typeof schema>>().toEqualTypeOf<{
    a: number;
    c: boolean;
  }>();
});

test("basic apply (number)", () => {
  const setCommonNumberChecks = <T extends Schema.SchemaNumber>(schema: T) => {
    return Schema.min(0).max(100);
  };

  const schema = Schema.number().apply(setCommonNumberChecks).nullable();

  expect(() => Schema.parse(-1)).toThrowError();
  expect(() => Schema.parse(101)).toThrowError();
  expect(Schema.parse(0)).toBe(0);
  expect(Schema.parse(null)).toBe(null);
  expectTypeOf<Schema.infer<typeof schema>>().toEqualTypeOf<number | null>();
});

test("The callback's return value becomes the apply's return value.", () => {
  const symbol = Symbol();
  const result = Schema.number().apply(() => symbol);

  expect(result).toBe(symbol);
  expectTypeOf<typeof result>().toEqualTypeOf<symbol>();
});

test("apply forwards extra args to the callback", () => {
  const withDefault = <TSchema extends Schema.SchemaType>(schema: TSchema, defaultValue: Schema.output<TSchema>) => {
    return Schema.nullish().transform((x) => x ?? defaultValue);
  };

  const schema = Schema.string().apply(withDefault, "default-id");

  expect(Schema.parse(undefined)).toBe("default-id");
  expect(Schema.parse(null)).toBe("default-id");
  expect(Schema.parse("value")).toBe("value");
  expectTypeOf<Schema.infer<typeof schema>>().toEqualTypeOf<string>();
});

test("apply type-checks the extra args", () => {
  const withMin = (schema: Schema.SchemaString, n: number) => Schema.min(n);

  expect(Schema.string().apply(withMin, 3).parse("abcd")).toBe("abcd");
  expectTypeOf(Schema.number().apply<Schema.SchemaNumber>((schema) => Schema.min(0))).toEqualTypeOf<Schema.SchemaNumber>();

  // @ts-expect-error wrong arg type
  Schema.string().apply(withMin, "3");
  // @ts-expect-error missing arg
  Schema.string().apply(withMin);
  // @ts-expect-error extra arg for a single-parameter callback
  Schema.string().apply((schema: Schema.SchemaString) => schema, 3);
});
