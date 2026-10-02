import { expectTypeOf, test } from "vitest";
import * as Schema from "../index.js";

test("branded types", () => {
  const mySchema = z
    .object({
      name: Schema.string(),
    })
    .brand<"superschema">();

  // simple branding
  type MySchema = Schema.infer<typeof mySchema>;
  // Using true for type equality assertion
  expectTypeOf<MySchema>().toEqualTypeOf<{ name: string } & Schema.$brand<"superschema">>();

  const doStuff = (arg: MySchema) => arg;
  doStuff(Schema.parse(mySchema, { name: "hello there" }));

  // inheritance
  const extendedSchema = mySchema.brand<"subschema">();
  type ExtendedSchema = Schema.infer<typeof extendedSchema>;
  expectTypeOf<ExtendedSchema>().toEqualTypeOf<{ name: string } & Schema.$brand<"superschema"> & Schema.$brand<"subschema">>();

  doStuff(Schema.parse(extendedSchema, { name: "hello again" }));

  // number branding
  const numberSchema = Schema.number().brand<42>();
  type NumberSchema = Schema.infer<typeof numberSchema>;
  expectTypeOf<NumberSchema>().toEqualTypeOf<number & { [Schema.$brand]: { 42: true } }>();

  // symbol branding
  const MyBrand: unique symbol = Symbol("hello");
  type MyBrand = typeof MyBrand;
  const symbolBrand = Schema.number().brand<"sup">().brand<typeof MyBrand>();
  type SymbolBrand = Schema.infer<typeof symbolBrand>;
  // number & { [Schema.$brand]: { sup: true, [MyBrand]: true } }
  expectTypeOf<SymbolBrand>().toEqualTypeOf<number & Schema.$brand<"sup"> & Schema.$brand<MyBrand>>();

  // keeping brands out of input types
  const age = Schema.number().brand<"age">();
  type Age1 = Schema.infer<typeof age>;
  type AgeInput1 = Schema.input<typeof age>;

  // Using not for type inequality assertion
  expectTypeOf<AgeInput1>().not.toEqualTypeOf<Age1>();
  expectTypeOf<number>().toEqualTypeOf<AgeInput1>();
  expectTypeOf<number & Schema.$brand<"age">>().toEqualTypeOf<Age1>();

  // @ts-expect-error
  doStuff({ name: "hello there!" });
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
