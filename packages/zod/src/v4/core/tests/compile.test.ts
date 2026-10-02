import { expect, expectTypeOf, test } from "vitest";

import * as Schema from "../../index.js";
import {
  INVALID,
  SchemaCompileAsyncError,
  SchemaCompileUnsupportedError,
  compile,
  compileFn,
  withParser,
} from "../compile.js";
import { $SchemaAsyncError } from "../core.js";

// Differential helper: assert compiled schema matches the original on a value.
function expectMatch(schema: Schema.SchemaType, value: unknown) {
  const compiled = compile(schema);
  const original = Schema.safeParse(value);
  const fast = compiled.safeParse(value);

  expect(fast.success).toBe(original.success);
  if (original.success && fast.success) {
    expect(fast.data).toEqual(original.data);
  } else if (!original.success && !fast.success) {
    expect(fast.error.issues).toEqual(original.error.issues);
  }
}

// Parse and assert success; return the parsed data for further assertions.
function valid<T extends Schema.SchemaType>(schema: T, value: unknown): Schema.output<T> {
  const result = Schema.safeParse(value);
  if (!result.success) {
    throw new Error(`expected success, got issues: ${JSON.stringify(result.error.issues)}`);
  }
  return result.data;
}

// Parse and assert failure.
function invalid(schema: Schema.SchemaType, value: unknown) {
  const result = Schema.safeParse(value);
  expect(result.success).toBe(false);
}

// === Primitives ===

test("string", () => {
  const aot = compile(Schema.string());
  expect(valid(aot, "hello")).toBe("hello");
  expect(valid(aot, "")).toBe("");
  invalid(aot, 123);
  invalid(aot, null);
  invalid(aot, undefined);
});

test("number", () => {
  const aot = compile(Schema.number());
  expect(valid(aot, 123)).toBe(123);
  expect(valid(aot, 0)).toBe(0);
  expect(valid(aot, -5.5)).toBe(-5.5);
  invalid(aot, Number.NaN); // Schema.number() rejects NaN
  invalid(aot, Number.POSITIVE_INFINITY); // Schema.number() rejects Infinity
  invalid(aot, Number.NEGATIVE_INFINITY);
  invalid(aot, "123");
  invalid(aot, null);
});

test("boolean", () => {
  const aot = compile(Schema.boolean());
  expect(valid(aot, true)).toBe(true);
  expect(valid(aot, false)).toBe(false);
  invalid(aot, 1);
  invalid(aot, "true");
});

test("bigint", () => {
  const aot = compile(Schema.bigint());
  expect(valid(aot, 123n)).toBe(123n);
  expect(valid(aot, 0n)).toBe(0n);
  invalid(aot, 123);
  invalid(aot, "123");
});

test("symbol", () => {
  const aot = compile(Schema.symbol());
  const sym = Symbol();
  expect(valid(aot, sym)).toBe(sym);
  const namedSym = Symbol.for("test");
  expect(valid(aot, namedSym)).toBe(namedSym);
  invalid(aot, "symbol");
});

test("undefined", () => {
  const aot = compile(Schema.undefined());
  expect(valid(aot, undefined)).toBe(undefined);
  invalid(aot, null);
  invalid(aot, 0);
});

test("null", () => {
  const aot = compile(Schema.null());
  expect(valid(aot, null)).toBe(null);
  invalid(aot, undefined);
  invalid(aot, 0);
});

test("void", () => {
  const aot = compile(Schema.void());
  expect(valid(aot, undefined)).toBe(undefined);
  invalid(aot, null);
  invalid(aot, 0);
});

test("nan", () => {
  const aot = compile(Schema.nan());
  expect(Number.isNaN(valid(aot, Number.NaN))).toBe(true);
  expect(Number.isNaN(valid(aot, Number.NaN))).toBe(true);
  invalid(aot, 0);
  invalid(aot, Number.POSITIVE_INFINITY);
  invalid(aot, "NaN");
});

test("date", () => {
  const aot = compile(Schema.date());
  const d1 = new Date();
  expect(valid(aot, d1)).toBe(d1);
  const d2 = new Date(0);
  expect(valid(aot, d2)).toBe(d2);
  invalid(aot, new Date("invalid")); // Invalid date
  invalid(aot, "2024-01-01");
  invalid(aot, Date.now());
});

// === Special Types ===

test("any", () => {
  const aot = compile(Schema.any());
  expect(valid(aot, null)).toBe(null);
  expect(valid(aot, undefined)).toBe(undefined);
  expect(valid(aot, 123)).toBe(123);
  expect(valid(aot, { nested: { deep: true } })).toEqual({ nested: { deep: true } });
});

test("unknown", () => {
  const aot = compile(Schema.unknown());
  expect(valid(aot, null)).toBe(null);
  expect(valid(aot, undefined)).toBe(undefined);
  expect(valid(aot, 123)).toBe(123);
});

test("never", () => {
  const aot = compile(Schema.never());
  invalid(aot, null);
  invalid(aot, undefined);
  invalid(aot, 123);
});

// === Literal ===

test("literal string", () => {
  const aot = compile(Schema.literal("hello"));
  expect(valid(aot, "hello")).toBe("hello");
  invalid(aot, "Hello");
  invalid(aot, "");
});

test("literal number", () => {
  const aot = compile(Schema.literal(42));
  expect(valid(aot, 42)).toBe(42);
  invalid(aot, 43);
  invalid(aot, "42");
});

test("literal boolean", () => {
  const aot = compile(Schema.literal(true));
  expect(valid(aot, true)).toBe(true);
  invalid(aot, false);
});

test("literal null", () => {
  const aot = compile(Schema.literal(null));
  expect(valid(aot, null)).toBe(null);
  invalid(aot, undefined);
});

test("literal bigint", () => {
  const aot = compile(Schema.literal(100n));
  expect(valid(aot, 100n)).toBe(100n);
  invalid(aot, 100);
  invalid(aot, 101n);
});

// === Enum ===

test("enum", () => {
  const aot = compile(Schema.enum(["a", "b", "c"]));
  expect(valid(aot, "a")).toBe("a");
  expect(valid(aot, "b")).toBe("b");
  expect(valid(aot, "c")).toBe("c");
  invalid(aot, "d");
  invalid(aot, "A");
  invalid(aot, 1);
});

// === Wrapper Types ===

test("readonly", () => {
  const aot = compile(Schema.readonly(Schema.string()));
  expect(valid(aot, "hello")).toBe("hello");
  invalid(aot, 123);
});

test("default", () => {
  const aot = compile(Schema.string().default("hello"));
  expect(valid(aot, "world")).toBe("world");
  expect(valid(aot, undefined)).toBe("hello"); // default applies
  invalid(aot, 123);
});

test("prefault", () => {
  const aot = compile(Schema.string().trim().prefault("  hello  "));
  expect(valid(aot, "world")).toBe("world");
  expect(valid(aot, undefined)).toBe("hello");
  invalid(aot, 123);
});

test("nonoptional", () => {
  const aot = compile(Schema.string().optional().nonoptional());
  expect(valid(aot, "hello")).toBe("hello");
  invalid(aot, undefined); // nonoptional rejects undefined
  invalid(aot, 123);
});

test("nonoptional judges the inner's output, not its input", () => {
  // An inner catch turns a *defined* input into undefined, which must still be rejected; an inner default turns an absent input into a value, which must be accepted. Testing the input alone got both backwards.
  const caught = z
    .string()
    .min(2)
    .max(8)
    .prefault("abc")
    .catch(undefined as any)
    .optional()
    .nonoptional();
  for (const input of ["abc", "abcdefghij", "a", undefined]) expectMatch(caught, input);

  expectMatch(
    z
      .string()
      .transform(() => undefined)
      .nonoptional(),
    "s"
  );
  for (const input of [undefined, "y", 1]) expectMatch(Schema.string().default("x").nonoptional(), input);
});

test("a nonoptional object key whose inner supplies a value still needs the key", () => {
  // The runtime separates an absent key from an explicit undefined here: absent fails, explicit undefined takes the default. The fast path has to as well.
  const prop = z
    .literal("lit")
    .default("other" as any)
    .optional()
    .nonoptional();
  const schema = Schema.object({ k1: prop });
  expectMatch(schema, {});
  expectMatch(schema, { k1: undefined });
  expectMatch(schema, { k1: "lit" });
  expectMatch(prop, undefined);
});

test("success", () => {
  const aot = compile(Schema.success(Schema.string()));
  expect(valid(aot, "hello")).toBe(true);
  invalid(aot, 123);
  expectMatch(Schema.success(Schema.string()), "hello");
  expectMatch(Schema.success(Schema.string()), 123);
  expectMatch(Schema.object({ ok: Schema.success(Schema.number()) }), { ok: 5 });
});

// === Optional & Nullable ===

test("optional", () => {
  const aot = compile(Schema.optional(Schema.string()));
  expect(valid(aot, "hello")).toBe("hello");
  expect(valid(aot, undefined)).toBe(undefined);
  invalid(aot, null);
  invalid(aot, 123);
});

test("nullable", () => {
  const aot = compile(Schema.nullable(Schema.string()));
  expect(valid(aot, "hello")).toBe("hello");
  expect(valid(aot, null)).toBe(null);
  invalid(aot, undefined);
  invalid(aot, 123);
});

// === Array ===

test("array of strings", () => {
  const aot = compile(Schema.array(Schema.string()));
  expect(valid(aot, [])).toEqual([]);
  expect(valid(aot, ["a", "b"])).toEqual(["a", "b"]);
  invalid(aot, [1, 2]);
  invalid(aot, ["a", 1]);
  invalid(aot, "not array");
});

test("array of objects", () => {
  const aot = compile(Schema.array(Schema.object({ id: Schema.number() })));
  expect(valid(aot, [{ id: 1 }, { id: 2 }])).toEqual([{ id: 1 }, { id: 2 }]);
  invalid(aot, [{ id: "1" }]);
  invalid(aot, [{}]);
});

// === Object ===

test("simple object", () => {
  const aot = compile(Schema.object({ name: Schema.string(), age: Schema.number() }));
  expect(valid(aot, { name: "Alice", age: 30 })).toEqual({ name: "Alice", age: 30 });
  expect(valid(aot, { name: "Bob", age: 25, extra: true })).toEqual({ name: "Bob", age: 25 }); // strip mode
  invalid(aot, { name: "Charlie" });
  invalid(aot, { name: 123, age: 30 });
  invalid(aot, null);
  invalid(aot, []);
});

