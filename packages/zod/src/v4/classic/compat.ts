// Schema 3 compat layer

import * as core from "../core/index.js";
import type { SchemaType } from "./schemas.js";

/** @deprecated Use `Schema.output<T>` instead. */
export type TypeOf<T> = core.output<T>;
/** @deprecated Use `Schema.output<T>` instead. */
export type Infer<T> = core.output<T>;
/** @deprecated Use `Schema.core.$SchemaTypes` instead */
export type SchemaFirstPartySchemaTypes = core.$SchemaTypes;

/** @deprecated Use the raw string literal codes instead, e.g. "invalid_type". */
export const SchemaIssueCode = {
  invalid_type: "invalid_type",
  too_big: "too_big",
  too_small: "too_small",
  invalid_format: "invalid_format",
  not_multiple_of: "not_multiple_of",
  unrecognized_keys: "unrecognized_keys",
  invalid_union: "invalid_union",
  invalid_key: "invalid_key",
  invalid_element: "invalid_element",
  invalid_value: "invalid_value",
  custom: "custom",
} as const;

/** @deprecated Use `Schema.core.$SchemaFlattenedError<Schema.output<T>>` instead; it takes an inferred type, not a Schema. */
export type inferFlattenedErrors<T extends core.$SchemaType, U = string> = core.$SchemaFlattenedError<core.output<T>, U>;

/** @deprecated Use `Schema.core.$SchemaFormattedError<Schema.output<T>>` instead; it takes an inferred type, not a Schema. */
export type inferFormattedError<T extends core.$SchemaType<any, any>, U = string> = core.$SchemaFormattedError<
  core.output<T>,
  U
>;

/** Use `Schema.$brand` instead */
export type BRAND<T extends string | number | symbol = string | number | symbol> = {
  [core.$brand]: { [k in T]: true };
};
export { $brand, config } from "../core/index.js";

/** @deprecated Use `Schema.config(params)` instead. */
export function setErrorMap(map: core.$SchemaErrorMap): void {
  core.config({
    customError: map,
  });
}

/** @deprecated Use `Schema.config()` instead. */
export function getErrorMap(): core.$SchemaErrorMap<core.$SchemaIssue> | undefined {
  return core.config().customError;
}

/** @deprecated Use Schema.SchemaType (without generics) instead. */
export type SchemaTypeAny<
  Output = unknown,
  Input = unknown,
  Internals extends core.$SchemaTypeInternals<Output, Input> = core.$SchemaTypeInternals<Output, Input>,
> = SchemaType<Output, Input, Internals>;
/** @deprecated Use `Schema.SchemaType` */
export type SchemaSchema<
  Output = unknown,
  Input = unknown,
  Internals extends core.$SchemaTypeInternals<Output, Input> = core.$SchemaTypeInternals<Output, Input>,
> = SchemaType<Output, Input, Internals>;
/** @deprecated Use `Schema.SchemaType` */
export type Schema<
  Output = unknown,
  Input = unknown,
  Internals extends core.$SchemaTypeInternals<Output, Input> = core.$SchemaTypeInternals<Output, Input>,
> = SchemaType<Output, Input, Internals>;

/** Included for Schema 3 compatibility */
export type SchemaRawShape = core.$SchemaShape;

/** @deprecated Do not use. Stub definition, only included for schema-to-json-schema compatibility. */
export enum SchemaFirstPartyTypeKind {}
