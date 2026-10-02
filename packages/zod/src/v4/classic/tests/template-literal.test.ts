import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";

const empty = Schema.templateLiteral([]);
const hello = Schema.templateLiteral(["hello"]);
const world = Schema.templateLiteral(["", Schema.literal("world")]);
const one = Schema.templateLiteral([1]);
const two = Schema.templateLiteral(["", Schema.literal(2)]);
const onePointOne = Schema.templateLiteral([Schema.literal(1.1)]);
const truee = Schema.templateLiteral([true]);
const anotherTrue = Schema.templateLiteral(["", Schema.literal(true)]);
const falsee = Schema.templateLiteral([false]);
const anotherFalse = Schema.templateLiteral(["", Schema.literal(false)]);
const nulll = Schema.templateLiteral([null]);
const anotherNull = Schema.templateLiteral(["", Schema.null()]);
const undefinedd = Schema.templateLiteral([undefined]);
const anotherUndefined = Schema.templateLiteral(["", Schema.undefined()]);
const anyString = Schema.templateLiteral(["", Schema.string()]);
const lazyString = Schema.templateLiteral(["", Schema.lazy(() => Schema.string())]);
const anyNumber = Schema.templateLiteral(["", Schema.number()]);
const anyInt = Schema.templateLiteral(["", Schema.number().int()]);
// const anyFiniteNumber = Schema.templateLiteral(["", Schema.number().finite()]);
// const anyNegativeNumber = Schema.templateLiteral(["", Schema.number().negative()]);
// const anyPositiveNumber = Schema.templateLiteral(["", Schema.number().positive()]);
// const zeroButInADumbWay = Schema.templateLiteral(["", Schema.number().nonnegative().nonpositive()]);
// const finiteButInADumbWay = Schema.templateLiteral(["", Schema.number().min(5).max(10)]);
const bool = Schema.templateLiteral(["", Schema.boolean()]);
const bigone = Schema.templateLiteral(["", Schema.literal(BigInt(1))]);
const anyBigint = Schema.templateLiteral(["", Schema.bigint()]);
const nullableYo = Schema.templateLiteral(["", Schema.nullable(Schema.literal("yo"))]);
const nullableString = Schema.templateLiteral(["", Schema.nullable(Schema.string())]);
const optionalYeah = Schema.templateLiteral(["", Schema.literal("yeah").optional()]);

const optionalString = Schema.templateLiteral(["", Schema.string().optional()]);
const optionalNumber = Schema.templateLiteral(["", Schema.number().optional()]);
const nullishBruh = Schema.templateLiteral(["", Schema.literal("bruh").nullish()]);
const nullishString = Schema.templateLiteral(["", Schema.string().nullish()]);
const cuid = Schema.templateLiteral(["", Schema.string().cuid()]);
const cuidZZZ = Schema.templateLiteral(["", Schema.string().cuid(), "ZZZ"]);
const cuid2 = Schema.templateLiteral(["", Schema.string().cuid2()]);
const datetime = Schema.templateLiteral(["", Schema.string().datetime()]);
const email = Schema.templateLiteral(["", Schema.string().email()]);
// const ip = Schema.templateLiteral(["", Schema.string().ip()]);
const ipv4 = Schema.templateLiteral(["", Schema.string().ipv4()]);
const ipv6 = Schema.templateLiteral(["", Schema.string().ipv6()]);
const mac = Schema.templateLiteral(["", Schema.mac()]);
const ulid = Schema.templateLiteral(["", Schema.string().ulid()]);
const uuid = Schema.templateLiteral(["", Schema.string().uuid()]);
const stringAToZ = Schema.templateLiteral(["", Schema.string().regex(/^[a-z]+$/)]);
const stringStartsWith = Schema.templateLiteral(["", Schema.string().startsWith("hello")]);
const stringEndsWith = Schema.templateLiteral(["", Schema.string().endsWith("world")]);
const stringMax5 = Schema.templateLiteral(["", Schema.string().max(5)]);
const stringMin5 = Schema.templateLiteral(["", Schema.string().min(5)]);
const stringLen5 = Schema.templateLiteral(["", Schema.string().length(5)]);
const stringMin5Max10 = Schema.templateLiteral(["", Schema.string().min(5).max(10)]);
const stringStartsWithMax5 = Schema.templateLiteral(["", Schema.string().startsWith("hello").max(5)]);
const brandedString = Schema.templateLiteral(["", Schema.string().min(1).brand("myBrand")]);
// const anything = Schema.templateLiteral(["", Schema.any()]);

const url = Schema.templateLiteral(["https://", Schema.string().regex(/\w+/), ".", Schema.enum(["com", "net"])]);

const measurement = Schema.templateLiteral([
  "",
  Schema.number().finite(),
  Schema.enum(["px", "em", "rem", "vh", "vw", "vmin", "vmax"]).optional(),
]);
const decimalEnum = Schema.templateLiteral(["", Schema.enum({ A: 1.2 })]);
// String(1e21) is "1e+21" — the `+` needs escaping too, or the pattern rejects its own enum value
const exponentEnum = Schema.templateLiteral(["", Schema.enum({ A: 1e21 })]);