test("nested object", () => {
  const aot = compile(
    Schema.object({
      user: Schema.object({
        name: Schema.string(),
        address: Schema.object({
          city: Schema.string(),
        }),
      }),
    })
  );
  expect(valid(aot, { user: { name: "Alice", address: { city: "NYC" } } })).toEqual({
    user: { name: "Alice", address: { city: "NYC" } },
  });
  invalid(aot, { user: { name: "Alice", address: {} } });
});

test("object with optional property", () => {
  const aot = compile(Schema.object({ name: Schema.string(), age: Schema.optional(Schema.number()) }));
  expect(valid(aot, { name: "Alice" })).toEqual({ name: "Alice" });
  expect(valid(aot, { name: "Alice", age: 30 })).toEqual({ name: "Alice", age: 30 });
  expect(valid(aot, { name: "Alice", age: undefined })).toEqual({ name: "Alice", age: undefined });
  invalid(aot, { name: "Alice", age: "30" });
});

test("object required undefined-accepting properties distinguish absence", () => {
  const cases = [
    Schema.object({ value: Schema.undefined() }),
    Schema.object({ value: Schema.union([Schema.string(), Schema.undefined()]) }),
    Schema.object({ value: Schema.any() }),
    Schema.object({ value: Schema.unknown() }),
  ];

  for (const schema of cases) {
    const aot = compile(schema);
    invalid(aot, {});
    expect(valid(aot, { value: undefined })).toEqual({ value: undefined });
  }
});

test("strictObject", () => {
  const aot = compile(Schema.strictObject({ name: Schema.string() }));
  expect(valid(aot, { name: "Alice" })).toEqual({ name: "Alice" });
  invalid(aot, { name: "Alice", extra: true });
  invalid(aot, {});
});

test("strictObject with optional", () => {
  const aot = compile(Schema.strictObject({ name: Schema.string(), age: Schema.optional(Schema.number()) }));
  expect(valid(aot, { name: "Alice" })).toEqual({ name: "Alice" });
  expect(valid(aot, { name: "Alice", age: 30 })).toEqual({ name: "Alice", age: 30 });
  invalid(aot, { name: "Alice", extra: true });
});

test("looseObject", () => {
  const aot = compile(Schema.looseObject({ name: Schema.string() }));
  expect(valid(aot, { name: "Alice" })).toEqual({ name: "Alice" });
  expect(valid(aot, { name: "Alice", extra: true })).toEqual({ name: "Alice", extra: true });
  invalid(aot, {});
});

test("object with catchall", () => {
  const aot = compile(Schema.object({ name: Schema.string() }).catchall(Schema.number()));
  expect(valid(aot, { name: "Alice" })).toEqual({ name: "Alice" });
  expect(valid(aot, { name: "Alice", age: 30 })).toEqual({ name: "Alice", age: 30 });
  invalid(aot, { name: "Alice", age: "30" });
});

// === Matches Schema behavior ===

test("matches Schema: primitives", () => {
  expectMatch(Schema.string(), "hello");
  expectMatch(Schema.string(), 123);
  expectMatch(Schema.number(), 123);
  expectMatch(Schema.number(), Number.NaN);
  expectMatch(Schema.boolean(), true);
  expectMatch(Schema.boolean(), 1);
});

test("matches Schema: void/nan/date", () => {
  expectMatch(Schema.void(), undefined);
  expectMatch(Schema.void(), null);
  expectMatch(Schema.nan(), Number.NaN);
  expectMatch(Schema.nan(), 0);
  expectMatch(Schema.date(), new Date());
  expectMatch(Schema.date(), new Date("invalid"));
  expectMatch(Schema.date(), "2024-01-01");
});

test("matches Schema: complex schema", () => {
  const schema = Schema.strictObject({
    id: Schema.number(),
    name: Schema.string(),
    tags: Schema.array(Schema.string()),
    nested: Schema.object({
      active: Schema.boolean(),
    }),
  });

  expectMatch(schema, { id: 1, name: "test", tags: ["a"], nested: { active: true } });
  expectMatch(schema, { id: 1, name: "test", tags: ["a"], nested: { active: true }, extra: "x" });
  expectMatch(schema, { id: "1", name: "test", tags: ["a"], nested: { active: true } });
});

// === Checks ===

test("number min/max", () => {
  const aot = compile(Schema.number().min(0).max(100));
  expect(valid(aot, 50)).toBe(50);
  expect(valid(aot, 0)).toBe(0);
  expect(valid(aot, 100)).toBe(100);
  invalid(aot, -1);
  invalid(aot, 101);
});

test("number exclusive min/max", () => {
  const aot = compile(Schema.number().gt(0).lt(100));
  expect(valid(aot, 50)).toBe(50);
  expect(valid(aot, 1)).toBe(1);
  expect(valid(aot, 99)).toBe(99);
  invalid(aot, 0);
  invalid(aot, 100);
});

test("number int", () => {
  const aot = compile(Schema.number().int());
  expect(valid(aot, 5)).toBe(5);
  expect(valid(aot, -10)).toBe(-10);
  invalid(aot, 5.5);
});

test("number multipleOf", () => {
  const aot = compile(Schema.number().multipleOf(5));
  expect(valid(aot, 0)).toBe(0);
  expect(valid(aot, 5)).toBe(5);
  expect(valid(aot, 10)).toBe(10);
  invalid(aot, 7);
});

test("string length checks", () => {
  const aot = compile(Schema.string().min(3).max(10));
  expect(valid(aot, "abc")).toBe("abc");
  expect(valid(aot, "0123456789")).toBe("0123456789");
  invalid(aot, "ab");
  invalid(aot, "01234567890");
});

test("string exact length", () => {
  const aot = compile(Schema.string().length(5));
  expect(valid(aot, "hello")).toBe("hello");
  invalid(aot, "hi");
  invalid(aot, "toolong");
});

test("string regex", () => {
  const aot = compile(Schema.string().regex(/^[a-z]+$/));
  expect(valid(aot, "hello")).toBe("hello");
  invalid(aot, "Hello");
  invalid(aot, "hello123");
});

test("string startsWith/endsWith/includes", () => {
  const aot = compile(Schema.string().startsWith("hello").endsWith("world").includes("beautiful"));
  expect(valid(aot, "hello beautiful world")).toBe("hello beautiful world");
  invalid(aot, "hello world");
  invalid(aot, "beautiful world");
});

test("string lowercase/uppercase", () => {
  const lower = compile(Schema.string().lowercase());
  expect(valid(lower, "hello")).toBe("hello");
  invalid(lower, "Hello");

  const upper = compile(Schema.string().uppercase());
  expect(valid(upper, "HELLO")).toBe("HELLO");
  invalid(upper, "Hello");
});

test("array length checks", () => {
  const aot = compile(Schema.array(Schema.number()).min(1).max(3));
  expect(valid(aot, [1])).toEqual([1]);
  expect(valid(aot, [1, 2, 3])).toEqual([1, 2, 3]);
  invalid(aot, []);
  invalid(aot, [1, 2, 3, 4]);
});

test("bigint min/max", () => {
  const aot = compile(Schema.bigint().min(0n).max(100n));
  expect(valid(aot, 50n)).toBe(50n);
  expect(valid(aot, 0n)).toBe(0n);
  invalid(aot, -1n);
  invalid(aot, 101n);
});

test("matches Schema: checks", () => {
  const schema = z
    .string()
    .min(3)
    .max(10)
    .regex(/^[a-z]+$/);
  expectMatch(schema, "hello");
  expectMatch(schema, "ab");
  expectMatch(schema, "Hello");
  expectMatch(schema, "toolongstring");
});

test("custom refine", () => {
  const aot = compile(Schema.string().refine((x) => x.length > 3));
  expect(valid(aot, "hello")).toBe("hello");
  invalid(aot, "abc");
  invalid(aot, "ab");
});

test("custom refine with object", () => {
  const aot = compile(
    z
      .object({
        password: Schema.string(),
        confirm: Schema.string(),
      })
      .refine((data) => data.password === data.confirm)
  );
  expect(valid(aot, { password: "secret", confirm: "secret" })).toEqual({ password: "secret", confirm: "secret" });
  invalid(aot, { password: "secret", confirm: "wrong" });
});

// === String Formats ===

test("email", () => {
  const aot = compile(Schema.email());
  expect(valid(aot, "test@example.com")).toBe("test@example.com");
  expect(valid(aot, "user.name+tag@example.co.uk")).toBe("user.name+tag@example.co.uk");
  invalid(aot, "invalid");
  invalid(aot, "@example.com");
  invalid(aot, 123);
});

test("uuid", () => {
  const aot = compile(Schema.uuid());
  expect(valid(aot, "550e8400-e29b-41d4-a716-446655440000")).toBe("550e8400-e29b-41d4-a716-446655440000");
  expect(valid(aot, "00000000-0000-0000-0000-000000000000")).toBe("00000000-0000-0000-0000-000000000000");
  invalid(aot, "not-a-uuid");
  invalid(aot, "550e8400-e29b-41d4-a716");
});

test("url", () => {
  const aot = compile(Schema.url());
  expect(valid(aot, "https://example.com")).toBe("https://example.com");
  expect(valid(aot, "  https://example.com  ")).toBe("https://example.com");
  expect(valid(aot, "http://localhost:3000/path")).toBe("http://localhost:3000/path");
  invalid(aot, "not a url");
  invalid(aot, "example.com");
});

test("ipv4", () => {
  const aot = compile(Schema.ipv4());
  expect(valid(aot, "192.168.1.1")).toBe("192.168.1.1");
  expect(valid(aot, "0.0.0.0")).toBe("0.0.0.0");
  expect(valid(aot, "255.255.255.255")).toBe("255.255.255.255");
  invalid(aot, "192.168.1");
  invalid(aot, "256.0.0.0");
});

test("matches Schema: string formats", () => {
  expectMatch(Schema.email(), "test@example.com");
  expectMatch(Schema.email(), "invalid");
  expectMatch(Schema.uuid(), "550e8400-e29b-41d4-a716-446655440000");
  expectMatch(Schema.uuid(), "not-a-uuid");
  // Schema.url() intentionally throws at compile time (see "url is unsupported").
});

