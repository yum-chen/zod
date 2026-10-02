// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";

const description = "a description";

test("passing `description` to schema should add a description", () => {
  expect(Schema.string({ description }).description).toEqual(description);
  expect(Schema.number({ description }).description).toEqual(description);
  expect(Schema.boolean({ description }).description).toEqual(description);
});

test("`.describe` should add a description", () => {
  expect(Schema.string().describe(description).description).toEqual(description);
  expect(Schema.number().describe(description).description).toEqual(description);
  expect(Schema.boolean().describe(description).description).toEqual(description);
});

test("description should carry over to chained schemas", () => {
  const schema = Schema.string({ description });
  expect(Schema.description).toEqual(description);
  expect(Schema.optional().description).toEqual(description);
  expect(Schema.optional().nullable().default("default").description).toEqual(description);
});

test("description should not carry over to chained array schema", () => {
  const schema = Schema.string().describe(description);

  expect(Schema.description).toEqual(description);
  expect(Schema.array().description).toEqual(undefined);
  expect(Schema.array(schema).description).toEqual(undefined);
});
