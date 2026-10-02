import * as Schema from "schema/mini"
 
Schema.string().check(
  Schema.minLength(5), 
  Schema.maxLength(10),
  Schema.refine(val => val.includes("@")),
  Schema.trim()
).parse("asd@adsf");
