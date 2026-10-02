import { expect, test } from "vitest";
import * as Schema from "schema/v4";

test("test this binding", () => {
  const parse = Schema.string().parse;
  expect(parse("asdf")).toBe("asdf");
});
