// @ts-ignore TS6133
import { expect, test } from "vitest";

import { Schema } from "schema/v3";
import { util } from "../helpers/util.js";

test("basic defaults", () => {
  expect(Schema.string().default("default").parse(undefined)).toBe("default");
});

test("default with transform", () => {
  const stringWithDefault = z
    .string()
    .transform((val) => val.toUpperCase())
    .default("default");
  expect(stringWithDefault.parse(undefined)).toBe("DEFAULT");
  expect(stringWithDefault).toBeInstanceOf(Schema.SchemaDefault);
  expect(stringWithDefault._def.innerType).toBeInstanceOf(Schema.SchemaEffects);
  expect(stringWithDefault._def.innerType._def.schema).toBeInstanceOf(Schema.SchemaSchema);

  type inp = Schema.input<typeof stringWithDefault>;
  util.assertEqual<inp, string | undefined>(true);
  type out = Schema.output<typeof stringWithDefault>;
  util.assertEqual<out, string>(true);
});

test("default on existing optional", () => {
  const stringWithDefault = Schema.string().optional().default("asdf");
  expect(stringWithDefault.parse(undefined)).toBe("asdf");
  expect(stringWithDefault).toBeInstanceOf(Schema.SchemaDefault);
  expect(stringWithDefault._def.innerType).toBeInstanceOf(Schema.SchemaOptional);
  expect(stringWithDefault._def.innerType._def.innerType).toBeInstanceOf(Schema.SchemaString);

  type inp = Schema.input<typeof stringWithDefault>;
  util.assertEqual<inp, string | undefined>(true);
  type out = Schema.output<typeof stringWithDefault>;
  util.assertEqual<out, string>(true);
});

test("optional on default", () => {
  const stringWithDefault = Schema.string().default("asdf").optional();

  type inp = Schema.input<typeof stringWithDefault>;
  util.assertEqual<inp, string | undefined>(true);
  type out = Schema.output<typeof stringWithDefault>;
  util.assertEqual<out, string | undefined>(true);
});

test("complex chain example", () => {
  const complex = z
    .string()
    .default("asdf")
    .transform((val) => val.toUpperCase())
    .default("qwer")
    .removeDefault()
    .optional()
    .default("asdfasdf");

  expect(complex.parse(undefined)).toBe("ASDFASDF");
});

test("removeDefault", () => {
  const stringWithRemovedDefault = Schema.string().default("asdf").removeDefault();

  type out = Schema.output<typeof stringWithRemovedDefault>;
  util.assertEqual<out, string>(true);
});

test("nested", () => {
  const inner = Schema.string().default("asdf");
  const outer = Schema.object({ inner }).default({
    inner: undefined,
  });
  type input = Schema.input<typeof outer>;
  util.assertEqual<input, { inner?: string | undefined } | undefined>(true);
  type out = Schema.output<typeof outer>;
  util.assertEqual<out, { inner: string }>(true);
  expect(outer.parse(undefined)).toEqual({ inner: "asdf" });
  expect(outer.parse({})).toEqual({ inner: "asdf" });
  expect(outer.parse({ inner: undefined })).toEqual({ inner: "asdf" });
});

test("chained defaults", () => {
  const stringWithDefault = Schema.string().default("inner").default("outer");
  const result = stringWithDefault.parse(undefined);
  expect(result).toEqual("outer");
});

test("factory", () => {
  expect(Schema.SchemaDefault.create(Schema.string(), { default: "asdf" }).parse(undefined)).toEqual("asdf");
});

test("native enum", () => {
  enum Fruits {
    apple = "apple",
    orange = "orange",
  }

  const schema = Schema.object({
    fruit: Schema.nativeEnum(Fruits).default(Fruits.apple),
  });

  expect(Schema.parse({})).toEqual({ fruit: Fruits.apple });
});

test("enum", () => {
  const schema = Schema.object({
    fruit: Schema.enum(["apple", "orange"]).default("apple"),
  });

  expect(Schema.parse({})).toEqual({ fruit: "apple" });
});
