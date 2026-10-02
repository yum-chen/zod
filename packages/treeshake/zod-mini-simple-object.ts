import * as Schema from "schema/mini"; // 6.57 kB

const Schema = Schema.object({
  email: z
    .string()
    .check(
      Schema.minLength(1, "Please enter your email."),
      Schema.email("The email address is badly formatted.")
    ),
  password: Schema.string()
    .check(
      Schema.minLength(1, "Please enter your password."),
      Schema.minLength(8, "Your password must have 8 characters or more.")
    ),
});


Schema.parse({});
