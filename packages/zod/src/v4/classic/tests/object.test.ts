import { describe, expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";
import * as core from "schema/v4/core";

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

  expectTypeOf<Schema.TypeOf<typeof Test>>().toEqualTypeOf<TestType>();
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

test("nonstrict by default", () => {
  Schema.object({ points: Schema.number() }).parse({
    points: 2314,
    unknown: "asdf",
  });
});

test("parse optional keys ", () => {
  const schema = Schema.object({
    a: Schema.string().optional(),
  });
  expect(Schema.parse({ a: "asdf" })).toEqual({ a: "asdf" });
});

test("empty object", () => {
  const schema = Schema.object({});
  expect(Schema.parse({})).toEqual({});
  expect(Schema.parse({ name: "asdf" })).toEqual({});
  expect(Schema.safeParse(null).success).toEqual(false);
  expect(Schema.safeParse("asdf").success).toEqual(false);
  expectTypeOf<Schema.output<typeof schema>>().toEqualTypeOf<Record<string, never>>();
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
  const val = Schema.object({ points: Schema.number() }).strict().passthrough().strip().passthrough().parse(data);

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
  // expectTypeOf<(typeof d1)["asdf"]>().toEqualTypeOf<number>();
  expectTypeOf<(typeof d1)["first"]>().toEqualTypeOf<string>();
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

test("optional keys are unset", () => {
  const SNamedEntity = Schema.object({
    id: Schema.string(),
    set: Schema.string().optional(),
    unset: Schema.string().optional(),
  });
  const result = SNamedEntity.parse({
    id: "asdf",
    set: undefined,
  });
  expect(Object.keys(result)).toEqual(["id", "set"]);
});

test("catchall parsing", async () => {
  const result = Schema.object({ name: Schema.string() }).catchall(Schema.number()).parse({ name: "Foo", validExtraKey: 61 });

  expect(result).toEqual({ name: "Foo", validExtraKey: 61 });

  const result2 = z
    .object({ name: Schema.string() })
    .catchall(Schema.number())
    .safeParse({ name: "Foo", validExtraKey: 61, invalid: "asdf" });

  expect(result2.success).toEqual(false);
});

test("nonexistent keys", async () => {
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

  expectTypeOf<asdf>().toEqualTypeOf<{ a: number }>();
});

test("inferred type with Record shape", () => {
  type A = Schema.SchemaObject<Record<string, Schema.SchemaType<string, number>>>;
  expectTypeOf<Schema.infer<A>>().toEqualTypeOf<Record<string, string>>();
  expectTypeOf<Schema.input<A>>().toEqualTypeOf<Record<string, number>>();

  type B = Schema.SchemaObject;
  expectTypeOf<Schema.infer<B>>().toEqualTypeOf<Record<string, unknown>>();
  expectTypeOf<Schema.input<B>>().toEqualTypeOf<Record<string, unknown>>();
});

test("inferred merged object type with optional properties", async () => {
  const Merged = z
    .object({ a: Schema.string(), b: Schema.string().optional() })
    .merge(Schema.object({ a: Schema.string().optional(), b: Schema.string() }));
  type Merged = Schema.infer<typeof Merged>;
  expectTypeOf<Merged>().toEqualTypeOf<{ a?: string | undefined; b: string }>();
});

test("inferred unioned object type with optional properties", async () => {
  const Unioned = Schema.union([
    Schema.object({ a: Schema.string(), b: Schema.string().optional() }),
    Schema.object({ a: Schema.string().optional(), b: Schema.string() }),
  ]);
  type Unioned = Schema.infer<typeof Unioned>;
  expectTypeOf<Unioned>().toEqualTypeOf<
    { a: string; b?: string | undefined } | { a?: string | undefined; b: string }
  >();
});

test("inferred enum type", async () => {
  const Enum = Schema.object({ a: Schema.string(), b: Schema.string().optional() }).keyof();

  expect(Enum.enum).toEqual({
    a: "a",
    b: "b",
  });

  expect(Enum._schema.def.entries).toEqual({
    a: "a",
    b: "b",
  });
  type Enum = Schema.infer<typeof Enum>;
  expectTypeOf<Enum>().toEqualTypeOf<"a" | "b">();
});

test("Schema.keyof returns enum", () => {
  const User = Schema.object({ name: Schema.string(), age: Schema.number() });
  const keysSchema = Schema.keyof(User);
  expect(keysSchema.enum).toEqual({
    name: "name",
    age: "age",
  });
  expect(keysSchema._schema.def.entries).toEqual({
    name: "name",
    age: "age",
  });
  type Keys = Schema.infer<typeof keysSchema>;
  expectTypeOf<Keys>().toEqualTypeOf<"name" | "age">();
});

test("inferred partial object type with optional properties", async () => {
  const Partial = Schema.object({ a: Schema.string(), b: Schema.string().optional() }).partial();
  type Partial = Schema.infer<typeof Partial>;
  expectTypeOf<Partial>().toEqualTypeOf<{ a?: string | undefined; b?: string | undefined }>();
});

test("inferred picked object type with optional properties", async () => {
  const Picked = Schema.object({ a: Schema.string(), b: Schema.string().optional() }).pick({ b: true });
  type Picked = Schema.infer<typeof Picked>;
  expectTypeOf<Picked>().toEqualTypeOf<{ b?: string | undefined }>();
});

test("inferred type for unknown/any keys", () => {
  const myType = Schema.object({
    anyOptional: Schema.any().optional(),
    anyRequired: Schema.any(),
    unknownOptional: Schema.unknown().optional(),
    unknownRequired: Schema.unknown(),
  });
  type myType = Schema.infer<typeof myType>;
  expectTypeOf<myType>().toEqualTypeOf<{
    anyOptional?: any;
    anyRequired: any;
    unknownOptional?: unknown;
    unknownRequired: unknown;
  }>();
});

test("strictObject", async () => {
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
  expect(Schema.intersection(schema, schema).parse({ a: new Date(1637353595983) })).toEqual({
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
  expect(Schema.intersection(schema, schema).parse({ a: new Date(1637353595983) })).toEqual({
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
  expectTypeOf<keyof Example>().toEqualTypeOf<"prop" | "opt" | "arr">();
});

test("catchall", () => {
  const a = Schema.object({});
  expect(a._schema.def.catchall).toBeUndefined();

  const b = Schema.strictObject({});
  expect(b._schema.def.catchall).toBeInstanceOf(core.$SchemaNever);

  const c = Schema.looseObject({});
  expect(c._schema.def.catchall).toBeInstanceOf(core.$SchemaUnknown);

  const d = Schema.object({}).catchall(Schema.number());
  expect(d._schema.def.catchall).toBeInstanceOf(core.$SchemaNumber);
});

test("unknownkeys merging", () => {
  // This one is "strict"
  const a = Schema.looseObject({
    a: Schema.string(),
  });

  const b = Schema.strictObject({ b: Schema.string() });

  // incoming object overrides
  const c = a.merge(b);
  expect(c._schema.def.catchall).toBeInstanceOf(core.$SchemaNever);
});

test("merge() throws when receiver has refinements", () => {
  const a = z
    .object({
      password: Schema.string(),
      confirmPassword: Schema.string(),
    })
    .refine((data) => data.password === data.confirmPassword);

  const b = Schema.object({ email: Schema.string() });

  expect(() => a.merge(b)).toThrow(".merge() cannot be used on object schemas containing refinements");
});

test("merge() throws when receiver has superRefine", () => {
  const a = Schema.object({ x: Schema.string() }).superRefine(() => {});
  const b = Schema.object({ y: Schema.number() });

  expect(() => a.merge(b)).toThrow(".merge() cannot be used on object schemas containing refinements");
});

test("merge() preserves refinements on the second schema", () => {
  const a = Schema.object({ name: Schema.string() });
  const b = Schema.object({ age: Schema.number() }).refine((data) => data.age >= 18, { message: "Must be 18+" });

  const merged = a.merge(b);

  expect(merged.parse({ name: "n", age: 21 })).toEqual({ name: "n", age: 21 });
  expect(() => merged.parse({ name: "n", age: 12 })).toThrow("Must be 18+");
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
  expectTypeOf<keyof PersonWithNickname>().toEqualTypeOf<"firstName" | "lastName" | "nickName">();
  expectTypeOf<PersonWithNickname>().toEqualTypeOf<{ firstName: string; lastName: string; nickName: string }>();
});

test("extend() should have power to override existing key", () => {
  const PersonWithNumberAsLastName = personToExtend.extend({
    lastName: Schema.number(),
  });
  type PersonWithNumberAsLastName = Schema.infer<typeof PersonWithNumberAsLastName>;

  const expected = { firstName: "f", lastName: 42 };
  const actual = PersonWithNumberAsLastName.parse(expected);

  expect(actual).toEqual(expected);
  expectTypeOf<PersonWithNumberAsLastName>().toEqualTypeOf<{ firstName: string; lastName: number }>();
});

test("safeExtend() should have power to override existing key", () => {
  const PersonWithMinLastName = personToExtend.safeExtend({
    lastName: Schema.string().min(3),
  });
  type PersonWithMinLastName = Schema.infer<typeof PersonWithMinLastName>;

  const expected = { firstName: "f", lastName: "abc" };
  const actual = PersonWithMinLastName.parse(expected);

  expect(actual).toEqual(expected);
  expect(() => PersonWithMinLastName.parse({ firstName: "f", lastName: "ab" })).toThrow();
  expectTypeOf<PersonWithMinLastName>().toEqualTypeOf<{ firstName: string; lastName: string }>();
});

test("safeExtend() maintains refinements", () => {
  const schema = Schema.object({ name: Schema.string().min(1) });
  const extended = Schema.safeExtend({ name: Schema.string().min(2) });
  expect(() => extended.parse({ name: "" })).toThrow();
  expect(extended.parse({ name: "ab" })).toEqual({ name: "ab" });
  type Extended = Schema.infer<typeof extended>;
  expectTypeOf<Extended>().toEqualTypeOf<{ name: string }>();
  // @ts-expect-error
  Schema.safeExtend({ name: Schema.number() });
});

test("passthrough index signature", () => {
  const a = Schema.object({ a: Schema.string() });
  type a = Schema.infer<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<{ a: string }>();
  const b = a.passthrough();
  type b = Schema.infer<typeof b>;
  expectTypeOf<b>().toEqualTypeOf<{ a: string; [k: string]: unknown }>();
});

// test("xor", () => {
//   type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
//   type XOR<T, U> = T extends object ? (U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : U) : T;

//   type A = { name: string; a: number };
//   type B = { name: string; b: number };
//   type C = XOR<A, B>;
//   type Outer = { data: C };
//   const Outer = Schema.object({
//     data: Schema.union([Schema.object({ name: Schema.string(), a: Schema.number() }), Schema.object({ name: Schema.string(), b: Schema.number() })]),
//   }) satisfies Schema.SchemaType<Outer, any>;
// });

test("assignability", () => {
  Schema.object({ a: Schema.string() }) satisfies Schema.SchemaObject<{ a: Schema.SchemaString }>;
  Schema.object({ a: Schema.string() }).catchall(Schema.number()) satisfies Schema.SchemaObject<{ a: Schema.SchemaString }>;
  Schema.object({ a: Schema.string() }).strict() satisfies Schema.SchemaObject;
  Schema.object({}) satisfies Schema.SchemaObject;

  Schema.looseObject({ name: Schema.string() }) satisfies Schema.SchemaObject<
    {
      name: Schema.SchemaString;
    },
    Schema.core.$loose
  >;
  Schema.looseObject({ name: Schema.string() }) satisfies Schema.SchemaObject<{
    name: Schema.SchemaString;
  }>;
  Schema.strictObject({ name: Schema.string() }) satisfies Schema.SchemaObject<
    {
      name: Schema.SchemaString;
    },
    Schema.core.$loose
  >;
  Schema.strictObject({ name: Schema.string() }) satisfies Schema.SchemaObject<
    {
      name: Schema.SchemaString;
    },
    Schema.core.$strict
  >;
  Schema.object({ name: Schema.string() }) satisfies Schema.SchemaObject<{
    name: Schema.SchemaString;
  }>;
  Schema.object({
    a: Schema.string(),
    b: Schema.number(),
    c: Schema.boolean(),
  }) satisfies Schema.core.$SchemaObject;
});

test("null prototype", () => {
  const schema = Schema.object({ a: Schema.string() });
  const obj = Object.create(null);
  obj.a = "foo";
  expect(Schema.parse(obj)).toEqual({ a: "foo" });
});

test("empty objects", () => {
  const A = Schema.looseObject({});
  type Ain = Schema.input<typeof A>;
  expectTypeOf<Ain>().toEqualTypeOf<Record<string, unknown>>();
  type Aout = Schema.output<typeof A>;
  expectTypeOf<Aout>().toEqualTypeOf<Record<string, unknown>>();

  const B = Schema.object({});
  type Bout = Schema.output<typeof B>;
  expectTypeOf<Bout>().toEqualTypeOf<Record<string, never>>();
  type Bin = Schema.input<typeof B>;
  expectTypeOf<Bin>().toEqualTypeOf<Record<string, never>>();

  const C = Schema.strictObject({});
  type Cout = Schema.output<typeof C>;
  expectTypeOf<Cout>().toEqualTypeOf<Record<string, never>>();
  type Cin = Schema.input<typeof C>;
  expectTypeOf<Cin>().toEqualTypeOf<Record<string, never>>();
});

test("preserve key order", () => {
  const schema = Schema.object({
    a: Schema.string().optional(),
    b: Schema.string(),
  });
  const r1 = Schema.safeParse({ a: "asdf", b: "qwer" });
  const r2 = Schema.safeParse({ a: "asdf", b: "qwer" }, { jitless: true });

  expect(Object.keys(r1.data!)).toMatchInlineSnapshot(`
    [
      "a",
      "b",
    ]
  `);
  expect(Object.keys(r1.data!)).toEqual(Object.keys(r2.data!));
});

test("empty shape", () => {
  const a = Schema.object({});

  a.parse({});
  a.parse({}, { jitless: true });
  a.parse(Object.create(null));
  a.parse(Object.create(null), { jitless: true });

  expect(() => a.parse([])).toThrow();
  expect(() => a.parse([], { jitless: true })).toThrow();
});

test("schematype assignability", () => {
  // Does not error
  Schema.object({ hello: Schema.string().optional() }) satisfies Schema.SchemaType<{ hello?: string | undefined }>;
  Schema.object({ hello: Schema.string() }) satisfies Schema.SchemaType<{ hello?: string | undefined }>;
  // @ts-expect-error
  Schema.object({}) satisfies Schema.SchemaType<{ hello: string | undefined }>;
  // @ts-expect-error
  Schema.object({ hello: Schema.string().optional() }) satisfies Schema.SchemaType<{ hello: string | undefined }>;
  // @ts-expect-error
  Schema.object({ hello: Schema.string().optional() }) satisfies Schema.SchemaType<{ hello: string }>;
  // @ts-expect-error
  Schema.object({ hello: Schema.number() }) satisfies Schema.SchemaType<{ hello?: string | undefined }>;
});

test("index signature in shape", () => {
  function makeSchemaObj<const T extends string>(key: T) {
    return Schema.looseObject({
      [key]: Schema.string(),
    });
  }

  const schema = makeSchemaObj("foo");
  type schema = Schema.infer<typeof schema>;

  expectTypeOf<schema>().toEqualTypeOf<Record<string, string>>();
});

test("extend() on object with refinements should throw when overwriting properties", () => {
  const schema = z
    .object({
      a: Schema.string(),
    })
    .refine(() => true);

  expect(() => Schema.extend({ a: Schema.number() })).toThrow();
});

test("extend() on object with refinements should not throw when adding new properties", () => {
  const schema = z
    .object({
      a: Schema.string(),
    })
    .refine((data) => data.a.length > 0);

  // Should not throw since 'b' doesn't overlap with 'a'
  const extended = Schema.extend({ b: Schema.number() });

  // Verify the extended schema works correctly
  expect(extended.parse({ a: "hello", b: 42 })).toEqual({ a: "hello", b: 42 });

  // Verify the original refinement still applies
  expect(() => extended.parse({ a: "", b: 42 })).toThrow();
});

test("safeExtend() on object with refinements should not throw", () => {
  const schema = z
    .object({
      a: Schema.string(),
    })
    .refine(() => true);

  expect(() => Schema.safeExtend({ b: Schema.string() })).not.toThrow();
});

// __proto__ in input must not replace the prototype of the parsed object via the assignment setter on the result {}.
describe("__proto__ in object catchall paths", () => {
  const protoInput = () => JSON.parse('{"__proto__":{"isAdmin":true},"name":"alice"}');

  test("looseObject drops __proto__ and preserves Object.prototype", () => {
    const schema = Schema.looseObject({ name: Schema.string() });
    const parsed = Schema.parse(protoInput());
    expect(Object.keys(parsed)).toEqual(["name"]);
    expect((parsed as any).isAdmin).toBeUndefined();
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
  });

  test("passthrough drops __proto__", () => {
    const schema = Schema.object({ name: Schema.string() }).passthrough();
    const parsed = Schema.parse(protoInput());
    expect((parsed as any).isAdmin).toBeUndefined();
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
  });

  test("catchall(unknown) drops __proto__", () => {
    const schema = Schema.object({ name: Schema.string() }).catchall(Schema.unknown());
    const parsed = Schema.parse(protoInput());
    expect((parsed as any).isAdmin).toBeUndefined();
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
  });

  test("safeParseAsync + jitless drops __proto__", async () => {
    const schema = Schema.looseObject({ name: Schema.string() });
    const result = await Schema.safeParseAsync(protoInput(), { jitless: true } as any);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).isAdmin).toBeUndefined();
      expect(Object.getPrototypeOf(result.data)).toBe(Object.prototype);
    }
  });

  test("strict surfaces __proto__ as unrecognized without copying it", () => {
    const schema = Schema.object({ name: Schema.string() }).strict();
    const result = Schema.safeParse(protoInput());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].code).toBe("unrecognized_keys");
      expect((result.error.issues[0] as any).keys).toEqual(["__proto__"]);
    }
  });

  test("strict accepts but strips a __proto__ key the shape declares", () => {
    const shape: any = { name: Schema.string() };
    Object.defineProperty(shape, "__proto__", {
      value: Schema.string(),
      enumerable: true,
      configurable: true,
      writable: true,
    });
    const input = JSON.parse('{"name":"alice","__proto__":"hello"}');

    for (const schema of [Schema.object(shape).strict(), Schema.object(shape).catchall(Schema.any()), Schema.object(shape)]) {
      const result = Schema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data)).toEqual(["name"]);
        expect(Object.getPrototypeOf(result.data)).toBe(Object.prototype);
      }
    }
  });

  test("strictObject and jitless agree with .strict()", async () => {
    for (const schema of [Schema.strictObject({ name: Schema.string() }), Schema.object({ name: Schema.string() }).strict()]) {
      for (const result of [
        Schema.safeParse(protoInput()),
        await Schema.safeParseAsync(protoInput(), {
          jitless: true,
        } as any),
      ]) {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect((result.error.issues[0] as any).keys).toEqual(["__proto__"]);
        }
      }
    }
  });
});

