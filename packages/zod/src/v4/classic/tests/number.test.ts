import { expect, expectTypeOf, test } from "vitest";

import * as Schema from "schema/v4";

test("number factory checks", () => {
  const schema = Schema.number({ checks: [Schema.gte(1), Schema.lte(3)] as const });
  const chained = Schema.number().min(1).max(3);
  expectTypeOf<Schema.output<typeof schema>>().toEqualTypeOf<number>();
  for (const value of [0, 1, 3, 4, Number.NaN, "2", undefined]) {
    expect(Schema.validate(schema, value)).toBe(Schema.validate(chained, value));
    expect(Schema.safeParse(value)).toEqual(chained.safeParse(value));
  }
  expect(Schema.toJSONSchema(schema)).toEqual(Schema.toJSONSchema(chained));
  expect(Schema.minValue).toBe(1);
  expect(Schema.maxValue).toBe(3);
  expect(Schema.coerce.number({ checks: [Schema.gte(1)] }).parse("2")).toBe(2);
  const overwritten = Schema.number({ checks: [Schema.overwrite<number>((value) => value + 1), Schema.gte(2)] });
  expect(overwritten.parse(1)).toBe(2);
  expect(Schema.validate(overwritten, 0)).toBe(false);
  // @ts-expect-error length checks cannot validate numbers
  Schema.number({ checks: [Schema.minLength(1)] });
});

test("number factory checks snapshot caller arrays", () => {
  for (const factory of [Schema.number, Schema.coerce.number]) {
    const checks = [Schema.gte(1)];
    const schema = factory({ checks });
    let reads = 0;
    factory({
      get checks() {
        if (++reads > 1) throw new Error("checks read twice");
        return checks;
      },
    });
    expect(reads).toBe(1);
    const before = Schema.toJSONSchema(schema);
    checks.push(Schema.gte(10));
    expect(Schema.validate(schema, 3)).toBe(true);
    expect(Schema.validate(Schema.compile(schema), 3)).toBe(true);
    expect(Schema.toJSONSchema(schema)).toEqual(before);
  }
});

test("Schema.number() basic validation", () => {
  const schema = Schema.number();
  expect(Schema.parse(1234)).toEqual(1234);
});

test("NaN validation", () => {
  const schema = Schema.number();
  expect(() => Schema.parse(Number.NaN)).toThrow();
});

test("Infinity validation", () => {
  const schema = Schema.number();
  expect(Schema.safeParse(Number.POSITIVE_INFINITY)).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "number",
        "code": "invalid_type",
        "received": "Infinity",
        "path": [],
        "message": "Invalid input: expected number, received Infinity"
      }
    ]],
      "success": false,
    }
  `);
  expect(Schema.safeParse(Number.NEGATIVE_INFINITY)).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "number",
        "code": "invalid_type",
        "received": "-Infinity",
        "path": [],
        "message": "Invalid input: expected number, received -Infinity"
      }
    ]],
      "success": false,
    }
  `);
});

test(".gt() validation", () => {
  const schema = Schema.number().gt(0).gt(5);
  expect(Schema.parse(6)).toEqual(6);
  expect(() => Schema.parse(5)).toThrow();
});

test(".gte() validation", () => {
  const schema = Schema.number().gt(0).gte(1).gte(5);
  expect(Schema.parse(5)).toEqual(5);
  expect(() => Schema.parse(4)).toThrow();
});

test(".min() validation", () => {
  const schema = Schema.number().min(0).min(5);
  expect(Schema.parse(5)).toEqual(5);
  expect(() => Schema.parse(4)).toThrow();
});

test(".lt() validation", () => {
  const schema = Schema.number().lte(10).lt(5);
  expect(Schema.parse(4)).toEqual(4);
  expect(() => Schema.parse(5)).toThrow();
});

test(".lte() validation", () => {
  const schema = Schema.number().lte(10).lte(5);
  expect(Schema.parse(5)).toEqual(5);
  expect(() => Schema.parse(6)).toThrow();
});

test(".max() validation", () => {
  const schema = Schema.number().max(10).max(5);
  expect(Schema.parse(5)).toEqual(5);
  expect(() => Schema.parse(6)).toThrow();
});

