import * as checks from "./checks.js";
import type * as core from "./core.js";
import type * as errors from "./errors.js";
import * as registries from "./registries.js";
import * as schemas from "./schemas.js";
import * as util from "./util.js";

export type Params<
  T extends schemas.$SchemaType | checks.$SchemaCheck,
  IssueTypes extends errors.$SchemaIssueBase,
  OmitKeys extends keyof T["_schema"]["def"] = never,
> = util.Flatten<
  Partial<
    util.EmptyToNever<
      Omit<T["_schema"]["def"], OmitKeys> &
        ([IssueTypes] extends [never]
          ? {} // unknown
          : {
              error?: string | errors.$SchemaErrorMap<IssueTypes> | undefined;
              /** @deprecated This parameter is deprecated. Use `error` instead. */
              message?: string | undefined; // supported in Schema 3
            })
    >
  >
>;

export type TypeParams<
  T extends schemas.$SchemaType = schemas.$SchemaType & { _isst: never },
  AlsoOmit extends Exclude<keyof T["_schema"]["def"], "type" | "checks" | "error"> = never,
> = Params<T, NonNullable<T["_schema"]["isst"]>, "type" | "checks" | "error" | AlsoOmit>;

// strips types that are not exposed in the public factory
// incl. `error`, `check`
export type CheckParams<
  T extends checks.$SchemaCheck = checks.$SchemaCheck, // & { _issc: never },
  AlsoOmit extends Exclude<keyof T["_schema"]["def"], "check" | "error"> = never,
> = Params<T, NonNullable<T["_schema"]["issc"]>, "check" | "error" | AlsoOmit>;

// strips types that are not exposed in the public factory
// incl. `type`, `checks`, `error`, `check`, `format`
export type StringFormatParams<
  T extends schemas.$SchemaStringFormat = schemas.$SchemaStringFormat,
  AlsoOmit extends Exclude<keyof T["_schema"]["def"], "type" | "coerce" | "checks" | "error" | "check" | "format"> = never,
> = Params<
  T,
  NonNullable<T["_schema"]["isst"] | T["_schema"]["issc"]>,
  "type" | "coerce" | "checks" | "error" | "check" | "format" | AlsoOmit
>;

export type CheckStringFormatParams<
  T extends schemas.$SchemaStringFormat = schemas.$SchemaStringFormat,
  AlsoOmit extends Exclude<keyof T["_schema"]["def"], "type" | "coerce" | "checks" | "error" | "check" | "format"> = never,
> = Params<T, NonNullable<T["_schema"]["issc"]>, "type" | "coerce" | "checks" | "error" | "check" | "format" | AlsoOmit>;

export type CheckTypeParams<
  T extends schemas.$SchemaType & checks.$SchemaCheck = schemas.$SchemaType & checks.$SchemaCheck,
  AlsoOmit extends Exclude<keyof T["_schema"]["def"], "type" | "checks" | "error" | "check"> = never,
> = Params<T, NonNullable<T["_schema"]["isst"] | T["_schema"]["issc"]>, "type" | "checks" | "error" | "check" | AlsoOmit>;

// String
export type $SchemaStringParams = TypeParams<schemas.$SchemaString<string>, "coerce"> & {
  checks?: readonly checks.$SchemaCheck<string>[];
};

function snapshotChecks<T extends { checks?: readonly checks.$SchemaCheck<never>[] }>(def: T) {
  if (def.checks) def.checks = [...def.checks];
  return def as T & { checks?: NonNullable<T["checks"]>[number][] };
}
// @__NO_SIDE_EFFECTS__
export function _string<T extends schemas.$SchemaString>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaStringParams
): T {
  return new Class(snapshotChecks({ type: "string" as const, ...util.normalizeParams(params) }));
}

// @__NO_SIDE_EFFECTS__
export function _coercedString<T extends schemas.$SchemaString>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaStringParams
): T {
  return new Class(snapshotChecks({ type: "string" as const, coerce: true, ...util.normalizeParams(params) }));
}

export type $SchemaStringFormatParams = CheckTypeParams<
  schemas.$SchemaStringFormat,
  "format" | "coerce" | "when" | "pattern"
>;
export type $SchemaCheckStringFormatParams = CheckParams<checks.$SchemaCheckStringFormat, "format">;
// custom format

// Email
export type $SchemaEmailParams = StringFormatParams<schemas.$SchemaEmail, "when">;
export type $SchemaCheckEmailParams = CheckStringFormatParams<schemas.$SchemaEmail, "when">;
// @__NO_SIDE_EFFECTS__
export function _email<T extends schemas.$SchemaEmail>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaEmailParams | $SchemaCheckEmailParams
): T {
  return new Class({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// GUID
export type $SchemaGUIDParams = StringFormatParams<schemas.$SchemaGUID, "pattern" | "when">;
export type $SchemaCheckGUIDParams = CheckStringFormatParams<schemas.$SchemaGUID, "pattern" | "when">;
// @__NO_SIDE_EFFECTS__
export function _guid<T extends schemas.$SchemaGUID>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaGUIDParams | $SchemaCheckGUIDParams
): T {
  return new Class({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// UUID
export type $SchemaUUIDParams = StringFormatParams<schemas.$SchemaUUID, "pattern" | "when">;
export type $SchemaCheckUUIDParams = CheckStringFormatParams<schemas.$SchemaUUID, "pattern" | "when">;
// @__NO_SIDE_EFFECTS__
export function _uuid<T extends schemas.$SchemaUUID>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaUUIDParams | $SchemaCheckUUIDParams
): T {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// UUIDv4
export type $SchemaUUIDv4Params = StringFormatParams<schemas.$SchemaUUID, "pattern" | "when">;
export type $SchemaCheckUUIDv4Params = CheckStringFormatParams<schemas.$SchemaUUID, "pattern" | "when">;
// @__NO_SIDE_EFFECTS__
export function _uuidv4<T extends schemas.$SchemaUUID>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaUUIDv4Params | $SchemaCheckUUIDv4Params
): T {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...util.normalizeParams(params),
  });
}

// UUIDv6
export type $SchemaUUIDv6Params = StringFormatParams<schemas.$SchemaUUID, "pattern" | "when">;
export type $SchemaCheckUUIDv6Params = CheckStringFormatParams<schemas.$SchemaUUID, "pattern" | "when">;
// @__NO_SIDE_EFFECTS__
export function _uuidv6<T extends schemas.$SchemaUUID>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaUUIDv6Params | $SchemaCheckUUIDv6Params
): T {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...util.normalizeParams(params),
  });
}

// UUIDv7
export type $SchemaUUIDv7Params = StringFormatParams<schemas.$SchemaUUID, "pattern" | "when">;
export type $SchemaCheckUUIDv7Params = CheckStringFormatParams<schemas.$SchemaUUID, "pattern" | "when">;
// @__NO_SIDE_EFFECTS__
export function _uuidv7<T extends schemas.$SchemaUUID>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaUUIDv7Params | $SchemaCheckUUIDv7Params
): T {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...util.normalizeParams(params),
  });
}

