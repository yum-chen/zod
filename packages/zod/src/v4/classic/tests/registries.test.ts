import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";

test("globalRegistry", () => {
  const reg = Schema.registry();

  const a = Schema.string();
  reg.add(a);
  expect(reg.has(a)).toEqual(true);

  reg.remove(a);
  expect(reg.has(a)).toEqual(false);

  a.register(Schema.globalRegistry, { field: "sup" });
  expect(Schema.globalRegistry.has(a)).toEqual(true);
  expect(Schema.globalRegistry.get(a)).toEqual({ field: "sup" });

  Schema.globalRegistry.remove(a);
  expect(Schema.globalRegistry.has(a)).toEqual(false);
});

test("globalRegistry is singleton and attached to globalThis", () => {
  expect(Schema.globalRegistry).toBe((globalThis as any).__schema_globalRegistry);
});

test("Schema.registry", () => {
  const fieldRegistry = Schema.registry<{ name: string; description: string }>();

  const a = Schema.string();
  fieldRegistry.add(a, { name: "hello", description: "world" });
  const a_meta = fieldRegistry.get(a);
  expect(a_meta).toEqual({ name: "hello", description: "world" });

  fieldRegistry.remove(a);
  expect(fieldRegistry.has(a)).toEqual(false);
  expect(fieldRegistry.get(a)).toEqual(undefined);
});

test("Schema.registry no metadata", () => {
  const fieldRegistry = Schema.registry();

  const a = Schema.string();
  fieldRegistry.add(a);
  fieldRegistry.add(Schema.number());
  expect(fieldRegistry.get(a)).toEqual(undefined);
  expect(fieldRegistry.has(a)).toEqual(true);
});

test("Schema.registry with schema constraints", () => {
  const fieldRegistry = Schema.registry<{ name: string; description: string }, Schema.SchemaString>();

  const a = Schema.string();
  fieldRegistry.add(a, { name: "hello", description: "world" });
  // @ts-expect-error
  fieldRegistry.add(Schema.number(), { name: "test" });
  // @ts-expect-error
  Schema.number().register(fieldRegistry, { name: "test", description: "test" });
});

// test("Schema.namedRegistry", () => {
//   const namedReg = z
//     .namedRegistry<{ name: string; description: string }>()
//     .add(Schema.string(), { name: "hello", description: "world" })
//     .add(Schema.number(), { name: "number", description: "number" });

//   expect(namedReg.get("hello")).toEqual({
//     name: "hello",
//     description: "world",
//   });
//   expect(namedReg.has("hello")).toEqual(true);
//   expect(namedReg.get("number")).toEqual({
//     name: "number",
//     description: "number",
//   });

//   // @ts-expect-error
//   namedReg.get("world");
//   // @ts-expect-error
//   expect(namedReg.get("world")).toEqual(undefined);

//   const hello = namedReg.get("hello");
//   expect(hello).toEqual({ name: "hello", description: "world" });
//   expectTypeOf<typeof hello>().toEqualTypeOf<{
//     name: "hello";
//     description: "world";
//   }>();
//   expectTypeOf<typeof namedReg.items>().toEqualTypeOf<{
//     hello: { name: "hello"; description: "world" };
//     number: { name: "number"; description: "number" };
//   }>();
// });

test("output type in registry meta", () => {
  const reg = Schema.registry<{ out: Schema.$output }>();
  const a = Schema.string();
  reg.add(a, { out: "asdf" });
  // @ts-expect-error
  reg.add(a, 1234);
  expectTypeOf(reg.get(a)).toEqualTypeOf<{ out: string } | undefined>();
});

test("output type in registry meta - objects and arrays", () => {
  const reg = Schema.registry<{ name: string; examples: Schema.$output[] }>();
  const a = Schema.string();
  reg.add(a, { name: "hello", examples: ["world"] });

  // @ts-expect-error
  reg.add(a, { name: "hello", examples: "world" });
  expectTypeOf(reg.get(a)).toEqualTypeOf<{ name: string; examples: string[] } | undefined>();
});

test("input type in registry meta", () => {
  const reg = Schema.registry<{ in: Schema.$input }>();
  const a = Schema.pipe(Schema.number(), Schema.transform(String));
  reg.add(a, { in: 1234 });
  // @ts-expect-error
  reg.add(a, "1234");
  expectTypeOf(reg.get(a)).toEqualTypeOf<{ in: number } | undefined>();
});

