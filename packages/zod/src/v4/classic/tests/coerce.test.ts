import { expect, expectTypeOf, test } from "vitest";

import * as Schema from "schema/v4";

test("string coercion", () => {
  const schema = Schema.coerce.string();
  expect(Schema.parse("sup")).toEqual("sup");
  expect(Schema.parse("")).toEqual("");
  expect(Schema.parse(12)).toEqual("12");
  expect(Schema.parse(0)).toEqual("0");
  expect(Schema.parse(-12)).toEqual("-12");
  expect(Schema.parse(3.14)).toEqual("3.14");
  expect(Schema.parse(BigInt(15))).toEqual("15");
  expect(Schema.parse(Number.NaN)).toEqual("NaN");
  expect(Schema.parse(Number.POSITIVE_INFINITY)).toEqual("Infinity");
  expect(Schema.parse(Number.NEGATIVE_INFINITY)).toEqual("-Infinity");
  expect(Schema.parse(true)).toEqual("true");
  expect(Schema.parse(false)).toEqual("false");
  expect(Schema.parse(null)).toEqual("null");
  expect(Schema.parse(undefined)).toEqual("undefined");
  expect(Schema.parse({ hello: "world!" })).toEqual("[object Object]");
  expect(Schema.parse(["item", "another_item"])).toEqual("item,another_item");
  expect(Schema.parse([])).toEqual("");
  expect(Schema.parse(new Date("2022-01-01T00:00:00.000Z"))).toEqual(new Date("2022-01-01T00:00:00.000Z").toString());
});

test("number coercion", () => {
  const schema = Schema.coerce.number();
  expect(Schema.parse("12")).toEqual(12);
  expect(Schema.parse("0")).toEqual(0);
  expect(Schema.parse("-12")).toEqual(-12);
  expect(Schema.parse("3.14")).toEqual(3.14);
  expect(Schema.parse("")).toEqual(0);
  expect(() => Schema.parse("NOT_A_NUMBER")).toThrow(); // Schema.SchemaError
  expect(Schema.parse(12)).toEqual(12);
  expect(Schema.parse(0)).toEqual(0);
  expect(Schema.parse(-12)).toEqual(-12);
  expect(Schema.parse(3.14)).toEqual(3.14);
  expect(Schema.parse(BigInt(15))).toEqual(15);
  expect(() => Schema.parse(Number.NaN)).toThrow(); // Schema.SchemaError
  // expect(Schema.parse(Number.POSITIVE_INFINITY)).toEqual(Number.POSITIVE_INFINITY);
  // expect(Schema.parse(Number.NEGATIVE_INFINITY)).toEqual(Number.NEGATIVE_INFINITY);
  expect(Schema.parse(true)).toEqual(1);
  expect(Schema.parse(false)).toEqual(0);
  expect(Schema.parse(null)).toEqual(0);
  expect(() => Schema.parse(undefined)).toThrow(); // Schema.SchemaError
  expect(() => Schema.parse({ hello: "world!" })).toThrow(); // Schema.SchemaError
  expect(() => Schema.parse(["item", "another_item"])).toThrow(); // Schema.SchemaError
  expect(Schema.parse([])).toEqual(0);
  expect(Schema.parse(new Date(1670139203496))).toEqual(1670139203496);
});

test("boolean coercion", () => {
  const schema = Schema.coerce.boolean();
  expect(Schema.parse("true")).toEqual(true);
  expect(Schema.parse("false")).toEqual(true);
  expect(Schema.parse("0")).toEqual(true);
  expect(Schema.parse("1")).toEqual(true);
  expect(Schema.parse("")).toEqual(false);
  expect(Schema.parse(1)).toEqual(true);
  expect(Schema.parse(0)).toEqual(false);
  expect(Schema.parse(-1)).toEqual(true);
  expect(Schema.parse(3.14)).toEqual(true);
  expect(Schema.parse(BigInt(15))).toEqual(true);
  expect(Schema.parse(Number.NaN)).toEqual(false);
  expect(Schema.parse(Number.POSITIVE_INFINITY)).toEqual(true);
  expect(Schema.parse(Number.NEGATIVE_INFINITY)).toEqual(true);
  expect(Schema.parse(true)).toEqual(true);
  expect(Schema.parse(false)).toEqual(false);
  expect(Schema.parse(null)).toEqual(false);
  expect(Schema.parse(undefined)).toEqual(false);
  expect(Schema.parse({ hello: "world!" })).toEqual(true);
  expect(Schema.parse(["item", "another_item"])).toEqual(true);
  expect(Schema.parse([])).toEqual(true);
  expect(Schema.parse(new Date(1670139203496))).toEqual(true);
});

