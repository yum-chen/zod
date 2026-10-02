import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/mini";
import type { util } from "schema/v4/core";

test("factory checks", () => {
  const string = Schema.string({ checks: [Schema.minLength(1), Schema.maxLength(3)] as const });
  const number = Schema.number({ checks: [Schema.minimum(1), Schema.maximum(3)] as const });
  expectTypeOf<Schema.output<typeof string>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.output<typeof number>>().toEqualTypeOf<number>();
  for (const [schema, valid, invalid] of [
    [string, "ab", ""],
    [number, 2, 4],
  ] as const) {
    expect(Schema.validate(schema, valid)).toBe(true);
    expect(Schema.validate(schema, invalid)).toBe(false);
    expect(Schema._schema.parent).toBeUndefined();
    expect(Schema.validate(Schema.compile(schema), valid)).toBe(true);
    expect(Schema.validate(Schema.compile(schema), invalid)).toBe(false);
  }
  // @ts-expect-error numeric checks cannot validate strings
  Schema.string({ checks: [Schema.minimum(1)] });
  // @ts-expect-error length checks cannot validate numbers
  Schema.number({ checks: [Schema.minLength(1)] });
});

test("factory checks snapshot caller arrays", () => {
  for (const factory of [Schema.string, Schema.coerce.string]) {
    const checks = [Schema.minLength(1)];
    const schema = factory({ checks });
    let reads = 0;
    factory({
      get checks() {
        if (++reads > 1) throw new Error("checks read twice");
        return checks;
      },
    });
    expect(reads).toBe(1);
    checks.push(Schema.minLength(10));
    expect(Schema.validate(schema, "long")).toBe(true);
    expect(Schema.validate(Schema.compile(schema), "long")).toBe(true);
    expect(Schema.toJSONSchema(schema).minLength).toBe(1);
  }
  for (const factory of [Schema.number, Schema.coerce.number]) {
    const checks = [Schema.minimum(1)];
    const schema = factory({ checks });
    let reads = 0;
    factory({
      get checks() {
        if (++reads > 1) throw new Error("checks read twice");
        return checks;
      },
    });
    expect(reads).toBe(1);
    checks.push(Schema.minimum(10));
    expect(Schema.validate(schema, 3)).toBe(true);
    expect(Schema.validate(Schema.compile(schema), 3)).toBe(true);
    expect(Schema.toJSONSchema(schema).minimum).toBe(1);
  }
});

test("Schema.boolean", () => {
  const a = Schema.boolean();
  expect(Schema.parse(a, true)).toEqual(true);
  expect(Schema.parse(a, false)).toEqual(false);
  expect(() => Schema.parse(a, 123)).toThrow();
  expect(() => Schema.parse(a, "true")).toThrow();
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<boolean>();
});

test("Schema.bigint", () => {
  const a = Schema.bigint();
  expect(Schema.parse(a, BigInt(123))).toEqual(BigInt(123));
  expect(() => Schema.parse(a, 123)).toThrow();
  expect(() => Schema.parse(a, "123")).toThrow();
});

test("Schema.symbol", () => {
  const a = Schema.symbol();
  const sym = Symbol();
  expect(Schema.parse(a, sym)).toEqual(sym);
  expect(() => Schema.parse(a, "symbol")).toThrow();
});

test("Schema.date", () => {
  const a = Schema.date();
  const date = new Date();
  expect(Schema.parse(a, date)).toEqual(date);
  expect(() => Schema.parse(a, "date")).toThrow();
});

test("Schema.coerce.string", () => {
  const a = Schema.coerce.string();
  expect(Schema.parse(a, 123)).toEqual("123");
  expect(Schema.parse(a, true)).toEqual("true");
  expect(Schema.parse(a, null)).toEqual("null");
  expect(Schema.parse(a, undefined)).toEqual("undefined");
});

test("Schema.coerce.number", () => {
  const a = Schema.coerce.number();
  expect(Schema.parse(a, "123")).toEqual(123);
  expect(Schema.parse(a, "123.45")).toEqual(123.45);
  expect(Schema.parse(a, true)).toEqual(1);
  expect(Schema.parse(a, false)).toEqual(0);
  expect(() => Schema.parse(a, "abc")).toThrow();
});

test("Schema.coerce.boolean", () => {
  const a = Schema.coerce.boolean();
  // test booleans
  expect(Schema.parse(a, true)).toEqual(true);
  expect(Schema.parse(a, false)).toEqual(false);
  expect(Schema.parse(a, "true")).toEqual(true);
  expect(Schema.parse(a, "false")).toEqual(true);
  expect(Schema.parse(a, 1)).toEqual(true);
  expect(Schema.parse(a, 0)).toEqual(false);
  expect(Schema.parse(a, {})).toEqual(true);
  expect(Schema.parse(a, [])).toEqual(true);
  expect(Schema.parse(a, undefined)).toEqual(false);
  expect(Schema.parse(a, null)).toEqual(false);
  expect(Schema.parse(a, "")).toEqual(false);
});

test("Schema.coerce.bigint", () => {
  const a = Schema.coerce.bigint();
  expect(Schema.parse(a, "123")).toEqual(BigInt(123));
  expect(Schema.parse(a, 123)).toEqual(BigInt(123));
  expect(() => Schema.parse(a, "abc")).toThrow();
});

test("Schema.coerce.date", () => {
  const a = Schema.coerce.date();
  const date = new Date();
  expect(Schema.parse(a, date.toISOString())).toEqual(date);
  expect(Schema.parse(a, date.getTime())).toEqual(date);
  expect(() => Schema.parse(a, "invalid date")).toThrow();
});

