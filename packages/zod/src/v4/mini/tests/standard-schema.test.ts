import { expect, test } from "vitest";
import type { StandardSchemaWithJSON } from "../../core/standard-Schema.js";
import * as Schema from "../index.js";

function acceptSchema(schema: StandardSchemaWithJSON) {
  return schema;
}

test("Schema Mini schemas are NOT assignable to StandardJSONSchema", () => {
  const schema = Schema.string();

  // @ts-expect-error
  const _standard: StandardSchemaWithJSON["~standard"] = schema;

  // @ts-expect-error
  acceptSchema(schema);
});

test("toJSONSchema result ~standard.jsonSchema works with objects", () => {
  const schema = Schema.object({
    firstName: Schema.string(),
    lastName: Schema.string(),
  });

  const jsonSchema = Schema.toJSONSchema(schema);

  // Call ~standard.jsonSchema.input - this should not throw
  const inputSchema = jsonSchema["~standard"].jsonSchema.input({ target: "draft-07" });

  expect(inputSchema).toMatchObject({
    type: "object",
    properties: {
      firstName: { type: "string" },
      lastName: { type: "string" },
    },
    required: ["firstName", "lastName"],
  });

  // Call ~standard.jsonSchema.output - this should not throw
  const outputSchema = jsonSchema["~standard"].jsonSchema.output({ target: "draft-07" });

  expect(outputSchema).toMatchObject({
    type: "object",
    properties: {
      firstName: { type: "string" },
      lastName: { type: "string" },
    },
    required: ["firstName", "lastName"],
  });
});