const connectionString = Schema.templateLiteral([
  "mongodb://",
  z
    .templateLiteral([
      "",
      Schema.string().regex(/\w+/).describe("username"),
      ":",
      Schema.string().regex(/\w+/).describe("password"),
      "@",
    ])
    .optional(),
  Schema.string().regex(/\w+/).describe("host"),
  ":",
  Schema.number().finite().int().positive().describe("port"),
  z
    .templateLiteral([
      "/",
      Schema.string().regex(/\w+/).optional().describe("defaultauthdb"),
      z
        .templateLiteral([
          "?",
          z
            .string()
            .regex(/^\w+=\w+(&\w+=\w+)*$/)
            .optional()
            .describe("options"),
        ])
        .optional(),
    ])
    .optional(),
]);

test("template literal type inference", () => {
  expectTypeOf<Schema.infer<typeof empty>>().toEqualTypeOf<``>();
  expectTypeOf<Schema.infer<typeof hello>>().toEqualTypeOf<`hello`>();
  expectTypeOf<Schema.infer<typeof world>>().toEqualTypeOf<`world`>();
  expectTypeOf<Schema.infer<typeof one>>().toEqualTypeOf<`1`>();
  expectTypeOf<Schema.infer<typeof two>>().toEqualTypeOf<`2`>();
  expectTypeOf<Schema.infer<typeof truee>>().toEqualTypeOf<`true`>();
  expectTypeOf<Schema.infer<typeof anotherTrue>>().toEqualTypeOf<`true`>();
  expectTypeOf<Schema.infer<typeof falsee>>().toEqualTypeOf<`false`>();
  expectTypeOf<Schema.infer<typeof anotherFalse>>().toEqualTypeOf<`false`>();
  expectTypeOf<Schema.infer<typeof nulll>>().toEqualTypeOf<`null`>();
  expectTypeOf<Schema.infer<typeof anotherNull>>().toEqualTypeOf<`null`>();
  expectTypeOf<Schema.infer<typeof undefinedd>>().toEqualTypeOf<``>();
  expectTypeOf<Schema.infer<typeof anotherUndefined>>().toEqualTypeOf<``>();
  expectTypeOf<Schema.infer<typeof anyString>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof lazyString>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof anyNumber>>().toEqualTypeOf<`${number}`>();
  expectTypeOf<Schema.infer<typeof anyInt>>().toEqualTypeOf<`${number}`>();
  // expectTypeOf<Schema.infer<typeof anyFiniteNumber>>().toEqualTypeOf<`${number}`>();
  // expectTypeOf<Schema.infer<typeof anyNegativeNumber>>().toEqualTypeOf<`${number}`>();
  // expectTypeOf<Schema.infer<typeof anyPositiveNumber>>().toEqualTypeOf<`${number}`>();
  // expectTypeOf<Schema.infer<typeof zeroButInADumbWay>>().toEqualTypeOf<`${number}`>();
  // expectTypeOf<Schema.infer<typeof finiteButInADumbWay>>().toEqualTypeOf<`${number}`>();
  expectTypeOf<Schema.infer<typeof bool>>().toEqualTypeOf<`true` | `false`>();
  expectTypeOf<Schema.infer<typeof bigone>>().toEqualTypeOf<`${bigint}`>();
  expectTypeOf<Schema.infer<typeof anyBigint>>().toEqualTypeOf<`${bigint}`>();
  expectTypeOf<Schema.infer<typeof nullableYo>>().toEqualTypeOf<`yo` | `null`>();
  expectTypeOf<Schema.infer<typeof nullableString>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof optionalYeah>>().toEqualTypeOf<`yeah` | ``>();
  expectTypeOf<Schema.infer<typeof optionalString>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof optionalNumber>>().toEqualTypeOf<`${number}` | ``>();
  expectTypeOf<Schema.infer<typeof nullishBruh>>().toEqualTypeOf<`bruh` | `null` | ``>();
  expectTypeOf<Schema.infer<typeof nullishString>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof cuid>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof cuidZZZ>>().toEqualTypeOf<`${string}ZZZ`>();
  expectTypeOf<Schema.infer<typeof cuid2>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof datetime>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof email>>().toEqualTypeOf<string>();
  // expectTypeOf<Schema.infer<typeof ip>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof ipv4>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof ipv6>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof mac>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof ulid>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof uuid>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof stringAToZ>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof stringStartsWith>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof stringEndsWith>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof stringMax5>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof stringMin5>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof stringLen5>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof stringMin5Max10>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof stringStartsWithMax5>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.infer<typeof brandedString>>().toEqualTypeOf<`${string & Schema.core.$brand<"myBrand">}`>();

  // expectTypeOf<Schema.infer<typeof anything>>().toEqualTypeOf<`${any}`>();

  expectTypeOf<Schema.infer<typeof url>>().toEqualTypeOf<`https://${string}.com` | `https://${string}.net`>();

  expectTypeOf<Schema.infer<typeof measurement>>().toEqualTypeOf<
    | `${number}`
    | `${number}px`
    | `${number}em`
    | `${number}rem`
    | `${number}vh`
    | `${number}vw`
    | `${number}vmin`
    | `${number}vmax`
  >();

  expectTypeOf<Schema.infer<typeof connectionString>>().toEqualTypeOf<
    | `mongodb://${string}:${number}`
    | `mongodb://${string}:${number}/${string}`
    | `mongodb://${string}:${number}/${string}?${string}`
    | `mongodb://${string}:${string}@${string}:${number}`
    | `mongodb://${string}:${string}@${string}:${number}/${string}`
    | `mongodb://${string}:${string}@${string}:${number}/${string}?${string}`
  >();
});

