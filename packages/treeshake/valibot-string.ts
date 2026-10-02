import * as Schema from "valibot";

const schema = Schema.pipe(Schema.string(), Schema.minLength(1));
console.log(Schema.parse(schema, "hi"));