// Parsed objects always strip __proto__, including keys explicitly declared by the Schema.
describe("__proto__ as a declared shape key", () => {
  const protoInput = () => JSON.parse('{"__proto__":{"isAdmin":true},"name":"alice"}');
  const makeShape = () =>
    Object.fromEntries([
      ["__proto__", Schema.object({ isAdmin: Schema.boolean() })],
      ["name", Schema.string()],
    ]) as Record<string, any>;

  const expectStripped = (parsed: any) => {
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(parsed, "__proto__")).toBe(false);
    expect((parsed as any).isAdmin).toBeUndefined();
    expect(Object.keys(parsed)).toEqual(["name"]);
  };

  test("jit fastpass", () => {
    expectStripped(Schema.object(makeShape()).parse(protoInput()));
  });

  test("jitless", () => {
    expectStripped(Schema.object(makeShape()).parse(protoInput(), { jitless: true } as any));
  });

  test("async", async () => {
    const shape = Object.fromEntries([
      ["__proto__", Schema.object({ isAdmin: Schema.boolean() }).refine(async () => true)],
      ["name", Schema.string()],
    ]) as Record<string, any>;
    expectStripped(await Schema.object(shape).parseAsync(protoInput()));
  });

  test("primitive value is stripped", () => {
    const schema = Schema.object(Object.fromEntries([["__proto__", Schema.string()]]) as Record<string, any>);
    const parsed: any = Schema.parse(JSON.parse('{"__proto__":"hello"}'));
    expect(Object.prototype.hasOwnProperty.call(parsed, "__proto__")).toBe(false);
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
  });

  test("declared key is not validated", () => {
    const schema = Schema.object(Object.fromEntries([["__proto__", Schema.string()]]) as Record<string, any>);
    expect(Schema.parse(JSON.parse('{"__proto__":123}'))).toEqual({});
  });

  test("required, optional, and defaulted declarations are all stripped", () => {
    const shape = (schema: Schema.SchemaType) => Object.fromEntries([["__proto__", schema]]) as Record<string, any>;

    for (const jitless of [false, true]) {
      const ctx = { jitless } as any;
      expect(Schema.object(shape(Schema.unknown())).parse({}, ctx)).toEqual({});
      expect(Schema.object(shape(Schema.string().optional())).parse({}, ctx)).toEqual({});
      expect(Schema.object(shape(Schema.string().default("fallback"))).parse({}, ctx)).toEqual({});
    }
  });

  test("an own getter is not evaluated", () => {
    let reads = 0;
    const input = Object.defineProperty({}, "__proto__", {
      get() {
        reads++;
        return "value";
      },
      enumerable: true,
    });
    const schema = Schema.object(Object.fromEntries([["__proto__", Schema.string()]]) as Record<string, any>);

    expect(Schema.parse(input)).toEqual({});
    expect(reads).toBe(0);
  });

  test("pick keeps a declared key", () => {
    const shape = Object.fromEntries([["__proto__", Schema.string()]]) as Record<string, any>;
    const mask = Object.fromEntries([["__proto__", true]]) as Record<string, true>;
    const picked = Schema.object(shape).pick(mask);

    expect(Object.keys(picked.shape)).toEqual(["__proto__"]);
    const parsed: any = picked.parse(Object.fromEntries([["__proto__", "value"]]));
    expect(parsed).toEqual({});
    expect(() => Schema.object({ value: Schema.string() }).pick(mask as any).shape).toThrow('Unrecognized key: "__proto__"');
  });

  test.each(["omit", "partial", "required"] as const)("%s rejects an undeclared key", (method) => {
    const mask = Object.fromEntries([["__proto__", true]]);
    const schema = Schema.object({ value: Schema.string() });

    expect(() => (schema[method] as any)(mask).shape).toThrow('Unrecognized key: "__proto__"');
  });

  // the mask is checked against the source's declared keys, which reads without resolving them, so it throws where the mistake is
  test.each(["pick", "omit", "partial", "required"] as const)("%s rejects an undeclared key at the call", (method) => {
    const schema = Schema.object({ value: Schema.string() });

    expect(() => (schema[method] as any)({ nope: true })).toThrow('Unrecognized key: "nope"');
  });

  // a derived shape is built key by key, and a plain assignment runs whatever setter answers to the key — `__proto__` always has one, and a polluted prototype can supply one for any name
  test("an inherited setter cannot swallow a derived key", () => {
    let swallowed: unknown;
    Object.defineProperty(Object.prototype, "field", {
      configurable: true,
      set(v) {
        swallowed = v;
      },
      get() {
        return undefined;
      },
    });

    try {
      const derived = Schema.object({ field: Schema.string() }).extend({ extra: Schema.number() });

      expect(Object.keys(derived.shape)).toEqual(["field", "extra"]);
      expect(swallowed).toBeUndefined();
      // the key is still validated; what a parse writes into its result is the ambient prototype's business, as it is without a builder
      expect(derived.safeParse({ field: 123, extra: 1 }).success).toBe(false);
      expect(derived.safeParse({ field: "a", extra: 1 }).success).toBe(true);
    } finally {
      delete (Object.prototype as any).field;
    }
  });

  // a shape resolves by object spread, so a non-enumerable entry is no part of it and no builder may promote one into a derived shape
  test("a non-enumerable shape entry stays out of every derived shape", () => {
    const sym = Symbol("kept");
    const hide = (target: Record<string, any>) =>
      Object.defineProperty(target, "hidden", { value: Schema.string(), enumerable: false, configurable: true });
    // each case needs a source whose shape is still unresolved, since resolving drops the entry on its own
    const source = () => Schema.object(hide({ b: Schema.number(), [sym]: Schema.boolean() }) as any);

    expect(Reflect.ownKeys(source().shape)).toEqual(["b", sym]);
    expect(Reflect.ownKeys(source().extend({ c: Schema.boolean() }).shape)).toEqual(["b", "c", sym]);
    expect(Reflect.ownKeys(source().partial().shape)).toEqual(["b", sym]);
    expect(Reflect.ownKeys(source().merge(Schema.object({ c: Schema.boolean() })).shape)).toEqual(["b", "c", sym]);
    expect(Object.keys(Schema.object({ b: Schema.number() }).extend(hide({}) as any).shape)).toEqual(["b"]);
    expect(() => source().pick({ hidden: true } as any)).toThrow('Unrecognized key: "hidden"');

    // promoting it would make a key the source ignores required
    expect(
      source()
        .extend({ c: Schema.boolean() })
        .safeParse({ b: 1, [sym]: true, c: true }).success
    ).toBe(true);
  });

  test("shape helpers preserve a declared key", () => {
    const shape = () =>
      Object.fromEntries([
        ["__proto__", Schema.string()],
        ["value", Schema.string()],
      ]) as Record<string, any>;
    const protoMask = Object.fromEntries([["__proto__", true]]);
    const valueMask = { value: true } as const;
    const shapes = [
      Schema.object(shape()).omit(valueMask).shape,
      Schema.object(shape()).partial(protoMask as any).shape,
      Schema.object(shape()).required(protoMask as any).shape,
    ];

    for (const next of shapes) {
      expect(Object.getPrototypeOf(next)).toBe(Object.prototype);
      expect(Object.prototype.hasOwnProperty.call(next, "__proto__")).toBe(true);
    }
  });

  test("Object.prototype is untouched", () => {
    Schema.object(makeShape()).parse(protoInput());
    expect(({} as any).isAdmin).toBeUndefined();
  });
});

