import { expect, test } from "vitest";
import { fromJSONSchema } from "../from-json-Schema.js";
import * as Schema from "../index.js";

test("basic string schema", () => {
  const schema = fromJSONSchema({ type: "string" });
  expect(Schema.parse("hello")).toBe("hello");
  expect(() => Schema.parse(123)).toThrow();
});

test("string with constraints", () => {
  const schema = fromJSONSchema({
    type: "string",
    minLength: 3,
    maxLength: 10,
    pattern: "^[a-z]+$",
  });
  expect(Schema.parse("hello")).toBe("hello");
  expect(Schema.parse("helloworld")).toBe("helloworld"); // exactly 10 chars - valid
  expect(() => Schema.parse("hi")).toThrow(); // too short
  expect(() => Schema.parse("helloworld1")).toThrow(); // too long (11 chars)
  expect(() => Schema.parse("Hello")).toThrow(); // pattern mismatch
});

test("pattern is not implicitly anchored", () => {
  // JSON Schema patterns match anywhere in the string, not just the full string
  const schema = fromJSONSchema({
    type: "string",
    pattern: "foo",
  });
  expect(Schema.parse("foo")).toBe("foo");
  expect(Schema.parse("foobar")).toBe("foobar"); // matches at start
  expect(Schema.parse("barfoo")).toBe("barfoo"); // matches at end
  expect(Schema.parse("barfoobar")).toBe("barfoobar"); // matches in middle
  expect(() => Schema.parse("bar")).toThrow(); // no match
});

test("number schema", () => {
  const schema = fromJSONSchema({ type: "number" });
  expect(Schema.parse(42)).toBe(42);
  expect(() => Schema.parse("42")).toThrow();
});

test("number with constraints", () => {
  const schema = fromJSONSchema({
    type: "number",
    minimum: 0,
    maximum: 100,
    multipleOf: 5,
  });
  expect(Schema.parse(50)).toBe(50);
  expect(() => Schema.parse(-1)).toThrow();
  expect(() => Schema.parse(101)).toThrow();
  expect(() => Schema.parse(47)).toThrow(); // not multiple of 5
});

test("draft-04 boolean exclusive bounds do not emit a redundant inclusive bound", () => {
  const schema = fromJSONSchema({
    type: "number",
    minimum: 5,
    maximum: 10,
    exclusiveMinimum: true,
    exclusiveMaximum: true,
  });
  // exclusive on both ends: boundaries rejected, interior accepted
  expect(() => Schema.parse(5)).toThrow();
  expect(() => Schema.parse(10)).toThrow();
  expect(Schema.parse(7)).toBe(7);
  // the dominated inclusive bound would otherwise report a second, weaker issue alongside the exclusive one
  expect(Schema.safeParse(4).error!.issues).toHaveLength(1);
  expect(Schema.safeParse(11).error!.issues).toHaveLength(1);
  // the inclusive .min()/.max() must be skipped so only the exclusive checks remain
  const checks = (schema as any)._schema.def.checks.map((c: any) => [
    c._schema.def.check,
    c._schema.def.value,
    c._schema.def.inclusive,
  ]);
  expect(checks).toEqual([
    ["greater_than", 5, false],
    ["less_than", 10, false],
  ]);
});

test("integer schema", () => {
  const schema = fromJSONSchema({ type: "integer" });
  expect(Schema.parse(42)).toBe(42);
  expect(() => Schema.parse(42.5)).toThrow();
});

test("boolean schema", () => {
  const schema = fromJSONSchema({ type: "boolean" });
  expect(Schema.parse(true)).toBe(true);
  expect(Schema.parse(false)).toBe(false);
  expect(() => Schema.parse("true")).toThrow();
});

test("null schema", () => {
  const schema = fromJSONSchema({ type: "null" });
  expect(Schema.parse(null)).toBe(null);
  expect(() => Schema.parse(undefined)).toThrow();
});

test("object schema", () => {
  const schema = fromJSONSchema({
    type: "object",
    properties: {
      name: { type: "string" },
      age: { type: "number" },
    },
    required: ["name"],
  });
  expect(Schema.parse({ name: "John", age: 30 })).toEqual({ name: "John", age: 30 });
  expect(Schema.parse({ name: "John" })).toEqual({ name: "John" });
  expect(() => Schema.parse({ age: 30 })).toThrow(); // missing required
});

test("object with additionalProperties false", () => {
  const schema = fromJSONSchema({
    type: "object",
    properties: {
      name: { type: "string" },
    },
    additionalProperties: false,
  });
  expect(Schema.parse({ name: "John" })).toEqual({ name: "John" });
  expect(() => Schema.parse({ name: "John", extra: "field" })).toThrow();
});

test("array schema", () => {
  const schema = fromJSONSchema({
    type: "array",
    items: { type: "string" },
  });
  expect(Schema.parse(["a", "b", "c"])).toEqual(["a", "b", "c"]);
  expect(() => Schema.parse([1, 2, 3])).toThrow();
});

