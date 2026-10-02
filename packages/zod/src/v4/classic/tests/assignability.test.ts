import { expectTypeOf, test } from "vitest";

import * as Schema from "schema/v4";
import * as core from "schema/v4/core";

test("assignability", () => {
  // $SchemaString
  Schema.string() satisfies Schema.core.$SchemaString;
  Schema.string() satisfies Schema.SchemaString;

  // $SchemaNumber
  Schema.number() satisfies Schema.core.$SchemaNumber;
  Schema.number() satisfies Schema.SchemaNumber;

  // $SchemaBigInt
  Schema.bigint() satisfies Schema.core.$SchemaBigInt;
  Schema.bigint() satisfies Schema.SchemaBigInt;

  // $SchemaBoolean
  Schema.boolean() satisfies Schema.core.$SchemaBoolean;
  Schema.boolean() satisfies Schema.SchemaBoolean;

  // $SchemaDate
  Schema.date() satisfies Schema.core.$SchemaDate;
  Schema.date() satisfies Schema.SchemaDate;

  // $SchemaSymbol
  Schema.symbol() satisfies Schema.core.$SchemaSymbol;
  Schema.symbol() satisfies Schema.SchemaSymbol;

  // $SchemaUndefined
  Schema.undefined() satisfies Schema.core.$SchemaUndefined;
  Schema.undefined() satisfies Schema.SchemaUndefined;

  // $SchemaNullable
  Schema.string().nullable() satisfies Schema.core.$SchemaNullable;
  Schema.string().nullable() satisfies Schema.SchemaNullable;

  // $SchemaNull
  Schema.null() satisfies Schema.core.$SchemaNull;
  Schema.null() satisfies Schema.SchemaNull;

  // $SchemaAny
  Schema.any() satisfies Schema.core.$SchemaAny;
  Schema.any() satisfies Schema.SchemaAny;

  // $SchemaUnknown
  Schema.unknown() satisfies Schema.core.$SchemaUnknown;
  Schema.unknown() satisfies Schema.SchemaUnknown;

  // $SchemaNever
  Schema.never() satisfies Schema.core.$SchemaNever;
  Schema.never() satisfies Schema.SchemaNever;

  // $SchemaVoid
  Schema.void() satisfies Schema.core.$SchemaVoid;
  Schema.void() satisfies Schema.SchemaVoid;

  // $SchemaArray
  Schema.array(Schema.string()) satisfies Schema.core.$SchemaArray;
  Schema.array(Schema.string()) satisfies Schema.SchemaArray;
  Schema.array(Schema.string()) satisfies Schema.SchemaType<Array<unknown>>;

  // $SchemaObject
  Schema.object({ key: Schema.string() }) satisfies Schema.core.$SchemaObject;
  Schema.object({ key: Schema.string() }) satisfies Schema.SchemaObject<{ key: Schema.SchemaType }>;
  Schema.object({ key: Schema.string() }) satisfies Schema.SchemaType<{ key: string }>;

  // $SchemaUnion
  Schema.union([Schema.string(), Schema.number()]) satisfies Schema.core.$SchemaUnion;
  Schema.union([Schema.string(), Schema.number()]) satisfies Schema.SchemaUnion;
  Schema.union([Schema.string(), Schema.number()]) satisfies Schema.SchemaType<string | number>;

  // $SchemaIntersection
  Schema.intersection(Schema.string(), Schema.number()) satisfies Schema.core.$SchemaIntersection;
  Schema.intersection(Schema.string(), Schema.number()) satisfies Schema.SchemaIntersection;

  // $SchemaTuple
  Schema.tuple([Schema.string(), Schema.number()]) satisfies Schema.core.$SchemaTuple;
  Schema.tuple([Schema.string(), Schema.number()]) satisfies Schema.SchemaTuple;

  // $SchemaRecord
  Schema.record(Schema.string(), Schema.number()) satisfies Schema.core.$SchemaRecord;
  Schema.record(Schema.string(), Schema.number()) satisfies Schema.SchemaRecord;

  // $SchemaMap
  Schema.map(Schema.string(), Schema.number()) satisfies Schema.core.$SchemaMap;
  Schema.map(Schema.string(), Schema.number()) satisfies Schema.SchemaMap;

  // $SchemaSet
  Schema.set(Schema.string()) satisfies Schema.core.$SchemaSet;
  Schema.set(Schema.string()) satisfies Schema.SchemaSet;

  // $SchemaLiteral
  Schema.literal("example") satisfies Schema.core.$SchemaLiteral;
  Schema.literal("example") satisfies Schema.SchemaLiteral;

  // $SchemaEnum
  Schema.enum(["a", "b", "c"]) satisfies Schema.core.$SchemaEnum;
  Schema.enum(["a", "b", "c"]) satisfies Schema.SchemaEnum;

  // $SchemaPromise
  Schema.promise(Schema.string()) satisfies Schema.core.$SchemaPromise;
  Schema.promise(Schema.string()) satisfies Schema.SchemaPromise;

  // $SchemaLazy
  const lazySchema = Schema.lazy(() => Schema.string());
  lazySchema satisfies Schema.core.$SchemaLazy;
  lazySchema satisfies Schema.SchemaLazy;

  // $SchemaOptional
  Schema.string().optional() satisfies Schema.core.$SchemaOptional;
  Schema.string().optional() satisfies Schema.SchemaOptional;

  // $SchemaDefault
  Schema.string().default("default") satisfies Schema.core.$SchemaDefault;
  Schema.string().default("default") satisfies Schema.SchemaDefault;

  // $SchemaTemplateLiteral
  Schema.templateLiteral([Schema.literal("a"), Schema.literal("b")]) satisfies Schema.core.$SchemaTemplateLiteral;
  Schema.templateLiteral([Schema.literal("a"), Schema.literal("b")]) satisfies Schema.SchemaTemplateLiteral;

  // $SchemaCustom
  Schema.custom<string>((val) => typeof val === "string") satisfies Schema.core.$SchemaCustom;
  Schema.custom<string>((val) => typeof val === "string") satisfies Schema.SchemaCustom;

  // $SchemaTransform
  Schema.transform((val) => val as string) satisfies Schema.core.$SchemaTransform;
  Schema.transform((val) => val as string) satisfies Schema.SchemaTransform;

  // $SchemaNonOptional
  Schema.string().optional().nonoptional() satisfies Schema.core.$SchemaNonOptional;
  Schema.string().optional().nonoptional() satisfies Schema.SchemaNonOptional;

  // $SchemaReadonly
  Schema.object({ key: Schema.string() }).readonly() satisfies Schema.core.$SchemaReadonly;
  Schema.object({ key: Schema.string() }).readonly() satisfies Schema.SchemaReadonly;

  // $SchemaNaN
  Schema.nan() satisfies Schema.core.$SchemaNaN;
  Schema.nan() satisfies Schema.SchemaNaN;

  // $SchemaPipe
  Schema.unknown().pipe(Schema.number()) satisfies Schema.core.$SchemaPipe;
  Schema.unknown().pipe(Schema.number()) satisfies Schema.SchemaPipe;

  // $SchemaPreprocess
  Schema.preprocess((v) => v, Schema.number()) satisfies Schema.core.$SchemaPreprocess;
  Schema.preprocess((v) => v, Schema.number()) satisfies Schema.SchemaPreprocess;
  Schema.preprocess((v) => v, Schema.number()) satisfies Schema.core.$SchemaPipe<Schema.core.$SchemaTransform, Schema.SchemaNumber>;
  Schema.preprocess((v) => v, Schema.number()) satisfies Schema.SchemaPipe<Schema.core.$SchemaTransform, Schema.SchemaNumber>;

  // $SchemaSuccess
  Schema.success(Schema.string()) satisfies Schema.core.$SchemaSuccess;
  Schema.success(Schema.string()) satisfies Schema.SchemaSuccess;

  // $SchemaCatch
  Schema.string().catch("fallback") satisfies Schema.core.$SchemaCatch;
  Schema.string().catch("fallback") satisfies Schema.SchemaCatch;

  // $SchemaFile
  Schema.file() satisfies Schema.core.$SchemaFile;
  Schema.file() satisfies Schema.SchemaFile;
});

