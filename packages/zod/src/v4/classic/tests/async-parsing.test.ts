import { expect, test } from "vitest";

import * as Schema from "schema/v4";

/// string
const stringSchema = Schema.string();

test("string async parse", async () => {
  const goodData = "XXX";
  const badData = 12;

  const goodResult = await stringSchema.safeParseAsync(goodData);
  expect(goodResult.success).toBe(true);
  if (goodResult.success) expect(goodResult.data).toEqual(goodData);

  const badResult = await stringSchema.safeParseAsync(badData);
  expect(badResult.success).toBe(false);
  if (!badResult.success) expect(badResult.error).toBeInstanceOf(Schema.SchemaError);
});

/// number
const numberSchema = Schema.number();
test("number async parse", async () => {
  const goodData = 1234.2353;
  const badData = "1234";

  const goodResult = await numberSchema.safeParseAsync(goodData);
  expect(goodResult.success).toBe(true);
  if (goodResult.success) expect(goodResult.data).toEqual(goodData);

  const badResult = await numberSchema.safeParseAsync(badData);
  expect(badResult.success).toBe(false);
  if (!badResult.success) expect(badResult.error).toBeInstanceOf(Schema.SchemaError);
});

/// bigInt
const bigIntSchema = Schema.bigint();
test("bigInt async parse", async () => {
  const goodData = BigInt(145);
  const badData = 134;

  const goodResult = await bigIntSchema.safeParseAsync(goodData);
  expect(goodResult.success).toBe(true);
  if (goodResult.success) expect(goodResult.data).toEqual(goodData);

  const badResult = await bigIntSchema.safeParseAsync(badData);
  expect(badResult.success).toBe(false);
  if (!badResult.success) expect(badResult.error).toBeInstanceOf(Schema.SchemaError);
});

/// boolean
const booleanSchema = Schema.boolean();
test("boolean async parse", async () => {
  const goodData = true;
  const badData = 1;

  const goodResult = await booleanSchema.safeParseAsync(goodData);
  expect(goodResult.success).toBe(true);
  if (goodResult.success) expect(goodResult.data).toEqual(goodData);

  const badResult = await booleanSchema.safeParseAsync(badData);
  expect(badResult.success).toBe(false);
  if (!badResult.success) expect(badResult.error).toBeInstanceOf(Schema.SchemaError);
});

/// date
const dateSchema = Schema.date();
test("date async parse", async () => {
  const goodData = new Date();
  const badData = new Date().toISOString();

  const goodResult = await dateSchema.safeParseAsync(goodData);
  expect(goodResult.success).toBe(true);
  if (goodResult.success) expect(goodResult.data).toEqual(goodData);

  const badResult = await dateSchema.safeParseAsync(badData);
  expect(badResult.success).toBe(false);
  if (!badResult.success) expect(badResult.error).toBeInstanceOf(Schema.SchemaError);
});

/// undefined
const undefinedSchema = Schema.undefined();
test("undefined async parse", async () => {
  const goodData = undefined;
  const badData = "XXX";

  const goodResult = await undefinedSchema.safeParseAsync(goodData);
  expect(goodResult.success).toBe(true);
  if (goodResult.success) expect(goodResult.data).toEqual(undefined);

  const badResult = await undefinedSchema.safeParseAsync(badData);
  expect(badResult.success).toBe(false);
  if (!badResult.success) expect(badResult.error).toBeInstanceOf(Schema.SchemaError);
});

/// null
const nullSchema = Schema.null();
test("null async parse", async () => {
  const goodData = null;
  const badData = undefined;

  const goodResult = await nullSchema.safeParseAsync(goodData);
  expect(goodResult.success).toBe(true);
  if (goodResult.success) expect(goodResult.data).toEqual(goodData);

  const badResult = await nullSchema.safeParseAsync(badData);
  expect(badResult.success).toBe(false);
  if (!badResult.success) expect(badResult.error).toBeInstanceOf(Schema.SchemaError);
});

/// any
const anySchema = Schema.any();
test("any async parse", async () => {
  const goodData = [{}];
  // const badData = 'XXX';

  const goodResult = await anySchema.safeParseAsync(goodData);
  expect(goodResult.success).toBe(true);
  if (goodResult.success) expect(goodResult.data).toEqual(goodData);

  // const badResult = await anySchema.safeParseAsync(badData);
  // expect(badResult.success).toBe(false);
  // if (!badResult.success) expect(badResult.error).toBeInstanceOf(Schema.SchemaError);
});