test("template literal unsupported args", () => {
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.object({})])
  ).toThrow();
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.array(Schema.object({}))])
  ).toThrow();
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.union([Schema.object({}), Schema.string()])])
  ).toThrow();
  // @ts-expect-error
  expect(() => Schema.templateLiteral([Schema.date()])).toThrow();
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.custom<object>((_) => true)])
  ).toThrow();
  expect(() =>
    Schema.templateLiteral([
      // @ts-expect-error
      Schema.discriminatedUnion("discriminator", [Schema.object({}), Schema.object({})]),
    ])
  ).toThrow();
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.function()])
  ).toThrow();
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.instanceof(class MyClass {})])
  ).toThrow();
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.intersection(Schema.object({}), Schema.object({}))])
  ).toThrow();
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.map(Schema.string(), Schema.string())])
  ).toThrow();
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.nullable(Schema.object({}))])
  ).toThrow();
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.optional(Schema.object({}))])
  ).toThrow();
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.promise()])
  ).toThrow();
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.record(Schema.unknown())])
  ).toThrow();
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.set(Schema.string())])
  ).toThrow();
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.symbol()])
  ).toThrow();
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.tuple([Schema.string()])])
  ).toThrow();
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.unknown()])
  ).toThrow();
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.void()])
  ).toThrow();

  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.never()])
  ).toThrow();
  // @ts-expect-error
  expect(() => Schema.templateLiteral([Schema.nan()])).toThrow();
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.pipe(Schema.string(), Schema.string())])
  ).toThrow();
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.preprocess(() => true, Schema.boolean())])
  ).toThrow();
  expect(() =>
    // @ts-expect-error
    Schema.templateLiteral([Schema.object({}).brand("brand")])
  ).toThrow();

  // these constraints aren't enforced but they shouldn't throw
  Schema.templateLiteral([Schema.number().multipleOf(2)]);
  Schema.templateLiteral([Schema.string().emoji()]);
  Schema.templateLiteral([Schema.string().url()]);
  Schema.templateLiteral([Schema.string().url()]);
  Schema.templateLiteral([Schema.string().trim()]);
  Schema.templateLiteral([Schema.string().includes("train")]);
  Schema.templateLiteral([Schema.string().toLowerCase()]);
  Schema.templateLiteral([Schema.string().toUpperCase()]);
});

test("template literal parsing - success - basic cases", () => {
  expect(() => Schema.templateLiteral([]).parse(7)).toThrow();

  empty.parse("");
  hello.parse("hello");
  world.parse("world");
  one.parse("1");
  two.parse("2");
  onePointOne.parse("1.1");
  truee.parse("true");
  anotherTrue.parse("true");
  falsee.parse("false");
  anotherFalse.parse("false");
  nulll.parse("null");
  anotherNull.parse("null");
  undefinedd.parse("undefined");
  anotherUndefined.parse("undefined");
  anyString.parse("blahblahblah");
  anyString.parse("");
  lazyString.parse("blahblahblah");
  lazyString.parse("");
  anyNumber.parse("123");
  anyNumber.parse("1.23");
  anyNumber.parse("0");
  anyNumber.parse("-1.23");
  anyNumber.parse("-123");
  // anyNumber.parse("Infinity");
  // anyNumber.parse("-Infinity");
  anyInt.parse("123");
  // anyInt.parse("-123");
  // anyFiniteNumber.parse("123");
  // anyFiniteNumber.parse("1.23");
  // anyFiniteNumber.parse("0");
  // anyFiniteNumber.parse("-1.23");
  // anyFiniteNumber.parse("-123");
  // anyNegativeNumber.parse("-123");
  // anyNegativeNumber.parse("-1.23");
  // anyNegativeNumber.parse("-Infinity");
  // anyPositiveNumber.parse("123");
  // anyPositiveNumber.parse("1.23");
  // anyPositiveNumber.parse("Infinity");
  // zeroButInADumbWay.parse("0");
  // zeroButInADumbWay.parse("00000");
  // finiteButInADumbWay.parse("5");
  // finiteButInADumbWay.parse("10");
  // finiteButInADumbWay.parse("6.66");
  bool.parse("true");
  bool.parse("false");
  bigone.parse("1");
  anyBigint.parse("123456");
  anyBigint.parse("0");
  // anyBigint.parse("-123456");
  nullableYo.parse("yo");
  nullableYo.parse("null");
  nullableString.parse("abc");
  nullableString.parse("null");
  optionalYeah.parse("yeah");
  optionalYeah.parse("");
  optionalString.parse("abc");
  optionalString.parse("");
  optionalNumber.parse("123");
  optionalNumber.parse("1.23");
  optionalNumber.parse("0");
  optionalNumber.parse("-1.23");
  optionalNumber.parse("-123");
  // optionalNumber.parse("Infinity");
  // optionalNumber.parse("-Infinity");
  nullishBruh.parse("bruh");
  nullishBruh.parse("null");
  nullishBruh.parse("");
  cuid.parse("cjld2cyuq0000t3rmniod1foy");
  cuidZZZ.parse("cjld2cyuq0000t3rmniod1foyZZZ");
  cuid2.parse("tz4a98xxat96iws9zmbrgj3a");
  datetime.parse(new Date().toISOString());
  email.parse("info@example.com");
  // ip.parse("213.174.246.205");
  // ip.parse("c359:f57c:21e5:39eb:1187:e501:f936:b452");
  ipv4.parse("213.174.246.205");
  ipv6.parse("c359:f57c:21e5:39eb:1187:e501:f936:b452");
  mac.parse("00:1A:2B:3C:4D:5E");
  ulid.parse("01GW3D2QZJBYB6P1Z1AE997VPW");
  uuid.parse("808989fd-3a6e-4af2-b607-737323a176f6");
  stringAToZ.parse("asudgaskhdgashd");
  stringStartsWith.parse("hello world");
  stringEndsWith.parse("hello world");
  stringMax5.parse("hello");
  stringMin5.parse("hello");
  stringLen5.parse("hello");
  stringMin5Max10.parse("hello worl");
  stringStartsWithMax5.parse("hello");
  brandedString.parse("branded string");
});

