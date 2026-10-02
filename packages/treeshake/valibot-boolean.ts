import * as Schema from "valibot";

const schema = Schema.boolean()
console.log(Schema.parse(schema, "hi"));
