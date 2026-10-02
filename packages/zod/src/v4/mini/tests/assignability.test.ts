import { expectTypeOf, test } from "vitest";

import * as Schema from "schema/mini";

test("assignability", () => {
  // $SchemaString
  Schema.string() satisfies Schema.core.$SchemaString;

  // $SchemaNumber
  Schema.number() satisfies Schema.core.$SchemaNumber;

  // $SchemaBigInt
  Schema.bigint() satisfies Schema.core.$SchemaBigInt;

  // $SchemaBoolean
  Schema.boolean() satisfies Schema.core.$SchemaBoolean;

  // $SchemaDate
  Schema.date() satisfies Schema.core.$SchemaDate;

  // $SchemaSymbol
  Schema.symbol() satisfies Schema.core.$SchemaSymbol;

  // $SchemaUndefined
  Schema.undefined() satisfies Schema.core.$SchemaUndefined;

  // $SchemaNullable
  Schema.nullable(Schema.string()) satisfies Schema.core.$SchemaNullable;

  // $SchemaNull
  Schema.null() satisfies Schema.core.$SchemaNull;

  // $SchemaAny
  Schema.any() satisfies Schema.core.$SchemaAny;

  // $SchemaUnknown
  Schema.unknown() satisfies Schema.core.$SchemaUnknown;

  // $SchemaNever
  Schema.never() satisfies Schema.core.$SchemaNever;

  // $SchemaVoid
  Schema.void() satisfies Schema.core.$SchemaVoid;

  // $SchemaArray
  Schema.array(Schema.string()) satisfies Schema.core.$SchemaArray;

  // $SchemaObject
  Schema.object({ key: Schema.string() }) satisfies Schema.core.$SchemaObject;

  // $SchemaUnion
  Schema.union([Schema.string(), Schema.number()]) satisfies Schema.core.$SchemaUnion;

  // $SchemaIntersection
  Schema.intersection(Schema.string(), Schema.number()) satisfies Schema.core.$SchemaIntersection;

  // $SchemaTuple
  Schema.tuple([Schema.string(), Schema.number()]) satisfies Schema.core.$SchemaTuple;

  // $SchemaRecord
  Schema.record(Schema.string(), Schema.number()) satisfies Schema.core.$SchemaRecord;

  // $SchemaMap
  Schema.map(Schema.string(), Schema.number()) satisfies Schema.core.$SchemaMap;

  // $SchemaSet
  Schema.set(Schema.string()) satisfies Schema.core.$SchemaSet;

  // $SchemaLiteral
  Schema.literal("example") satisfies Schema.core.$SchemaLiteral;

  // $SchemaEnum
  Schema.enum(["a", "b", "c"]) satisfies Schema.core.$SchemaEnum;

  // $SchemaPromise
  Schema.promise(Schema.string()) satisfies Schema.core.$SchemaPromise;

  // $SchemaLazy
  const lazySchema = Schema.lazy(() => Schema.string());
  lazySchema satisfies Schema.core.$SchemaLazy;

  // $SchemaOptional
  Schema.optional(Schema.string()) satisfies Schema.core.$SchemaOptional;

  // $SchemaDefault
  Schema._default(Schema.string(), "default") satisfies Schema.core.$SchemaDefault;

  // $SchemaTemplateLiteral
  Schema.templateLiteral([Schema.literal("a"), Schema.literal("b")]) satisfies Schema.core.$SchemaTemplateLiteral;

  // $SchemaCustom
  Schema.custom<string>((val) => typeof val === "string") satisfies Schema.core.$SchemaCustom;

  // $SchemaTransform
  Schema.transform((val) => val as string) satisfies Schema.core.$SchemaTransform;

  // $SchemaNonOptional
  Schema.nonoptional(Schema.optional(Schema.string())) satisfies Schema.core.$SchemaNonOptional;

  // $SchemaReadonly
  Schema.readonly(Schema.object({ key: Schema.string() })) satisfies Schema.core.$SchemaReadonly;

  // $SchemaNaN
  Schema.nan() satisfies Schema.core.$SchemaNaN;

  // $SchemaPipe
  Schema.pipe(Schema.unknown(), Schema.number()) satisfies Schema.core.$SchemaPipe;

  // $SchemaSuccess
  Schema.success(Schema.string()) satisfies Schema.core.$SchemaSuccess;

  // $SchemaCatch
  Schema.catch(Schema.string(), "fallback") satisfies Schema.core.$SchemaCatch;

  // $SchemaFile
  Schema.file() satisfies Schema.core.$SchemaFile;
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
    webAddress: Schema.nullable(Schema.string()),
  });
  const Company = Schema.toSchema<Company>()(CompanySchema);

  expectTypeOf<Schema.output<typeof Company>>().toEqualTypeOf<Company>();

  const CoreCompany = Schema.core.toSchema<Company>()(CompanySchema);
  expectTypeOf<Schema.output<typeof CoreCompany>>().toEqualTypeOf<Company>();

  const UtilCompany = Schema.core.util.toSchema<Company>()(CompanySchema);
  expectTypeOf<Schema.output<typeof UtilCompany>>().toEqualTypeOf<Company>();

  const Transformed = Schema.toSchema<{ count: number }>()(
    Schema.object({
      count: Schema.pipe(
        Schema.string(),
        Schema.transform((value) => value.length)
      ),
    })
  );
  expectTypeOf<Schema.input<typeof Transformed>>().toEqualTypeOf<{ count: string }>();
  expectTypeOf<Schema.output<typeof Transformed>>().toEqualTypeOf<{ count: number }>();

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
      webAddress: Schema.nullable(Schema.string()),
      extra: Schema.string(),
    })
  );

  Schema.toSchema<Company>()(
    // @ts-expect-error wrong property output fails matching
    Schema.object({
      id: Schema.number(),
      name: Schema.string(),
      webAddress: Schema.nullable(Schema.string()),
    })
  );
});

test("assignability with type narrowing", () => {
  type _RefinedSchema<T extends Schema.SchemaMiniType<object> | Schema.SchemaMiniUnion> = T extends Schema.SchemaMiniUnion
    ? RefinedUnionSchema<T> // <-- Type instantiation is excessively deep and possibly infinite.
    : T extends Schema.SchemaMiniType<object>
      ? RefinedTypeSchema<Schema.output<T>> // <-- Type instantiation is excessively deep and possibly infinite.
      : never;

  type RefinedTypeSchema<T extends object> = T;

  type RefinedUnionSchema<T extends Schema.SchemaMiniUnion> = T;
});