test(".int() validation", () => {
  const schema = Schema.number().int();
  expect(Schema.parse(4)).toEqual(4);
  expect(() => Schema.parse(3.14)).toThrow();
});

test(".positive() validation", () => {
  const schema = Schema.number().positive();
  expect(Schema.parse(1)).toEqual(1);
  expect(() => Schema.parse(0)).toThrow();
  expect(() => Schema.parse(-1)).toThrow();
});

test(".negative() validation", () => {
  const schema = Schema.number().negative();
  expect(Schema.parse(-1)).toEqual(-1);
  expect(() => Schema.parse(0)).toThrow();
  expect(() => Schema.parse(1)).toThrow();
});

test(".nonpositive() validation", () => {
  const schema = Schema.number().nonpositive();
  expect(Schema.parse(0)).toEqual(0);
  expect(Schema.parse(-1)).toEqual(-1);
  expect(() => Schema.parse(1)).toThrow();
});

test(".nonnegative() validation", () => {
  const schema = Schema.number().nonnegative();
  expect(Schema.parse(0)).toEqual(0);
  expect(Schema.parse(1)).toEqual(1);
  expect(() => Schema.parse(-1)).toThrow();
});

test("multipleOf", () => {
  const numbers = {
    number3: 5.123,
    number6: 5.123456,
    number7: 5.1234567,
    number8: 5.12345678,
  };

  const schemas = {
    schema6: Schema.number().multipleOf(0.000001),
    schema7: Schema.number().multipleOf(0.0000001),
  };

  expect(() => schemas.schema6.parse(numbers.number3)).not.toThrow();
  expect(() => schemas.schema6.parse(numbers.number6)).not.toThrow();
  expect(() => schemas.schema6.parse(numbers.number7)).toThrow();
  expect(() => schemas.schema6.parse(numbers.number8)).toThrow();
  expect(() => schemas.schema7.parse(numbers.number3)).not.toThrow();
  expect(() => schemas.schema7.parse(numbers.number6)).not.toThrow();
  expect(() => schemas.schema7.parse(numbers.number7)).not.toThrow();
  expect(() => schemas.schema7.parse(numbers.number8)).toThrow();
});

test(".multipleOf() accepts exact decimal multiples", () => {
  // 2.03 === 29 * 0.07, but the quotient lands 2 ULP below 29, so the old tolerance rejected it while the neighbouring multiples 1.96 and 2.10 passed.
  const schema = Schema.number().multipleOf(0.07);
  expect(Schema.safeParse(2.03).success).toBe(true);
  expect(Schema.safeParse(4.06).success).toBe(true);
  expect(Schema.safeParse(8.54).success).toBe(true);
  // genuine non-multiples must still be rejected
  expect(Schema.safeParse(2.04).success).toBe(false);
});

test(".multipleOf() with positive divisor", () => {
  const schema = Schema.number().multipleOf(5);
  expect(Schema.parse(15)).toEqual(15);
  expect(Schema.parse(-15)).toEqual(-15);
  expect(() => Schema.parse(7.5)).toThrow();
  expect(() => Schema.parse(-7.5)).toThrow();
});

test(".multipleOf() with negative divisor", () => {
  const schema = Schema.number().multipleOf(-5);
  expect(Schema.parse(-15)).toEqual(-15);
  expect(Schema.parse(15)).toEqual(15);
  expect(() => Schema.parse(-7.5)).toThrow();
  expect(() => Schema.parse(7.5)).toThrow();
});

test(".multipleOf() with scientific notation (multi-digit exponents)", () => {
  // Regression test for https://github.com/colinhacks/schema/pull/5687 — the regex was using \d? which only matches single-digit exponents
  const schema = Schema.number().multipleOf(1e-10);

  // These should all pass - they are valid multiples of 1e-10
  expect(Schema.parse(1e-10)).toEqual(1e-10);
  expect(Schema.parse(5e-10)).toEqual(5e-10);
  expect(Schema.parse(1e-9)).toEqual(1e-9); // 10 * 1e-10

  // Test with 1e-15 (exponent = 15, two digits)
  const schema15 = Schema.number().multipleOf(1e-15);
  expect(schema15.parse(1e-15)).toEqual(1e-15);
  expect(schema15.parse(3e-15)).toEqual(3e-15);
});

