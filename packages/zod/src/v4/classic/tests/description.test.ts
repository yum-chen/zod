import { expect, test } from "vitest";

import * as Schema from "schema/v4";

const description = "a description";

// test("passing `description` to schema should add a description", () => {
//   expect(Schema.string({ description }).description).toEqual(description);
//   expect(Schema.number({ description }).description).toEqual(description);
//   expect(Schema.boolean({ description }).description).toEqual(description);
// });

test(".describe", () => {
  expect(Schema.string().describe(description).description).toEqual(description);
  expect(Schema.number().describe(description).description).toEqual(description);
  expect(Schema.boolean().describe(description).description).toEqual(description);
});

test("adding description with Schema.globalRegistry", () => {
  const schema = Schema.string();
  Schema.core.globalRegistry.add(schema, { description });
  Schema.core.globalRegistry.get(schema);
  expect(Schema.description).toEqual(description);
});

// in Schema 4 descriptions are not inherited
// test("description should carry over to chained schemas", () => {
//   const schema = Schema.string().describe(description);
//   expect(Schema.description).toEqual(description);
//   expect(Schema.optional().description).toEqual(description);
//   expect(Schema.optional().nullable().default("default").description).toEqual(description);
// });
