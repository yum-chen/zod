import { expect, expectTypeOf, test } from "vitest";
import type { util } from "schema/v4/core";

import * as Schema from "schema/v4";

test("object intersection", () => {
  const A = Schema.object({ a: Schema.string() });
  const B = Schema.object({ b: Schema.string() });

  const C = Schema.intersection(A, B); // BaseC.merge(HasID);
  type C = Schema.infer<typeof C>;
  expectTypeOf<C>().toEqualTypeOf<{ a: string } & { b: string }>();
  const data = { a: "foo", b: "foo" };
  expect(C.parse(data)).toEqual(data);
  expect(() => C.parse({ a: "foo" })).toThrow();
});

test("object intersection: loose", () => {
  const A = Schema.looseObject({ a: Schema.string() });
  const B = Schema.object({ b: Schema.string() });

  const C = Schema.intersection(A, B); // BaseC.merge(HasID);
  type C = Schema.infer<typeof C>;
  expectTypeOf<C>().toEqualTypeOf<{ a: string; [x: string]: unknown } & { b: string }>();
  const data = { a: "foo", b: "foo", c: "extra" };
  expect(C.parse(data)).toEqual(data);
  expect(() => C.parse({ a: "foo" })).toThrow();
});

test("object intersection: strict + strip", () => {
  const A = Schema.strictObject({ a: Schema.string() });
  const B = Schema.object({ b: Schema.string() });

  const C = Schema.intersection(A, B);
  type C = Schema.infer<typeof C>;
  expectTypeOf<C>().toEqualTypeOf<{ a: string } & { b: string }>();

  // Keys recognized by either side should work
  expect(C.parse({ a: "foo", b: "bar" })).toEqual({ a: "foo", b: "bar" });

  // Extra keys are stripped (follows strip behavior from B)
  expect(C.parse({ a: "foo", b: "bar", c: "extra" })).toEqual({ a: "foo", b: "bar" });
});

test("object intersection: strict + strict", () => {
  const A = Schema.strictObject({ a: Schema.string() });
  const B = Schema.strictObject({ b: Schema.string() });

  const C = Schema.intersection(A, B);

  // Keys recognized by either side should work
  expect(C.parse({ a: "foo", b: "bar" })).toEqual({ a: "foo", b: "bar" });

  // Keys unrecognized by BOTH sides should error
  const result = C.safeParse({ a: "foo", b: "bar", c: "extra" });
  expect(result.error?.issues).toMatchInlineSnapshot(`
    [
      {
        "code": "unrecognized_keys",
        "keys": [
          "c",
        ],
        "message": "Unrecognized key: "c"",
        "path": [],
      },
    ]
  `);
});

test("object intersection strips __proto__ from pass-through operands", () => {
  const cases = [
    [
      Schema.intersection(Schema.object({ name: Schema.string() }), Schema.unknown()),
      JSON.parse('{"__proto__":{"isAdmin":true},"name":"alice"}'),
      { name: "alice" },
    ],
    [Schema.intersection(Schema.record(Schema.string(), Schema.unknown()), Schema.any()), JSON.parse('{"__proto__":{},"a":1}'), { a: 1 }],
  ] as const;

  for (const [schema, input, expected] of cases) {
    const parsed = Schema.parse(input);
    expect(parsed).toEqual(expected);
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(parsed, "__proto__")).toBe(false);
  }
});

test("deep intersection", () => {
  const Animal = Schema.object({
    properties: Schema.object({
      is_animal: Schema.boolean(),
    }),
  });
  const Cat = Schema.intersection(
    Schema.object({
      properties: Schema.object({
        jumped: Schema.boolean(),
      }),
    }),
    Animal
  );

  type Cat = util.Flatten<Schema.infer<typeof Cat>>;
  expectTypeOf<Cat>().toEqualTypeOf<{ properties: { is_animal: boolean } & { jumped: boolean } }>();
  const a = Cat.safeParse({ properties: { is_animal: true, jumped: true } });
  expect(a.data!.properties).toEqual({ is_animal: true, jumped: true });
});

test("deep intersection of arrays", async () => {
  const Author = Schema.object({
    posts: Schema.array(
      Schema.object({
        post_id: Schema.number(),
      })
    ),
  });
  const Registry = Schema.intersection(
    Author,
    Schema.object({
      posts: Schema.array(
        Schema.object({
          title: Schema.string(),
        })
      ),
    })
  );

  const posts = [
    { post_id: 1, title: "Novels" },
    { post_id: 2, title: "Fairy tales" },
  ];
  const cat = Registry.parse({ posts });
  expect(cat.posts).toEqual(posts);
  const asyncCat = await Registry.parseAsync({ posts });
  expect(asyncCat.posts).toEqual(posts);
});

