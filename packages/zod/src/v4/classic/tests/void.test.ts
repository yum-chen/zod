import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";
test("void", () => {
  const v = Schema.void();
  v.parse(undefined);

  expect(() => v.parse(null)).toThrow();
  expect(() => v.parse("")).toThrow();

  type v = Schema.infer<typeof v>;
  expectTypeOf<v>().toEqualTypeOf<void>();
});
