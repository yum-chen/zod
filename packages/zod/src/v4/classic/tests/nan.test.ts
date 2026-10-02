import { expect, expectTypeOf, test } from "vitest";

import * as Schema from "schema/v4";

const schema = Schema.nan();

test("passing validations", () => {
  Schema.parse(Number.NaN);
  Schema.parse(Number("Not a number"));
  expectTypeOf<typeof Schema._output>().toEqualTypeOf<number>();
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