// === Tuple ===

test("tuple basic", () => {
  const aot = compile(Schema.tuple([Schema.string(), Schema.number()]));
  expect(valid(aot, ["hello", 42])).toEqual(["hello", 42]);
  invalid(aot, ["hello", "world"]);
  invalid(aot, ["hello"]);
  invalid(aot, ["hello", 42, "extra"]);
  invalid(aot, {});
});

test("tuple with rest", () => {
  const aot = compile(Schema.tuple([Schema.string(), Schema.number()]).rest(Schema.boolean()));
  expect(valid(aot, ["hello", 42])).toEqual(["hello", 42]);
  expect(valid(aot, ["hello", 42, true])).toEqual(["hello", 42, true]);
  expect(valid(aot, ["hello", 42, true, false])).toEqual(["hello", 42, true, false]);
  invalid(aot, ["hello", 42, "extra"]);
  invalid(aot, ["hello"]);
});

test("tuple empty", () => {
  const aot = compile(Schema.tuple([]));
  expect(valid(aot, [])).toEqual([]);
  invalid(aot, ["extra"]);
});

test("matches Schema: tuple", () => {
  const schema = Schema.tuple([Schema.string(), Schema.number()]).rest(Schema.boolean());
  expectMatch(schema, ["hello", 42]);
  expectMatch(schema, ["hello", 42, true, false]);
  expectMatch(schema, ["hello", 42, "not boolean"]);
  expectMatch(schema, ["hello"]);
});

// === Union ===

test("union of primitives", () => {
  const aot = compile(Schema.union([Schema.string(), Schema.number()]));
  expect(valid(aot, "hello")).toBe("hello");
  expect(valid(aot, 42)).toBe(42);
  invalid(aot, true);
  invalid(aot, null);
});

test("union of literals (Set optimization)", () => {
  const aot = compile(Schema.union([Schema.literal("a"), Schema.literal("b"), Schema.literal("c")]));
  expect(valid(aot, "a")).toBe("a");
  expect(valid(aot, "b")).toBe("b");
  expect(valid(aot, "c")).toBe("c");
  invalid(aot, "d");
});

test("union single option", () => {
  const aot = compile(Schema.union([Schema.string()]));
  expect(valid(aot, "hello")).toBe("hello");
  invalid(aot, 42);
});

test("union with objects", () => {
  const aot = compile(
    Schema.union([
      Schema.object({ type: Schema.literal("a"), value: Schema.string() }),
      Schema.object({ type: Schema.literal("b"), value: Schema.number() }),
    ])
  );
  expect(valid(aot, { type: "a", value: "hello" })).toEqual({ type: "a", value: "hello" });
  expect(valid(aot, { type: "b", value: 42 })).toEqual({ type: "b", value: 42 });
  invalid(aot, { type: "a", value: 42 });
  invalid(aot, { type: "c", value: "hello" });
});

test("matches Schema: union", () => {
  const schema = Schema.union([Schema.string(), Schema.number(), Schema.null()]);
  expectMatch(schema, "hello");
  expectMatch(schema, 42);
  expectMatch(schema, null);
  expectMatch(schema, true);
  expectMatch(schema, undefined);
});

// === Intersection ===

test("intersection of objects", () => {
  const aot = compile(Schema.intersection(Schema.object({ name: Schema.string() }), Schema.object({ age: Schema.number() })));
  expect(valid(aot, { name: "Alice", age: 30 })).toEqual({ name: "Alice", age: 30 });
  invalid(aot, { name: "Alice" });
  invalid(aot, { age: 30 });
});

test("intersection deep merge", () => {
  const aot = compile(
    Schema.intersection(Schema.object({ nested: Schema.object({ a: Schema.string() }) }), Schema.object({ nested: Schema.object({ b: Schema.number() }) }))
  );
  expect(valid(aot, { nested: { a: "x", b: 1 } })).toEqual({ nested: { a: "x", b: 1 } });
});

// === Record ===