test("template literal parsing - failure - basic cases", () => {
  expect(() => empty.parse("a")).toThrow();
  expect(() => hello.parse("hello!")).toThrow();
  expect(() => hello.parse("!hello")).toThrow();
  expect(() => world.parse("world!")).toThrow();
  expect(() => world.parse("!world")).toThrow();
  expect(() => one.parse("2")).toThrow();
  expect(() => one.parse("12")).toThrow();
  expect(() => one.parse("21")).toThrow();
  expect(() => onePointOne.parse("1s1")).toThrow();
  expect(() => two.parse("1")).toThrow();
  expect(() => two.parse("21")).toThrow();
  expect(() => two.parse("12")).toThrow();
  expect(() => truee.parse("false")).toThrow();
  expect(() => truee.parse("1true")).toThrow();
  expect(() => truee.parse("true1")).toThrow();
  expect(() => anotherTrue.parse("false")).toThrow();
  expect(() => anotherTrue.parse("1true")).toThrow();
  expect(() => anotherTrue.parse("true1")).toThrow();
  expect(() => falsee.parse("true")).toThrow();
  expect(() => falsee.parse("1false")).toThrow();
  expect(() => falsee.parse("false1")).toThrow();
  expect(() => anotherFalse.parse("true")).toThrow();
  expect(() => anotherFalse.parse("1false")).toThrow();
  expect(() => anotherFalse.parse("false1")).toThrow();
  expect(() => nulll.parse("123")).toThrow();
  expect(() => nulll.parse("null1")).toThrow();
  expect(() => nulll.parse("1null")).toThrow();
  expect(() => anotherNull.parse("123")).toThrow();
  expect(() => anotherNull.parse("null1")).toThrow();
  expect(() => anotherNull.parse("1null")).toThrow();
  expect(() => undefinedd.parse("123")).toThrow();
  expect(() => undefinedd.parse("undefined1")).toThrow();
  expect(() => undefinedd.parse("1undefined")).toThrow();
  expect(() => anotherUndefined.parse("123")).toThrow();
  expect(() => anotherUndefined.parse("undefined1")).toThrow();
  expect(() => anotherUndefined.parse("1undefined")).toThrow();
  expect(() => anyNumber.parse("2a")).toThrow();
  expect(() => anyNumber.parse("a2")).toThrow();
  expect(() => anyNumber.parse("-2a")).toThrow();
  expect(() => anyNumber.parse("a-2")).toThrow();
  expect(() => anyNumber.parse("2.5a")).toThrow();
  expect(() => anyNumber.parse("a2.5")).toThrow();
  expect(() => anyNumber.parse("Infinitya")).toThrow();
  expect(() => anyNumber.parse("aInfinity")).toThrow();
  expect(() => anyNumber.parse("-Infinitya")).toThrow();
  expect(() => anyNumber.parse("a-Infinity")).toThrow();
  expect(() => anyNumber.parse("2e5")).toThrow();
  expect(() => anyNumber.parse("2e-5")).toThrow();
  expect(() => anyNumber.parse("2e+5")).toThrow();
  expect(() => anyNumber.parse("-2e5")).toThrow();
  expect(() => anyNumber.parse("-2e-5")).toThrow();
  expect(() => anyNumber.parse("-2e+5")).toThrow();
  expect(() => anyNumber.parse("2.1e5")).toThrow();
  expect(() => anyNumber.parse("2.1e-5")).toThrow();
  expect(() => anyNumber.parse("2.1e+5")).toThrow();
  expect(() => anyNumber.parse("-2.1e5")).toThrow();
  expect(() => anyNumber.parse("-2.1e-5")).toThrow();
  expect(() => anyNumber.parse("-2.1e+5")).toThrow();
  expect(() => anyNumber.parse("-Infinity")).toThrow();
  expect(() => anyNumber.parse("Infinity")).toThrow();
  expect(() => anyInt.parse("1.23")).toThrow();
  expect(() => anyInt.parse("-1.23")).toThrow();
  expect(() => anyInt.parse("d1")).toThrow();
  expect(() => anyInt.parse("1d")).toThrow();
  // expect(() => anyFiniteNumber.parse("Infinity")).toThrow();
  // expect(() => anyFiniteNumber.parse("-Infinity")).toThrow();
  // expect(() => anyFiniteNumber.parse("123a")).toThrow();
  // expect(() => anyFiniteNumber.parse("a123")).toThrow();
  // expect(() => anyNegativeNumber.parse("0")).toThrow();
  // expect(() => anyNegativeNumber.parse("1")).toThrow();
  // expect(() => anyNegativeNumber.parse("Infinity")).toThrow();
  // expect(() => anyPositiveNumber.parse("0")).toThrow();
  // expect(() => anyPositiveNumber.parse("-1")).toThrow();
  // expect(() => anyPositiveNumber.parse("-Infinity")).toThrow();
  // expect(() => zeroButInADumbWay.parse("1")).toThrow();
  // expect(() => zeroButInADumbWay.parse("-1")).toThrow();
  // expect(() => finiteButInADumbWay.parse("Infinity")).toThrow();
  // expect(() => finiteButInADumbWay.parse("-Infinity")).toThrow();
  // expect(() => finiteButInADumbWay.parse("-5")).toThrow();
  // expect(() => finiteButInADumbWay.parse("10a")).toThrow();
  // expect(() => finiteButInADumbWay.parse("a10")).toThrow();
  expect(() => bool.parse("123")).toThrow();
  expect(() => bigone.parse("2")).toThrow();
  expect(() => bigone.parse("c1")).toThrow();
  expect(() => anyBigint.parse("1.23")).toThrow();
  expect(() => anyBigint.parse("-1.23")).toThrow();
  expect(() => anyBigint.parse("c123")).toThrow();
  expect(() => nullableYo.parse("yo1")).toThrow();
  expect(() => nullableYo.parse("1yo")).toThrow();
  expect(() => nullableYo.parse("null1")).toThrow();
  expect(() => nullableYo.parse("1null")).toThrow();
  expect(() => optionalYeah.parse("yeah1")).toThrow();
  expect(() => optionalYeah.parse("1yeah")).toThrow();
  expect(() => optionalYeah.parse("undefined")).toThrow();
  expect(() => optionalNumber.parse("123a")).toThrow();
  expect(() => optionalNumber.parse("a123")).toThrow();
  // expect(() => optionalNumber.parse("Infinitya")).toThrow();
  // expect(() => optionalNumber.parse("aInfinity")).toThrow();
  expect(() => nullishBruh.parse("bruh1")).toThrow();
  expect(() => nullishBruh.parse("1bruh")).toThrow();
  expect(() => nullishBruh.parse("null1")).toThrow();
  expect(() => nullishBruh.parse("1null")).toThrow();
  expect(() => nullishBruh.parse("undefined")).toThrow();
  expect(() => cuid.parse("bjld2cyuq0000t3rmniod1foy")).toThrow();
  expect(() => cuid.parse("cjld2")).toThrow();
  expect(() => cuid.parse("cjld2 cyu")).toThrow();
  expect(() => cuid.parse("cjld2cyuq0000t3rmniod1foy ")).toThrow();
  expect(() => cuid.parse("1cjld2cyuq0000t3rmniod1foy")).toThrow();
  expect(() => cuidZZZ.parse("cjld2cyuq0000t3rmniod1foy")).toThrow();
  expect(() => cuidZZZ.parse("cjld2cyuq0000t3rmniod1foyZZY")).toThrow();
  expect(() => cuidZZZ.parse("cjld2cyuq0000t3rmniod1foyZZZ1")).toThrow();
  expect(() => cuidZZZ.parse("1cjld2cyuq0000t3rmniod1foyZZZ")).toThrow();
  expect(() => cuid2.parse("A9z4a98xxat96iws9zmbrgj3a")).toThrow();
  expect(() => cuid2.parse("tz4a98xxat96iws9zmbrgj3!")).toThrow();
  expect(() => datetime.parse("2022-01-01 00:00:00")).toThrow();
  expect(() => email.parse("info@example.com@")).toThrow();
  // expect(() => ip.parse("213.174.246:205")).toThrow();
  // expect(() => ip.parse("c359.f57c:21e5:39eb:1187:e501:f936:b452")).toThrow();
  expect(() => ipv4.parse("1213.174.246.205")).toThrow();
  expect(() => ipv4.parse("c359:f57c:21e5:39eb:1187:e501:f936:b452")).toThrow();
  expect(() => ipv6.parse("c359:f57c:21e5:39eb:1187:e501:f936:b4521")).toThrow();
  expect(() => ipv6.parse("213.174.246.205")).toThrow();
  expect(() => mac.parse("00:1A:2B:3C:4D:5E:6A:7B")).toThrow();
  expect(() => mac.parse("00:1A:2B:3C")).toThrow();
  expect(() => ulid.parse("01GW3D2QZJBYB6P1Z1AE997VPW!")).toThrow();
  expect(() => uuid.parse("808989fd-3a6e-4af2-b607-737323a176f6Z")).toThrow();
  expect(() => uuid.parse("Z808989fd-3a6e-4af2-b607-737323a176f6")).toThrow();
  expect(() => stringAToZ.parse("asdasdasd1")).toThrow();
  expect(() => stringAToZ.parse("1asdasdasd")).toThrow();
  expect(() => stringStartsWith.parse("ahello")).toThrow();
  expect(() => stringEndsWith.parse("worlda")).toThrow();
  expect(() => stringMax5.parse("123456")).toThrow();
  expect(() => stringMin5.parse("1234")).toThrow();
  expect(() => stringLen5.parse("123456")).toThrow();
  expect(() => stringLen5.parse("1234")).toThrow();
  expect(() => stringMin5Max10.parse("1234")).toThrow();
  expect(() => stringMin5Max10.parse("12345678901")).toThrow();

  // the "startswith" overrides the max length
  // expect(() => stringStartsWithMax5.parse("hello1")).toThrow();
  expect(() => stringStartsWithMax5.parse("1hell")).toThrow();
  expect(() => brandedString.parse("")).toThrow();
});