test(".multipleOf() with small floats / scientific notation (#5792)", () => {
  const schema = Schema.number().multipleOf(1e-7);

  // Valid multiples (integer * 1e-7)
  expect(Schema.safeParse(0).success).toBe(true);
  expect(Schema.safeParse(1e-7).success).toBe(true);
  expect(Schema.safeParse(2e-7).success).toBe(true);
  expect(Schema.safeParse(3e-7).success).toBe(true);

  // Invalid — 2.5 and 1.5 are not integers
  expect(Schema.safeParse(2.5e-7).success).toBe(false);
  expect(Schema.safeParse(1.5e-7).success).toBe(false);
});

test(".step() validation", () => {
  const schemaPointOne = Schema.number().step(0.1);
  const schemaPointZeroZeroZeroOne = Schema.number().step(0.0001);
  const schemaSixPointFour = Schema.number().step(6.4);

  expect(schemaPointOne.parse(6)).toEqual(6);
  expect(schemaPointOne.parse(6.1)).toEqual(6.1);
  expect(schemaSixPointFour.parse(12.8)).toEqual(12.8);
  expect(schemaPointZeroZeroZeroOne.parse(3.01)).toEqual(3.01);
  expect(() => schemaPointOne.parse(6.11)).toThrow();
  expect(() => schemaPointOne.parse(6.1000000001)).toThrow();
  expect(() => schemaSixPointFour.parse(6.41)).toThrow();
});

test(".finite() validation", () => {
  const schema = Schema.number().finite();
  expect(Schema.parse(123)).toEqual(123);
  expect(Schema.safeParse(Number.POSITIVE_INFINITY)).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "number",
        "code": "invalid_type",
        "received": "Infinity",
        "path": [],
        "message": "Invalid input: expected number, received Infinity"
      }
    ]],
      "success": false,
    }
  `);
  expect(Schema.safeParse(Number.NEGATIVE_INFINITY)).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "number",
        "code": "invalid_type",
        "received": "-Infinity",
        "path": [],
        "message": "Invalid input: expected number, received -Infinity"
      }
    ]],
      "success": false,
    }
  `);
});

test(".safe() validation", () => {
  const schema = Schema.number().safe();
  expect(Schema.parse(Number.MIN_SAFE_INTEGER)).toEqual(Number.MIN_SAFE_INTEGER);
  expect(Schema.parse(Number.MAX_SAFE_INTEGER)).toEqual(Number.MAX_SAFE_INTEGER);
  expect(() => Schema.parse(Number.MIN_SAFE_INTEGER - 1)).toThrow();
  expect(() => Schema.parse(Number.MAX_SAFE_INTEGER + 1)).toThrow();
});

test("min value getters", () => {
  expect(Schema.number().minValue).toBeNull;
  expect(Schema.number().lt(5).minValue).toBeNull;
  expect(Schema.number().lte(5).minValue).toBeNull;
  expect(Schema.number().max(5).minValue).toBeNull;
  expect(Schema.number().negative().minValue).toBeNull;
  expect(Schema.number().nonpositive().minValue).toBeNull;
  expect(Schema.number().int().minValue).toBeNull;
  expect(Schema.number().multipleOf(5).minValue).toBeNull;
  expect(Schema.number().finite().minValue).toBeNull;
  expect(Schema.number().gt(5).minValue).toEqual(5);
  expect(Schema.number().gte(5).minValue).toEqual(5);
  expect(Schema.number().min(5).minValue).toEqual(5);
  expect(Schema.number().min(5).min(10).minValue).toEqual(10);
  expect(Schema.number().positive().minValue).toEqual(0);
  expect(Schema.number().nonnegative().minValue).toEqual(0);
  expect(Schema.number().safe().minValue).toEqual(Number.MIN_SAFE_INTEGER);
});

