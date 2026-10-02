// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";
import { util } from "../helpers/util.js";

test("check any inference", () => {
  const t1 = Schema.any();
  t1.optional();
  t1.nullable();
  type t1 = Schema.infer<typeof t1>;
  util.assertEqual<t1, any>(true);
});

test("check unknown inference", () => {
  const t1 = Schema.unknown();
  t1.optional();
  t1.nullable();
  type t1 = Schema.infer<typeof t1>;
  util.assertEqual<t1, unknown>(true);
});

test("check never inference", () => {
  const t1 = Schema.never();
  expect(() => t1.parse(undefined)).toThrow();
  expect(() => t1.parse("asdf")).toThrow();
  expect(() => t1.parse(null)).toThrow();
});