/// unknown
const unknownSchema = Schema.unknown();
test("unknown async parse", async () => {
  const goodData = ["asdf", 124, () => {}];
  // const badData = 'XXX';

  const goodResult = await unknownSchema.safeParseAsync(goodData);
  expect(goodResult.success).toBe(true);
  if (goodResult.success) expect(goodResult.data).toEqual(goodData);

  // const badResult = await unknownSchema.safeParseAsync(badData);
  // expect(badResult.success).toBe(false);
  // if (!badResult.success) expect(badResult.error).toBeInstanceOf(Schema.SchemaError);
});

/// void
const voidSchema = Schema.void();
test("void async parse", async () => {
  const goodData = undefined;
  const badData = 0;

  const goodResult = await voidSchema.safeParseAsync(goodData);
  expect(goodResult.success).toBe(true);
  if (goodResult.success) expect(goodResult.data).toEqual(goodData);

  const badResult = await voidSchema.safeParseAsync(badData);
  expect(badResult.success).toBe(false);
  if (!badResult.success) expect(badResult.error).toBeInstanceOf(Schema.SchemaError);
});

/// array
const arraySchema = Schema.array(Schema.string());
test("array async parse", async () => {
  const goodData = ["XXX"];
  const badData = "XXX";

  const goodResult = await arraySchema.safeParseAsync(goodData);
  expect(goodResult.success).toBe(true);
  if (goodResult.success) expect(goodResult.data).toEqual(goodData);

  const badResult = await arraySchema.safeParseAsync(badData);
  expect(badResult.success).toBe(false);
  if (!badResult.success) expect(badResult.error).toBeInstanceOf(Schema.SchemaError);
});

/// object
const objectSchema = Schema.object({ string: Schema.string() });
test("object async parse", async () => {
  const goodData = { string: "XXX" };
  const badData = { string: 12 };

  const goodResult = await objectSchema.safeParseAsync(goodData);
  expect(goodResult.success).toBe(true);
  if (goodResult.success) expect(goodResult.data).toEqual(goodData);

  const badResult = await objectSchema.safeParseAsync(badData);
  expect(badResult.success).toBe(false);
  if (!badResult.success) expect(badResult.error).toBeInstanceOf(Schema.SchemaError);
});

/// union
const unionSchema = Schema.union([Schema.string(), Schema.undefined()]);
test("union async parse", async () => {
  const goodData = undefined;
  const badData = null;

  const goodResult = await unionSchema.safeParseAsync(goodData);
  expect(goodResult.success).toBe(true);
  if (goodResult.success) expect(goodResult.data).toEqual(goodData);

  const badResult = await unionSchema.safeParseAsync(badData);
  expect(badResult.success).toBe(false);
  if (!badResult.success) expect(badResult.error).toBeInstanceOf(Schema.SchemaError);
});

/// record
const recordSchema = Schema.record(Schema.string(), Schema.object({}));
test("record async parse", async () => {
  const goodData = { adsf: {}, asdf: {} };
  const badData = [{}];

  const goodResult = await recordSchema.safeParseAsync(goodData);
  expect(goodResult.success).toBe(true);
  if (goodResult.success) expect(goodResult.data).toEqual(goodData);

  const badResult = await recordSchema.safeParseAsync(badData);
  expect(badResult.success).toBe(false);
  if (!badResult.success) expect(badResult.error).toBeInstanceOf(Schema.SchemaError);
});

/// function
// const functionSchema = Schema.function();
// test("function async parse", async () => {
//   const goodData = () => {};
//   const badData = "XXX";

//   const goodResult = await functionSchema.safeParseAsync(goodData);
//   expect(goodResult.success).toBe(true);
//   if (goodResult.success) expect(typeof goodResult.data).toEqual("function");

//   const badResult = await functionSchema.safeParseAsync(badData);
//   expect(badResult.success).toBe(false);
//   if (!badResult.success) expect(badResult.error).toBeInstanceOf(Schema.SchemaError);
// });

/// literal
const literalSchema = Schema.literal("asdf");
test("literal async parse", async () => {
  const goodData = "asdf";
  const badData = "asdff";

  const goodResult = await literalSchema.safeParseAsync(goodData);
  expect(goodResult.success).toBe(true);
  if (goodResult.success) expect(goodResult.data).toEqual(goodData);

  const badResult = await literalSchema.safeParseAsync(badData);
  expect(badResult.success).toBe(false);
  if (!badResult.success) expect(badResult.error).toBeInstanceOf(Schema.SchemaError);
});

