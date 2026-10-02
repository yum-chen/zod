import { describe, expect, expectTypeOf, test } from "vitest";
import * as Schema   from "schema";
import { visit } from "../../core/visit.js";
import { deepPartial } from "../deep-partial.js";

describe("deepPartial", () => {
  test("makes shallow object optional", () => {
    const schema = Schema.object({ a: Schema.string(), b: Schema.number() });
    const partial = deepPartial(schema);
    expect(partial.parse({})).toEqual({});
    expect(partial.parse({ a: "x" })).toEqual({ a: "x" });
    expect(partial.parse({ a: "x", b: 1 })).toEqual({ a: "x", b: 1 });
  });

  test("makes nested object optional at every level", () => {
    const schema = Schema.object({
      name: Schema.string(),
      profile: Schema.object({
        bio: Schema.string(),
        age: Schema.number(),
      }),
    });
    const partial = deepPartial(schema);
    expect(partial.parse({})).toEqual({});
    expect(partial.parse({ profile: {} })).toEqual({ profile: {} });
    expect(partial.parse({ profile: { bio: "x" } })).toEqual({ profile: { bio: "x" } });
  });

  test("recurses through arrays", () => {
    const schema = Schema.object({ items: Schema.array(Schema.object({ a: Schema.string(), b: Schema.number() })) });
    const partial = deepPartial(schema);
    expect(partial.parse({ items: [{}, { a: "x" }] })).toEqual({ items: [{}, { a: "x" }] });
  });

  test("recurses through tuples and rest", () => {
    const schema = Schema.tuple([Schema.object({ a: Schema.string() }), Schema.object({ b: Schema.number() })], Schema.object({ c: Schema.boolean() }));
    const partial = deepPartial(schema);
    expect(partial.parse([{}, {}])).toEqual([{}, {}]);
    expect(partial.parse([{}, {}, {}])).toEqual([{}, {}, {}]);
  });

  test("recurses through unions", () => {
    const schema = Schema.union([Schema.object({ a: Schema.string() }), Schema.object({ b: Schema.number() })]);
    const partial = deepPartial(schema);
    expect(partial.parse({})).toEqual({});
  });

  test("recurses through optional/nullable wrappers", () => {
    const schema = Schema.object({ x: Schema.object({ a: Schema.string() }).optional() });
    const partial = deepPartial(schema);
    expect(partial.parse({})).toEqual({});
    expect(partial.parse({ x: {} })).toEqual({ x: {} });
  });

  test("terminates on recursive (lazy) schemas", () => {
    const Node: Schema.SchemaType = Schema.object({
      name: Schema.string(),
      children: Schema.array(Schema.lazy(() => Node)).optional(),
    });
    const partial = deepPartial(Node);
    expect(partial.parse({})).toEqual({});
    expect(partial.parse({ name: "root", children: [{ name: "child" }] })).toEqual({
      name: "root",
      children: [{ name: "child" }],
    });
    expect(partial.parse({ children: [{}] })).toEqual({ children: [{}] });
  });

  test("preserves primitives at leaves", () => {
    const schema = Schema.object({ a: Schema.string().min(1), b: Schema.number().int() });
    const partial = deepPartial(schema);
    expect(() => partial.parse({ a: "" })).toThrow();
    expect(() => partial.parse({ b: 1.5 })).toThrow();
    expect(partial.parse({ a: "ok", b: 1 })).toEqual({ a: "ok", b: 1 });
  });

  test("keyof preserved on output type", () => {
    const schema = Schema.object({
      name: Schema.string(),
      profile: Schema.object({ bio: Schema.string() }),
    });
    type Out = Schema.output<typeof schema> extends infer X ? X : never;
    const partial = deepPartial(schema);
    type PartialOut = Schema.output<typeof partial>;
    expectTypeOf<keyof PartialOut>().toEqualTypeOf<keyof Out>();
  });

  test("preserves SchemaObject structural type; `.shape` is accessible", () => {
    const schema = Schema.object({
      name: Schema.string(),
      nested: Schema.object({ age: Schema.number() }),
    });
    const partial = deepPartial(schema);
    expectTypeOf(partial).toExtend<Schema.SchemaObject>();
    // Each shape entry is a SchemaOptional wrapping the deep-partialed inner.
    expectTypeOf(partial.shape.name).toExtend<Schema.SchemaOptional<Schema.SchemaString>>();
    expectTypeOf(partial.shape.nested).toExtend<Schema.SchemaOptional<Schema.SchemaObject>>();
    // Nested shape access is still typed.
    const innerShape = partial.shape.nested._schema.def.innerType.shape;
    expectTypeOf(innerShape.age).toExtend<Schema.SchemaOptional<Schema.SchemaNumber>>();
  });

  test("recursive self-reference (via getter) is typeable (no TS depth explosion)", () => {
    const Category = Schema.object({
      name: Schema.string(),
      get subcategories() {
        return Schema.array(Category).optional();
      },
    });
    const partial = deepPartial(Category);
    expectTypeOf(partial).toExtend<Schema.SchemaObject>();
    // Should not blow up TS recursion depth. We don't assert on the inner recursive reference — depth-limited DeepPartial shells out after one unfold.
    expect(partial.parse({ subcategories: [{}] })).toEqual({ subcategories: [{}] });
  });

  test("preserves SchemaArray / SchemaTuple / SchemaUnion wrappers", () => {
    const arr = deepPartial(Schema.array(Schema.object({ a: Schema.string() })));
    expectTypeOf(arr).toExtend<Schema.SchemaArray>();

    const tup = deepPartial(Schema.tuple([Schema.object({ a: Schema.string() }), Schema.object({ b: Schema.number() })]));
    expectTypeOf(tup).toExtend<Schema.SchemaTuple>();

    const uni = deepPartial(Schema.union([Schema.object({ a: Schema.string() }), Schema.object({ b: Schema.number() })]));
    expectTypeOf(uni).toExtend<Schema.SchemaUnion>();
  });

  test("3-level deep nesting", () => {
    const schema = Schema.object({
      a: Schema.object({
        b: Schema.object({
          c: Schema.object({ d: Schema.string() }),
        }),
      }),
    });
    const partial = deepPartial(schema);
    expect(partial.parse({})).toEqual({});
    expect(partial.parse({ a: {} })).toEqual({ a: {} });
    expect(partial.parse({ a: { b: { c: {} } } })).toEqual({ a: { b: { c: {} } } });
  });

  test("discriminated union: degrades to plain union (discriminator becomes optional)", () => {
    const schema = Schema.discriminatedUnion("kind", [
      Schema.object({ kind: Schema.literal("a"), a: Schema.string() }),
      Schema.object({ kind: Schema.literal("b"), b: Schema.number() }),
    ]);
    const partial = deepPartial(schema);
    expect(partial.parse({ kind: "a", a: "x" })).toEqual({ kind: "a", a: "x" });
    expect(partial.parse({ kind: "b", b: 1 })).toEqual({ kind: "b", b: 1 });
    expect(partial.parse({})).toEqual({});
  });

  test("intersection", () => {
    const schema = Schema.intersection(Schema.object({ a: Schema.string() }), Schema.object({ b: Schema.number() }));
    const partial = deepPartial(schema);
    expect(partial.parse({})).toEqual({});
    expect(partial.parse({ a: "x" })).toEqual({ a: "x" });
    expect(partial.parse({ b: 1 })).toEqual({ b: 1 });
  });

  test("record / map / set value schemas are recursed", () => {
    const rec = deepPartial(Schema.record(Schema.string(), Schema.object({ a: Schema.string() })));
    expect(rec.parse({ k: {} })).toEqual({ k: {} });

    const m = deepPartial(Schema.map(Schema.string(), Schema.object({ a: Schema.string() })));
    expect(m.parse(new Map([["k", {}]]))).toEqual(new Map([["k", {}]]));

    const s = deepPartial(Schema.set(Schema.object({ a: Schema.string() })));
    expect(s.parse(new Set([{}]))).toEqual(new Set([{}]));
  });

  test("wrapper composition (optional + default + readonly)", () => {
    const schema = Schema.object({
      x: Schema.object({ a: Schema.string() }).default({ a: "hi" }).readonly(),
    });
    const partial = deepPartial(schema);
    expect(partial.parse({})).toEqual({ x: { a: "hi" } });
    expect(partial.parse({ x: {} })).toEqual({ x: {} });
  });

  test("transform standalone is left untouched", () => {
    const schema = Schema.object({ a: Schema.string().transform((s) => s.length) });
    const partial = deepPartial(schema);
    expect(partial.parse({ a: "hi" })).toEqual({ a: 2 });
    expect(partial.parse({})).toEqual({});
  });

  test("pipe input and output are both recursed", () => {
    const schema = Schema.object({ a: Schema.string() }).pipe(Schema.object({ a: Schema.string() }));
    const partial = deepPartial(schema);
    expect(partial.parse({})).toEqual({});
  });

  test("tuple elements stay required — only *objects inside* become partial", () => {
    const schema = Schema.tuple([Schema.object({ a: Schema.string() }), Schema.string()]);
    const partial = deepPartial(schema);
    // Positional items remain required: the second item (Schema.string) must be present.
    expect(() => partial.parse([{}])).toThrow();
    expect(partial.parse([{}, "x"])).toEqual([{}, "x"]);
    // The object INSIDE the tuple has its fields made optional.
    expect(partial.parse([{ a: "y" }, "x"])).toEqual([{ a: "y" }, "x"]);
  });

  test("intersection: both sides are deep-partialed independently", () => {
    const schema = Schema.intersection(
      Schema.object({ a: Schema.object({ inner: Schema.string() }) }),
      Schema.object({ b: Schema.object({ inner: Schema.number() }) })
    );
    const partial = deepPartial(schema);
    expectTypeOf(partial).toExtend<Schema.SchemaIntersection>();
    // Inner objects on either side accept their field as optional.
    expect(partial.parse({ a: {}, b: {} })).toEqual({ a: {}, b: {} });
    // Top-level props also optional (deepPartial partials both object sides).
    expect(partial.parse({})).toEqual({});
  });

  test("SchemaPromise: inner is recursed", () => {
    const schema = Schema.promise(Schema.object({ a: Schema.string() }));
    const partial = deepPartial(schema);
    expectTypeOf(partial).toExtend<Schema.SchemaPromise>();
  });

  test("SchemaSuccess: inner is recursed", () => {
    const schema = Schema.success(Schema.object({ a: Schema.string() }));
    const partial = deepPartial(schema);
    expectTypeOf(partial).toExtend<Schema.SchemaSuccess>();
  });

  test("SchemaCodec: both sides recursed; preserved as SchemaCodec (not degraded to SchemaPipe)", () => {
    const schema = Schema.codec(Schema.object({ a: Schema.string() }), Schema.object({ a: Schema.string() }), {
      decode: (v) => v,
      encode: (v) => v,
    });
    const partial = deepPartial(schema);
    expectTypeOf(partial).toExtend<Schema.SchemaCodec>();
    expect(partial.parse({})).toEqual({});
  });

  test("SchemaPreprocess: inner is recursed; preserved as SchemaPreprocess (not degraded to SchemaPipe)", () => {
    const schema = Schema.preprocess((v) => v, Schema.object({ a: Schema.string() }));
    const partial = deepPartial(schema);
    expectTypeOf(partial).toExtend<Schema.SchemaPreprocess>();
    expect(partial.parse({})).toEqual({});
  });

  test("catchall value schema is recursed; strict/loose catchalls are preserved", () => {
    const partial = deepPartial(Schema.object({ a: Schema.string() }).catchall(Schema.object({ n: Schema.number() })));
    expect(partial.parse({ extra: {} })).toEqual({ extra: {} });
    expect(() => partial.parse({ extra: { n: "no" } })).toThrow();
    // Schema.strictObject / Schema.looseObject encode their behavior as a catchall too.
    expect(() => deepPartial(Schema.strictObject({ a: Schema.object({ b: Schema.string() }) })).parse({ zzz: 1 })).toThrow();
    expect(deepPartial(Schema.looseObject({ a: Schema.object({ b: Schema.string() }) })).parse({ a: {}, zzz: 1 })).toEqual({
      a: {},
      zzz: 1,
    });
  });

  test("discriminated union nested inside an array degrades and still matches", () => {
    const schema = Schema.object({
      shapes: Schema.array(
        Schema.discriminatedUnion("kind", [
          Schema.object({ kind: Schema.literal("circle"), meta: Schema.object({ id: Schema.string() }) }),
          Schema.object({ kind: Schema.literal("square"), side: Schema.number() }),
        ])
      ),
    });
    const partial = deepPartial(schema);
    const element = (partial.shape.shapes._schema.def.innerType as Schema  .SchemaArray)._schema.def.element;
    expect(element._schema.def.type).toEqual("union");
    expect((element._schema.def as { discriminator?: string }).discriminator).toBeUndefined();
    expect(partial.parse({ shapes: [{ kind: "circle", meta: {} }, {}] })).toEqual({
      shapes: [{ kind: "circle", meta: {} }, {}],
    });
  });

  test("does not mutate the source schema", () => {
    const inner = Schema.object({ b: Schema.string() });
    const schema = Schema.object({ a: inner });
    deepPartial(schema);
    expect(Schema.shape.a).toBe(inner);
    expect(Schema.safeParse({}).success).toEqual(false);
    expect(inner.safeParse({}).success).toEqual(false);
  });
});