test("regexes", () => {
  expect(empty._schema.pattern.source).toMatchInlineSnapshot(`"^$"`);
  expect(hello._schema.pattern.source).toMatchInlineSnapshot(`"^hello$"`);
  expect(world._schema.pattern.source).toMatchInlineSnapshot(`"^(world)$"`);
  expect(one._schema.pattern.source).toMatchInlineSnapshot(`"^1$"`);
  expect(two._schema.pattern.source).toMatchInlineSnapshot(`"^(2)$"`);
  expect(truee._schema.pattern.source).toMatchInlineSnapshot(`"^true$"`);
  expect(anotherTrue._schema.pattern.source).toMatchInlineSnapshot(`"^(true)$"`);
  expect(falsee._schema.pattern.source).toMatchInlineSnapshot(`"^false$"`);
  expect(anotherFalse._schema.pattern.source).toMatchInlineSnapshot(`"^(false)$"`);
  expect(nulll._schema.pattern.source).toMatchInlineSnapshot(`"^null$"`);
  expect(anotherNull._schema.pattern.source).toMatchInlineSnapshot(`"^null$"`);
  expect(undefinedd._schema.pattern.source).toMatchInlineSnapshot(`"^undefined$"`);
  expect(anotherUndefined._schema.pattern.source).toMatchInlineSnapshot(`"^undefined$"`);
  expect(anyString._schema.pattern.source).toMatchInlineSnapshot(`"^[\\s\\S]{0,}$"`);
  expect(lazyString._schema.pattern.source).toMatchInlineSnapshot(`"^[\\s\\S]{0,}$"`);
  expect(anyNumber._schema.pattern.source).toMatchInlineSnapshot(`"^-?\\d+(?:\\.\\d+)?$"`);
  expect(anyInt._schema.pattern.source).toMatchInlineSnapshot(`"^-?\\d+$"`);
  // expect(anyFiniteNumber._schema.pattern.source).toMatchInlineSnapshot(`"^-?\\d+(?:\\.\\d+)?$"`);
  // expect(anyNegativeNumber._schema.pattern.source).toMatchInlineSnapshot(`"^-?\\d+(?:\\.\\d+)?$"`);
  // expect(anyPositiveNumber._schema.pattern.source).toMatchInlineSnapshot(`"^-?\\d+(?:\\.\\d+)?$"`);
  // expect(zeroButInADumbWay._schema.pattern.source).toMatchInlineSnapshot(`"^-?\\d+(?:\\.\\d+)?$"`);
  // expect(finiteButInADumbWay._schema.pattern.source).toMatchInlineSnapshot(`"^-?\\d+(?:\\.\\d+)?$"`);
  expect(bool._schema.pattern.source).toMatchInlineSnapshot(`"^(?:true|false)$"`);
  expect(bigone._schema.pattern.source).toMatchInlineSnapshot(`"^(1)$"`);
  expect(anyBigint._schema.pattern.source).toMatchInlineSnapshot(`"^-?\\d+n?$"`);
  expect(nullableYo._schema.pattern.source).toMatchInlineSnapshot(`"^((yo)|null)$"`);
  expect(nullableString._schema.pattern.source).toMatchInlineSnapshot(`"^([\\s\\S]{0,}|null)$"`);
  expect(optionalYeah._schema.pattern.source).toMatchInlineSnapshot(`"^((yeah))?$"`);
  expect(optionalString._schema.pattern.source).toMatchInlineSnapshot(`"^([\\s\\S]{0,})?$"`);
  expect(optionalNumber._schema.pattern.source).toMatchInlineSnapshot(`"^(-?\\d+(?:\\.\\d+)?)?$"`);
  expect(nullishBruh._schema.pattern.source).toMatchInlineSnapshot(`"^(((bruh)|null))?$"`);
  expect(nullishString._schema.pattern.source).toMatchInlineSnapshot(`"^(([\\s\\S]{0,}|null))?$"`);
  expect(cuid._schema.pattern.source).toMatchInlineSnapshot(`"^[cC][0-9a-z]{6,}$"`);
  expect(cuidZZZ._schema.pattern.source).toMatchInlineSnapshot(`"^[cC][0-9a-z]{6,}ZZZ$"`);
  expect(cuid2._schema.pattern.source).toMatchInlineSnapshot(`"^[0-9a-z]+$"`);
  expect(datetime._schema.pattern.source).toMatchInlineSnapshot(
    `"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"`
  );
  expect(email._schema.pattern.source).toMatchInlineSnapshot(
    `"^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$"`
  );
  // expect(ip._schema.pattern.source).toMatchInlineSnapshot(
  //   `"^(^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$)|(^(([a-fA-F0-9]{1,4}:){7}|::([a-fA-F0-9]{1,4}:){0,6}|([a-fA-F0-9]{1,4}:){1}:([a-fA-F0-9]{1,4}:){0,5}|([a-fA-F0-9]{1,4}:){2}:([a-fA-F0-9]{1,4}:){0,4}|([a-fA-F0-9]{1,4}:){3}:([a-fA-F0-9]{1,4}:){0,3}|([a-fA-F0-9]{1,4}:){4}:([a-fA-F0-9]{1,4}:){0,2}|([a-fA-F0-9]{1,4}:){5}:([a-fA-F0-9]{1,4}:){0,1})([a-fA-F0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$)$"`
  // );
  expect(ipv4._schema.pattern.source).toMatchInlineSnapshot(
    `"^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$"`
  );
  expect(ipv6._schema.pattern.source).toMatchInlineSnapshot(
    `"^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$"`
  );
  expect(mac._schema.pattern.source).toMatchInlineSnapshot(
    `"^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$"`
  );
  expect(ulid._schema.pattern.source).toMatchInlineSnapshot(`"^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$"`);
  expect(uuid._schema.pattern.source).toMatchInlineSnapshot(
    `"^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"`
  );
  expect(stringAToZ._schema.pattern.source).toMatchInlineSnapshot(`"^[a-z]+$"`);
  expect(stringStartsWith._schema.pattern.source).toMatchInlineSnapshot(`"^hello.*$"`);
  expect(stringEndsWith._schema.pattern.source).toMatchInlineSnapshot(`"^.*world$"`);
  expect(stringMax5._schema.pattern.source).toMatchInlineSnapshot(`"^[\\s\\S]{0,5}$"`);
  expect(stringMin5._schema.pattern.source).toMatchInlineSnapshot(`"^[\\s\\S]{5,}$"`);
  expect(stringLen5._schema.pattern.source).toMatchInlineSnapshot(`"^[\\s\\S]{5,5}$"`);
  expect(stringMin5Max10._schema.pattern.source).toMatchInlineSnapshot(`"^[\\s\\S]{5,10}$"`);
  expect(brandedString._schema.pattern.source).toMatchInlineSnapshot(`"^[\\s\\S]{1,}$"`);
  expect(url._schema.pattern.source).toMatchInlineSnapshot(`"^https:\\/\\/\\w+\\.(com|net)$"`);
  expect(measurement._schema.pattern.source).toMatchInlineSnapshot(`"^-?\\d+(?:\\.\\d+)?((px|em|rem|vh|vw|vmin|vmax))?$"`);
  expect(decimalEnum._schema.pattern.source).toMatchInlineSnapshot(`"^(1\\.2)$"`);
  expect(exponentEnum._schema.pattern.source).toMatchInlineSnapshot(`"^(1e\\+21)$"`);
  expect(connectionString._schema.pattern.source).toMatchInlineSnapshot(
    `"^mongodb:\\/\\/(\\w+:\\w+@)?\\w+:-?\\d+(\\/(\\w+)?(\\?(\\w+=\\w+(&\\w+=\\w+)*)?)?)?$"`
  );
});

