import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/mini";

test("Schema.number", () => {
  const a = Schema.number();
  expect(Schema.parse(a, 123)).toEqual(123);
  expect(Schema.parse(a, 123.45)).toEqual(123.45);
  expect(() => Schema.parse(a, "123")).toThrow();
  expect(() => Schema.parse(a, false)).toThrow();

  type a = Schema.infer<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<number>();
});

test("Schema.number async", async () => {
  const a = Schema.number().check(Schema.refine(async (_) => _ > 0));
  await expect(Schema.parseAsync(a, 123)).resolves.toEqual(123);
  await expect(() => Schema.parseAsync(a, -123)).rejects.toThrow();
  await expect(() => Schema.parseAsync(a, "123")).rejects.toThrow();
});

test("Schema.int", () => {
  const a = Schema.int();
  expect(Schema.parse(a, 123)).toEqual(123);
  expect(() => Schema.parse(a, 123.45)).toThrow();
  expect(() => Schema.parse(a, "123")).toThrow();
  expect(() => Schema.parse(a, false)).toThrow();
});

test("Schema.float32", () => {
  const a = Schema.float32();
  expect(Schema.parse(a, 123.45)).toEqual(123.45);
  expect(() => Schema.parse(a, "123.45")).toThrow();
  expect(() => Schema.parse(a, false)).toThrow();
  // -3.4028234663852886e38, 3.4028234663852886e38;
  expect(() => Schema.parse(a, 3.4028234663852886e38 * 2)).toThrow(); // Exceeds max
  expect(() => Schema.parse(a, -3.4028234663852886e38 * 2)).toThrow(); // Exceeds min
});

test("Schema.float64", () => {
  const a = Schema.float64();
  expect(Schema.parse(a, 123.45)).toEqual(123.45);
  expect(() => Schema.parse(a, "123.45")).toThrow();
  expect(() => Schema.parse(a, false)).toThrow();
  expect(() => Schema.parse(a, 1.7976931348623157e308 * 2)).toThrow(); // Exceeds max
  expect(() => Schema.parse(a, -1.7976931348623157e308 * 2)).toThrow(); // Exceeds min
});

test("Schema.int32", () => {
  const a = Schema.int32();
  expect(Schema.parse(a, 123)).toEqual(123);
  expect(() => Schema.parse(a, 123.45)).toThrow();
  expect(() => Schema.parse(a, "123")).toThrow();
  expect(() => Schema.parse(a, false)).toThrow();
  expect(() => Schema.parse(a, 2147483648)).toThrow(); // Exceeds max
  expect(() => Schema.parse(a, -2147483649)).toThrow(); // Exceeds min
});

test("Schema.uint32", () => {
  const a = Schema.uint32();
  expect(Schema.parse(a, 123)).toEqual(123);
  expect(() => Schema.parse(a, -123)).toThrow();
  expect(() => Schema.parse(a, 123.45)).toThrow();
  expect(() => Schema.parse(a, "123")).toThrow();
  expect(() => Schema.parse(a, false)).toThrow();
  expect(() => Schema.parse(a, 4294967296)).toThrow(); // Exceeds max
  expect(() => Schema.parse(a, -1)).toThrow(); // Below min
});

test("Schema.int64", () => {
  const a = Schema.int64();
  expect(Schema.parse(a, BigInt(123))).toEqual(BigInt(123));
  expect(() => Schema.parse(a, 123)).toThrow();
  expect(() => Schema.parse(a, 123.45)).toThrow();
  expect(() => Schema.parse(a, "123")).toThrow();
  expect(() => Schema.parse(a, false)).toThrow();
  expect(() => Schema.parse(a, BigInt("9223372036854775808"))).toThrow();
  expect(() => Schema.parse(a, BigInt("-9223372036854775809"))).toThrow();
  // expect(() => Schema.parse(a, BigInt("9223372036854775808"))).toThrow(); // Exceeds max
  // expect(() => Schema.parse(a, BigInt("-9223372036854775809"))).toThrow(); // Exceeds min
});

test("Schema.uint64", () => {
  const a = Schema.uint64();
  expect(Schema.parse(a, BigInt(123))).toEqual(BigInt(123));
  expect(() => Schema.parse(a, 123)).toThrow();
  expect(() => Schema.parse(a, -123)).toThrow();
  expect(() => Schema.parse(a, 123.45)).toThrow();
  expect(() => Schema.parse(a, "123")).toThrow();
  expect(() => Schema.parse(a, false)).toThrow();
  expect(() => Schema.parse(a, BigInt("18446744073709551616"))).toThrow(); // Exceeds max
  expect(() => Schema.parse(a, BigInt("-1"))).toThrow(); // Below min
  // expect(() => Schema.parse(a, BigInt("18446744073709551616"))).toThrow(); // Exceeds max
  // expect(() => Schema.parse(a, BigInt("-1"))).toThrow(); // Below min
});

test("number and bigint formats are distinct at the type level", () => {
  expectTypeOf(Schema.int()._schema.def.format).toEqualTypeOf<"safeint">();
  expectTypeOf(Schema.uint32()._schema.def.format).toEqualTypeOf<"uint32">();
  expectTypeOf(Schema.int64()._schema.def.format).toEqualTypeOf<"int64">();

  Schema.int32() satisfies Schema.SchemaMiniInt32;
  Schema.uint64() satisfies Schema.SchemaMiniUInt64;

  // @ts-expect-error a float64 schema is not a SchemaMiniFloat32
  Schema.float64() satisfies Schema.SchemaMiniFloat32;
  // @ts-expect-error a uint64 schema is not a SchemaMiniInt64
  Schema.uint64() satisfies Schema.SchemaMiniInt64;
});
