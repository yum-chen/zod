import * as Schema from "schema3";

const schema = Schema.object({ a: Schema.string(), b: Schema.number(), c: Schema.boolean() });

Schema.parse({
  a: "asdf",
  b: 123,
  c: true,
});
