// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";
import { util } from "../helpers/util.js";

enum testEnum {
  A = 0,
  B = 1,
}

const schemas = [
  Schema.string().readonly(),
  Schema.number().readonly(),
  Schema.nan().readonly(),
  Schema.bigint().readonly(),
  Schema.boolean().readonly(),
  Schema.date().readonly(),
  Schema.undefined().readonly(),
  Schema.null().readonly(),
  Schema.any().readonly(),
  Schema.unknown().readonly(),
  Schema.void().readonly(),
  Schema.function().args(Schema.string(), Schema.number()).readonly(),

  Schema.array(Schema.string()).readonly(),
  Schema.tuple([Schema.string(), Schema.number()]).readonly(),
  Schema.map(Schema.string(), Schema.date()).readonly(),
  Schema.set(Schema.promise(Schema.string())).readonly(),
  Schema.record(Schema.string()).readonly(),
  Schema.record(Schema.string(), Schema.number()).readonly(),
  Schema.object({ a: Schema.string(), 1: Schema.number() }).readonly(),
  Schema.nativeEnum(testEnum).readonly(),
  Schema.promise(Schema.string()).readonly(),
] as const;

test("flat inference", () => {
  util.assertEqual<Schema.infer<(typeof schemas)[0]>, string>(true);
  util.assertEqual<Schema.infer<(typeof schemas)[1]>, number>(true);
  util.assertEqual<Schema.infer<(typeof schemas)[2]>, number>(true);
  util.assertEqual<Schema.infer<(typeof schemas)[3]>, bigint>(true);
  util.assertEqual<Schema.infer<(typeof schemas)[4]>, boolean>(true);
  util.assertEqual<Schema.infer<(typeof schemas)[5]>, Date>(true);
  util.assertEqual<Schema.infer<(typeof schemas)[6]>, undefined>(true);
  util.assertEqual<Schema.infer<(typeof schemas)[7]>, null>(true);
  util.assertEqual<Schema.infer<(typeof schemas)[8]>, any>(true);
  util.assertEqual<Schema.infer<(typeof schemas)[9]>, Readonly<unknown>>(true);
  util.assertEqual<Schema.infer<(typeof schemas)[10]>, void>(true);
  util.assertEqual<Schema.infer<(typeof schemas)[11]>, (args_0: string, args_1: number, ...args_2: unknown[]) => unknown>(
    true
  );
  util.assertEqual<Schema.infer<(typeof schemas)[12]>, readonly string[]>(true);

  util.assertEqual<Schema.infer<(typeof schemas)[13]>, readonly [string, number]>(true);
  util.assertEqual<Schema.infer<(typeof schemas)[14]>, ReadonlyMap<string, Date>>(true);
  util.assertEqual<Schema.infer<(typeof schemas)[15]>, ReadonlySet<Promise<string>>>(true);
  util.assertEqual<Schema.infer<(typeof schemas)[16]>, Readonly<Record<string, string>>>(true);
  util.assertEqual<Schema.infer<(typeof schemas)[17]>, Readonly<Record<string, number>>>(true);
  util.assertEqual<Schema.infer<(typeof schemas)[18]>, { readonly a: string; readonly 1: number }>(true);
  util.assertEqual<Schema.infer<(typeof schemas)[19]>, Readonly<testEnum>>(true);
  util.assertEqual<Schema.infer<(typeof schemas)[20]>, Promise<string>>(true);
});

test("object freezing", () => {
  expect(Object.isFrozen(Schema.array(Schema.string()).readonly().parse(["a"]))).toBe(true);
  expect(Object.isFrozen(Schema.tuple([Schema.string(), Schema.number()]).readonly().parse(["a", 1]))).toBe(true);
  expect(
    Object.isFrozen(
      z
        .map(Schema.string(), Schema.date())
        .readonly()
        .parse(new Map([["a", new Date()]]))
    )
  ).toBe(true);
  expect(
    Object.isFrozen(
      z
        .set(Schema.promise(Schema.string()))
        .readonly()
        .parse(new Set([Promise.resolve("a")]))
    )
  ).toBe(true);
  expect(Object.isFrozen(Schema.record(Schema.string()).readonly().parse({ a: "b" }))).toBe(true);
  expect(Object.isFrozen(Schema.record(Schema.string(), Schema.number()).readonly().parse({ a: 1 }))).toBe(true);
  expect(Object.isFrozen(Schema.object({ a: Schema.string(), 1: Schema.number() }).readonly().parse({ a: "b", 1: 2 }))).toBe(true);
  expect(Object.isFrozen(Schema.promise(Schema.string()).readonly().parse(Promise.resolve("a")))).toBe(true);
});

test("async object freezing", async () => {
  expect(Object.isFrozen(await Schema.array(Schema.string()).readonly().parseAsync(["a"]))).toBe(true);
  expect(Object.isFrozen(await Schema.tuple([Schema.string(), Schema.number()]).readonly().parseAsync(["a", 1]))).toBe(true);
  expect(
    Object.isFrozen(
      await z
        .map(Schema.string(), Schema.date())
        .readonly()
        .parseAsync(new Map([["a", new Date()]]))
    )
  ).toBe(true);
  expect(
    Object.isFrozen(
      await z
        .set(Schema.promise(Schema.string()))
        .readonly()
        .parseAsync(new Set([Promise.resolve("a")]))
    )
  ).toBe(true);
  expect(Object.isFrozen(await Schema.record(Schema.string()).readonly().parseAsync({ a: "b" }))).toBe(true);
  expect(Object.isFrozen(await Schema.record(Schema.string(), Schema.number()).readonly().parseAsync({ a: 1 }))).toBe(true);
  expect(
    Object.isFrozen(await Schema.object({ a: Schema.string(), 1: Schema.number() }).readonly().parseAsync({ a: "b", 1: 2 }))
  ).toBe(true);
  expect(Object.isFrozen(await Schema.promise(Schema.string()).readonly().parseAsync(Promise.resolve("a")))).toBe(true);
});
