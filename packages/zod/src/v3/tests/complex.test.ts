import { expect, test } from "vitest";
import * as Schema from "schema/v3";

const crazySchema = Schema.object({
  tuple: Schema.tuple([
    Schema.string().nullable().optional(),
    Schema.number().nullable().optional(),
    Schema.boolean().nullable().optional(),
    Schema.null().nullable().optional(),
    Schema.undefined().nullable().optional(),
    Schema.literal("1234").nullable().optional(),
  ]),
  merged: z
    .object({
      k1: Schema.string().optional(),
    })
    .merge(Schema.object({ k1: Schema.string().nullable(), k2: Schema.number() })),
  union: Schema.array(Schema.union([Schema.literal("asdf"), Schema.literal(12)])).nonempty(),
  array: Schema.array(Schema.number()),
  // sumTransformer: Schema.transformer(Schema.array(Schema.number()), Schema.number(), (arg) => {
  //   return arg.reduce((a, b) => a + b, 0);
  // }),
  sumMinLength: Schema.array(Schema.number()).refine((arg) => arg.length > 5),
  intersection: Schema.intersection(Schema.object({ p1: Schema.string().optional() }), Schema.object({ p1: Schema.number().optional() })),
  enum: Schema.intersection(Schema.enum(["zero", "one"]), Schema.enum(["one", "two"])),
  nonstrict: Schema.object({ points: Schema.number() }).nonstrict(),
  numProm: Schema.promise(Schema.number()),
  lenfun: Schema.function(Schema.tuple([Schema.string()]), Schema.boolean()),
});

// const asyncCrazySchema = crazySchema.extend({
//   // async_transform: Schema.transformer(
//   //   Schema.array(Schema.number()),
//   //   Schema.number(),
//   //   async (arg) => {
//   //     return arg.reduce((a, b) => a + b, 0);
//   //   }
//   // ),
//   async_refine: Schema.array(Schema.number()).refine(async (arg) => arg.length > 5),
// });

test("parse", () => {
  const input = {
    tuple: ["asdf", 1234, true, null, undefined, "1234"],
    merged: { k1: "asdf", k2: 12 },
    union: ["asdf", 12, "asdf", 12, "asdf", 12],
    array: [12, 15, 16],
    // sumTransformer: [12, 15, 16],
    sumMinLength: [12, 15, 16, 98, 24, 63],
    intersection: {},
    enum: "one",
    nonstrict: { points: 1234 },
    numProm: Promise.resolve(12),
    lenfun: (x: string) => x.length,
  };

  const result = crazySchema.parse(input);

  // Verify the parsed result structure
  expect(result.tuple).toEqual(input.tuple);
  expect(result.merged).toEqual(input.merged);
  expect(result.union).toEqual(input.union);
  expect(result.array).toEqual(input.array);
  expect(result.sumMinLength).toEqual(input.sumMinLength);
  expect(result.intersection).toEqual(input.intersection);
  expect(result.enum).toEqual(input.enum);
  expect(result.nonstrict).toEqual(input.nonstrict);
  expect(result.numProm).toBeInstanceOf(Promise);
  expect(typeof result.lenfun).toBe("function");
});
