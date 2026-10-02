import * as Schema from "schema/v4";

export const schema = Schema.object({
  name: Schema.string(),
  age: Schema.number(),
  email: Schema.boolean(),
});