test("Schema.iso.datetime", () => {
  const d1 = "2021-01-01T00:00:00Z";
  const d2 = "2021-01-01T00:00:00.123Z";
  const d3 = "2021-01-01T00:00:00";
  const d4 = "2021-01-01T00:00:00+07:00";
  const d5 = "bad data";

  // local: false, offset: false, precision: null
  const a = Schema.iso.datetime();
  expect(Schema.safeParse(a, d1).success).toEqual(true);
  expect(Schema.safeParse(a, d2).success).toEqual(true);
  expect(Schema.safeParse(a, d3).success).toEqual(false);
  expect(Schema.safeParse(a, d4).success).toEqual(false);
  expect(Schema.safeParse(a, d5).success).toEqual(false);

  const b = Schema.iso.datetime({ local: true });
  expect(Schema.safeParse(b, d1).success).toEqual(true);
  expect(Schema.safeParse(b, d2).success).toEqual(true);
  expect(Schema.safeParse(b, d3).success).toEqual(true);
  expect(Schema.safeParse(b, d4).success).toEqual(false);
  expect(Schema.safeParse(b, d5).success).toEqual(false);

  const c = Schema.iso.datetime({ offset: true });
  expect(Schema.safeParse(c, d1).success).toEqual(true);
  expect(Schema.safeParse(c, d2).success).toEqual(true);
  expect(Schema.safeParse(c, d3).success).toEqual(false);
  expect(Schema.safeParse(c, d4).success).toEqual(true);
  expect(Schema.safeParse(c, d5).success).toEqual(false);

  const d = Schema.iso.datetime({ precision: 3 });
  expect(Schema.safeParse(d, d1).success).toEqual(false);
  expect(Schema.safeParse(d, d2).success).toEqual(true);
  expect(Schema.safeParse(d, d3).success).toEqual(false);
  expect(Schema.safeParse(d, d4).success).toEqual(false);
  expect(Schema.safeParse(d, d5).success).toEqual(false);
});

test("Schema.iso.date", () => {
  const d1 = "2021-01-01";
  const d2 = "bad data";

  const a = Schema.iso.date();
  expect(Schema.safeParse(a, d1).success).toEqual(true);
  expect(Schema.safeParse(a, d2).success).toEqual(false);

  const b = Schema.string().check(Schema.iso.date());
  expect(Schema.safeParse(b, d1).success).toEqual(true);
  expect(Schema.safeParse(b, d2).success).toEqual(false);
});

test("Schema.iso.time", () => {
  const d1 = "00:00:00";
  const d2 = "00:00:00.123";
  const d3 = "bad data";

  const a = Schema.iso.time();
  expect(Schema.safeParse(a, d1).success).toEqual(true);
  expect(Schema.safeParse(a, d2).success).toEqual(true);
  expect(Schema.safeParse(a, d3).success).toEqual(false);

  const b = Schema.iso.time({ precision: 3 });
  expect(Schema.safeParse(b, d1).success).toEqual(false);
  expect(Schema.safeParse(b, d2).success).toEqual(true);
  expect(Schema.safeParse(b, d3).success).toEqual(false);

  const c = Schema.string().check(Schema.iso.time());
  expect(Schema.safeParse(c, d1).success).toEqual(true);
  expect(Schema.safeParse(c, d2).success).toEqual(true);
  expect(Schema.safeParse(c, d3).success).toEqual(false);
});

test("Schema.iso.duration", () => {
  const d1 = "P3Y6M4DT12H30M5S";
  const d2 = "bad data";

  const a = Schema.iso.duration();
  expect(Schema.safeParse(a, d1).success).toEqual(true);
  expect(Schema.safeParse(a, d2).success).toEqual(false);

  const b = Schema.string().check(Schema.iso.duration());
  expect(Schema.safeParse(b, d1).success).toEqual(true);
  expect(Schema.safeParse(b, d2).success).toEqual(false);
});

test("Schema.prefault preserves undefined output", async () => {
  const field = Schema.prefault(Schema.union([Schema.string(), Schema.undefined()]), () => undefined);
  const schema = Schema.object({ a: field });
  expectTypeOf<Schema.output<typeof field>>().toEqualTypeOf<string | undefined>();
  expectTypeOf<Schema.output<typeof schema>>().toEqualTypeOf<{ a: string | undefined }>();
  expect(Schema.parse(schema, {})).toStrictEqual({ a: undefined });
  expect(Schema.parse(schema, { a: undefined })).toStrictEqual({ a: undefined });
  expect(Schema.parse(schema, { a: "value" })).toStrictEqual({ a: "value" });
  expect(Schema.safeParse(schema, { a: 123 }).success).toBe(false);
  expect(await Schema.parseAsync(schema, {})).toStrictEqual({ a: undefined });
  expect(Schema.parse(Schema.object({ a: Schema.prefault(Schema.optional(Schema.string()), undefined) }), {})).toStrictEqual({ a: undefined });
  const transformed = Schema.prefault(
    Schema.pipe(
      Schema.string(),
      Schema.transform(() => undefined)
    ),
    "fallback"
  );
  expectTypeOf<Schema.output<typeof transformed>>().toEqualTypeOf<undefined>();
  expect(Schema.parse(Schema.object({ a: transformed }), {})).toStrictEqual({ a: undefined });
});

test("Schema.undefined", () => {
  const a = Schema.undefined();
  expect(Schema.parse(a, undefined)).toEqual(undefined);
  expect(() => Schema.parse(a, "undefined")).toThrow();
});

test("Schema.null", () => {
  const a = Schema.null();
  expect(Schema.parse(a, null)).toEqual(null);
  expect(() => Schema.parse(a, "null")).toThrow();
});

test("Schema.any", () => {
  const a = Schema.any();
  expect(Schema.parse(a, "hello")).toEqual("hello");
  expect(Schema.parse(a, 123)).toEqual(123);
  expect(Schema.parse(a, true)).toEqual(true);
  expect(Schema.parse(a, null)).toEqual(null);
  expect(Schema.parse(a, undefined)).toEqual(undefined);
  Schema.parse(a, {});
  Schema.parse(a, []);
  Schema.parse(a, Symbol());
  Schema.parse(a, new Date());
});

test("Schema.unknown", () => {
  const a = Schema.unknown();
  expect(Schema.parse(a, "hello")).toEqual("hello");
  expect(Schema.parse(a, 123)).toEqual(123);
  expect(Schema.parse(a, true)).toEqual(true);
  expect(Schema.parse(a, null)).toEqual(null);
  expect(Schema.parse(a, undefined)).toEqual(undefined);
  Schema.parse(a, {});
  Schema.parse(a, []);
  Schema.parse(a, Symbol());
  Schema.parse(a, new Date());
});