test("invalid intersection types", async () => {
  const numberIntersection = Schema.intersection(
    Schema.number(),
    Schema.number().transform((x) => x + 1)
  );

  expect(() => {
    numberIntersection.parse(1234);
  }).toThrowErrorMatchingInlineSnapshot(`[Error: Unmergable intersection. Error path: []]`);
});

test("invalid array merge (incompatible lengths)", async () => {
  const stringArrInt = Schema.intersection(
    Schema.string().array(),
    z
      .string()
      .array()
      .transform((val) => [...val, "asdf"])
  );

  expect(() => stringArrInt.safeParse(["asdf", "qwer"])).toThrowErrorMatchingInlineSnapshot(
    `[Error: Unmergable intersection. Error path: []]`
  );
});

test("invalid array merge (incompatible elements)", async () => {
  const stringArrInt = Schema.intersection(
    Schema.string().array(),
    z
      .string()
      .array()
      .transform((val) => [...val.slice(0, -1), "asdf"])
  );

  expect(() => stringArrInt.safeParse(["asdf", "qwer"])).toThrowErrorMatchingInlineSnapshot(
    `[Error: Unmergable intersection. Error path: [1]]`
  );
});

test("invalid object merge", async () => {
  const Cat = Schema.object({
    phrase: Schema.string().transform((val) => `${val} Meow`),
  });
  const Dog = Schema.object({
    phrase: Schema.string().transform((val) => `${val} Woof`),
  });
  const CatDog = Schema.intersection(Cat, Dog);

  expect(() => CatDog.parse({ phrase: "Hello, my name is CatDog." })).toThrowErrorMatchingInlineSnapshot(
    `[Error: Unmergable intersection. Error path: ["phrase"]]`
  );
});

test("invalid deep merge of object and array combination", async () => {
  const University = Schema.object({
    students: Schema.array(
      Schema.object({
        name: Schema.string().transform((val) => `Student name: ${val}`),
      })
    ),
  });
  const Registry = Schema.intersection(
    University,
    Schema.object({
      students: Schema.array(
        Schema.object({
          name: Schema.string(),
          surname: Schema.string(),
        })
      ),
    })
  );

  const students = [{ name: "John", surname: "Doe" }];

  expect(() => Registry.parse({ students })).toThrowErrorMatchingInlineSnapshot(
    `[Error: Unmergable intersection. Error path: ["students",0,"name"]]`
  );
});

// A record's key schema says which keys that record GOVERNS; it is not a predicate
// every key in the result must satisfy. TypeScript works the same way: in
// `{name: string} & Record<`S_${string}`, string>` the index signature constrains
// only the keys matching it, so `name` is fine. So a key one side does not govern
// is reconciled against the other side, exactly as unrecognized_keys already is.
test("a record's key schema governs only its own keys inside an intersection", () => {
  const Obj = Schema.object({ name: Schema.string() });
  const value = { name: "a", S_a: "s" };

  // Every key-schema flavor behaves the same: `name` belongs to the object side.
  expect(Schema.intersection(Obj, Schema.record(Schema.string().regex(/^S_/), Schema.string())).parse(value)).toEqual(value);
  expect(Schema.intersection(Obj, Schema.record(Schema.templateLiteral(["S_", Schema.string()]), Schema.string())).parse(value)).toEqual(value);
  expect(Schema.intersection(Obj, Schema.partialRecord(Schema.enum(["p1", "p2"]), Schema.string())).parse({ name: "a", p1: "x" })).toEqual({
    name: "a",
    p1: "x",
  });
  expect(Schema.intersection(Obj, Schema.record(Schema.enum(["p1"]), Schema.string())).parse({ name: "a", p1: "x" })).toEqual({
    name: "a",
    p1: "x",
  });

  // A key the record DOES govern still has its value validated across the intersection.
  const governed = Schema.intersection(Schema.object({ S_x: Schema.number() }), Schema.record(Schema.string().regex(/^S_/), Schema.string()));
  expect(governed.safeParse({ S_x: 1 }).success).toBe(false);

  // A key NEITHER side governs is still rejected.
  const strict = Schema.intersection(Schema.strictObject({ name: Schema.string() }), Schema.record(Schema.string().regex(/^S_/), Schema.string()));
  expect(strict.parse(value)).toEqual(value);
  expect(strict.safeParse({ ...value, evil: "q" }).success).toBe(false);

  // Standalone, a record still rejects a key it does not govern.
  expect(Schema.record(Schema.string().regex(/^S_/), Schema.string()).safeParse({ S_a: "s", bad: "x" }).success).toBe(false);
});

