import { expect, test, vi } from "vitest";
import * as Schema from "schema/v4";

/**
 * Schema methods are exposed in a way that works when detached from the
 * schema instance — `const opt = Schema.optional; opt()` must produce a
 * working `SchemaOptional`, not a corrupt one. This pattern is used in real
 * code (e.g. `arr.map(Schema.parse)`, `arr.map(Schema.optional)`,
 * destructuring inside utility functions).
 *
 * This test caught a regression in colinhacks/schema#5870 where a memory
 * optimization moved methods to the prototype and made `this`-binding
 * required, silently breaking any detached usage.
 */

const probeArgs: Record<string, unknown[]> = {
  // SchemaType
  optional: [],
  exactOptional: [],
  nullable: [],
  nullish: [],
  array: [],
  describe: ["x"],
  brand: [],
  readonly: [],
  default: ["fallback"],
  catch: ["fallback"],
  // _SchemaString
  min: [1],
  max: [10],
  length: [5],
  nonempty: [],
  trim: [],
  toLowerCase: [],
  toUpperCase: [],
  // SchemaString format methods
  email: [],
  url: [],
  uuid: [],
  cuid: [],
  cuid2: [],
  ulid: [],
  base64: [],
  base64url: [],
  ipv4: [],
  ipv6: [],
  // SchemaNumber
  int: [],
  positive: [],
  negative: [],
  finite: [],
};

test("detached parse-family methods work without `this` binding", () => {
  const schema = Schema.string();
  const { parse, safeParse } = schema;

  expect(parse("hello")).toBe("hello");
  expect(safeParse("hello").success).toBe(true);
});

test("detached Schema.optional() returns a working SchemaOptional", () => {
  const schema = Schema.string();
  const opt = Schema.optional;

  const detached = opt();

  expect(detached).toBeInstanceOf(Schema.SchemaOptional);
  expect(detached.safeParse("hello").success).toBe(true);
  expect(detached.safeParse(undefined).success).toBe(true);
  expect(detached.safeParse(123).success).toBe(false);
});

test("detached Schema.nullable() returns a working SchemaNullable", () => {
  const schema = Schema.string();
  const nul = Schema.nullable;

  const detached = nul();

  expect(detached).toBeInstanceOf(Schema.SchemaNullable);
  expect(detached.safeParse("hello").success).toBe(true);
  expect(detached.safeParse(null).success).toBe(true);
  expect(detached.safeParse(123).success).toBe(false);
});

test("detached Schema.array() returns a working SchemaArray", () => {
  const schema = Schema.string();
  const arr = Schema.array;

  const detached = arr();

  expect(detached).toBeInstanceOf(Schema.SchemaArray);
  expect(detached.safeParse(["a", "b"]).success).toBe(true);
  expect(detached.safeParse([1, 2]).success).toBe(false);
});

test("detached Schema.describe() returns a described schema", () => {
  const schema = Schema.string();
  const describe = Schema.describe;

  const described = describe("hello world");

  expect(described.description).toBe("hello world");
});

test("detached refinement still validates", () => {
  const schema = Schema.string();
  const refine = Schema.refine;

  const refined = refine((s: string) => s.startsWith("x"), "must start with x");

  expect(refined.safeParse("xhello").success).toBe(true);
  expect(refined.safeParse("hello").success).toBe(false);
});

test("detached chained calls work — Schema.optional then parse", () => {
  const schema = Schema.string();
  const opt = Schema.optional;
  const optionalSchema = opt();
  const { parse } = optionalSchema;

  expect(parse("hi")).toBe("hi");
  expect(parse(undefined)).toBe(undefined);
});

test("detached parse can be called as a free function", () => {
  const schema = Schema.string();
  const parse = Schema.parse;
  const inputs = ["a", "b", "c"];

  const results = inputs.map((v) => parse(v));

  expect(results).toEqual(["a", "b", "c"]);
});

test("detached methods on Schema.number() work", () => {
  const schema = Schema.number();

  const min = Schema.min;
  const max = Schema.max;
  const positive = Schema.positive;

  expect(min(5).safeParse(3).success).toBe(false);
  expect(max(5).safeParse(7).success).toBe(false);
  expect(positive().safeParse(-1).success).toBe(false);
});

test("detached object methods work", () => {
  const schema = Schema.object({ a: Schema.string(), b: Schema.number() });

  const pick = Schema.pick;
  const omit = Schema.omit;
  const partial = Schema.partial;
  const exactPartial = Schema.exactPartial;
  const extend = Schema.extend;

  expect(Object.keys(pick({ a: true })._schema.def.shape)).toEqual(["a"]);
  expect(Object.keys(omit({ a: true })._schema.def.shape)).toEqual(["b"]);
  expect(partial().safeParse({}).success).toBe(true);
  expect(exactPartial().safeParse({}).success).toBe(true);
  expect(exactPartial().safeParse({ a: undefined }).success).toBe(false);
  const extended = extend({ c: Schema.boolean() });
  expect(Object.keys(extended._schema.def.shape).sort()).toEqual(["a", "b", "c"]);
});

// Sweep across many builder methods at once. If any of them break with the `const m = Schema.foo; m(...)` pattern, this test will report which.
test("broad sweep: detaching builder methods does not throw or produce a corrupt schema", () => {
  const stringSchema = Schema.string();
  const numberSchema = Schema.number();

  const broken: Array<{ method: string; reason: string }> = [];

  for (const [methodName, args] of Object.entries(probeArgs)) {
    const target: any = methodName in stringSchema ? stringSchema : methodName in numberSchema ? numberSchema : null;
    if (!target) continue;

    const detached = target[methodName] as Function | undefined;
    if (typeof detached !== "function") continue;

    try {
      const result = detached(...args);
      // If the detached call returned a schema, sanity-check it parses its base type. (e.g. `optional()` should accept its inner type.)
      if (result && typeof result === "object" && "_schema" in result && typeof (result as any).safeParse === "function") {
        const probeValue = target === stringSchema ? "x" : 1;
        const r = (result as any).safeParse(probeValue);
        // success or a clean failure are both fine — we only fail on throw or on a schema with corrupt internal state (innerType undefined etc).
        if (r === undefined || (typeof r === "object" && !("success" in r))) {
          broken.push({ method: methodName, reason: "safeParse returned malformed result" });
        }
      }
    } catch (err: any) {
      broken.push({ method: methodName, reason: err?.message ?? String(err) });
    }
  }

  expect(broken).toEqual([]);
});

test("vi.spyOn wraps a prototype method that was never read", () => {
  const schema = Schema.object({ a: Schema.string() });
  const spy = vi.spyOn(schema, "safeParse").mockReturnValue({ success: true, data: { a: "mocked" } });

  expect(Schema.safeParse({})).toEqual({ success: true, data: { a: "mocked" } });
  expect(spy).toHaveBeenCalledOnce();

  spy.mockRestore();
  expect(Schema.safeParse({ a: "x" })).toEqual({ success: true, data: { a: "x" } });
  expect(Schema.safeParse({}).success).toBe(false);

  const json = vi.spyOn(schema, "toJSONSchema").mockReturnValue({ type: "null" } as any);
  expect(Schema.toJSONSchema()).toEqual({ type: "null" });
  json.mockRestore();
  expect(Schema.toJSONSchema().type).toBe("object");
});

test("a getter member answers a bare read without a receiver", () => {
  const schema = Schema.string();
  const get = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(schema), "spa")!.get!;
  expect(get.call(undefined)).toBeUndefined();
  expect(Schema.spa).toBe(Schema.safeParseAsync);
});
