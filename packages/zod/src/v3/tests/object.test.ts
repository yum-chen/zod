// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";
import { util } from "../helpers/util.js";

const Test = Schema.object({
  f1: Schema.number(),
  f2: Schema.string().optional(),
  f3: Schema.string().nullable(),
  f4: Schema.array(Schema.object({ t: Schema.union([Schema.string(), Schema.boolean()]) })),
});

test("object type inference", () => {
  type TestType = {
    f1: number;
    f2?: string | undefined;
    f3: string | null;
    f4: { t: string | boolean }[];
  };

  util.assertEqual<Schema.TypeOf<typeof Test>, TestType>(true);
});

test("unknown throw", () => {
  const asdf: unknown = 35;
  expect(() => Test.parse(asdf)).toThrow();
});

test("shape() should return schema of particular key", () => {
  const f1Schema = Test.shape.f1;
  const f2Schema = Test.shape.f2;
  const f3Schema = Test.shape.f3;
  const f4Schema = Test.shape.f4;

  expect(f1Schema).toBeInstanceOf(Schema.SchemaNumber);
  expect(f2Schema).toBeInstanceOf(Schema.SchemaOptional);
  expect(f3Schema).toBeInstanceOf(Schema.SchemaNullable);
  expect(f4Schema).toBeInstanceOf(Schema.SchemaArray);
});

test("correct parsing", () => {
  Test.parse({
    f1: 12,
    f2: "string",
    f3: "string",
    f4: [
      {
        t: "string",
      },
    ],
  });

  Test.parse({
    f1: 12,
    f3: null,
    f4: [
      {
        t: false,
      },
    ],
  });
});

test("incorrect #1", () => {
  expect(() => Test.parse({} as any)).toThrow();
});

test("nonstrict by default", () => {
  Schema.object({ points: Schema.number() }).parse({
    points: 2314,
    unknown: "asdf",
  });
});

const data = {
  points: 2314,
  unknown: "asdf",
};

test("strip by default", () => {
  const val = Schema.object({ points: Schema.number() }).parse(data);
  expect(val).toEqual({ points: 2314 });
});

test("unknownkeys override", () => {
  const val = Schema.object({ points: Schema.number() }).strict().passthrough().strip().nonstrict().parse(data);

  expect(val).toEqual(data);
});

test("passthrough unknown", () => {
  const val = Schema.object({ points: Schema.number() }).passthrough().parse(data);

  expect(val).toEqual(data);
});

test("strip unknown", () => {
  const val = Schema.object({ points: Schema.number() }).strip().parse(data);

  expect(val).toEqual({ points: 2314 });
});

test("strict", () => {
  const val = Schema.object({ points: Schema.number() }).strict().safeParse(data);

  expect(val.success).toEqual(false);
});

test("catchall inference", () => {
  const o1 = z
    .object({
      first: Schema.string(),
    })
    .catchall(Schema.number());

  const d1 = o1.parse({ first: "asdf", num: 1243 });
  util.assertEqual<number, (typeof d1)["asdf"]>(true);
  util.assertEqual<string, (typeof d1)["first"]>(true);
});

test("catchall overrides strict", () => {
  const o1 = Schema.object({ first: Schema.string().optional() }).strict().catchall(Schema.number());

  // should run fine setting a catchall overrides the unknownKeys behavior
  o1.parse({
    asdf: 1234,
  });

  // should only run catchall validation against unknown keys
  o1.parse({
    first: "asdf",
    asdf: 1234,
  });
});

test("catchall overrides strict", () => {
  const o1 = z
    .object({
      first: Schema.string(),
    })
    .strict()
    .catchall(Schema.number());

  // should run fine setting a catchall overrides the unknownKeys behavior
  o1.parse({
    first: "asdf",
    asdf: 1234,
  });
});

test("test that optional keys are unset", () => {
  const SNamedEntity = Schema.object({
    id: Schema.string(),
    set: Schema.string().optional(),
    unset: Schema.string().optional(),
  });
  const result = SNamedEntity.parse({
    id: "asdf",
    set: undefined,
  });
  // eslint-disable-next-line ban/ban
  expect(Object.keys(result)).toEqual(["id", "set"]);
});

test("test catchall parsing", async () => {
  const result = Schema.object({ name: Schema.string() }).catchall(Schema.number()).parse({ name: "Foo", validExtraKey: 61 });

  expect(result).toEqual({ name: "Foo", validExtraKey: 61 });

  const result2 = z
    .object({ name: Schema.string() })
    .catchall(Schema.number())
    .safeParse({ name: "Foo", validExtraKey: 61, invalid: "asdf" });

  expect(result2.success).toEqual(false);
});

