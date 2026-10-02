import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";

enum testEnum {
  A = 0,
  B = 1,
}

test("flat inference", () => {
  const readonlyString = Schema.string().readonly();
  const readonlyNumber = Schema.number().readonly();
  const readonlyNaN = Schema.nan().readonly();
  const readonlyBigInt = Schema.bigint().readonly();
  const readonlyBoolean = Schema.boolean().readonly();
  const readonlyDate = Schema.date().readonly();
  const readonlyUndefined = Schema.undefined().readonly();
  const readonlyNull = Schema.null().readonly();
  const readonlyAny = Schema.any().readonly();
  const readonlyUnknown = Schema.unknown().readonly();
  const readonlyVoid = Schema.void().readonly();
  const readonlyStringArray = Schema.array(Schema.string()).readonly();
  const readonlyTuple = Schema.tuple([Schema.string(), Schema.number()]).readonly();
  const readonlyMap = Schema.map(Schema.string(), Schema.date()).readonly();
  const readonlySet = Schema.set(Schema.string()).readonly();
  const readonlyStringRecord = Schema.record(Schema.string(), Schema.string()).readonly();
  const readonlyNumberRecord = Schema.record(Schema.string(), Schema.number()).readonly();
  const readonlyObject = Schema.object({ a: Schema.string(), 1: Schema.number() }).readonly();
  const readonlyEnum = Schema.nativeEnum(testEnum).readonly();
  const readonlyPromise = Schema.promise(Schema.string()).readonly();

  expectTypeOf<typeof readonlyString._output>().toEqualTypeOf<string>();
  expectTypeOf<typeof readonlyNumber._output>().toEqualTypeOf<number>();
  expectTypeOf<typeof readonlyNaN._output>().toEqualTypeOf<number>();
  expectTypeOf<typeof readonlyBigInt._output>().toEqualTypeOf<bigint>();
  expectTypeOf<typeof readonlyBoolean._output>().toEqualTypeOf<boolean>();
  expectTypeOf<typeof readonlyDate._output>().toEqualTypeOf<Date>();
  expectTypeOf<typeof readonlyUndefined._output>().toEqualTypeOf<undefined>();
  expectTypeOf<typeof readonlyNull._output>().toEqualTypeOf<null>();
  expectTypeOf<typeof readonlyAny._output>().toEqualTypeOf<any>();
  expectTypeOf<typeof readonlyUnknown._output>().toEqualTypeOf<Readonly<unknown>>();
  expectTypeOf<typeof readonlyVoid._output>().toEqualTypeOf<void>();
  expectTypeOf<typeof readonlyStringArray._output>().toEqualTypeOf<readonly string[]>();
  expectTypeOf<typeof readonlyTuple._output>().toEqualTypeOf<readonly [string, number]>();
  expectTypeOf<typeof readonlyMap._output>().toEqualTypeOf<ReadonlyMap<string, Date>>();
  expectTypeOf<typeof readonlySet._output>().toEqualTypeOf<ReadonlySet<string>>();
  expectTypeOf<typeof readonlyStringRecord._output>().toEqualTypeOf<Readonly<Record<string, string>>>();
  expectTypeOf<typeof readonlyNumberRecord._output>().toEqualTypeOf<Readonly<Record<string, number>>>();
  expectTypeOf<typeof readonlyObject._output>().toEqualTypeOf<{ readonly a: string; readonly 1: number }>();
  expectTypeOf<typeof readonlyEnum._output>().toEqualTypeOf<Readonly<testEnum>>();
  expectTypeOf<typeof readonlyPromise._output>().toEqualTypeOf<Promise<string>>();
});

test("object freezing", async () => {
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

  expect(Object.isFrozen(Schema.record(Schema.string(), Schema.string()).readonly().parse({ a: "b" }))).toBe(true);
  expect(Object.isFrozen(Schema.record(Schema.string(), Schema.number()).readonly().parse({ a: 1 }))).toBe(true);
  expect(Object.isFrozen(Schema.object({ a: Schema.string(), 1: Schema.number() }).readonly().parse({ a: "b", 1: 2 }))).toBe(true);
  expect(
    Object.isFrozen(
      await z
        .set(Schema.promise(Schema.string()))
        .readonly()
        .parseAsync(new Set([Promise.resolve("a")]))
    )
  ).toBe(true);
  expect(Object.isFrozen(await Schema.promise(Schema.string()).readonly().parseAsync(Promise.resolve("a")))).toBe(true);
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
  expect(Object.isFrozen(await Schema.record(Schema.string(), Schema.string()).readonly().parseAsync({ a: "b" }))).toBe(true);
  expect(Object.isFrozen(await Schema.record(Schema.string(), Schema.number()).readonly().parseAsync({ a: 1 }))).toBe(true);
  expect(
    Object.isFrozen(await Schema.object({ a: Schema.string(), 1: Schema.number() }).readonly().parseAsync({ a: "b", 1: 2 }))
  ).toBe(true);
  expect(Object.isFrozen(await Schema.promise(Schema.string()).readonly().parseAsync(Promise.resolve("a")))).toBe(true);
});

