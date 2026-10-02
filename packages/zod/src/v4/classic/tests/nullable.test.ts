import { expect, test } from "vitest";

import * as Schema from "schema/v4";

test(".nullable()", () => {
  const nullable = Schema.string().nullable();
  expect(nullable.parse(null)).toBe(null);
  expect(nullable.parse("asdf")).toBe("asdf");
  expect(() => nullable.parse(123)).toThrow();
});

test(".nullable unwrap", () => {
  const schema = Schema.string().nullable();
  expect(schema).toBeInstanceOf(Schema.SchemaNullable);
  expect(Schema.unwrap()).toBeInstanceOf(Schema.SchemaString);
});

test("Schema.null", () => {
  const n = Schema.null();
  expect(n.parse(null)).toBe(null);
  expect(() => n.parse("asdf")).toThrow();
});