test("max value getters", () => {
  expect(Schema.number().maxValue).toBeNull;
  expect(Schema.number().gt(5).maxValue).toBeNull;
  expect(Schema.number().gte(5).maxValue).toBeNull;
  expect(Schema.number().min(5).maxValue).toBeNull;
  expect(Schema.number().positive().maxValue).toBeNull;
  expect(Schema.number().nonnegative().maxValue).toBeNull;
  expect(Schema.number().int().minValue).toBeNull;
  expect(Schema.number().multipleOf(5).minValue).toBeNull;
  expect(Schema.number().finite().minValue).toBeNull;
  expect(Schema.number().lt(5).maxValue).toEqual(5);
  expect(Schema.number().lte(5).maxValue).toEqual(5);
  expect(Schema.number().max(5).maxValue).toEqual(5);
  expect(Schema.number().max(5).max(1).maxValue).toEqual(1);
  expect(Schema.number().negative().maxValue).toEqual(0);
  expect(Schema.number().nonpositive().maxValue).toEqual(0);
  expect(Schema.number().safe().maxValue).toEqual(Number.MAX_SAFE_INTEGER);
});

test("int getter", () => {
  expect(Schema.number().isInt).toEqual(false);
  expect(Schema.number().int().isInt).toEqual(true);
  expect(Schema.number().safe().isInt).toEqual(true);
  expect(Schema.number().multipleOf(5).isInt).toEqual(true);
});

/** In Schema 4, number schemas don't accept infinite values. */
test("finite getter", () => {
  expect(Schema.number().isFinite).toEqual(true);
});

test("string format methods", () => {
  const a = Schema.int32().min(5);
  expect(a.parse(6)).toEqual(6);
  expect(() => a.parse(1)).toThrow();
});

test("negative zero edge case", () => {
  const schema = Schema.number();
  const negativeZero = -0;
  const positiveZero = 0;

  // Both -0 and 0 should be valid (parse succeeds)
  expect(Schema.safeParse(negativeZero).success).toBe(true);
  expect(Schema.safeParse(positiveZero).success).toBe(true);
  // Note: -0 is normalized to 0 after parsing
  expect(Schema.parse(negativeZero) === 0).toBe(true);
  expect(Schema.parse(positiveZero)).toEqual(0);

  // With positive() constraint, both should be invalid (0 is not positive)
  const positiveSchema = Schema.number().positive();
  expect(() => positiveSchema.parse(negativeZero)).toThrow();
  expect(() => positiveSchema.parse(positiveZero)).toThrow();

  // With nonnegative(), both should be valid (0 is non-negative)
  const nonnegativeSchema = Schema.number().nonnegative();
  expect(nonnegativeSchema.safeParse(negativeZero).success).toBe(true);
  expect(nonnegativeSchema.safeParse(positiveZero).success).toBe(true);
  expect(nonnegativeSchema.parse(negativeZero) === 0).toBe(true);
  expect(nonnegativeSchema.parse(positiveZero)).toEqual(0);
});

test("error customization", () => {
  Schema.number().gte(5, { error: (iss) => "Min: " + iss.minimum.valueOf() });
  Schema.number().lte(5, { error: (iss) => "Max: " + iss.maximum.valueOf() });
});

test("number formats are distinct at the type level", () => {
  expectTypeOf(Schema.int()._schema.def.format).toEqualTypeOf<"safeint">();
  expectTypeOf(Schema.int32()._schema.def.format).toEqualTypeOf<"int32">();
  expectTypeOf(Schema.uint32()._schema.def.format).toEqualTypeOf<"uint32">();
  expectTypeOf(Schema.float32()._schema.def.format).toEqualTypeOf<"float32">();
  expectTypeOf(Schema.float64()._schema.def.format).toEqualTypeOf<"float64">();

  Schema.int() satisfies Schema.SchemaNumberFormat;
  Schema.int() satisfies Schema.SchemaNumber;

  // @ts-expect-error a float32 schema is not a SchemaInt
  Schema.float32() satisfies Schema.SchemaInt;
  // @ts-expect-error a uint32 schema is not a SchemaInt32
  Schema.uint32() satisfies Schema.SchemaInt32;

  // the point of the distinction: dispatching on the schema type in a conditional type
  type Sql<T> = T extends Schema.SchemaUInt32
    ? "BIGINT"
    : T extends Schema.SchemaInt32
      ? "INTEGER"
      : T extends Schema.SchemaFloat32
        ? "REAL"
        : never;
  expectTypeOf<Sql<Schema.SchemaUInt32>>().toEqualTypeOf<"BIGINT">();
  expectTypeOf<Sql<Schema.SchemaInt32>>().toEqualTypeOf<"INTEGER">();
  expectTypeOf<Sql<Schema.SchemaFloat32>>().toEqualTypeOf<"REAL">();
});
