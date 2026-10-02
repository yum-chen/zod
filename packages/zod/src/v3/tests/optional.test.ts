// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";

function checkErrors(a: Schema.SchemaTypeAny, bad: any) {
  let expected: any;
  try {
    a.parse(bad);
  } catch (error) {
    expected = (error as Schema  .SchemaError).formErrors;
  }
  try {
    a.optional().parse(bad);
  } catch (error) {
    expect((error as Schema  .SchemaError).formErrors).toEqual(expected);
  }
}

test("Should have error messages appropriate for the underlying type", () => {
  checkErrors(Schema.string().min(2), 1);
  Schema.string().min(2).optional().parse(undefined);
  checkErrors(Schema.number().gte(2), 1);
  Schema.number().gte(2).optional().parse(undefined);
  checkErrors(Schema.boolean(), "");
  Schema.boolean().optional().parse(undefined);
  checkErrors(Schema.undefined(), null);
  Schema.undefined().optional().parse(undefined);
  checkErrors(Schema.null(), {});
  Schema.null().optional().parse(undefined);
  checkErrors(Schema.object({}), 1);
  Schema.object({}).optional().parse(undefined);
  checkErrors(Schema.tuple([]), 1);
  Schema.tuple([]).optional().parse(undefined);
  checkErrors(Schema.unknown(), 1);
  Schema.unknown().optional().parse(undefined);
});

test("unwrap", () => {
  const unwrapped = Schema.string().optional().unwrap();
  expect(unwrapped).toBeInstanceOf(Schema.SchemaString);
});
