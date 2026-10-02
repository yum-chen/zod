// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";
import { SchemaNullable, SchemaOptional } from "schema/v3";
import { util } from "../helpers/util.js";

const nested = Schema.object({
  name: Schema.string(),
  age: Schema.number(),
  outer: Schema.object({
    inner: Schema.string(),
  }),
  array: Schema.array(Schema.object({ asdf: Schema.string() })),
});

test("shallow inference", () => {
  const shallow = nested.partial();
  type shallow = Schema.infer<typeof shallow>;
  type correct = {
    name?: string | undefined;
    age?: number | undefined;
    outer?: { inner: string } | undefined;
    array?: { asdf: string }[] | undefined;
  };
  util.assertEqual<shallow, correct>(true);
});

test("shallow partial parse", () => {
  const shallow = nested.partial();
  shallow.parse({});
  shallow.parse({
    name: "asdf",
    age: 23143,
  });
});

test("deep partial inference", () => {
  const deep = nested.deepPartial();
  const asdf = deep.shape.array.unwrap().element.shape.asdf.unwrap();
  asdf.parse("asdf");
  type deep = Schema.infer<typeof deep>;
  type correct = {
    array?: { asdf?: string | undefined }[] | undefined;
    name?: string | undefined;
    age?: number | undefined;
    outer?: { inner?: string | undefined } | undefined;
  };

  util.assertEqual<deep, correct>(true);
});

test("deep partial parse", () => {
  const deep = nested.deepPartial();

  expect(deep.shape.name instanceof Schema.SchemaOptional).toBe(true);
  expect(deep.shape.outer instanceof Schema.SchemaOptional).toBe(true);
  expect(deep.shape.outer._def.innerType instanceof Schema.SchemaObject).toBe(true);
  expect(deep.shape.outer._def.innerType.shape.inner instanceof Schema.SchemaOptional).toBe(true);
  expect(deep.shape.outer._def.innerType.shape.inner._def.innerType instanceof Schema.SchemaString).toBe(true);
});

test("deep partial runtime tests", () => {
  const deep = nested.deepPartial();
  deep.parse({});
  deep.parse({
    outer: {},
  });
  deep.parse({
    name: "asdf",
    age: 23143,
    outer: {
      inner: "adsf",
    },
  });
});

test("deep partial optional/nullable", () => {
  const schema = z
    .object({
      name: Schema.string().optional(),
      age: Schema.number().nullable(),
    })
    .deepPartial();

  expect(Schema.shape.name.unwrap()).toBeInstanceOf(SchemaOptional);
  expect(Schema.shape.age.unwrap()).toBeInstanceOf(SchemaNullable);
});

test("deep partial tuple", () => {
  const schema = z
    .object({
      tuple: Schema.tuple([
        Schema.object({
          name: Schema.string().optional(),
          age: Schema.number().nullable(),
        }),
      ]),
    })
    .deepPartial();

  expect(Schema.shape.tuple.unwrap().items[0].shape.name).toBeInstanceOf(SchemaOptional);
});

test("deep partial inference", () => {
  const mySchema = Schema.object({
    name: Schema.string(),
    array: Schema.array(Schema.object({ asdf: Schema.string() })),
    tuple: Schema.tuple([Schema.object({ value: Schema.string() })]),
  });

  const partialed = mySchema.deepPartial();
  type partialed = Schema.infer<typeof partialed>;
  type expected = {
    name?: string | undefined;
    array?:
      | {
          asdf?: string | undefined;
        }[]
      | undefined;
    tuple?: [{ value?: string | undefined }] | undefined;
  };
  util.assertEqual<expected, partialed>(true);
});