test("readonly inference", () => {
  const readonlyStringArray = Schema.string().array().readonly();
  const readonlyStringTuple = Schema.tuple([Schema.string()]).readonly();
  const deepReadonly = Schema.object({ a: Schema.string() }).readonly();

  type readonlyStringArray = Schema.infer<typeof readonlyStringArray>;
  type readonlyStringTuple = Schema.infer<typeof readonlyStringTuple>;
  type deepReadonly = Schema.infer<typeof deepReadonly>;

  expectTypeOf<readonlyStringArray>().toEqualTypeOf<readonly string[]>();
  expectTypeOf<readonlyStringTuple>().toEqualTypeOf<readonly [string]>();
  expectTypeOf<deepReadonly>().toEqualTypeOf<{ readonly a: string }>();
});

test("readonly parse", () => {
  const schema = Schema.array(Schema.string()).readonly();
  const readonlyArray = ["a", "b", "c"] as const;
  const mutableArray = ["a", "b", "c"];
  const result1 = Schema.parse(readonlyArray);
  const result2 = Schema.parse(mutableArray);
  expect(result1).toEqual(readonlyArray);
  expect(result2).toEqual(mutableArray);
});

test("readonly parse with tuples", () => {
  const schema = Schema.tuple([Schema.string(), Schema.number()]).readonly();
  Schema.parse(["a", 1]);
});

test("readonly and the get method", () => {
  const readonlyString = Schema.string().readonly();
  const readonlyNumber1 = Schema.number().readonly();
  const readonlyNumber2 = Schema.number().readonly();
  const readonlyBigInt = Schema.bigint().readonly();
  const readonlyBoolean = Schema.boolean().readonly();
  const readonlyDate = Schema.date().readonly();
  const readonlyUndefined = Schema.undefined().readonly();
  const readonlyNull = Schema.null().readonly();
  const readonlyAny = Schema.any().readonly();
  const readonlyUnknown = Schema.unknown().readonly();
  const readonlyVoid = Schema.void().readonly();
  // const readonlyFunction = Schema.function(Schema.tuple([Schema.string(), Schema.number()]), Schema.unknown()).readonly();
  const readonlyStringArray = Schema.string().array().readonly();
  const readonlyTuple = Schema.tuple([Schema.string(), Schema.number()]).readonly();

  expectTypeOf<Schema.infer<typeof readonlyString>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof readonlyNumber1>>().toEqualTypeOf<number>();
  expectTypeOf<Schema.infer<typeof readonlyNumber2>>().toEqualTypeOf<number>();
  expectTypeOf<Schema.infer<typeof readonlyBigInt>>().toEqualTypeOf<bigint>();
  expectTypeOf<Schema.infer<typeof readonlyBoolean>>().toEqualTypeOf<boolean>();
  expectTypeOf<Schema.infer<typeof readonlyDate>>().toEqualTypeOf<Date>();
  expectTypeOf<Schema.infer<typeof readonlyUndefined>>().toEqualTypeOf<undefined>();
  expectTypeOf<Schema.infer<typeof readonlyNull>>().toEqualTypeOf<null>();
  expectTypeOf<Schema.infer<typeof readonlyAny>>().toEqualTypeOf<any>();
  expectTypeOf<Schema.infer<typeof readonlyUnknown>>().toEqualTypeOf<Readonly<unknown>>();
  expectTypeOf<Schema.infer<typeof readonlyVoid>>().toEqualTypeOf<void>();
  // expectTypeOf<Schema.infer<typeof readonlyFunction>>().toEqualTypeOf<
  //   (args_0: string, args_1: number, ...args_2: unknown[]) => unknown
  // >();
  expectTypeOf<Schema.infer<typeof readonlyStringArray>>().toEqualTypeOf<readonly string[]>();
  expectTypeOf<Schema.infer<typeof readonlyTuple>>().toEqualTypeOf<readonly [string, number]>();

  expect(readonlyString.parse("asdf")).toEqual("asdf");
  expect(readonlyNumber1.parse(1234)).toEqual(1234);
  expect(readonlyNumber2.parse(1234)).toEqual(1234);
  const bigIntVal = BigInt(1);
  expect(readonlyBigInt.parse(bigIntVal)).toEqual(bigIntVal);
  expect(readonlyBoolean.parse(true)).toEqual(true);
  const dateVal = new Date();
  expect(readonlyDate.parse(dateVal)).toEqual(dateVal);
  expect(readonlyUndefined.parse(undefined)).toEqual(undefined);
  expect(readonlyNull.parse(null)).toEqual(null);
  expect(readonlyAny.parse("whatever")).toEqual("whatever");
  expect(readonlyUnknown.parse("whatever")).toEqual("whatever");
  expect(readonlyVoid.parse(undefined)).toEqual(undefined);
  // expect(readonlyFunction.parse(() => void 0)).toEqual(() => void 0);
  expect(readonlyStringArray.parse(["asdf"])).toEqual(["asdf"]);
  expect(readonlyTuple.parse(["asdf", 1234])).toEqual(["asdf", 1234]);
});
