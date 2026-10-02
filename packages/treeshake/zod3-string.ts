import * as Schema from "schema3";

const schema = Schema.string().min(5);
console.log(Schema.parse("hi"));