test("toSchema", () => {
  type Company = {
    id: string;
    name: string;
    webAddress: string | null;
  };

  const CompanySchema = Schema.object({
    id: Schema.string(),
    name: Schema.string(),
    webAddress: Schema.string().url().nullable(),
  });
  const Company = Schema.toSchema<Company>()(CompanySchema);

  Company.shape.id.min(1);
  expectTypeOf<Schema.output<typeof Company>>().toEqualTypeOf<Company>();

  const CoreCompany = core.toSchema<Company>()(CompanySchema);
  expectTypeOf<core.output<typeof CoreCompany>>().toEqualTypeOf<Company>();

  const UtilCompany = Schema.core.util.toSchema<Company>()(CompanySchema);
  expectTypeOf<Schema.output<typeof UtilCompany>>().toEqualTypeOf<Company>();

  type Complex = {
    kind: "company";
    nested: {
      founded: Date;
      tags: string[];
    };
    scores: Record<"a" | "b", number>;
    tuple: [string, number];
    status: "active" | "inactive";
  };

  const Complex = Schema.toSchema<Complex>()(
    Schema.object({
      kind: Schema.literal("company"),
      nested: Schema.object({
        founded: Schema.date(),
        tags: Schema.array(Schema.string()),
      }),
      scores: Schema.record(Schema.enum(["a", "b"]), Schema.number()),
      tuple: Schema.tuple([Schema.string(), Schema.number()]),
      status: Schema.union([Schema.literal("active"), Schema.literal("inactive")]),
    })
  );
  expectTypeOf<Schema.output<typeof Complex>>().toEqualTypeOf<Complex>();

  type Items = {
    items: { value: string }[];
  };

  const Items = Schema.toSchema<Items>()(
    Schema.object({
      items: Schema.array(Schema.object({ value: Schema.string() })),
    })
  );
  expectTypeOf<Schema.output<typeof Items>>().toEqualTypeOf<Items>();

  type ReadonlyItem = Readonly<{
    id: string;
  }>;

  const ReadonlyItem = Schema.toSchema<ReadonlyItem>()(Schema.object({ id: Schema.string() }).readonly());
  expectTypeOf<Schema.output<typeof ReadonlyItem>>().toEqualTypeOf<ReadonlyItem>();

  const Transformed = Schema.toSchema<{ count: number }>()(
    Schema.object({
      count: Schema.string().transform((value) => value.length),
    })
  );
  expectTypeOf<Schema.input<typeof Transformed>>().toEqualTypeOf<{ count: string }>();
  expectTypeOf<Schema.output<typeof Transformed>>().toEqualTypeOf<{ count: number }>();

  // An enum target matches Schema.enum(...) even though the enum reference is not identical to the union of its members (#6524)
  enum SkillLevel {
    Noob = "noob",
    Pro = "pro",
  }
  enum Rank {
    First = 1,
    Second = 2,
  }

  Schema.toSchema<SkillLevel>()(Schema.enum(SkillLevel));
  const Enums = Schema.toSchema<{
    skill: SkillLevel;
    members: SkillLevel.Noob | SkillLevel.Pro;
    rank: Rank;
    maybe: SkillLevel | null;
    list: SkillLevel[];
    nested: { skill: SkillLevel };
  }>()(
    Schema.object({
      skill: Schema.enum(SkillLevel),
      members: Schema.enum(SkillLevel),
      rank: Schema.enum(Rank),
      maybe: Schema.enum(SkillLevel).nullable(),
      list: Schema.array(Schema.enum(SkillLevel)),
      nested: Schema.object({ skill: Schema.enum(SkillLevel) }),
    })
  );
  expectTypeOf<Schema.output<typeof Enums>["skill"]>().toEqualTypeOf<SkillLevel>();

  // @ts-expect-error a member subset is not the enum
  Schema.toSchema<{ skill: SkillLevel }>()(Schema.object({ skill: Schema.literal(SkillLevel.Noob) }));

  // @ts-expect-error plain literals do not match a nominal enum target
  Schema.toSchema<{ skill: SkillLevel }>()(Schema.object({ skill: Schema.enum(["noob", "pro"]) }));

  // @ts-expect-error an enum schema does not match a plain literal-union target
  Schema.toSchema<{ skill: "noob" | "pro" }>()(Schema.object({ skill: Schema.enum(SkillLevel) }));

  // @ts-expect-error plain numeric literals do not match a numeric enum target either
  Schema.toSchema<{ rank: Rank }>()(Schema.object({ rank: Schema.union([Schema.literal(1), Schema.literal(2)]) }));

  Schema.toSchema<Company>()(
    // @ts-expect-error missing optional keys still fail exact output matching
    Schema.object({
      id: Schema.string(),
      name: Schema.string(),
    })
  );

  Schema.toSchema<Company>()(
    // @ts-expect-error extra keys fail exact output matching
    Schema.object({
      id: Schema.string(),
      name: Schema.string(),
      webAddress: Schema.string().url().nullable(),
      extra: Schema.string(),
    })
  );

  Schema.toSchema<Company>()(
    // @ts-expect-error wrong property output fails matching
    Schema.object({
      id: Schema.number(),
      name: Schema.string(),
      webAddress: Schema.string().url().nullable(),
    })
  );

  Schema.toSchema<ReadonlyItem>()(
    // @ts-expect-error readonly output is required
    Schema.object({
      id: Schema.string(),
    })
  );

  // @ts-expect-error any is only an exact match for any
  Schema.toSchema<string>()(Schema.any());

  // @ts-expect-error toSchema checks output, not input
  Schema.toSchema<string>()(Schema.string().transform((value) => value.length));

  // Exact equality is deliberately the only mode. A bidirectional-assignability mode would accept both of the two cases above — `any` is assignable in both directions by construction, and `readonly` is not part of assignability — so it would silently drop the guarantees the rest of this test pins.

  // An intersection and the flat object with the same keys are interchangeable as targets, since the normalizer flattens both.
  type Intersected = { a: number } & { b: string };
  const viaAnd = Schema.object({ a: Schema.number() }).and(Schema.object({ b: Schema.string() }));
  const viaExtend = Schema.object({ a: Schema.number() }).safeExtend({ b: Schema.string() });

  Schema.toSchema<Intersected>()(viaAnd);
  Schema.toSchema<Intersected>()(viaExtend);
  Schema.toSchema<{ a: number; b: string }>()(viaAnd);
  Schema.toSchema<{ a: number; b: string }>()(viaExtend);

  // @ts-expect-error a missing key is still a missing key
  Schema.toSchema<Intersected>()(Schema.object({ a: Schema.number() }));

  // `keyof` a function is `never`, so the normalizer must not walk into one — mapping it would erase the signature and make every callable compare equal
  Schema.toSchema<() => string>()(Schema.custom<() => string>());

  // @ts-expect-error an incompatible callable output is still rejected
  Schema.toSchema<() => string>()(Schema.custom<() => number>());

  // @ts-expect-error and so is an incompatible function-valued property
  Schema.toSchema<{ cb: (x: number) => void }>()(Schema.object({ cb: Schema.custom<(x: string) => void>() }));

  // @ts-expect-error a method-bearing generic keeps its type arguments
  Schema.toSchema<{ m: Map<string, number> }>()(Schema.object({ m: Schema.custom<Map<string, string>>() }));
});

