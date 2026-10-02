// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";
import { util } from "../helpers/util.js";

test("type guard", () => {
  const stringToNumber = Schema.string().transform((arg) => arg.length);

  const s1 = Schema.object({
    stringToNumber,
  });
  type t1 = Schema.input<typeof s1>;

  const data = { stringToNumber: "asdf" };
  const parsed = s1.safeParse(data);
  if (parsed.success) {
    util.assertEqual<typeof data, t1>(true);
  }
});

test("test this binding", () => {
  const callback = (predicate: (val: string) => boolean) => {
    return predicate("hello");
  };

  expect(callback((value) => Schema.string().safeParse(value).success)).toBe(true); // true
  expect(callback((value) => Schema.string().safeParse(value).success)).toBe(true); // true
});
