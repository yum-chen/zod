import * as Schema from "valibot";

const schema = Schema.object({ a: Schema.string(), b: Schema.number(), c: Schema.boolean() });
console.log(
  Schema.parse(schema, {
    a: "asdf",
    b: 123,
    c: true,
  })
);
