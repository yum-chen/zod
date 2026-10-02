import { expect, expectTypeOf, test } from "vitest";

import * as Schema from "schema/v4";

const gtFive = Schema.bigint().gt(BigInt(5));
const gteFive = Schema.bigint().gte(BigInt(5));
const ltFive = Schema.bigint().lt(BigInt(5));
const lteFive = Schema.bigint().lte(BigInt(5));
const positive = Schema.bigint().positive();
const negative = Schema.bigint().negative();
const nonnegative = Schema.bigint().nonnegative();
const nonpositive = Schema.bigint().nonpositive();
const multipleOfFive = Schema.bigint().multipleOf(BigInt(5));

test("passing validations", () => {
  Schema.bigint().parse(BigInt(1));
  Schema.bigint().parse(BigInt(0));
  Schema.bigint().parse(BigInt(-1));
  gtFive.parse(BigInt(6));
  gteFive.parse(BigInt(5));
  gteFive.parse(BigInt(6));
  ltFive.parse(BigInt(4));
  lteFive.parse(BigInt(5));
  lteFive.parse(BigInt(4));
  positive.parse(BigInt(3));
  negative.parse(BigInt(-2));
  nonnegative.parse(BigInt(0));
  nonnegative.parse(BigInt(7));
  nonpositive.parse(BigInt(0));
  nonpositive.parse(BigInt(-12));
  multipleOfFive.parse(BigInt(15));
});

test("failing validations", () => {
  expect(() => gtFive.parse(BigInt(5))).toThrow();
  expect(() => gteFive.parse(BigInt(4))).toThrow();
  expect(() => ltFive.parse(BigInt(5))).toThrow();
  expect(() => lteFive.parse(BigInt(6))).toThrow();
  expect(() => positive.parse(BigInt(0))).toThrow();
  expect(() => positive.parse(BigInt(-2))).toThrow();
  expect(() => negative.parse(BigInt(0))).toThrow();
  expect(() => negative.parse(BigInt(3))).toThrow();
  expect(() => nonnegative.parse(BigInt(-1))).toThrow();
  expect(() => nonpositive.parse(BigInt(1))).toThrow();
  expect(() => multipleOfFive.parse(BigInt(13))).toThrow();
});

test("min max getters", () => {
  expect(Schema.bigint().min(BigInt(5)).minValue).toEqual(BigInt(5));
  expect(Schema.bigint().min(BigInt(5)).min(BigInt(10)).minValue).toEqual(BigInt(10));

  expect(Schema.bigint().max(BigInt(5)).maxValue).toEqual(BigInt(5));
  expect(Schema.bigint().max(BigInt(5)).max(BigInt(1)).maxValue).toEqual(BigInt(1));
});

test("a format check applied after min/max does not widen minValue/maxValue back out", () => {
  const schema = Schema.bigint().min(0n).max(23n).check(Schema.int64());
  expect(Schema.minValue).toEqual(0n);
  expect(Schema.maxValue).toEqual(23n);
});

test("bigint formats are distinct at the type level", () => {
  expectTypeOf(Schema.int64()._schema.def.format).toEqualTypeOf<"int64">();
  expectTypeOf(Schema.uint64()._schema.def.format).toEqualTypeOf<"uint64">();

  Schema.int64() satisfies Schema.SchemaBigIntFormat;
  Schema.int64() satisfies Schema.SchemaBigInt;

  // @ts-expect-error a uint64 schema is not a SchemaInt64
  Schema.uint64() satisfies Schema.SchemaInt64;
});

test("multipleOf(0n) does not throw from safeParse", () => {
  // `value % 0n` throws RangeError, so the compiled path declines and the runtime reports the failure
  const schema = Schema.bigint().multipleOf(BigInt(0));
  const result = Schema.safeParse(BigInt(10));
  expect(result.success).toBe(false);
  expect(result.error!.issues[0].code).toEqual("not_multiple_of");
  expect(Schema.safeParse(BigInt(0)).success).toBe(false);

  // matches the number equivalent
  expect(Schema.number().multipleOf(0).safeParse(10).success).toBe(false);
  expect(Schema.number().multipleOf(0).safeParse(0).success).toBe(false);

  // a zero divisor nested in an object must not break the surrounding parse
  const obj = Schema.object({ a: Schema.bigint().multipleOf(BigInt(0)), b: Schema.bigint() });
  expect(obj.safeParse({ a: BigInt(1), b: BigInt(2) }).success).toBe(false);
  expect(obj.safeParse({ a: BigInt(1), b: 2 }).success).toBe(false);
});