/// enum
const enumSchema = Schema.enum(["fish", "whale"]);
test("enum async parse", async () => {
  const goodData = "whale";
  const badData = "leopard";

  const goodResult = await enumSchema.safeParseAsync(goodData);
  expect(goodResult.success).toBe(true);
  if (goodResult.success) expect(goodResult.data).toEqual(goodData);

  const badResult = await enumSchema.safeParseAsync(badData);
  expect(badResult.success).toBe(false);
  if (!badResult.success) expect(badResult.error).toBeInstanceOf(Schema.SchemaError);
});

/// nativeEnum
enum nativeEnumTest {
  asdf = "qwer",
}
// @ts-ignore
const nativeEnumSchema = Schema.nativeEnum(nativeEnumTest);
test("nativeEnum async parse", async () => {
  const goodData = nativeEnumTest.asdf;
  const badData = "asdf";

  const goodResult = await nativeEnumSchema.safeParseAsync(goodData);
  expect(goodResult.success).toBe(true);
  if (goodResult.success) expect(goodResult.data).toEqual(goodData);

  const badResult = await nativeEnumSchema.safeParseAsync(badData);
  expect(badResult.success).toBe(false);
  if (!badResult.success) expect(badResult.error).toBeInstanceOf(Schema.SchemaError);
});

/// promise
const promiseSchema = Schema.promise(Schema.number());
test("promise async parse good", async () => {
  const goodData = Promise.resolve(123);

  const goodResult = await promiseSchema.safeParseAsync(goodData);
  expect(goodResult.success).toBe(true);
  expect(typeof goodResult.data).toEqual("number");
  expect(goodResult.data).toEqual(123);
});

test("promise async parse bad", async () => {
  const badData = Promise.resolve("XXX");
  const badResult = await promiseSchema.safeParseAsync(badData);
  expect(badResult.success).toBe(false);
  expect(badResult.error).toBeInstanceOf(Schema.SchemaError);
});

test("async validation non-empty strings", async () => {
  const base = Schema.object({
    hello: Schema.string().refine((x) => x && x.length > 0),
    foo: Schema.string().refine((x) => x && x.length > 0),
  });

  const testval = { hello: "", foo: "" };
  const result1 = base.safeParse(testval);
  const result2 = base.safeParseAsync(testval);

  const r1 = result1;
  await result2.then((r2) => {
    expect(r1.error!.issues.length).toBe(r2.error!.issues.length);
  });
});

test("async validation multiple errors 1", async () => {
  const base = Schema.object({
    hello: Schema.string(),
    foo: Schema.number(),
  });

  const testval = { hello: 3, foo: "hello" };
  const result1 = base.safeParse(testval);
  const result2 = base.safeParseAsync(testval);

  await result2.then((result2) => {
    expect(result2.error!.issues.length).toBe(result1.error!.issues.length);
  });
});

test("async validation multiple errors 2", async () => {
  const base = (is_async?: boolean) =>
    Schema.object({
      hello: Schema.string(),
      foo: Schema.object({
        bar: Schema.number().refine(
          is_async
            ? async () =>
                new Promise((resolve) => {
                  setTimeout(() => resolve(false), 500);
                })
            : () => false
        ),
      }),
    });

  const testval = { hello: 3, foo: { bar: 4 } };
  const result1 = base().safeParse(testval);
  const result2 = base(true).safeParseAsync(testval);

  await result2.then((result2) => {
    expect(result1.error!.issues.length).toBe(result2.error!.issues.length);
  });
});

test("ensure early async failure prevents follow-up refinement checks", async () => {
  let count = 0;
  const base = Schema.object({
    hello: Schema.string(),
    foo: z
      .number()
      .refine(async () => {
        count++;
        return true;
      })
      .refine(async () => {
        count++;
        return true;
      }, "Good"),
  });

  const testval = { hello: "bye", foo: 3 };
  const result = await base.safeParseAsync(testval);
  if (result.success === false) {
    expect(result.error.issues.length).toBe(1);
    expect(count).toBe(1);
  }

  // await result.then((r) => {
  //   if (r.success === false) expect(r.error.issues.length).toBe(1);
  //   expect(count).toBe(2);
  // });
});