test("bigint coercion", () => {
  const schema = Schema.coerce.bigint();
  expect(Schema.parse("5")).toEqual(BigInt(5));
  expect(Schema.parse("0")).toEqual(BigInt(0));
  expect(Schema.parse("-5")).toEqual(BigInt(-5));
  expect(() => Schema.parse("3.14")).toThrow(); // not a Schema.SchemaError!
  expect(Schema.parse("")).toEqual(BigInt(0));
  expect(() => Schema.parse("NOT_A_NUMBER")).toThrow(); // not a Schema.SchemaError!
  expect(Schema.parse(5)).toEqual(BigInt(5));
  expect(Schema.parse(0)).toEqual(BigInt(0));
  expect(Schema.parse(-5)).toEqual(BigInt(-5));
  expect(() => Schema.parse(3.14)).toThrow(); // not a Schema.SchemaError!
  expect(Schema.parse(BigInt(5))).toEqual(BigInt(5));
  expect(() => Schema.parse(Number.NaN)).toThrow(); // not a Schema.SchemaError!
  expect(() => Schema.parse(Number.POSITIVE_INFINITY)).toThrow(); // not a Schema.SchemaError!
  expect(() => Schema.parse(Number.NEGATIVE_INFINITY)).toThrow(); // not a Schema.SchemaError!
  expect(Schema.parse(true)).toEqual(BigInt(1));
  expect(Schema.parse(false)).toEqual(BigInt(0));
  expect(() => Schema.parse(null)).toThrow(); // not a Schema.SchemaError!
  expect(() => Schema.parse(undefined)).toThrow(); // not a Schema.SchemaError!
  expect(() => Schema.parse({ hello: "world!" })).toThrow(); // not a Schema.SchemaError!
  expect(() => Schema.parse(["item", "another_item"])).toThrow(); // not a Schema.SchemaError!
  expect(Schema.parse([])).toEqual(BigInt(0));
  expect(Schema.parse(new Date(1670139203496))).toEqual(BigInt(1670139203496));
});

test("date coercion", () => {
  const schema = Schema.coerce.date();
  expect(Schema.parse(new Date().toDateString())).toBeInstanceOf(Date);
  expect(Schema.parse(new Date().toISOString())).toBeInstanceOf(Date);
  expect(Schema.parse(new Date().toUTCString())).toBeInstanceOf(Date);
  expect(Schema.parse("5")).toBeInstanceOf(Date);
  expect(Schema.parse("2000-01-01")).toBeInstanceOf(Date);
  // expect(Schema.parse("0")).toBeInstanceOf(Date);
  // expect(Schema.parse("-5")).toBeInstanceOf(Date);
  // expect(Schema.parse("3.14")).toBeInstanceOf(Date);
  expect(() => Schema.parse("")).toThrow(); // Schema.SchemaError
  expect(() => Schema.parse("NOT_A_DATE")).toThrow(); // Schema.SchemaError
  expect(Schema.parse(5)).toBeInstanceOf(Date);
  expect(Schema.parse(0)).toBeInstanceOf(Date);
  expect(Schema.parse(-5)).toBeInstanceOf(Date);
  expect(Schema.parse(3.14)).toBeInstanceOf(Date);
  expect(() => Schema.parse(BigInt(5))).toThrow(); // not a Schema.SchemaError!
  expect(() => Schema.parse(Number.NaN)).toThrow(); // Schema.SchemaError
  expect(() => Schema.parse(Number.POSITIVE_INFINITY)).toThrow(); // Schema.SchemaError
  expect(() => Schema.parse(Number.NEGATIVE_INFINITY)).toThrow(); // Schema.SchemaError
  expect(Schema.parse(true)).toBeInstanceOf(Date);
  expect(Schema.parse(false)).toBeInstanceOf(Date);
  expect(Schema.parse(null)).toBeInstanceOf(Date);
  expect(() => Schema.parse(undefined)).toThrow(); // Schema.SchemaError
  expect(() => Schema.parse({ hello: "world!" })).toThrow(); // Schema.SchemaError
  expect(() => Schema.parse(["item", "another_item"])).toThrow(); // Schema.SchemaError
  expect(() => Schema.parse([])).toThrow(); // Schema.SchemaError
  expect(Schema.parse(new Date())).toBeInstanceOf(Date);
});

// test("template literal coercion", () => {
//   const schema = Schema.coerce
//     .templateLiteral()
//     .interpolated(Schema.number().finite())
//     .interpolated(
//       Schema.enum(["px", "em", "rem", "vh", "vw", "vmin", "vmax"]).optional()
//     );
//   expect(Schema.parse(300)).toEqual("300");
//   expect(Schema.parse(BigInt(300))).toEqual("300");
//   expect(Schema.parse("300")).toEqual("300");
//   expect(Schema.parse("300px")).toEqual("300px");
//   expect(Schema.parse("300em")).toEqual("300em");
//   expect(Schema.parse("300rem")).toEqual("300rem");
//   expect(Schema.parse("300vh")).toEqual("300vh");
//   expect(Schema.parse("300vw")).toEqual("300vw");
//   expect(Schema.parse("300vmin")).toEqual("300vmin");
//   expect(Schema.parse("300vmax")).toEqual("300vmax");
//   expect(Schema.parse(["300px"])).toEqual("300px");
// });

test("override input type", () => {
  const a = Schema.coerce.string<any>();
  type input = Schema.input<typeof a>;
  expectTypeOf<input>().toEqualTypeOf<any>();
  type output = Schema.infer<typeof a>;
  expectTypeOf<output>().toEqualTypeOf<string>();
});