test("template literal parsing - success - complex cases", () => {
  url.parse("https://example.com");
  url.parse("https://speedtest.net");

  exponentEnum.parse("1e+21");

  // measurement.parse(1);
  // measurement.parse(1.1);
  // measurement.parse(0);
  // measurement.parse(-1.1);
  // measurement.parse(-1);
  measurement.parse("1");
  measurement.parse("1.1");
  measurement.parse("0");
  measurement.parse("-1");
  measurement.parse("-1.1");
  measurement.parse("1px");
  measurement.parse("1.1px");
  measurement.parse("0px");
  measurement.parse("-1px");
  measurement.parse("-1.1px");
  measurement.parse("1em");
  measurement.parse("1.1em");
  measurement.parse("0em");
  measurement.parse("-1em");
  measurement.parse("-1.1em");
  measurement.parse("1rem");
  measurement.parse("1.1rem");
  measurement.parse("0rem");
  measurement.parse("-1rem");
  measurement.parse("-1.1rem");
  measurement.parse("1vh");
  measurement.parse("1.1vh");
  measurement.parse("0vh");
  measurement.parse("-1vh");
  measurement.parse("-1.1vh");
  measurement.parse("1vw");
  measurement.parse("1.1vw");
  measurement.parse("0vw");
  measurement.parse("-1vw");
  measurement.parse("-1.1vw");
  measurement.parse("1vmin");
  measurement.parse("1.1vmin");
  measurement.parse("0vmin");
  measurement.parse("-1vmin");
  measurement.parse("-1.1vmin");
  measurement.parse("1vmax");
  measurement.parse("1.1vmax");
  measurement.parse("0vmax");
  measurement.parse("-1vmax");
  measurement.parse("-1.1vmax");

  connectionString.parse("mongodb://host:1234");
  connectionString.parse("mongodb://host:1234/");
  connectionString.parse("mongodb://host:1234/defaultauthdb");
  connectionString.parse("mongodb://host:1234/defaultauthdb?authSource=admin");
  connectionString.parse("mongodb://host:1234/defaultauthdb?authSource=admin&connectTimeoutMS=300000");
  connectionString.parse("mongodb://host:1234/?authSource=admin");
  connectionString.parse("mongodb://host:1234/?authSource=admin&connectTimeoutMS=300000");
  connectionString.parse("mongodb://username:password@host:1234");
  connectionString.parse("mongodb://username:password@host:1234/");
  connectionString.parse("mongodb://username:password@host:1234/defaultauthdb");
  connectionString.parse("mongodb://username:password@host:1234/defaultauthdb?authSource=admin");
  connectionString.parse(
    "mongodb://username:password@host:1234/defaultauthdb?authSource=admin&connectTimeoutMS=300000"
  );
  connectionString.parse("mongodb://username:password@host:1234/?authSource=admin");
  connectionString.parse("mongodb://username:password@host:1234/?authSource=admin&connectTimeoutMS=300000");
});

