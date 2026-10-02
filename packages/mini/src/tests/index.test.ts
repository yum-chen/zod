import { expect, expectTypeOf, test } from "vitest";
import * as zm from "schema/mini";
import * as mini from "../index.js";

test("re-exports schema/mini verbatim", () => {
  expect(Object.keys(mini).sort()).toEqual(Object.keys(zm).sort());
  expect(mini.string).toBe(zm.string);
  expect(mini.z).toBe(zm.z);
});

test("schemas are the peer's schema/mini schemas", () => {
  const schema = mini.object({ name: mini.string(), tags: mini.array(mini.string()) });
  expect(schema).toBeInstanceOf(zm.SchemaMiniObject);
  expect(zm.parse(schema, { name: "a", tags: [] })).toEqual({ name: "a", tags: [] });
  expectTypeOf(schema).toEqualTypeOf(zm.object({ name: zm.string(), tags: zm.array(zm.string()) }));
  expectTypeOf<mini.infer<typeof schema>>().toEqualTypeOf<{ name: string; tags: string[] }>();
});
