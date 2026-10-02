import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";

const literalStringSchema = Schema.literal("asdf");
const literalNumberSchema = Schema.literal(12);
const literalBooleanSchema = Schema.literal(true);
const literalBigIntSchema = Schema.literal(BigInt(42));

const stringSchema = Schema.string();
const numberSchema = Schema.number();
const bigintSchema = Schema.bigint();
const booleanSchema = Schema.boolean();
const dateSchema = Schema.date();
const symbolSchema = Schema.symbol();
const nullSchema = Schema.null();
const undefinedSchema = Schema.undefined();
const stringSchemaOptional = Schema.string().optional();
const stringSchemaNullable = Schema.string().nullable();
const numberSchemaOptional = Schema.number().optional();
const numberSchemaNullable = Schema.number().nullable();
const bigintSchemaOptional = Schema.bigint().optional();
const bigintSchemaNullable = Schema.bigint().nullable();
const booleanSchemaOptional = Schema.boolean().optional();
const booleanSchemaNullable = Schema.boolean().nullable();
const dateSchemaOptional = Schema.date().optional();
const dateSchemaNullable = Schema.date().nullable();
const symbolSchemaOptional = Schema.symbol().optional();
const symbolSchemaNullable = Schema.symbol().nullable();

test("literal string schema", () => {
  expect(literalStringSchema.parse("asdf")).toBe("asdf");
  expect(() => literalStringSchema.parse("not_asdf")).toThrow();
  expect(() => literalStringSchema.parse(123)).toThrow();
  expect(() => literalStringSchema.parse(true)).toThrow();
  expect(() => literalStringSchema.parse({})).toThrow();
});

test("literal number schema", () => {
  expect(literalNumberSchema.parse(12)).toBe(12);
  expect(() => literalNumberSchema.parse(13)).toThrow();
  expect(() => literalNumberSchema.parse("foo")).toThrow();
  expect(() => literalNumberSchema.parse(true)).toThrow();
  expect(() => literalNumberSchema.parse({})).toThrow();
});

test("literal boolean schema", () => {
  expect(literalBooleanSchema.parse(true)).toBe(true);
  expect(() => literalBooleanSchema.parse(false)).toThrow();
  expect(() => literalBooleanSchema.parse("asdf")).toThrow();
  expect(() => literalBooleanSchema.parse(123)).toThrow();
  expect(() => literalBooleanSchema.parse({})).toThrow();
});

test("literal bigint schema", () => {
  expect(literalBigIntSchema.parse(BigInt(42))).toBe(BigInt(42));
  expect(() => literalBigIntSchema.parse(BigInt(43))).toThrow();
  expect(() => literalBigIntSchema.parse("asdf")).toThrow();
  expect(() => literalBigIntSchema.parse(123)).toThrow();
  expect(() => literalBigIntSchema.parse({})).toThrow();
});

test("string schema", () => {
  stringSchema.parse("foo");
  expect(() => stringSchema.parse(Math.random())).toThrow();
  expect(() => stringSchema.parse(true)).toThrow();
  expect(() => stringSchema.parse(undefined)).toThrow();
  expect(() => stringSchema.parse(null)).toThrow();
});

test("number schema", () => {
  numberSchema.parse(Math.random());
  expect(() => numberSchema.parse("foo")).toThrow();
  expect(() => numberSchema.parse(BigInt(17))).toThrow();
  expect(() => numberSchema.parse(true)).toThrow();
  expect(() => numberSchema.parse(undefined)).toThrow();
  expect(() => numberSchema.parse(null)).toThrow();
});

test("bigint schema", () => {
  bigintSchema.parse(BigInt(17));
  expect(() => bigintSchema.parse("foo")).toThrow();
  expect(() => bigintSchema.parse(Math.random())).toThrow();
  expect(() => bigintSchema.parse(true)).toThrow();
  expect(() => bigintSchema.parse(undefined)).toThrow();
  expect(() => bigintSchema.parse(null)).toThrow();
});

test("boolean schema", () => {
  booleanSchema.parse(true);
  expect(() => booleanSchema.parse("foo")).toThrow();
  expect(() => booleanSchema.parse(Math.random())).toThrow();
  expect(() => booleanSchema.parse(undefined)).toThrow();
  expect(() => booleanSchema.parse(null)).toThrow();
});

