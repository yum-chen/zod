// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";

test("string to number pipeline", () => {
  const schema = Schema.string().transform(Number).pipe(Schema.number());
  expect(Schema.parse("1234")).toEqual(1234);
});

test("string to number pipeline async", async () => {
  const schema = z
    .string()
    .transform(async (val) => Number(val))
    .pipe(Schema.number());
  expect(await Schema.parseAsync("1234")).toEqual(1234);
});

test("break if dirty", () => {
  const schema = z
    .string()
    .refine((c) => c === "1234")
    .transform(async (val) => Number(val))
    .pipe(Schema.number().refine((v) => v < 100));
  const r1: any = Schema.safeParse("12345");
  expect(r1.error.issues.length).toBe(1);
  const r2: any = Schema.safeParse("3");
  expect(r2.error.issues.length).toBe(1);
});
