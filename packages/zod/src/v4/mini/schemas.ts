import * as core from "../core/index.js";
import type { $SchemaBigIntFormats } from "../core/index.js";
import * as regexes from "../core/regexes.js";
import * as util from "../core/util.js";
import * as parse from "./parse.js";

type SomeType = core.SomeType;

export interface SchemaMiniType<
  out Output = unknown,
  out Input = unknown,
  out Internals extends core.$SchemaTypeInternals<Output, Input> = core.$SchemaTypeInternals<Output, Input>,
> extends core.$SchemaType<Output, Input, Internals> {
  type: Internals["def"]["type"];
  check(...checks: (core.CheckFn<core.output<this>> | core.$SchemaCheck<core.output<this>>)[]): this;
  with(...checks: (core.CheckFn<core.output<this>> | core.$SchemaCheck<core.output<this>>)[]): this;
  clone(def?: Internals["def"], params?: { parent: boolean }): this;
  register<R extends core.$SchemaRegistry>(
    registry: R,
    ...meta: this extends R["_schema"]
      ? undefined extends R["_meta"]
        ? [core.$replace<R["_meta"], this>?]
        : [core.$replace<R["_meta"], this>]
      : ["Incompatible schema"]
  ): this;
  brand<T extends PropertyKey = PropertyKey, Dir extends "in" | "out" | "inout" = "out">(
    value?: T
  ): PropertyKey extends T ? this : core.$SchemaBranded<this, T, Dir>;

  def: Internals["def"];

  parse(data: unknown, params?: core.ParseContext<core.$SchemaIssue>): core.output<this>;
  safeParse(data: unknown, params?: core.ParseContext<core.$SchemaIssue>): util.SafeParseResult<core.output<this>>;
  parseAsync(data: unknown, params?: core.ParseContext<core.$SchemaIssue>): Promise<core.output<this>>;
  safeParseAsync(
    data: unknown,
    params?: core.ParseContext<core.$SchemaIssue>
  ): Promise<util.SafeParseResult<core.output<this>>>;
  apply<T, TArgs extends unknown[] = []>(fn: (schema: this, ...args: TArgs) => T, ...args: TArgs): T;
}

interface _SchemaMiniType<out Internals extends core.$SchemaTypeInternals = core.$SchemaTypeInternals>
  extends SchemaMiniType<any, any, Internals> {}

export const SchemaMiniType: core.$constructor<SchemaMiniType> = /*@__PURE__*/ core.$constructor<SchemaMiniType>(
  "SchemaMiniType",
  (inst, def) => {
    if (!inst._schema) throw new Error("Uninitialized schema in SchemaMiniType.");

    core.$SchemaType.init(inst, def);

    inst.def = def;
    inst.type = def.type;
  },
  {
    // `with` is an alias for `check`: the same function object, not a wrapper.
    get with(): SchemaMiniType["check"] {
      return this.check;
    },
    set with(value: SchemaMiniType["check"]) {
      util.own(this, "with", value);
    },
    parse(data, params) {
      return parse.parse(this, data, params, { callee: this.parse });
    },
    parseAsync(data, params) {
      return parse.parseAsync(this, data, params, { callee: this.parseAsync });
    },
    safeParse(data, params) {
      return parse.safeParse(this, data, params);
    },
    safeParseAsync(data, params) {
      return parse.safeParseAsync(this, data, params);
    },
    check(...checks) {
      const def = this.def;
      return this.clone(
        {
          ...def,
          checks: [
            ...(def.checks ?? []),
            ...checks.map((ch) =>
              typeof ch === "function" ? { _schema: { check: ch, def: { check: "custom" }, onattach: [] } } : ch
            ),
          ],
        },
        { parent: true }
      );
    },
    clone(_def, params) {
      return core.clone(this, _def, params);
    },
    brand() {
      return this as any;
    },
    register(reg: any, meta: any): any {
      reg.add(this, meta);
      return this;
    },
    apply(fn: any, ...args: any[]) {
      return args.length === 0 ? fn(this) : fn(this, ...args);
    },
  }
);

export interface _SchemaMiniString<T extends core.$SchemaStringInternals<unknown> = core.$SchemaStringInternals<unknown>>
  extends _SchemaMiniType<T>,
    core.$SchemaString<T["input"]> {
  _schema: T;
}

// SchemaMiniString
export interface SchemaMiniString<Input = unknown>
  extends _SchemaMiniString<core.$SchemaStringInternals<Input>>,
    core.$SchemaString<Input> {}
export const SchemaMiniString: core.$constructor<SchemaMiniString> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniString",
  (inst, def) => {
    core.$SchemaString.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function string(params?: string | core.$SchemaStringParams): SchemaMiniString<string> {
  return core._string(SchemaMiniString, params) as any;
}

// SchemaMiniStringFormat
export interface SchemaMiniStringFormat<Format extends string = string>
  extends _SchemaMiniString<core.$SchemaStringFormatInternals<Format>>,
    core.$SchemaStringFormat<Format> {
  // _schema: core.$SchemaStringFormatInternals<Format>;
}
export const SchemaMiniStringFormat: core.$constructor<SchemaMiniStringFormat> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniStringFormat",
  (inst, def) => {
    core.$SchemaStringFormat.init(inst, def);
    SchemaMiniString.init(inst, def);
  }
);

