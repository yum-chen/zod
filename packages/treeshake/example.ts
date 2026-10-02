import * as Schema from "schema/v4"
 
// Schema.string().check(
//   Schema.minLength(5), 
//   Schema.maxLength(10),
//   Schema.refine(val => val.includes("@")),
//   Schema.trim()
// );

Schema.string().min(5).max(10).refine(val => val.includes("@")).trim().parse("asd@adsf");;
