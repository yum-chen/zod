import * as Schema from "schema/mini"

const schema = Schema.object({ a: Schema.string(), b: Schema.number(), c: Schema.boolean() });

Schema.parse({
  a: "asdf",
  b: 123,
  c: true,
});
