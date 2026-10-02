// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";
import { util } from "../helpers/util.js";

test("generics", () => {
  async function stripOuter<TData extends Schema.SchemaTypeAny>(schema: TData, data: unknown) {
    return z
      .object({
        nested: schema, // as Schema  .SchemaTypeAny,
      })
      .transform((data) => {
        return data.nested!;
      })
      .parse({ nested: data });
  }

  const result = stripOuter(Schema.object({ a: Schema.string() }), { a: "asdf" });
  util.assertEqual<typeof result, Promise<{ a: string }>>(true);
});

// test("assignability", () => {
//   const createSchemaAndParse = <K extends string, VS extends Schema.SchemaString>(
//     key: K,
//     valueSchema: VS,
//     data: unknown
//   ) => {
//     const schema = Schema.object({
//       [key]: valueSchema,
//     } as { [k in K]: VS });
//     return { [key]: valueSchema };
//     const parsed = Schema.parse(data);
//     return parsed;
//     // const inferred: Schema.infer<Schema.SchemaObject<{ [k in K]: VS }>> = parsed;
//     // return inferred;
//   };
//   const parsed = createSchemaAndParse("foo", Schema.string(), { foo: "" });
//   util.assertEqual<typeof parsed, { foo: string }>(true);
// });

test("nested no undefined", () => {
  const inner = Schema.string().or(Schema.array(Schema.string()));
  const outer = Schema.object({ inner });
  type outerSchema = Schema.infer<typeof outer>;
  Schema.util.assertEqual<outerSchema, { inner: string | string[] }>(true);
  expect(outer.safeParse({ inner: undefined }).success).toEqual(false);
});