test("partialRecord reports an out-of-set key as unrecognized, not invalid", () => {
  const enumKeys = Schema.partialRecord(Schema.enum(["a", "b"]), Schema.string()).safeParse({ a: "x", zzz: "q" });
  expect(enumKeys.success).toBe(false);
  expect(enumKeys.error!.issues[0].code).toBe("unrecognized_keys");

  // A regex key schema still reports the failure as an invalid key.
  const regexKeys = Schema.record(Schema.string().regex(/^S_/), Schema.string()).safeParse({ S_a: "x", zzz: "q" });
  expect(regexKeys.success).toBe(false);
  expect(regexKeys.error!.issues[0].code).toBe("invalid_key");
});

test("intersection operands run their own checks, refinements and transforms", () => {
  let checks = 0;
  const failing = Schema.intersection(
    Schema.strictObject({ x: Schema.string() }).check(() => {
      checks++;
    }),
    Schema.strictObject({ a: Schema.string() }).superRefine((_data, ctx) => {
      checks++;
      ctx.addIssue({ code: "custom", message: "boom" });
    })
  );
  expect(failing.safeParse({ x: "test", a: "hello" })).toMatchObject({
    success: false,
    error: { issues: [{ code: "custom", message: "boom" }] },
  });
  expect(checks).toBe(2);

  const transformed = Schema.intersection(
    Schema.strictObject({ x: Schema.string() }).transform((v) => ({ ...v, x: v.x.toUpperCase() })),
    Schema.strictObject({ a: Schema.string() }).transform((v) => ({ ...v, seen: true }))
  );
  expect(transformed.parse({ x: "test", a: "hello" })).toEqual({ x: "TEST", a: "hello", seen: true });
});

test("intersection operands apply defaults, including through a nested intersection", () => {
  const inner = Schema.intersection(
    Schema.strictObject({ x: Schema.string().default("X default"), y: Schema.number() }),
    Schema.strictObject({ Schema: Schema.boolean() })
  );
  const schema = Schema.intersection(inner, Schema.strictObject({ a: Schema.string() }));
  expectTypeOf<Schema.output<typeof schema>>().toEqualTypeOf<{ x: string; y: number } & { Schema: boolean } & { a: string }>();

  expect(Schema.parse({ y: 34, z: true, a: "hello" })).toEqual({ x: "X default", y: 34, z: true, a: "hello" });
});

test("a record operand runs its own refinements inside an intersection", () => {
  let calls = 0;
  const schema = z
    .record(Schema.enum(["p1", "p2"]), Schema.string())
    .superRefine((_data, ctx) => {
      calls++;
      ctx.addIssue({ code: "custom", message: "record refined" });
    })
    .and(Schema.strictObject({ name: Schema.string() }));

  expect(Schema.safeParse({ p1: "a", p2: "b", name: "n" })).toMatchObject({
    success: false,
    error: { issues: [{ code: "custom", message: "record refined" }] },
  });
  expect(calls).toBe(1);
});

test("a strict object nested under an operand keeps its strictness", () => {
  const schema = Schema.intersection(
    Schema.object({ inner: Schema.strictObject({ a: Schema.string() }) }),
    Schema.object({ other: Schema.string() })
  );

  expect(Schema.parse({ inner: { a: "x" }, other: "y" })).toEqual({ inner: { a: "x" }, other: "y" });
  expect(Schema.safeParse({ inner: { a: "x", extra: 1 }, other: "y" })).toMatchObject({
    success: false,
    error: { issues: [{ code: "unrecognized_keys", keys: ["extra"], path: ["inner"] }] },
  });
});

test("a strict object composes with a refined object", () => {
  const A = Schema.object({ key1: Schema.boolean() }).strict();
  const B = Schema.object({ key2: Schema.boolean() }).refine(({ key2 }) => key2, "key2 must be true");

  expect(A.and(B).parse({ key1: true, key2: true })).toEqual({ key1: true, key2: true });
  expect(A.and(B).safeParse({ key1: true, key2: false }).success).toBe(false);
});
