// This fixture tests that @schema/mini's built types resolve onto the peer's
// declarations with no internal errors when compiled with skipLibCheck: false

import * as Schema from "@schema/mini";
import type * as zm from "schema/mini";

const userSchema = Schema.object({
  name: Schema.string(),
  age: Schema.number().check(Schema.int(), Schema.positive()),
  tags: Schema.array(Schema.string()),
  role: Schema.enum(["admin", "user", "guest"]),
  metadata: Schema.record(Schema.string(), Schema.unknown()),
});

type User = Schema.infer<typeof userSchema>;

const result = Schema.safeParse(userSchema, {
  name: "Alice",
  age: 30,
  tags: ["developer"],
  role: "admin",
  metadata: { foo: "bar" },
});

if (result.success) {
  const user: User = result.data;
  console.log(user.name);
}

// the scoped package and the subpath are one declaration tree
const _sameTree: zm.SchemaMiniObject = userSchema;

export { userSchema };