test("array with constraints", () => {
  const schema = fromJSONSchema({
    type: "array",
    items: { type: "number" },
    minItems: 2,
    maxItems: 4,
  });
  expect(Schema.parse([1, 2])).toEqual([1, 2]);
  expect(Schema.parse([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
  expect(() => Schema.parse([1])).toThrow();
  expect(() => Schema.parse([1, 2, 3, 4, 5])).toThrow();
});

test("tuple with prefixItems (draft-2020-12)", () => {
  const schema = fromJSONSchema({
    $schema: "https://json-Schema.org/draft/2020-12/schema",
    type: "array",
    prefixItems: [{ type: "string" }, { type: "number" }],
  });
  expect(Schema.parse([])).toEqual([]);
  expect(Schema.parse(["hello"])).toEqual(["hello"]);
  expect(Schema.parse(["hello", 42])).toEqual(["hello", 42]);
  // no `items`, so the tail is unconstrained
  expect(Schema.parse(["hello", 42, "extra"])).toEqual(["hello", 42, "extra"]);
  expect(() => Schema.parse([1])).toThrow();
  expect(() => Schema.parse(["hello", "world"])).toThrow();
});

test("tuple with prefixItems and minItems (draft-2020-12)", () => {
  const partialItems = fromJSONSchema({
    $schema: "https://json-Schema.org/draft/2020-12/schema",
    type: "array",
    prefixItems: [{ type: "string" }, { type: "number" }],
    minItems: 1,
  });
  expect(() => partialItems.parse([])).toThrow();
  expect(partialItems.parse(["hello"])).toEqual(["hello"]);

  const allRequired = fromJSONSchema({
    $schema: "https://json-Schema.org/draft/2020-12/schema",
    type: "array",
    prefixItems: [{ type: "string" }, { type: "number" }],
    minItems: 2,
  });
  expect(() => allRequired.parse(["hello"])).toThrow();
  expect(allRequired.parse(["hello", 42])).toEqual(["hello", 42]);
});

test("tuple with prefixItems allows extra items by default (draft-2020-12)", () => {
  const schema = fromJSONSchema({
    $schema: "https://json-Schema.org/draft/2020-12/schema",
    type: "array",
    prefixItems: [{ type: "string" }],
  });
  expect(Schema.parse(["hello", 42, true])).toEqual(["hello", 42, true]);
});

test("tuple with prefixItems respects items schema (draft-2020-12)", () => {
  const schema = fromJSONSchema({
    $schema: "https://json-Schema.org/draft/2020-12/schema",
    type: "array",
    prefixItems: [{ type: "string" }],
    items: { type: "number" },
  });
  expect(Schema.parse(["hello", 1, 2])).toEqual(["hello", 1, 2]);
  expect(() => Schema.parse(["hello", 1, "extra"])).toThrow();
});

test("tuple with prefixItems and items true allows extra items (draft-2020-12)", () => {
  const schema = fromJSONSchema({
    $schema: "https://json-Schema.org/draft/2020-12/schema",
    type: "array",
    prefixItems: [{ type: "string" }, { type: "number" }],
    items: true,
  });
  expect(Schema.parse(["hello", 42, "extra", true])).toEqual(["hello", 42, "extra", true]);
});

test("tuple with prefixItems and items false rejects extra items (draft-2020-12)", () => {
  const schema = fromJSONSchema({
    $schema: "https://json-Schema.org/draft/2020-12/schema",
    type: "array",
    prefixItems: [{ type: "string" }],
    items: false,
  });
  expect(Schema.parse(["hello"])).toEqual(["hello"]);
  expect(() => Schema.parse(["hello", 42])).toThrow();
});

test("tuple with items array (draft-7)", () => {
  const schema = fromJSONSchema({
    $schema: "http://json-Schema.org/draft-07/schema#",
    type: "array",
    items: [{ type: "string" }, { type: "number" }],
    additionalItems: false,
  });
  expect(Schema.parse([])).toEqual([]);
  expect(Schema.parse(["hello"])).toEqual(["hello"]);
  expect(Schema.parse(["hello", 42])).toEqual(["hello", 42]);
  expect(() => Schema.parse([1])).toThrow();
  expect(() => Schema.parse(["hello", "world"])).toThrow();
  expect(() => Schema.parse(["hello", 42, "extra"])).toThrow();
});

test("tuple with items array and minItems (draft-7)", () => {
  const partialItems = fromJSONSchema({
    $schema: "http://json-Schema.org/draft-07/schema#",
    type: "array",
    items: [{ type: "string" }, { type: "number" }],
    additionalItems: false,
    minItems: 1,
  });
  expect(() => partialItems.parse([])).toThrow();
  expect(partialItems.parse(["hello"])).toEqual(["hello"]);

  const allRequired = fromJSONSchema({
    $schema: "http://json-Schema.org/draft-07/schema#",
    type: "array",
    items: [{ type: "string" }, { type: "number" }],
    additionalItems: false,
    minItems: 2,
  });
  expect(() => allRequired.parse(["hello"])).toThrow();
  expect(allRequired.parse(["hello", 42])).toEqual(["hello", 42]);
});

test("tuple with items array allows extra items by default (draft-7)", () => {
  const schema = fromJSONSchema({
    $schema: "http://json-Schema.org/draft-07/schema#",
    type: "array",
    items: [{ type: "string" }],
  });
  expect(Schema.parse(["hello", 42, true])).toEqual(["hello", 42, true]);
});

test("tuple with items array and additionalItems true allows extra items (draft-7)", () => {
  const schema = fromJSONSchema({
    $schema: "http://json-Schema.org/draft-07/schema#",
    type: "array",
    items: [{ type: "string" }, { type: "number" }],
    additionalItems: true,
  });
  expect(Schema.parse(["hello", 42, "extra", true])).toEqual(["hello", 42, "extra", true]);
});

test("tuple with items array respects additionalItems schema (draft-7)", () => {
  const schema = fromJSONSchema({
    $schema: "http://json-Schema.org/draft-07/schema#",
    type: "array",
    items: [{ type: "string" }],
    additionalItems: { type: "number" },
  });
  expect(Schema.parse(["hello", 1, 2])).toEqual(["hello", 1, 2]);
  expect(() => Schema.parse(["hello", 1, "extra"])).toThrow();
});

test("enum schema", () => {
  const schema = fromJSONSchema({
    enum: ["red", "green", "blue"],
  });
  expect(Schema.parse("red")).toBe("red");
  expect(() => Schema.parse("yellow")).toThrow();
});

test("const schema", () => {
  const schema = fromJSONSchema({
    const: "hello",
  });
  expect(Schema.parse("hello")).toBe("hello");
  expect(() => Schema.parse("world")).toThrow();
});

test("anyOf schema", () => {
  const schema = fromJSONSchema({
    anyOf: [{ type: "string" }, { type: "number" }],
  });
  expect(Schema.parse("hello")).toBe("hello");
  expect(Schema.parse(42)).toBe(42);
  expect(() => Schema.parse(true)).toThrow();
});

test("allOf schema", () => {
  const schema = fromJSONSchema({
    allOf: [
      { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
      { type: "object", properties: { age: { type: "number" } }, required: ["age"] },
    ],
  });
  const result = Schema.parse({ name: "John", age: 30 }) as { name: string; age: number };
  expect(result.name).toBe("John");
  expect(result.age).toBe(30);
});

test("allOf with empty array", () => {
  // Empty allOf without explicit type returns any
  const schema1 = fromJSONSchema({
    allOf: [],
  });
  expect(schema1.parse("hello")).toBe("hello");
  expect(schema1.parse(123)).toBe(123);
  expect(schema1.parse({})).toEqual({});

  // Empty allOf with explicit type returns base schema
  const schema2 = fromJSONSchema({
    type: "string",
    allOf: [],
  });
  expect(schema2.parse("hello")).toBe("hello");
  expect(() => schema2.parse(123)).toThrow();
});

test("oneOf schema (exclusive union)", () => {
  const schema = fromJSONSchema({
    oneOf: [{ type: "string" }, { type: "number" }],
  });
  expect(Schema.parse("hello")).toBe("hello");
  expect(Schema.parse(42)).toBe(42);
  expect(() => Schema.parse(true)).toThrow();
});

test("type with anyOf creates intersection", () => {
  // type: string AND (type:string,minLength:5 OR type:string,pattern:^a)
  const schema = fromJSONSchema({
    type: "string",
    anyOf: [
      { type: "string", minLength: 5 },
      { type: "string", pattern: "^a" },
    ],
  });
  // Should pass: string AND (minLength:5 OR pattern:^a) - matches minLength
  expect(Schema.parse("hello")).toBe("hello");
  // Should pass: string AND (minLength:5 OR pattern:^a) - matches pattern
  expect(Schema.parse("abc")).toBe("abc");
  // Should fail: string but neither minLength nor pattern match
  expect(() => Schema.parse("hi")).toThrow();
  // Should fail: not a string
  expect(() => Schema.parse(123)).toThrow();
});

test("type with oneOf creates intersection", () => {
  // type: string AND (exactly one of: type:string,minLength:5 OR type:string,pattern:^a)
  const schema = fromJSONSchema({
    type: "string",
    oneOf: [
      { type: "string", minLength: 5 },
      { type: "string", pattern: "^a" },
    ],
  });
  // Should pass: string AND minLength:5 (exactly one match - "hello" length 5 >= 5, doesn't start with 'a')
  expect(Schema.parse("hello")).toBe("hello");
  // Should pass: string AND pattern:^a (exactly one match - "abc" starts with 'a', length 3 < 5)
  expect(Schema.parse("abc")).toBe("abc");
  // Should fail: string but neither match
  expect(() => Schema.parse("hi")).toThrow();
  // Should fail: not a string
  expect(() => Schema.parse(123)).toThrow();
  // Should fail: matches both (length >= 5 AND starts with 'a') - exclusive union fails
  expect(() => Schema.parse("apple")).toThrow();
});

test("unevaluatedItems throws error", () => {
  expect(() => {
    fromJSONSchema({
      type: "array",
      unevaluatedItems: false,
    });
  }).toThrow("unevaluatedItems is not supported");
});

test("unevaluatedProperties throws error", () => {
  expect(() => {
    fromJSONSchema({
      type: "object",
      unevaluatedProperties: false,
    });
  }).toThrow("unevaluatedProperties is not supported");
});

test("if/then/else throws error", () => {
  expect(() => {
    fromJSONSchema({
      if: { type: "string" },
      then: { type: "number" },
    });
  }).toThrow("Conditional schemas");
});

test("external $ref throws error", () => {
  expect(() => {
    fromJSONSchema({
      $ref: "https://example.com/schema#/definitions/User",
    });
  }).toThrow("External $ref is not supported");
});

test("local $ref resolution", () => {
  const schema = fromJSONSchema({
    $defs: {
      User: {
        type: "object",
        properties: {
          name: { type: "string" },
        },
        required: ["name"],
      },
    },
    $ref: "#/$defs/User",
  });
  expect(Schema.parse({ name: "John" })).toEqual({ name: "John" });
  expect(() => Schema.parse({})).toThrow();
});

test("local $ref resolution unescapes JSON Pointer tokens", () => {
  // `~1` must be decoded before `~0`, so the id "a~1b" survives as itself and not as "a/b".
  for (const id of ["Shared/User", "My~Model", "a~b/c", "a~1b"]) {
    const inner = Schema.object({ name: Schema.string() }).meta({ id });
    const schema = fromJSONSchema(Schema.toJSONSchema(Schema.object({ inner })));
    expect(Schema.parse({ inner: { name: "John" } })).toEqual({ inner: { name: "John" } });
  }
});

test("circular $ref with lazy", () => {
  const schema = fromJSONSchema({
    $defs: {
      Node: {
        type: "object",
        properties: {
          value: { type: "string" },
          children: {
            type: "array",
            items: { $ref: "#/$defs/Node" },
          },
        },
      },
    },
    $ref: "#/$defs/Node",
  });
  type Node = { value: string; children: Node[] };
  const result = Schema.parse({
    value: "root",
    children: [{ value: "child", children: [] }],
  }) as Node;
  expect(result.value).toBe("root");
  expect(result.children[0]?.value).toBe("child");
});

test("patternProperties", () => {
  const schema = fromJSONSchema({
    type: "object",
    patternProperties: {
      "^S_": { type: "string" },
    },
  });
  const result = Schema.parse({ S_name: "John", S_age: "30" }) as Record<string, string>;
  expect(result.S_name).toBe("John");
  expect(result.S_age).toBe("30");
});

test("propertyNames with enum does not require keys", () => {
  const schema = fromJSONSchema({
    type: "object",
    propertyNames: { enum: ["a", "b"] },
    additionalProperties: { type: "string" },
  });
  expect(Schema.parse({ a: "x" })).toEqual({ a: "x" });
  expect(Schema.parse({ b: "y" })).toEqual({ b: "y" });
  expect(Schema.parse({})).toEqual({});
  expect(() => Schema.parse({ c: "z" })).toThrow();
});

test("propertyNames with enum alongside properties", () => {
  const schema = fromJSONSchema({
    type: "object",
    properties: { a: { type: "string" } },
    propertyNames: { enum: ["a", "b"] },
    additionalProperties: { type: "string" },
  });
  expect(Schema.parse({ a: "x" })).toEqual({ a: "x" });
  expect(Schema.parse({})).toEqual({});
  expect(() => Schema.parse({ c: "z" })).toThrow();
  expect(() => Schema.parse({ a: "x", c: "z" })).toThrow();
});

test("propertyNames with enum still honors required", () => {
  const schema = fromJSONSchema({
    type: "object",
    properties: { a: { type: "string" }, b: { type: "string" } },
    required: ["a"],
    propertyNames: { enum: ["a", "b"] },
    additionalProperties: { type: "string" },
  });
  expect(Schema.parse({ a: "x" })).toEqual({ a: "x" });
  expect(Schema.parse({ a: "x", b: "y" })).toEqual({ a: "x", b: "y" });
  expect(() => Schema.parse({})).toThrow();
  expect(() => Schema.parse({ b: "y" })).toThrow();
});

test("propertyNames does not apply additionalProperties to declared properties", () => {
  const schema = fromJSONSchema({
    type: "object",
    properties: { a: { type: "number" } },
    propertyNames: { enum: ["a", "b"] },
    additionalProperties: { type: "string" },
  });
  expect(Schema.parse({ a: 1 })).toEqual({ a: 1 });
  expect(Schema.parse({ a: 1, b: "x" })).toEqual({ a: 1, b: "x" });
  expect(() => Schema.parse({ b: 1 })).toThrow();
});

test("propertyNames alongside additionalProperties: false", () => {
  const schema = fromJSONSchema({
    type: "object",
    properties: { a: { type: "string" } },
    propertyNames: { enum: ["a", "b"] },
    additionalProperties: false,
  });
  expect(Schema.parse({ a: "x" })).toEqual({ a: "x" });
  expect(() => Schema.parse({ a: "x", b: "y" })).toThrow();
  expect(() => Schema.parse({ c: "z" })).toThrow();
});

test("propertyNames alongside patternProperties", () => {
  const schema = fromJSONSchema({
    type: "object",
    patternProperties: { "^S_": { type: "string" } },
    propertyNames: { type: "string", pattern: "^S_" },
  });
  expect(Schema.parse({ S_a: "x" })).toEqual({ S_a: "x" });
  expect(() => Schema.parse({ S_a: 1 })).toThrow();
  expect(() => Schema.parse({ other: "x" })).toThrow();
});

test("propertyNames rejects keys the object parse would drop or synthesize", () => {
  const schema = fromJSONSchema({ type: "object", propertyNames: { enum: ["a"] } });
  // An object parse strips `__proto__`, so the guard has to see the raw input.
  expect(() => Schema.parse(JSON.parse('{"__proto__":1}'))).toThrow();

  // A property `default` adds a key that was never in the instance.
  const withDefault = fromJSONSchema({
    type: "object",
    properties: { AB: { type: "string", default: "x" } },
    propertyNames: { type: "string", pattern: "^[a-z]+$" },
  });
  expect(withDefault.parse({})).toEqual({ AB: "x" });
});

test("propertyNames subschema without a type still constrains keys", () => {
  const schema = fromJSONSchema({
    type: "object",
    propertyNames: { pattern: "^[A-Za-z_][A-Za-z0-9_]*$" },
  });
  expect(Schema.parse({ valid_key: "x" })).toEqual({ valid_key: "x" });
  expect(() => Schema.parse({ "001 invalid": "x" })).toThrow();
});

test("boolean propertyNames", () => {
  expect(() => fromJSONSchema({ type: "object", propertyNames: false }).parse({ a: 1 })).toThrow();
  expect(fromJSONSchema({ type: "object", propertyNames: false }).parse({})).toEqual({});
  expect(fromJSONSchema({ type: "object", propertyNames: true }).parse({ anything: 1 })).toEqual({ anything: 1 });
});

test("propertyNames metadata is not attached where it is inert", () => {
  // Not an object: nothing enforces it, so it must not be advertised either.
  expect(Schema.toJSONSchema(fromJSONSchema({ type: "string", propertyNames: { enum: ["a"] } }))).not.toHaveProperty(
    "propertyNames"
  );

  // A $ref target is shared by every reference to it; metadata must not leak onto it.
  const shared = Schema.toJSONSchema(
    fromJSONSchema({
      $defs: { N: { type: "object", properties: { v: { type: "string" } } } },
      type: "object",
      properties: { a: { $ref: "#/$defs/N", propertyNames: { enum: ["v"] } }, b: { $ref: "#/$defs/N" } },
    })
  ) as any;
  expect(shared.properties.b).not.toHaveProperty("propertyNames");
});

test("propertyNames survives a toJSONSchema round trip", () => {
  const roundTripped = Schema.toJSONSchema(
    fromJSONSchema({
      type: "object",
      propertyNames: { enum: ["a", "b"] },
      additionalProperties: { type: "string" },
    })
  ) as Record<string, unknown>;
  expect(roundTripped.propertyNames).toEqual({ enum: ["a", "b"] });
  expect(roundTripped.required).toBeUndefined();

  // The key guard is a pipe; neither side may swallow the object it wraps.
  for (const io of ["input", "output"] as const) {
    const out = Schema.toJSONSchema(
      fromJSONSchema({
        type: "object",
        properties: { a: { type: "string" } },
        propertyNames: { enum: ["a", "b"] },
        additionalProperties: { type: "string" },
      }),
      { io }
    ) as Record<string, unknown>;
    expect(out.type).toBe("object");
    expect(out.properties).toEqual({ a: { type: "string" } });
    expect(out.propertyNames).toEqual({ enum: ["a", "b"] });
  }
});

test("patternProperties with regular properties", () => {
  // Note: When patternProperties is combined with properties, the intersection validates all keys against the pattern. This test uses a pattern that matches the regular property name as well.
  const schema = fromJSONSchema({
    type: "object",
    properties: {
      S_name: { type: "string" },
    },
    patternProperties: {
      "^S_": { type: "string" },
    },
    required: ["S_name"],
  });
  const result = Schema.parse({ S_name: "John", S_extra: "value" }) as Record<string, string>;
  expect(result.S_name).toBe("John");
  expect(result.S_extra).toBe("value");
});

test("multiple patternProperties", () => {
  const schema = fromJSONSchema({
    type: "object",
    patternProperties: {
      "^S_": { type: "string" },
      "^N_": { type: "number" },
    },
  });
  const result = Schema.parse({ S_name: "John", N_count: 123 }) as Record<string, string | number>;
  expect(result.S_name).toBe("John");
  expect(result.N_count).toBe(123);
  // Keys not matching any pattern should pass through
  const result2 = Schema.parse({ S_name: "John", N_count: 123, other: "value" }) as Record<string, string | number>;
  expect(result2.other).toBe("value");
});

test("multiple overlapping patternProperties", () => {
  // If a key matches multiple patterns, value must satisfy all schemas
  const schema = fromJSONSchema({
    type: "object",
    patternProperties: {
      "^S_": { type: "string" },
      "^S_N": { type: "string", minLength: 3 },
    },
  });
  // S_name matches ^S_ but not ^S_N
  expect(Schema.parse({ S_name: "John" })).toEqual({ S_name: "John" });
  // S_N matches both patterns - must satisfy both (string with minLength 3)
  expect(Schema.parse({ S_N: "abc" })).toEqual({ S_N: "abc" });
  expect(() => Schema.parse({ S_N: "ab" })).toThrow(); // too short for ^S_N pattern
});

test("patternProperties with additionalProperties false", () => {
  const schema = fromJSONSchema({
    type: "object",
    patternProperties: {
      "^S_": { type: "string" },
    },
    additionalProperties: false,
  });
  expect(Schema.parse({ S_name: "ok" })).toEqual({ S_name: "ok" });
  expect(() => Schema.parse({ X_A: false })).toThrow();
  expect(() => Schema.parse({ S_name: 1 })).toThrow();
});

test("patternProperties and properties with additionalProperties false", () => {
  const schema = fromJSONSchema({
    type: "object",
    properties: {
      name: { type: "string" },
    },
    patternProperties: {
      "^S_": { type: "string" },
    },
    additionalProperties: false,
    required: ["name"],
  });
  expect(Schema.parse({ name: "ok", S_count: "1" })).toEqual({ name: "ok", S_count: "1" });
  expect(() => Schema.parse({ name: "ok", S_count: 1 })).toThrow();
  expect(() => Schema.parse({ name: "ok", other: "value" })).toThrow();
});

test("multiple patternProperties with additionalProperties false", () => {
  const schema = fromJSONSchema({
    type: "object",
    patternProperties: {
      "^S_": { type: "string" },
      "^N_": { type: "number" },
    },
    additionalProperties: false,
  });
  expect(Schema.parse({ S_a: "a", N_b: 1 })).toEqual({ S_a: "a", N_b: 1 });
  expect(() => Schema.parse({ S_a: "a", N_b: 1, other: "value" })).toThrow();
});

test("default value", () => {
  const schema = fromJSONSchema({
    type: "string",
    default: "hello",
  });
  // Default is applied during parsing if value is missing/undefined. This depends on Schema's default behavior
  expect(Schema.parse("world")).toBe("world");
});

test("description metadata", () => {
  const schema = fromJSONSchema({
    type: "string",
    description: "A string value",
  });
  expect(Schema.parse("hello")).toBe("hello");
});

test("version detection - draft-2020-12", () => {
  const schema = fromJSONSchema({
    $schema: "https://json-Schema.org/draft/2020-12/schema",
    type: "array",
    prefixItems: [{ type: "string" }],
  });
  expect(Schema.parse(["hello"])).toEqual(["hello"]);
});

test("version detection - draft-7", () => {
  const schema = fromJSONSchema({
    $schema: "http://json-Schema.org/draft-07/schema#",
    type: "array",
    items: [{ type: "string" }],
  });
  expect(Schema.parse(["hello"])).toEqual(["hello"]);
});

test("version detection - draft-4", () => {
  const schema = fromJSONSchema({
    $schema: "http://json-Schema.org/draft-04/schema#",
    type: "array",
    items: [{ type: "string" }],
  });
  expect(Schema.parse(["hello"])).toEqual(["hello"]);
});

test("default version (draft-2020-12)", () => {
  const schema = fromJSONSchema({
    type: "array",
    prefixItems: [{ type: "string" }],
  });
  expect(Schema.parse(["hello"])).toEqual(["hello"]);
});

test("string format - email", () => {
  const schema = fromJSONSchema({
    type: "string",
    format: "email",
  });
  expect(Schema.parse("test@example.com")).toBe("test@example.com");
});

test("string format - uuid", () => {
  const schema = fromJSONSchema({
    type: "string",
    format: "uuid",
  });
  const uuid = "550e8400-e29b-41d4-a716-446655440000";
  expect(Schema.parse(uuid)).toBe(uuid);
});

test("string format - date-time", () => {
  const schema = fromJSONSchema({
    type: "string",
    format: "date-time",
  });
  expect(Schema.safeParse("2026-07-29T14:30:00Z").success).toBe(true);
  expect(Schema.safeParse("2026-07-29T16:30:00+02:00").success).toBe(true);
  expect(Schema.safeParse("2026-07-29T14:30:00").success).toBe(false);
  expect(Schema.safeParse("2026-07-29T16:30:00+0200").success).toBe(false);

  const zuluOnly = fromJSONSchema({
    type: "string",
    format: "date-time",
    pattern: "Z$",
  });
  expect(zuluOnly.safeParse("2026-07-29T14:30:00Z").success).toBe(true);
  expect(zuluOnly.safeParse("2026-07-29T16:30:00+02:00").success).toBe(false);
  expect(zuluOnly.safeParse("garbageZ").success).toBe(false);

  const roundTripped = fromJSONSchema(Schema.toJSONSchema(Schema.iso.datetime({ offset: true })));
  expect(roundTripped.safeParse("2026-07-29T16:30:00+02:00").success).toBe(true);
});

test("string format - time", () => {
  const schema = fromJSONSchema({
    type: "string",
    format: "time",
  });
  // full-time, so seconds and an offset are both required
  expect(Schema.safeParse("14:30:00Z").success).toBe(true);
  expect(Schema.safeParse("16:30:00+02:00").success).toBe(true);
  expect(Schema.safeParse("16:30:00.123-05:30").success).toBe(true);
  expect(Schema.safeParse("14:30:00").success).toBe(false);
  expect(Schema.safeParse("14:30Z").success).toBe(false);
  expect(Schema.safeParse("16:30:00+0200").success).toBe(false);
  expect(Schema.safeParse("16:30:00+24:00").success).toBe(false);
});

test("string format - hostname", () => {
  const schema = fromJSONSchema({
    type: "string",
    format: "hostname",
  });
  expect(Schema.parse("example.com")).toBe("example.com");
  expect(() => Schema.parse("not a hostname!")).toThrow();
});

test("exclusiveMinimum and exclusiveMaximum", () => {
  const schema = fromJSONSchema({
    type: "number",
    exclusiveMinimum: 0,
    exclusiveMaximum: 100,
  });
  expect(Schema.parse(50)).toBe(50);
  expect(() => Schema.parse(0)).toThrow();
  expect(() => Schema.parse(100)).toThrow();
});

test("boolean schema (true/false)", () => {
  const trueSchema = fromJSONSchema(true);
  expect(trueSchema.parse("anything")).toBe("anything");

  const falseSchema = fromJSONSchema(false);
  expect(() => falseSchema.parse("anything")).toThrow();
});

test("empty object schema", () => {
  const schema = fromJSONSchema({
    type: "object",
  });
  expect(Schema.parse({})).toEqual({});
  expect(Schema.parse({ extra: "field" })).toEqual({ extra: "field" });
});

test("array without items", () => {
  const schema = fromJSONSchema({
    type: "array",
  });
  expect(Schema.parse([1, "string", true])).toEqual([1, "string", true]);
});

test("mixed enum types", () => {
  const schema = fromJSONSchema({
    enum: ["string", 42, true, null],
  });
  expect(Schema.parse("string")).toBe("string");
  expect(Schema.parse(42)).toBe(42);
  expect(Schema.parse(true)).toBe(true);
  expect(Schema.parse(null)).toBe(null);
});

test("nullable in OpenAPI 3.0", () => {
  // General nullable case (not just enum: [null])
  const stringSchema = fromJSONSchema(
    {
      type: "string",
      nullable: true,
    },
    { defaultTarget: "openapi-3.0" }
  );
  expect(stringSchema.parse("hello")).toBe("hello");
  expect(stringSchema.parse(null)).toBe(null);
  expect(() => stringSchema.parse(123)).toThrow();

  const numberSchema = fromJSONSchema(
    {
      type: "number",
      nullable: true,
    },
    { defaultTarget: "openapi-3.0" }
  );
  expect(numberSchema.parse(42)).toBe(42);
  expect(numberSchema.parse(null)).toBe(null);
  expect(() => numberSchema.parse("string")).toThrow();

  const objectSchema = fromJSONSchema(
    {
      type: "object",
      properties: { name: { type: "string" } },
      nullable: true,
    },
    { defaultTarget: "openapi-3.0" }
  );
  expect(objectSchema.parse({ name: "John" })).toEqual({ name: "John" });
  expect(objectSchema.parse(null)).toBe(null);
});

// Metadata extraction tests

test("unrecognized keys stored in globalRegistry by default", () => {
  const schema = fromJSONSchema({
    type: "string",
    title: "My String",
    deprecated: true,
    examples: ["hello", "world"],
    "x-custom": "custom value",
  });

  const meta = Schema.globalRegistry.get(schema);
  expect(meta).toBeDefined();
  expect(meta?.title).toBe("My String");
  expect(meta?.deprecated).toBe(true);
  expect(meta?.examples).toEqual(["hello", "world"]);
  expect((meta as any)?.["x-custom"]).toBe("custom value");

  // Clean up
  Schema.globalRegistry.remove(schema);
});

test("unrecognized keys stored in custom registry", () => {
  const customRegistry = Schema.registry<{ title?: string; deprecated?: boolean }>();

  const schema = fromJSONSchema(
    {
      type: "number",
      title: "Age",
      deprecated: true,
    },
    { registry: customRegistry }
  );

  // Should be in custom registry
  const meta = customRegistry.get(schema);
  expect(meta).toBeDefined();
  expect(meta?.title).toBe("Age");
  expect(meta?.deprecated).toBe(true);

  // Should NOT be in globalRegistry
  expect(Schema.globalRegistry.get(schema)).toBeUndefined();
});

test("$id and id are captured as metadata", () => {
  const customRegistry = Schema.registry<{ $id?: string; id?: string }>();

  const schema1 = fromJSONSchema(
    {
      $id: "https://example.com/schemas/user",
      type: "object",
    },
    { registry: customRegistry }
  );
  expect(customRegistry.get(schema1)?.$id).toBe("https://example.com/schemas/user");

  const schema2 = fromJSONSchema(
    {
      id: "legacy-id",
      type: "string",
    },
    { registry: customRegistry }
  );
  expect(customRegistry.get(schema2)?.id).toBe("legacy-id");
});

test("x-* extension keys are captured as metadata", () => {
  const customRegistry = Schema.registry<Record<string, unknown>>();

  const schema = fromJSONSchema(
    {
      type: "string",
      "x-openapi-example": "example value",
      "x-internal": true,
      "x-tags": ["api", "public"],
    },
    { registry: customRegistry }
  );

  const meta = customRegistry.get(schema);
  expect(meta?.["x-openapi-example"]).toBe("example value");
  expect(meta?.["x-internal"]).toBe(true);
  expect(meta?.["x-tags"]).toEqual(["api", "public"]);
});

test("metadata on nested schemas", () => {
  const customRegistry = Schema.registry<Record<string, unknown>>();

  const parentSchema = fromJSONSchema(
    {
      type: "object",
      title: "User",
      properties: {
        name: {
          type: "string",
          title: "Name",
          "x-field-order": 1,
        },
        age: {
          type: "number",
          title: "Age",
          deprecated: true,
        },
      },
    },
    { registry: customRegistry }
  );

  // Verify parent schema has its metadata
  expect(customRegistry.get(parentSchema)?.title).toBe("User");

  // We can't easily access nested schemas directly, but we can verify the registry is being used correctly by checking a separate schema
  const simpleSchema = fromJSONSchema(
    {
      type: "string",
      title: "Simple",
    },
    { registry: customRegistry }
  );
  expect(customRegistry.get(simpleSchema)?.title).toBe("Simple");
});

test("no metadata added when no unrecognized keys", () => {
  const customRegistry = Schema.registry<Record<string, unknown>>();

  const schema = fromJSONSchema(
    {
      type: "string",
      minLength: 1,
      maxLength: 100,
      description: "A regular string",
    },
    { registry: customRegistry }
  );

  // description is handled via .describe(), so it shouldn't be in metadata. All other keys are recognized, so no metadata should be added
  expect(customRegistry.get(schema)).toBeUndefined();
});

test("writeOnly and examples are captured as metadata", () => {
  const customRegistry = Schema.registry<{ writeOnly?: boolean; examples?: unknown[] }>();

  const schema = fromJSONSchema(
    {
      type: "string",
      writeOnly: true,
      examples: ["password123", "secret"],
    },
    { registry: customRegistry }
  );

  const meta = customRegistry.get(schema);
  expect(meta?.writeOnly).toBe(true);
  expect(meta?.examples).toEqual(["password123", "secret"]);
});

test("$comment and $anchor are captured as metadata", () => {
  const customRegistry = Schema.registry<{ $comment?: string; $anchor?: string }>();

  const schema = fromJSONSchema(
    {
      type: "string",
      $comment: "This is a developer note",
      $anchor: "my-anchor",
    },
    { registry: customRegistry }
  );

  const meta = customRegistry.get(schema);
  expect(meta?.$comment).toBe("This is a developer note");
  expect(meta?.$anchor).toBe("my-anchor");
});

test("contentEncoding and contentMediaType are stored as metadata", () => {
  const customRegistry = Schema.registry<{ contentEncoding?: string; contentMediaType?: string }>();

  const schema = fromJSONSchema(
    {
      type: "string",
      contentEncoding: "base64",
      contentMediaType: "image/png",
    },
    { registry: customRegistry }
  );

  // Should just be a string schema
  expect(Schema.parse("aGVsbG8gd29ybGQ=")).toBe("aGVsbG8gd29ybGQ=");

  // Content keywords should be in metadata
  const meta = customRegistry.get(schema);
  expect(meta?.contentEncoding).toBe("base64");
  expect(meta?.contentMediaType).toBe("image/png");
});

test("description on enum schema is applied", () => {
  const schema = fromJSONSchema({
    enum: ["red", "green", "blue"],
    description: "A color value",
  });
  expect(Schema.description).toBe("A color value");
  expect(Schema.parse("red")).toBe("red");
});

test("description on const schema is applied", () => {
  const schema = fromJSONSchema({
    const: "hello",
    description: "A greeting",
  });
  expect(Schema.description).toBe("A greeting");
  expect(Schema.parse("hello")).toBe("hello");
});

test("description on not: {} (never) schema is applied", () => {
  const schema = fromJSONSchema({
    not: {},
    description: "A never schema",
  });
  expect(Schema.description).toBe("A never schema");
  expect(() => Schema.parse("anything")).toThrow();
});

test("default on enum schema is applied", () => {
  const schema = fromJSONSchema({
    enum: ["red", "green", "blue"],
    default: "red",
  });
  expect(Schema.parse(undefined)).toBe("red");
});

test("default on const schema is applied", () => {
  const schema = fromJSONSchema({
    const: "hello",
    default: "hello",
  });
  expect(Schema.parse(undefined)).toBe("hello");
});

test("description and default on enum schema are both applied", () => {
  const schema = fromJSONSchema({
    enum: ["red", "green", "blue"],
    description: "A color value",
    default: "red",
  });
  expect(Schema.description).toBe("A color value");
  expect(Schema.parse(undefined)).toBe("red");
  expect(Schema.parse("green")).toBe("green");
});

test("description on type-array schema is applied", () => {
  const schema = fromJSONSchema({
    type: ["string", "number"],
    description: "A string or number",
  } as any);
  expect(Schema.description).toBe("A string or number");
  expect(Schema.parse("hello")).toBe("hello");
  expect(Schema.parse(42)).toBe(42);
});

test("default on type-array schema is applied", () => {
  const schema = fromJSONSchema({
    type: ["string", "number"],
    default: "fallback",
  } as any);
  expect(Schema.parse(undefined)).toBe("fallback");
  expect(Schema.parse("hello")).toBe("hello");
  expect(Schema.parse(42)).toBe(42);
});

test("description on schema with anyOf is applied to the outer schema", () => {
  const schema = fromJSONSchema({
    description: "Either a string or a number",
    anyOf: [{ type: "string" }, { type: "number" }],
  });
  expect(Schema.description).toBe("Either a string or a number");
  expect(Schema.parse("hello")).toBe("hello");
  expect(Schema.parse(42)).toBe(42);
});

test("default on schema with anyOf is applied to the outer schema", () => {
  const schema = fromJSONSchema({
    default: "fallback",
    anyOf: [{ type: "string" }, { type: "number" }],
  });
  expect(Schema.parse(undefined)).toBe("fallback");
  expect(Schema.parse(42)).toBe(42);
});

test("description and unrecognized metadata coexist on the same schema", () => {
  const customRegistry = Schema.registry<{ "x-custom"?: string; description?: string }>();
  const schema = fromJSONSchema(
    {
      type: "string",
      description: "A custom string",
      "x-custom": "value",
    },
    { registry: customRegistry }
  );
  expect(Schema.description).toBe("A custom string");
  expect(customRegistry.get(schema)?.["x-custom"]).toBe("value");
});

test("circular input throws a clear error", () => {
  const person: any = {
    type: "object",
    properties: { name: { type: "string" } },
    required: ["name"],
  };
  person.properties.bestFriend = person;
  expect(() => fromJSONSchema(person)).toThrow(/not valid JSON/);
});

test("getter-based input that synthesizes a cycle throws", () => {
  const root: any = { type: "object", properties: { name: { type: "string" } } };
  Object.defineProperty(root.properties, "self", {
    enumerable: true,
    get() {
      return root;
    },
  });
  expect(() => fromJSONSchema(root)).toThrow(/not valid JSON/);
});

test("BigInt in input throws", () => {
  const input: any = { type: "integer", minimum: 1n };
  expect(() => fromJSONSchema(input)).toThrow(/not valid JSON/);
});

test("class-instance input is normalized to a plain object", () => {
  class StringSchema {
    type = "string" as const;
    minLength = 2;
  }
  const schema = fromJSONSchema(new StringSchema() as any);
  expect(Schema.parse("hi")).toBe("hi");
  expect(() => Schema.parse("h")).toThrow();
});

test("getter-based properties are materialized", () => {
  const input: any = { type: "object", properties: {}, required: [] };
  Object.defineProperty(input.properties, "name", {
    enumerable: true,
    get() {
      return { type: "string" };
    },
  });
  const schema = fromJSONSchema(input);
  expect(Schema.parse({ name: "Alice" })).toEqual({ name: "Alice" });
});

test("Date default is coerced to its JSON string form", () => {
  const date = new Date("2026-01-02T03:04:05.000Z");
  const schema = fromJSONSchema({ type: "string", default: date as any });
  expect(Schema.parse(undefined)).toBe(date.toISOString());
});

// An object literal can't express an own "__proto__" key — `{ __proto__: x }` sets the literal's prototype instead. JSON.parse is both the realistic source of a JSON Schema and the only way to write these cases.
test("required __proto__ property is represented in the shape but stripped during parsing", () => {
  const schema = fromJSONSchema(
    JSON.parse(`{
      "type": "object",
      "properties": { "__proto__": { "type": "string", "const": "admin" }, "role": { "type": "string" } },
      "required": ["__proto__", "role"]
    }`)
  );

  expect(Object.prototype.hasOwnProperty.call((schema as Schema  .SchemaObject).shape, "__proto__")).toBe(true);
  expect(Schema.parse({ role: "x" })).toEqual({ role: "x" });
  expect(Schema.parse(JSON.parse(`{ "role": "x", "__proto__": "wrong" }`))).toEqual({ role: "x" });
  expect(Schema.parse(JSON.parse(`{ "role": "x", "__proto__": "admin" }`))).toEqual({ role: "x" });
});

test("__proto__ annotation key reaches the registry", () => {
  const registry = Schema.registry<Record<string, unknown>>();
  const schema = fromJSONSchema(JSON.parse(`{ "type": "string", "__proto__": { "custom": 1 } }`), { registry });

  const meta = registry.get(schema)!;
  expect(Object.prototype.hasOwnProperty.call(meta, "__proto__")).toBe(true);
  expect(meta.__proto__).toEqual({ custom: 1 });
});

test("minProperties and maxProperties count the raw input", () => {
  const schema = fromJSONSchema({
    type: "object",
    properties: { a: { type: "string" } },
    minProperties: 1,
    maxProperties: 2,
  });
  expect(Schema.safeParse({ a: "x" }).success).toBe(true);
  expect(Schema.safeParse({}).error!.issues[0]).toMatchObject({ code: "too_small", origin: "object", minimum: 1 });
  expect(Schema.safeParse({ a: "x", b: 1, c: 2 }).error!.issues[0]).toMatchObject({
    code: "too_big",
    origin: "object",
    maximum: 2,
  });
  // raw input: a defaulted property does not satisfy the minimum, and a dropped __proto__ still counts
  const defaulted = fromJSONSchema({
    type: "object",
    properties: { a: { type: "string", default: "x" } },
    minProperties: 1,
  });
  expect(defaulted.safeParse({}).success).toBe(false);
  const capped = fromJSONSchema({ type: "object", maxProperties: 1 });
  expect(capped.safeParse(JSON.parse('{"__proto__":1,"a":1}')).success).toBe(false);
  expect(Schema.toJSONSchema(schema)).toMatchObject({ minProperties: 1, maxProperties: 2 });
});

test("minProperties composes with propertyNames in one guard", () => {
  const schema = fromJSONSchema({ type: "object", propertyNames: { pattern: "^a" }, minProperties: 1 });
  expect(Schema.safeParse({}).error!.issues[0]!.code).toBe("too_small");
  expect(Schema.safeParse({ b: 1 }).error!.issues[0]!.code).toBe("invalid_key");
  expect(Schema.safeParse({ a: 1 }).success).toBe(true);
});

test("uniqueItems rejects structural duplicates", () => {
  const schema = fromJSONSchema({ type: "array", uniqueItems: true });
  expect(
    Schema.safeParse([
      { a: 1, b: 2 },
      { b: 2, a: 1 },
    ]).error!.issues[0]
  ).toMatchObject({
    code: "custom",
    path: [1],
  });
  expect(Schema.safeParse([1, "1", true, 1]).success).toBe(false);
  expect(Schema.safeParse([{ a: 1 }, { a: 2 }, [1], [2]]).success).toBe(true);
  expect(Schema.toJSONSchema(schema)).toMatchObject({ uniqueItems: true });
});

test("contains with minContains and maxContains", () => {
  const schema = fromJSONSchema({ type: "array", contains: { type: "integer" } });
  expect(Schema.safeParse(["a"]).success).toBe(false);
  expect(Schema.safeParse(["a", 1]).success).toBe(true);
  const bounded = fromJSONSchema({ type: "array", contains: { type: "integer" }, minContains: 2, maxContains: 3 });
  expect(bounded.safeParse([1, "a"]).success).toBe(false);
  expect(bounded.safeParse([1, 2, "a"]).success).toBe(true);
  expect(bounded.safeParse([1, 2, 3, 4]).success).toBe(false);
  // minContains: 0 accepts an array with no matches at all
  expect(fromJSONSchema({ type: "array", contains: { type: "integer" }, minContains: 0 }).safeParse([]).success).toBe(
    true
  );
  expect(Schema.toJSONSchema(bounded)).toMatchObject({ contains: { type: "integer" }, minContains: 2, maxContains: 3 });
});

test("uniqueItems and contains see the raw instance, not the parsed output", () => {
  const items = { type: "object", properties: { a: { type: "string", default: "x" } } } as const;
  // no instance item carries `a`; the default must not synthesize the match
  const contains = fromJSONSchema({
    type: "array",
    items,
    contains: { type: "object", properties: { a: { const: "x" } }, required: ["a"] },
  });
  expect(contains.safeParse([{}]).success).toBe(false);
  expect(contains.safeParse([{ a: "x" }]).success).toBe(true);
  // the instance items differ; the default must not collapse them into duplicates
  const unique = fromJSONSchema({ type: "array", items, uniqueItems: true });
  expect(unique.safeParse([{ a: "x" }, {}]).success).toBe(true);
  expect(unique.safeParse([{}, {}]).error!.issues[0]).toMatchObject({ code: "custom", path: [1] });
});

test("a guard keyword takes precedence over the length keywords", () => {
  const schema = fromJSONSchema({ type: "array", items: { type: "integer" }, minItems: 3, uniqueItems: true });
  // the guard runs on the input side of the pipe, so its issue aborts before minItems is reached
  expect(Schema.safeParse([1, 1]).error!.issues.map((i) => i.code)).toEqual(["custom"]);
  expect(Schema.safeParse([1, 2]).error!.issues.map((i) => i.code)).toEqual(["too_small"]);
});

test("a guard keyword drops default and examples from the input-mode document", () => {
  // the guard is a transform on the pipe's input side, and toJSONSchema strips annotations from a transforming schema in input mode
  const schema = fromJSONSchema({ type: "array", uniqueItems: true, default: [], examples: [[1]] });
  expect(Schema.toJSONSchema(schema, { io: "input" })).not.toHaveProperty("default");
  expect(Schema.toJSONSchema(schema, { io: "output" })).toMatchObject({ default: [], examples: [[1]] });
  // without a guard keyword both modes carry them
  const plain = fromJSONSchema({ type: "array", default: [], examples: [[1]] });
  expect(Schema.toJSONSchema(plain, { io: "input" })).toMatchObject({ default: [], examples: [[1]] });
});

test("uniqueItems equality follows JSON semantics", () => {
  const schema = fromJSONSchema({ type: "array", uniqueItems: true });
  expect(Schema.safeParse([1, "1", true, null]).success).toBe(true);
  expect(Schema.safeParse([{ a: undefined }, {}]).success).toBe(true);
  expect(
    Schema.safeParse([
      [1, [2]],
      [1, [2]],
    ]).success
  ).toBe(false);
  expect(Schema.safeParse([{ a: "b=c" }, { "a=b": "c" }]).success).toBe(true);
  // every duplicate is reported against the first element it matches
  expect(Schema.safeParse([1, 1, 1]).error!.issues.map((i) => i.path[0])).toEqual([1, 2]);
  // a cycle cannot be compared, so it is never called a duplicate rather than hanging
  const cyclic: any = {};
  cyclic.self = cyclic;
  expect(Schema.safeParse([cyclic, cyclic]).success).toBe(true);
});

test("a carried subschema that references $defs is dropped rather than emitted dangling", () => {
  const schema = fromJSONSchema({
    type: "array",
    contains: { $ref: "#/$defs/Hit" },
    $defs: { Hit: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
  });
  // enforcement is unaffected; only the round trip gives the keyword up
  expect(Schema.safeParse([{ id: "a" }]).success).toBe(true);
  expect(Schema.safeParse([{}]).success).toBe(false);
  expect(JSON.stringify(Schema.toJSONSchema(schema))).not.toContain("$ref");
  expect(Schema.toJSONSchema(schema)).not.toHaveProperty("contains");
  // an inline subschema is self-contained, so it still round-trips
  const inline = fromJSONSchema({ type: "array", contains: { type: "integer" } });
  expect(Schema.toJSONSchema(inline)).toMatchObject({ contains: { type: "integer" } });
  // only schema positions are walked, so a `$ref` key in instance data or an unknown annotation still travels
  for (const annotation of [{ default: { $ref: "literal" } }, { "x-note": { $ref: "literal" } }]) {
    const annotated = fromJSONSchema({ type: "array", contains: { type: "integer", ...annotation } });
    expect(annotated.safeParse(["x"]).success).toBe(false);
    expect(Schema.toJSONSchema(annotated)).toMatchObject({ contains: { type: "integer" } });
  }
  // draft-7 `dependencies` is a schema map; its array form names properties and holds no reference
  const dependent = fromJSONSchema({
    type: "array",
    contains: { type: "object", dependencies: { a: { $ref: "#/definitions/Hit" } } },
    definitions: { Hit: { type: "object" } },
  });
  expect(Schema.toJSONSchema(dependent)).not.toHaveProperty("contains");
  const named = fromJSONSchema({
    type: "array",
    contains: { type: "object", dependencies: { a: ["b"] } },
  });
  expect(Schema.toJSONSchema(named)).toMatchObject({ contains: { dependencies: { a: ["b"] } } });
  // a reference nested in a schema position is still caught
  const nested = fromJSONSchema({
    type: "array",
    contains: { type: "array", items: { $ref: "#/$defs/Hit" } },
    $defs: { Hit: { type: "string" } },
  });
  expect(Schema.toJSONSchema(nested)).not.toHaveProperty("contains");
});
