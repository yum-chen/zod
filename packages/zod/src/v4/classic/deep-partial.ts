import type * as core from "../core/index.js";
import { visit } from "../core/visit.js";
import * as schemas from "./schemas.js";

/** Distributes `.partial()` through every object in a schema type, preserving the wrappers around them. */
// biome-ignore format: preserve vertical layout for readability.
export type DeepPartial<T extends core.SomeType> =
  T extends schemas.SchemaObject<infer Shape, infer Config>
    ? schemas.SchemaObject<
        { -readonly [K in keyof Shape]: schemas.SchemaOptional<DeepPartial<Shape[K]>> },
        Config
      >
  // Must precede SchemaUnion; degrades to it, matching the runtime.
  : T extends schemas.SchemaDiscriminatedUnion<infer Options, any>
    ? schemas.SchemaUnion<
        { -readonly [I in keyof Options]: Options[I] extends core.SomeType ? DeepPartial<Options[I]> : Options[I] }
      >
  : T extends schemas.SchemaUnion<infer Options>
    ? schemas.SchemaUnion<
        { -readonly [I in keyof Options]: Options[I] extends core.SomeType ? DeepPartial<Options[I]> : Options[I] }
      >
  : T extends schemas.SchemaArray<infer El>
    ? schemas.SchemaArray<DeepPartial<El>>
  : T extends schemas.SchemaTuple<infer Items, infer Rest>
    ? schemas.SchemaTuple<
        { -readonly [K in keyof Items]: Items[K] extends core.SomeType ? DeepPartial<Items[K]> : Items[K] },
        Rest extends core.SomeType ? DeepPartial<Rest> : Rest
      >
  : T extends schemas.SchemaIntersection<infer A, infer B>
    ? schemas.SchemaIntersection<DeepPartial<A>, DeepPartial<B>>
  : T extends schemas.SchemaRecord<infer K, infer V>
    ? schemas.SchemaRecord<K, DeepPartial<V>>
  : T extends schemas.SchemaMap<infer K, infer V>
    ? schemas.SchemaMap<K, DeepPartial<V>>
  : T extends schemas.SchemaSet<infer El>
    ? schemas.SchemaSet<DeepPartial<El>>
  : T extends schemas.SchemaOptional<infer Inner>
    ? schemas.SchemaOptional<DeepPartial<Inner>>
  : T extends schemas.SchemaNullable<infer Inner>
    ? schemas.SchemaNullable<DeepPartial<Inner>>
  : T extends schemas.SchemaDefault<infer Inner>
    ? schemas.SchemaDefault<DeepPartial<Inner>>
  : T extends schemas.SchemaPrefault<infer Inner>
    ? schemas.SchemaPrefault<DeepPartial<Inner>>
  : T extends schemas.SchemaNonOptional<infer Inner>
    ? schemas.SchemaNonOptional<DeepPartial<Inner>>
  : T extends schemas.SchemaCatch<infer Inner>
    ? schemas.SchemaCatch<DeepPartial<Inner>>
  : T extends schemas.SchemaReadonly<infer Inner>
    ? schemas.SchemaReadonly<DeepPartial<Inner>>
  : T extends schemas.SchemaSuccess<infer Inner>
    ? schemas.SchemaSuccess<DeepPartial<Inner>>
  : T extends schemas.SchemaPromise<infer Inner>
    ? schemas.SchemaPromise<DeepPartial<Inner>>
  // Must precede SchemaPipe, which both extend structurally, or the subtype is lost.
  : T extends schemas.SchemaCodec<infer A, infer B>
    ? schemas.SchemaCodec<DeepPartial<A>, DeepPartial<B>>
  : T extends schemas.SchemaPreprocess<infer B>
    ? schemas.SchemaPreprocess<DeepPartial<B>>
  : T extends schemas.SchemaPipe<infer A, infer B>
    ? schemas.SchemaPipe<DeepPartial<A>, DeepPartial<B>>
  : T extends schemas.SchemaLazy<infer Inner>
    ? schemas.SchemaLazy<DeepPartial<Inner>>
  : T;

/** Returns a copy of the schema with every nested object's properties made optional. */
export function deepPartial<T extends core.SomeType>(schema: T): DeepPartial<T> {
  return visit(schema, {
    object: (s) => (s as schemas.SchemaObject).partial(),
    // Every partialed option now admits `undefined`, which the constructor rejects as a duplicate.
    union: (s) => {
      const def = s._schema.def as core.$SchemaDiscriminatedUnionDef;
      return def.discriminator === undefined ? s : schemas.union(def.options as schemas.SchemaType[]);
    },
  }) as unknown as DeepPartial<T>;
}