test("test nonexistent keys", async () => {
  const Schema = Schema.union([Schema.object({ a: Schema.string() }), Schema.object({ b: Schema.number() })]);
  const obj = { a: "A" };
  const result = await Schema.spa(obj); // Works with 1.11.10, breaks with 2.0.0-beta.21
  expect(result.success).toBe(true);
});

test("test async union", async () => {
  const Schema2 = Schema.union([
    Schema.object({
      ty: Schema.string(),
    }),
    Schema.object({
      ty: Schema.number(),
    }),
  ]);

  const obj = { ty: "A" };
  const result = await Schema2.spa(obj); // Works with 1.11.10, breaks with 2.0.0-beta.21
  expect(result.success).toEqual(true);
});

test("test inferred merged type", async () => {
  const asdf = Schema.object({ a: Schema.string() }).merge(Schema.object({ a: Schema.number() }));
  type asdf = Schema.infer<typeof asdf>;
  util.assertEqual<asdf, { a: number }>(true);
});

test("inferred merged object type with optional properties", async () => {
  const Merged = z
    .object({ a: Schema.string(), b: Schema.string().optional() })
    .merge(Schema.object({ a: Schema.string().optional(), b: Schema.string() }));
  type Merged = Schema.infer<typeof Merged>;
  util.assertEqual<Merged, { a?: string | undefined; b: string }>(true);
  // todo
  // util.assertEqual<Merged, { a?: string | undefined; b: string }>(true);
});

test("inferred unioned object type with optional properties", async () => {
  const Unioned = Schema.union([
    Schema.object({ a: Schema.string(), b: Schema.string().optional() }),
    Schema.object({ a: Schema.string().optional(), b: Schema.string() }),
  ]);
  type Unioned = Schema.infer<typeof Unioned>;
  util.assertEqual<Unioned, { a: string; b?: string | undefined } | { a?: string | undefined; b: string }>(true);
});

test("inferred enum type", async () => {
  const Enum = Schema.object({ a: Schema.string(), b: Schema.string().optional() }).keyof();

  expect(Enum.Values).toEqual({
    a: "a",
    b: "b",
  });
  expect(Enum.enum).toEqual({
    a: "a",
    b: "b",
  });
  expect(Enum._def.values).toEqual(["a", "b"]);
  type Enum = Schema.infer<typeof Enum>;
  util.assertEqual<Enum, "a" | "b">(true);
});

test("inferred partial object type with optional properties", async () => {
  const Partial = Schema.object({ a: Schema.string(), b: Schema.string().optional() }).partial();
  type Partial = Schema.infer<typeof Partial>;
  util.assertEqual<Partial, { a?: string | undefined; b?: string | undefined }>(true);
});

test("inferred picked object type with optional properties", async () => {
  const Picked = Schema.object({ a: Schema.string(), b: Schema.string().optional() }).pick({ b: true });
  type Picked = Schema.infer<typeof Picked>;
  util.assertEqual<Picked, { b?: string | undefined }>(true);
});

test("inferred type for unknown/any keys", () => {
  const myType = Schema.object({
    anyOptional: Schema.any().optional(),
    anyRequired: Schema.any(),
    unknownOptional: Schema.unknown().optional(),
    unknownRequired: Schema.unknown(),
  });
  type myType = Schema.infer<typeof myType>;
  util.assertEqual<
    myType,
    {
      anyOptional?: any;
      anyRequired?: any;
      unknownOptional?: unknown;
      unknownRequired?: unknown;
    }
  >(true);
});

test("setKey", () => {
  const base = Schema.object({ name: Schema.string() });
  const withNewKey = base.setKey("age", Schema.number());

  type withNewKey = Schema.infer<typeof withNewKey>;
  util.assertEqual<withNewKey, { name: string; age: number }>(true);
  withNewKey.parse({ name: "asdf", age: 1234 });
});

test("strictcreate", async () => {
  const strictObj = Schema.strictObject({
    name: Schema.string(),
  });

  const syncResult = strictObj.safeParse({ name: "asdf", unexpected: 13 });
  expect(syncResult.success).toEqual(false);

  const asyncResult = await strictObj.spa({ name: "asdf", unexpected: 13 });
  expect(asyncResult.success).toEqual(false);
});

