import { expect, test } from "vitest";

test("coalesce", () => {
  expect(true).toBe(true);
});

// test("nonoptional with default", () => {
//   const schema = Schema.string().optional().coalesce("hi");
//   expectTypeOf<typeof Schema._input>().toEqualTypeOf<string | undefined>();
//   expectTypeOf<typeof Schema._output>().toEqualTypeOf<string>();
//   expect(Schema.parse(undefined)).toBe("hi");
// });

// test("nonoptional in object", () => {
//   const schema = Schema.object({ hi: Schema.string().optional().nonoptional("hi") });

//   expectTypeOf<typeof Schema._input>().toEqualTypeOf<{ hi: string | undefined }>();
//   expectTypeOf<typeof Schema._output>().toEqualTypeOf<{ hi: string }>();
//   expect(Schema.parse(undefined)).toBe("hi");
// });