// SchemaMiniEmail
export interface SchemaMiniEmail extends _SchemaMiniString<core.$SchemaEmailInternals> {}
export const SchemaMiniEmail: core.$constructor<SchemaMiniEmail> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniEmail",
  (inst, def) => {
    core.$SchemaEmail.init(inst, def);
    SchemaMiniStringFormat.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function email(params?: string | core.$SchemaEmailParams): SchemaMiniEmail {
  return core._email(SchemaMiniEmail, params);
}

// SchemaMiniGUID
export interface SchemaMiniGUID extends _SchemaMiniString<core.$SchemaGUIDInternals> {
  // _schema: core.$SchemaGUIDInternals;
}
export const SchemaMiniGUID: core.$constructor<SchemaMiniGUID> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniGUID",
  (inst, def) => {
    core.$SchemaGUID.init(inst, def);
    SchemaMiniStringFormat.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function guid(params?: string | core.$SchemaGUIDParams): SchemaMiniGUID {
  return core._guid(SchemaMiniGUID, params);
}

// SchemaMiniUUID
export interface SchemaMiniUUID extends _SchemaMiniString<core.$SchemaUUIDInternals> {
  // _schema: core.$SchemaUUIDInternals;
}
export const SchemaMiniUUID: core.$constructor<SchemaMiniUUID> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniUUID",
  (inst, def) => {
    core.$SchemaUUID.init(inst, def);
    SchemaMiniStringFormat.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function uuid(params?: string | core.$SchemaUUIDParams): SchemaMiniUUID {
  return core._uuid(SchemaMiniUUID, params);
}

// @__NO_SIDE_EFFECTS__
export function uuidv4(params?: string | core.$SchemaUUIDv4Params): SchemaMiniUUID {
  return core._uuidv4(SchemaMiniUUID, params);
}

// SchemaMiniUUIDv6

// @__NO_SIDE_EFFECTS__
export function uuidv6(params?: string | core.$SchemaUUIDv6Params): SchemaMiniUUID {
  return core._uuidv6(SchemaMiniUUID, params);
}

// SchemaMiniUUIDv7

// @__NO_SIDE_EFFECTS__
export function uuidv7(params?: string | core.$SchemaUUIDv7Params): SchemaMiniUUID {
  return core._uuidv7(SchemaMiniUUID, params);
}

// SchemaMiniURL
export interface SchemaMiniURL extends _SchemaMiniString<core.$SchemaURLInternals> {
  // _schema: core.$SchemaURLInternals;
}
export const SchemaMiniURL: core.$constructor<SchemaMiniURL> = /*@__PURE__*/ core.$constructor("SchemaMiniURL", (inst, def) => {
  core.$SchemaURL.init(inst, def);
  SchemaMiniStringFormat.init(inst, def);
});

// @__NO_SIDE_EFFECTS__
export function url(params?: string | core.$SchemaURLParams): SchemaMiniURL {
  return core._url(SchemaMiniURL, params);
}

// @__NO_SIDE_EFFECTS__
export function httpUrl(params?: string | Omit<core.$SchemaURLParams, "protocol" | "hostname">): SchemaMiniURL {
  return core._url(SchemaMiniURL, {
    protocol: regexes.httpProtocol,
    hostname: regexes.domain,
    ...util.normalizeParams(params),
  });
}

// SchemaMiniEmoji
export interface SchemaMiniEmoji extends _SchemaMiniString<core.$SchemaEmojiInternals> {
  // _schema: core.$SchemaEmojiInternals;
}
export const SchemaMiniEmoji: core.$constructor<SchemaMiniEmoji> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniEmoji",
  (inst, def) => {
    core.$SchemaEmoji.init(inst, def);
    SchemaMiniStringFormat.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function emoji(params?: string | core.$SchemaEmojiParams): SchemaMiniEmoji {
  return core._emoji(SchemaMiniEmoji, params);
}

// SchemaMiniNanoID
export interface SchemaMiniNanoID extends _SchemaMiniString<core.$SchemaNanoIDInternals> {
  // _schema: core.$SchemaNanoIDInternals;
}
export const SchemaMiniNanoID: core.$constructor<SchemaMiniNanoID> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniNanoID",
  (inst, def) => {
    core.$SchemaNanoID.init(inst, def);
    SchemaMiniStringFormat.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function nanoid(params?: string | core.$SchemaNanoIDParams): SchemaMiniNanoID {
  return core._nanoid(SchemaMiniNanoID, params);
}

// SchemaMiniCUID
/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link SchemaMiniCUID2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
export interface SchemaMiniCUID extends _SchemaMiniString<core.$SchemaCUIDInternals> {
  // _schema: core.$SchemaCUIDInternals;
}
/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link SchemaMiniCUID2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
export const SchemaMiniCUID: core.$constructor<SchemaMiniCUID> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniCUID",
  (inst, def) => {
    core.$SchemaCUID.init(inst, def);
    SchemaMiniStringFormat.init(inst, def);
  }
);

/**
 * Validates a CUID v1 string.
 *
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link cuid2 | `Schema.cuid2()`} instead.
 * See https://github.com/paralleldrive/cuid.
 */
// @__NO_SIDE_EFFECTS__
export function cuid(params?: string | core.$SchemaCUIDParams): SchemaMiniCUID {
  return core._cuid(SchemaMiniCUID, params);
}

// SchemaMiniCUID2
export interface SchemaMiniCUID2 extends _SchemaMiniString<core.$SchemaCUID2Internals> {
  // _schema: core.$SchemaCUID2Internals;
}
export const SchemaMiniCUID2: core.$constructor<SchemaMiniCUID2> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniCUID2",
  (inst, def) => {
    core.$SchemaCUID2.init(inst, def);
    SchemaMiniStringFormat.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function cuid2(params?: string | core.$SchemaCUID2Params): SchemaMiniCUID2 {
  return core._cuid2(SchemaMiniCUID2, params);
}

// SchemaMiniULID
export interface SchemaMiniULID extends _SchemaMiniString<core.$SchemaULIDInternals> {
  // _schema: core.$SchemaULIDInternals;
}
export const SchemaMiniULID: core.$constructor<SchemaMiniULID> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniULID",
  (inst, def) => {
    core.$SchemaULID.init(inst, def);
    SchemaMiniStringFormat.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function ulid(params?: string | core.$SchemaULIDParams): SchemaMiniULID {
  return core._ulid(SchemaMiniULID, params);
}

// SchemaMiniXID
export interface SchemaMiniXID extends _SchemaMiniString<core.$SchemaXIDInternals> {
  // _schema: core.$SchemaXIDInternals;
}
export const SchemaMiniXID: core.$constructor<SchemaMiniXID> = /*@__PURE__*/ core.$constructor("SchemaMiniXID", (inst, def) => {
  core.$SchemaXID.init(inst, def);
  SchemaMiniStringFormat.init(inst, def);
});

// @__NO_SIDE_EFFECTS__
export function xid(params?: string | core.$SchemaXIDParams): SchemaMiniXID {
  return core._xid(SchemaMiniXID, params);
}

// SchemaMiniKSUID
export interface SchemaMiniKSUID extends _SchemaMiniString<core.$SchemaKSUIDInternals> {
  // _schema: core.$SchemaKSUIDInternals;
}
export const SchemaMiniKSUID: core.$constructor<SchemaMiniKSUID> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniKSUID",
  (inst, def) => {
    core.$SchemaKSUID.init(inst, def);
    SchemaMiniStringFormat.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function ksuid(params?: string | core.$SchemaKSUIDParams): SchemaMiniKSUID {
  return core._ksuid(SchemaMiniKSUID, params);
}

// SchemaMiniIPv4
export interface SchemaMiniIPv4 extends _SchemaMiniString<core.$SchemaIPv4Internals> {
  // _schema: core.$SchemaIPv4Internals;
}
export const SchemaMiniIPv4: core.$constructor<SchemaMiniIPv4> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniIPv4",
  (inst, def) => {
    core.$SchemaIPv4.init(inst, def);
    SchemaMiniStringFormat.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function ipv4(params?: string | core.$SchemaIPv4Params): SchemaMiniIPv4 {
  return core._ipv4(SchemaMiniIPv4, params);
}

// SchemaMiniIPv6
export interface SchemaMiniIPv6 extends _SchemaMiniString<core.$SchemaIPv6Internals> {
  // _schema: core.$SchemaIPv6Internals;
}
export const SchemaMiniIPv6: core.$constructor<SchemaMiniIPv6> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniIPv6",
  (inst, def) => {
    core.$SchemaIPv6.init(inst, def);
    SchemaMiniStringFormat.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function ipv6(params?: string | core.$SchemaIPv6Params): SchemaMiniIPv6 {
  return core._ipv6(SchemaMiniIPv6, params);
}

// SchemaMiniCIDRv4
export interface SchemaMiniCIDRv4 extends _SchemaMiniString<core.$SchemaCIDRv4Internals> {
  // _schema: core.$SchemaCIDRv4Internals;
}
export const SchemaMiniCIDRv4: core.$constructor<SchemaMiniCIDRv4> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniCIDRv4",
  (inst, def) => {
    core.$SchemaCIDRv4.init(inst, def);
    SchemaMiniStringFormat.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function cidrv4(params?: string | core.$SchemaCIDRv4Params): SchemaMiniCIDRv4 {
  return core._cidrv4(SchemaMiniCIDRv4, params);
}

// SchemaMiniCIDRv6
export interface SchemaMiniCIDRv6 extends _SchemaMiniString<core.$SchemaCIDRv6Internals> {
  // _schema: core.$SchemaCIDRv6Internals;
}
export const SchemaMiniCIDRv6: core.$constructor<SchemaMiniCIDRv6> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniCIDRv6",
  (inst, def) => {
    core.$SchemaCIDRv6.init(inst, def);
    SchemaMiniStringFormat.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function cidrv6(params?: string | core.$SchemaCIDRv6Params): SchemaMiniCIDRv6 {
  return core._cidrv6(SchemaMiniCIDRv6, params);
}

// SchemaMiniMAC
export interface SchemaMiniMAC extends _SchemaMiniString<core.$SchemaMACInternals> {
  // _schema: core.$SchemaMACInternals;
}
export const SchemaMiniMAC: core.$constructor<SchemaMiniMAC> = /*@__PURE__*/ core.$constructor("SchemaMiniMAC", (inst, def) => {
  core.$SchemaMAC.init(inst, def);
  SchemaMiniStringFormat.init(inst, def);
});

// @__NO_SIDE_EFFECTS__
export function mac(params?: string | core.$SchemaMACParams): SchemaMiniMAC {
  return core._mac(SchemaMiniMAC, params);
}

// SchemaMiniBase64
export interface SchemaMiniBase64 extends _SchemaMiniString<core.$SchemaBase64Internals> {
  // _schema: core.$SchemaBase64Internals;
}
export const SchemaMiniBase64: core.$constructor<SchemaMiniBase64> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniBase64",
  (inst, def) => {
    core.$SchemaBase64.init(inst, def);
    SchemaMiniStringFormat.init(inst, def);
  }
);
// @__NO_SIDE_EFFECTS__
export function base64(params?: string | core.$SchemaBase64Params): SchemaMiniBase64 {
  return core._base64(SchemaMiniBase64, params);
}

// SchemaMiniBase64URL
export interface SchemaMiniBase64URL extends _SchemaMiniString<core.$SchemaBase64URLInternals> {
  // _schema: core.$SchemaBase64URLInternals;
}
export const SchemaMiniBase64URL: core.$constructor<SchemaMiniBase64URL> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniBase64URL",
  (inst, def) => {
    core.$SchemaBase64URL.init(inst, def);
    SchemaMiniStringFormat.init(inst, def);
  }
);
// @__NO_SIDE_EFFECTS__
export function base64url(params?: string | core.$SchemaBase64URLParams): SchemaMiniBase64URL {
  return core._base64url(SchemaMiniBase64URL, params);
}

// SchemaMiniE164
export interface SchemaMiniE164 extends _SchemaMiniString<core.$SchemaE164Internals> {
  // _schema: core.$SchemaE164Internals;
}
export const SchemaMiniE164: core.$constructor<SchemaMiniE164> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniE164",
  (inst, def) => {
    core.$SchemaE164.init(inst, def);
    SchemaMiniStringFormat.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function e164(params?: string | core.$SchemaE164Params): SchemaMiniE164 {
  return core._e164(SchemaMiniE164, params);
}

// SchemaMiniCreditCard
export interface SchemaMiniCreditCard extends _SchemaMiniString<core.$SchemaCreditCardInternals> {}
export const SchemaMiniCreditCard: core.$constructor<SchemaMiniCreditCard> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniCreditCard",
  (inst, def) => {
    core.$SchemaCreditCard.init(inst, def);
    SchemaMiniStringFormat.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function creditCard(params?: string | core.$SchemaCreditCardParams): SchemaMiniCreditCard {
  return core._creditCard(SchemaMiniCreditCard, params);
}

// SchemaMiniIBAN
export interface SchemaMiniIBAN extends _SchemaMiniString<core.$SchemaIBANInternals> {}
export const SchemaMiniIBAN: core.$constructor<SchemaMiniIBAN> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniIBAN",
  (inst, def) => {
    core.$SchemaIBAN.init(inst, def);
    SchemaMiniStringFormat.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function iban(params?: string | core.$SchemaIBANParams): SchemaMiniIBAN {
  return core._iban(SchemaMiniIBAN, params);
}

// SchemaMiniJWT
export interface SchemaMiniJWT extends _SchemaMiniString<core.$SchemaJWTInternals> {
  // _schema: core.$SchemaJWTInternals;
}
export const SchemaMiniJWT: core.$constructor<SchemaMiniJWT> = /*@__PURE__*/ core.$constructor("SchemaMiniJWT", (inst, def) => {
  core.$SchemaJWT.init(inst, def);
  SchemaMiniStringFormat.init(inst, def);
});

// @__NO_SIDE_EFFECTS__
export function jwt(params?: string | core.$SchemaJWTParams): SchemaMiniJWT {
  return core._jwt(SchemaMiniJWT, params);
}

// SchemaMiniCustomStringFormat
export interface SchemaMiniCustomStringFormat<Format extends string = string>
  extends SchemaMiniStringFormat<Format>,
    core.$SchemaCustomStringFormat<Format> {
  _schema: core.$SchemaCustomStringFormatInternals<Format>;
}
export const SchemaMiniCustomStringFormat: core.$constructor<SchemaMiniCustomStringFormat> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniCustomStringFormat",
  (inst, def) => {
    core.$SchemaCustomStringFormat.init(inst, def);
    SchemaMiniStringFormat.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function stringFormat<Format extends string>(
  format: Format,
  fnOrRegex: ((arg: string) => util.MaybeAsync<unknown>) | RegExp,
  _params: string | core.$SchemaStringFormatParams = {}
): SchemaMiniCustomStringFormat<Format> {
  return core._stringFormat(SchemaMiniCustomStringFormat, format, fnOrRegex, _params) as any;
}

// @__NO_SIDE_EFFECTS__
export function hostname(_params?: string | core.$SchemaStringFormatParams): SchemaMiniCustomStringFormat<"hostname"> {
  return core._stringFormat(SchemaMiniCustomStringFormat, "hostname", regexes.hostname, _params) as any;
}

// @__NO_SIDE_EFFECTS__
export function hex(_params?: string | core.$SchemaStringFormatParams): SchemaMiniCustomStringFormat<"hex"> {
  return core._stringFormat(SchemaMiniCustomStringFormat, "hex", regexes.hex, _params) as any;
}

// @__NO_SIDE_EFFECTS__
export function currencyCode(
  _params?: string | core.$SchemaStringFormatParams
): SchemaMiniCustomStringFormat<"currency_code"> {
  return core._stringFormat(SchemaMiniCustomStringFormat, "currency_code", regexes.currencyCode, _params) as any;
}

// @__NO_SIDE_EFFECTS__
export function hash<Alg extends util.HashAlgorithm, Enc extends util.HashEncoding = "hex">(
  alg: Alg,
  params?: {
    enc?: Enc;
  } & core.$SchemaStringFormatParams
): SchemaMiniCustomStringFormat<`${Alg}_${Enc}`> {
  const enc = params?.enc ?? "hex";
  const format = `${alg}_${enc}` as const;
  const regex = core.regexes[format as keyof typeof core.regexes] as RegExp;
  // check for unrecognized format
  if (!regex) throw new Error(`Unrecognized hash format: ${format}`);
  return core._stringFormat(SchemaMiniCustomStringFormat, format, regex, params) as any;
}

// SchemaMiniNumber
interface _SchemaMiniNumber<T extends core.$SchemaNumberInternals<unknown> = core.$SchemaNumberInternals<unknown>>
  extends _SchemaMiniType<T>,
    core.$SchemaNumber<T["input"]> {
  _schema: T;
}
export interface SchemaMiniNumber<Input = unknown>
  extends _SchemaMiniNumber<core.$SchemaNumberInternals<Input>>,
    core.$SchemaNumber<Input> {}
export const SchemaMiniNumber: core.$constructor<SchemaMiniNumber> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniNumber",
  (inst, def) => {
    core.$SchemaNumber.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function number(params?: string | core.$SchemaNumberParams): SchemaMiniNumber<number> {
  return core._number(SchemaMiniNumber, params) as any;
}

// SchemaMiniNumberFormat
export interface SchemaMiniNumberFormat<Format extends core.$SchemaNumberFormats = core.$SchemaNumberFormats>
  extends _SchemaMiniNumber<core.$SchemaNumberFormatInternals<Format>>,
    core.$SchemaNumberFormat<Format> {}
export const SchemaMiniNumberFormat: core.$constructor<SchemaMiniNumberFormat> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniNumberFormat",
  (inst, def) => {
    core.$SchemaNumberFormat.init(inst, def);
    SchemaMiniNumber.init(inst, def);
  }
);

// int

// @__NO_SIDE_EFFECTS__
export interface SchemaMiniInt extends SchemaMiniNumberFormat<"safeint"> {}
export function int(params?: string | core.$SchemaCheckNumberFormatParams): SchemaMiniInt {
  return core._int(SchemaMiniNumberFormat, params) as SchemaMiniInt;
}

// float32

// @__NO_SIDE_EFFECTS__
export interface SchemaMiniFloat32 extends SchemaMiniNumberFormat<"float32"> {}
export function float32(params?: string | core.$SchemaCheckNumberFormatParams): SchemaMiniFloat32 {
  return core._float32(SchemaMiniNumberFormat, params) as SchemaMiniFloat32;
}

// float64

// @__NO_SIDE_EFFECTS__
export interface SchemaMiniFloat64 extends SchemaMiniNumberFormat<"float64"> {}
export function float64(params?: string | core.$SchemaCheckNumberFormatParams): SchemaMiniFloat64 {
  return core._float64(SchemaMiniNumberFormat, params) as SchemaMiniFloat64;
}

// int32

// @__NO_SIDE_EFFECTS__
export interface SchemaMiniInt32 extends SchemaMiniNumberFormat<"int32"> {}
export function int32(params?: string | core.$SchemaCheckNumberFormatParams): SchemaMiniInt32 {
  return core._int32(SchemaMiniNumberFormat, params) as SchemaMiniInt32;
}

// uint32

// @__NO_SIDE_EFFECTS__
export interface SchemaMiniUInt32 extends SchemaMiniNumberFormat<"uint32"> {}
export function uint32(params?: string | core.$SchemaCheckNumberFormatParams): SchemaMiniUInt32 {
  return core._uint32(SchemaMiniNumberFormat, params) as SchemaMiniUInt32;
}

// SchemaMiniBoolean
export interface SchemaMiniBoolean<T = unknown> extends _SchemaMiniType<core.$SchemaBooleanInternals<T>> {
  // _schema: core.$SchemaBooleanInternals<T>;
}
export const SchemaMiniBoolean: core.$constructor<SchemaMiniBoolean> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniBoolean",
  (inst, def) => {
    core.$SchemaBoolean.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function boolean(params?: string | core.$SchemaBooleanParams): SchemaMiniBoolean<boolean> {
  return core._boolean(SchemaMiniBoolean, params) as any;
}

// SchemaMiniBigInt
export interface SchemaMiniBigInt<T = unknown> extends _SchemaMiniType<core.$SchemaBigIntInternals<T>>, core.$SchemaBigInt<T> {
  // _schema: core.$SchemaBigIntInternals<T>;
}
export const SchemaMiniBigInt: core.$constructor<SchemaMiniBigInt> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniBigInt",
  (inst, def) => {
    core.$SchemaBigInt.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function bigint(params?: string | core.$SchemaBigIntParams): SchemaMiniBigInt<bigint> {
  return core._bigint(SchemaMiniBigInt, params) as any;
}

// bigint formats

// SchemaMiniBigIntFormat
export interface SchemaMiniBigIntFormat<Format extends $SchemaBigIntFormats = $SchemaBigIntFormats>
  extends _SchemaMiniType<core.$SchemaBigIntFormatInternals<Format>> {
  // _schema: core.$SchemaBigIntFormatInternals<Format>;
}
export const SchemaMiniBigIntFormat: core.$constructor<SchemaMiniBigIntFormat> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniBigIntFormat",
  (inst, def) => {
    core.$SchemaBigIntFormat.init(inst, def);
    SchemaMiniBigInt.init(inst, def);
  }
);

// int64

// @__NO_SIDE_EFFECTS__
export interface SchemaMiniInt64 extends SchemaMiniBigIntFormat<"int64"> {}
export function int64(params?: string | core.$SchemaBigIntFormatParams): SchemaMiniInt64 {
  return core._int64(SchemaMiniBigIntFormat, params) as SchemaMiniInt64;
}

// uint64

// @__NO_SIDE_EFFECTS__
export interface SchemaMiniUInt64 extends SchemaMiniBigIntFormat<"uint64"> {}
export function uint64(params?: string | core.$SchemaBigIntFormatParams): SchemaMiniUInt64 {
  return core._uint64(SchemaMiniBigIntFormat, params) as SchemaMiniUInt64;
}

// SchemaMiniSymbol
export interface SchemaMiniSymbol extends _SchemaMiniType<core.$SchemaSymbolInternals> {
  // _schema: core.$SchemaSymbolInternals;
}
export const SchemaMiniSymbol: core.$constructor<SchemaMiniSymbol> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniSymbol",
  (inst, def) => {
    core.$SchemaSymbol.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function symbol(params?: string | core.$SchemaSymbolParams): SchemaMiniSymbol {
  return core._symbol(SchemaMiniSymbol, params) as any;
}

// SchemaMiniUndefined
export interface SchemaMiniUndefined extends _SchemaMiniType<core.$SchemaUndefinedInternals> {
  // _schema: core.$SchemaUndefinedInternals;
}
export const SchemaMiniUndefined: core.$constructor<SchemaMiniUndefined> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniUndefined",
  (inst, def) => {
    core.$SchemaUndefined.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
function _undefined(params?: string | core.$SchemaUndefinedParams): SchemaMiniUndefined {
  return core._undefined(SchemaMiniUndefined, params) as any;
}
export { _undefined as undefined };

// SchemaMiniNull
export interface SchemaMiniNull extends _SchemaMiniType<core.$SchemaNullInternals> {
  // _schema: core.$SchemaNullInternals;
}
export const SchemaMiniNull: core.$constructor<SchemaMiniNull> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniNull",
  (inst, def) => {
    core.$SchemaNull.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
function _null(params?: string | core.$SchemaNullParams): SchemaMiniNull {
  return core._null(SchemaMiniNull, params) as any;
}
export { _null as null };

// SchemaMiniAny
export interface SchemaMiniAny extends _SchemaMiniType<core.$SchemaAnyInternals> {
  // _schema: core.$SchemaAnyInternals;
}
export const SchemaMiniAny: core.$constructor<SchemaMiniAny> = /*@__PURE__*/ core.$constructor("SchemaMiniAny", (inst, def) => {
  core.$SchemaAny.init(inst, def);
  SchemaMiniType.init(inst, def);
});

// @__NO_SIDE_EFFECTS__
export function any(): SchemaMiniAny {
  return core._any(SchemaMiniAny) as any;
}

// SchemaMiniUnknown
export interface SchemaMiniUnknown extends _SchemaMiniType<core.$SchemaUnknownInternals> {
  // _schema: core.$SchemaUnknownInternals;
}
export const SchemaMiniUnknown: core.$constructor<SchemaMiniUnknown> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniUnknown",
  (inst, def) => {
    core.$SchemaUnknown.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function unknown(): SchemaMiniUnknown {
  return core._unknown(SchemaMiniUnknown) as any;
}

// SchemaMiniNever
export interface SchemaMiniNever extends _SchemaMiniType<core.$SchemaNeverInternals> {
  // _schema: core.$SchemaNeverInternals;
}
export const SchemaMiniNever: core.$constructor<SchemaMiniNever> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniNever",
  (inst, def) => {
    core.$SchemaNever.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function never(params?: string | core.$SchemaNeverParams): SchemaMiniNever {
  return core._never(SchemaMiniNever, params) as any;
}

// SchemaMiniVoid
export interface SchemaMiniVoid extends _SchemaMiniType<core.$SchemaVoidInternals> {
  // _schema: core.$SchemaVoidInternals;
}
export const SchemaMiniVoid: core.$constructor<SchemaMiniVoid> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniVoid",
  (inst, def) => {
    core.$SchemaVoid.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
function _void(params?: string | core.$SchemaVoidParams): SchemaMiniVoid {
  return core._void(SchemaMiniVoid, params) as any;
}
export { _void as void };

// SchemaMiniDate
export interface SchemaMiniDate<T = unknown> extends _SchemaMiniType<core.$SchemaDateInternals<T>> {
  // _schema: core.$SchemaDateInternals<T>;
}

export const SchemaMiniDate: core.$constructor<SchemaMiniDate> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniDate",
  (inst, def) => {
    core.$SchemaDate.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function date(params?: string | core.$SchemaDateParams): SchemaMiniDate<Date> {
  return core._date(SchemaMiniDate, params) as any;
}

// SchemaMiniArray
export interface SchemaMiniArray<T extends SomeType = core.$SchemaType>
  extends _SchemaMiniType<core.$SchemaArrayInternals<T>>,
    core.$SchemaArray<T> {
  // _schema: core.$SchemaArrayInternals<T>;
}
export const SchemaMiniArray: core.$constructor<SchemaMiniArray> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniArray",
  (inst, def) => {
    core.$SchemaArray.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

export function array<T extends SomeType>(element: T, params?: string | core.$SchemaArrayParams): SchemaMiniArray<T>;
// @__NO_SIDE_EFFECTS__
export function array<T extends SomeType>(element: SomeType, params?: any): SchemaMiniArray<T> {
  return new SchemaMiniArray({
    type: "array",
    element: element as core.$SchemaType,
    ...util.normalizeParams(params),
  }) as any;
}

// .keyof
// @__NO_SIDE_EFFECTS__
export function keyof<T extends SchemaMiniObject>(schema: T): SchemaMiniEnum<util.KeysEnum<T["shape"]>> {
  const shape = Schema._schema.def.shape;
  return _enum(Object.keys(shape)) as any;
}

// SchemaMiniObject
export interface SchemaMiniObject<
  /** @ts-ignore Cast variance */
  out Shape extends core.$SchemaShape = core.$SchemaShape,
  out Config extends core.$SchemaObjectConfig = core.$strip,
> extends SchemaMiniType<any, any, core.$SchemaObjectInternals<Shape, Config>>,
    core.$SchemaObject<Shape, Config> {
  shape: Shape;
}
export const SchemaMiniObject: core.$constructor<SchemaMiniObject> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniObject",
  (inst, def) => {
    core.$SchemaObject.init(inst, def);
    SchemaMiniType.init(inst, def);
    util.installLazyProp(inst, "shape", (self) => self._schema.def.shape, false);
  }
);
// @__NO_SIDE_EFFECTS__
export function object<T extends core.$SchemaLooseShape = Record<never, SomeType>>(
  shape?: T,
  params?: string | core.$SchemaObjectParams
): SchemaMiniObject<util.Writeable<T>, core.$strip> {
  const def: core.$SchemaObjectDef = {
    type: "object",
    shape: shape ?? {},
    ...util.normalizeParams(params),
  };
  return new SchemaMiniObject(def) as any;
}

// strictObject
// @__NO_SIDE_EFFECTS__
export function strictObject<T extends core.$SchemaLooseShape>(
  shape: T,
  params?: string | core.$SchemaObjectParams
): SchemaMiniObject<util.Writeable<T>, core.$strict> {
  return new SchemaMiniObject({
    type: "object",
    shape,
    catchall: never(),
    ...util.normalizeParams(params),
  }) as any;
}

// looseObject
// @__NO_SIDE_EFFECTS__
export function looseObject<T extends core.$SchemaLooseShape>(
  shape: T,
  params?: string | core.$SchemaObjectParams
): SchemaMiniObject<util.Writeable<T>, core.$loose> {
  return new SchemaMiniObject({
    type: "object",
    shape,
    catchall: unknown(),
    ...util.normalizeParams(params),
  }) as any;
}

// object methods
// @__NO_SIDE_EFFECTS__
export function extend<T extends SchemaMiniObject, U extends core.$SchemaLooseShape>(
  schema: T,
  shape: U
): SchemaMiniObject<util.Extend<T["shape"], util.Writeable<U>>, T["_schema"]["config"]> {
  return util.extend(schema, shape);
}

export type SafeExtendShape<Base extends core.$SchemaShape, Ext extends core.$SchemaLooseShape> = {
  [K in keyof Ext]: K extends keyof Base
    ? core.output<Ext[K]> extends core.output<Base[K]>
      ? core.input<Ext[K]> extends core.input<Base[K]>
        ? Ext[K]
        : never
      : never
    : Ext[K];
};

// @__NO_SIDE_EFFECTS__
export function safeExtend<T extends SchemaMiniObject, U extends core.$SchemaLooseShape>(
  schema: T,
  shape: SafeExtendShape<T["shape"], U>
): SchemaMiniObject<util.Extend<T["shape"], util.Writeable<U>>, T["_schema"]["config"]> {
  return util.safeExtend(schema, shape as any);
}

/**
 * @deprecated Use [`Schema.extend(A, B.shape)`](https://Schema.dev/api?id=extend) instead.
 */
// @__NO_SIDE_EFFECTS__
export function merge<T extends SchemaMiniObject, U extends SchemaMiniObject>(
  a: T,
  b: U
): SchemaMiniObject<util.Extend<T["shape"], U["shape"]>, U["_schema"]["config"]> {
  return util.merge(a, b) as any;
}

// @__NO_SIDE_EFFECTS__
export function pick<T extends SchemaMiniObject, M extends util.Mask<keyof T["shape"]>>(
  schema: T,
  mask: M & Record<Exclude<keyof M, keyof T["shape"]>, never>
): SchemaMiniObject<util.Flatten<Pick<T["shape"], keyof T["shape"] & keyof M>>, T["_schema"]["config"]> {
  return util.pick(schema, mask as any);
}

// .omit

// @__NO_SIDE_EFFECTS__
export function omit<T extends SchemaMiniObject, M extends util.Mask<keyof T["shape"]>>(
  schema: T,
  mask: M & Record<Exclude<keyof M, keyof T["shape"]>, never>
): SchemaMiniObject<util.Flatten<Omit<T["shape"], keyof M>>, T["_schema"]["config"]> {
  return util.omit(schema, mask);
}

// @__NO_SIDE_EFFECTS__
export function partial<T extends SchemaMiniObject>(
  schema: T
): SchemaMiniObject<
  {
    -readonly [k in keyof T["shape"]]: SchemaMiniOptional<T["shape"][k]>;
  },
  T["_schema"]["config"]
>;
// @__NO_SIDE_EFFECTS__
export function partial<T extends SchemaMiniObject, M extends util.Mask<keyof T["shape"]>>(
  schema: T,
  mask: M & Record<Exclude<keyof M, keyof T["shape"]>, never>
): SchemaMiniObject<
  {
    -readonly [k in keyof T["shape"]]: k extends keyof M ? SchemaMiniOptional<T["shape"][k]> : T["shape"][k];
  },
  T["_schema"]["config"]
>;
// @__NO_SIDE_EFFECTS__
export function partial<T extends util.TupleItems, Rest extends SomeType | null>(
  schema: SchemaMiniTuple<T, Rest>
): SchemaMiniTuple<{ -readonly [k in keyof T]: SchemaMiniOptional<T[k]> }, Rest>;
// @__NO_SIDE_EFFECTS__
export function partial(schema: SchemaMiniObject | SchemaMiniTuple, mask?: object) {
  const def = Schema._schema.def;
  if (def.type !== "tuple") return util.partial(SchemaMiniOptional, schema as SchemaMiniObject, mask);
  // a refinement was authored against the full arity; partialing would run it on a shorter array
  if (def.checks?.length) throw new Error(".partial() cannot be used on tuple schemas containing refinements");
  return util.clone(schema, {
    ...def,
    items: def.items.map((item) => new SchemaMiniOptional({ type: "optional", innerType: item as core.$SchemaType })),
  });
}

// @__NO_SIDE_EFFECTS__
export function exactPartial<T extends SchemaMiniObject>(
  schema: T
): SchemaMiniObject<
  {
    -readonly [k in keyof T["shape"]]: SchemaMiniExactOptional<T["shape"][k]>;
  },
  T["_schema"]["config"]
>;
// @__NO_SIDE_EFFECTS__
export function exactPartial<T extends SchemaMiniObject, M extends util.Mask<keyof T["shape"]>>(
  schema: T,
  mask: M & Record<Exclude<keyof M, keyof T["shape"]>, never>
): SchemaMiniObject<
  {
    -readonly [k in keyof T["shape"]]: k extends keyof M ? SchemaMiniExactOptional<T["shape"][k]> : T["shape"][k];
  },
  T["_schema"]["config"]
>;
// @__NO_SIDE_EFFECTS__
export function exactPartial(schema: SchemaMiniObject, mask?: object) {
  return util.partial(SchemaMiniExactOptional, schema, mask, "exactPartial");
}

export type RequiredInterfaceShape<
  Shape extends core.$SchemaLooseShape,
  Keys extends PropertyKey = keyof Shape,
> = util.Identity<
  {
    [k in keyof Shape as k extends Keys ? k : never]: SchemaMiniNonOptional<Shape[k]>;
  } & {
    [k in keyof Shape as k extends Keys ? never : k]: Shape[k];
  }
>;

// @__NO_SIDE_EFFECTS__
export function required<T extends SchemaMiniObject>(
  schema: T
): SchemaMiniObject<
  {
    -readonly [k in keyof T["shape"]]: SchemaMiniNonOptional<T["shape"][k]>;
  },
  T["_schema"]["config"]
>;
// @__NO_SIDE_EFFECTS__
export function required<T extends SchemaMiniObject, M extends util.Mask<keyof T["shape"]>>(
  schema: T,
  mask: M & Record<Exclude<keyof M, keyof T["shape"]>, never>
): SchemaMiniObject<
  util.Extend<
    T["shape"],
    {
      [k in keyof M & keyof T["shape"]]: SchemaMiniNonOptional<T["shape"][k]>;
    }
  >,
  T["_schema"]["config"]
>;
// @__NO_SIDE_EFFECTS__
export function required(schema: SchemaMiniObject, mask?: object) {
  return util.required(SchemaMiniNonOptional, schema, mask);
}

// @__NO_SIDE_EFFECTS__
export function catchall<T extends SchemaMiniObject, U extends SomeType>(
  inst: T,
  catchall: U
): SchemaMiniObject<T["shape"], core.$catchall<U>> {
  // `mergeDefs` rather than a spread: spreading reads `shape`, and resolving it can mint a whole fresh subtree
  return inst.clone(util.mergeDefs(inst._schema.def, { catchall: catchall as any })) as any;
}

// SchemaMiniUnion
export interface SchemaMiniUnion<T extends readonly SomeType[] = readonly core.$SchemaType[]>
  extends _SchemaMiniType<core.$SchemaUnionInternals<T>> {
  // _schema: core.$SchemaUnionInternals<T>;
}
export const SchemaMiniUnion: core.$constructor<SchemaMiniUnion> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniUnion",
  (inst, def) => {
    core.$SchemaUnion.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function union<const T extends readonly SomeType[]>(
  options: T,
  params?: string | core.$SchemaUnionParams
): SchemaMiniUnion<T> {
  return new SchemaMiniUnion({
    type: "union",
    options: options as any as core.$SchemaType[],
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaMiniXor
export interface SchemaMiniXor<T extends readonly SomeType[] = readonly core.$SchemaType[]>
  extends _SchemaMiniType<core.$SchemaXorInternals<T>> {
  // _schema: core.$SchemaXorInternals<T>;
}
export const SchemaMiniXor: core.$constructor<SchemaMiniXor> = /*@__PURE__*/ core.$constructor("SchemaMiniXor", (inst, def) => {
  SchemaMiniUnion.init(inst, def);
  core.$SchemaXor.init(inst, def);
});

/** Creates an exclusive union (XOR) where exactly one option must match.
 * Unlike regular unions that succeed when any option matches, xor fails if
 * zero or more than one option matches the input. */
export function xor<const T extends readonly SomeType[]>(
  options: T,
  params?: string | core.$SchemaXorParams
): SchemaMiniXor<T> {
  return new SchemaMiniXor({
    type: "union",
    options: options as any as core.$SchemaType[],
    inclusive: false,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaMiniDiscriminatedUnion
export interface SchemaMiniDiscriminatedUnion<
  Options extends readonly SomeType[] = readonly core.$SchemaType[],
  Disc extends string = string,
> extends SchemaMiniUnion<Options> {
  _schema: core.$SchemaDiscriminatedUnionInternals<Options, Disc>;
}
export const SchemaMiniDiscriminatedUnion: core.$constructor<SchemaMiniDiscriminatedUnion> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniDiscriminatedUnion",
  (inst, def) => {
    core.$SchemaDiscriminatedUnion.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function discriminatedUnion<
  Types extends readonly [core.$SchemaTypeDiscriminable, ...core.$SchemaTypeDiscriminable[]],
  Disc extends string,
>(
  discriminator: Disc,
  options: Types,
  params?: string | core.$SchemaDiscriminatedUnionParams
): SchemaMiniDiscriminatedUnion<Types, Disc> {
  return new SchemaMiniDiscriminatedUnion({
    type: "union",
    options: options as any as core.$SchemaType[],
    discriminator,
    ...util.normalizeParams(params),
  }) as any as SchemaMiniDiscriminatedUnion<Types, Disc>;
}

// SchemaMiniIntersection
export interface SchemaMiniIntersection<A extends SomeType = core.$SchemaType, B extends SomeType = core.$SchemaType>
  extends _SchemaMiniType<core.$SchemaIntersectionInternals<A, B>> {
  // _schema: core.$SchemaIntersectionInternals<A, B>;
}
export const SchemaMiniIntersection: core.$constructor<SchemaMiniIntersection> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniIntersection",
  (inst, def) => {
    core.$SchemaIntersection.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function intersection<T extends SomeType, U extends SomeType>(left: T, right: U): SchemaMiniIntersection<T, U> {
  return new SchemaMiniIntersection({
    type: "intersection",
    left: left as any as core.$SchemaType,
    right: right as any as core.$SchemaType,
  }) as any;
}

// SchemaMiniTuple
export interface SchemaMiniTuple<
  T extends util.TupleItems = readonly core.$SchemaType[],
  Rest extends SomeType | null = core.$SchemaType | null,
> extends _SchemaMiniType<core.$SchemaTupleInternals<T, Rest>> {
  // _schema: core.$SchemaTupleInternals<T, Rest>;
}
export const SchemaMiniTuple: core.$constructor<SchemaMiniTuple> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniTuple",
  (inst, def) => {
    core.$SchemaTuple.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

export function tuple<const T extends readonly [SomeType, ...SomeType[]]>(
  items: T,
  params?: string | core.$SchemaTupleParams
): SchemaMiniTuple<T, null>;
export function tuple<const T extends readonly [SomeType, ...SomeType[]], Rest extends SomeType>(
  items: T,
  rest: Rest,
  params?: string | core.$SchemaTupleParams
): SchemaMiniTuple<T, Rest>;
export function tuple(items: [], params?: string | core.$SchemaTupleParams): SchemaMiniTuple<[], null>;
// @__NO_SIDE_EFFECTS__
export function tuple(
  items: SomeType[],
  _paramsOrRest?: string | core.$SchemaTupleParams | SomeType,
  _params?: string | core.$SchemaTupleParams
) {
  const hasRest = _paramsOrRest instanceof core.$SchemaType;
  const params = hasRest ? _params : _paramsOrRest;
  const rest = hasRest ? _paramsOrRest : null;
  return new SchemaMiniTuple({
    type: "tuple",
    items: items as any as core.$SchemaType[],
    rest,
    ...util.normalizeParams(params),
  });
}

// SchemaMiniRecord
export interface SchemaMiniRecord<
  Key extends core.$SchemaRecordKey = core.$SchemaRecordKey,
  Value extends SomeType = core.$SchemaType,
> extends _SchemaMiniType<core.$SchemaRecordInternals<Key, Value>> {
  // _schema: core.$SchemaRecordInternals<Key, Value>;
}
export const SchemaMiniRecord: core.$constructor<SchemaMiniRecord> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniRecord",
  (inst, def) => {
    core.$SchemaRecord.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function record<Key extends core.$SchemaRecordKey, Value extends SomeType>(
  keyType: Key,
  valueType: Value,
  params?: string | core.$SchemaRecordParams
): SchemaMiniRecord<Key, Value> {
  // v3-compat: Schema.record(valueType, params?) — defaults keyType to Schema.string()
  if (!valueType || !(valueType as any)._schema) {
    return new SchemaMiniRecord({
      type: "record",
      keyType: string() as any,
      valueType: keyType as any as core.$SchemaType,
      ...util.normalizeParams(valueType as string | core.$SchemaRecordParams | undefined),
    }) as any;
  }
  return new SchemaMiniRecord({
    type: "record",
    keyType,
    valueType: valueType as any as core.$SchemaType,
    ...util.normalizeParams(params),
  }) as any;
}
// @__NO_SIDE_EFFECTS__
export function partialRecord<Key extends core.$SchemaRecordKey, Value extends SomeType>(
  keyType: Key,
  valueType: Value,
  params?: string | core.$SchemaRecordParams
): SchemaMiniRecord<Key & core.$partial, Value> {
  return new SchemaMiniRecord({
    type: "record",
    keyType,
    valueType: valueType as any,
    ...util.normalizeParams(params),
    partial: true,
  }) as any;
}

export function looseRecord<Key extends core.$SchemaRecordKey, Value extends SomeType>(
  keyType: Key,
  valueType: Value,
  params?: string | core.$SchemaRecordParams
): SchemaMiniRecord<Key, Value> {
  return new SchemaMiniRecord({
    type: "record",
    keyType,
    valueType: valueType as any as core.$SchemaType,
    mode: "loose",
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaMiniMap
export interface SchemaMiniMap<Key extends SomeType = core.$SchemaType, Value extends SomeType = core.$SchemaType>
  extends _SchemaMiniType<core.$SchemaMapInternals<Key, Value>> {
  // _schema: core.$SchemaMapInternals<Key, Value>;
}
export const SchemaMiniMap: core.$constructor<SchemaMiniMap> = /*@__PURE__*/ core.$constructor("SchemaMiniMap", (inst, def) => {
  core.$SchemaMap.init(inst, def);
  SchemaMiniType.init(inst, def);
});

// @__NO_SIDE_EFFECTS__
export function map<Key extends SomeType, Value extends SomeType>(
  keyType: Key,
  valueType: Value,
  params?: string | core.$SchemaMapParams
): SchemaMiniMap<Key, Value> {
  return new SchemaMiniMap({
    type: "map",
    keyType: keyType as any as core.$SchemaType,
    valueType: valueType as any as core.$SchemaType,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaMiniSet
export interface SchemaMiniSet<T extends SomeType = core.$SchemaType> extends _SchemaMiniType<core.$SchemaSetInternals<T>> {
  // _schema: core.$SchemaSetInternals<T>;
}
export const SchemaMiniSet: core.$constructor<SchemaMiniSet> = /*@__PURE__*/ core.$constructor("SchemaMiniSet", (inst, def) => {
  core.$SchemaSet.init(inst, def);
  SchemaMiniType.init(inst, def);
});

// @__NO_SIDE_EFFECTS__
export function set<Value extends SomeType>(valueType: Value, params?: string | core.$SchemaSetParams): SchemaMiniSet<Value> {
  return new SchemaMiniSet({
    type: "set",
    valueType: valueType as any as core.$SchemaType,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaMiniEnum
export interface SchemaMiniEnum<T extends util.EnumLike = util.EnumLike> extends _SchemaMiniType<core.$SchemaEnumInternals<T>> {
  // _schema: core.$SchemaEnumInternals<T>;
  options: Array<T[keyof T]>;
}
export const SchemaMiniEnum: core.$constructor<SchemaMiniEnum> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniEnum",
  (inst, def) => {
    core.$SchemaEnum.init(inst, def);
    SchemaMiniType.init(inst, def);

    // reuse the parsed value set so a numeric TS enum's reverse-mapping keys stay out
    inst.options = [...inst._schema.values] as util.EnumValue[];
  }
);

function _enum<const T extends readonly string[]>(
  values: T,
  params?: string | core.$SchemaEnumParams
): SchemaMiniEnum<util.ToEnum<T[number]>>;
function _enum<T extends util.EnumLike>(entries: T, params?: string | core.$SchemaEnumParams): SchemaMiniEnum<T>;
// @__NO_SIDE_EFFECTS__
function _enum(values: any, params?: string | core.$SchemaEnumParams) {
  const entries: any = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;

  return new SchemaMiniEnum({
    type: "enum",
    entries,
    ...util.normalizeParams(params),
  }) as any;
}
export { _enum as enum };

// @__NO_SIDE_EFFECTS__
/** @deprecated This API has been merged into `Schema.enum()`. Use `Schema.enum()` instead.
 *
 * ```ts
 * enum Colors { red, green, blue }
 * Schema.enum(Colors);
 * ```
 */
export function nativeEnum<T extends util.EnumLike>(entries: T, params?: string | core.$SchemaEnumParams): SchemaMiniEnum<T> {
  return new SchemaMiniEnum({
    type: "enum",
    entries,
    ...util.normalizeParams(params),
  }) as any as SchemaMiniEnum<T>;
}

// SchemaMiniLiteral
export interface SchemaMiniLiteral<T extends util.Literal = util.Literal>
  extends _SchemaMiniType<core.$SchemaLiteralInternals<T>> {
  // _schema: core.$SchemaLiteralInternals<T>;
}
export const SchemaMiniLiteral: core.$constructor<SchemaMiniLiteral> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniLiteral",
  (inst, def) => {
    core.$SchemaLiteral.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

export function literal<const T extends ReadonlyArray<util.Literal>>(
  value: T,
  params?: string | core.$SchemaLiteralParams
): SchemaMiniLiteral<T[number]>;
export function literal<const T extends util.Literal>(
  value: T,
  params?: string | core.$SchemaLiteralParams
): SchemaMiniLiteral<T>;
// @__NO_SIDE_EFFECTS__
export function literal(value: any, params: any) {
  return new SchemaMiniLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...util.normalizeParams(params),
  });
}

// SchemaMiniFile
export interface SchemaMiniFile extends _SchemaMiniType<core.$SchemaFileInternals> {
  // _schema: core.$SchemaFileInternals;
}
export const SchemaMiniFile: core.$constructor<SchemaMiniFile> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniFile",
  (inst, def) => {
    core.$SchemaFile.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function file(params?: string | core.$SchemaFileParams): SchemaMiniFile {
  return core._file(SchemaMiniFile, params) as any;
}

// SchemaMiniTransform
export interface SchemaMiniTransform<O = unknown, I = unknown> extends _SchemaMiniType<core.$SchemaTransformInternals<O, I>> {
  // _schema: core.$SchemaTransformInternals<O, I>;
}
export const SchemaMiniTransform: core.$constructor<SchemaMiniTransform> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniTransform",
  (inst, def) => {
    core.$SchemaTransform.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function transform<I = unknown, O = I>(
  fn: (input: I, ctx: core.ParsePayload) => O
): SchemaMiniTransform<Awaited<O>, I> {
  return new SchemaMiniTransform({
    type: "transform",
    transform: fn as any,
  }) as any;
}

// SchemaMiniOptional
export interface SchemaMiniOptional<T extends SomeType = core.$SchemaType>
  extends _SchemaMiniType<core.$SchemaOptionalInternals<T>>,
    core.$SchemaOptional<T> {
  // _schema: core.$SchemaOptionalInternals<T>;
}
export const SchemaMiniOptional: core.$constructor<SchemaMiniOptional> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniOptional",
  (inst, def) => {
    core.$SchemaOptional.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function optional<T extends SomeType>(innerType: T): SchemaMiniOptional<T> {
  return new SchemaMiniOptional({
    type: "optional",
    innerType: innerType as any as core.$SchemaType,
  }) as any;
}

// SchemaMiniExactOptional
export interface SchemaMiniExactOptional<T extends SomeType = core.$SchemaType>
  extends _SchemaMiniType<core.$SchemaExactOptionalInternals<T>>,
    core.$SchemaExactOptional<T> {
  // _schema: core.$SchemaExactOptionalInternals<T>;
}
export const SchemaMiniExactOptional: core.$constructor<SchemaMiniExactOptional> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniExactOptional",
  (inst, def) => {
    core.$SchemaExactOptional.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function exactOptional<T extends SomeType>(innerType: T): SchemaMiniExactOptional<T> {
  return new SchemaMiniExactOptional({
    type: "optional",
    innerType: innerType as any as core.$SchemaType,
  }) as any;
}

// SchemaMiniNullable
export interface SchemaMiniNullable<T extends SomeType = core.$SchemaType>
  extends _SchemaMiniType<core.$SchemaNullableInternals<T>> {
  // _schema: core.$SchemaNullableInternals<T>;
}
export const SchemaMiniNullable: core.$constructor<SchemaMiniNullable> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniNullable",
  (inst, def) => {
    core.$SchemaNullable.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function nullable<T extends SomeType>(innerType: T): SchemaMiniNullable<T> {
  return new SchemaMiniNullable({
    type: "nullable",
    innerType: innerType as any as core.$SchemaType,
  }) as any;
}

// nullish
// @__NO_SIDE_EFFECTS__
export function nullish<T extends SomeType>(innerType: T): SchemaMiniOptional<SchemaMiniNullable<T>> {
  return optional(nullable(innerType));
}

// SchemaMiniDefault
export interface SchemaMiniDefault<T extends SomeType = core.$SchemaType> extends _SchemaMiniType<core.$SchemaDefaultInternals<T>> {
  // _schema: core.$SchemaDefaultInternals<T>;
}
export const SchemaMiniDefault: core.$constructor<SchemaMiniDefault> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniDefault",
  (inst, def) => {
    core.$SchemaDefault.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function _default<T extends SomeType>(
  innerType: T,
  defaultValue: util.NoUndefined<core.output<T>> | (() => util.NoUndefined<core.output<T>>)
): SchemaMiniDefault<T> {
  return new SchemaMiniDefault({
    type: "default",
    innerType: innerType as any as core.$SchemaType,
    get defaultValue() {
      return typeof defaultValue === "function" ? (defaultValue as Function)() : util.shallowClone(defaultValue);
    },
  }) as any;
}

// SchemaMiniPrefault
export interface SchemaMiniPrefault<T extends SomeType = core.$SchemaType>
  extends _SchemaMiniType<core.$SchemaPrefaultInternals<T>> {
  // _schema: core.$SchemaPrefaultInternals<T>;
}
export const SchemaMiniPrefault: core.$constructor<SchemaMiniPrefault> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniPrefault",
  (inst, def) => {
    core.$SchemaPrefault.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);
// @__NO_SIDE_EFFECTS__
export function prefault<T extends SomeType>(
  innerType: T,
  defaultValue: core.input<T> | (() => core.input<T>)
): SchemaMiniPrefault<T> {
  return new SchemaMiniPrefault({
    type: "prefault",
    innerType: innerType as any as core.$SchemaType,
    get defaultValue() {
      return typeof defaultValue === "function" ? (defaultValue as Function)() : util.shallowClone(defaultValue);
    },
  }) as any;
}

// SchemaMiniNonOptional
export interface SchemaMiniNonOptional<T extends SomeType = core.$SchemaType>
  extends _SchemaMiniType<core.$SchemaNonOptionalInternals<T>> {
  // _schema: core.$SchemaNonOptionalInternals<T>;
}
export const SchemaMiniNonOptional: core.$constructor<SchemaMiniNonOptional> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniNonOptional",
  (inst, def) => {
    core.$SchemaNonOptional.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function nonoptional<T extends SomeType>(
  innerType: T,
  params?: string | core.$SchemaNonOptionalParams
): SchemaMiniNonOptional<T> {
  return new SchemaMiniNonOptional({
    type: "nonoptional",
    innerType: innerType as any as core.$SchemaType,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaMiniSuccess
export interface SchemaMiniSuccess<T extends SomeType = core.$SchemaType> extends _SchemaMiniType<core.$SchemaSuccessInternals<T>> {
  // _schema: core.$SchemaSuccessInternals<T>;
}
export const SchemaMiniSuccess: core.$constructor<SchemaMiniSuccess> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniSuccess",
  (inst, def) => {
    core.$SchemaSuccess.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function success<T extends SomeType>(innerType: T): SchemaMiniSuccess<T> {
  return new SchemaMiniSuccess({
    type: "success",
    innerType: innerType as any as core.$SchemaType,
  }) as any;
}

// SchemaMiniCatch
export interface SchemaMiniCatch<T extends SomeType = core.$SchemaType> extends _SchemaMiniType<core.$SchemaCatchInternals<T>> {
  // _schema: core.$SchemaCatchInternals<T>;
}
export const SchemaMiniCatch: core.$constructor<SchemaMiniCatch> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniCatch",
  (inst, def) => {
    core.$SchemaCatch.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
function _catch<T extends SomeType>(
  innerType: T,
  catchValue: core.output<T> | ((ctx: core.$SchemaCatchCtx) => core.output<T>)
): SchemaMiniCatch<T> {
  return new SchemaMiniCatch({
    type: "catch",
    innerType: innerType as any as core.$SchemaType,
    catchValue: (typeof catchValue === "function" ? catchValue : core.util.constantCatch(catchValue)) as (
      ctx: core.$SchemaCatchCtx
    ) => core.output<T>,
  }) as any;
}
export { _catch as catch };

// SchemaMiniNaN
export interface SchemaMiniNaN extends _SchemaMiniType<core.$SchemaNaNInternals> {
  // _schema: core.$SchemaNaNInternals;
}
export const SchemaMiniNaN: core.$constructor<SchemaMiniNaN> = /*@__PURE__*/ core.$constructor("SchemaMiniNaN", (inst, def) => {
  core.$SchemaNaN.init(inst, def);
  SchemaMiniType.init(inst, def);
});

// @__NO_SIDE_EFFECTS__
export function nan(params?: string | core.$SchemaNaNParams): SchemaMiniNaN {
  return core._nan(SchemaMiniNaN, params) as any;
}

// SchemaMiniPipe
export interface SchemaMiniPipe<A extends SomeType = core.$SchemaType, B extends SomeType = core.$SchemaType>
  extends _SchemaMiniType<core.$SchemaPipeInternals<A, B>> {
  // _schema: core.$SchemaPipeInternals<A, B>;
}
export const SchemaMiniPipe: core.$constructor<SchemaMiniPipe> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniPipe",
  (inst, def) => {
    core.$SchemaPipe.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function pipe<
  const A extends SomeType,
  B extends core.$SchemaType<unknown, core.output<A>> = core.$SchemaType<unknown, core.output<A>>,
>(in_: A, out: B | core.$SchemaType<unknown, core.output<A>>): SchemaMiniPipe<A, B> {
  return new SchemaMiniPipe({
    type: "pipe",
    in: in_ as any as core.$SchemaType,
    out: out as any as core.$SchemaType,
  }) as any;
}

// SchemaMiniCodec
export interface SchemaMiniCodec<A extends SomeType = core.$SchemaType, B extends SomeType = core.$SchemaType>
  extends SchemaMiniPipe<A, B>,
    core.$SchemaCodec<A, B> {
  _schema: core.$SchemaCodecInternals<A, B>;
  def: core.$SchemaCodecDef<A, B>;
}
export const SchemaMiniCodec: core.$constructor<SchemaMiniCodec> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniCodec",
  (inst, def) => {
    SchemaMiniPipe.init(inst, def);
    core.$SchemaCodec.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function codec<const A extends SomeType, B extends core.SomeType = core.$SchemaType>(
  in_: A,
  out: B,
  params: {
    decode: (value: core.output<A>, payload: core.ParsePayload<core.output<A>>) => core.util.MaybeAsync<core.input<B>>;
    encode: (value: core.input<B>, payload: core.ParsePayload<core.input<B>>) => core.util.MaybeAsync<core.output<A>>;
  }
): SchemaMiniCodec<A, B> {
  return new SchemaMiniCodec({
    type: "pipe",
    in: in_ as any as core.$SchemaType,
    out: out as any as core.$SchemaType,
    transform: params.decode as any,
    reverseTransform: params.encode as any,
  }) as any;
}

// @__NO_SIDE_EFFECTS__
export function invertCodec<A extends SomeType, B extends SomeType>(codec: SchemaMiniCodec<A, B>): SchemaMiniCodec<B, A> {
  const def = codec._schema.def;
  return new SchemaMiniCodec({
    type: "pipe",
    in: def.out as any,
    out: def.in as any,
    transform: def.reverseTransform as any,
    reverseTransform: def.transform as any,
  }) as any;
}

// SchemaMiniReadonly
export interface SchemaMiniReadonly<T extends SomeType = core.$SchemaType>
  extends _SchemaMiniType<core.$SchemaReadonlyInternals<T>> {
  // _schema: core.$SchemaReadonlyInternals<T>;
}
export const SchemaMiniReadonly: core.$constructor<SchemaMiniReadonly> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniReadonly",
  (inst, def) => {
    core.$SchemaReadonly.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function readonly<T extends SomeType>(innerType: T): SchemaMiniReadonly<T> {
  return new SchemaMiniReadonly({
    type: "readonly",
    innerType: innerType as any as core.$SchemaType,
  }) as any;
}

// SchemaMiniTemplateLiteral
export interface SchemaMiniTemplateLiteral<Template extends string = string>
  extends _SchemaMiniType<core.$SchemaTemplateLiteralInternals<Template>> {
  // _schema: core.$SchemaTemplateLiteralInternals<Template>;
}
export const SchemaMiniTemplateLiteral: core.$constructor<SchemaMiniTemplateLiteral> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniTemplateLiteral",
  (inst, def) => {
    core.$SchemaTemplateLiteral.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function templateLiteral<const Parts extends core.$SchemaTemplateLiteralPart[]>(
  parts: Parts,
  params?: string | core.$SchemaTemplateLiteralParams
): SchemaMiniTemplateLiteral<core.$PartsToTemplateLiteral<Parts>> {
  return new SchemaMiniTemplateLiteral({
    type: "template_literal",
    parts,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaMiniLazy
export interface SchemaMiniLazy<T extends SomeType = core.$SchemaType> extends _SchemaMiniType<core.$SchemaLazyInternals<T>> {
  // _schema: core.$SchemaLazyInternals<T>;
}
export const SchemaMiniLazy: core.$constructor<SchemaMiniLazy> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniLazy",
  (inst, def) => {
    core.$SchemaLazy.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// export function lazy<T extends object>(getter: () => T): T {
//   return util.createTransparentProxy<T>(getter);
// }
// @__NO_SIDE_EFFECTS__
function _lazy<T extends SomeType>(getter: () => T): SchemaMiniLazy<T> {
  return new SchemaMiniLazy({
    type: "lazy",
    getter: getter as any,
  }) as any;
}
export { _lazy as lazy };

// SchemaMiniPromise
export interface SchemaMiniPromise<T extends SomeType = core.$SchemaType> extends _SchemaMiniType<core.$SchemaPromiseInternals<T>> {
  // _schema: core.$SchemaPromiseInternals<T>;
}
export const SchemaMiniPromise: core.$constructor<SchemaMiniPromise> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniPromise",
  (inst, def) => {
    core.$SchemaPromise.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// @__NO_SIDE_EFFECTS__
export function promise<T extends SomeType>(innerType: T): SchemaMiniPromise<T> {
  return new SchemaMiniPromise({
    type: "promise",
    innerType: innerType as any as core.$SchemaType,
  }) as any;
}

// SchemaMiniCustom
export interface SchemaMiniCustom<O = unknown, I = unknown> extends _SchemaMiniType<core.$SchemaCustomInternals<O, I>> {
  // _schema: core.$SchemaCustomInternals<O, I>;
}
export const SchemaMiniCustom: core.$constructor<SchemaMiniCustom> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniCustom",
  (inst, def) => {
    core.$SchemaCustom.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

// custom checks
// @__NO_SIDE_EFFECTS__
export function check<O = unknown>(fn: core.CheckFn<O>, params?: string | core.$SchemaCustomParams): core.$SchemaCheck<O> {
  const ch = new core.$SchemaCheck({
    check: "custom",
    ...util.normalizeParams(params),
  });

  ch._schema.check = fn;
  return ch;
}

// SchemaCustom custom schema
// @__NO_SIDE_EFFECTS__
export function custom<O = unknown, I = O>(
  fn?: (data: O) => unknown,
  _params?: string | core.$SchemaCustomParams | undefined
): SchemaMiniCustom<O, I> {
  return core._custom(SchemaMiniCustom, fn ?? (() => true), _params) as any;
}

// refine
// @__NO_SIDE_EFFECTS__
export function refine<T>(
  fn: (arg: NoInfer<T>) => util.MaybeAsync<unknown>,
  _params: string | core.$SchemaCustomParams = {}
): core.$SchemaCheck<T> {
  return core._refine(SchemaMiniCustom, fn, _params);
}

// superRefine
// @__NO_SIDE_EFFECTS__
export function superRefine<T>(
  fn: (arg: T, payload: core.$RefinementCtx<T>) => void | Promise<void>,
  params?: core.$SchemaSuperRefineParams
): core.$SchemaCheck<T> {
  return core._superRefine(fn, params);
}

// Re-export describe and meta from core
export const describe = core.describe;
export const meta = core.meta;

// instanceof
abstract class Class {
  constructor(..._args: any[]) {}
}
// @__NO_SIDE_EFFECTS__
function _instanceof<T extends typeof Class>(
  cls: T,
  params: core.$SchemaCustomParams = {}
): SchemaMiniCustom<InstanceType<T>, InstanceType<T>> {
  const inst = custom((data) => data instanceof cls, params);
  inst._schema.bag.Class = cls;
  // Override check to emit invalid_type instead of custom
  inst._schema.check = (payload) => {
    if (!(payload.value instanceof cls)) {
      payload.issues.push({
        code: "invalid_type",
        expected: cls.name,
        input: payload.value,
        inst,
        path: [...(inst._schema.def.path ?? [])],
      });
    }
  };
  return inst as any;
}
export { _instanceof as instanceof };

// stringbool
export const stringbool: (_params?: string | core.$SchemaStringBoolParams) => SchemaMiniCodec<SchemaMiniString, SchemaMiniBoolean> =
  (...args) =>
    core._stringbool(
      {
        Codec: SchemaMiniCodec,
        Boolean: SchemaMiniBoolean,
        String: SchemaMiniString,
      },
      ...args
    ) as any;

// json

// json
export type _SchemaMiniJSONSchema = SchemaMiniUnion<
  [
    SchemaMiniString,
    SchemaMiniNumber,
    SchemaMiniBoolean,
    SchemaMiniNull,
    SchemaMiniArray<SchemaMiniJSONSchema>,
    SchemaMiniRecord<SchemaMiniString<string>, SchemaMiniJSONSchema>,
  ]
>;
export type _SchemaMiniJSONSchemaInternals = _SchemaMiniJSONSchema["_schema"];

export interface SchemaMiniJSONSchemaInternals extends _SchemaMiniJSONSchemaInternals {
  output: util.JSONType;
  input: util.JSONType;
}
export interface SchemaMiniJSONSchema extends _SchemaMiniJSONSchema {
  _schema: SchemaMiniJSONSchemaInternals;
}

// @__NO_SIDE_EFFECTS__
export function json(): SchemaMiniJSONSchema {
  const jsonSchema: any = _lazy(() => {
    return union([string(), number(), boolean(), _null(), array(jsonSchema), record(string(), jsonSchema)]);
  });
  return jsonSchema;
}

// SchemaMiniFunction
export interface SchemaMiniFunction<
  Args extends core.$SchemaFunctionIn = core.$SchemaFunctionIn,
  Returns extends core.$SchemaFunctionOut = core.$SchemaFunctionOut,
> extends _SchemaMiniType<core.$SchemaFunctionInternals<Args, Returns>>,
    core.$SchemaFunction<Args, Returns> {
  _def: core.$SchemaFunctionDef<Args, Returns>;
  _input: core.$InferInnerFunctionType<Args, Returns>;
  _output: core.$InferOuterFunctionType<Args, Returns>;

  input<const Items extends util.TupleItems, const Rest extends core.$SchemaFunctionOut = core.$SchemaFunctionOut>(
    args: Items,
    rest?: Rest
  ): SchemaMiniFunction<SchemaMiniTuple<Items, Rest>, Returns>;
  input<NewArgs extends core.$SchemaFunctionIn>(args: NewArgs): SchemaMiniFunction<NewArgs, Returns>;
  input(...args: any[]): SchemaMiniFunction<any, Returns>;

  output<NewReturns extends core.$SchemaFunctionOut>(output: NewReturns): SchemaMiniFunction<Args, NewReturns>;
}

export const SchemaMiniFunction: core.$constructor<SchemaMiniFunction> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniFunction",
  (inst, def) => {
    core.$SchemaFunction.init(inst, def);
    SchemaMiniType.init(inst, def);
  }
);

export function _function(): SchemaMiniFunction;
export function _function<const In extends Array<SomeType> = Array<SomeType>>(params: {
  input: In;
}): SchemaMiniFunction<SchemaMiniTuple<In, null>, core.$SchemaFunctionOut>;
export function _function<
  const In extends Array<SomeType> = Array<SomeType>,
  const Out extends core.$SchemaFunctionOut = core.$SchemaFunctionOut,
>(params: {
  input: In;
  output: Out;
}): SchemaMiniFunction<SchemaMiniTuple<In, null>, Out>;
export function _function<const In extends core.$SchemaFunctionIn = core.$SchemaFunctionIn>(params: {
  input: In;
}): SchemaMiniFunction<In, core.$SchemaFunctionOut>;
export function _function<const Out extends core.$SchemaFunctionOut = core.$SchemaFunctionOut>(params: {
  output: Out;
}): SchemaMiniFunction<core.$SchemaFunctionIn, Out>;
export function _function<
  In extends core.$SchemaFunctionIn = core.$SchemaFunctionIn,
  Out extends core.$SchemaFunctionOut = core.$SchemaFunctionOut,
>(params?: { input: In; output: Out }): SchemaMiniFunction<In, Out>;
// @__NO_SIDE_EFFECTS__
export function _function(params?: {
  output?: core.$SchemaFunctionOut;
  input?: core.$SchemaFunctionArgs | Array<SomeType>;
}): SchemaMiniFunction {
  return new SchemaMiniFunction({
    type: "function",
    input: Array.isArray(params?.input) ? tuple(params?.input as any) : (params?.input ?? array(unknown())),
    output: params?.output ?? unknown(),
  });
}

export { _function as function };