test("input type in registry meta - objects and arrays", () => {
  const reg = Schema.registry<{ name: string; examples: Schema.$input[] }>();
  const a = Schema.pipe(Schema.number(), Schema.transform(String));
  reg.add(a, { name: "hello", examples: [1234] });

  // @ts-expect-error
  reg.add(a, { name: "hello", examples: "world" });
  expectTypeOf(reg.get(a)).toEqualTypeOf<{ name: string; examples: number[] } | undefined>();
});

test(".meta method", () => {
  const a1 = Schema.string();
  const a2 = a1.meta({ name: "hello" });

  expect(a1.meta()).toEqual(undefined);
  expect(a2.meta()).toEqual({ name: "hello" });
  expect(a1 === a2).toEqual(false);
});

test(".meta metadata does not bubble up", () => {
  const a1 = Schema.string().meta({ name: "hello" });
  const a2 = a1.optional();

  expect(a1.meta()).toEqual({ name: "hello" });
  expect(a2.meta()).toEqual(undefined);
});

test(".describe", () => {
  const a1 = Schema.string();
  const a2 = a1.describe("Hello");

  expect(a1.description).toEqual(undefined);
  expect(a2.description).toEqual("Hello");
});

test("inherit across clone", () => {
  const A = Schema.string().meta({ a: true });
  expect(A.meta()).toEqual({ a: true });
  const B = A.meta({ b: true });
  expect(B.meta()).toEqual({ a: true, b: true });
  const C = B.describe("hello");
  expect(C.meta()).toEqual({ a: true, b: true, description: "hello" });
});

test("loose examples", () => {
  Schema.string().register(Schema.globalRegistry, {
    examples: ["example"],
  });
});

test("function meta without replacement", () => {
  const myReg = Schema.registry<{
    defaulter: (arg: string, test: boolean) => number;
  }>();

  const mySchema = Schema.date();
  myReg.add(mySchema, {
    defaulter: (arg, _test) => {
      return arg.length;
    },
  });

  expect(myReg.get(mySchema)!.defaulter("hello", true)).toEqual(5);
});

test("function meta with replacement", () => {
  const myReg = Schema.registry<{
    defaulter: (arg: Schema.$input, test: boolean) => Schema.$output;
  }>();

  const mySchema = Schema.string().transform((val) => val.length);
  myReg.add(mySchema, {
    defaulter: (arg, _test) => {
      return arg.length;
    },
  });

  expect(myReg.get(mySchema)!.defaulter("hello", true)).toEqual(5);
});

test("test .clear()", () => {
  const reg = Schema.registry();
  const a = Schema.string();
  reg.add(a);
  expect(reg.has(a)).toEqual(true);
  reg.clear();
  expect(reg.has(a)).toEqual(false);
});

test("re-registering same id silently overwrites", () => {
  const reg = Schema.registry<Schema.core.GlobalMeta>();
  const a = Schema.string();
  const b = Schema.number();

  reg.add(a, { id: "shared-id" });
  reg.add(b, { id: "shared-id" });

  // No error thrown, b now owns the id
  expect(reg._idmap.get("shared-id")).toBe(b);
});

test("toJSONSchema throws on duplicate id across different schemas", () => {
  const reg = Schema.registry<Schema.core.GlobalMeta>();
  const a = Schema.string().register(reg, { id: "duplicate-id" });
  const b = Schema.number().register(reg, { id: "duplicate-id" });

  const wrapper = Schema.object({ a, b });

  expect(() => Schema.toJSONSchema(wrapper, { metadata: reg })).toThrow(
    'Duplicate schema id "duplicate-id" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.'
  );
});

test("toJSONSchema allows same schema with same id", () => {
  const reg = Schema.registry<Schema.core.GlobalMeta>();
  const shared = Schema.string().register(reg, { id: "shared-id" });

  const wrapper = Schema.object({ a: shared, b: shared });

  // Should not throw - same schema instance used twice
  const result = Schema.toJSONSchema(wrapper, { metadata: reg });
  expect(result.$defs?.["shared-id"]).toBeDefined();
});
