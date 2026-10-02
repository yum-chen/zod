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
    a.nullable().parse(bad);
  } catch (error) {
    expect((error as Schema  .SchemaError).formErrors).toEqual(expected);
  }
}

test("Should have error messages appropriate for the underlying type", () => {
  checkErrors(Schema.string().min(2), 1);
  Schema.string().min(2).nullable().parse(null);
  checkErrors(Schema.number().gte(2), 1);
  Schema.number().gte(2).nullable().parse(null);
  checkErrors(Schema.boolean(), "");
  Schema.boolean().nullable().parse(null);
  checkErrors(Schema.null(), null);
  Schema.null().nullable().parse(null);
  checkErrors(Schema.null(), {});
  Schema.null().nullable().parse(null);
  checkErrors(Schema.object({}), 1);
  Schema.object({}).nullable().parse(null);
  checkErrors(Schema.tuple([]), 1);
  Schema.tuple([]).nullable().parse(null);
  checkErrors(Schema.unknown(), 1);
  Schema.unknown().nullable().parse(null);
});

test("unwrap", () => {
  const unwrapped = Schema.string().nullable().unwrap();
  expect(unwrapped).toBeInstanceOf(Schema.SchemaString);
});
