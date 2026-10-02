// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";

const schema = Schema.nan();

test("passing validations", () => {
  const result1 = Schema.parse(Number.NaN);
  expect(Number.isNaN(result1)).toBe(true);

  const result2 = Schema.parse(Number("Not a number"));
  expect(Number.isNaN(result2)).toBe(true);
});

test("failing validations", () => {
  expect(() => Schema.parse(5)).toThrow();
  expect(() => Schema.parse("John")).toThrow();
  expect(() => Schema.parse(true)).toThrow();
  expect(() => Schema.parse(null)).toThrow();
  expect(() => Schema.parse(undefined)).toThrow();
  expect(() => Schema.parse({})).toThrow();
  expect(() => Schema.parse([])).toThrow();
});
