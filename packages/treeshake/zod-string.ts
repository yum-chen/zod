import * as Schema from "schema/v4";

const schema = Schema.string().min(5);
console.log(Schema.parse("hi"));

