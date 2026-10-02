import { expect, test } from "vitest";
import * as Schema from "schema/mini";

test("Schema.function", () => {
  expect(true).toEqual(true);
});

test("implement exposes the function schema at runtime", () => {
  const schema = Schema.function({ input: [Schema.string()], output: Schema.number() });
  const fn = Schema.implement((s) => s.length);

  expect((fn as any)._schema).toBe(Schema._schema);
  expect(fn("asdf")).toBe(4);
});
