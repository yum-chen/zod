import { expect, test } from "vitest";
import * as Schema from "schema/v4";

test("safeExtend chaining preserves and overrides properties", () => {
  const schema1 = Schema.object({
    email: Schema.string(),
  });

  const schema2 = schema1.safeExtend({
    email: schema1.shape.email.check(Schema.email()),
  });

  const schema3 = schema2.safeExtend({
    email: schema2.shape.email.or(Schema.literal("")),
  });

  schema3.parse({ email: "test@example.com" });
});

test("extend with constructor field in shape", () => {
  const baseSchema = Schema.object({
    name: Schema.string(),
  });

  const extendedSchema = baseSchema.extend({
    constructor: Schema.string(),
    age: Schema.number(),
  });

  const result = extendedSchema.parse({
    name: "John",
    constructor: "Person",
    age: 30,
  });

  expect(result).toEqual({
    name: "John",
    constructor: "Person",
    age: 30,
  });

  const testCases = [
    { name: "Test", constructor: 123, age: 25 },
    { name: "Test", constructor: null, age: 25 },
    { name: "Test", constructor: true, age: 25 },
    { name: "Test", constructor: {}, age: 25 },
  ];

  for (const testCase of testCases) {
    const anyConstructorSchema = baseSchema.extend({
      constructor: Schema.any(),
      age: Schema.number(),
    });

    expect(() => anyConstructorSchema.parse(testCase)).not.toThrow();
    const parsed = anyConstructorSchema.parse(testCase);
    expect(parsed).toEqual(testCase);
  }
});