// URL
export type $SchemaURLParams = StringFormatParams<schemas.$SchemaURL, "when">;
export type $SchemaCheckURLParams = CheckStringFormatParams<schemas.$SchemaURL, "when">;
// @__NO_SIDE_EFFECTS__
export function _url<T extends schemas.$SchemaURL>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaURLParams | $SchemaCheckURLParams
): T {
  return new Class({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// Emoji
export type $SchemaEmojiParams = StringFormatParams<schemas.$SchemaEmoji, "when">;
export type $SchemaCheckEmojiParams = CheckStringFormatParams<schemas.$SchemaEmoji, "when">;
// @__NO_SIDE_EFFECTS__
export function _emoji<T extends schemas.$SchemaEmoji>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaEmojiParams | $SchemaCheckEmojiParams
): T {
  return new Class({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// NanoID
export type $SchemaNanoIDParams = StringFormatParams<schemas.$SchemaNanoID, "when" | "pattern">;
export type $SchemaCheckNanoIDParams = CheckStringFormatParams<schemas.$SchemaNanoID, "when" | "pattern">;
// @__NO_SIDE_EFFECTS__
export function _nanoid<T extends schemas.$SchemaNanoID>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaNanoIDParams | $SchemaCheckNanoIDParams
): T {
  return new Class({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// CUID
/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link _cuid2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
export type $SchemaCUIDParams = StringFormatParams<schemas.$SchemaCUID, "when">;
/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link _cuid2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
export type $SchemaCheckCUIDParams = CheckStringFormatParams<schemas.$SchemaCUID, "when">;
/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link _cuid2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
// @__NO_SIDE_EFFECTS__
export function _cuid<T extends schemas.$SchemaCUID>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaCUIDParams | $SchemaCheckCUIDParams
): T {
  return new Class({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// CUID2
export type $SchemaCUID2Params = StringFormatParams<schemas.$SchemaCUID2, "when">;
export type $SchemaCheckCUID2Params = CheckStringFormatParams<schemas.$SchemaCUID2, "when">;
// @__NO_SIDE_EFFECTS__
export function _cuid2<T extends schemas.$SchemaCUID2>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaCUID2Params | $SchemaCheckCUID2Params
): T {
  return new Class({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// ULID
export type $SchemaULIDParams = StringFormatParams<schemas.$SchemaULID, "when">;
export type $SchemaCheckULIDParams = CheckStringFormatParams<schemas.$SchemaULID, "when">;
// @__NO_SIDE_EFFECTS__
export function _ulid<T extends schemas.$SchemaULID>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaULIDParams | $SchemaCheckULIDParams
): T {
  return new Class({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// XID
export type $SchemaXIDParams = StringFormatParams<schemas.$SchemaXID, "when">;
export type $SchemaCheckXIDParams = CheckStringFormatParams<schemas.$SchemaXID, "when">;
// @__NO_SIDE_EFFECTS__
export function _xid<T extends schemas.$SchemaXID>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaXIDParams | $SchemaCheckXIDParams
): T {
  return new Class({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// KSUID
export type $SchemaKSUIDParams = StringFormatParams<schemas.$SchemaKSUID, "when">;
export type $SchemaCheckKSUIDParams = CheckStringFormatParams<schemas.$SchemaKSUID, "when">;
// @__NO_SIDE_EFFECTS__
export function _ksuid<T extends schemas.$SchemaKSUID>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaKSUIDParams | $SchemaCheckKSUIDParams
): T {
  return new Class({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// IPv4
export type $SchemaIPv4Params = StringFormatParams<schemas.$SchemaIPv4, "pattern" | "when" | "version">;
export type $SchemaCheckIPv4Params = CheckStringFormatParams<schemas.$SchemaIPv4, "pattern" | "when" | "version">;
// @__NO_SIDE_EFFECTS__
export function _ipv4<T extends schemas.$SchemaIPv4>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaIPv4Params | $SchemaCheckIPv4Params
): T {
  return new Class({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// IPv6
export type $SchemaIPv6Params = StringFormatParams<schemas.$SchemaIPv6, "pattern" | "when" | "version">;
export type $SchemaCheckIPv6Params = CheckStringFormatParams<schemas.$SchemaIPv6, "pattern" | "when" | "version">;
// @__NO_SIDE_EFFECTS__
export function _ipv6<T extends schemas.$SchemaIPv6>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaIPv6Params | $SchemaCheckIPv6Params
): T {
  return new Class({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// MAC
export type $SchemaMACParams = StringFormatParams<schemas.$SchemaMAC, "pattern" | "when">;
export type $SchemaCheckMACParams = CheckStringFormatParams<schemas.$SchemaMAC, "pattern" | "when">;
// @__NO_SIDE_EFFECTS__
export function _mac<T extends schemas.$SchemaMAC>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaMACParams | $SchemaCheckMACParams
): T {
  return new Class({
    type: "string",
    format: "mac",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// CIDRv4
export type $SchemaCIDRv4Params = StringFormatParams<schemas.$SchemaCIDRv4, "pattern" | "when">;
export type $SchemaCheckCIDRv4Params = CheckStringFormatParams<schemas.$SchemaCIDRv4, "pattern" | "when">;
// @__NO_SIDE_EFFECTS__
export function _cidrv4<T extends schemas.$SchemaCIDRv4>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaCIDRv4Params | $SchemaCheckCIDRv4Params
): T {
  return new Class({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// CIDRv6
export type $SchemaCIDRv6Params = StringFormatParams<schemas.$SchemaCIDRv6, "pattern" | "when">;
export type $SchemaCheckCIDRv6Params = CheckStringFormatParams<schemas.$SchemaCIDRv6, "pattern" | "when">;
// @__NO_SIDE_EFFECTS__
export function _cidrv6<T extends schemas.$SchemaCIDRv6>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaCIDRv6Params | $SchemaCheckCIDRv6Params
): T {
  return new Class({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// Base64
export type $SchemaBase64Params = StringFormatParams<schemas.$SchemaBase64, "pattern" | "when">;
export type $SchemaCheckBase64Params = CheckStringFormatParams<schemas.$SchemaBase64, "pattern" | "when">;
// @__NO_SIDE_EFFECTS__
export function _base64<T extends schemas.$SchemaBase64>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaBase64Params | $SchemaCheckBase64Params
): T {
  return new Class({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// base64url
export type $SchemaBase64URLParams = StringFormatParams<schemas.$SchemaBase64URL, "pattern" | "when">;
export type $SchemaCheckBase64URLParams = CheckStringFormatParams<schemas.$SchemaBase64URL, "pattern" | "when">;
// @__NO_SIDE_EFFECTS__
export function _base64url<T extends schemas.$SchemaBase64URL>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaBase64URLParams | $SchemaCheckBase64URLParams
): T {
  return new Class({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// E164
export type $SchemaE164Params = StringFormatParams<schemas.$SchemaE164, "when">;
export type $SchemaCheckE164Params = CheckStringFormatParams<schemas.$SchemaE164, "when">;
// @__NO_SIDE_EFFECTS__
export function _e164<T extends schemas.$SchemaE164>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaE164Params | $SchemaCheckE164Params
): T {
  return new Class({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// CreditCard
export type $SchemaCreditCardParams = StringFormatParams<schemas.$SchemaCreditCard, "pattern" | "when">;
export type $SchemaCheckCreditCardParams = CheckStringFormatParams<schemas.$SchemaCreditCard, "pattern" | "when">;
// @__NO_SIDE_EFFECTS__
export function _creditCard<T extends schemas.$SchemaCreditCard>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaCreditCardParams | $SchemaCheckCreditCardParams
): T {
  return new Class({
    type: "string",
    format: "credit_card",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// IBAN
export type $SchemaIBANParams = StringFormatParams<schemas.$SchemaIBAN, "pattern" | "when">;
export type $SchemaCheckIBANParams = CheckStringFormatParams<schemas.$SchemaIBAN, "pattern" | "when">;
// @__NO_SIDE_EFFECTS__
export function _iban<T extends schemas.$SchemaIBAN>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaIBANParams | $SchemaCheckIBANParams
): T {
  return new Class({
    type: "string",
    format: "iban",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

// JWT
export type $SchemaJWTParams = StringFormatParams<schemas.$SchemaJWT, "pattern" | "when">;
export type $SchemaCheckJWTParams = CheckStringFormatParams<schemas.$SchemaJWT, "pattern" | "when">;
// @__NO_SIDE_EFFECTS__
export function _jwt<T extends schemas.$SchemaJWT>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaJWTParams | $SchemaCheckJWTParams
): T {
  return new Class({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...util.normalizeParams(params),
  });
}

export const TimePrecision = {
  Any: null,
  Minute: -1,
  Second: 0,
  Millisecond: 3,
  Microsecond: 6,
} as const;
// ISODateTime
export type $SchemaISODateTimeParams = StringFormatParams<schemas.$SchemaISODateTime, "pattern" | "when">;
export type $SchemaCheckISODateTimeParams = CheckStringFormatParams<schemas.$SchemaISODateTime, "pattern" | "when">;
// @__NO_SIDE_EFFECTS__
export function _isoDateTime<T extends schemas.$SchemaISODateTime>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaISODateTimeParams | $SchemaCheckISODateTimeParams
): T {
  return new Class({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...util.normalizeParams(params),
  });
}

// ISODate
export type $SchemaISODateParams = StringFormatParams<schemas.$SchemaISODate, "pattern" | "when">;
export type $SchemaCheckISODateParams = CheckStringFormatParams<schemas.$SchemaISODate, "pattern" | "when">;
// @__NO_SIDE_EFFECTS__
export function _isoDate<T extends schemas.$SchemaISODate>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaISODateParams | $SchemaCheckISODateParams
): T {
  return new Class({
    type: "string",
    format: "date",
    check: "string_format",
    ...util.normalizeParams(params),
  });
}

// ISOTime
export type $SchemaISOTimeParams = StringFormatParams<schemas.$SchemaISOTime, "pattern" | "when">;
export type $SchemaCheckISOTimeParams = CheckStringFormatParams<schemas.$SchemaISOTime, "pattern" | "when">;
// @__NO_SIDE_EFFECTS__
export function _isoTime<T extends schemas.$SchemaISOTime>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaISOTimeParams | $SchemaCheckISOTimeParams
): T {
  return new Class({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...util.normalizeParams(params),
  });
}

// ISODuration
export type $SchemaISODurationParams = StringFormatParams<schemas.$SchemaISODuration, "when">;
export type $SchemaCheckISODurationParams = CheckStringFormatParams<schemas.$SchemaISODuration, "when">;
// @__NO_SIDE_EFFECTS__
export function _isoDuration<T extends schemas.$SchemaISODuration>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaISODurationParams | $SchemaCheckISODurationParams
): T {
  return new Class({
    type: "string",
    format: "duration",
    check: "string_format",
    ...util.normalizeParams(params),
  });
}

// Number
export type $SchemaNumberParams = TypeParams<schemas.$SchemaNumber<number>, "coerce"> & {
  checks?: readonly checks.$SchemaCheck<number>[];
};
export type $SchemaNumberFormatParams = CheckTypeParams<schemas.$SchemaNumberFormat, "format" | "coerce">;
export type $SchemaCheckNumberFormatParams = CheckParams<checks.$SchemaCheckNumberFormat, "format" | "when">;
// @__NO_SIDE_EFFECTS__
export function _number<T extends schemas.$SchemaNumber>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaNumberParams
): T {
  return new Class(snapshotChecks({ type: "number" as const, checks: [], ...util.normalizeParams(params) }));
}

// @__NO_SIDE_EFFECTS__
export function _coercedNumber<T extends schemas.$SchemaNumber>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaNumberParams
): T {
  return new Class(
    snapshotChecks({ type: "number" as const, coerce: true, checks: [], ...util.normalizeParams(params) })
  );
}

// @__NO_SIDE_EFFECTS__
export function _int<T extends schemas.$SchemaNumberFormat>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaCheckNumberFormatParams
): T {
  return new Class({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...util.normalizeParams(params),
  });
}
// @__NO_SIDE_EFFECTS__
export function _float32<T extends schemas.$SchemaNumberFormat>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaCheckNumberFormatParams
): T {
  return new Class({
    type: "number",
    check: "number_format",
    abort: false,
    format: "float32",
    ...util.normalizeParams(params),
  });
}
// @__NO_SIDE_EFFECTS__
export function _float64<T extends schemas.$SchemaNumberFormat>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaCheckNumberFormatParams
): T {
  return new Class({
    type: "number",
    check: "number_format",
    abort: false,
    format: "float64",
    ...util.normalizeParams(params),
  });
}
// @__NO_SIDE_EFFECTS__
export function _int32<T extends schemas.$SchemaNumberFormat>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaCheckNumberFormatParams
): T {
  return new Class({
    type: "number",
    check: "number_format",
    abort: false,
    format: "int32",
    ...util.normalizeParams(params),
  });
}
// @__NO_SIDE_EFFECTS__
export function _uint32<T extends schemas.$SchemaNumberFormat>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaCheckNumberFormatParams
): T {
  return new Class({
    type: "number",
    check: "number_format",
    abort: false,
    format: "uint32",
    ...util.normalizeParams(params),
  });
}

// Boolean
export type $SchemaBooleanParams = TypeParams<schemas.$SchemaBoolean<boolean>, "coerce">;
// @__NO_SIDE_EFFECTS__
export function _boolean<T extends schemas.$SchemaBoolean>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaBooleanParams
): T {
  return new Class({
    type: "boolean",
    ...util.normalizeParams(params),
  });
}
// @__NO_SIDE_EFFECTS__
export function _coercedBoolean<T extends schemas.$SchemaBoolean>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaBooleanParams
): T {
  return new Class({
    type: "boolean",
    coerce: true,
    ...util.normalizeParams(params),
  });
}

// BigInt
export type $SchemaBigIntParams = TypeParams<schemas.$SchemaBigInt<bigint>>;
export type $SchemaBigIntFormatParams = CheckTypeParams<schemas.$SchemaBigIntFormat, "format" | "coerce">;
export type $SchemaCheckBigIntFormatParams = CheckParams<checks.$SchemaCheckBigIntFormat, "format" | "when">;
// @__NO_SIDE_EFFECTS__
export function _bigint<T extends schemas.$SchemaBigInt>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaBigIntParams
): T {
  return new Class({
    type: "bigint",
    ...util.normalizeParams(params),
  });
}
// @__NO_SIDE_EFFECTS__
export function _coercedBigint<T extends schemas.$SchemaBigInt>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaBigIntParams
): T {
  return new Class({
    type: "bigint",
    coerce: true,
    ...util.normalizeParams(params),
  });
}

// @__NO_SIDE_EFFECTS__
export function _int64<T extends schemas.$SchemaBigIntFormat>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaBigIntFormatParams
): T {
  return new Class({
    type: "bigint",
    check: "bigint_format",
    abort: false,
    format: "int64",
    ...util.normalizeParams(params),
  });
}
// @__NO_SIDE_EFFECTS__
export function _uint64<T extends schemas.$SchemaBigIntFormat>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaBigIntFormatParams
): T {
  return new Class({
    type: "bigint",
    check: "bigint_format",
    abort: false,
    format: "uint64",
    ...util.normalizeParams(params),
  });
}

// Symbol
export type $SchemaSymbolParams = TypeParams<schemas.$SchemaSymbol>;
// @__NO_SIDE_EFFECTS__
export function _symbol<T extends schemas.$SchemaSymbol>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaSymbolParams
): T {
  return new Class({
    type: "symbol",
    ...util.normalizeParams(params),
  });
}

// Undefined
export type $SchemaUndefinedParams = TypeParams<schemas.$SchemaUndefined>;
// @__NO_SIDE_EFFECTS__
export function _undefined<T extends schemas.$SchemaUndefined>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaUndefinedParams
): T {
  return new Class({
    type: "undefined",
    ...util.normalizeParams(params),
  });
}

// Null
export type $SchemaNullParams = TypeParams<schemas.$SchemaNull>;
// @__NO_SIDE_EFFECTS__
export function _null<T extends schemas.$SchemaNull>(Class: util.SchemaClass<T>, params?: string | $SchemaNullParams): T {
  return new Class({
    type: "null",
    ...util.normalizeParams(params),
  });
}

// Any
export type $SchemaAnyParams = TypeParams<schemas.$SchemaAny>;
// @__NO_SIDE_EFFECTS__
export function _any<T extends schemas.$SchemaAny>(Class: util.SchemaClass<T>): T {
  return new Class({
    type: "any",
  });
}

// Unknown
export type $SchemaUnknownParams = TypeParams<schemas.$SchemaUnknown>;
// @__NO_SIDE_EFFECTS__
export function _unknown<T extends schemas.$SchemaUnknown>(Class: util.SchemaClass<T>): T {
  return new Class({
    type: "unknown",
  });
}

// Never
export type $SchemaNeverParams = TypeParams<schemas.$SchemaNever>;
// @__NO_SIDE_EFFECTS__
export function _never<T extends schemas.$SchemaNever>(Class: util.SchemaClass<T>, params?: string | $SchemaNeverParams): T {
  return new Class({
    type: "never",
    ...util.normalizeParams(params),
  });
}

// Void
export type $SchemaVoidParams = TypeParams<schemas.$SchemaVoid>;
// @__NO_SIDE_EFFECTS__
export function _void<T extends schemas.$SchemaVoid>(Class: util.SchemaClass<T>, params?: string | $SchemaVoidParams): T {
  return new Class({
    type: "void",
    ...util.normalizeParams(params),
  });
}

// Date
export type $SchemaDateParams = TypeParams<schemas.$SchemaDate, "coerce">;
// @__NO_SIDE_EFFECTS__
export function _date<T extends schemas.$SchemaDate>(Class: util.SchemaClass<T>, params?: string | $SchemaDateParams): T {
  return new Class({
    type: "date",
    ...util.normalizeParams(params),
  });
}
// @__NO_SIDE_EFFECTS__
export function _coercedDate<T extends schemas.$SchemaDate>(
  Class: util.SchemaClass<T>,
  params?: string | $SchemaDateParams
): T {
  return new Class({
    type: "date",
    coerce: true,
    ...util.normalizeParams(params),
  });
}

// NaN
export type $SchemaNaNParams = TypeParams<schemas.$SchemaNaN>;
// @__NO_SIDE_EFFECTS__
export function _nan<T extends schemas.$SchemaNaN>(Class: util.SchemaClass<T>, params?: string | $SchemaNaNParams): T {
  return new Class({
    type: "nan",
    ...util.normalizeParams(params),
  });
}

// export type $SchemaCheckParams = CheckParams<checks.$SchemaCheck, "abort" | "when">;

export type $SchemaCheckLessThanParams = CheckParams<checks.$SchemaCheckLessThan, "inclusive" | "value" | "when">;
// @__NO_SIDE_EFFECTS__
export function _lt(
  value: util.Numeric,
  params?: string | $SchemaCheckLessThanParams
): checks.$SchemaCheckLessThan<util.Numeric> {
  return new checks.$SchemaCheckLessThan({
    check: "less_than",
    ...util.normalizeParams(params),
    value,
    inclusive: false,
  });
}

// @__NO_SIDE_EFFECTS__
export function _lte(
  value: util.Numeric,
  params?: string | $SchemaCheckLessThanParams
): checks.$SchemaCheckLessThan<util.Numeric> {
  return new checks.$SchemaCheckLessThan({
    check: "less_than",

    ...util.normalizeParams(params),
    value,
    inclusive: true,
  });
}
export {
  /** @deprecated Use `Schema.lte()` instead. */
  _lte as _max,
};

// SchemaCheckGreaterThan
export type $SchemaCheckGreaterThanParams = CheckParams<checks.$SchemaCheckGreaterThan, "inclusive" | "value" | "when">;
// @__NO_SIDE_EFFECTS__
export function _gt(value: util.Numeric, params?: string | $SchemaCheckGreaterThanParams): checks.$SchemaCheckGreaterThan {
  return new checks.$SchemaCheckGreaterThan({
    check: "greater_than",

    ...util.normalizeParams(params),
    value,
    inclusive: false,
  });
}

// @__NO_SIDE_EFFECTS__
export function _gte(value: util.Numeric, params?: string | $SchemaCheckGreaterThanParams): checks.$SchemaCheckGreaterThan {
  return new checks.$SchemaCheckGreaterThan({
    check: "greater_than",
    ...util.normalizeParams(params),
    value,
    inclusive: true,
  });
}

export {
  /** @deprecated Use `Schema.gte()` instead. */
  _gte as _min,
};

// @__NO_SIDE_EFFECTS__
export function _positive(params?: string | $SchemaCheckGreaterThanParams): checks.$SchemaCheckGreaterThan {
  return _gt(0, params);
}

// negative
// @__NO_SIDE_EFFECTS__
export function _negative(params?: string | $SchemaCheckLessThanParams): checks.$SchemaCheckLessThan {
  return _lt(0, params);
}

// nonpositive
// @__NO_SIDE_EFFECTS__
export function _nonpositive(params?: string | $SchemaCheckLessThanParams): checks.$SchemaCheckLessThan {
  return _lte(0, params);
}

// nonnegative
// @__NO_SIDE_EFFECTS__
export function _nonnegative(params?: string | $SchemaCheckGreaterThanParams): checks.$SchemaCheckGreaterThan {
  return _gte(0, params);
}

export type $SchemaCheckMultipleOfParams = CheckParams<checks.$SchemaCheckMultipleOf, "value" | "when">;
// @__NO_SIDE_EFFECTS__
export function _multipleOf(
  value: number | bigint,
  params?: string | $SchemaCheckMultipleOfParams
): checks.$SchemaCheckMultipleOf {
  return new checks.$SchemaCheckMultipleOf({
    check: "multiple_of",
    ...util.normalizeParams(params),
    value,
  });
}

export type $SchemaCheckMaxSizeParams = CheckParams<checks.$SchemaCheckMaxSize, "maximum" | "when">;
// @__NO_SIDE_EFFECTS__
export function _maxSize(
  maximum: number,
  params?: string | $SchemaCheckMaxSizeParams
): checks.$SchemaCheckMaxSize<util.HasSize> {
  return new checks.$SchemaCheckMaxSize({
    check: "max_size",
    ...util.normalizeParams(params),
    maximum,
  });
}

export type $SchemaCheckMinSizeParams = CheckParams<checks.$SchemaCheckMinSize, "minimum" | "when">;
// @__NO_SIDE_EFFECTS__
export function _minSize(
  minimum: number,
  params?: string | $SchemaCheckMinSizeParams
): checks.$SchemaCheckMinSize<util.HasSize> {
  return new checks.$SchemaCheckMinSize({
    check: "min_size",
    ...util.normalizeParams(params),
    minimum,
  });
}

export type $SchemaCheckSizeEqualsParams = CheckParams<checks.$SchemaCheckSizeEquals, "size" | "when">;
// @__NO_SIDE_EFFECTS__
export function _size(
  size: number,
  params?: string | $SchemaCheckSizeEqualsParams
): checks.$SchemaCheckSizeEquals<util.HasSize> {
  return new checks.$SchemaCheckSizeEquals({
    check: "size_equals",
    ...util.normalizeParams(params),
    size,
  });
}

export type $SchemaCheckMaxLengthParams = CheckParams<checks.$SchemaCheckMaxLength, "maximum" | "when">;
// @__NO_SIDE_EFFECTS__
export function _maxLength(
  maximum: number,
  params?: string | $SchemaCheckMaxLengthParams
): checks.$SchemaCheckMaxLength<util.HasLength> {
  const ch = new checks.$SchemaCheckMaxLength({
    check: "max_length",
    ...util.normalizeParams(params),
    maximum,
  });
  return ch;
}

export type $SchemaCheckMinLengthParams = CheckParams<checks.$SchemaCheckMinLength, "minimum" | "when">;
// @__NO_SIDE_EFFECTS__
export function _minLength(
  minimum: number,
  params?: string | $SchemaCheckMinLengthParams
): checks.$SchemaCheckMinLength<util.HasLength> {
  return new checks.$SchemaCheckMinLength({
    check: "min_length",
    ...util.normalizeParams(params),
    minimum,
  });
}

export type $SchemaCheckLengthEqualsParams = CheckParams<checks.$SchemaCheckLengthEquals, "length" | "when">;
// @__NO_SIDE_EFFECTS__
export function _length(
  length: number,
  params?: string | $SchemaCheckLengthEqualsParams
): checks.$SchemaCheckLengthEquals<util.HasLength> {
  return new checks.$SchemaCheckLengthEquals({
    check: "length_equals",
    ...util.normalizeParams(params),
    length,
  });
}

export type $SchemaCheckRegexParams = CheckParams<checks.$SchemaCheckRegex, "format" | "pattern" | "when">;
// @__NO_SIDE_EFFECTS__
export function _regex(pattern: RegExp, params?: string | $SchemaCheckRegexParams): checks.$SchemaCheckRegex {
  return new checks.$SchemaCheckRegex({
    check: "string_format",
    format: "regex",
    ...util.normalizeParams(params),
    pattern,
  });
}

export type $SchemaCheckLowerCaseParams = CheckParams<checks.$SchemaCheckLowerCase, "format" | "when">;
// @__NO_SIDE_EFFECTS__
export function _lowercase(params?: string | $SchemaCheckLowerCaseParams): checks.$SchemaCheckLowerCase {
  return new checks.$SchemaCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...util.normalizeParams(params),
  });
}

export type $SchemaCheckUpperCaseParams = CheckParams<checks.$SchemaCheckUpperCase, "format" | "when">;

// @__NO_SIDE_EFFECTS__
export function _uppercase(params?: string | $SchemaCheckUpperCaseParams): checks.$SchemaCheckUpperCase {
  return new checks.$SchemaCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...util.normalizeParams(params),
  });
}

export type $SchemaCheckIncludesParams = CheckParams<checks.$SchemaCheckIncludes, "includes" | "format" | "when" | "pattern">;
// @__NO_SIDE_EFFECTS__
export function _includes(includes: string, params?: string | $SchemaCheckIncludesParams): checks.$SchemaCheckIncludes {
  return new checks.$SchemaCheckIncludes({
    check: "string_format",
    format: "includes",
    ...util.normalizeParams(params),
    includes,
  });
}
export type $SchemaCheckStartsWithParams = CheckParams<
  checks.$SchemaCheckStartsWith,
  "prefix" | "format" | "when" | "pattern"
>;
// @__NO_SIDE_EFFECTS__
export function _startsWith(prefix: string, params?: string | $SchemaCheckStartsWithParams): checks.$SchemaCheckStartsWith {
  return new checks.$SchemaCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...util.normalizeParams(params),
    prefix,
  });
}

export type $SchemaCheckEndsWithParams = CheckParams<checks.$SchemaCheckEndsWith, "suffix" | "format" | "pattern" | "when">;

// @__NO_SIDE_EFFECTS__
export function _endsWith(suffix: string, params?: string | $SchemaCheckEndsWithParams): checks.$SchemaCheckEndsWith {
  return new checks.$SchemaCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...util.normalizeParams(params),
    suffix,
  });
}

export type $SchemaCheckPropertyParams = CheckParams<checks.$SchemaCheckProperty, "property" | "schema" | "when">;
// @__NO_SIDE_EFFECTS__
export function _property<K extends string, T extends schemas.$SchemaType>(
  property: K,
  schema: T,
  params?: string | $SchemaCheckPropertyParams
): checks.$SchemaCheckProperty<{ [k in K]: util.Widen<core.input<T>> }> {
  return new checks.$SchemaCheckProperty({
    check: "property",
    property,
    schema,
    ...util.normalizeParams(params),
  });
}

export type $SchemaCheckPropertiesParams = CheckParams<checks.$SchemaCheckProperties, "shape" | "when">;
// @__NO_SIDE_EFFECTS__
export function _properties<Shape extends schemas.$SchemaShape>(
  shape: Shape,
  params?: string | $SchemaCheckPropertiesParams
): checks.$SchemaCheckProperties<Shape> {
  return new checks.$SchemaCheckProperties({
    check: "properties",
    shape,
    ...util.normalizeParams(params),
  }) as any;
}

export type $SchemaCheckMimeTypeParams = CheckParams<checks.$SchemaCheckMimeType, "mime" | "when">;
// @__NO_SIDE_EFFECTS__
export function _mime(types: util.MimeTypes[], params?: string | $SchemaCheckMimeTypeParams): checks.$SchemaCheckMimeType {
  return new checks.$SchemaCheckMimeType({
    check: "mime_type",
    mime: types,
    ...util.normalizeParams(params),
  });
}

// @__NO_SIDE_EFFECTS__
export function _overwrite<T>(tx: (input: T) => T): checks.$SchemaCheckOverwrite<T> {
  return new checks.$SchemaCheckOverwrite({
    check: "overwrite",
    tx,
  }) as checks.$SchemaCheckOverwrite<T>;
}
// normalize
// @__NO_SIDE_EFFECTS__
export function _normalize(form?: "NFC" | "NFD" | "NFKC" | "NFKD" | (string & {})): checks.$SchemaCheckOverwrite<string> {
  return _overwrite((input) => input.normalize(form));
}

// trim
// @__NO_SIDE_EFFECTS__
export function _trim(): checks.$SchemaCheckOverwrite<string> {
  return _overwrite((input) => input.trim());
}
// toLowerCase
// @__NO_SIDE_EFFECTS__
export function _toLowerCase(): checks.$SchemaCheckOverwrite<string> {
  return _overwrite((input) => input.toLowerCase());
}
// toUpperCase
// @__NO_SIDE_EFFECTS__
export function _toUpperCase(): checks.$SchemaCheckOverwrite<string> {
  return _overwrite((input) => input.toUpperCase());
}
// slugify
// @__NO_SIDE_EFFECTS__
export function _slugify(): checks.$SchemaCheckOverwrite<string> {
  return _overwrite((input) => util.slugify(input));
}

///////  collections   ///////

// Array
export type $SchemaArrayParams = TypeParams<schemas.$SchemaArray, "element">;
// @__NO_SIDE_EFFECTS__
export function _array<T extends schemas.$SchemaType>(
  Class: util.SchemaClass<schemas.$SchemaArray>,
  element: T,
  params?: string | $SchemaArrayParams
): schemas.$SchemaArray<T> {
  return new Class({
    type: "array",
    element,
    // get element() {
    //   return element;
    // },
    ...util.normalizeParams(params),
  }) as any;
}

export type $SchemaObjectParams = TypeParams<schemas.$SchemaObject, "shape" | "catchall">;

// SchemaUnion
export type $SchemaUnionParams = TypeParams<schemas.$SchemaUnion, "options">;
// @__NO_SIDE_EFFECTS__
export function _union<const T extends readonly schemas.$SchemaObject[]>(
  Class: util.SchemaClass<schemas.$SchemaUnion>,
  options: T,
  params?: string | $SchemaUnionParams
): schemas.$SchemaUnion<T> {
  return new Class({
    type: "union",
    options,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaXor
export type $SchemaXorParams = TypeParams<schemas.$SchemaXor, "options">;
export function _xor<const T extends readonly schemas.$SchemaObject[]>(
  Class: util.SchemaClass<schemas.$SchemaXor>,
  options: T,
  params?: string | $SchemaXorParams
): schemas.$SchemaXor<T> {
  return new Class({
    type: "union",
    options,
    inclusive: false,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaDiscriminatedUnion

// The bound stops at `propValues`; it deliberately does not check that the option carries the discriminator. Any such check has to name the option's `input`, and constraining `input` in argument position forces TypeScript to resolve it while checking the call — circular for an option whose input references the union, which collapses the whole union to `any`. `$SchemaDiscriminatedUnion` validates the discriminator lazily instead, when it builds its lookup map.
//
// Validating eagerly through `propValues` is not available: reading it runs the option's shape getters, and for a recursive option that getter references the union whose initializer is still running, so it throws `ReferenceError: Cannot access '...' before initialization`.
//
// `Object.keys` on the shape is recursion-safe by contrast — it lists the keys without invoking them — so an eager check is reachable. It was tried and reverted: a key list derived from the shape cannot be kept in agreement with `shape` itself, which resolves lazily over the object the caller passed and then freezes to a copy, and it charged every object schema construction time and memory for a check only this one type reads.
//
// `_Disc` is unused and retained only so `$SchemaTypeDiscriminable<"kind">` keeps compiling for external callers.
export interface $SchemaTypeDiscriminableInternals<_Disc extends string = string> extends schemas._$SchemaTypeInternals {
  propValues: util.PropValues;
}

export interface $SchemaTypeDiscriminable<_Disc extends string = string> extends schemas.SomeType {
  _schema: $SchemaTypeDiscriminableInternals;
}

export type $SchemaDiscriminatedUnionParams = TypeParams<schemas.$SchemaDiscriminatedUnion, "options" | "discriminator">;
// @__NO_SIDE_EFFECTS__
export function _discriminatedUnion<
  Types extends [$SchemaTypeDiscriminable, ...$SchemaTypeDiscriminable[]],
  Disc extends string,
>(
  Class: util.SchemaClass<schemas.$SchemaDiscriminatedUnion>,
  discriminator: Disc,
  options: Types,
  params?: string | $SchemaDiscriminatedUnionParams
): schemas.$SchemaDiscriminatedUnion<Types, Disc> {
  return new Class({
    type: "union",
    options: options as any as schemas.$SchemaType[],
    discriminator,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaIntersection
export type $SchemaIntersectionParams = TypeParams<schemas.$SchemaIntersection, "left" | "right">;
// @__NO_SIDE_EFFECTS__
export function _intersection<T extends schemas.$SchemaObject, U extends schemas.$SchemaObject>(
  Class: util.SchemaClass<schemas.$SchemaIntersection>,
  left: T,
  right: U
): schemas.$SchemaIntersection<T, U> {
  return new Class({
    type: "intersection",
    left,
    right,
  }) as any;
}

// SchemaTuple
export type $SchemaTupleParams = TypeParams<schemas.$SchemaTuple, "items" | "rest">;
// @__NO_SIDE_EFFECTS__
export function _tuple<T extends readonly [schemas.$SchemaType, ...schemas.$SchemaType[]]>(
  Class: util.SchemaClass<schemas.$SchemaTuple>,
  items: T,
  params?: string | $SchemaTupleParams
): schemas.$SchemaTuple<T, null>;
// @__NO_SIDE_EFFECTS__
export function _tuple<T extends readonly [schemas.$SchemaType, ...schemas.$SchemaType[]], Rest extends schemas.$SchemaType>(
  Class: util.SchemaClass<schemas.$SchemaTuple>,
  items: T,
  rest: Rest,
  params?: string | $SchemaTupleParams
): schemas.$SchemaTuple<T, Rest>;
// export function _tuple(
//   Class: util.SchemaClass<schemas.$SchemaTuple>,
//   items: [],
//   params?: string | $SchemaTupleParams
// ): schemas.$SchemaTuple<[], null>;
// @__NO_SIDE_EFFECTS__
export function _tuple(
  Class: util.SchemaClass<schemas.$SchemaTuple>,
  items: schemas.$SchemaType[],
  _paramsOrRest?: string | $SchemaTupleParams | schemas.$SchemaType,
  _params?: string | $SchemaTupleParams
) {
  const hasRest = _paramsOrRest instanceof schemas.$SchemaType;
  const params = hasRest ? _params : _paramsOrRest;
  const rest = hasRest ? _paramsOrRest : null;
  return new Class({
    type: "tuple",
    items,
    rest,
    ...util.normalizeParams(params),
  });
}

// SchemaRecord
export type $SchemaRecordParams = TypeParams<schemas.$SchemaRecord, "keyType" | "valueType" | "partial">;
// @__NO_SIDE_EFFECTS__
export function _record<Key extends schemas.$SchemaRecordKey, Value extends schemas.$SchemaObject>(
  Class: util.SchemaClass<schemas.$SchemaRecord>,
  keyType: Key,
  valueType: Value,
  params?: string | $SchemaRecordParams
): schemas.$SchemaRecord<Key, Value> {
  return new Class({
    type: "record",
    keyType,
    valueType,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaMap
export type $SchemaMapParams = TypeParams<schemas.$SchemaMap, "keyType" | "valueType">;
// @__NO_SIDE_EFFECTS__
export function _map<Key extends schemas.$SchemaObject, Value extends schemas.$SchemaObject>(
  Class: util.SchemaClass<schemas.$SchemaMap>,
  keyType: Key,
  valueType: Value,
  params?: string | $SchemaMapParams
): schemas.$SchemaMap<Key, Value> {
  return new Class({
    type: "map",
    keyType,
    valueType,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaSet
export type $SchemaSetParams = TypeParams<schemas.$SchemaSet, "valueType">;
// @__NO_SIDE_EFFECTS__
export function _set<Value extends schemas.$SchemaObject>(
  Class: util.SchemaClass<schemas.$SchemaSet>,
  valueType: Value,
  params?: string | $SchemaSetParams
): schemas.$SchemaSet<Value> {
  return new Class({
    type: "set",
    valueType,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaEnum
export type $SchemaEnumParams = TypeParams<schemas.$SchemaEnum, "entries">;
// @__NO_SIDE_EFFECTS__
export function _enum<const T extends string[]>(
  Class: util.SchemaClass<schemas.$SchemaEnum>,
  values: T,
  params?: string | $SchemaEnumParams
): schemas.$SchemaEnum<util.ToEnum<T[number]>>;
// @__NO_SIDE_EFFECTS__
export function _enum<T extends util.EnumLike>(
  Class: util.SchemaClass<schemas.$SchemaEnum>,
  entries: T,
  params?: string | $SchemaEnumParams
): schemas.$SchemaEnum<T>;
// @__NO_SIDE_EFFECTS__
export function _enum(Class: util.SchemaClass<schemas.$SchemaEnum>, values: any, params?: string | $SchemaEnumParams) {
  const entries: any = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  // if (Array.isArray(values)) {
  //   for (const value of values) {
  //     entries[value] = value;
  //   }
  // } else {
  //   Object.assign(entries, values);
  // }
  // const entries: util.EnumLike = {};
  // for (const val of values) {
  //   entries[val] = val;
  // }

  return new Class({
    type: "enum",
    entries,
    ...util.normalizeParams(params),
  }) as any;
}

// @__NO_SIDE_EFFECTS__
/** @deprecated This API has been merged into `Schema.enum()`. Use `Schema.enum()` instead.
 *
 * ```ts
 * enum Colors { red, green, blue }
 * Schema.enum(Colors);
 * ```
 */
export function _nativeEnum<T extends util.EnumLike>(
  Class: util.SchemaClass<schemas.$SchemaEnum>,
  entries: T,
  params?: string | $SchemaEnumParams
): schemas.$SchemaEnum<T> {
  return new Class({
    type: "enum",
    entries,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaLiteral
export type $SchemaLiteralParams = TypeParams<schemas.$SchemaLiteral, "values">;
export function _literal<const T extends Array<util.Literal>>(
  Class: util.SchemaClass<schemas.$SchemaLiteral>,
  value: T,
  params?: string | $SchemaLiteralParams
): schemas.$SchemaLiteral<T[number]>;
export function _literal<const T extends util.Literal>(
  Class: util.SchemaClass<schemas.$SchemaLiteral>,
  value: T,
  params?: string | $SchemaLiteralParams
): schemas.$SchemaLiteral<T>;
// @__NO_SIDE_EFFECTS__
export function _literal(Class: util.SchemaClass<schemas.$SchemaLiteral>, value: any, params: any) {
  return new Class({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...util.normalizeParams(params),
  });
}

// SchemaFile
export type $SchemaFileParams = TypeParams<schemas.$SchemaFile>;
// @__NO_SIDE_EFFECTS__
export function _file(Class: util.SchemaClass<schemas.$SchemaFile>, params?: string | $SchemaFileParams): schemas.$SchemaFile {
  return new Class({
    type: "file",
    ...util.normalizeParams(params),
  });
}

// SchemaTransform
export type $SchemaTransformParams = TypeParams<schemas.$SchemaTransform, "transform">;
// @__NO_SIDE_EFFECTS__
export function _transform<I = unknown, O = I>(
  Class: util.SchemaClass<schemas.$SchemaTransform>,
  fn: (input: I, ctx?: schemas.ParsePayload) => O
): schemas.$SchemaTransform<Awaited<O>, I> {
  return new Class({
    type: "transform",
    transform: fn as any,
  }) as any;
}

// SchemaOptional
export type $SchemaOptionalParams = TypeParams<schemas.$SchemaOptional, "innerType">;
// @__NO_SIDE_EFFECTS__
export function _optional<T extends schemas.$SchemaObject>(
  Class: util.SchemaClass<schemas.$SchemaOptional>,
  innerType: T
): schemas.$SchemaOptional<T> {
  return new Class({
    type: "optional",
    innerType,
  }) as any;
}

// SchemaNullable
export type $SchemaNullableParams = TypeParams<schemas.$SchemaNullable, "innerType">;
// @__NO_SIDE_EFFECTS__
export function _nullable<T extends schemas.$SchemaObject>(
  Class: util.SchemaClass<schemas.$SchemaNullable>,
  innerType: T
): schemas.$SchemaNullable<T> {
  return new Class({
    type: "nullable",
    innerType,
  }) as any;
}

// SchemaDefault
export type $SchemaDefaultParams = TypeParams<schemas.$SchemaDefault, "innerType" | "defaultValue">;
// @__NO_SIDE_EFFECTS__
export function _default<T extends schemas.$SchemaObject>(
  Class: util.SchemaClass<schemas.$SchemaDefault>,
  innerType: T,
  defaultValue: util.NoUndefined<core.output<T>> | (() => util.NoUndefined<core.output<T>>)
): schemas.$SchemaDefault<T> {
  return new Class({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? (defaultValue as Function)() : util.shallowClone(defaultValue);
    },
  }) as any;
}

// SchemaNonOptional
export type $SchemaNonOptionalParams = TypeParams<schemas.$SchemaNonOptional, "innerType">;
// @__NO_SIDE_EFFECTS__
export function _nonoptional<T extends schemas.$SchemaObject>(
  Class: util.SchemaClass<schemas.$SchemaNonOptional>,
  innerType: T,
  params?: string | $SchemaNonOptionalParams
): schemas.$SchemaNonOptional<T> {
  return new Class({
    type: "nonoptional",
    innerType,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaSuccess
export type $SchemaSuccessParams = TypeParams<schemas.$SchemaSuccess, "innerType">;
// @__NO_SIDE_EFFECTS__
export function _success<T extends schemas.$SchemaObject>(
  Class: util.SchemaClass<schemas.$SchemaSuccess>,
  innerType: T
): schemas.$SchemaSuccess<T> {
  return new Class({
    type: "success",
    innerType,
  }) as any;
}

// SchemaCatch
export type $SchemaCatchParams = TypeParams<schemas.$SchemaCatch, "innerType" | "catchValue">;
// @__NO_SIDE_EFFECTS__
export function _catch<T extends schemas.$SchemaObject>(
  Class: util.SchemaClass<schemas.$SchemaCatch>,
  innerType: T,
  catchValue: core.output<T> | ((ctx: schemas.$SchemaCatchCtx) => core.output<T>)
): schemas.$SchemaCatch<T> {
  return new Class({
    type: "catch",
    innerType,
    catchValue: (typeof catchValue === "function" ? catchValue : util.constantCatch(catchValue)) as any,
  }) as any;
}

// SchemaPipe
export type $SchemaPipeParams = TypeParams<schemas.$SchemaPipe, "in" | "out">;
// @__NO_SIDE_EFFECTS__
export function _pipe<
  const A extends schemas.$SchemaType,
  B extends schemas.$SchemaType<unknown, core.output<A>> = schemas.$SchemaType<unknown, core.output<A>>,
>(
  Class: util.SchemaClass<schemas.$SchemaPipe>,
  in_: A,
  out: B | schemas.$SchemaType<unknown, core.output<A>>
): schemas.$SchemaPipe<A, B> {
  return new Class({
    type: "pipe",
    in: in_,
    out,
  }) as any;
}

// SchemaReadonly
export type $SchemaReadonlyParams = TypeParams<schemas.$SchemaReadonly, "innerType">;
// @__NO_SIDE_EFFECTS__
export function _readonly<T extends schemas.$SchemaObject>(
  Class: util.SchemaClass<schemas.$SchemaReadonly>,
  innerType: T
): schemas.$SchemaReadonly<T> {
  return new Class({
    type: "readonly",
    innerType,
  }) as any;
}

// SchemaTemplateLiteral
export type $SchemaTemplateLiteralParams = TypeParams<schemas.$SchemaTemplateLiteral, "parts">;
// @__NO_SIDE_EFFECTS__
export function _templateLiteral<const Parts extends schemas.$SchemaTemplateLiteralPart[]>(
  Class: util.SchemaClass<schemas.$SchemaTemplateLiteral>,
  parts: Parts,
  params?: string | $SchemaTemplateLiteralParams
): schemas.$SchemaTemplateLiteral<schemas.$PartsToTemplateLiteral<Parts>> {
  return new Class({
    type: "template_literal",
    parts,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaLazy
export type $SchemaLazyParams = TypeParams<schemas.$SchemaLazy, "getter">;
// @__NO_SIDE_EFFECTS__
export function _lazy<T extends schemas.$SchemaType>(
  Class: util.SchemaClass<schemas.$SchemaLazy>,
  getter: () => T
): schemas.$SchemaLazy<T> {
  return new Class({
    type: "lazy",
    getter,
  }) as any;
}

// SchemaPromise
export type $SchemaPromiseParams = TypeParams<schemas.$SchemaPromise, "innerType">;
// @__NO_SIDE_EFFECTS__
export function _promise<T extends schemas.$SchemaObject>(
  Class: util.SchemaClass<schemas.$SchemaPromise>,
  innerType: T
): schemas.$SchemaPromise<T> {
  return new Class({
    type: "promise",
    innerType,
  }) as any;
}

// SchemaCustom
export type $SchemaCustomParams = CheckTypeParams<schemas.$SchemaCustom, "fn">;
// @__NO_SIDE_EFFECTS__
export function _custom<O = unknown, I = O>(
  Class: util.SchemaClass<schemas.$SchemaCustom>,
  fn: (data: O) => unknown,
  _params: string | $SchemaCustomParams | undefined
): schemas.$SchemaCustom<O, I> {
  const norm = util.normalizeParams(_params);
  norm.abort ??= true; // default to abort:false
  const schema = new Class({
    type: "custom",
    check: "custom",
    fn: fn as any,
    ...norm,
  });

  return schema as any;
}

// same as _custom but defaults to abort:false
// @__NO_SIDE_EFFECTS__
export function _refine<O = unknown, I = O>(
  Class: util.SchemaClass<schemas.$SchemaCustom>,
  fn: (data: O) => unknown,
  _params: string | $SchemaCustomParams | undefined
): schemas.$SchemaCustom<O, I> {
  const schema = new Class({
    type: "custom",
    check: "custom",
    fn: fn as any,
    ...util.normalizeParams(_params),
  });

  return schema as any;
}

export type $SchemaSuperRefineIssue<T extends errors.$SchemaIssueBase = errors.$SchemaIssue> = T extends any
  ? RawIssue<T>
  : never;
type RawIssue<T extends errors.$SchemaIssueBase> = T extends any
  ? util.Flatten<
      util.MakePartial<T, "message" | "path"> & {
        /** The schema or check that originated this issue. */
        readonly inst?: schemas.$SchemaType | checks.$SchemaCheck;
        /** If `true`, Schema will execute subsequent checks/refinements instead of immediately aborting */
        readonly continue?: boolean | undefined;
      } & Record<string, unknown>
    >
  : never;

export interface $RefinementCtx<T = unknown> extends schemas.ParsePayload<T> {
  addIssue(arg: string | $SchemaSuperRefineIssue): void;
}

export interface $SchemaSuperRefineParams {
  /** If provided, the refinement runs only when this returns `true`. By default, it is skipped if prior parsing produced aborting issues. */
  when?: ((payload: schemas.ParsePayload) => boolean) | undefined;
}

// @__NO_SIDE_EFFECTS__
export function _superRefine<T>(
  fn: (arg: T, payload: $RefinementCtx<T>) => void | Promise<void>,
  params?: $SchemaSuperRefineParams
): checks.$SchemaCheck<T> {
  const ch = _check<T>((payload) => {
    (payload as $RefinementCtx).addIssue = (issue) => {
      if (typeof issue === "string") {
        payload.issues.push(util.issue(issue, payload.value, ch._schema.def));
      } else {
        // for Schema 3 backwards compatibility
        const _issue: any = issue;
        if (_issue.fatal) _issue.continue = false;
        _issue.code ??= "custom";
        if (!("input" in _issue)) _issue.input = payload.value;
        _issue.inst ??= ch;
        _issue.continue ??= !ch._schema.def.abort; // abort is always undefined, so this is always true...
        payload.issues.push(util.issue(_issue));
      }
    };

    return fn(payload.value, payload as $RefinementCtx<T>);
  }, params);
  return ch;
}

// @__NO_SIDE_EFFECTS__
export function _check<O = unknown>(fn: schemas.CheckFn<O>, params?: string | $SchemaCustomParams): checks.$SchemaCheck<O> {
  const ch = new checks.$SchemaCheck({
    check: "custom",
    ...util.normalizeParams(params),
  });

  ch._schema.check = fn;
  return ch;
}

// @__NO_SIDE_EFFECTS__
export function describe<T>(description: string): checks.$SchemaCheck<T> {
  const ch = new checks.$SchemaCheck({ check: "describe" });
  ch._schema.onattach = [
    (inst) => {
      const existing = registries.globalRegistry.get(inst) ?? {};
      registries.globalRegistry.add(inst, { ...existing, description });
    },
  ];
  ch._schema.check = () => {}; // no-op check
  return ch;
}

// @__NO_SIDE_EFFECTS__
export function meta<T>(metadata: registries.GlobalMeta): checks.$SchemaCheck<T> {
  const ch = new checks.$SchemaCheck({ check: "meta" });
  ch._schema.onattach = [
    (inst) => {
      const existing = registries.globalRegistry.get(inst) ?? {};
      registries.globalRegistry.add(inst, { ...existing, ...metadata });
    },
  ];
  ch._schema.check = () => {}; // no-op check
  return ch;
}

// export type $SchemaCustomParams = CheckTypeParams<schemas.$SchemaCustom, "fn">

/////////    STRINGBOOL   /////////

// stringbool
export interface $SchemaStringBoolParams extends TypeParams {
  truthy?: string[];
  falsy?: string[];
  /**
   * Options: `"sensitive"`, `"insensitive"`
   *
   * @default `"insensitive"`
   */
  case?: "sensitive" | "insensitive" | undefined;
}

// @__NO_SIDE_EFFECTS__
export function _stringbool(
  Classes: {
    Codec?: typeof schemas.$SchemaCodec;
    Boolean?: typeof schemas.$SchemaBoolean;
    String?: typeof schemas.$SchemaString;
  },
  _params?: string | $SchemaStringBoolParams
): schemas.$SchemaCodec<schemas.$SchemaString, schemas.$SchemaBoolean> {
  const params = util.normalizeParams(_params);

  let truthyArray = params.truthy ?? ["true", "1", "yes", "on", "y", "enabled"];
  let falsyArray = params.falsy ?? ["false", "0", "no", "off", "n", "disabled"];
  if (params.case !== "sensitive") {
    truthyArray = truthyArray.map((v) => (typeof v === "string" ? v.toLowerCase() : v));
    falsyArray = falsyArray.map((v) => (typeof v === "string" ? v.toLowerCase() : v));
  }

  const truthySet = new Set(truthyArray);
  const falsySet = new Set(falsyArray);

  const _Codec = Classes.Codec ?? schemas.$SchemaCodec;
  const _Boolean = Classes.Boolean ?? schemas.$SchemaBoolean;
  const _String = Classes.String ?? schemas.$SchemaString;

  const stringSchema = new _String({ type: "string", error: params.error });
  const booleanSchema = new _Boolean({ type: "boolean", error: params.error });

  const codec = new _Codec({
    type: "pipe",
    in: stringSchema as any,
    out: booleanSchema as any,
    transform: ((input: string, payload: schemas.ParsePayload<string>) => {
      let data: string = input;
      if (params.case !== "sensitive") data = data.toLowerCase();
      if (truthySet.has(data)) {
        return true;
      } else if (falsySet.has(data)) {
        return false;
      } else {
        payload.issues.push({
          code: "invalid_value",
          expected: "stringbool",
          values: [...truthySet, ...falsySet],
          input: payload.value,
          inst: codec,
          continue: false,
        });
        return {} as never;
      }
    }) as any,
    reverseTransform: ((input: boolean, _payload: schemas.ParsePayload<boolean>) => {
      if (input === true) {
        return truthyArray[0] || "true";
      } else {
        return falsyArray[0] || "false";
      }
    }) as any,
    error: params.error,
  }) as any;

  codec._schema.bag.truthy = truthyArray;
  codec._schema.bag.falsy = falsyArray;
  codec._schema.bag.case = params.case ?? "insensitive";

  return codec;
}

// @__NO_SIDE_EFFECTS__
export function _stringFormat<Format extends string>(
  Class: typeof schemas.$SchemaCustomStringFormat,
  format: Format,
  fnOrRegex: ((arg: string) => util.MaybeAsync<unknown>) | RegExp,
  _params: string | $SchemaStringFormatParams = {}
): schemas.$SchemaCustomStringFormat<Format> {
  const params = util.normalizeParams(_params);
  const def: schemas.$SchemaCustomStringFormatDef = {
    check: "string_format",
    type: "string",
    format,
    fn: typeof fnOrRegex === "function" ? fnOrRegex : (val) => fnOrRegex.test(val),
    ...params,
  };
  if (fnOrRegex instanceof RegExp) {
    def.pattern = fnOrRegex;
  }

  const inst = new Class(def);
  return inst as any;
}