describe("visit (internal)", () => {
  test("identity callback returns the input schema unchanged", () => {
    const schema = Schema.object({ a: Schema.string(), nested: Schema.object({ b: Schema.number() }) });
    expect(visit(schema, (s) => s)).toBe(schema);
  });

  test("empty handler map returns the input schema unchanged", () => {
    const schema = Schema.object({ a: Schema.string(), nested: Schema.object({ b: Schema.number() }) });
    expect(visit(schema, {})).toBe(schema);
  });

  test("only nodes touched by a handler are re-cloned; siblings keep identity", () => {
    const a = Schema.string();
    const b = Schema.number();
    const schema = Schema.object({ a, b });
    const result = visit(schema, { number: () => Schema.string() }) as Schema  .SchemaType;
    // `a` was not rewritten; its reference flows through.
    expect((result._schema.def as any).shape.a).toBe(a);
    // `b` was rewritten; parent is a new clone.
    expect(result).not.toBe(schema);
  });

  test("callback: can target a specific def.type", () => {
    const schema = Schema.object({ a: Schema.string(), b: Schema.number() });
    const allStrings = visit(schema, (s) => (s._schema.def.type === "number" ? Schema.string() : s)) as Schema  .SchemaType;
    expect(allStrings.parse({ a: "x", b: "y" } as any)).toEqual({ a: "x", b: "y" });
  });

  test("handler map: dispatches by kind; unhandled kinds pass through", () => {
    const schema = Schema.object({ a: Schema.string(), b: Schema.number() });
    const result = visit(schema, { number: () => Schema.string() }) as Schema  .SchemaType;
    expect(result.parse({ a: "x", b: "y" } as any)).toEqual({ a: "x", b: "y" });
  });

  test("visits shared sub-schemas only once", () => {
    const inner = Schema.object({ a: Schema.string() });
    const schema = Schema.object({ x: inner, y: inner });
    let calls = 0;
    visit(schema, (s) => {
      calls++;
      return s;
    });
    // 3 unique nodes: schema, inner (shared), inner.shape.a (Schema.string()).
    expect(calls).toBe(3);
  });

  test("root is cached: lazy self-reference does not re-invoke fn at parse-time", () => {
    let calls = 0;
    const Self: Schema.SchemaType = Schema.object({ self: Schema.lazy(() => Self).optional() });
    const result = visit(Self, (s) => {
      calls++;
      return s;
    }) as Schema  .SchemaType;
    const baseline = calls;
    result.parse({ self: { self: { self: {} } } });
    expect(calls).toBe(baseline);
  });

  test("unknown def.type falls through unchanged (handler map form)", () => {
    const customSchema: any = Schema.string();
    customSchema._schema.def = { ...customSchema._schema.def, type: "myCustomType" };
    const result = visit(customSchema, { object: (o) => o });
    expect(result).toBe(customSchema);
  });

  test("non-lazy (getter) cycle resolves through the cache instead of throwing", () => {
    const Node = Schema.object({
      name: Schema.string(),
      get children() {
        return Schema.array(Node);
      },
    });
    // The rewrite has to reach the recursive reference, not just the top level.
    const upper = visit(Node, { string: () => Schema.string().toUpperCase() }) as Schema  .SchemaType;
    expect(upper.parse({ name: "a", children: [{ name: "b", children: [] }] })).toEqual({
      name: "A",
      children: [{ name: "B", children: [] }],
    });
  });

  test("catchall is traversed like tuple rest", () => {
    const schema = Schema.object({}).catchall(Schema.object({ n: Schema.string() }));
    const result = visit(schema, { string: () => Schema.string().toUpperCase() }) as Schema  .SchemaType;
    expect(result.parse({ k: { n: "a" } })).toEqual({ k: { n: "A" } });
  });

  test("an already-resolved lazy is still rewritten", () => {
    const make = () => Schema.object({ x: Schema.lazy(() => Schema.object({ y: Schema.string() })) });
    const cold = make();
    const warm = make();
    warm.safeParse({ x: { y: "a" } }); // memoizes $SchemaLazy's inner type onto the def
    // The memo must not ride along into the clone, or the new getter is never read.
    expect(deepPartial(warm).safeParse({ x: {} }).success).toEqual(true);
    expect(deepPartial(cold).safeParse({ x: {} }).success).toEqual(true);
  });
});