test("checks", () => {
  const _a: Schema.core.$SchemaCheck = {} as any as Schema  .core.$SchemaChecks;
  const _b: Schema.core.$SchemaCheck = {} as any as Schema  .core.$SchemaStringFormatChecks;
  const _c: Schema.core.$SchemaType = {} as any as Schema  .core.$SchemaTypes;
  const _d: Schema.core.$SchemaType = {} as any as Schema  .core.$SchemaStringFormatTypes;
  Schema.currencyCode() satisfies Schema.core.$SchemaStringFormatTypes;
});

test("assignability to $SchemaType", () => {
  Schema.string() satisfies Schema.SchemaType;
  Schema.number() satisfies Schema.SchemaType;
  Schema.boolean() satisfies Schema.SchemaType;
  Schema.object({ key: Schema.string() }) satisfies Schema.SchemaType;
  Schema.object({ key: Schema.string() }) satisfies Schema.SchemaType<{ key: string }>;
  Schema.array(Schema.string()) satisfies Schema.SchemaType;
  Schema.union([Schema.string(), Schema.number()]) satisfies Schema.SchemaType;
  Schema.intersection(Schema.string(), Schema.number()) satisfies Schema.SchemaType;
  Schema.tuple([Schema.string(), Schema.number()]) satisfies Schema.SchemaType;
  Schema.record(Schema.string(), Schema.number()) satisfies Schema.SchemaType;
  Schema.map(Schema.string(), Schema.number()) satisfies Schema.SchemaType;
  Schema.set(Schema.string()) satisfies Schema.SchemaType;
  Schema.literal("example") satisfies Schema.SchemaType;

  expectTypeOf<Schema.SchemaType extends Schema.core.$SchemaType ? true : false>().toEqualTypeOf<true>();
});

test("assignability with narrowing", () => {
  type _RefinedSchema<T extends Schema.SchemaType<object> | Schema.SchemaUnion> = T extends Schema.SchemaUnion
    ? RefinedUnionSchema<T> // <-- Type instantiation is excessively deep and possibly infinite.
    : T extends Schema.SchemaType<object>
      ? RefinedTypeSchema<Schema.output<T>> // <-- Type instantiation is excessively deep and possibly infinite.
      : never;

  type RefinedTypeSchema<T extends object> = T;

  type RefinedUnionSchema<T extends Schema.SchemaUnion> = T;
});

test("generic assignability in objects", () => {
  interface SortItem<T extends string> {
    key: T;
    order: string;
  }

  const createSortItemSchema = <T extends Schema.SchemaType<string>>(sortKeySchema: T) =>
    Schema.object({
      key: sortKeySchema,
      order: Schema.string(),
    });

  <T extends Schema.SchemaType<string>>(sortKeySchema: T, defaultSortBy: SortItem<Schema.output<T>>[] = []) =>
    createSortItemSchema(sortKeySchema).array().default(defaultSortBy);
});
