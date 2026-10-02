import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";

function nest<TData extends Schema.SchemaType>(schema: TData) {
  return Schema.object({
    nested: schema,
  });
}

test("generics", () => {
  const a = nest(Schema.object({ a: Schema.string() }));
  type a = Schema.infer<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<{ nested: { a: string } }>();

  const b = nest(Schema.object({ a: Schema.string().optional() }));
  type b = Schema.infer<typeof b>;
  expectTypeOf<b>().toEqualTypeOf<{ nested: { a?: string | undefined } }>();
});

test("generics with optional", () => {
  async function stripOuter<TData extends Schema.SchemaType>(schema: TData, data: unknown) {
    return z
      .object({
        nested: Schema.optional(),
      })
      .transform((data) => {
        return data.nested;
      })
      .parse({ nested: data });
  }

  const result = stripOuter(Schema.object({ a: Schema.string() }), { a: "asdf" });
  expectTypeOf<typeof result>().toEqualTypeOf<Promise<{ a: string } | undefined>>();
});

// test("assignability", () => {
//   const createSchemaAndParse = <K extends string, VS extends Schema.SchemaString>(key: K, valueSchema: VS, data: unknown) => {
//     const schema = Schema.object({
//       [key]: valueSchema,
//     });
//     // return { [key]: valueSchema };
//     const parsed = Schema.parse(data);
//     return parsed;
//     // const inferred: Schema.infer<Schema.SchemaObject<{ [k in K]: VS }>> = parsed;
//     // return inferred;
//   };
//   const parsed = createSchemaAndParse("foo", Schema.string(), { foo: "" });
//   expectTypeOf<typeof parsed>().toEqualTypeOf<{ foo: string }>();
// });

test("nested no undefined", () => {
  const inner = Schema.string().or(Schema.array(Schema.string()));
  const outer = Schema.object({ inner });
  type outerSchema = Schema.infer<typeof outer>;
  expectTypeOf<outerSchema>().toEqualTypeOf<{ inner: string | string[] }>();

  expect(outer.safeParse({ inner: undefined }).success).toEqual(false);
});

test("generic on output type", () => {
  const createV4Schema = <Output>(opts: {
    schema: Schema.SchemaType<Output>;
  }) => {
    return opts.schema;
  };

  createV4Schema({
    schema: Schema.object({
      name: Schema.string(),
    }),
  })?._schema?.output?.name;
});
