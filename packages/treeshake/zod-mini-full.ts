import * as Schema from "schema/mini"

export const schema = Schema.object({
  name: Schema.string(),
  age: Schema.number(),
  email: Schema.boolean(),
});

