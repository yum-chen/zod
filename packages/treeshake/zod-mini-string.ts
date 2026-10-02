import * as Schema from "schema/mini"

const schema = Schema.string().check(Schema.minLength(5));

console.log(Schema.parse("hi"));
