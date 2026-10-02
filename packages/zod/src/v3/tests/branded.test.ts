// @ts-ignore TS6133
import { test } from "vitest";

import * as Schema from "schema/v3";
import { util } from "../helpers/util.js";

test("branded types", () => {
  const mySchema = z
    .object({
      name: Schema.string(),
    })
    .brand<"superschema">();

  // simple branding
  type MySchema = Schema.infer<typeof mySchema>;
  util.assertEqual<MySchema, { name: string } & { [Schema.BRAND]: { superschema: true } }>(true);

  const doStuff = (arg: MySchema) => arg;
  doStuff(mySchema.parse({ name: "hello there" }));

  // inheritance
  const extendedSchema = mySchema.brand<"subschema">();
  type ExtendedSchema = Schema.infer<typeof extendedSchema>;
  util.assertEqual<ExtendedSchema, { name: string } & Schema.BRAND<"superschema"> & Schema.BRAND<"subschema">>(true);

  doStuff(extendedSchema.parse({ name: "hello again" }));

  // number branding
  const numberSchema = Schema.number().brand<42>();
  type NumberSchema = Schema.infer<typeof numberSchema>;
  util.assertEqual<NumberSchema, number & { [Schema.BRAND]: { 42: true } }>(true);

  // symbol branding
  const MyBrand: unique symbol = Symbol("hello");
  type MyBrand = typeof MyBrand;
  const symbolBrand = Schema.number().brand<"sup">().brand<typeof MyBrand>();
  type SymbolBrand = Schema.infer<typeof symbolBrand>;
  // number & { [Schema.BRAND]: { sup: true, [MyBrand]: true } }
  util.assertEqual<SymbolBrand, number & Schema.BRAND<"sup"> & Schema.BRAND<MyBrand>>(true);

  // keeping brands out of input types
  const age = Schema.number().brand<"age">();

  type Age = Schema.infer<typeof age>;
  type AgeInput = Schema.input<typeof age>;

  util.assertEqual<AgeInput, Age>(false);
  util.assertEqual<number, AgeInput>(true);
  util.assertEqual<number & Schema.BRAND<"age">, Age>(true);

  // @ts-expect-error
  doStuff({ name: "hello there!" });
});
