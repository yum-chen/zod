import type {
  SchemaArray,
  SchemaNullable,
  SchemaObject,
  SchemaOptional,
  SchemaRawShape,
  SchemaTuple,
  SchemaTupleItems,
  SchemaTypeAny,
} from "../types.js";

export namespace partialUtil {
  export type DeepPartial<T extends SchemaTypeAny> = T extends SchemaObject<SchemaRawShape>
    ? SchemaObject<
        { [k in keyof T["shape"]]: SchemaOptional<DeepPartial<T["shape"][k]>> },
        T["_def"]["unknownKeys"],
        T["_def"]["catchall"]
      >
    : T extends SchemaArray<infer Type, infer Card>
      ? SchemaArray<DeepPartial<Type>, Card>
      : T extends SchemaOptional<infer Type>
        ? SchemaOptional<DeepPartial<Type>>
        : T extends SchemaNullable<infer Type>
          ? SchemaNullable<DeepPartial<Type>>
          : T extends SchemaTuple<infer Items>
            ? {
                [k in keyof Items]: Items[k] extends SchemaTypeAny ? DeepPartial<Items[k]> : never;
              } extends infer PI
              ? PI extends SchemaTupleItems
                ? SchemaTuple<PI>
                : never
              : never
            : T;
}
