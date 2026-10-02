// This fixture tests @schema/mini's .d.cts types in a CommonJS context

import * as Schema from "@schema/mini";

const userSchema = Schema.object({
  name: Schema.string(),
  age: Schema.number().check(Schema.int(), Schema.positive()),
  tags: Schema.array(Schema.string()),
});

type User = Schema.infer<typeof userSchema>;

const result = Schema.safeParse(userSchema, { name: "Alice", age: 30, tags: [] });

if (result.success) {
  const user: User = result.data;
  console.log(user.name);
}

export { userSchema };
