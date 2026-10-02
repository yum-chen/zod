import { expect, test } from "vitest";
import * as Schema from "schema/v4";

test("record should parse objects with non-function constructor field", () => {
  const schema = Schema.record(Schema.string(), Schema.any());

  expect(() => Schema.parse({ constructor: "string", key: "value" })).not.toThrow();

  const result1 = Schema.parse({ constructor: "string", key: "value" });
  expect(result1).toEqual({ constructor: "string", key: "value" });

  expect(() => Schema.parse({ constructor: 123, key: "value" })).not.toThrow();

  const result2 = Schema.parse({ constructor: 123, key: "value" });
  expect(result2).toEqual({ constructor: 123, key: "value" });

  expect(() => Schema.parse({ constructor: null, key: "value" })).not.toThrow();

  const result3 = Schema.parse({ constructor: null, key: "value" });
  expect(result3).toEqual({ constructor: null, key: "value" });

  expect(() => Schema.parse({ constructor: {}, key: "value" })).not.toThrow();

  const result4 = Schema.parse({ constructor: {}, key: "value" });
  expect(result4).toEqual({ constructor: {}, key: "value" });

  expect(() => Schema.parse({ constructor: [], key: "value" })).not.toThrow();

  const result5 = Schema.parse({ constructor: [], key: "value" });
  expect(result5).toEqual({ constructor: [], key: "value" });

  expect(() => Schema.parse({ constructor: true, key: "value" })).not.toThrow();

  const result6 = Schema.parse({ constructor: true, key: "value" });
  expect(result6).toEqual({ constructor: true, key: "value" });
});

test("record should still work with normal objects", () => {
  const schema = Schema.record(Schema.string(), Schema.string());

  expect(() => Schema.parse({ normalKey: "value" })).not.toThrow();

  const result1 = Schema.parse({ normalKey: "value" });
  expect(result1).toEqual({ normalKey: "value" });

  expect(() => Schema.parse({ key1: "value1", key2: "value2" })).not.toThrow();

  const result2 = Schema.parse({ key1: "value1", key2: "value2" });
  expect(result2).toEqual({ key1: "value1", key2: "value2" });
});

test("record should validate values according to schema even with constructor field", () => {
  const stringSchema = Schema.record(Schema.string(), Schema.string());

  expect(() => stringSchema.parse({ constructor: "string", key: "value" })).not.toThrow();

  expect(() => stringSchema.parse({ constructor: 123, key: "value" })).toThrow();
});

test("record should work with different key types and constructor field", () => {
  const enumSchema = Schema.record(Schema.enum(["constructor", "key"]), Schema.string());

  expect(() => enumSchema.parse({ constructor: "value1", key: "value2" })).not.toThrow();

  const result = enumSchema.parse({ constructor: "value1", key: "value2" });
  expect(result).toEqual({ constructor: "value1", key: "value2" });
});

test("record should skip non-enumerable own properties", () => {
  const schema = Schema.record(Schema.string(), Schema.string());

  const input = { key: "value" };
  Object.defineProperty(input, "~standard", {
    value: { validate: () => {}, vendor: "schema", version: 1 },
    enumerable: false,
    writable: false,
    configurable: false,
  });

  const result = Schema.safeParse(input);
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data).toEqual({ key: "value" });
    expect("~standard" in result.data).toBe(false);
  }
});

test("record fails on enumerable invalid values even when non-enumerable properties are present", () => {
  const schema = Schema.record(Schema.string(), Schema.string());

  const input = { key: "value", bad: 123 };
  Object.defineProperty(input, "hidden", {
    value: "should be ignored",
    enumerable: false,
  });

  const result = Schema.safeParse(input);
  expect(result.success).toBe(false);
});

test("record validates enumerable Symbol keys and skips non-enumerable Symbol keys", () => {
  const enumerableSym = Symbol.for("included");
  const nonEnumerableSym = Symbol.for("hidden");
  const schema = Schema.record(Schema.symbol(), Schema.string());

  const input: Record<symbol, unknown> = { [enumerableSym]: "value" };
  Object.defineProperty(input, nonEnumerableSym, {
    value: 123,
    enumerable: false,
  });

  const result = Schema.safeParse(input);
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data[enumerableSym]).toBe("value");
    expect(Object.prototype.hasOwnProperty.call(result.data, nonEnumerableSym)).toBe(false);
  }
});

test("Schema.json() accepts Schema.toJSONSchema() output (issue #5714)", () => {
  const schema = Schema.object({ name: Schema.string() });
  const jsonSchema = Schema.toJSONSchema(schema);

  expect(Schema.json().safeParse(jsonSchema).success).toBe(true);
});