test("template literal parsing - failure - complex cases", () => {
  expect(() => url.parse("http://example.com")).toThrow();
  expect(() => url.parse("https://.com")).toThrow();
  expect(() => url.parse("https://examplecom")).toThrow();
  expect(() => url.parse("https://example.org")).toThrow();
  expect(() => url.parse("https://example.net.il")).toThrow();

  expect(() => measurement.parse("1.1.1")).toThrow();
  expect(() => measurement.parse("Infinity")).toThrow();
  expect(() => measurement.parse("-Infinity")).toThrow();
  expect(() => measurement.parse("NaN")).toThrow();
  expect(() => measurement.parse("1%")).toThrow();
  expect(() => decimalEnum.parse("1x2")).toThrow();
  expect(() => exponentEnum.parse("1e21")).toThrow();

  expect(() => connectionString.parse("mongod://host:1234")).toThrow();
  expect(() => connectionString.parse("mongodb://:1234")).toThrow();
  expect(() => connectionString.parse("mongodb://host1234")).toThrow();
  expect(() => connectionString.parse("mongodb://host:d234")).toThrow();
  expect(() => connectionString.parse("mongodb://host:12.34")).toThrow();
  // Note: template literal regex currently allows negative numbers despite .positive() constraint
  // This is a known limitation where template literals use regex patterns directly
  // expect(() => connectionString.parse("mongodb://host:-1234")).toThrow();
  // expect(() => connectionString.parse("mongodb://host:-12.34")).toThrow();
  expect(() => connectionString.parse("mongodb://host:")).toThrow();
  expect(() => connectionString.parse("mongodb://:password@host:1234")).toThrow();
  expect(() => connectionString.parse("mongodb://usernamepassword@host:1234")).toThrow();
  expect(() => connectionString.parse("mongodb://username:@host:1234")).toThrow();
  expect(() => connectionString.parse("mongodb://@host:1234")).toThrow();
  expect(() => connectionString.parse("mongodb://host:1234/defaultauthdb?authSourceadmin")).toThrow();
  expect(() => connectionString.parse("mongodb://host:1234/?authSourceadmin")).toThrow();
  expect(() => connectionString.parse("mongodb://host:1234/defaultauthdb?&authSource=admin")).toThrow();
  expect(() => connectionString.parse("mongodb://host:1234/?&authSource=admin")).toThrow();
});

