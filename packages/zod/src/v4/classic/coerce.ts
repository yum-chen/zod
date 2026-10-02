import * as core from "../core/index.js";
import * as schemas from "./schemas.js";

export interface SchemaCoercedString<T = unknown> extends schemas._SchemaString<core.$SchemaStringInternals<T>> {}
export function string<T = unknown>(params?: string | core.$SchemaStringParams): SchemaCoercedString<T> {
  return core._coercedString(schemas.SchemaString, params) as any;
}

export interface SchemaCoercedNumber<T = unknown> extends schemas._SchemaNumber<core.$SchemaNumberInternals<T>> {}
export function number<T = unknown>(params?: string | core.$SchemaNumberParams): SchemaCoercedNumber<T> {
  return core._coercedNumber(schemas.SchemaNumber, params) as SchemaCoercedNumber<T>;
}

export interface SchemaCoercedBoolean<T = unknown> extends schemas._SchemaBoolean<core.$SchemaBooleanInternals<T>> {}
export function boolean<T = unknown>(params?: string | core.$SchemaBooleanParams): SchemaCoercedBoolean<T> {
  return core._coercedBoolean(schemas.SchemaBoolean, params) as SchemaCoercedBoolean<T>;
}

export interface SchemaCoercedBigInt<T = unknown> extends schemas._SchemaBigInt<core.$SchemaBigIntInternals<T>> {}
export function bigint<T = unknown>(params?: string | core.$SchemaBigIntParams): SchemaCoercedBigInt<T> {
  return core._coercedBigint(schemas.SchemaBigInt, params) as SchemaCoercedBigInt<T>;
}

export interface SchemaCoercedDate<T = unknown> extends schemas._SchemaDate<core.$SchemaDateInternals<T>> {}
export function date<T = unknown>(params?: string | core.$SchemaDateParams): SchemaCoercedDate<T> {
  return core._coercedDate(schemas.SchemaDate, params) as SchemaCoercedDate<T>;
}
