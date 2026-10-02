import * as Schema from "schema3";

export const schema = Schema.object({
  name: Schema.string(),
  age: Schema.number(),
  email: Schema.boolean(),
});