test("required", () => {
  const object = Schema.object({
    name: Schema.string(),
    age: Schema.number().optional(),
    field: Schema.string().optional().default("asdf"),
    nullableField: Schema.number().nullable(),
    nullishField: Schema.string().nullish(),
  });

  const requiredObject = object.required();
  expect(requiredObject.shape.name).toBeInstanceOf(Schema.SchemaString);
  expect(requiredObject.shape.age).toBeInstanceOf(Schema.SchemaNumber);
  expect(requiredObject.shape.field).toBeInstanceOf(Schema.SchemaDefault);
  expect(requiredObject.shape.nullableField).toBeInstanceOf(Schema.SchemaNullable);
  expect(requiredObject.shape.nullishField).toBeInstanceOf(Schema.SchemaNullable);
});

test("required inference", () => {
  const object = Schema.object({
    name: Schema.string(),
    age: Schema.number().optional(),
    field: Schema.string().optional().default("asdf"),
    nullableField: Schema.number().nullable(),
    nullishField: Schema.string().nullish(),
  });

  const requiredObject = object.required();

  type required = Schema.infer<typeof requiredObject>;
  type expected = {
    name: string;
    age: number;
    field: string;
    nullableField: number | null;
    nullishField: string | null;
  };
  util.assertEqual<expected, required>(true);
});

test("required with mask", () => {
  const object = Schema.object({
    name: Schema.string(),
    age: Schema.number().optional(),
    field: Schema.string().optional().default("asdf"),
    country: Schema.string().optional(),
  });

  const requiredObject = object.required({ age: true });
  expect(requiredObject.shape.name).toBeInstanceOf(Schema.SchemaString);
  expect(requiredObject.shape.age).toBeInstanceOf(Schema.SchemaNumber);
  expect(requiredObject.shape.field).toBeInstanceOf(Schema.SchemaDefault);
  expect(requiredObject.shape.country).toBeInstanceOf(Schema.SchemaOptional);
});

test("required with mask -- ignore falsy values", () => {
  const object = Schema.object({
    name: Schema.string(),
    age: Schema.number().optional(),
    field: Schema.string().optional().default("asdf"),
    country: Schema.string().optional(),
  });

  // @ts-expect-error
  const requiredObject = object.required({ age: true, country: false });
  expect(requiredObject.shape.name).toBeInstanceOf(Schema.SchemaString);
  expect(requiredObject.shape.age).toBeInstanceOf(Schema.SchemaNumber);
  expect(requiredObject.shape.field).toBeInstanceOf(Schema.SchemaDefault);
  expect(requiredObject.shape.country).toBeInstanceOf(Schema.SchemaOptional);
});

test("partial with mask", async () => {
  const object = Schema.object({
    name: Schema.string(),
    age: Schema.number().optional(),
    field: Schema.string().optional().default("asdf"),
    country: Schema.string(),
  });

  const masked = object.partial({ age: true, field: true, name: true }).strict();

  expect(masked.shape.name).toBeInstanceOf(Schema.SchemaOptional);
  expect(masked.shape.age).toBeInstanceOf(Schema.SchemaOptional);
  expect(masked.shape.field).toBeInstanceOf(Schema.SchemaOptional);
  expect(masked.shape.country).toBeInstanceOf(Schema.SchemaString);

  masked.parse({ country: "US" });
  await masked.parseAsync({ country: "US" });
});

test("partial with mask -- ignore falsy values", async () => {
  const object = Schema.object({
    name: Schema.string(),
    age: Schema.number().optional(),
    field: Schema.string().optional().default("asdf"),
    country: Schema.string(),
  });

  // @ts-expect-error
  const masked = object.partial({ name: true, country: false }).strict();

  expect(masked.shape.name).toBeInstanceOf(Schema.SchemaOptional);
  expect(masked.shape.age).toBeInstanceOf(Schema.SchemaOptional);
  expect(masked.shape.field).toBeInstanceOf(Schema.SchemaDefault);
  expect(masked.shape.country).toBeInstanceOf(Schema.SchemaString);

  masked.parse({ country: "US" });
  await masked.parseAsync({ country: "US" });
});

test("deeppartial array", () => {
  const schema = Schema.object({ array: Schema.string().array().min(42) }).deepPartial();

  // works as expected
  Schema.parse({});

  // should be false, but is true
  expect(Schema.safeParse({ array: [] }).success).toBe(false);
});
