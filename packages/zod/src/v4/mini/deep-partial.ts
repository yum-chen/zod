import type * as core from "../core/index.js";
import { visit } from "../core/visit.js";
import * as schemas from "./schemas.js";

/** Mini counterpart of `classic/deep-partial.ts`'s `DeepPartial`. */
// biome-ignore format: preserve vertical layout for readability.
export type DeepPartial<T extends core.SomeType> =
  T extends schemas.SchemaMiniObject<infer Shape, infer Config>
    ? schemas.SchemaMiniObject<
        { -readonly [K in keyof Shape]: schemas.SchemaMiniOptional<DeepPartial<Shape[K]>> },
        Config
      >
  : T extends schemas.SchemaMiniDiscriminatedUnion<infer Options, any>
    ? schemas.SchemaMiniUnion<
        { -readonly [I in keyof Options]: Options[I] extends core.SomeType ? DeepPartial<Options[I]> : Options[I] }
      >
  : T extends schemas.SchemaMiniUnion<infer Options>
    ? schemas.SchemaMiniUnion<
        { -readonly [I in keyof Options]: Options[I] extends core.SomeType ? DeepPartial<Options[I]> : Options[I] }
      >
  : T extends schemas.SchemaMiniArray<infer El>
    ? schemas.SchemaMiniArray<DeepPartial<El>>
  : T extends schemas.SchemaMiniTuple<infer Items, infer Rest>
    ? schemas.SchemaMiniTuple<
        { -readonly [K in keyof Items]: Items[K] extends core.SomeType ? DeepPartial<Items[K]> : Items[K] },
        Rest extends core.SomeType ? DeepPartial<Rest> : Rest
      >
  : T extends schemas.SchemaMiniIntersection<infer A, infer B>
    ? schemas.SchemaMiniIntersection<DeepPartial<A>, DeepPartial<B>>
  : T extends schemas.SchemaMiniRecord<infer K, infer V>
    ? schemas.SchemaMiniRecord<K, DeepPartial<V>>
  : T extends schemas.SchemaMiniMap<infer K, infer V>
    ? schemas.SchemaMiniMap<K, DeepPartial<V>>
  : T extends schemas.SchemaMiniSet<infer El>
    ? schemas.SchemaMiniSet<DeepPartial<El>>
  : T extends schemas.SchemaMiniOptional<infer Inner>
    ? schemas.SchemaMiniOptional<DeepPartial<Inner>>
  : T extends schemas.SchemaMiniNullable<infer Inner>
    ? schemas.SchemaMiniNullable<DeepPartial<Inner>>
  : T extends schemas.SchemaMiniDefault<infer Inner>
    ? schemas.SchemaMiniDefault<DeepPartial<Inner>>
  : T extends schemas.SchemaMiniPrefault<infer Inner>
    ? schemas.SchemaMiniPrefault<DeepPartial<Inner>>
  : T extends schemas.SchemaMiniNonOptional<infer Inner>
    ? schemas.SchemaMiniNonOptional<DeepPartial<Inner>>
  : T extends schemas.SchemaMiniCatch<infer Inner>
    ? schemas.SchemaMiniCatch<DeepPartial<Inner>>
  : T extends schemas.SchemaMiniReadonly<infer Inner>
    ? schemas.SchemaMiniReadonly<DeepPartial<Inner>>
  : T extends schemas.SchemaMiniSuccess<infer Inner>
    ? schemas.SchemaMiniSuccess<DeepPartial<Inner>>
  : T extends schemas.SchemaMiniPromise<infer Inner>
    ? schemas.SchemaMiniPromise<DeepPartial<Inner>>
  // Must precede SchemaMiniPipe, which it extends structurally.
  : T extends schemas.SchemaMiniCodec<infer A, infer B>
    ? schemas.SchemaMiniCodec<DeepPartial<A>, DeepPartial<B>>
  : T extends schemas.SchemaMiniPipe<infer A, infer B>
    ? schemas.SchemaMiniPipe<DeepPartial<A>, DeepPartial<B>>
  : T extends schemas.SchemaMiniLazy<infer Inner>
    ? schemas.SchemaMiniLazy<DeepPartial<Inner>>
  : T;

/** See `classic/deep-partial.ts`. Mini variant uses `mini.partial(...)`. */
export function deepPartial<T extends core.SomeType>(schema: T): DeepPartial<T> {
  return visit(schema, {
    object: (s) => schemas.partial(s as schemas.SchemaMiniObject),
    // See `classic/deep-partial.ts`.
    union: (s) => {
      const def = s._schema.def as core.$SchemaDiscriminatedUnionDef;
      return def.discriminator === undefined ? s : schemas.union(def.options as schemas.SchemaMiniType[]);
    },
  }) as unknown as DeepPartial<T>;
}
