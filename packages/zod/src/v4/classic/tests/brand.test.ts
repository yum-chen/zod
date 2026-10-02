import { expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";

test("branded types", () => {
  const mySchema = z
    .object({
      name: Schema.string(),
    })
    .brand<"superschema">();

  // simple branding
  type MySchema = Schema.infer<typeof mySchema>;

  expectTypeOf<MySchema>().toEqualTypeOf<{ name: string } & Schema.$brand<"superschema">>();

  const doStuff = (arg: MySchema) => arg;
  doStuff(mySchema.parse({ name: "hello there" }));

  // inheritance
  const extendedSchema = mySchema.brand<"subschema">();
  type ExtendedSchema = Schema.infer<typeof extendedSchema>;
  expectTypeOf<ExtendedSchema>().toEqualTypeOf<{ name: string } & Schema.BRAND<"superschema"> & Schema.BRAND<"subschema">>();

  doStuff(extendedSchema.parse({ name: "hello again" }));

  // number branding
  const numberSchema = Schema.number().brand<42>();
  type NumberSchema = Schema.infer<typeof numberSchema>;
  expectTypeOf<NumberSchema>().toEqualTypeOf<number & { [Schema.$brand]: { 42: true } }>();

  // symbol branding
  const MyBrand: unique symbol = Symbol("hello");
  type MyBrand = typeof MyBrand;
  const symbolBrand = Schema.number().brand<"sup">().brand<typeof MyBrand>();
  type SymbolBrand = Schema.infer<typeof symbolBrand>;
  // number & { [Schema.BRAND]: { sup: true, [MyBrand]: true } }
  expectTypeOf<SymbolBrand>().toEqualTypeOf<number & Schema.BRAND<"sup"> & Schema.BRAND<MyBrand>>();

  // keeping brands out of input types
  const age = Schema.number().brand<"age">();

  type Age = Schema.infer<typeof age>;
  type AgeInput = Schema.input<typeof age>;

  expectTypeOf<AgeInput>().not.toEqualTypeOf<Age>();
  expectTypeOf<number>().toEqualTypeOf<AgeInput>();
  expectTypeOf<number & Schema.BRAND<"age">>().toEqualTypeOf<Age>();

  // @ts-expect-error
  doStuff({ name: "hello there!" });
});

test("$branded", () => {
  const a = Schema.string().brand<"a">();

  expectTypeOf<typeof a>().toEqualTypeOf<Schema.core.$SchemaBranded<Schema.SchemaString, "a">>();
});

test("branded record", () => {
  const recordWithBrandedNumberKeys = Schema.record(Schema.string().brand("SomeBrand"), Schema.number());
  type recordWithBrandedNumberKeys = Schema.infer<typeof recordWithBrandedNumberKeys>;
  expectTypeOf<recordWithBrandedNumberKeys>().toEqualTypeOf<Record<string & Schema.core.$brand<"SomeBrand">, number>>();
});

test("brand direction: out (default)", () => {
  const schema = Schema.string().brand<"A">();
  type Input = Schema.input<typeof schema>;
  type Output = Schema.output<typeof schema>;

  // output is branded
  expectTypeOf<Output>().toEqualTypeOf<string & Schema.$brand<"A">>();
  // input is NOT branded (default behavior)
  expectTypeOf<Input>().toEqualTypeOf<string>();
});

test("brand direction: out (explicit)", () => {
  const schema = Schema.string().brand<"A", "out">();
  type Input = Schema.input<typeof schema>;
  type Output = Schema.output<typeof schema>;

  // output is branded
  expectTypeOf<Output>().toEqualTypeOf<string & Schema.$brand<"A">>();
  // input is NOT branded
  expectTypeOf<Input>().toEqualTypeOf<string>();
});

test("brand direction: in", () => {
  const schema = Schema.string().brand<"A", "in">();
  type Input = Schema.input<typeof schema>;
  type Output = Schema.output<typeof schema>;

  // input is branded
  expectTypeOf<Input>().toEqualTypeOf<string & Schema.$brand<"A">>();
  // output is NOT branded
  expectTypeOf<Output>().toEqualTypeOf<string>();
});

test("brand direction: inout", () => {
  const schema = Schema.string().brand<"A", "inout">();
  type Input = Schema.input<typeof schema>;
  type Output = Schema.output<typeof schema>;

  // both are branded
  expectTypeOf<Input>().toEqualTypeOf<string & Schema.$brand<"A">>();
  expectTypeOf<Output>().toEqualTypeOf<string & Schema.$brand<"A">>();
});
