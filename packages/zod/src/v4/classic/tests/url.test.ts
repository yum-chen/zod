import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";

test("type inference", () => {
  const schema = Schema.string().array();
  expectTypeOf<Schema.infer<typeof schema>>().toEqualTypeOf<string[]>();
});

test("url regex", () => {
  expect((Schema.url({ hostname: /^example\.com$/ }).safeParse("http://example.org/").error?.issues[0] as any).pattern).toBe(
    "^example\\.com$"
  );
});
