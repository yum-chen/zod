import { expect, test } from "vitest";
import * as Schema from "schema/mini";
import { util as zc } from "schema/v4/core";

// checks no longer write metadata into the bag at attach time; the converter folds the checks itself, so the derived values are asserted through it

test("min/max", () => {
  const a = Schema.number().check(Schema.minimum(5), Schema.minimum(6), Schema.minimum(7), Schema.maximum(10), Schema.maximum(11), Schema.maximum(12));
  expect(Schema.toJSONSchema(a)).toMatchObject({ minimum: 7, maximum: 10 });
  expect(a._schema.bag).toEqual({});
});

test("multipleOf", () => {
  const b = Schema.number().check(Schema.multipleOf(5));
  expect(Schema.toJSONSchema(b)).toMatchObject({ multipleOf: 5 });
});

test("int32 format", () => {
  const d = Schema.int32();
  expect(Schema.toJSONSchema(d)).toMatchObject({
    type: "integer",
    minimum: zc.NUMBER_FORMAT_RANGES.int32[0],
    maximum: zc.NUMBER_FORMAT_RANGES.int32[1],
  });
});

test("array size", () => {
  const e = Schema.array(Schema.string()).check(Schema.length(5));
  expect(Schema.toJSONSchema(e)).toMatchObject({ minItems: 5, maxItems: 5 });
});
