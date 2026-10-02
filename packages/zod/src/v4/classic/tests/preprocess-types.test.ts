import { expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";

test("SchemaPreprocess<B> assignable to SchemaPipe<$SchemaTransform, B>", () => {
  const pre = Schema.preprocess((v) => v, Schema.string().optional());
  const _asPipe: Schema.SchemaPipe<Schema.core.$SchemaTransform, Schema.SchemaOptional<Schema.SchemaString>> = pre;
  const _asCorePipe: Schema.core.$SchemaPipe<Schema.core.$SchemaTransform, Schema.SchemaOptional<Schema.SchemaString>> = pre;
  expectTypeOf(_asPipe).toMatchTypeOf<Schema.SchemaPipe>();
  expectTypeOf(_asCorePipe).toMatchTypeOf<Schema.core.$SchemaPipe>();
});

test("SchemaPreprocess optin/optout defer to B", () => {
  const optionalInside = Schema.preprocess((v) => v, Schema.string().optional());
  expectTypeOf<(typeof optionalInside)["_schema"]["optin"]>().toEqualTypeOf<"optional" | "defaulted">();
  expectTypeOf<(typeof optionalInside)["_schema"]["optout"]>().toEqualTypeOf<"optional">();

  const required = Schema.preprocess((v) => v, Schema.string());
  expectTypeOf<(typeof required)["_schema"]["optin"]>().toEqualTypeOf<"optional" | "defaulted" | undefined>();
  expectTypeOf<(typeof required)["_schema"]["optout"]>().toEqualTypeOf<"optional" | undefined>();
});

test("SchemaPreprocess input/output inference", () => {
  const pre = Schema.preprocess((v) => v, Schema.number().optional());
  expectTypeOf<Schema.output<typeof pre>>().toEqualTypeOf<number | undefined>();
  expectTypeOf<Schema.input<typeof pre>>().toEqualTypeOf<unknown>();
});

test("SchemaPreprocess narrows input from an annotated preprocessor arg", () => {
  const trimmed = Schema.preprocess((val: string | null | undefined) => val?.trim() ?? "", Schema.string());
  expectTypeOf<Schema.input<typeof trimmed>>().toEqualTypeOf<string | null | undefined>();
  expectTypeOf<Schema.output<typeof trimmed>>().toEqualTypeOf<string>();

  const obj = Schema.object({ a: Schema.preprocess((v: string | number) => String(v), Schema.string()) });
  expectTypeOf<Schema.input<typeof obj>>().toEqualTypeOf<{ a: string | number }>();
  expectTypeOf<Schema.output<typeof obj>>().toEqualTypeOf<{ a: string }>();
});

// The narrowing must ride on the transform's input only. Binding its output too makes $SchemaPipeDef's codec-only `transform?` field contravariant in the preprocessor's return type, which drops the bare-type assignability below.
test("narrowed SchemaPreprocess still assignable to the bare type", () => {
  const pre = Schema.preprocess((v: string) => v.length, Schema.number());
  const _bare: Schema.SchemaPreprocess<Schema.SchemaNumber> = pre;
  const _bareCore: Schema.core.$SchemaPreprocess = pre;
  expectTypeOf<(typeof pre)["_schema"]["optin"]>().toEqualTypeOf<"optional" | "defaulted" | undefined>();
});