test("object with refine", async () => {
  const schema = z
    .object({
      a: Schema.string().default("foo"),
      b: Schema.number(),
    })
    .refine(() => true);
  expect(Schema.parse({ b: 5 })).toEqual({ b: 5, a: "foo" });
  const result = await Schema.parseAsync({ b: 5 });
  expect(result).toEqual({ b: 5, a: "foo" });
});

test("intersection of object with date", async () => {
  const schema = Schema.object({
    a: Schema.date(),
  });
  expect(Schema.and(schema).parse({ a: new Date(1637353595983) })).toEqual({
    a: new Date(1637353595983),
  });
  const result = await Schema.parseAsync({ a: new Date(1637353595983) });
  expect(result).toEqual({ a: new Date(1637353595983) });
});

test("intersection of object with refine with date", async () => {
  const schema = z
    .object({
      a: Schema.date(),
    })
    .refine(() => true);
  expect(Schema.and(schema).parse({ a: new Date(1637353595983) })).toEqual({
    a: new Date(1637353595983),
  });
  const result = await Schema.parseAsync({ a: new Date(1637353595983) });
  expect(result).toEqual({ a: new Date(1637353595983) });
});

test("constructor key", () => {
  const person = z
    .object({
      name: Schema.string(),
    })
    .strict();

  expect(() =>
    person.parse({
      name: "bob dylan",
      constructor: 61,
    })
  ).toThrow();
});

test("constructor key", () => {
  const Example = Schema.object({
    prop: Schema.string(),
    opt: Schema.number().optional(),
    arr: Schema.string().array(),
  });

  type Example = Schema.infer<typeof Example>;
  util.assertEqual<keyof Example, "prop" | "opt" | "arr">(true);
});

test("unknownkeys merging", () => {
  // This one is "strict"
  const schemaA = z
    .object({
      a: Schema.string(),
    })
    .strict();

  // This one is "strip"
  const schemaB = z
    .object({
      b: Schema.string(),
    })
    .catchall(Schema.string());

  const mergedSchema = schemaA.merge(schemaB);
  type mergedSchema = typeof mergedSchema;
  util.assertEqual<mergedSchema["_def"]["unknownKeys"], "strip">(true);
  expect(mergedSchema._def.unknownKeys).toEqual("strip");

  util.assertEqual<mergedSchema["_def"]["catchall"], Schema.SchemaString>(true);
  expect(mergedSchema._def.catchall instanceof Schema.SchemaString).toEqual(true);
});

const personToExtend = Schema.object({
  firstName: Schema.string(),
  lastName: Schema.string(),
});

test("extend() should return schema with new key", () => {
  const PersonWithNickname = personToExtend.extend({ nickName: Schema.string() });
  type PersonWithNickname = Schema.infer<typeof PersonWithNickname>;

  const expected = { firstName: "f", nickName: "n", lastName: "l" };
  const actual = PersonWithNickname.parse(expected);

  expect(actual).toEqual(expected);
  util.assertEqual<keyof PersonWithNickname, "firstName" | "lastName" | "nickName">(true);
  util.assertEqual<PersonWithNickname, { firstName: string; lastName: string; nickName: string }>(true);
});

test("extend() should have power to override existing key", () => {
  const PersonWithNumberAsLastName = personToExtend.extend({
    lastName: Schema.number(),
  });
  type PersonWithNumberAsLastName = Schema.infer<typeof PersonWithNumberAsLastName>;

  const expected = { firstName: "f", lastName: 42 };
  const actual = PersonWithNumberAsLastName.parse(expected);

  expect(actual).toEqual(expected);
  util.assertEqual<PersonWithNumberAsLastName, { firstName: string; lastName: number }>(true);
});

test("passthrough index signature", () => {
  const a = Schema.object({ a: Schema.string() });
  type a = Schema.infer<typeof a>;
  util.assertEqual<{ a: string }, a>(true);
  const b = a.passthrough();
  type b = Schema.infer<typeof b>;
  util.assertEqual<{ a: string } & { [k: string]: unknown }, b>(true);
});

test("xor", () => {
  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
  type XOR<T, U> = T extends object ? (U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : U) : T;

  type A = { name: string; a: number };
  type B = { name: string; b: number };
  type C = XOR<A, B>;
  type Outer = { data: C };

  const _Outer: Schema.SchemaType<Outer> = Schema.object({
    data: Schema.union([Schema.object({ name: Schema.string(), a: Schema.number() }), Schema.object({ name: Schema.string(), b: Schema.number() })]),
  });
});
