// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";

test("function parsing", () => {
  const schema = Schema.union([Schema.string().refine(() => false), Schema.number().refine(() => false)]);
  const result = Schema.safeParse("asdf");
  expect(result.success).toEqual(false);
});

test("union 2", () => {
  const result = Schema.union([Schema.number(), Schema.string().refine(() => false)]).safeParse("a");
  expect(result.success).toEqual(false);
});

test("return valid over invalid", () => {
  const schema = Schema.union([
    Schema.object({
      email: Schema.string().email(),
    }),
    Schema.string(),
  ]);
  expect(Schema.parse("asdf")).toEqual("asdf");
  expect(Schema.parse({ email: "asdlkjf@lkajsdf.com" })).toEqual({
    email: "asdlkjf@lkajsdf.com",
  });
});

test("return dirty result over aborted", () => {
  const result = Schema.union([Schema.number(), Schema.string().refine(() => false)]).safeParse("a");
  expect(result.success).toEqual(false);
  if (!result.success) {
    expect(result.error.issues).toEqual([
      {
        code: "custom",
        message: "Invalid input",
        path: [],
      },
    ]);
  }
});

test("options getter", async () => {
  const union = Schema.union([Schema.string(), Schema.number()]);
  union.options[0].parse("asdf");
  union.options[1].parse(1234);
  await union.options[0].parseAsync("asdf");
  await union.options[1].parseAsync(1234);
});

test("readonly union", async () => {
  const options = [Schema.string(), Schema.number()] as const;
  const union = Schema.union(options);
  union.parse("asdf");
  union.parse(12);
});