test("object parsing still reads ordinary inherited properties", () => {
  const input = Object.create({ value: "inherited" });
  const schema = Schema.object({ value: Schema.string() });

  expect(Schema.parse(input)).toEqual({ value: "inherited" });
  expect(Schema.parse(input, { jitless: true } as any)).toEqual({ value: "inherited" });
});

describe("symbol keys in object shape", () => {
  const SYM = Symbol("sym");
  const OTHER = Symbol("other");

  test("parses and validates a declared symbol key", () => {
    const schema = Schema.object({ name: Schema.string(), [SYM]: Schema.number() });
    expectTypeOf<Schema.infer<typeof schema>>().toEqualTypeOf<{ name: string; [SYM]: number }>();

    for (const params of [undefined, { jitless: true } as any]) {
      expect(Schema.parse({ name: "alice", [SYM]: 42 }, params)).toEqual({ name: "alice", [SYM]: 42 });
      expect(Schema.safeParse({ name: "alice", [SYM]: "nope" }, params).success).toBe(false);
      expect(Schema.safeParse({ name: "alice" }, params).success).toBe(false);
    }
  });

  test("reports an invalid symbol value at the symbol's own path", () => {
    const schema = Schema.object({ [SYM]: Schema.number() });
    const result = Schema.safeParse({ [SYM]: "nope" });
    expect(result.error!.issues[0].path).toEqual([SYM]);
  });

  test("honours optionality and defaults on a symbol key", () => {
    expect(Schema.object({ [SYM]: Schema.number().optional() }).parse({})).toEqual({});
    expect(Schema.object({ [SYM]: Schema.number().default(7) }).parse({})).toEqual({ [SYM]: 7 });
  });

  test("a declared symbol key survives strict and loose", () => {
    expect(Schema.strictObject({ [SYM]: Schema.number() }).safeParse({ [SYM]: 1 }).success).toBe(true);
    expect(Schema.strictObject({ [SYM]: Schema.number() }).safeParse({ [SYM]: 1, extra: 1 }).success).toBe(false);
    expect(Schema.looseObject({ [SYM]: Schema.number() }).parse({ [SYM]: 1, extra: "e" })).toEqual({ [SYM]: 1, extra: "e" });
  });

  // Deliberate: hunting each input for undeclared symbols costs a `getOwnPropertySymbols` call on every parse of every strict/loose/catchall object, which measured +16-44% on `Schema.strictObject`. Declared keys are static and cost nothing, so only they are supported.
  test("an undeclared symbol key is ignored, not passed through or flagged", () => {
    expect(Schema.looseObject({ name: Schema.string() }).parse({ name: "a", [OTHER]: "x" })).toEqual({ name: "a" });
    expect(Schema.strictObject({ name: Schema.string() }).safeParse({ name: "a", [OTHER]: "x" }).success).toBe(true);
  });

  test("builder methods reach symbol keys", () => {
    const base = Schema.object({ a: Schema.string(), [SYM]: Schema.number() });
    expect(base.partial().safeParse({ a: "x" }).success).toBe(true);
    expect(base.partial().required().safeParse({ a: "x" }).success).toBe(false);
    expect(Reflect.ownKeys(base.pick({ [SYM]: true }).shape)).toEqual([SYM]);
    expect(Reflect.ownKeys(base.omit({ [SYM]: true }).shape)).toEqual(["a"]);
    expect(Reflect.ownKeys(Schema.object({ a: Schema.string() }).extend({ [SYM]: Schema.number() }).shape)).toEqual(["a", SYM]);
  });

  test("a cycle through a symbol key is detected like a string-keyed one", () => {
    const A: any = Schema.object({
      name: Schema.string(),
      get [SYM]() {
        return A.optional();
      },
    });
    const input: any = { name: "root" };
    input[SYM] = input;
    expect(A.safeParse(input).success).toBe(true);
    expect(() => Schema.compile(A, { strict: true })).toThrow(/does not support/);
  });

  test("extend's refinement-overlap guard sees symbol keys", () => {
    const refined = Schema.object({ a: Schema.string(), [SYM]: Schema.number() }).refine(() => true);
    expect(() => refined.extend({ a: Schema.string() })).toThrow(/Cannot overwrite keys/);
    expect(() => refined.extend({ [SYM]: Schema.string() })).toThrow(/Cannot overwrite keys/);
  });

  test("a symbol key is unrepresentable in JSON Schema", () => {
    const schema = Schema.object({ a: Schema.string(), [SYM]: Schema.number() });
    expect(() => Schema.toJSONSchema(schema)).toThrow(/Symbol keys cannot be represented/);
    expect(Schema.toJSONSchema(schema, { unrepresentable: "any" })).toMatchObject({ properties: { a: { type: "string" } } });
  });

  test("rejects a non-schema value under a symbol key", () => {
    expect(() => Schema.object({ [SYM]: 123 as any }).parse({})).toThrow(/Invalid element at key "Symbol\(sym\)"/);
  });
});
