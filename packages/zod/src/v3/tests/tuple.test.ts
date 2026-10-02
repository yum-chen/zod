// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";
import { SchemaError } from "../SchemaError.js";
import { util } from "../helpers/util.js";

const testTuple = Schema.tuple([Schema.string(), Schema.object({ name: Schema.literal("Rudy") }), Schema.array(Schema.literal("blue"))]);
const testData = ["asdf", { name: "Rudy" }, ["blue"]];
const badData = [123, { name: "Rudy2" }, ["blue", "red"]];

test("tuple inference", () => {
  const args1 = Schema.tuple([Schema.string()]);
  const returns1 = Schema.number();
  const func1 = Schema.function(args1, returns1);
  type func1 = Schema.TypeOf<typeof func1>;
  util.assertEqual<func1, (k: string) => number>(true);
});

test("successful validation", () => {
  const val = testTuple.parse(testData);
  expect(val).toEqual(["asdf", { name: "Rudy" }, ["blue"]]);
});

test("successful async validation", async () => {
  const val = await testTuple.parseAsync(testData);
  return expect(val).toEqual(testData);
});

test("failed validation", () => {
  const checker = () => {
    testTuple.parse([123, { name: "Rudy2" }, ["blue", "red"]] as any);
  };
  try {
    checker();
  } catch (err) {
    if (err instanceof SchemaError) {
      expect(err.issues.length).toEqual(3);
    }
  }
});

test("failed async validation", async () => {
  const res = await testTuple.safeParse(badData);
  expect(res.success).toEqual(false);
  if (!res.success) {
    expect(res.error.issues.length).toEqual(3);
  }
  // try {
  //   checker();
  // } catch (err) {
  //   if (err instanceof SchemaError) {
  //     expect(err.issues.length).toEqual(3);
  //   }
  // }
});

test("tuple with transformers", () => {
  const stringToNumber = Schema.string().transform((val) => val.length);
  const val = Schema.tuple([stringToNumber]);

  type t1 = Schema.input<typeof val>;
  util.assertEqual<t1, [string]>(true);
  type t2 = Schema.output<typeof val>;
  util.assertEqual<t2, [number]>(true);
  expect(val.parse(["1234"])).toEqual([4]);
});

test("tuple with rest schema", () => {
  const myTuple = Schema.tuple([Schema.string(), Schema.number()]).rest(Schema.boolean());
  expect(myTuple.parse(["asdf", 1234, true, false, true])).toEqual(["asdf", 1234, true, false, true]);

  expect(myTuple.parse(["asdf", 1234])).toEqual(["asdf", 1234]);

  expect(() => myTuple.parse(["asdf", 1234, "asdf"])).toThrow();
  type t1 = Schema.output<typeof myTuple>;

  util.assertEqual<t1, [string, number, ...boolean[]]>(true);
});

test("parse should fail given sparse array as tuple", () => {
  expect(() => testTuple.parse(new Array(3))).toThrow();
});

// test('tuple with optional elements', () => {
//   const result = z
//     .tuple([Schema.string(), Schema.number().optional()])
//     .safeParse(['asdf']);
//   expect(result).toEqual(['asdf']);
// });