test("date schema", async () => {
  dateSchema.parse(new Date());
  expect(() => dateSchema.parse("foo")).toThrow();
  expect(() => dateSchema.parse(Math.random())).toThrow();
  expect(() => dateSchema.parse(true)).toThrow();
  expect(() => dateSchema.parse(undefined)).toThrow();
  expect(() => dateSchema.parse(null)).toThrow();
  expect(await dateSchema.safeParseAsync(new Date("invalid"))).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "date",
        "code": "invalid_type",
        "received": "Invalid Date",
        "path": [],
        "message": "Invalid input: expected date, received Date"
      }
    ]],
      "success": false,
    }
  `);
});

test("symbol schema", () => {
  symbolSchema.parse(Symbol("foo"));
  expect(() => symbolSchema.parse("foo")).toThrow();
  expect(() => symbolSchema.parse(Math.random())).toThrow();
  expect(() => symbolSchema.parse(true)).toThrow();
  expect(() => symbolSchema.parse(new Date())).toThrow();
  expect(() => symbolSchema.parse(undefined)).toThrow();
  expect(() => symbolSchema.parse(null)).toThrow();
});

test("undefined schema", () => {
  undefinedSchema.parse(undefined);
  expect(() => undefinedSchema.parse("foo")).toThrow();
  expect(() => undefinedSchema.parse(Math.random())).toThrow();
  expect(() => undefinedSchema.parse(true)).toThrow();
  expect(() => undefinedSchema.parse(null)).toThrow();
});

test("null schema", () => {
  nullSchema.parse(null);
  expect(() => nullSchema.parse("foo")).toThrow();
  expect(() => nullSchema.parse(Math.random())).toThrow();
  expect(() => nullSchema.parse(true)).toThrow();
  expect(() => nullSchema.parse(undefined)).toThrow();
});

test("primitive inference", () => {
  expectTypeOf<Schema.TypeOf<typeof literalStringSchema>>().toEqualTypeOf<"asdf">();
  expectTypeOf<Schema.TypeOf<typeof literalNumberSchema>>().toEqualTypeOf<12>();
  expectTypeOf<Schema.TypeOf<typeof literalBooleanSchema>>().toEqualTypeOf<true>();
  expectTypeOf<Schema.TypeOf<typeof literalBigIntSchema>>().toEqualTypeOf<bigint>();
  expectTypeOf<Schema.TypeOf<typeof stringSchema>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.TypeOf<typeof numberSchema>>().toEqualTypeOf<number>();
  expectTypeOf<Schema.TypeOf<typeof bigintSchema>>().toEqualTypeOf<bigint>();
  expectTypeOf<Schema.TypeOf<typeof booleanSchema>>().toEqualTypeOf<boolean>();
  expectTypeOf<Schema.TypeOf<typeof dateSchema>>().toEqualTypeOf<Date>();
  expectTypeOf<Schema.TypeOf<typeof symbolSchema>>().toEqualTypeOf<symbol>();
  expectTypeOf<Schema.TypeOf<typeof nullSchema>>().toEqualTypeOf<null>();
  expectTypeOf<Schema.TypeOf<typeof undefinedSchema>>().toEqualTypeOf<undefined>();
  expectTypeOf<Schema.TypeOf<typeof stringSchemaOptional>>().toEqualTypeOf<string | undefined>();
  expectTypeOf<Schema.TypeOf<typeof stringSchemaNullable>>().toEqualTypeOf<string | null>();
  expectTypeOf<Schema.TypeOf<typeof numberSchemaOptional>>().toEqualTypeOf<number | undefined>();
  expectTypeOf<Schema.TypeOf<typeof numberSchemaNullable>>().toEqualTypeOf<number | null>();
  expectTypeOf<Schema.TypeOf<typeof bigintSchemaOptional>>().toEqualTypeOf<bigint | undefined>();
  expectTypeOf<Schema.TypeOf<typeof bigintSchemaNullable>>().toEqualTypeOf<bigint | null>();
  expectTypeOf<Schema.TypeOf<typeof booleanSchemaOptional>>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<Schema.TypeOf<typeof booleanSchemaNullable>>().toEqualTypeOf<boolean | null>();
  expectTypeOf<Schema.TypeOf<typeof dateSchemaOptional>>().toEqualTypeOf<Date | undefined>();
  expectTypeOf<Schema.TypeOf<typeof dateSchemaNullable>>().toEqualTypeOf<Date | null>();
  expectTypeOf<Schema.TypeOf<typeof symbolSchemaOptional>>().toEqualTypeOf<symbol | undefined>();
  expectTypeOf<Schema.TypeOf<typeof symbolSchemaNullable>>().toEqualTypeOf<symbol | null>();
});

test("get literal values", () => {
  expect(literalStringSchema.values).toEqual(new Set(["asdf"]));
  expect(literalStringSchema._schema.def.values).toEqual(["asdf"]);
});
