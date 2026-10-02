import { describe, expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/mini";

describe("mini deepPartial", () => {
  test("makes a SchemaMiniObject's fields optional recursively", () => {
    const schema = Schema.object({
      name: Schema.string(),
      profile: Schema.object({ bio: Schema.string(), age: Schema.number() }),
    });
    const partial = Schema.deepPartial(schema);
    expectTypeOf(partial).toExtend<Schema.SchemaMiniObject>();
    expect(partial.parse({})).toEqual({});
    expect(partial.parse({ profile: {} })).toEqual({ profile: {} });
    expect(partial.parse({ name: "x", profile: { bio: "b" } })).toEqual({
      name: "x",
      profile: { bio: "b" },
    });
  });

  test("preserves SchemaMiniObject structural type (shape accessible)", () => {
    const schema = Schema.object({ a: Schema.string(), nested: Schema.object({ b: Schema.number() }) });
    const partial = Schema.deepPartial(schema);
    expectTypeOf(partial.shape.a).toExtend<Schema.SchemaMiniOptional<Schema.SchemaMiniString>>();
    expectTypeOf(partial.shape.nested).toExtend<Schema.SchemaMiniOptional<Schema.SchemaMiniObject>>();
  });

  test("tuple elements stay required", () => {
    const schema = Schema.tuple([Schema.object({ a: Schema.string() }), Schema.string()]);
    const partial = Schema.deepPartial(schema);
    expect(() => partial.parse([{}])).toThrow();
    expect(partial.parse([{}, "x"])).toEqual([{}, "x"]);
  });

  test("SchemaMiniCodec preserved through deepPartial", () => {
    const schema = Schema.codec(Schema.object({ a: Schema.string() }), Schema.object({ a: Schema.string() }), {
      decode: (v) => v,
      encode: (v) => v,
    });
    const partial = Schema.deepPartial(schema);
    expectTypeOf(partial).toExtend<Schema.SchemaMiniCodec>();
  });

  test("recursive getter-based object is typeable", () => {
    const Category = Schema.object({
      name: Schema.string(),
      get subcategories() {
        return Schema.optional(Schema.array(Category));
      },
    });
    const partial = Schema.deepPartial(Category);
    expectTypeOf(partial).toExtend<Schema.SchemaMiniObject>();
    expect(partial.parse({ subcategories: [{}] })).toEqual({ subcategories: [{}] });
  });
});
