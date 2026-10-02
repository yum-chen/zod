// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";
import { util } from "../helpers/util.js";
test("void", () => {
  const v = Schema.void();
  v.parse(undefined);

  expect(() => v.parse(null)).toThrow();
  expect(() => v.parse("")).toThrow();

  type v = Schema.infer<typeof v>;
  util.assertEqual<v, void>(true);
});