test("Schema.never", () => {
  const a = Schema.never();
  expect(() => Schema.parse(a, "hello")).toThrow();
});

test("Schema.void", () => {
  const a = Schema.void();
  expect(Schema.parse(a, undefined)).toEqual(undefined);
  expect(() => Schema.parse(a, null)).toThrow();
});

test("Schema.array", () => {
  const a = Schema.array(Schema.string());
  expect(Schema.parse(a, ["hello", "world"])).toEqual(["hello", "world"]);
  expect(() => Schema.parse(a, [123])).toThrow();
  expect(() => Schema.parse(a, "hello")).toThrow();
});

test("Schema.union", () => {
  const a = Schema.union([Schema.string(), Schema.number()]);
  expect(Schema.parse(a, "hello")).toEqual("hello");
  expect(Schema.parse(a, 123)).toEqual(123);
  expect(() => Schema.parse(a, true)).toThrow();
});

test("Schema.union([]) / Schema.xor([]) / Schema.discriminatedUnion(_, []) construct and reject all input", () => {
  for (const schema of [Schema.union([]), Schema.xor([])]) {
    const r = Schema.safeParse("anything");
    expect(r.success).toEqual(false);
    if (!r.success) {
      expect(r.error.issues[0].code).toBe("invalid_union");
      expect((r.error.issues[0] as any).errors).toEqual([]);
    }
  }
  const disc = Schema.discriminatedUnion("type", [] as any);
  const r = disc.safeParse({ type: "x" });
  expect(r.success).toEqual(false);
  if (!r.success) {
    expect(r.error.issues[0].code).toBe("invalid_union");
    expect((r.error.issues[0] as any).errors).toEqual([]);
    expect((r.error.issues[0] as any).options).toEqual([]);
  }
});

test("Schema.discriminatedUnion rejects object options missing the discriminator", () => {
  expect(() => Schema.discriminatedUnion("type", [Schema.object({ value: Schema.string() })])).toThrow(
    /Invalid discriminated union option at index "0"/
  );

  // An option whose shape cannot be listed without resolving it is left to the lookup map, on the first object parsed.
  const viaPipe = Schema.discriminatedUnion("type", [
    Schema.pipe(Schema.object({ value: Schema.literal("x") }), Schema.object({ value: Schema.literal("x") })),
  ]);
  expect(() => Schema.safeParse(viaPipe, { value: "x" })).toThrow(/Invalid discriminated union option at index "0"/);
});

test("Schema.discriminatedUnion infers mutually-recursive getter options", () => {
  const variantA = Schema.object({
    kind: Schema.literal("a"),
    get child() {
      return Schema.optional(tree);
    },
  });

  const variantB = Schema.object({
    kind: Schema.literal("b"),
    get sibling() {
      return Schema.optional(tree);
    },
  });

  const tree = Schema.discriminatedUnion("kind", [variantA, variantB]);

  type _Tree = { kind: "a"; child?: _Tree | undefined } | { kind: "b"; sibling?: _Tree | undefined };

  expectTypeOf<Schema.input<typeof tree>>().toEqualTypeOf<_Tree>();
  expectTypeOf<Schema.input<typeof tree>>().not.toBeAny();

  expect(Schema.parse(tree, { kind: "a", child: { kind: "b" } })).toEqual({ kind: "a", child: { kind: "b" } });
  expect(() => Schema.parse(tree, { kind: "c" })).toThrow();
});

test("Schema.intersection", () => {
  const a = Schema.intersection(Schema.object({ a: Schema.string() }), Schema.object({ b: Schema.number() }));
  expect(Schema.parse(a, { a: "hello", b: 123 })).toEqual({ a: "hello", b: 123 });
  expect(() => Schema.parse(a, { a: "hello" })).toThrow();
  expect(() => Schema.parse(a, { b: 123 })).toThrow();
  expect(() => Schema.parse(a, "hello")).toThrow();
});

test("Schema.tuple", () => {
  const a = Schema.tuple([Schema.string(), Schema.number()]);
  expect(Schema.parse(a, ["hello", 123])).toEqual(["hello", 123]);
  expect(() => Schema.parse(a, ["hello", "world"])).toThrow();
  expect(() => Schema.parse(a, [123, 456])).toThrow();
  expect(() => Schema.parse(a, "hello")).toThrow();

  // tuple with rest
  const b = Schema.tuple([Schema.string(), Schema.number(), Schema.optional(Schema.string())], Schema.boolean());
  type b = Schema.output<typeof b>;

  expectTypeOf<b>().toEqualTypeOf<[string, number, (string | undefined)?, ...boolean[]]>();
  const datas = [
    ["hello", 123],
    ["hello", 123, "world"],
    ["hello", 123, "world", true],
    ["hello", 123, "world", true, false, true],
  ];
  for (const data of datas) {
    expect(Schema.parse(b, data)).toEqual(data);
  }

  expect(() => Schema.parse(b, ["hello", 123, 123])).toThrow();
  expect(() => Schema.parse(b, ["hello", 123, "world", 123])).toThrow();

  // tuple with readonly args
  const cArgs = [Schema.string(), Schema.number(), Schema.optional(Schema.string())] as const;
  const c = Schema.tuple(cArgs, Schema.boolean());
  type c = Schema.output<typeof c>;
  expectTypeOf<c>().toEqualTypeOf<[string, number, (string | undefined)?, ...boolean[]]>();
});