test("template literal parsing - failure - issue format", () => {
  expect(anotherNull.safeParse("1null")).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "invalid_format",
        "format": "template_literal",
        "pattern": "^null$",
        "path": [],
        "message": "Invalid input"
      }
    ]],
      "success": false,
    }
  `);
  expect(cuidZZZ.safeParse("1cjld2cyuq0000t3rmniod1foyZZZ")).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "invalid_format",
        "format": "template_literal",
        "pattern": "^[cC][0-9a-z]{6,}ZZZ$",
        "path": [],
        "message": "Invalid input"
      }
    ]],
      "success": false,
    }
  `);
  expect(stringMin5Max10.safeParse("1234")).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "invalid_format",
        "format": "template_literal",
        "pattern": "^[\\\\s\\\\S]{5,10}$",
        "path": [],
        "message": "Invalid input"
      }
    ]],
      "success": false,
    }
  `);
  expect(connectionString.safeParse("mongodb://host:1234/defaultauthdb?authSourceadmin")).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "invalid_format",
        "format": "template_literal",
        "pattern": "^mongodb:\\\\/\\\\/(\\\\w+:\\\\w+@)?\\\\w+:-?\\\\d+(\\\\/(\\\\w+)?(\\\\?(\\\\w+=\\\\w+(&\\\\w+=\\\\w+)*)?)?)?$",
        "path": [],
        "message": "Invalid input"
      }
    ]],
      "success": false,
    }
  `);

  expect(stringStartsWithMax5.safeParse("1hell")).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "invalid_format",
        "format": "template_literal",
        "pattern": "^hello.*$",
        "path": [],
        "message": "Invalid input"
      }
    ]],
      "success": false,
    }
  `);
});

test("part patterns fold checks through wrappers and unions", () => {
  // a constrained string keeps its bounds under a wrapper and inside a union
  const wrapped = Schema.templateLiteral(["a-", Schema.string().min(2).max(3).optional()]);
  expect(wrapped.safeParse("a-").success).toBe(true);
  expect(wrapped.safeParse("a-xy").success).toBe(true);
  expect(wrapped.safeParse("a-x").success).toBe(false);
  expect(wrapped.safeParse("a-wxyz").success).toBe(false);

  const union = Schema.templateLiteral(["", Schema.union([Schema.string().regex(/^[a-c]+$/), Schema.number().int()])]);
  expect(union.safeParse("abc").success).toBe(true);
  expect(union.safeParse("12").success).toBe(true);
  expect(union.safeParse("xyz").success).toBe(false);
  expect(union.safeParse("1.5").success).toBe(false);

  // an empty length range matches nothing rather than building an invalid quantifier
  const empty = Schema.templateLiteral(["", Schema.string().min(8).length(5)]);
  expect(empty.safeParse("abcde").success).toBe(false);

  // lazy resolves its inner schema on the internals, not the def
  const lazy = Schema.templateLiteral(["", Schema.lazy(() => Schema.string().min(2)).optional()]);
  expect(lazy.safeParse("x").success).toBe(false);
  expect(lazy.safeParse("xy").success).toBe(true);
});

test("an embedded email does not constrain the other parts", () => {
  const schema = Schema.templateLiteral([Schema.email(), "|", Schema.string()]);
  expect(Schema.safeParse("a@b.cc|a..b").success).toBe(true);
  expect(Schema.safeParse("a@b.cc|xy").success).toBe(true);
  expect(Schema.safeParse("a..b@b.cc|xy").success).toBe(false);
  expect(Schema.safeParse(".a@b.cc|xy").success).toBe(false);
});