test("record basic", () => {
  const aot = compile(Schema.record(Schema.string(), Schema.number()));
  expect(valid(aot, {})).toEqual({});
  expect(valid(aot, { a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
  invalid(aot, { a: "hello" });
  invalid(aot, null);
  invalid(aot, []);
});

test("record with enum keys", () => {
  // Records with enum/literal keys have exhaustive semantics: every enum value must be present in the input. Compile currently forces fallback for this case (see compile.ts generateRecordCheck), so behavior matches the runtime by delegation.
  const aot = compile(Schema.record(Schema.enum(["a", "b"]), Schema.number()));
  expect(valid(aot, { a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
  invalid(aot, { a: 1 }); // missing required key b
  invalid(aot, { c: 3 }); // unknown key
});

test("matches Schema: record", () => {
  const schema = Schema.record(Schema.string(), Schema.number());
  expectMatch(schema, {});
  expectMatch(schema, { a: 1, b: 2 });
  expectMatch(schema, { a: "hello" });
});

// === Map ===

test("map basic", () => {
  const aot = compile(Schema.map(Schema.string(), Schema.number()));
  expect(valid(aot, new Map())).toEqual(new Map());
  expect(
    valid(
      aot,
      new Map([
        ["a", 1],
        ["b", 2],
      ])
    )
  ).toEqual(
    new Map([
      ["a", 1],
      ["b", 2],
    ])
  );
  invalid(aot, new Map([["a", "hello"]]));
  invalid(aot, new Map([[1, 1]]));
  invalid(aot, {});
});

test("matches Schema: map", () => {
  const schema = Schema.map(Schema.string(), Schema.number());
  expectMatch(schema, new Map());
  expectMatch(schema, new Map([["a", 1]]));
  expectMatch(schema, new Map([["a", "hello"]]));
  expectMatch(schema, {});
});

// === Set ===

test("set basic", () => {
  const aot = compile(Schema.set(Schema.number()));
  expect(valid(aot, new Set())).toEqual(new Set());
  expect(valid(aot, new Set([1, 2, 3]))).toEqual(new Set([1, 2, 3]));
  invalid(aot, new Set(["hello"]));
  invalid(aot, []);
});

test("set size checks", () => {
  const aot = compile(Schema.set(Schema.number()).min(1).max(3));
  expect(valid(aot, new Set([1]))).toEqual(new Set([1]));
  expect(valid(aot, new Set([1, 2, 3]))).toEqual(new Set([1, 2, 3]));
  invalid(aot, new Set());
  invalid(aot, new Set([1, 2, 3, 4]));
});

test("matches Schema: set", () => {
  const schema = Schema.set(Schema.string());
  expectMatch(schema, new Set());
  expectMatch(schema, new Set(["a", "b"]));
  expectMatch(schema, new Set([1, 2]));
  expectMatch(schema, []);
});

// === Template Literal ===

test("template literal basic", () => {
  const aot = compile(Schema.templateLiteral([Schema.literal("hello"), Schema.literal("-"), Schema.literal("world")]));
  expect(valid(aot, "hello-world")).toBe("hello-world");
  invalid(aot, "hello-world!");
  invalid(aot, "helloworld");
  invalid(aot, 123);
});

test("template literal with types", () => {
  const aot = compile(Schema.templateLiteral(["user-", Schema.number()]));
  expect(valid(aot, "user-123")).toBe("user-123");
  expect(valid(aot, "user-0")).toBe("user-0");
  invalid(aot, "user-abc");
  invalid(aot, "admin-123");
});

test("matches Schema: template literal", () => {
  const schema = Schema.templateLiteral(["id-", Schema.number()]);
  expectMatch(schema, "id-123");
  expectMatch(schema, "id-abc");
  expectMatch(schema, "other-123");
});

// === Lazy ===

test("lazy basic", () => {
  const aot = compile(Schema.lazy(() => Schema.string()));
  expect(valid(aot, "hello")).toBe("hello");
  invalid(aot, 123);
});

test("lazy recursive schemas are refused, and still parse through the runtime", () => {
  interface Node {
    value: string;
    next?: Node | undefined;
  }
  const nodeSchema: Schema.SchemaType<Node> = Schema.object({
    value: Schema.string(),
    next: Schema.lazy(() => nodeSchema).optional(),
  });

  // A recursive schema is re-entered by a single parse, which is how the runtime memoizer terminates input containing a reference cycle. That state is keyed on the parse context, and the fast path has none, so it declines the schema rather than following the cycle until the stack runs out.
  expect(() => compile(nodeSchema, { strict: true })).toThrow(SchemaCompileUnsupportedError);

  expect(valid(nodeSchema, { value: "a" })).toEqual({ value: "a" });
  expect(valid(nodeSchema, { value: "a", next: { value: "b" } })).toEqual({ value: "a", next: { value: "b" } });
  invalid(nodeSchema, { value: "a", next: { value: 123 } });
  invalid(nodeSchema, { value: 123 });

  // The case the refusal exists for: cyclic input parses instead of crashing.
  const cyclic: any = { value: "a" };
  cyclic.next = cyclic;
  expect(() => nodeSchema.parse(cyclic)).not.toThrow();
});

test("matches Schema: lazy", () => {
  const schema = Schema.lazy(() => Schema.string());
  expectMatch(schema, "hello");
  expectMatch(schema, 123);
});

// === Pipe ===

test("pipe without transform", () => {
  // Pipe with both schemas validating the same type
  const aot = compile(Schema.string().pipe(Schema.string().min(3)));
  expect(valid(aot, "hello")).toBe("hello");
  invalid(aot, "ab");
  invalid(aot, 123);
});

test("matches Schema: pipe without transform", () => {
  const schema = Schema.string().pipe(Schema.string().min(3));
  expectMatch(schema, "hello");
  expectMatch(schema, "ab");
  expectMatch(schema, 123);
});

// === Custom / Instanceof ===

test("instanceof", () => {
  class MyClass {
    value: number;
    constructor(v: number) {
      this.value = v;
    }
  }

  const aot = compile(Schema.instanceof(MyClass));
  const instance = new MyClass(1);
  expect(valid(aot, instance)).toBe(instance);
  invalid(aot, { value: 1 });
  invalid(aot, null);
});

test("instanceof Date", () => {
  const aot = compile(Schema.instanceof(Date));
  const d = new Date();
  expect(valid(aot, d)).toBe(d);
  invalid(aot, "2024-01-01");
  invalid(aot, {});
});

test("matches Schema: instanceof", () => {
  class Test {}
  const schema = Schema.instanceof(Test);
  expectMatch(schema, new Test());
  expectMatch(schema, {});
  expectMatch(schema, null);
});

// === Bigint Format Checks ===

test("bigint int64 format", () => {
  const aot = compile(Schema.int64());
  expect(valid(aot, 0n)).toBe(0n);
  expect(valid(aot, 9223372036854775807n)).toBe(9223372036854775807n);
  expect(valid(aot, -9223372036854775808n)).toBe(-9223372036854775808n);
  invalid(aot, 9223372036854775808n); // too big
  invalid(aot, -9223372036854775809n); // too small
});

test("bigint uint64 format", () => {
  const aot = compile(Schema.uint64());
  expect(valid(aot, 0n)).toBe(0n);
  expect(valid(aot, 18446744073709551615n)).toBe(18446744073709551615n);
  invalid(aot, -1n); // negative
  invalid(aot, 18446744073709551616n); // too big
});

test("matches Schema: bigint format", () => {
  const schema = Schema.int64();
  expectMatch(schema, 0n);
  expectMatch(schema, 9223372036854775807n);
  expectMatch(schema, 9223372036854775808n);
});

// === Nullish (combines optional + nullable) ===

test("nullish", () => {
  const aot = compile(Schema.string().nullish());
  expect(valid(aot, "hello")).toBe("hello");
  expect(valid(aot, null)).toBe(null);
  expect(valid(aot, undefined)).toBe(undefined);
  invalid(aot, 123);
});

test("matches Schema: nullish", () => {
  const schema = Schema.string().nullish();
  expectMatch(schema, "hello");
  expectMatch(schema, null);
  expectMatch(schema, undefined);
  expectMatch(schema, 123);
});

// === Codec (extends pipe with transform) ===
// Note: Codecs involve transforms, so AOT validates input and executes transforms.

test("codec validates and transforms", () => {
  // stringbool is a codec from string to boolean
  const aot = compile(Schema.stringbool());
  expect(valid(aot, "true")).toBe(true);
  expect(valid(aot, "false")).toBe(false);
  expect(valid(aot, "1")).toBe(true);
  expect(valid(aot, "0")).toBe(false);
  invalid(aot, 123); // Not a string
  invalid(aot, null);
});

// === SuperRefine ===

test("superRefine basic", () => {
  const schema = Schema.string().superRefine((val, ctx) => {
    if (val.length < 3) {
      ctx.addIssue({ code: "custom", message: "Too short" });
    }
  });
  const aot = compile(schema);
  expect(valid(aot, "hello")).toBe("hello");
  invalid(aot, "ab");
  invalid(aot, 123);
});

test("superRefine with multiple issues", () => {
  const schema = Schema.number().superRefine((val, ctx) => {
    if (val < 0) ctx.addIssue({ code: "custom", message: "Must be positive" });
    if (val > 100) ctx.addIssue({ code: "custom", message: "Must be <= 100" });
  });
  const aot = compile(schema);
  expect(valid(aot, 50)).toBe(50);
  invalid(aot, -1);
  invalid(aot, 101);
});

test("matches Schema: superRefine", () => {
  const schema = Schema.string().superRefine((val, ctx) => {
    if (!val.includes("@")) {
      ctx.addIssue({ code: "custom", message: "Must contain @" });
    }
  });
  expectMatch(schema, "test@example.com");
  expectMatch(schema, "invalid");
  expectMatch(schema, 123);
});

// === Transform ===

test("transform basic", () => {
  const schema = Schema.string().transform((val) => val.toUpperCase());
  const aot = compile(schema);
  expect(valid(aot, "hello")).toBe("HELLO"); // Transform succeeds
  invalid(aot, 123); // Not a string (fails before transform)
});

test("transform with validation", () => {
  const schema = Schema.string().transform((val, ctx) => {
    if (val.length === 0) {
      ctx.addIssue({ code: "custom", message: "Empty string" });
      return Schema.NEVER;
    }
    return val.length;
  });
  const aot = compile(schema);
  expect(valid(aot, "hello")).toBe(5);
  invalid(aot, ""); // Transform adds issue
});

test("matches Schema: transform", () => {
  const schema = Schema.string().transform((val) => val.length);
  expectMatch(schema, "hello");
  expectMatch(schema, 123);
});

// === Overwrite Checks (trim, toLowerCase, toUpperCase) ===

test("trim", () => {
  const schema = Schema.string().trim();
  const aot = compile(schema);

  // AOT validates the input type and applies trim transform
  expect(valid(aot, "  hello  ")).toBe("hello");
  expect(valid(aot, "hello")).toBe("hello");
  expect(valid(aot, "")).toBe("");
  invalid(aot, 123);
});

test("toLowerCase", () => {
  const schema = Schema.string().toLowerCase();
  const aot = compile(schema);

  // AOT validates the input type and applies toLowerCase transform
  expect(valid(aot, "HELLO")).toBe("hello");
  expect(valid(aot, "hello")).toBe("hello");
  expect(valid(aot, "")).toBe("");
  invalid(aot, 123);
});

test("toUpperCase", () => {
  const schema = Schema.string().toUpperCase();
  const aot = compile(schema);

  // AOT validates the input type and applies toUpperCase transform
  expect(valid(aot, "hello")).toBe("HELLO");
  expect(valid(aot, "HELLO")).toBe("HELLO");
  expect(valid(aot, "")).toBe("");
  invalid(aot, 123);
});

test("chained overwrites", () => {
  const schema = Schema.string().trim().toLowerCase();
  const aot = compile(schema);

  // AOT validates the input type and applies transforms in order
  expect(valid(aot, "  HELLO  ")).toBe("hello");
  expect(valid(aot, "hello")).toBe("hello");
  expect(valid(aot, "")).toBe("");
  invalid(aot, 123);
});

test("overwrite with validation", () => {
  const schema = Schema.string().trim().min(3);
  const aot = compile(schema);

  // After trim, check min length
  expect(valid(aot, "  hello  ")).toBe("hello"); // "hello" length 5 >= 3
  expect(valid(aot, "hello")).toBe("hello");
  invalid(aot, "  ab  "); // "ab" length 2 < 3
  expect(valid(aot, "abc")).toBe("abc");
  invalid(aot, 123);
});

test("matches Schema: trim", () => {
  const schema = Schema.string().trim();
  expectMatch(schema, "  hello  ");
  expectMatch(schema, "hello");
  expectMatch(schema, 123);
});

test("matches Schema: toLowerCase", () => {
  const schema = Schema.string().toLowerCase();
  expectMatch(schema, "HELLO");
  expectMatch(schema, "hello");
  expectMatch(schema, 123);
});

test("matches Schema: toUpperCase", () => {
  const schema = Schema.string().toUpperCase();
  expectMatch(schema, "hello");
  expectMatch(schema, "HELLO");
  expectMatch(schema, 123);
});

test("matches Schema: chained overwrites", () => {
  const schema = Schema.string().trim().toLowerCase();
  expectMatch(schema, "  HELLO  ");
  expectMatch(schema, "hello");
  expectMatch(schema, 123);
});

test("matches Schema: overwrite with validation", () => {
  const schema = Schema.string().trim().min(3);
  expectMatch(schema, "  hello  ");
  expectMatch(schema, "  ab  ");
  expectMatch(schema, "abc");
  expectMatch(schema, 123);
});

// === Regressions tracking main ===

test("object catchall ignores __proto__ key (#5898)", () => {
  // Passthrough variant
  const loose = compile(Schema.looseObject({ name: Schema.string() }));
  const polluted = JSON.parse('{"name":"ok","__proto__":{"polluted":true}}');
  const out = valid(loose, polluted) as Record<string, unknown>;
  expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
  expect((out as { polluted?: unknown }).polluted).toBeUndefined();

  // Schema-typed catchall
  const typed = compile(Schema.object({ name: Schema.string() }).catchall(Schema.number()));
  const out2 = valid(typed, JSON.parse('{"name":"ok","extra":1}')) as Record<string, unknown>;
  expect(Object.getPrototypeOf(out2)).toBe(Object.prototype);
});

test("multipleOf with sub-integer step uses float tolerance (#5793)", () => {
  const aot = compile(Schema.number().multipleOf(1e-7));
  expect(valid(aot, 0)).toBe(0);
  expect(valid(aot, 1e-7)).toBe(1e-7);
  expect(valid(aot, 3e-7)).toBe(3e-7);
  invalid(aot, 2.5e-7);
  invalid(aot, 1.5e-7);
});

test("tuple with trailing optionals accepts short input (#5661)", () => {
  const schema = Schema.tuple([Schema.string(), Schema.number().optional()]);
  const aot = compile(schema);
  expect(valid(aot, ["a"])).toEqual(["a"]);
  expect(valid(aot, ["a", 1])).toEqual(["a", 1]);
  invalid(aot, []);
  invalid(aot, ["a", "b"]);
  invalid(aot, ["a", 1, "extra"]);
});

test("tuple exactOptional rejects explicit undefined but accepts absence", () => {
  const aot = compile(Schema.tuple([Schema.string().exactOptional()]));
  expect(valid(aot, [])).toEqual([]);
  expect(valid(aot, ["x"])).toEqual(["x"]);
  invalid(aot, [undefined]);
  invalid(aot, [1]);
});

test("tuple mixed required and exactOptional", () => {
  const aot = compile(Schema.tuple([Schema.number(), Schema.string().exactOptional(), Schema.boolean().exactOptional()]));
  expect(valid(aot, [1])).toEqual([1]);
  expect(valid(aot, [1, "x"])).toEqual([1, "x"]);
  expect(valid(aot, [1, "x", true])).toEqual([1, "x", true]);
  invalid(aot, []);
  invalid(aot, [1, undefined]);
  invalid(aot, [1, "x", undefined]);
  invalid(aot, [1, "x", true, "extra"]);
});

test("tuple optional vs exactOptional differ on explicit undefined", () => {
  const opt = compile(Schema.tuple([Schema.string().optional()]));
  expect(valid(opt, [])).toEqual([]);
  expect(valid(opt, [undefined])).toEqual([undefined]);

  const exact = compile(Schema.tuple([Schema.string().exactOptional()]));
  expect(valid(exact, [])).toEqual([]);
  invalid(exact, [undefined]);
});

test("default() shallow-clones Map/Set/array/object (#5855)", () => {
  const mapSchema = Schema.map(Schema.string(), Schema.number()).default(new Map([["a", 1]]));
  const mapFn = compile(mapSchema);
  const m1 = valid(mapFn, undefined) as Map<string, number>;
  const m2 = valid(mapFn, undefined) as Map<string, number>;
  expect(m1).not.toBe(m2);
  m1.set("b", 2);
  expect(m2.has("b")).toBe(false);

  const setSchema = Schema.set(Schema.string()).default(new Set(["x"]));
  const setFn = compile(setSchema);
  const s1 = valid(setFn, undefined) as Set<string>;
  const s2 = valid(setFn, undefined) as Set<string>;
  expect(s1).not.toBe(s2);
});

test("multi-value literal accepts each value", () => {
  const aot = compile(Schema.literal(["a", "b", 1]));
  expect(valid(aot, "a")).toBe("a");
  expect(valid(aot, "b")).toBe("b");
  expect(valid(aot, 1)).toBe(1);
  invalid(aot, "c");
  invalid(aot, 2);
});

// === Phase 1: schema-clone + fallback contract ===

test("compile returns a fresh clone; original schema is untouched", () => {
  const original = Schema.object({ name: Schema.string() });
  const originalRun = original._schema.run;
  const compiled = compile(original);
  expect(compiled).not.toBe(original);
  expect(original._schema.run).toBe(originalRun);
  expect(compiled._schema.run).not.toBe(originalRun);
  // shape def is shared by reference; cloning is structural at the top
  expect(compiled._schema.def).toBe(original._schema.def);
});

test("fallback produces SchemaError identical to the original schema", () => {
  const schema = Schema.object({ name: Schema.string(), age: Schema.number().min(0) });
  const compiled = compile(schema);
  const cases: unknown[] = [
    { name: 123, age: 30 },
    { name: "ok", age: -5 },
    { name: "ok", age: "thirty" },
    null,
    [],
    { name: "ok" },
  ];
  for (const value of cases) {
    const a = Schema.safeParse(value);
    const b = compiled.safeParse(value);
    expect(b.success).toBe(a.success);
    if (!a.success && !b.success) {
      expect(b.error.issues).toEqual(a.error.issues);
    }
  }
});

test("fallback preserves instanceof class name in error message", () => {
  class User {}
  const schema = Schema.instanceof(User);
  const compiled = compile(schema);
  expect(compiled.safeParse(new User()).success).toBe(true);
  const bad = compiled.safeParse({});
  expect(bad.success).toBe(false);
  if (!bad.success) {
    // The error must come from the original schema's runtime, which captured `inst` referring to the original. Class name surfaces in the message.
    expect(bad.error.issues[0]?.message).toMatch(/User/);
  }
});

test("compile bypasses fast path for backward direction (codec encode)", () => {
  const codec = Schema.stringbool();
  const compiled = compile(codec);
  expect(compiled.safeParse("true").data).toBe(true);
  expect(compiled.safeParse("false").data).toBe(false);
  expect(compiled.encode(true)).toBe("true");
  expect(compiled.encode(false)).toBe("false");
});

test("compile bypasses fast path for safeParseAsync", async () => {
  const schema = Schema.string().min(3);
  const compiled = compile(schema);
  const r = await compiled.safeParseAsync("ok");
  expect(r.success).toBe(false);
  const ok = await compiled.safeParseAsync("hello");
  expect(ok.success).toBe(true);
});

test("SchemaCompileAsyncError thrown on async refinement", () => {
  const schema = Schema.string().refine(async () => true);
  expect(() => compile(schema, { strict: true })).toThrow(SchemaCompileAsyncError);
});

test("SchemaCompileAsyncError thrown on async transform", () => {
  const schema = Schema.string().transform(async (s) => s.length);
  expect(() => compile(schema, { strict: true })).toThrow(SchemaCompileAsyncError);
});

test("compiled clone is composable inside another schema", () => {
  const inner = Schema.object({ name: Schema.string() });
  const compiledInner = compile(inner);
  const outer = Schema.object({ user: compiledInner, count: Schema.number() });
  const r = outer.safeParse({ user: { name: "ok" }, count: 1 });
  expect(r.success).toBe(true);
  if (r.success) expect(r.data).toEqual({ user: { name: "ok" }, count: 1 });
  const bad = outer.safeParse({ user: { name: 1 }, count: 1 });
  expect(bad.success).toBe(false);
});

// === catch ===

test("catch over primitive", () => {
  const aot = compile(Schema.catch(Schema.string(), "fallback"));
  expect(valid(aot, "hello")).toBe("hello");
  expect(valid(aot, 123)).toBe("fallback");
  expect(valid(aot, undefined)).toBe("fallback");
});

test("catch as object property", () => {
  const aot = compile(Schema.object({ name: Schema.catch(Schema.string(), "anon") }));
  expect(valid(aot, { name: "Alice" })).toEqual({ name: "Alice" });
  expect(valid(aot, { name: 123 })).toEqual({ name: "anon" });
  expect(valid(aot, {})).toEqual({ name: "anon" });
});

test("a catch callback reading ctx is refused; a constant catch compiles", () => {
  // Finalizing the issues the callback sees depends on the caller's per-parse error map, which generated code never receives — the compiled path produced the default message where `.parse(input, { error })` produces the mapped one. Refuse it, so a union treats it as uncompilable rather than as a rejected branch.
  const reads = Schema.catch(Schema.string().min(5), (ctx) => `bad:${ctx.error.issues.length}`);
  expect(() => compile(reads, { strict: true })).toThrow(SchemaCompileUnsupportedError);
  expect(reads.parse("hi")).toBe("bad:1");
  expect(reads.parse(42 as never)).toMatch(/^bad:\d+$/);

  // A constant catch value needs no issues at all, so it keeps the fast path.
  const constant = compile(Schema.catch(Schema.string().min(5), "fb"));
  expect(valid(constant, "hello world")).toBe("hello world");
  expect(valid(constant, "hi")).toBe("fb");
  expect(valid(constant, 42)).toBe("fb");
});

test("catch falls through unsupported inner via runtime island", () => {
  // Async refine in the inner makes the inner uncompilable, but catch should still compile by treating the whole catch as a runtime island.
  const aot = compile(Schema.catch(Schema.union([Schema.string(), Schema.number()]), "fb"));
  expect(valid(aot, "x")).toBe("x");
  expect(valid(aot, 1)).toBe(1);
  expect(valid(aot, true)).toBe("fb");
});

// === IPv6 / CIDRv6 hoisted helpers ===

test("ipv6 compiled rejects regex-passing but URL-rejecting values", () => {
  const aot = compile(Schema.ipv6());
  expect(valid(aot, "::1")).toBe("::1");
  expect(valid(aot, "2001:db8::1")).toBe("2001:db8::1");
  // "0:0:0:0:0:0:0:1:1" matches the IPv6 regex but `new URL` rejects it.
  invalid(aot, "0:0:0:0:0:0:0:1:1");
  // Differential: confirm runtime and compiled agree on this fixture.
  expectMatch(Schema.ipv6(), "0:0:0:0:0:0:0:1:1");
});

test("cidrv6 compiled validates prefix range and address", () => {
  const aot = compile(Schema.cidrv6());
  expect(valid(aot, "::1/128")).toBe("::1/128");
  invalid(aot, "::1/129");
  invalid(aot, "::1/-1");
  invalid(aot, "not-an-address/64");
  invalid(aot, "::1");
  expectMatch(Schema.cidrv6(), "::1/129");
});

// === Runtime islands ===

test("runtime island falls through unsupported child inside object", () => {
  // Schema.xor (exclusive union) currently throws SchemaCompileUnsupportedError. As an object property, the island should let the rest of the object compile.
  const aot = compile(
    Schema.object({
      label: Schema.string(),
      payload: Schema.xor([Schema.string(), Schema.number()]),
    })
  );
  expect(valid(aot, { label: "ok", payload: "x" })).toEqual({ label: "ok", payload: "x" });
  invalid(aot, { label: "ok", payload: true });
  invalid(aot, { label: 1, payload: "x" });
});

test("runtime island inside array element", () => {
  const aot = compile(Schema.array(Schema.xor([Schema.string(), Schema.number()])));
  expect(valid(aot, ["a", 1, "b"])).toEqual(["a", 1, "b"]);
  invalid(aot, ["a", true]);
});

test("an island thrown from inside an indented block leaves the indent level alone", () => {
  // nullable opens an indented block, coerce throws inside it, and the property islands the pair — two of them so a leak compounds
  const schema = Schema.object({ a: Schema.coerce.number().nullable(), b: Schema.coerce.number().nullable(), tail: Schema.string() });
  expect(compileFn(schema, { debug: true }).code).toMatchInlineSnapshot(`
    "// Constants: INVALID, c0, c1, c2
    if (typeof input !== "object" || input === null || Array.isArray(input)) return INVALID;
    const v0 = input["a"];
    if (!("a" in input)) return INVALID;
    const v1 = c1(c0, v0);
    if (v1 === INVALID) return INVALID;
    const v2 = input["b"];
    if (!("b" in input)) return INVALID;
    const v3 = c1(c2, v2);
    if (v3 === INVALID) return INVALID;
    const v4 = input["tail"];
    if (typeof v4 !== "string") return INVALID;
    const v5 = { "a": v1, "b": v3, "tail": v4 };
    return v5;"
  `);
  expectMatch(schema, { a: "1", b: null, tail: "x" });
  expectMatch(schema, { a: "nope", b: null, tail: "x" });
});

test("url string-format check never assigns to its accessor", () => {
  // const accessor (array element): previously emitted `elem = normalized`,
  // a TypeError on valid input.
  const arr = compile(Schema.array(Schema.string().url()));
  expect(valid(arr, ["https://example.com"])).toEqual(["https://example.com"]);
  invalid(arr, ["not a url"]);

  // property accessor: previously wrote the normalized value back into the caller's input object.
  const padded = " https://example.com ";
  const input = { u: padded };
  expectMatch(Schema.object({ u: Schema.string().url() }), input);
  expect(input.u).toBe(padded);
});

test("lazy schemas with checked or defaulted descendants parse without crashing", () => {
  // Inner runtime run must receive a ctx — checks read ctx.skipChecks, default/transform read ctx.direction.
  const aot = compile(Schema.lazy(() => Schema.string().min(2)));
  expect(valid(aot, "abc")).toEqual("abc");
  invalid(aot, "a");

  // Recursive, so the fast path declines it; the runtime still parses it.
  const tree: Schema.SchemaType = Schema.lazy(() => Schema.object({ v: Schema.number().int(), kids: Schema.array(tree).default([]) }));
  expect(() => compile(tree, { strict: true })).toThrow(SchemaCompileUnsupportedError);
  expect(valid(tree, { v: 1, kids: [{ v: 2 }] })).toEqual({ v: 1, kids: [{ v: 2, kids: [] }] });
  invalid(tree, { v: 1.5 });
});

test("sync refine returning a Promise rejects like the runtime", () => {
  const schema = Schema.string().refine((() => Promise.resolve(true)) as unknown as (v: string) => boolean);
  const aot = compile(schema);
  let runtimeErr: string | undefined;
  let compiledErr: string | undefined;
  try {
    Schema.parse("x");
  } catch (e) {
    runtimeErr = (e as Error).name;
  }
  try {
    aot.parse("x");
  } catch (e) {
    compiledErr = (e as Error).name;
  }
  expect(runtimeErr).toBeDefined();
  expect(compiledErr).toBe(runtimeErr);
});

test("literal-union Set optimization respects checks and multi-value literals", () => {
  const withCheck = Schema.union([Schema.literal("a").refine(() => false), Schema.literal("b")]);
  expectMatch(withCheck, "a"); // runtime rejects via refine; compiled must too
  expectMatch(withCheck, "b");

  const multi = Schema.union([Schema.literal(["a", "b"]), Schema.literal("c")]);
  for (const v of ["a", "b", "c", "d"]) expectMatch(multi, v);
});

test("xor and custom when-gated checks force runtime fallback", () => {
  expect(() => compile(Schema.xor([Schema.string(), Schema.number()]), { strict: true })).toThrow(SchemaCompileUnsupportedError);
  // Multi-match must reject — verified through the object island.
  expectMatch(Schema.object({ v: Schema.xor([Schema.number(), Schema.number().int()]) }), { v: 2 });
  expectMatch(Schema.object({ v: Schema.xor([Schema.number(), Schema.number().int()]) }), { v: 1.5 });

  const gated = Schema.number().gt(5);
  (gated._schema.def.checks![0]!._schema.def as { when?: unknown }).when = () => false;
  expect(() => compile(gated, { strict: true })).toThrow(SchemaCompileUnsupportedError);
  expectMatch(Schema.object({ n: gated }), { n: 3 }); // runtime skips the gated check
});

test("compiled parse surfaces the interpreter's throws through the fallback", () => {
  // an unmergeable intersection bails to INVALID, and the fallback it hands to raises the interpreter's own error
  const unmergeable = compile(
    Schema.intersection(
      Schema.number(),
      Schema.number().transform((x) => x + 1)
    ),
    { strict: true }
  );
  expect(() => unmergeable.parse(1234)).toThrowErrorMatchingInlineSnapshot(
    `[Error: Unmergable intersection. Error path: []]`
  );

  // a when-gated check islands at codegen, and the island's INVALID for an async run reaches the same fallback
  const gated = Schema.number().refine(() => Promise.resolve(true));
  (gated._schema.def.checks![0]!._schema.def as { when?: unknown }).when = () => true;
  const compiled = compile(Schema.object({ n: gated }), { strict: true });
  expect(() => compiled.parse({ n: 3 })).toThrow($SchemaAsyncError);
});

test("strict objects reject inherited enumerable keys like the runtime", () => {
  const schema = Schema.strictObject({ a: Schema.string() });
  expectMatch(schema, Object.assign(Object.create({ extra: 1 }), { a: "x" }));
  expectMatch(schema, { a: "x" });
  // Own __proto__ keys are skipped by the runtime, not unrecognized.
  expectMatch(schema, JSON.parse('{"a":"x","__proto__":{"polluted":true}}'));

  const withOptional = Schema.strictObject({ a: Schema.string(), b: Schema.string().optional() });
  expectMatch(withOptional, Object.assign(Object.create({ extra: 1 }), { a: "x" }));
  expectMatch(withOptional, JSON.parse('{"a":"x","__proto__":{}}'));
});

test("object output parity: key order, undefined keys, inherited keys, getters", () => {
  // Loose object: shape keys precede unknown keys in the output.
  const loose = Schema.looseObject({ a: Schema.string() });
  const looseIn = { x: 1, a: "q", y: 2 };
  expect(Object.keys(compile(loose).parse(looseIn) as object)).toEqual(Object.keys(loose.parse(looseIn)));

  const cat = Schema.object({ a: Schema.string() }).catchall(Schema.number());
  const catIn = { x: 1, a: "q" };
  expect(Object.keys(compile(cat).parse(catIn) as object)).toEqual(Object.keys(cat.parse(catIn)));

  // optin-optional/optout-required prop: absent key omitted, explicit undefined preserved (runtime handlePropertyResult rule).
  const tf = Schema.object({
    a: z
      .string()
      .optional()
      .transform((v) => v),
  });
  expect("a" in (compile(tf).parse({}) as object)).toBe(false);
  expect("a" in tf.parse({})).toBe(false);
  const opt = Schema.object({ a: Schema.string().optional() });
  expect(Object.keys(compile(opt).parse({ a: undefined }) as object)).toEqual(["a"]);

  // Empty-shape loose: inherited enumerable keys included, own __proto__ dropped.
  const empty = Schema.looseObject({});
  const inherited = Object.assign(Object.create({ extra: 1 }), { own: 2 });
  expect(compile(empty).parse(inherited)).toEqual({ own: 2, extra: 1 });
  expect(empty.parse(inherited)).toEqual({ own: 2, extra: 1 });
  const protoIn = JSON.parse('{"__proto__":{"polluted":1},"x":2}');
  expect(Object.keys(compile(empty).parse(protoIn) as object)).toEqual(Object.keys(empty.parse(protoIn)));

  // Getters are read exactly once, like the runtime.
  let reads = 0;
  const getterIn = {
    get a() {
      reads++;
      return "v";
    },
  };
  expect(compile(Schema.object({ a: Schema.string().min(1) })).parse(getterIn)).toEqual({ a: "v" });
  expect(reads).toBe(1);
});

// === Error taxonomy ===

test("unsupported features throw SchemaCompileUnsupportedError, not raw errors", () => {
  // __proto__ shape key: output object literal would set the prototype.
  expect(() => compile(Schema.object({ ["__proto__"]: Schema.string() }), { strict: true })).toThrow(SchemaCompileUnsupportedError);
  // Exclusive unions need every branch's failure to be a real runtime failure.
  expect(() => compile(Schema.xor([Schema.object({ a: Schema.string() }), Schema.object({ b: Schema.string() })]), { strict: true })).toThrow(
    SchemaCompileUnsupportedError
  );
  // NaN comparison bounds can't compile to a faithful comparison.
  expect(() => compile(Schema.number().gt(Number.NaN), { strict: true })).toThrow(SchemaCompileUnsupportedError);
  // A zero bigint divisor has no compiled form: `x % 0n` throws.
  expect(() => compile(Schema.bigint().multipleOf(BigInt(0)), { strict: true })).toThrow(SchemaCompileUnsupportedError);
  // Unsupported children still island inside containers.
  const aot = compile(Schema.object({ a: Schema.string(), x: Schema.xor([Schema.literal("p"), Schema.literal("q")]) }));
  expect(valid(aot, { a: "x", x: "p" })).toEqual({ a: "x", x: "p" });
  invalid(aot, { a: "x", x: "z" });
});

test("record key schemas compile: formats, checks, numbers, transforms", () => {
  // A string format lives on the def rather than in `checks`, so an email key schema reads as a bare `Schema.string()` unless the key path looks for it.
  for (const [schema, inputs] of [
    [Schema.record(Schema.email(), Schema.number()), [{ "a@b.com": 1 }, { nope: 1 }, {}]],
    [Schema.record(Schema.string().min(2), Schema.number()), [{ ab: 1 }, { a: 1 }]],
    [Schema.record(Schema.string().regex(/^k_/), Schema.number()), [{ k_a: 1 }, { x: 1 }]],
    // Numeric keys arrive stringified; the runtime retries them as numbers.
    [Schema.record(Schema.number(), Schema.string()), [{ 1: "a" }, { "1.5": "a" }, { x: "a" }]],
    [Schema.record(Schema.templateLiteral(["id_", Schema.string()]), Schema.number()), [{ id_a: 1 }, { b: 1 }]],
    // The key schema picks the output key, not the input key.
    [
      Schema.record(
        z
          .string()
          .min(1)
          .overwrite((s: string) => s.toUpperCase()),
        Schema.number()
      ),
      [{ ab: 1 }, { "": 1 }],
    ],
  ] as [Schema.SchemaType, unknown[]][]) {
    for (const input of inputs) expectMatch(schema, input);
  }

  // Own __proto__ is skipped rather than validated, matching the runtime.
  expectMatch(Schema.record(Schema.email(), Schema.number()), JSON.parse('{"__proto__":{"p":1},"a@b.com":1}'));

  // Coercion is modelled nowhere, so a coercing key schema is refused outright rather than compiled to the bare type test it would otherwise become.
  expect(() => compile(Schema.record(Schema.coerce.string(), Schema.number()), { strict: true })).toThrow(SchemaCompileUnsupportedError);

  // A loose record keeps a rejected key verbatim, copying its value across unvalidated instead of failing.
  for (const input of [{ "a@b.com": 1 }, { nope: 1 }, { "a@b.com": 1, nope: "raw" }, { "a@b.com": "bad" }]) {
    expectMatch(Schema.looseRecord(Schema.email(), Schema.number()), input);
  }
});

test("date min/max bounds compile with runtime parity", () => {
  const schema = Schema.date().min(new Date("2024-01-01")).max(new Date("2025-01-01"));
  const aot = compile(schema);
  const inputs = [new Date("2024-06-15"), new Date("2024-01-01"), new Date("2023-12-31"), new Date("2025-01-02")];
  for (const input of inputs) expectMatch(schema, input);
  expect(valid(aot, inputs[0])).toEqual(inputs[0]);
  invalid(aot, inputs[2]);
});

test("the compiled fallback builds the same Error-shaped error as the runtime", () => {
  const schema = Schema.object({ a: Schema.string(), b: Schema.number() });
  const aot = compile(schema);

  // both fast closures fall back to the runtime on rejection, so the error is the runtime's
  const err = aot.safeParse({ a: 1, b: "x" }).error!;
  expect(err).toBeInstanceOf(Error);
  expect(err).toBeInstanceOf(Schema.core.$SchemaError);
  expect(err.issues).toEqual(Schema.safeParse({ a: 1, b: "x" }).error!.issues);

  function callSite() {
    aot.parse({ a: 1, b: "x" });
  }

  let thrown: unknown;
  try {
    callSite();
  } catch (err) {
    thrown = err;
  }
  expect(thrown).toBeInstanceOf(Error);
  expect((thrown as Error).stack).toContain("callSite");
});

// === Never throws ===

// Snapshot a parse outcome structurally, so a refused compile can be shown not to have disturbed it.
function snap(schema: Schema.SchemaType, value: unknown) {
  const r = Schema.safeParse(value);
  return r.success ? { ok: true, data: r.data } : { ok: false, issues: r.error.issues };
}

// Every shape the compiler refuses, with inputs that exercise the pass, fail and fallback branches of each.
function refusedCases(): [string, Schema.SchemaType, unknown[]][] {
  const gated = Schema.number().gt(5);
  (gated._schema.def.checks![0]!._schema.def as { when?: unknown }).when = () => false;
  const tree: Schema.SchemaType = Schema.lazy(() => Schema.object({ v: Schema.number().int(), kids: Schema.array(tree).default([]) }));

  return [
    ["cycle", tree, [{ v: 1, kids: [{ v: 2 }] }, { v: 1.5 }, "nope"]],
    ["async refine", Schema.string().refine(async () => true), ["a", 1]],
    ["async transform", Schema.string().transform(async (s) => s.length), ["a", 1]],
    ["async custom", Schema.custom(async () => true), ["a"]],
    ["xor", Schema.xor([Schema.string(), Schema.number()]), ["a", 1, true]],
    ["coerce", Schema.coerce.number(), ["5", 5, Symbol("x")]],
    ["catch callback", Schema.catch(Schema.string().min(5), (c) => `bad:${c.error.issues.length}`), ["hello world", "hi", 42]],
    ["when-gated check", gated, [3, 9, "x"]],
    ["__proto__ key", Schema.object({ ["__proto__"]: Schema.string() }), [{}, { a: 1 }]],
    ["NaN bound", Schema.number().gt(Number.NaN), [1, "x"]],
    ["zero bigint divisor", Schema.bigint().multipleOf(BigInt(0)), [BigInt(4), "x"]],
    ["coercing record key", Schema.record(Schema.coerce.string(), Schema.number()), [{ a: 1 }, { a: "x" }]],
  ];
}

test("compile hands back the original schema instead of throwing", () => {
  for (const [name, schema] of refusedCases()) {
    expect(() => compile(schema, { strict: true }), name).toThrow();
    // No wrapper and no clone: the uncompilable schema is its own fallback, exactly as global mode leaves it.
    expect(compile(schema), name).toBe(schema);
  }
});

test("a refused compile leaves the schema parsing identically", () => {
  for (const [name, schema, inputs] of refusedCases()) {
    // Async schemas throw $SchemaAsyncError out of a sync parse; that path is covered separately.
    if (name.startsWith("async")) continue;
    const before = inputs.map((i) => snap(schema, i));
    compile(schema);
    expect(
      inputs.map((i) => snap(schema, i)),
      name
    ).toEqual(before);
  }
});

test("a refused compile keeps cyclic input parsing", () => {
  const nodeSchema: Schema.SchemaType = Schema.object({ value: Schema.string(), next: Schema.lazy(() => nodeSchema).optional() });
  const cyclic: any = { value: "a" };
  cyclic.next = cyclic;
  expect(() => compile(nodeSchema).parse(cyclic)).not.toThrow();
});

test("a refused async compile parses async and rejects sync like the runtime", async () => {
  const schema = Schema.string().refine(async (s) => s.length > 1);
  const aot = compile(schema);
  expect(aot).toBe(schema);

  await expect(aot.parseAsync("ab")).resolves.toBe("ab");
  const bad = await aot.safeParseAsync("a");
  expect(bad.success).toBe(false);
  expect(bad.error!.issues).toEqual((await Schema.safeParseAsync("a")).error!.issues);
  expect(() => aot.parse("ab")).toThrow(Schema.core.$SchemaAsyncError);
});

test("strict is per-call, so a supported schema compiles either way", () => {
  const schema = Schema.object({ a: Schema.string(), b: Schema.number() });
  for (const aot of [compile(schema), compile(schema, { strict: true }), compile(schema, { strict: false })]) {
    expect(aot).not.toBe(schema);
    expect(valid(aot, { a: "x", b: 1 })).toEqual({ a: "x", b: 1 });
    invalid(aot, { a: 1, b: 1 });
  }
});

test("compiled records walk own enumerable keys without Reflect.ownKeys", () => {
  // a getOwnPropertyNames snapshot plus a per-key recheck sees the same keys as the runtime's Reflect.ownKeys walk: inherited enumerables are skipped, symbols fail a string key schema but pass a symbol one, and the numeric-string retry still applies
  const sym = Symbol("s");
  const bare = compile(Schema.record(Schema.string(), Schema.number()));
  const inherited = Object.assign(Object.create({ proto: 1 }), { a: 1 });
  expect(bare.parse(inherited)).toEqual({ a: 1 });
  const symbolic = { a: 1, [sym]: 2 };
  expect(bare.safeParse(symbolic).error!.issues).toEqual(
    Schema.record(Schema.string(), Schema.number()).safeParse(symbolic).error!.issues
  );
  expect(bare.safeParse({ a: 1, b: "x" }).error!.issues).toEqual(
    Schema.record(Schema.string(), Schema.number()).safeParse({ a: 1, b: "x" }).error!.issues
  );
  const symKeys = compile(Schema.record(Schema.symbol(), Schema.number()));
  expect(symKeys.parse({ [sym]: 2 })).toEqual({ [sym]: 2 });
  expect(symKeys.safeParse({ a: 1 }).success).toBe(false);
  const emailKeys = compile(Schema.record(Schema.email(), Schema.number()));
  expect(emailKeys.parse({ "a@b.co": 1 })).toEqual({ "a@b.co": 1 });
  expect(emailKeys.safeParse({ "a@b.co": 1, [sym]: 2 }).success).toBe(false);
  expect(compile(Schema.record(Schema.number(), Schema.string())).parse({ 1: "a" })).toEqual({ 1: "a" });
  // keys are snapshotted before any value is read and rechecked when visited, like the runtime's Reflect.ownKeys walk: a getter that adds a key mid-walk is not visited, one that hides a later key skips it
  const mutating = (effect: (o: Record<PropertyKey, unknown>) => void) => {
    const o: Record<PropertyKey, unknown> = {};
    Object.defineProperty(o, "a", {
      enumerable: true,
      get() {
        effect(o);
        return 1;
      },
    });
    o.b = 2;
    return o;
  };
  const both = Schema.record(Schema.union([Schema.string(), Schema.symbol()]), Schema.number());
  for (const [schema, effect] of [
    [
      both,
      (o: Record<PropertyKey, unknown>) => {
        o[sym] = 2;
      },
    ],
    [
      Schema.record(Schema.string(), Schema.number()),
      (o: Record<PropertyKey, unknown>) => {
        o[sym] = "bad";
      },
    ],
    [
      Schema.record(Schema.string(), Schema.number()),
      (o: Record<PropertyKey, unknown>) => {
        o.z = "bad";
      },
    ],
    [
      Schema.record(Schema.string(), Schema.number()),
      (o: Record<PropertyKey, unknown>) => Object.defineProperty(o, "b", { enumerable: false }),
    ],
  ] as const) {
    const expected = Schema.safeParse(mutating(effect));
    const actual = compile(schema).safeParse(mutating(effect));
    expect(actual.success).toBe(expected.success);
    if (expected.success)
      expect(Reflect.ownKeys(actual.data as object)).toEqual(Reflect.ownKeys(expected.data as object));
    else expect(actual.error!.issues).toEqual(expected.error!.issues);
  }
  // a getter that defines an own key under an inherited enumerable name mid-walk: the snapshot predates it, so neither walk visits it, and a union that accepts the record cannot be corrected by a fallback
  const shadowing = () => {
    const o = Object.create({ Schema: 0 });
    Object.defineProperty(o, "a", {
      enumerable: true,
      get() {
        Object.defineProperty(o, "z", { value: 2, enumerable: true });
        return 1;
      },
    });
    return o;
  };
  const inUnion = Schema.union([Schema.record(Schema.string(), Schema.number()), Schema.any()]);
  expect(compile(inUnion).parse(shadowing())).toStrictEqual(inUnion.parse(shadowing()));
  expect(compile(inUnion).parse(shadowing())).toStrictEqual({ a: 1 });
  // a key that is non-enumerable at snapshot time and revealed by an earlier getter is in the snapshot and passes the recheck, like the runtime
  const revealing = () => {
    const o: Record<string, unknown> = {};
    Object.defineProperty(o, "a", {
      enumerable: true,
      get() {
        Object.defineProperty(o, "b", { enumerable: true });
        return 1;
      },
    });
    Object.defineProperty(o, "b", { value: 2, enumerable: false, configurable: true });
    return o;
  };
  const plain = Schema.record(Schema.string(), Schema.number());
  expect(compile(plain).parse(revealing())).toStrictEqual(plain.parse(revealing()));
  expect(compile(plain).parse(revealing())).toStrictEqual({ a: 1, b: 2 });
});

test("validate honors custom checks composed with format traits", () => {
  const postProcessor = Schema.core.globalConfig.postProcessor;
  Schema.core.globalConfig.postProcessor = undefined;
  try {
    const CustomEmail = Schema.core.$constructor<Schema.core.$SchemaEmail>("CustomEmail", (inst, def) => {
      inst._schema.check = (payload) => {
        if (payload.value !== "custom") payload.issues.push({ code: "custom", input: payload.value });
      };
      Schema.core.$SchemaEmail.init(inst, def);
    });
    const schema = new CustomEmail({ type: "string", format: "email", check: "string_format" });
    for (const [input, valid] of [
      ["custom", true],
      ["test@example.com", false],
      [42, false],
    ] as const) {
      expect(Schema.safeParse(schema, input).success).toBe(valid);
      expect(Schema.validate(schema, input)).toBe(valid);
    }
  } finally {
    Schema.core.globalConfig.postProcessor = postProcessor;
  }
});

test("validate honors standalone format checks", () => {
  const cases = [
    [Schema.iso.datetime(), "2021-01-01T00:00:00Z"],
    [Schema.iso.date(), "2021-01-01"],
    [Schema.iso.time(), "00:00:00"],
    [Schema.iso.duration(), "P1Y2M3DT4H5M6S"],
    [Schema.email(), "test@example.com"],
    [Schema.uuid(), "20354d7a-e4fe-47af-8ff6-187bca92f3f9"],
    [Schema.ipv4(), "192.168.0.1"],
  ] as const;

  for (const [schema, valid] of cases) {
    expect(Schema._schema.traits.has("$SchemaStringFormat")).toBe(true);
    expect(schema instanceof Schema.core.$SchemaStringFormat).toBe(true);
    expect(Schema.validate(schema, valid)).toBe(true);
    expect(Schema.validate(schema, "invalid")).toBe(false);
    expect(Schema.validate(schema, 1)).toBe(false);
  }

  const source = Schema.email();
  const refined = source.refine((value) => value.startsWith("x"));
  const asyncRefined = source.refine(async () => true);
  const coercedDef = Object.assign(Object.create({ coerce: true }), source._schema.def);
  const coerced = source.clone(coercedDef);
  const checkedDef = Object.assign(Object.create({ checks: refined._schema.def.checks }), source._schema.def);
  const inheritedChecked = source.clone(checkedDef);
  expect(Schema.validate(refined, "test@example.com")).toBe(false);
  expect(Schema.validate(refined, "x@example.com")).toBe(true);
  expect(Schema.validate(inheritedChecked, "test@example.com")).toBe(false);
  expect(() => Schema.validate(asyncRefined, "test@example.com")).toThrow($SchemaAsyncError);
  expect(Schema.validate(coerced, { toString: () => "test@example.com" })).toBe(true);
});

test("runtime validate preserves contexts, getters, errors, and regex state", () => {
  const postProcessor = Schema.core.globalConfig.postProcessor;
  Schema.core.globalConfig.postProcessor = undefined;
  try {
    const source = Schema.email();
    expect(Schema.validate(source, "invalid", { skipChecks: true } as any)).toBe(true);

    let whenReads = 0;
    const whenProto = Object.defineProperty({}, "when", {
      enumerable: true,
      get() {
        whenReads++;
        return () => false;
      },
    });
    const whenDef = Object.assign(Object.create(whenProto), source._schema.def);
    const gated = source.clone(whenDef as typeof source._schema.def);
    expect(whenReads).toBe(0);
    expect(Schema.validate(gated, "invalid")).toBe(true);
    expect(whenReads).toBeGreaterThan(0);

    let errorReads = 0;
    const errorDef = Object.defineProperties({}, Object.getOwnPropertyDescriptors(source._schema.def));
    Object.defineProperty(errorDef, "error", {
      enumerable: true,
      get() {
        errorReads++;
        return () => "custom";
      },
    });
    const customError = source.clone(errorDef as typeof source._schema.def);
    expect(Schema.validate(customError, "invalid")).toBe(false);
    expect(errorReads).toBe(0);
    const result = customError.safeParse("invalid");
    expect(errorReads).toBe(0);
    if (result.success) expect.unreachable();
    expect(result.error.issues[0]?.message).toBe("custom");
    expect(errorReads).toBeGreaterThan(0);

    const pattern = /^a$/g;
    const cloned = source.clone({ ...source._schema.def, pattern });
    for (let i = 0; i < 3; i++) expect(Schema.validate(cloned, "a")).toBe(true);
    expect(Schema.validate(cloned, "b")).toBe(false);
    expect(pattern.lastIndex).toBe(0);
    const replacement = /^b$/g;
    cloned._schema.def.pattern = replacement;
    expect(Schema.validate(cloned, "a")).toBe(false);
    expect(Schema.validate(cloned, "b")).toBe(true);
  } finally {
    Schema.core.globalConfig.postProcessor = postProcessor;
  }
});

test("validate preserves live pattern accessor reads", () => {
  const postProcessor = Schema.core.globalConfig.postProcessor;
  Schema.core.globalConfig.postProcessor = undefined;
  try {
    const schema = Schema.email();
    let reads = 0;
    Object.defineProperty(Schema.def, "pattern", {
      get: () => (++reads % 2 === 1 ? /^a$/ : /^b$/),
    });
    expect(Schema.safeParse("b").success).toBe(true);
    expect(reads).toBe(2);
    reads = 0;
    expect(Schema.validate(schema, "b")).toBe(true);
    expect(reads).toBe(2);
  } finally {
    Schema.core.globalConfig.postProcessor = postProcessor;
  }
});

test.each(["when", "coerce"] as const)("runtime validate honors live %s options", (option) => {
  const postProcessor = Schema.core.globalConfig.postProcessor;
  Schema.core.globalConfig.postProcessor = undefined;
  try {
    for (const inherited of [false, true]) {
      const schema = Schema.email();
      const input = option === "when" ? "invalid" : { toString: () => "test@example.com" };
      expect(Schema.validate(schema, input)).toBe(false);

      const target = inherited ? Object.create(Object.getPrototypeOf(Schema.def)) : Schema.def;
      let reads = 0;
      Object.defineProperty(target, option, {
        get() {
          reads++;
          return option === "when" ? () => false : true;
        },
      });
      if (inherited) Object.setPrototypeOf(Schema.def, target);
      expect(reads).toBe(0);
      expect(Schema.validate(schema, input)).toBe(true);
      expect(reads).toBeGreaterThan(0);
      expect(Schema.safeParse(input).success).toBe(true);
    }
  } finally {
    Schema.core.globalConfig.postProcessor = postProcessor;
  }
});

test("validate uses compiled validators and runtime fallbacks", () => {
  const compiled = compile(Schema.email());
  expect((compiled._schema.bag as { validator?: unknown }).validator).toBeTypeOf("function");
  expect(Schema.validate(compiled, "test@example.com")).toBe(true);
  expect(Schema.validate(compiled, "invalid")).toBe(false);
  expect(Schema.validate(compiled, "invalid", { skipChecks: true } as any)).toBe(true);

  const source = Schema.email();
  const installed = withParser(source, () => INVALID);
  const bag = installed._schema.bag as { fallbackRun: typeof source._schema.run };
  const originalRun = bag.fallbackRun;
  let fallbackRuns = 0;
  bag.fallbackRun = (payload, ctx) => {
    fallbackRuns++;
    return originalRun(payload, ctx);
  };
  expect(Schema.validate(installed, "invalid")).toBe(false);
  expect(fallbackRuns).toBeGreaterThan(0);
});

// withParser: a parser Schema did not generate, installed on the same wrapper compile() uses.

// tags its output so a test fails loudly if the runtime ran instead of the supplied parser
function taggedParser(input: unknown) {
  if (typeof input !== "object" || input === null) return INVALID;
  const o = input as Record<string, unknown>;
  if (typeof o.a !== "string") return INVALID;
  return { a: o.a, tag: "supplied" };
}

const withParserSchema = Schema.object({ a: Schema.string() });

test("withParser installs the supplied parser", () => {
  const installed = withParser(withParserSchema, taggedParser);
  expect(installed.parse({ a: "x" })).toStrictEqual({ a: "x", tag: "supplied" });
  // the clone is a new schema; the original keeps the runtime
  expect(installed).not.toBe(withParserSchema);
  expect(withParserSchema.parse({ a: "x" })).toStrictEqual({ a: "x" });
});

test("withParser hands INVALID to the runtime and gets a real SchemaError", () => {
  const installed = withParser(withParserSchema, taggedParser);
  const result = installed.safeParse({ a: 1 });
  expect(result.success).toBe(false);
  expect(result.error!.issues).toEqual(withParserSchema.safeParse({ a: 1 }).error!.issues);
});

test("withParser answers validate with the supplied parser", () => {
  const installed = withParser(withParserSchema, taggedParser);
  expect(Schema.validate(installed, { a: "x" })).toBe(true);
  expect(Schema.validate(installed, { a: 1 })).toBe(false);
});

test("withParser bypasses the fast path on async, like compile()", async () => {
  const installed = withParser(withParserSchema, taggedParser);
  // async runs on the runtime, so the tag is absent
  await expect(installed.parseAsync({ a: "x" })).resolves.toStrictEqual({ a: "x" });
});

test("withParser reaches a parse it does not own the call site of", () => {
  const installed = withParser(withParserSchema, taggedParser);
  // installing on _schema.run rather than wrapping a call site is the whole point: a framework holding the schema gets the supplied parser through Standard Schema, and so does Schema.parse
  expect((installed["~standard"].validate({ a: "x" }) as { value: unknown }).value).toStrictEqual({
    a: "x",
    tag: "supplied",
  });
  expect(Schema.parse(installed, { a: "x" })).toStrictEqual({ a: "x", tag: "supplied" });
});

test("withParser refuses a recursive schema", () => {
  type Node = { next: Node | null };
  const Node: Schema.SchemaType<Node> = Schema.object({ next: Schema.lazy(() => Schema.nullable(Node)) });
  expect(() => withParser(Node, () => INVALID)).toThrow(SchemaCompileUnsupportedError);
});

test("withParser leaves encode on the runtime", () => {
  const codec = Schema.codec(Schema.string(), Schema.number(), {
    decode: (s) => Number(s),
    encode: (n) => String(n),
  });
  const installed = withParser(codec, () => INVALID);
  expect(Schema.encode(installed, 5)).toBe("5");
});

test("withParser rejects a parser whose output contradicts the schema", () => {
  // the returned schema still claims T, so a parser that succeeds with something else would make parse() lie about its own type
  // @ts-expect-error a number is not the output of Schema.string()
  withParser(Schema.string(), () => 123);
  expectTypeOf(withParser(Schema.string(), () => "ok")).toEqualTypeOf<Schema.SchemaString>();
});