test("Schema.record", () => {
  // record schema with enum keys
  const a = Schema.record(Schema.string(), Schema.string());
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<Record<string, string>>();

  const b = Schema.record(Schema.union([Schema.string(), Schema.number(), Schema.symbol()]), Schema.string());
  type b = Schema.output<typeof b>;
  expectTypeOf<b>().toEqualTypeOf<Record<string | number | symbol, string>>();
  expect(Schema.parse(b, { a: "hello", 1: "world", [Symbol.for("asdf")]: "symbol" })).toEqual({
    a: "hello",
    1: "world",
    [Symbol.for("asdf")]: "symbol",
  });

  // enum keys
  const c = Schema.record(Schema.enum(["a", "b", "c"]), Schema.string());
  type c = Schema.output<typeof c>;
  expectTypeOf<c>().toEqualTypeOf<Record<"a" | "b" | "c", string>>();
  expect(Schema.parse(c, { a: "hello", b: "world", c: "world" })).toEqual({
    a: "hello",
    b: "world",
    c: "world",
  });
  // missing keys
  expect(() => Schema.parse(c, { a: "hello", b: "world" })).toThrow();
  // extra keys
  expect(() => Schema.parse(c, { a: "hello", b: "world", c: "world", d: "world" })).toThrow();

  // literal union keys
  const d = Schema.record(Schema.union([Schema.literal("a"), Schema.literal(0)]), Schema.string());
  type d = Schema.output<typeof d>;
  expectTypeOf<d>().toEqualTypeOf<Record<"a" | 0, string>>();
  expect(Schema.parse(d, { a: "hello", 0: "world" })).toEqual({
    a: "hello",
    0: "world",
  });

  // TypeScript enum keys
  enum Enum {
    A = 0,
    B = "hi",
  }

  const e = Schema.record(Schema.enum(Enum), Schema.string());
  type e = Schema.output<typeof e>;
  expectTypeOf<e>().toEqualTypeOf<Record<Enum, string>>();
  expect(Schema.parse(e, { [Enum.A]: "hello", [Enum.B]: "world" })).toEqual({
    [Enum.A]: "hello",
    [Enum.B]: "world",
  });

  const partial = Schema.partialRecord(Schema.enum(["__proto__", "b"]), Schema.string());
  type partial = Schema.output<typeof partial>;
  expectTypeOf<partial>().toEqualTypeOf<Partial<Record<"__proto__" | "b", string>>>();
  const parsed: any = Schema.parse(partial, Object.fromEntries([["__proto__", "declared"]]));
  expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
  expect(Object.prototype.hasOwnProperty.call(parsed, "__proto__")).toBe(false);
  expect(parsed).toEqual({});
  expect(Schema.parse(partial, {})).toEqual({});

  // v3-compat single-arg form: Schema.record(valueType) defaults keyType to Schema.string()
  const f = (Schema.record as any)(Schema.number());
  expect(f._schema.def.keyType._schema.def.type).toEqual("string");
  expect(f._schema.def.valueType._schema.def.type).toEqual("number");
  expect(Schema.parse(f, { a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
});

test("Schema.map", () => {
  const a = Schema.map(Schema.string(), Schema.number());
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<Map<string, number>>();
  expect(Schema.parse(a, new Map([["hello", 123]]))).toEqual(new Map([["hello", 123]]));
  expect(() => Schema.parse(a, new Map([["hello", "world"]]))).toThrow();
  expect(() => Schema.parse(a, new Map([[1243, "world"]]))).toThrow();
  expect(() => Schema.parse(a, "hello")).toThrow();

  const r1 = Schema.safeParse(a, new Map([[123, 123]]));
  expect(r1.error?.issues[0].code).toEqual("invalid_type");
  expect(r1.error?.issues[0].path).toEqual([123]);

  const r2: any = Schema.safeParse(a, new Map([[BigInt(123), 123]]));
  expect(r2.error!.issues[0].code).toEqual("invalid_key");
  expect(r2.error!.issues[0].path).toEqual([]);

  const r3: any = Schema.safeParse(a, new Map([["hello", "world"]]));
  expect(r3.error!.issues[0].code).toEqual("invalid_type");
  expect(r3.error!.issues[0].path).toEqual(["hello"]);
});

test("Schema.map invalid_element", () => {
  const a = Schema.map(Schema.bigint(), Schema.number());
  const r1 = Schema.safeParse(a, new Map([[BigInt(123), BigInt(123)]]));

  expect(r1.error!.issues[0].code).toEqual("invalid_element");
  expect(r1.error!.issues[0].path).toEqual([]);
});

test("Schema.map async", async () => {
  const a = Schema.map(Schema.string().check(Schema.refine(async () => true)), Schema.number().check(Schema.refine(async () => true)));
  const d1 = new Map([["hello", 123]]);
  expect(await Schema.parseAsync(a, d1)).toEqual(d1);

  await expect(Schema.parseAsync(a, new Map([[123, 123]]))).rejects.toThrow();
  await expect(Schema.parseAsync(a, new Map([["hi", "world"]]))).rejects.toThrow();
  await expect(Schema.parseAsync(a, new Map([[1243, "world"]]))).rejects.toThrow();
  await expect(Schema.parseAsync(a, "hello")).rejects.toThrow();

  const r = await Schema.safeParseAsync(a, new Map([[123, 123]]));
  expect(r.success).toEqual(false);
  expect(r.error!.issues[0].code).toEqual("invalid_type");
  expect(r.error!.issues[0].path).toEqual([123]);
});

test("Schema.set", () => {
  const a = Schema.set(Schema.string());
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<Set<string>>();
  expect(Schema.parse(a, new Set(["hello", "world"]))).toEqual(new Set(["hello", "world"]));
  expect(() => Schema.parse(a, new Set([123]))).toThrow();
  expect(() => Schema.parse(a, ["hello", "world"])).toThrow();
  expect(() => Schema.parse(a, "hello")).toThrow();

  const b = Schema.set(Schema.number());
  expect(Schema.parse(b, new Set([1, 2, 3]))).toEqual(new Set([1, 2, 3]));
  expect(() => Schema.parse(b, new Set(["hello"]))).toThrow();
  expect(() => Schema.parse(b, [1, 2, 3])).toThrow();
  expect(() => Schema.parse(b, 123)).toThrow();
});

test("Schema.enum", () => {
  const a = Schema.enum(["A", "B", "C"]);
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<"A" | "B" | "C">();
  expect(Schema.parse(a, "A")).toEqual("A");
  expect(Schema.parse(a, "B")).toEqual("B");
  expect(Schema.parse(a, "C")).toEqual("C");
  expect(() => Schema.parse(a, "D")).toThrow();
  expect(() => Schema.parse(a, 123)).toThrow();

  // expect(a.enum.A).toEqual("A");
  // expect(a.enum.B).toEqual("B");
  // expect(a.enum.C).toEqual("C");
  // expect((a.enum as any).D).toEqual(undefined);
});

test("Schema.enum - native", () => {
  enum NativeEnum {
    A = "A",
    B = "B",
    C = "C",
  }
  const a = Schema.enum(NativeEnum);
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<NativeEnum>();
  expect(Schema.parse(a, NativeEnum.A)).toEqual(NativeEnum.A);
  expect(Schema.parse(a, NativeEnum.B)).toEqual(NativeEnum.B);
  expect(Schema.parse(a, NativeEnum.C)).toEqual(NativeEnum.C);
  expect(() => Schema.parse(a, "D")).toThrow();
  expect(() => Schema.parse(a, 123)).toThrow();

  // test a.enum
  a;
  // expect(a.enum.A).toEqual(NativeEnum.A);
  // expect(a.enum.B).toEqual(NativeEnum.B);
  // expect(a.enum.C).toEqual(NativeEnum.C);

  enum NumericEnum {
    A = 0,
    B = 1,
  }

  // numeric enums carry reverse-mapping keys; options lists only what parse accepts
  expect(Schema.enum(NumericEnum).options).toEqual([NumericEnum.A, NumericEnum.B]);
});

test("Schema.nativeEnum", () => {
  enum NativeEnum {
    A = "A",
    B = "B",
    C = "C",
  }
  const a = Schema.nativeEnum(NativeEnum);
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<NativeEnum>();
  expect(Schema.parse(a, NativeEnum.A)).toEqual(NativeEnum.A);
  expect(Schema.parse(a, NativeEnum.B)).toEqual(NativeEnum.B);
  expect(Schema.parse(a, NativeEnum.C)).toEqual(NativeEnum.C);
  expect(() => Schema.parse(a, "D")).toThrow();
  expect(() => Schema.parse(a, 123)).toThrow();

  // test a.enum
  a;
  // expect(a.enum.A).toEqual(NativeEnum.A);
  // expect(a.enum.B).toEqual(NativeEnum.B);
  // expect(a.enum.C).toEqual(NativeEnum.C);
});

test("Schema.literal", () => {
  const a = Schema.literal("hello");
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<"hello">();
  expect(Schema.parse(a, "hello")).toEqual("hello");
  expect(() => Schema.parse(a, "world")).toThrow();
  expect(() => Schema.parse(a, 123)).toThrow();

  Schema.literal(["adf"] as const);
});

test("Schema.file", () => {
  const a = Schema.file();
  const file = new File(["content"], "filename.txt", { type: "text/plain" });
  expect(Schema.parse(a, file)).toEqual(file);
  expect(() => Schema.parse(a, "file")).toThrow();
  expect(() => Schema.parse(a, 123)).toThrow();
});

test("Schema.transform", () => {
  const a = Schema.pipe(
    Schema.string(),
    Schema.transform((val) => val.toUpperCase())
  );
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<string>();
  expect(Schema.parse(a, "hello")).toEqual("HELLO");
  expect(() => Schema.parse(a, 123)).toThrow();
});

test("Schema.transform async", async () => {
  const a = Schema.pipe(
    Schema.string(),
    Schema.transform(async (val) => val.toUpperCase())
  );
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<string>();
  expect(await Schema.parseAsync(a, "hello")).toEqual("HELLO");
  await expect(() => Schema.parseAsync(a, 123)).rejects.toThrow();
});

test("Schema.preprocess", () => {
  const a = Schema.pipe(
    Schema.transform((val) => String(val).toUpperCase()),
    Schema.string()
  );
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<string>();
  expect(Schema.parse(a, 123)).toEqual("123");
  expect(Schema.parse(a, true)).toEqual("TRUE");
  expect(Schema.parse(a, BigInt(1234))).toEqual("1234");
  // expect(() => Schema.parse(a, Symbol("asdf"))).toThrow();
});

// test("Schema.preprocess async", () => {
//   const a = Schema.preprocess(async (val) => String(val), Schema.string());
//   type a = Schema.output<typeof a>;
//   expectTypeOf<a>().toEqualTypeOf<string>();
//   expect(Schema.parse(a, 123)).toEqual("123");
//   expect(Schema.parse(a, true)).toEqual("true");
//   expect(() => Schema.parse(a, {})).toThrow();
// });

test("Schema.optional", () => {
  const a = Schema.optional(Schema.string());
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<string | undefined>();
  expect(Schema.parse(a, "hello")).toEqual("hello");
  expect(Schema.parse(a, undefined)).toEqual(undefined);
  expect(() => Schema.parse(a, 123)).toThrow();
});

test("Schema.nullable", () => {
  const a = Schema.nullable(Schema.string());
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<string | null>();
  expect(Schema.parse(a, "hello")).toEqual("hello");
  expect(Schema.parse(a, null)).toEqual(null);
  expect(() => Schema.parse(a, 123)).toThrow();
});

test("Schema.default", () => {
  const a = Schema._default(Schema.string(), "default");
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<string>();
  expect(Schema.parse(a, undefined)).toEqual("default");
  expect(Schema.parse(a, "hello")).toEqual("hello");
  expect(() => Schema.parse(a, 123)).toThrow();

  const b = Schema._default(Schema.string(), () => "default");
  expect(Schema.parse(b, undefined)).toEqual("default");
  expect(Schema.parse(b, "hello")).toEqual("hello");
  expect(() => Schema.parse(b, 123)).toThrow();
});

test("Schema.catch", () => {
  const a = Schema.catch(Schema.string(), "default");
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<string>();
  expect(Schema.parse(a, "hello")).toEqual("hello");
  expect(Schema.parse(a, 123)).toEqual("default");

  const b = Schema.catch(Schema.string(), () => "default");
  expect(Schema.parse(b, "hello")).toEqual("hello");
  expect(Schema.parse(b, 123)).toEqual("default");

  const c = Schema.catch(Schema.string(), (ctx) => {
    return `${ctx.error.issues.length}issues`;
  });
  expect(Schema.parse(c, 1234)).toEqual("1issues");
});

test("Schema.nan", () => {
  const a = Schema.nan();
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<number>();
  expect(Schema.parse(a, Number.NaN)).toEqual(Number.NaN);
  expect(() => Schema.parse(a, 123)).toThrow();
  expect(() => Schema.parse(a, "NaN")).toThrow();
});

test("Schema.pipe", () => {
  const a = Schema.pipe(
    Schema.pipe(
      Schema.string(),
      Schema.transform((val) => val.length)
    ),
    Schema.number()
  );
  type a_in = Schema.input<typeof a>;
  expectTypeOf<a_in>().toEqualTypeOf<string>();
  type a_out = Schema.output<typeof a>;
  expectTypeOf<a_out>().toEqualTypeOf<number>();

  expect(Schema.parse(a, "123")).toEqual(3);
  expect(Schema.parse(a, "hello")).toEqual(5);
  expect(() => Schema.parse(a, 123)).toThrow();
});

test("Schema.readonly", () => {
  const a = Schema.readonly(Schema.string());
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<Readonly<string>>();
  expect(Schema.parse(a, "hello")).toEqual("hello");
  expect(() => Schema.parse(a, 123)).toThrow();
});

test("Schema.templateLiteral", () => {
  const a = Schema.templateLiteral([Schema.string(), Schema.number()]);
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<`${string}${number}`>();
  expect(Schema.parse(a, "hello123")).toEqual("hello123");
  expect(() => Schema.parse(a, "hello")).toThrow();
  expect(() => Schema.parse(a, 123)).toThrow();

  // multipart
  const b = Schema.templateLiteral([Schema.string(), Schema.number(), Schema.string()]);
  type b = Schema.output<typeof b>;
  expectTypeOf<b>().toEqualTypeOf<`${string}${number}${string}`>();
  expect(Schema.parse(b, "hello123world")).toEqual("hello123world");
  expect(Schema.parse(b, "123")).toEqual("123");
  expect(() => Schema.parse(b, "hello")).toThrow();
  expect(() => Schema.parse(b, 123)).toThrow();

  // include boolean
  const c = Schema.templateLiteral([Schema.string(), Schema.boolean()]);
  type c = Schema.output<typeof c>;
  expectTypeOf<c>().toEqualTypeOf<`${string}${boolean}`>();
  expect(Schema.parse(c, "hellotrue")).toEqual("hellotrue");
  expect(Schema.parse(c, "hellofalse")).toEqual("hellofalse");
  expect(() => Schema.parse(c, "hello")).toThrow();
  expect(() => Schema.parse(c, 123)).toThrow();

  // include literal prefix
  const d = Schema.templateLiteral([Schema.literal("hello"), Schema.number()]);
  type d = Schema.output<typeof d>;
  expectTypeOf<d>().toEqualTypeOf<`hello${number}`>();
  expect(Schema.parse(d, "hello123")).toEqual("hello123");
  expect(() => Schema.parse(d, 123)).toThrow();
  expect(() => Schema.parse(d, "world123")).toThrow();

  // include literal union
  const e = Schema.templateLiteral([Schema.literal(["aa", "bb"]), Schema.number()]);
  type e = Schema.output<typeof e>;
  expectTypeOf<e>().toEqualTypeOf<`aa${number}` | `bb${number}`>();
  expect(Schema.parse(e, "aa123")).toEqual("aa123");
  expect(Schema.parse(e, "bb123")).toEqual("bb123");
  expect(() => Schema.parse(e, "cc123")).toThrow();
  expect(() => Schema.parse(e, 123)).toThrow();
});

// this returns both a schema and a check
test("Schema.custom", () => {
  const a = Schema.custom((val) => {
    return typeof val === "string";
  });
  expect(Schema.parse(a, "hello")).toEqual("hello");
  expect(() => Schema.parse(a, 123)).toThrow();

  const b = Schema.string().check(Schema.custom((val) => val.length > 3));

  expect(Schema.parse(b, "hello")).toEqual("hello");
  expect(() => Schema.parse(b, "hi")).toThrow();
});

test("Schema.check", () => {
  // this is a more flexible version of Schema.custom that accepts an arbitrary _parse logic the function should return core.$SchemaResult
  const a = Schema.any().check(
    Schema.check<string>((ctx) => {
      if (typeof ctx.value === "string") return;
      ctx.issues.push({
        code: "custom",
        origin: "custom",
        message: "Expected a string",
        input: ctx.value,
      });
    })
  );
  expect(Schema.safeParse(a, "hello")).toMatchObject({
    success: true,
    data: "hello",
  });
  expect(Schema.safeParse(a, 123)).toMatchObject({
    success: false,
    error: { issues: [{ code: "custom", message: "Expected a string" }] },
  });
});

test("Schema.with (alias for Schema.check)", () => {
  // .with() should work exactly the same as .check()
  const a = Schema.any().with(
    Schema.check<string>((ctx) => {
      if (typeof ctx.value === "string") return;
      ctx.issues.push({
        code: "custom",
        origin: "custom",
        message: "Expected a string",
        input: ctx.value,
      });
    })
  );
  expect(Schema.safeParse(a, "hello")).toMatchObject({
    success: true,
    data: "hello",
  });
  expect(Schema.safeParse(a, 123)).toMatchObject({
    success: false,
    error: { issues: [{ code: "custom", message: "Expected a string" }] },
  });

  // Test with refine
  const b = Schema.string().with(Schema.refine((val) => val.length > 3, "Must be longer than 3"));
  expect(Schema.safeParse(b, "hello").success).toBe(true);
  expect(Schema.safeParse(b, "hi").success).toBe(false);

  // Test with function
  const c = Schema.string().with(({ value, issues }) => {
    if (value.length <= 3) {
      issues.push({
        code: "custom",
        input: value,
        message: "Must be longer than 3",
      });
    }
  });
  expect(Schema.safeParse(c, "hello").success).toBe(true);
  expect(Schema.safeParse(c, "hi").success).toBe(false);
});

test("Schema.instanceof", () => {
  class A {}

  const a = Schema.instanceof(A);
  expect(Schema.parse(a, new A())).toBeInstanceOf(A);
  expect(() => Schema.parse(a, {})).toThrow();
});

test("Schema.refine", () => {
  const a = Schema.number().check(
    Schema.refine((val) => val > 3),
    Schema.refine((val) => val < 10)
  );
  expect(Schema.parse(a, 5)).toEqual(5);
  expect(() => Schema.parse(a, 2)).toThrow();
  expect(() => Schema.parse(a, 11)).toThrow();
  expect(() => Schema.parse(a, "hi")).toThrow();
});

// test("Schema.superRefine", () => {
//   const a = Schema.number([
//     Schema.superRefine((val, ctx) => {
//       if (val < 3) {
//         return ctx.addIssue({
//           code: "custom",
//           origin: "custom",
//           message: "Too small",
//           input: val,
//         });
//       }
//       if (val > 10) {
//         return ctx.addIssue("Too big");
//       }
//     }),
//   ]);

//   expect(Schema.parse(a, 5)).toEqual(5);
//   expect(() => Schema.parse(a, 2)).toThrow();
//   expect(() => Schema.parse(a, 11)).toThrow();
//   expect(() => Schema.parse(a, "hi")).toThrow();
// });

test("Schema.transform", () => {
  const a = Schema.transform((val: number) => {
    return `${val}`;
  });
  type a_in = Schema.input<typeof a>;
  expectTypeOf<a_in>().toEqualTypeOf<number>();
  type a_out = Schema.output<typeof a>;
  expectTypeOf<a_out>().toEqualTypeOf<string>();
  expect(Schema.parse(a, 123)).toEqual("123");
});

test("Schema.$brand()", () => {
  const a = Schema.string().brand<"my-brand">();
  type a = Schema.output<typeof a>;
  const branded = (_: a) => {};
  // @ts-expect-error
  branded("asdf");
});

test("Schema.lazy", () => {
  const a = Schema.lazy(() => Schema.string());
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<string>();
  expect(Schema.parse(a, "hello")).toEqual("hello");
  expect(() => Schema.parse(a, 123)).toThrow();
});

// schema that validates JSON-like data
test("Schema.json", () => {
  const a = Schema.json();
  type a = Schema.output<typeof a>;
  a._schema.output;

  expectTypeOf<a>().toEqualTypeOf<util.JSONType>();

  expect(Schema.parse(a, "hello")).toEqual("hello");
  expect(Schema.parse(a, 123)).toEqual(123);
  expect(Schema.parse(a, true)).toEqual(true);
  expect(Schema.parse(a, null)).toEqual(null);
  expect(Schema.parse(a, {})).toEqual({});
  expect(Schema.parse(a, { a: "hello" })).toEqual({ a: "hello" });
  expect(Schema.parse(a, [1, 2, 3])).toEqual([1, 2, 3]);
  expect(Schema.parse(a, [{ a: "hello" }])).toEqual([{ a: "hello" }]);

  // fail cases
  expect(() => Schema.parse(a, new Date())).toThrow();
  expect(() => Schema.parse(a, Symbol())).toThrow();
  expect(() => Schema.parse(a, { a: new Date() })).toThrow();
  expect(() => Schema.parse(a, undefined)).toThrow();
  expect(() => Schema.parse(a, { a: undefined })).toThrow();
});

test("Schema.stringbool", () => {
  const a = Schema.stringbool();

  expect(Schema.parse(a, "true")).toEqual(true);
  expect(Schema.parse(a, "yes")).toEqual(true);
  expect(Schema.parse(a, "1")).toEqual(true);
  expect(Schema.parse(a, "on")).toEqual(true);
  expect(Schema.parse(a, "y")).toEqual(true);
  expect(Schema.parse(a, "enabled")).toEqual(true);
  expect(Schema.parse(a, "TRUE")).toEqual(true);

  expect(Schema.parse(a, "false")).toEqual(false);
  expect(Schema.parse(a, "no")).toEqual(false);
  expect(Schema.parse(a, "0")).toEqual(false);
  expect(Schema.parse(a, "off")).toEqual(false);
  expect(Schema.parse(a, "n")).toEqual(false);
  expect(Schema.parse(a, "disabled")).toEqual(false);
  expect(Schema.parse(a, "FALSE")).toEqual(false);

  expect(Schema.safeParse(a, "other")).toMatchObject({ success: false });
  expect(Schema.safeParse(a, "")).toMatchObject({ success: false });
  expect(Schema.safeParse(a, undefined)).toMatchObject({ success: false });
  expect(Schema.safeParse(a, {})).toMatchObject({ success: false });
  expect(Schema.safeParse(a, true)).toMatchObject({ success: false });
  expect(Schema.safeParse(a, false)).toMatchObject({ success: false });

  const b = Schema.stringbool({
    truthy: ["y"],
    falsy: ["n"],
  });
  expect(Schema.parse(b, "y")).toEqual(true);
  expect(Schema.parse(b, "n")).toEqual(false);
  expect(Schema.safeParse(b, "true")).toMatchObject({ success: false });
  expect(Schema.safeParse(b, "false")).toMatchObject({ success: false });
  expect(b._schema.bag.truthy).toEqual(["y"]);
  expect(b._schema.bag.falsy).toEqual(["n"]);

  const c = Schema.stringbool({
    case: "sensitive",
  });
  expect(Schema.parse(c, "true")).toEqual(true);
  expect(Schema.safeParse(c, "TRUE")).toMatchObject({ success: false });
  expect(c._schema.bag.case).toEqual("sensitive");
});

// promise
test("Schema.promise", async () => {
  const a = Schema.promise(Schema.string());
  type a = Schema.output<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<Promise<string>>();

  expect(await Schema.safeParseAsync(a, Promise.resolve("hello"))).toMatchObject({
    success: true,
    data: "hello",
  });
  expect(await Schema.safeParseAsync(a, Promise.resolve(123))).toMatchObject({
    success: false,
  });

  const b = Schema.string();
  expect(() => Schema.parse(b, Promise.resolve("hello"))).toThrow();
});

// test("type assertions", () => {
//   const schema = Schema.pipe(
//     Schema.string(),
//     Schema.transform((val) => val.length)
//   );
//   Schema.assertInput<string>();
//   // @ts-expect-error
//   Schema.assertInput<number>();

//   Schema.assertOutput<number>();
//   // @ts-expect-error
//   Schema.assertOutput<string>();
// });

test("Schema.pipe type enforcement", () => {
  Schema.pipe(
    Schema.pipe(
      Schema.string().check(Schema.regex(/asdf/)),
      Schema.transform((v) => new Date(v))
    ),
    Schema.date().check(Schema.maximum(new Date()))
  );
});

test("def typing", () => {
  Schema.string().def.type satisfies "string";
  Schema.email().def.format satisfies "email";
  Schema.number().def.type satisfies "number";
  Schema.float64().def.format satisfies Schema.core.$SchemaNumberFormats;
  Schema.bigint().def.type satisfies "bigint";
  Schema.boolean().def.type satisfies "boolean";
  Schema.date().def.type satisfies "date";
  Schema.symbol().def.type satisfies "symbol";
  Schema.undefined().def.type satisfies "undefined";
  Schema.nullable(Schema.string()).def.type satisfies "nullable";
  Schema.null().def.type satisfies "null";
  Schema.any().def.type satisfies "any";
  Schema.unknown().def.type satisfies "unknown";
  Schema.never().def.type satisfies "never";
  Schema.void().def.type satisfies "void";
  Schema.array(Schema.string()).def.type satisfies "array";
  Schema.object({ key: Schema.string() }).def.type satisfies "object";
  Schema.union([Schema.string(), Schema.number()]).def.type satisfies "union";
  Schema.intersection(Schema.string(), Schema.number()).def.type satisfies "intersection";
  Schema.tuple([Schema.string(), Schema.number()]).def.type satisfies "tuple";
  Schema.record(Schema.string(), Schema.number()).def.type satisfies "record";
  Schema.map(Schema.string(), Schema.number()).def.type satisfies "map";
  Schema.set(Schema.string()).def.type satisfies "set";
  Schema.literal("example").def.type satisfies "literal";
  expectTypeOf(Schema.literal("example").def.values).toEqualTypeOf<"example"[]>();
  Schema.enum(["a", "b", "c"]).def.type satisfies "enum";
  Schema.promise(Schema.string()).def.type satisfies "promise";
  Schema.lazy(() => Schema.string()).def.type satisfies "lazy";
  Schema.optional(Schema.string()).def.type satisfies "optional";
  Schema._default(Schema.string(), "default").def.type satisfies "default";
  Schema.templateLiteral([Schema.literal("a"), Schema.literal("b")]).def.type satisfies "template_literal";
  Schema.custom<string>((val) => typeof val === "string").def.type satisfies "custom";
  Schema.transform((val) => val as string).def.type satisfies "transform";
  Schema.nonoptional(Schema.string()).def.type satisfies "nonoptional";
  Schema.readonly(Schema.unknown()).def.type satisfies "readonly";
  Schema.nan().def.type satisfies "nan";
  Schema.pipe(Schema.unknown(), Schema.number()).def.type satisfies "pipe";
  Schema.success(Schema.string()).def.type satisfies "success";
  Schema.catch(Schema.string(), "fallback").def.type satisfies "catch";
  Schema.file().def.type satisfies "file";
});

test("defaulted object schema returns shallow clone", () => {
  const schema = Schema._default(
    Schema.object({
      a: Schema.string(),
    }),
    { a: "x" }
  );
  const result1 = Schema.parse(undefined);
  const result2 = Schema.parse(undefined);
  expect(result1).not.toBe(result2);
  expect(result1).toEqual(result2);
});

test("runtime type property exists and returns correct values", () => {
  const stringSchema = Schema.string();
  expect(stringSchema.type).toBe("string");
});

test("type narrowing works with type property", () => {
  type ArrayOrRecord = Schema.SchemaMiniArray<Schema.SchemaMiniString> | Schema.SchemaMiniRecord<Schema.SchemaMiniString<string>, Schema.SchemaMiniAny>;
  const arraySchema = Schema.array(Schema.string()) as ArrayOrRecord;

  if (arraySchema.type === "array") {
    expectTypeOf(arraySchema).toEqualTypeOf<Schema.SchemaMiniArray<Schema.SchemaMiniString<unknown>>>();
    expect(arraySchema.def.element).toBeDefined();
  }
});

test("getDiscriminatedOption", () => {
  const a = Schema.object({ type: Schema.literal("a"), x: Schema.string() });
  const b = Schema.object({ type: Schema.literal("b"), y: Schema.number() });
  const schema = Schema.discriminatedUnion("type", [a, b]);

  expect(Schema.getDiscriminatedOption(schema, "a")).toBe(a);
  expect(Schema.getDiscriminatedOption(schema, "b")).toBe(b);
  expectTypeOf(Schema.getDiscriminatedOption(schema, "a")).toEqualTypeOf<typeof a>();
});

test("Schema.partial on a tuple", () => {
  const schema = Schema.partial(Schema.tuple([Schema.string(), Schema.number()]));
  expectTypeOf<Schema.infer<typeof schema>>().toEqualTypeOf<[(string | undefined)?, (number | undefined)?]>();

  expect(Schema.safeParse(schema, []).success).toEqual(true);
  expect(Schema.safeParse(schema, ["a"]).success).toEqual(true);
  expect(Schema.safeParse(schema, ["a", 1]).success).toEqual(true);
  expect(Schema.safeParse(schema, ["a", "b"]).success).toEqual(false);

  const refined = Schema.tuple([Schema.string(), Schema.number()]).check(Schema.refine(([a]) => a.length > 0));
  expect(() => Schema.partial(refined)).toThrow("cannot be used on tuple schemas containing refinements");
});
