import * as core from "../core/index.js";
import * as schemas from "./schemas.js";

// @__NO_SIDE_EFFECTS__
export function string<T = unknown>(params?: string | core.$SchemaStringParams): schemas.SchemaMiniString<T> {
  return core._coercedString(schemas.SchemaMiniString, params) as schemas.SchemaMiniString<T>;
}

// @__NO_SIDE_EFFECTS__
export function number<T = unknown>(params?: string | core.$SchemaNumberParams): schemas.SchemaMiniNumber<T> {
  return core._coercedNumber(schemas.SchemaMiniNumber, params) as schemas.SchemaMiniNumber<T>;
}

// @__NO_SIDE_EFFECTS__
export function boolean<T = unknown>(params?: string | core.$SchemaBooleanParams): schemas.SchemaMiniBoolean<T> {
  return core._coercedBoolean(schemas.SchemaMiniBoolean, params) as schemas.SchemaMiniBoolean<T>;
}

// @__NO_SIDE_EFFECTS__
export function bigint<T = unknown>(params?: string | core.$SchemaBigIntParams): schemas.SchemaMiniBigInt<T> {
  return core._coercedBigint(schemas.SchemaMiniBigInt, params) as schemas.SchemaMiniBigInt<T>;
}

// @__NO_SIDE_EFFECTS__
export function date<T = unknown>(params?: string | core.$SchemaDateParams): schemas.SchemaMiniDate<T> {
  return core._coercedDate(schemas.SchemaMiniDate, params) as schemas.SchemaMiniDate<T>;
}
