import type { $SchemaBigIntFormats } from "../core/checks.js";
import * as core from "../core/index.js";
import { util, type $SchemaNumberFormats } from "../core/index.js";
import * as processors from "../core/json-schema-processors.js";
import * as regexes from "../core/regexes.js";
import type { StandardSchemaWithJSONProps } from "../core/standard-Schema.js";
import { createStandardJSONSchemaMethod, createToJSONSchemaMethod } from "../core/to-json-Schema.js";
import en from "../locales/en.js";

import * as checks from "./checks.js";
import * as parse from "./parse.js";

// Register English as the default locale on first SchemaType construction. Hooked into the `SchemaType` `$constructor` (rather than a top-level `config(en())` in `external.ts`) so bundlers honoring `sideEffects: false` can't tree-shake it out — see #5953, #5725. An explicit `Schema.config(Schema.locales.xx())` call wins regardless of order, since this only sets the default when none is present.
function _ensureDefaultLocale(): void {
  if (!core.globalConfig.localeError) core.config(en());
}

// the default memoizer is read by the core container init, which runs before `SchemaType.init`, so each container calls this first
function _ensureDefaultMemoizer(): void {
  if (!core.globalConfig.memoizer) core.config({ memoizer: core.memoizer() });
}

// Methods live on each concrete constructor's prototype and materialize per instance on first access, so a schema only pays for what it is asked for.

///////////////////////////////////////////
///////////////////////////////////////////
////////////                   ////////////
////////////      SchemaType      ////////////
////////////                   ////////////
///////////////////////////////////////////
///////////////////////////////////////////

export type SchemaStandardSchemaWithJSON<T> = StandardSchemaWithJSONProps<core.input<T>, core.output<T>>;
export interface SchemaType<
  out Output = unknown,
  out Input = unknown,
  out Internals extends core.$SchemaTypeInternals<Output, Input> = core.$SchemaTypeInternals<Output, Input>,
> extends core.$SchemaType<Output, Input, Internals> {
  def: Internals["def"];
  type: Internals["def"]["type"];

  /** @deprecated Use `.def` instead. */
  _def: Internals["def"];
  /** @deprecated Use `Schema.output<typeof schema>` instead. */
  _output: Internals["output"];
  /** @deprecated Use `Schema.input<typeof schema>` instead. */
  _input: Internals["input"];

  "~standard": SchemaStandardSchemaWithJSON<this>;
  /** Converts this schema to a JSON Schema representation. */
  toJSONSchema(params?: core.ToJSONSchemaParams): core.SchemaStandardJSONSchemaPayload<this>;

  // base methods
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

  // parsing
  parse(data: unknown, params?: core.ParseContext<core.$SchemaIssue>): core.output<this>;
  safeParse(data: unknown, params?: core.ParseContext<core.$SchemaIssue>): parse.SchemaSafeParseResult<core.output<this>>;
  parseAsync(data: unknown, params?: core.ParseContext<core.$SchemaIssue>): Promise<core.output<this>>;
  safeParseAsync(
    data: unknown,
    params?: core.ParseContext<core.$SchemaIssue>
  ): Promise<parse.SchemaSafeParseResult<core.output<this>>>;
  spa: (
    data: unknown,
    params?: core.ParseContext<core.$SchemaIssue>
  ) => Promise<parse.SchemaSafeParseResult<core.output<this>>>;
  validate(data: unknown, params?: core.ParseContext<core.$SchemaIssue>): data is core.input<this>;
  validateAsync(data: unknown, params?: core.ParseContext<core.$SchemaIssue>): Promise<boolean>;

  // encoding/decoding
  encode(data: core.output<this>, params?: core.ParseContext<core.$SchemaIssue>): core.input<this>;
  decode(data: core.input<this>, params?: core.ParseContext<core.$SchemaIssue>): core.output<this>;
  encodeAsync(data: core.output<this>, params?: core.ParseContext<core.$SchemaIssue>): Promise<core.input<this>>;
  decodeAsync(data: core.input<this>, params?: core.ParseContext<core.$SchemaIssue>): Promise<core.output<this>>;
  safeEncode(
    data: core.output<this>,
    params?: core.ParseContext<core.$SchemaIssue>
  ): parse.SchemaSafeParseResult<core.input<this>>;
  safeDecode(
    data: core.input<this>,
    params?: core.ParseContext<core.$SchemaIssue>
  ): parse.SchemaSafeParseResult<core.output<this>>;
  safeEncodeAsync(
    data: core.output<this>,
    params?: core.ParseContext<core.$SchemaIssue>
  ): Promise<parse.SchemaSafeParseResult<core.input<this>>>;
  safeDecodeAsync(
    data: core.input<this>,
    params?: core.ParseContext<core.$SchemaIssue>
  ): Promise<parse.SchemaSafeParseResult<core.output<this>>>;

  // refinements
  refine<Ch extends (arg: core.output<this>) => unknown | Promise<unknown>>(
    check: Ch,
    params?: string | core.$SchemaCustomParams
  ): Ch extends (arg: any) => arg is infer R ? this & SchemaType<R, core.input<this>> : this;
  superRefine(
    refinement: (arg: core.output<this>, ctx: core.$RefinementCtx<core.output<this>>) => void | Promise<void>,
    params?: core.$SchemaSuperRefineParams
  ): this;
  overwrite(fn: (x: core.output<this>) => core.output<this>): this;

  // wrappers
  optional(): SchemaOptional<this>;
  exactOptional(): SchemaExactOptional<this>;
  nonoptional(params?: string | core.$SchemaNonOptionalParams): SchemaNonOptional<this>;
  nullable(): SchemaNullable<this>;
  nullish(): SchemaOptional<SchemaNullable<this>>;
  default(def: util.NoUndefined<core.output<this>>): SchemaDefault<this>;
  default(def: () => util.NoUndefined<core.output<this>>): SchemaDefault<this>;
  prefault(def: () => core.input<this>): SchemaPrefault<this>;
  prefault(def: core.input<this>): SchemaPrefault<this>;
  array(): SchemaArray<this>;
  or<T extends core.SomeType>(option: T): SchemaUnion<[this, T]>;
  and<T extends core.SomeType>(incoming: T): SchemaIntersection<this, T>;
  transform<NewOut>(
    transform: (arg: core.output<this>, ctx: core.$RefinementCtx<core.output<this>>) => NewOut | Promise<NewOut>
  ): SchemaPipe<this, SchemaTransform<Awaited<NewOut>, core.output<this>>>;
  catch(def: core.output<this>): SchemaCatch<this>;
  catch(def: (ctx: core.$SchemaCatchCtx) => core.output<this>): SchemaCatch<this>;
  pipe<T extends core.$SchemaType<any, core.output<this>>>(
    target: T | core.$SchemaType<any, core.output<this>>
  ): SchemaPipe<this, T>;
  readonly(): SchemaReadonly<this>;

  /** Returns a new instance that has been registered in `Schema.globalRegistry` with the specified description */
  describe(description: string): this;
  description?: string;
  /** Returns the metadata associated with this instance in `Schema.globalRegistry` */
  meta(): core.$replace<core.GlobalMeta, this> | undefined;
  /** Returns a new instance that has been registered in `Schema.globalRegistry` with the specified metadata */
  meta(data: core.$replace<core.GlobalMeta, this>): this;

  // helpers
  /** @deprecated Try safe-parsing `undefined` (this is what `isOptional` does internally):
   *
   * ```ts
   * const schema = Schema.string().optional();
   * const isOptional = Schema.safeParse(undefined).success; // true
   * ```
   */
  isOptional(): boolean;
  /**
   * @deprecated Try safe-parsing `null` (this is what `isNullable` does internally):
   *
   * ```ts
   * const schema = Schema.string().nullable();
   * const isNullable = Schema.safeParse(null).success; // true
   * ```
   */
  isNullable(): boolean;
  apply<T, TArgs extends unknown[] = []>(fn: (schema: this, ...args: TArgs) => T, ...args: TArgs): T;
}

export interface _SchemaType<out Internals extends core.$SchemaTypeInternals = core.$SchemaTypeInternals>
  extends SchemaType<any, any, Internals> {}

export const SchemaType: core.$constructor<SchemaType> = /*@__PURE__*/ core.$constructor<SchemaType>(
  "SchemaType",
  (inst, def) => {
    _ensureDefaultLocale();
    core.$SchemaType.init(inst, def);

    inst.def = def;
    inst.type = def.type;

    return inst;
  },
  {
    check(...chks) {
      const def = this.def;
      return this.clone(
        util.mergeDefs(def, {
          checks: [
            ...(def.checks ?? []),
            ...chks.map((ch) =>
              typeof ch === "function" ? { _schema: { check: ch, def: { check: "custom" }, onattach: [] } } : ch
            ),
          ],
        }),
        { parent: true }
      );
    },
    with(...chks) {
      return this.check(...chks);
    },
    clone(def, params) {
      return core.clone(this, def, params);
    },
    brand() {
      return this;
    },
    register(reg, meta) {
      reg.add(this, meta);
      return this;
    },
    refine(check, params) {
      return this.check(refine(check, params));
    },
    superRefine(refinement, params) {
      return this.check(superRefine(refinement, params));
    },
    overwrite(fn) {
      return this.check(checks.overwrite(fn));
    },
    optional() {
      return optional(this);
    },
    exactOptional() {
      return exactOptional(this);
    },
    nullable() {
      return nullable(this);
    },
    nullish() {
      return optional(nullable(this));
    },
    nonoptional(params) {
      return nonoptional(this, params);
    },
    array() {
      return array(this);
    },
    or(arg) {
      return union([this, arg]);
    },
    and(arg) {
      return intersection(this, arg);
    },
    transform(tx) {
      return pipe(this, transform(tx));
    },
    default(d) {
      return _default(this, d);
    },
    prefault(d) {
      return prefault(this, d);
    },
    catch(params) {
      return _catch(this, params);
    },
    pipe(target) {
      return pipe(this, target);
    },
    readonly() {
      return readonly(this);
    },
    describe(description) {
      const cl = this.clone();
      core.globalRegistry.add(cl, { description });
      return cl;
    },
    meta(...args: any[]): any {
      // overloaded: meta() returns the registered metadata, meta(data) returns a clone with `data` registered. The mapped type picks up the second overload, so we accept variadic any-args and return `any` to satisfy both at runtime.
      if (args.length === 0) return core.globalRegistry.get(this);
      const cl = this.clone();
      core.globalRegistry.add(cl, args[0]);
      return cl;
    },
    isOptional() {
      return this.safeParse(undefined).success;
    },
    isNullable() {
      return this.safeParse(null).success;
    },
    apply(fn, ...args) {
      return args.length === 0 ? fn(this) : fn(this, ...args);
    },
    // Overrides core's `~standard` to add `jsonSchema`. Must stay a prototype entry: redefining it per instance demotes instances to dictionary mode.
    get "~standard"(): SchemaType["~standard"] {
      return util.hide(this, "~standard", {
        ...core.standardProps(this),
        jsonSchema: {
          input: createStandardJSONSchemaMethod(this, "input"),
          output: createStandardJSONSchemaMethod(this, "output"),
        },
      } as SchemaType["~standard"]);
    },
    set "~standard"(value: SchemaType["~standard"]) {
      util.own(this, "~standard", value);
    },
    parse: function _parse(data, params) {
      return parse.parse(this, data, params, { callee: _parse });
    },
    parseAsync: async function _parseAsync(data, params) {
      return await parse.parseAsync(this, data, params, { callee: _parseAsync });
    },
    safeParse(data, params) {
      return parse.safeParse(this, data, params);
    },
    async safeParseAsync(data, params) {
      return parse.safeParseAsync(this, data, params);
    },
    // `spa` is an alias: same function object as `safeParseAsync`, as before.
    get spa(): SchemaType["safeParseAsync"] {
      return this?.safeParseAsync;
    },
    set spa(value: SchemaType["safeParseAsync"]) {
      util.own(this, "spa", value);
    },
    validate(data, params) {
      return parse.validate(this, data, params);
    },
    validateAsync(data, params) {
      return parse.validateAsync(this, data, params);
    },
    encode: function _encode(data, params) {
      return parse.encode(this, data, params, { callee: _encode });
    },
    decode: function _decode(data, params) {
      return parse.decode(this, data, params, { callee: _decode });
    },
    encodeAsync: async function _encodeAsync(data, params) {
      return await parse.encodeAsync(this, data, params, { callee: _encodeAsync });
    },
    decodeAsync: async function _decodeAsync(data, params) {
      return await parse.decodeAsync(this, data, params, { callee: _decodeAsync });
    },
    safeEncode(data, params) {
      return parse.safeEncode(this, data, params);
    },
    safeDecode(data, params) {
      return parse.safeDecode(this, data, params);
    },
    async safeEncodeAsync(data, params) {
      return parse.safeEncodeAsync(this, data, params);
    },
    async safeDecodeAsync(data, params) {
      return parse.safeDecodeAsync(this, data, params);
    },
    toJSONSchema(params) {
      return createToJSONSchemaMethod(this, {})(params);
    },
    // Reads through to the registry on every access, so it must not cache.
    get description(): string | undefined {
      return core.globalRegistry.get(this as unknown as SchemaType)?.description;
    },
    // No setter: `Schema._def = x` throws, as it did when `_def` was a non-writable own property.
    get _def(): core.$SchemaTypeDef {
      return (this as unknown as SchemaType)._schema.def;
    },
  }
);

// SchemaString
export interface _SchemaString<T extends core.$SchemaStringInternals<unknown> = core.$SchemaStringInternals<unknown>>
  extends _SchemaType<T> {
  format: string | null;
  minLength: number | null;
  maxLength: number | null;

  // miscellaneous checks
  regex(regex: RegExp, params?: string | core.$SchemaCheckRegexParams): this;
  includes(value: string, params?: string | core.$SchemaCheckIncludesParams): this;
  startsWith(value: string, params?: string | core.$SchemaCheckStartsWithParams): this;
  endsWith(value: string, params?: string | core.$SchemaCheckEndsWithParams): this;
  min(minLength: number, params?: string | core.$SchemaCheckMinLengthParams): this;
  max(maxLength: number, params?: string | core.$SchemaCheckMaxLengthParams): this;
  length(len: number, params?: string | core.$SchemaCheckLengthEqualsParams): this;
  nonempty(params?: string | core.$SchemaCheckMinLengthParams): this;
  lowercase(params?: string | core.$SchemaCheckLowerCaseParams): this;
  uppercase(params?: string | core.$SchemaCheckUpperCaseParams): this;

  // transforms
  trim(): this;
  normalize(form?: "NFC" | "NFD" | "NFKC" | "NFKD" | (string & {})): this;
  toLowerCase(): this;
  toUpperCase(): this;
  slugify(): this;
}

/** @internal */
export const _SchemaString: core.$constructor<_SchemaString> = /*@__PURE__*/ core.$constructor<_SchemaString>(
  "_SchemaString",
  (inst, def) => {
    core.$SchemaString.init(inst, def);
    SchemaType.init(inst, def);

    inst._schema.processJSONSchema = (ctx, json, params) => processors.stringProcessor(inst, ctx, json, params);
  },
  /*@__PURE__*/ util.derived<_SchemaString>(
    {
      format: (inst) => processors.aggregateChecks(inst).format ?? null,
      minLength: (inst) => processors.aggregateChecks<number>(inst).minimum ?? null,
      maxLength: (inst) => processors.aggregateChecks<number>(inst).maximum ?? null,
    },
    {
      regex(...args) {
        return this.check((checks.regex as any)(...args));
      },
      includes(...args) {
        return this.check((checks.includes as any)(...args));
      },
      startsWith(...args) {
        return this.check((checks.startsWith as any)(...args));
      },
      endsWith(...args) {
        return this.check((checks.endsWith as any)(...args));
      },
      min(...args) {
        return this.check((checks.minLength as any)(...args));
      },
      max(...args) {
        return this.check((checks.maxLength as any)(...args));
      },
      length(...args) {
        return this.check((checks.length as any)(...args));
      },
      nonempty(...args) {
        return this.check((checks.minLength as any)(1, ...args));
      },
      lowercase(params) {
        return this.check(checks.lowercase(params));
      },
      uppercase(params) {
        return this.check(checks.uppercase(params));
      },
      trim() {
        return this.check(checks.trim());
      },
      normalize(...args) {
        return this.check(checks.normalize(...args));
      },
      toLowerCase() {
        return this.check(checks.toLowerCase());
      },
      toUpperCase() {
        return this.check(checks.toUpperCase());
      },
      slugify() {
        return this.check(checks.slugify());
      },
    }
  )
);

export interface SchemaString extends _SchemaString<core.$SchemaStringInternals<string>> {
  // string format checks

  /** @deprecated Use `Schema.email()` instead. */
  email(params?: string | core.$SchemaCheckEmailParams): this;
  /** @deprecated Use `Schema.url()` instead. */
  url(params?: string | core.$SchemaCheckURLParams): this;
  /** @deprecated Use `Schema.jwt()` instead. */
  jwt(params?: string | core.$SchemaCheckJWTParams): this;
  /** @deprecated Use `Schema.emoji()` instead. */
  emoji(params?: string | core.$SchemaCheckEmojiParams): this;
  /** @deprecated Use `Schema.guid()` instead. */
  guid(params?: string | core.$SchemaCheckGUIDParams): this;
  /** @deprecated Use `Schema.uuid()` instead. */
  uuid(params?: string | core.$SchemaCheckUUIDParams): this;
  /** @deprecated Use `Schema.uuid()` instead. */
  uuidv4(params?: string | core.$SchemaCheckUUIDParams): this;
  /** @deprecated Use `Schema.uuid()` instead. */
  uuidv6(params?: string | core.$SchemaCheckUUIDParams): this;
  /** @deprecated Use `Schema.uuid()` instead. */
  uuidv7(params?: string | core.$SchemaCheckUUIDParams): this;
  /** @deprecated Use `Schema.nanoid()` instead. */
  nanoid(params?: string | core.$SchemaCheckNanoIDParams): this;
  /** @deprecated Use `Schema.guid()` instead. */
  guid(params?: string | core.$SchemaCheckGUIDParams): this;
  /**
   * @deprecated CUID v1 is deprecated by its authors due to information leakage
   * (timestamps embedded in the id). Use `Schema.cuid2()` instead.
   * See https://github.com/paralleldrive/cuid.
   */
  cuid(params?: string | core.$SchemaCheckCUIDParams): this;
  /** @deprecated Use `Schema.cuid2()` instead. */
  cuid2(params?: string | core.$SchemaCheckCUID2Params): this;
  /** @deprecated Use `Schema.ulid()` instead. */
  ulid(params?: string | core.$SchemaCheckULIDParams): this;
  /** @deprecated Use `Schema.base64()` instead. */
  base64(params?: string | core.$SchemaCheckBase64Params): this;
  /** @deprecated Use `Schema.base64url()` instead. */
  base64url(params?: string | core.$SchemaCheckBase64URLParams): this;
  // /** @deprecated Use `Schema.jsonString()` instead. */
  // jsonString(params?: string | core.$SchemaCheckJSONStringParams): this;
  /** @deprecated Use `Schema.xid()` instead. */
  xid(params?: string | core.$SchemaCheckXIDParams): this;
  /** @deprecated Use `Schema.ksuid()` instead. */
  ksuid(params?: string | core.$SchemaCheckKSUIDParams): this;
  // /** @deprecated Use `Schema.ipv4()` or `Schema.ipv6()` instead. */
  // ip(params?: string | (core.$SchemaCheckIPv4Params & { version?: "v4" | "v6" })): SchemaUnion<[this, this]>;
  /** @deprecated Use `Schema.ipv4()` instead. */
  ipv4(params?: string | core.$SchemaCheckIPv4Params): this;
  /** @deprecated Use `Schema.ipv6()` instead. */
  ipv6(params?: string | core.$SchemaCheckIPv6Params): this;
  /** @deprecated Use `Schema.cidrv4()` instead. */
  cidrv4(params?: string | core.$SchemaCheckCIDRv4Params): this;
  /** @deprecated Use `Schema.cidrv6()` instead. */
  cidrv6(params?: string | core.$SchemaCheckCIDRv6Params): this;
  /** @deprecated Use `Schema.e164()` instead. */
  e164(params?: string | core.$SchemaCheckE164Params): this;

  // ISO 8601 checks
  /** @deprecated Use `Schema.iso.datetime()` instead. */
  datetime(params?: string | core.$SchemaCheckISODateTimeParams): this;
  /** @deprecated Use `Schema.iso.date()` instead. */
  date(params?: string | core.$SchemaCheckISODateParams): this;
  /** @deprecated Use `Schema.iso.time()` instead. */
  time(
    params?:
      | string
      // | {
      //     message?: string | undefined;
      //     precision?: number | null;
      //   }
      | core.$SchemaCheckISOTimeParams
  ): this;
  /** @deprecated Use `Schema.iso.duration()` instead. */
  duration(params?: string | core.$SchemaCheckISODurationParams): this;
}

export const SchemaString: core.$constructor<SchemaString> = /*@__PURE__*/ core.$constructor<SchemaString>(
  "SchemaString",
  (inst, def) => {
    core.$SchemaString.init(inst, def);
    _SchemaString.init(inst, def);
  },
  {
    email(params) {
      return this.check(core._email(SchemaEmail, params));
    },
    url(params) {
      return this.check(core._url(SchemaURL, params));
    },
    jwt(params) {
      return this.check(core._jwt(SchemaJWT, params));
    },
    emoji(params) {
      return this.check(core._emoji(SchemaEmoji, params));
    },
    guid(params) {
      return this.check(core._guid(SchemaGUID, params));
    },
    uuid(params) {
      return this.check(core._uuid(SchemaUUID, params));
    },
    uuidv4(params) {
      return this.check(core._uuidv4(SchemaUUID, params));
    },
    uuidv6(params) {
      return this.check(core._uuidv6(SchemaUUID, params));
    },
    uuidv7(params) {
      return this.check(core._uuidv7(SchemaUUID, params));
    },
    nanoid(params) {
      return this.check(core._nanoid(SchemaNanoID, params));
    },
    cuid(params) {
      return this.check(core._cuid(SchemaCUID, params));
    },
    cuid2(params) {
      return this.check(core._cuid2(SchemaCUID2, params));
    },
    ulid(params) {
      return this.check(core._ulid(SchemaULID, params));
    },
    base64(params) {
      return this.check(core._base64(SchemaBase64, params));
    },
    base64url(params) {
      return this.check(core._base64url(SchemaBase64URL, params));
    },
    xid(params) {
      return this.check(core._xid(SchemaXID, params));
    },
    ksuid(params) {
      return this.check(core._ksuid(SchemaKSUID, params));
    },
    ipv4(params) {
      return this.check(core._ipv4(SchemaIPv4, params));
    },
    ipv6(params) {
      return this.check(core._ipv6(SchemaIPv6, params));
    },
    cidrv4(params) {
      return this.check(core._cidrv4(SchemaCIDRv4, params));
    },
    cidrv6(params) {
      return this.check(core._cidrv6(SchemaCIDRv6, params));
    },
    e164(params) {
      return this.check(core._e164(SchemaE164, params));
    },
    datetime(params) {
      return this.check(core._isoDateTime(SchemaISODateTime, params as any));
    },
    date(params) {
      return this.check(core._isoDate(SchemaISODate, params as any));
    },
    time(params) {
      return this.check(core._isoTime(SchemaISOTime, params as any));
    },
    duration(params) {
      return this.check(core._isoDuration(SchemaISODuration, params as any));
    },
  }
);

export function string(params?: string | core.$SchemaStringParams): SchemaString;
export function string<T extends string>(params?: string | core.$SchemaStringParams): core.$SchemaType<T, T>;
export function string(params?: string | core.$SchemaStringParams): SchemaString {
  return core._string(SchemaString, params);
}

// SchemaStringFormat
export interface SchemaStringFormat<Format extends string = string>
  extends _SchemaString<core.$SchemaStringFormatInternals<Format>> {}
export const SchemaStringFormat: core.$constructor<SchemaStringFormat> = /*@__PURE__*/ core.$constructor(
  "SchemaStringFormat",
  (inst, def) => {
    core.$SchemaStringFormat.init(inst, def);
    _SchemaString.init(inst, def);
  }
);

//////////////////////////////////////////////
//////////////////////////////////////////////
//////////                          //////////
//////////      SchemaISODateTime      //////////
//////////                          //////////
//////////////////////////////////////////////
//////////////////////////////////////////////
export interface SchemaISODateTime extends SchemaStringFormat {
  _schema: core.$SchemaISODateTimeInternals;
}
export const SchemaISODateTime: core.$constructor<SchemaISODateTime> = /*@__PURE__*/ core.$constructor(
  "SchemaISODateTime",
  (inst, def) => {
    core.$SchemaISODateTime.init(inst, def);
    SchemaStringFormat.init(inst, def);
  }
);

//////////////////////////////////////////
//////////////////////////////////////////
//////////                      //////////
//////////      SchemaISODate      //////////
//////////                      //////////
//////////////////////////////////////////
//////////////////////////////////////////
export interface SchemaISODate extends SchemaStringFormat {
  _schema: core.$SchemaISODateInternals;
}
export const SchemaISODate: core.$constructor<SchemaISODate> = /*@__PURE__*/ core.$constructor("SchemaISODate", (inst, def) => {
  core.$SchemaISODate.init(inst, def);
  SchemaStringFormat.init(inst, def);
});

//////////////////////////////////////////
//////////////////////////////////////////
//////////                      //////////
//////////      SchemaISOTime      //////////
//////////                      //////////
//////////////////////////////////////////
//////////////////////////////////////////
export interface SchemaISOTime extends SchemaStringFormat {
  _schema: core.$SchemaISOTimeInternals;
}
export const SchemaISOTime: core.$constructor<SchemaISOTime> = /*@__PURE__*/ core.$constructor("SchemaISOTime", (inst, def) => {
  core.$SchemaISOTime.init(inst, def);
  SchemaStringFormat.init(inst, def);
});

//////////////////////////////////////////////
//////////////////////////////////////////////
//////////                          //////////
//////////      SchemaISODuration      //////////
//////////                          //////////
//////////////////////////////////////////////
//////////////////////////////////////////////
export interface SchemaISODuration extends SchemaStringFormat {
  _schema: core.$SchemaISODurationInternals;
}
export const SchemaISODuration: core.$constructor<SchemaISODuration> = /*@__PURE__*/ core.$constructor(
  "SchemaISODuration",
  (inst, def) => {
    core.$SchemaISODuration.init(inst, def);
    SchemaStringFormat.init(inst, def);
  }
);

// SchemaEmail
export interface SchemaEmail extends SchemaStringFormat<"email"> {
  _schema: core.$SchemaEmailInternals;
}
export const SchemaEmail: core.$constructor<SchemaEmail> = /*@__PURE__*/ core.$constructor("SchemaEmail", (inst, def) => {
  // SchemaStringFormat.init(inst, def);
  core.$SchemaEmail.init(inst, def);
  SchemaStringFormat.init(inst, def);
});

export function email(params?: string | core.$SchemaEmailParams): SchemaEmail {
  return core._email(SchemaEmail, params);
}

// SchemaGUID
export interface SchemaGUID extends SchemaStringFormat<"guid"> {
  _schema: core.$SchemaGUIDInternals;
}
export const SchemaGUID: core.$constructor<SchemaGUID> = /*@__PURE__*/ core.$constructor("SchemaGUID", (inst, def) => {
  // SchemaStringFormat.init(inst, def);
  core.$SchemaGUID.init(inst, def);
  SchemaStringFormat.init(inst, def);
});

export function guid(params?: string | core.$SchemaGUIDParams): SchemaGUID {
  return core._guid(SchemaGUID, params);
}

// SchemaUUID
export interface SchemaUUID extends SchemaStringFormat<"uuid"> {
  _schema: core.$SchemaUUIDInternals;
}
export const SchemaUUID: core.$constructor<SchemaUUID> = /*@__PURE__*/ core.$constructor("SchemaUUID", (inst, def) => {
  // SchemaStringFormat.init(inst, def);
  core.$SchemaUUID.init(inst, def);
  SchemaStringFormat.init(inst, def);
});

export function uuid(params?: string | core.$SchemaUUIDParams): SchemaUUID {
  return core._uuid(SchemaUUID, params);
}

export function uuidv4(params?: string | core.$SchemaUUIDv4Params): SchemaUUID {
  return core._uuidv4(SchemaUUID, params);
}

// SchemaUUIDv6

export function uuidv6(params?: string | core.$SchemaUUIDv6Params): SchemaUUID {
  return core._uuidv6(SchemaUUID, params);
}

// SchemaUUIDv7

export function uuidv7(params?: string | core.$SchemaUUIDv7Params): SchemaUUID {
  return core._uuidv7(SchemaUUID, params);
}

// SchemaURL
export interface SchemaURL extends SchemaStringFormat<"url"> {
  _schema: core.$SchemaURLInternals;
}
export const SchemaURL: core.$constructor<SchemaURL> = /*@__PURE__*/ core.$constructor("SchemaURL", (inst, def) => {
  // SchemaStringFormat.init(inst, def);
  core.$SchemaURL.init(inst, def);
  SchemaStringFormat.init(inst, def);
});

export function url(params?: string | core.$SchemaURLParams): SchemaURL {
  return core._url(SchemaURL, params);
}

export function httpUrl(params?: string | Omit<core.$SchemaURLParams, "protocol" | "hostname">): SchemaURL {
  return core._url(SchemaURL, {
    protocol: regexes.httpProtocol,
    hostname: regexes.domain,
    ...util.normalizeParams(params),
  });
}

// SchemaEmoji
export interface SchemaEmoji extends SchemaStringFormat<"emoji"> {
  _schema: core.$SchemaEmojiInternals;
}
export const SchemaEmoji: core.$constructor<SchemaEmoji> = /*@__PURE__*/ core.$constructor("SchemaEmoji", (inst, def) => {
  // SchemaStringFormat.init(inst, def);
  core.$SchemaEmoji.init(inst, def);
  SchemaStringFormat.init(inst, def);
});

export function emoji(params?: string | core.$SchemaEmojiParams): SchemaEmoji {
  return core._emoji(SchemaEmoji, params);
}

// SchemaNanoID
export interface SchemaNanoID extends SchemaStringFormat<"nanoid"> {
  _schema: core.$SchemaNanoIDInternals;
}
export const SchemaNanoID: core.$constructor<SchemaNanoID> = /*@__PURE__*/ core.$constructor("SchemaNanoID", (inst, def) => {
  // SchemaStringFormat.init(inst, def);
  core.$SchemaNanoID.init(inst, def);
  SchemaStringFormat.init(inst, def);
});

export function nanoid(params?: string | core.$SchemaNanoIDParams): SchemaNanoID {
  return core._nanoid(SchemaNanoID, params);
}

// SchemaCUID
/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link SchemaCUID2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
export interface SchemaCUID extends SchemaStringFormat<"cuid"> {
  _schema: core.$SchemaCUIDInternals;
}
/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link SchemaCUID2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
export const SchemaCUID: core.$constructor<SchemaCUID> = /*@__PURE__*/ core.$constructor("SchemaCUID", (inst, def) => {
  // SchemaStringFormat.init(inst, def);
  core.$SchemaCUID.init(inst, def);
  SchemaStringFormat.init(inst, def);
});

/**
 * Validates a CUID v1 string.
 *
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link cuid2 | `Schema.cuid2()`} instead.
 * See https://github.com/paralleldrive/cuid.
 */
export function cuid(params?: string | core.$SchemaCUIDParams): SchemaCUID {
  return core._cuid(SchemaCUID, params);
}

// SchemaCUID2
export interface SchemaCUID2 extends SchemaStringFormat<"cuid2"> {
  _schema: core.$SchemaCUID2Internals;
}
export const SchemaCUID2: core.$constructor<SchemaCUID2> = /*@__PURE__*/ core.$constructor("SchemaCUID2", (inst, def) => {
  // SchemaStringFormat.init(inst, def);
  core.$SchemaCUID2.init(inst, def);
  SchemaStringFormat.init(inst, def);
});

export function cuid2(params?: string | core.$SchemaCUID2Params): SchemaCUID2 {
  return core._cuid2(SchemaCUID2, params);
}

// SchemaULID
export interface SchemaULID extends SchemaStringFormat<"ulid"> {
  _schema: core.$SchemaULIDInternals;
}
export const SchemaULID: core.$constructor<SchemaULID> = /*@__PURE__*/ core.$constructor("SchemaULID", (inst, def) => {
  // SchemaStringFormat.init(inst, def);
  core.$SchemaULID.init(inst, def);
  SchemaStringFormat.init(inst, def);
});

export function ulid(params?: string | core.$SchemaULIDParams): SchemaULID {
  return core._ulid(SchemaULID, params);
}

// SchemaXID
export interface SchemaXID extends SchemaStringFormat<"xid"> {
  _schema: core.$SchemaXIDInternals;
}
export const SchemaXID: core.$constructor<SchemaXID> = /*@__PURE__*/ core.$constructor("SchemaXID", (inst, def) => {
  // SchemaStringFormat.init(inst, def);
  core.$SchemaXID.init(inst, def);
  SchemaStringFormat.init(inst, def);
});

export function xid(params?: string | core.$SchemaXIDParams): SchemaXID {
  return core._xid(SchemaXID, params);
}

// SchemaKSUID
export interface SchemaKSUID extends SchemaStringFormat<"ksuid"> {
  _schema: core.$SchemaKSUIDInternals;
}
export const SchemaKSUID: core.$constructor<SchemaKSUID> = /*@__PURE__*/ core.$constructor("SchemaKSUID", (inst, def) => {
  // SchemaStringFormat.init(inst, def);
  core.$SchemaKSUID.init(inst, def);
  SchemaStringFormat.init(inst, def);
});

export function ksuid(params?: string | core.$SchemaKSUIDParams): SchemaKSUID {
  return core._ksuid(SchemaKSUID, params);
}

// SchemaIP
// export interface SchemaIP extends SchemaStringFormat<"ip"> {
//   _schema: core.$SchemaIPInternals;
// }
// export const SchemaIP: core.$constructor<SchemaIP> = /*@__PURE__*/ core.$constructor("SchemaIP", (inst, def) => {
//   // SchemaStringFormat.init(inst, def);
//   core.$SchemaIP.init(inst, def);
//   SchemaStringFormat.init(inst, def);
// });

// export function ip(params?: string | core.$SchemaIPParams): SchemaIP {
//   return core._ip(SchemaIP, params);
// }

// SchemaIPv4
export interface SchemaIPv4 extends SchemaStringFormat<"ipv4"> {
  _schema: core.$SchemaIPv4Internals;
}
export const SchemaIPv4: core.$constructor<SchemaIPv4> = /*@__PURE__*/ core.$constructor("SchemaIPv4", (inst, def) => {
  // SchemaStringFormat.init(inst, def);
  core.$SchemaIPv4.init(inst, def);
  SchemaStringFormat.init(inst, def);
});

export function ipv4(params?: string | core.$SchemaIPv4Params): SchemaIPv4 {
  return core._ipv4(SchemaIPv4, params);
}

// SchemaMAC
export interface SchemaMAC extends SchemaStringFormat<"mac"> {
  _schema: core.$SchemaMACInternals;
}
export const SchemaMAC: core.$constructor<SchemaMAC> = /*@__PURE__*/ core.$constructor("SchemaMAC", (inst, def) => {
  // SchemaStringFormat.init(inst, def);
  core.$SchemaMAC.init(inst, def);
  SchemaStringFormat.init(inst, def);
});
export function mac(params?: string | core.$SchemaMACParams): SchemaMAC {
  return core._mac(SchemaMAC, params);
}

// SchemaIPv6
export interface SchemaIPv6 extends SchemaStringFormat<"ipv6"> {
  _schema: core.$SchemaIPv6Internals;
}
export const SchemaIPv6: core.$constructor<SchemaIPv6> = /*@__PURE__*/ core.$constructor("SchemaIPv6", (inst, def) => {
  // SchemaStringFormat.init(inst, def);
  core.$SchemaIPv6.init(inst, def);
  SchemaStringFormat.init(inst, def);
});
export function ipv6(params?: string | core.$SchemaIPv6Params): SchemaIPv6 {
  return core._ipv6(SchemaIPv6, params);
}

// SchemaCIDRv4
export interface SchemaCIDRv4 extends SchemaStringFormat<"cidrv4"> {
  _schema: core.$SchemaCIDRv4Internals;
}
export const SchemaCIDRv4: core.$constructor<SchemaCIDRv4> = /*@__PURE__*/ core.$constructor("SchemaCIDRv4", (inst, def) => {
  core.$SchemaCIDRv4.init(inst, def);
  SchemaStringFormat.init(inst, def);
});

export function cidrv4(params?: string | core.$SchemaCIDRv4Params): SchemaCIDRv4 {
  return core._cidrv4(SchemaCIDRv4, params);
}

// SchemaCIDRv6
export interface SchemaCIDRv6 extends SchemaStringFormat<"cidrv6"> {
  _schema: core.$SchemaCIDRv6Internals;
}
export const SchemaCIDRv6: core.$constructor<SchemaCIDRv6> = /*@__PURE__*/ core.$constructor("SchemaCIDRv6", (inst, def) => {
  core.$SchemaCIDRv6.init(inst, def);
  SchemaStringFormat.init(inst, def);
});

export function cidrv6(params?: string | core.$SchemaCIDRv6Params): SchemaCIDRv6 {
  return core._cidrv6(SchemaCIDRv6, params);
}

// SchemaBase64
export interface SchemaBase64 extends SchemaStringFormat<"base64"> {
  _schema: core.$SchemaBase64Internals;
}
export const SchemaBase64: core.$constructor<SchemaBase64> = /*@__PURE__*/ core.$constructor("SchemaBase64", (inst, def) => {
  // SchemaStringFormat.init(inst, def);
  core.$SchemaBase64.init(inst, def);
  SchemaStringFormat.init(inst, def);
});
export function base64(params?: string | core.$SchemaBase64Params): SchemaBase64 {
  return core._base64(SchemaBase64, params);
}

// SchemaBase64URL
export interface SchemaBase64URL extends SchemaStringFormat<"base64url"> {
  _schema: core.$SchemaBase64URLInternals;
}
export const SchemaBase64URL: core.$constructor<SchemaBase64URL> = /*@__PURE__*/ core.$constructor(
  "SchemaBase64URL",
  (inst, def) => {
    // SchemaStringFormat.init(inst, def);
    core.$SchemaBase64URL.init(inst, def);
    SchemaStringFormat.init(inst, def);
  }
);
export function base64url(params?: string | core.$SchemaBase64URLParams): SchemaBase64URL {
  return core._base64url(SchemaBase64URL, params);
}

// SchemaE164
export interface SchemaE164 extends SchemaStringFormat<"e164"> {
  _schema: core.$SchemaE164Internals;
}
export const SchemaE164: core.$constructor<SchemaE164> = /*@__PURE__*/ core.$constructor("SchemaE164", (inst, def) => {
  // SchemaStringFormat.init(inst, def);
  core.$SchemaE164.init(inst, def);
  SchemaStringFormat.init(inst, def);
});

export function e164(params?: string | core.$SchemaE164Params): SchemaE164 {
  return core._e164(SchemaE164, params);
}

// SchemaCreditCard
export interface SchemaCreditCard extends SchemaStringFormat<"credit_card"> {
  _schema: core.$SchemaCreditCardInternals;
}
export const SchemaCreditCard: core.$constructor<SchemaCreditCard> = /*@__PURE__*/ core.$constructor(
  "SchemaCreditCard",
  (inst, def) => {
    core.$SchemaCreditCard.init(inst, def);
    SchemaStringFormat.init(inst, def);
  }
);

export function creditCard(params?: string | core.$SchemaCreditCardParams): SchemaCreditCard {
  return core._creditCard(SchemaCreditCard, params);
}

// SchemaIBAN
export interface SchemaIBAN extends SchemaStringFormat<"iban"> {
  _schema: core.$SchemaIBANInternals;
}
export const SchemaIBAN: core.$constructor<SchemaIBAN> = /*@__PURE__*/ core.$constructor("SchemaIBAN", (inst, def) => {
  core.$SchemaIBAN.init(inst, def);
  SchemaStringFormat.init(inst, def);
});

export function iban(params?: string | core.$SchemaIBANParams): SchemaIBAN {
  return core._iban(SchemaIBAN, params);
}

// SchemaJWT
export interface SchemaJWT extends SchemaStringFormat<"jwt"> {
  _schema: core.$SchemaJWTInternals;
}
export const SchemaJWT: core.$constructor<SchemaJWT> = /*@__PURE__*/ core.$constructor("SchemaJWT", (inst, def) => {
  // SchemaStringFormat.init(inst, def);
  core.$SchemaJWT.init(inst, def);
  SchemaStringFormat.init(inst, def);
});

export function jwt(params?: string | core.$SchemaJWTParams): SchemaJWT {
  return core._jwt(SchemaJWT, params);
}

// SchemaCustomStringFormat
export interface SchemaCustomStringFormat<Format extends string = string>
  extends SchemaStringFormat<Format>,
    core.$SchemaCustomStringFormat<Format> {
  _schema: core.$SchemaCustomStringFormatInternals<Format>;
  "~standard": SchemaStandardSchemaWithJSON<this>;
}
export const SchemaCustomStringFormat: core.$constructor<SchemaCustomStringFormat> = /*@__PURE__*/ core.$constructor(
  "SchemaCustomStringFormat",
  (inst, def) => {
    // SchemaStringFormat.init(inst, def);
    core.$SchemaCustomStringFormat.init(inst, def);
    SchemaStringFormat.init(inst, def);
  }
);
export function stringFormat<Format extends string>(
  format: Format,
  fnOrRegex: ((arg: string) => util.MaybeAsync<unknown>) | RegExp,
  _params: string | core.$SchemaStringFormatParams = {}
): SchemaCustomStringFormat<Format> {
  return core._stringFormat(SchemaCustomStringFormat, format, fnOrRegex, _params) as any;
}

export function hostname(_params?: string | core.$SchemaStringFormatParams): SchemaCustomStringFormat<"hostname"> {
  return core._stringFormat(SchemaCustomStringFormat, "hostname", regexes.hostname, _params) as any;
}

export function hex(_params?: string | core.$SchemaStringFormatParams): SchemaCustomStringFormat<"hex"> {
  return core._stringFormat(SchemaCustomStringFormat, "hex", regexes.hex, _params) as any;
}

export function currencyCode(_params?: string | core.$SchemaStringFormatParams): SchemaCustomStringFormat<"currency_code"> {
  return core._stringFormat(SchemaCustomStringFormat, "currency_code", regexes.currencyCode, _params) as any;
}

export function hash<Alg extends util.HashAlgorithm, Enc extends util.HashEncoding = "hex">(
  alg: Alg,
  params?: {
    enc?: Enc;
  } & core.$SchemaStringFormatParams
): SchemaCustomStringFormat<`${Alg}_${Enc}`> {
  const enc = params?.enc ?? "hex";
  const format = `${alg}_${enc}` as const;
  const regex = core.regexes[format as keyof typeof core.regexes] as RegExp;
  if (!regex) throw new Error(`Unrecognized hash format: ${format}`);
  return core._stringFormat(SchemaCustomStringFormat, format, regex, params) as any;
}

// SchemaNumber
export interface _SchemaNumber<Internals extends core.$SchemaNumberInternals = core.$SchemaNumberInternals>
  extends _SchemaType<Internals> {
  gt(value: number, params?: string | core.$SchemaCheckGreaterThanParams): this;
  /** Identical to .min() */
  gte(value: number, params?: string | core.$SchemaCheckGreaterThanParams): this;
  min(value: number, params?: string | core.$SchemaCheckGreaterThanParams): this;
  lt(value: number, params?: string | core.$SchemaCheckLessThanParams): this;
  /** Identical to .max() */
  lte(value: number, params?: string | core.$SchemaCheckLessThanParams): this;
  max(value: number, params?: string | core.$SchemaCheckLessThanParams): this;
  /** Consider `Schema.int()` instead. This API is considered *legacy*; it will never be removed but a better alternative exists. */
  int(params?: string | core.$SchemaCheckNumberFormatParams): this;
  /** @deprecated This is now identical to `.int()`. Only numbers in the safe integer range are accepted. */
  safe(params?: string | core.$SchemaCheckNumberFormatParams): this;
  positive(params?: string | core.$SchemaCheckGreaterThanParams): this;
  nonnegative(params?: string | core.$SchemaCheckGreaterThanParams): this;
  negative(params?: string | core.$SchemaCheckLessThanParams): this;
  nonpositive(params?: string | core.$SchemaCheckLessThanParams): this;
  multipleOf(value: number, params?: string | core.$SchemaCheckMultipleOfParams): this;
  /** @deprecated Use `.multipleOf()` instead. */
  step(value: number, params?: string | core.$SchemaCheckMultipleOfParams): this;

  /** @deprecated In v4 and later, Schema.number() does not allow infinite values by default. This is a no-op. */
  finite(params?: unknown): this;

  minValue: number | null;
  maxValue: number | null;
  /** @deprecated Check the `format` property instead.  */
  isInt: boolean;
  /** @deprecated Number schemas no longer accept infinite values, so this always returns `true`. */
  isFinite: boolean;
  format: string | null;
}

export interface SchemaNumber extends _SchemaNumber<core.$SchemaNumberInternals<number>> {}

export const SchemaNumber: core.$constructor<SchemaNumber> = /*@__PURE__*/ core.$constructor<SchemaNumber>(
  "SchemaNumber",
  (inst, def) => {
    core.$SchemaNumber.init(inst, def);

    SchemaType.init(inst, def);

    inst._schema.processJSONSchema = (ctx, json, params) => processors.numberProcessor(inst, ctx, json, params);
    inst.isFinite = true;
  },
  /*@__PURE__*/ util.derived<SchemaNumber>(
    {
      minValue: (inst) => {
        const { minimum, exclusiveMinimum } = processors.aggregateChecks<number>(inst);
        return Math.max(minimum ?? Number.NEGATIVE_INFINITY, exclusiveMinimum ?? Number.NEGATIVE_INFINITY);
      },
      maxValue: (inst) => {
        const { maximum, exclusiveMaximum } = processors.aggregateChecks<number>(inst);
        return Math.min(maximum ?? Number.POSITIVE_INFINITY, exclusiveMaximum ?? Number.POSITIVE_INFINITY);
      },
      isInt: (inst) => {
        const { isInt, multipleOf } = processors.aggregateChecks(inst);
        return !!isInt || !!multipleOf?.some(Number.isSafeInteger);
      },
      format: (inst) => processors.aggregateChecks(inst).format ?? null,
    },
    {
      gt(value, params) {
        return this.check(checks.gt(value, params));
      },
      gte(value, params) {
        return this.check(checks.gte(value, params));
      },
      min(value, params) {
        return this.check(checks.gte(value, params));
      },
      lt(value, params) {
        return this.check(checks.lt(value, params));
      },
      lte(value, params) {
        return this.check(checks.lte(value, params));
      },
      max(value, params) {
        return this.check(checks.lte(value, params));
      },
      int(params) {
        return this.check(int(params));
      },
      safe(params) {
        return this.check(int(params));
      },
      positive(params) {
        return this.check(checks.gt(0, params));
      },
      nonnegative(params) {
        return this.check(checks.gte(0, params));
      },
      negative(params) {
        return this.check(checks.lt(0, params));
      },
      nonpositive(params) {
        return this.check(checks.lte(0, params));
      },
      multipleOf(value, params) {
        return this.check(checks.multipleOf(value, params));
      },
      step(value, params) {
        return this.check(checks.multipleOf(value, params));
      },
      finite() {
        return this;
      },
    }
  )
);

export function number(params?: string | core.$SchemaNumberParams): SchemaNumber {
  return core._number(SchemaNumber, params);
}

// SchemaNumberFormat
export interface SchemaNumberFormat<Format extends $SchemaNumberFormats = $SchemaNumberFormats> extends SchemaNumber {
  _schema: core.$SchemaNumberFormatInternals<Format>;
}
export const SchemaNumberFormat: core.$constructor<SchemaNumberFormat> = /*@__PURE__*/ core.$constructor(
  "SchemaNumberFormat",
  (inst, def) => {
    core.$SchemaNumberFormat.init(inst, def);
    SchemaNumber.init(inst, def);
  }
);

// int
export interface SchemaInt extends SchemaNumberFormat<"safeint"> {}
export function int(params?: string | core.$SchemaCheckNumberFormatParams): SchemaInt {
  return core._int(SchemaNumberFormat, params) as SchemaInt;
}

// float32
export interface SchemaFloat32 extends SchemaNumberFormat<"float32"> {}
export function float32(params?: string | core.$SchemaCheckNumberFormatParams): SchemaFloat32 {
  return core._float32(SchemaNumberFormat, params) as SchemaFloat32;
}

// float64
export interface SchemaFloat64 extends SchemaNumberFormat<"float64"> {}
export function float64(params?: string | core.$SchemaCheckNumberFormatParams): SchemaFloat64 {
  return core._float64(SchemaNumberFormat, params) as SchemaFloat64;
}

// int32
export interface SchemaInt32 extends SchemaNumberFormat<"int32"> {}
export function int32(params?: string | core.$SchemaCheckNumberFormatParams): SchemaInt32 {
  return core._int32(SchemaNumberFormat, params) as SchemaInt32;
}

// uint32
export interface SchemaUInt32 extends SchemaNumberFormat<"uint32"> {}
export function uint32(params?: string | core.$SchemaCheckNumberFormatParams): SchemaUInt32 {
  return core._uint32(SchemaNumberFormat, params) as SchemaUInt32;
}

// boolean
export interface _SchemaBoolean<T extends core.$SchemaBooleanInternals = core.$SchemaBooleanInternals> extends _SchemaType<T> {}
export interface SchemaBoolean extends _SchemaBoolean<core.$SchemaBooleanInternals<boolean>> {}
export const SchemaBoolean: core.$constructor<SchemaBoolean> = /*@__PURE__*/ core.$constructor("SchemaBoolean", (inst, def) => {
  core.$SchemaBoolean.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.booleanProcessor(inst, ctx, json, params);
});

export function boolean(params?: string | core.$SchemaBooleanParams): SchemaBoolean {
  return core._boolean(SchemaBoolean, params);
}

// bigint
export interface _SchemaBigInt<T extends core.$SchemaBigIntInternals = core.$SchemaBigIntInternals> extends _SchemaType<T> {
  gte(value: bigint, params?: string | core.$SchemaCheckGreaterThanParams): this;
  /** Alias of `.gte()` */
  min(value: bigint, params?: string | core.$SchemaCheckGreaterThanParams): this;
  gt(value: bigint, params?: string | core.$SchemaCheckGreaterThanParams): this;
  /** Alias of `.lte()` */
  lte(value: bigint, params?: string | core.$SchemaCheckLessThanParams): this;
  max(value: bigint, params?: string | core.$SchemaCheckLessThanParams): this;
  lt(value: bigint, params?: string | core.$SchemaCheckLessThanParams): this;
  positive(params?: string | core.$SchemaCheckGreaterThanParams): this;
  negative(params?: string | core.$SchemaCheckLessThanParams): this;
  nonpositive(params?: string | core.$SchemaCheckLessThanParams): this;
  nonnegative(params?: string | core.$SchemaCheckGreaterThanParams): this;
  multipleOf(value: bigint, params?: string | core.$SchemaCheckMultipleOfParams): this;

  minValue: bigint | null;
  maxValue: bigint | null;
  format: string | null;
}

export interface SchemaBigInt extends _SchemaBigInt<core.$SchemaBigIntInternals<bigint>> {}
export const SchemaBigInt: core.$constructor<SchemaBigInt> = /*@__PURE__*/ core.$constructor<SchemaBigInt>(
  "SchemaBigInt",
  (inst, def) => {
    core.$SchemaBigInt.init(inst, def);
    SchemaType.init(inst, def);
    inst._schema.processJSONSchema = (ctx, json, params) => processors.bigintProcessor(inst, ctx, json, params);
  },
  /*@__PURE__*/ util.derived<SchemaBigInt>(
    {
      minValue: (inst) => processors.aggregateChecks<bigint>(inst).minimum ?? null,
      maxValue: (inst) => processors.aggregateChecks<bigint>(inst).maximum ?? null,
      format: (inst) => processors.aggregateChecks(inst).format ?? null,
    },
    {
      gte(value, params) {
        return this.check(checks.gte(value, params));
      },
      min(value, params) {
        return this.check(checks.gte(value, params));
      },
      gt(value, params) {
        return this.check(checks.gt(value, params));
      },
      lt(value, params) {
        return this.check(checks.lt(value, params));
      },
      lte(value, params) {
        return this.check(checks.lte(value, params));
      },
      max(value, params) {
        return this.check(checks.lte(value, params));
      },
      positive(params) {
        return this.check(checks.gt(BigInt(0), params));
      },
      negative(params) {
        return this.check(checks.lt(BigInt(0), params));
      },
      nonpositive(params) {
        return this.check(checks.lte(BigInt(0), params));
      },
      nonnegative(params) {
        return this.check(checks.gte(BigInt(0), params));
      },
      multipleOf(value, params) {
        return this.check(checks.multipleOf(value, params));
      },
    }
  )
);

export function bigint(params?: string | core.$SchemaBigIntParams): SchemaBigInt {
  return core._bigint(SchemaBigInt, params);
}
// bigint formats

// SchemaBigIntFormat
export interface SchemaBigIntFormat<Format extends $SchemaBigIntFormats = $SchemaBigIntFormats> extends SchemaBigInt {
  _schema: core.$SchemaBigIntFormatInternals<Format>;
}
export const SchemaBigIntFormat: core.$constructor<SchemaBigIntFormat> = /*@__PURE__*/ core.$constructor(
  "SchemaBigIntFormat",
  (inst, def) => {
    core.$SchemaBigIntFormat.init(inst, def);
    SchemaBigInt.init(inst, def);
  }
);

// int64
export interface SchemaInt64 extends SchemaBigIntFormat<"int64"> {}
export function int64(params?: string | core.$SchemaBigIntFormatParams): SchemaInt64 {
  return core._int64(SchemaBigIntFormat, params) as SchemaInt64;
}

// uint64
export interface SchemaUInt64 extends SchemaBigIntFormat<"uint64"> {}
export function uint64(params?: string | core.$SchemaBigIntFormatParams): SchemaUInt64 {
  return core._uint64(SchemaBigIntFormat, params) as SchemaUInt64;
}

// symbol
export interface SchemaSymbol extends _SchemaType<core.$SchemaSymbolInternals> {}
export const SchemaSymbol: core.$constructor<SchemaSymbol> = /*@__PURE__*/ core.$constructor("SchemaSymbol", (inst, def) => {
  core.$SchemaSymbol.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.symbolProcessor(inst, ctx, json, params);
});

export function symbol(params?: string | core.$SchemaSymbolParams): SchemaSymbol {
  return core._symbol(SchemaSymbol, params);
}

// SchemaUndefined
export interface SchemaUndefined extends _SchemaType<core.$SchemaUndefinedInternals> {}
export const SchemaUndefined: core.$constructor<SchemaUndefined> = /*@__PURE__*/ core.$constructor(
  "SchemaUndefined",
  (inst, def) => {
    core.$SchemaUndefined.init(inst, def);
    SchemaType.init(inst, def);
    inst._schema.processJSONSchema = (ctx, json, params) => processors.undefinedProcessor(inst, ctx, json, params);
  }
);

function _undefined(params?: string | core.$SchemaUndefinedParams): SchemaUndefined {
  return core._undefined(SchemaUndefined, params);
}
export { _undefined as undefined };

// SchemaNull
export interface SchemaNull extends _SchemaType<core.$SchemaNullInternals> {}
export const SchemaNull: core.$constructor<SchemaNull> = /*@__PURE__*/ core.$constructor("SchemaNull", (inst, def) => {
  core.$SchemaNull.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.nullProcessor(inst, ctx, json, params);
});

function _null(params?: string | core.$SchemaNullParams): SchemaNull {
  return core._null(SchemaNull, params);
}
export { _null as null };

// SchemaAny
export interface SchemaAny extends _SchemaType<core.$SchemaAnyInternals> {}
export const SchemaAny: core.$constructor<SchemaAny> = /*@__PURE__*/ core.$constructor("SchemaAny", (inst, def) => {
  core.$SchemaAny.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.anyProcessor(inst, ctx, json, params);
});

export function any(): SchemaAny {
  return core._any(SchemaAny);
}

// SchemaUnknown
export interface SchemaUnknown extends _SchemaType<core.$SchemaUnknownInternals> {}
export const SchemaUnknown: core.$constructor<SchemaUnknown> = /*@__PURE__*/ core.$constructor("SchemaUnknown", (inst, def) => {
  core.$SchemaUnknown.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.unknownProcessor(inst, ctx, json, params);
});

export function unknown(): SchemaUnknown {
  return core._unknown(SchemaUnknown);
}

// SchemaNever
export interface SchemaNever extends _SchemaType<core.$SchemaNeverInternals> {}
export const SchemaNever: core.$constructor<SchemaNever> = /*@__PURE__*/ core.$constructor("SchemaNever", (inst, def) => {
  core.$SchemaNever.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.neverProcessor(inst, ctx, json, params);
});

export function never(params?: string | core.$SchemaNeverParams): SchemaNever {
  return core._never(SchemaNever, params);
}

// SchemaVoid
export interface SchemaVoid extends _SchemaType<core.$SchemaVoidInternals> {}
export const SchemaVoid: core.$constructor<SchemaVoid> = /*@__PURE__*/ core.$constructor("SchemaVoid", (inst, def) => {
  core.$SchemaVoid.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.voidProcessor(inst, ctx, json, params);
});

function _void(params?: string | core.$SchemaVoidParams): SchemaVoid {
  return core._void(SchemaVoid, params);
}
export { _void as void };

// SchemaDate
export interface _SchemaDate<T extends core.$SchemaDateInternals = core.$SchemaDateInternals> extends _SchemaType<T> {
  min(value: number | Date, params?: string | core.$SchemaCheckGreaterThanParams): this;
  max(value: number | Date, params?: string | core.$SchemaCheckLessThanParams): this;

  /** @deprecated Not recommended. */
  minDate: Date | null;
  /** @deprecated Not recommended. */
  maxDate: Date | null;
}

export interface SchemaDate extends _SchemaDate<core.$SchemaDateInternals<Date>> {}
export const SchemaDate: core.$constructor<SchemaDate> = /*@__PURE__*/ core.$constructor<SchemaDate>(
  "SchemaDate",
  (inst, def) => {
    core.$SchemaDate.init(inst, def);
    SchemaType.init(inst, def);
    inst._schema.processJSONSchema = (ctx, json, params) => processors.dateProcessor(inst, ctx, json, params);

    inst.min = (value, params) => inst.check(checks.gte(value, params));
    inst.max = (value, params) => inst.check(checks.lte(value, params));
  },
  /*@__PURE__*/ util.derived<SchemaDate>(
    {
      minDate: (inst) => {
        const { minimum } = processors.aggregateChecks<Date>(inst);
        return minimum ? new Date(minimum) : null;
      },
      maxDate: (inst) => {
        const { maximum } = processors.aggregateChecks<Date>(inst);
        return maximum ? new Date(maximum) : null;
      },
    },
    {}
  )
);

export function date(params?: string | core.$SchemaDateParams): SchemaDate {
  return core._date(SchemaDate, params);
}

// SchemaArray
export interface SchemaArray<T extends core.SomeType = core.$SchemaType>
  extends _SchemaType<core.$SchemaArrayInternals<T>>,
    core.$SchemaArray<T> {
  element: T;
  min(minLength: number, params?: string | core.$SchemaCheckMinLengthParams): this;
  nonempty(params?: string | core.$SchemaCheckMinLengthParams): this;
  max(maxLength: number, params?: string | core.$SchemaCheckMaxLengthParams): this;
  length(len: number, params?: string | core.$SchemaCheckLengthEqualsParams): this;

  unwrap(): T;
  "~standard": SchemaStandardSchemaWithJSON<this>;
}
export const SchemaArray: core.$constructor<SchemaArray> = /*@__PURE__*/ core.$constructor<SchemaArray>(
  "SchemaArray",
  (inst, def) => {
    _ensureDefaultMemoizer();
    core.$SchemaArray.init(inst, def);
    SchemaType.init(inst, def);
    inst._schema.processJSONSchema = (ctx, json, params) => processors.arrayProcessor(inst, ctx, json, params);

    inst.element = def.element;
  },
  {
    min(n, params) {
      return this.check(checks.minLength(n, params));
    },
    nonempty(params) {
      return this.check(checks.minLength(1, params));
    },
    max(n, params) {
      return this.check(checks.maxLength(n, params));
    },
    length(n, params) {
      return this.check(checks.length(n, params));
    },
    unwrap() {
      return this.element;
    },
  }
);

export function array<T extends core.SomeType>(element: T, params?: string | core.$SchemaArrayParams): SchemaArray<T> {
  return core._array(SchemaArray, element as any, params) as any;
}

// .keyof
export function keyof<T extends SchemaObject>(schema: T): SchemaEnum<util.KeysEnum<T["_schema"]["output"]>> {
  const shape = Schema._schema.def.shape;
  return _enum(Object.keys(shape)) as any;
}

// SchemaObject

export type SafeExtendShape<Base extends core.$SchemaShape, Ext extends core.$SchemaLooseShape> = {
  [K in keyof Ext]: K extends keyof Base
    ? core.output<Ext[K]> extends core.output<Base[K]>
      ? core.input<Ext[K]> extends core.input<Base[K]>
        ? Ext[K]
        : never
      : never
    : Ext[K];
};

export interface SchemaObject<
  /** @ts-ignore Cast variance */
  out Shape extends core.$SchemaShape = core.$SchemaLooseShape,
  out Config extends core.$SchemaObjectConfig = core.$strip,
> extends _SchemaType<core.$SchemaObjectInternals<Shape, Config>>,
    core.$SchemaObject<Shape, Config> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  shape: Shape;

  keyof(): SchemaEnum<util.ToEnum<keyof Shape & string>>;
  /** Define a schema to validate all unrecognized keys. This overrides the existing strict/loose behavior. */
  catchall<T extends core.SomeType>(schema: T): SchemaObject<Shape, core.$catchall<T>>;

  /** @deprecated Use `Schema.looseObject()` or `.loose()` instead. */
  passthrough(): SchemaObject<Shape, core.$loose>;
  /** Consider `Schema.looseObject(A.shape)` instead */
  loose(): SchemaObject<Shape, core.$loose>;

  /** Consider `Schema.strictObject(A.shape)` instead */
  strict(): SchemaObject<Shape, core.$strict>;

  /** This is the default behavior. This method call is likely unnecessary. */
  strip(): SchemaObject<Shape, core.$strip>;

  extend<U extends core.$SchemaLooseShape>(shape: U): SchemaObject<util.Extend<Shape, util.Writeable<U>>, Config>;

  safeExtend<U extends core.$SchemaLooseShape>(
    shape: SafeExtendShape<Shape, U> & Partial<Record<keyof Shape, core.SomeType>>
  ): SchemaObject<util.Extend<Shape, util.Writeable<U>>, Config>;

  /**
   * @deprecated Use [`A.extend(B.shape)`](https://Schema.dev/api?id=extend) instead.
   */
  merge<U extends SchemaObject>(other: U): SchemaObject<util.Extend<Shape, U["shape"]>, U["_schema"]["config"]>;

  pick<M extends util.Mask<keyof Shape>>(
    mask: M & Record<Exclude<keyof M, keyof Shape>, never>
  ): SchemaObject<util.Flatten<Pick<Shape, Extract<keyof Shape, keyof M>>>, Config>;

  omit<M extends util.Mask<keyof Shape>>(
    mask: M & Record<Exclude<keyof M, keyof Shape>, never>
  ): SchemaObject<util.Flatten<Omit<Shape, Extract<keyof Shape, keyof M>>>, Config>;

  partial(): SchemaObject<
    {
      -readonly [k in keyof Shape]: SchemaOptional<Shape[k]>;
    },
    Config
  >;
  partial<M extends util.Mask<keyof Shape>>(
    mask: M & Record<Exclude<keyof M, keyof Shape>, never>
  ): SchemaObject<
    {
      -readonly [k in keyof Shape]: k extends keyof M
        ? // Shape[k] extends OptionalInSchema
          //   ? Shape[k]
          //   :
          SchemaOptional<Shape[k]>
        : Shape[k];
    },
    Config
  >;

  // exactPartial
  exactPartial(): SchemaObject<
    {
      -readonly [k in keyof Shape]: SchemaExactOptional<Shape[k]>;
    },
    Config
  >;
  exactPartial<M extends util.Mask<keyof Shape>>(
    mask: M & Record<Exclude<keyof M, keyof Shape>, never>
  ): SchemaObject<
    {
      -readonly [k in keyof Shape]: k extends keyof M ? SchemaExactOptional<Shape[k]> : Shape[k];
    },
    Config
  >;

  // required
  required(): SchemaObject<
    {
      -readonly [k in keyof Shape]: SchemaNonOptional<Shape[k]>;
    },
    Config
  >;
  required<M extends util.Mask<keyof Shape>>(
    mask: M & Record<Exclude<keyof M, keyof Shape>, never>
  ): SchemaObject<
    {
      -readonly [k in keyof Shape]: k extends keyof M ? SchemaNonOptional<Shape[k]> : Shape[k];
    },
    Config
  >;
}

export const SchemaObject: core.$constructor<SchemaObject> = /*@__PURE__*/ core.$constructor<SchemaObject>(
  "SchemaObject",
  (inst, def) => {
    _ensureDefaultMemoizer();
    core.$SchemaObjectJIT.init(inst, def);
    SchemaType.init(inst, def);
    inst._schema.processJSONSchema = (ctx, json, params) => processors.objectProcessor(inst, ctx, json, params);

    util.installLazyProp(inst, "shape", (self) => self._schema.def.shape, false);
  },
  {
    keyof() {
      return _enum(Object.keys(this._schema.def.shape));
    },
    catchall(catchall) {
      // `mergeDefs` rather than a spread: spreading reads `shape`, and resolving it can mint a whole fresh subtree
      return this.clone(util.mergeDefs(this._schema.def, { catchall: catchall as any }));
    },
    passthrough() {
      return this.clone(util.mergeDefs(this._schema.def, { catchall: unknown() }));
    },
    loose() {
      return this.clone(util.mergeDefs(this._schema.def, { catchall: unknown() }));
    },
    strict() {
      return this.clone(util.mergeDefs(this._schema.def, { catchall: never() }));
    },
    strip() {
      return this.clone(util.mergeDefs(this._schema.def, { catchall: undefined }));
    },
    extend(incoming) {
      return util.extend(this, incoming);
    },
    safeExtend(incoming) {
      return util.safeExtend(this, incoming);
    },
    merge(other) {
      return util.merge(this, other);
    },
    pick(mask) {
      return util.pick(this, mask);
    },
    omit(mask) {
      return util.omit(this, mask);
    },
    partial(...args) {
      return util.partial(SchemaOptional, this, args[0]);
    },
    exactPartial(...args) {
      return util.partial(SchemaExactOptional, this, args[0], "exactPartial");
    },
    required(...args) {
      return util.required(SchemaNonOptional, this, args[0]);
    },
  }
);

export function object<T extends core.$SchemaLooseShape = Partial<Record<never, core.SomeType>>>(
  shape?: T,
  params?: string | core.$SchemaObjectParams
): SchemaObject<util.Writeable<T>, core.$strip> {
  const def: core.$SchemaObjectDef = {
    type: "object",
    shape: shape ?? {},
    ...util.normalizeParams(params),
  };
  return new SchemaObject(def) as any;
}

// strictObject

export function strictObject<T extends core.$SchemaLooseShape>(
  shape: T,
  params?: string | core.$SchemaObjectParams
): SchemaObject<util.Writeable<T>, core.$strict> {
  return new SchemaObject({
    type: "object",
    shape,
    catchall: never(),
    ...util.normalizeParams(params),
  }) as any;
}

// looseObject

export function looseObject<T extends core.$SchemaLooseShape>(
  shape: T,
  params?: string | core.$SchemaObjectParams
): SchemaObject<util.Writeable<T>, core.$loose> {
  return new SchemaObject({
    type: "object",
    shape,
    catchall: unknown(),
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaUnion
export interface SchemaUnion<T extends readonly core.SomeType[] = readonly core.$SchemaType[]>
  extends _SchemaType<core.$SchemaUnionInternals<T>>,
    core.$SchemaUnion<T> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  options: T;
}
export const SchemaUnion: core.$constructor<SchemaUnion> = /*@__PURE__*/ core.$constructor("SchemaUnion", (inst, def) => {
  core.$SchemaUnion.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.unionProcessor(inst, ctx, json, params);
  inst.options = def.options;
});

export function union<const T extends readonly core.SomeType[]>(
  options: T,
  params?: string | core.$SchemaUnionParams
): SchemaUnion<T> {
  return new SchemaUnion({
    type: "union",
    options: options as any as core.$SchemaType[],
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaXor
export interface SchemaXor<T extends readonly core.SomeType[] = readonly core.$SchemaType[]>
  extends _SchemaType<core.$SchemaXorInternals<T>>,
    core.$SchemaXor<T> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  options: T;
}
export const SchemaXor: core.$constructor<SchemaXor> = /*@__PURE__*/ core.$constructor("SchemaXor", (inst, def) => {
  SchemaUnion.init(inst, def);
  core.$SchemaXor.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.unionProcessor(inst, ctx, json, params);
  inst.options = def.options;
});

/** Creates an exclusive union (XOR) where exactly one option must match.
 * Unlike regular unions that succeed when any option matches, xor fails if
 * zero or more than one option matches the input. */
export function xor<const T extends readonly core.SomeType[]>(
  options: T,
  params?: string | core.$SchemaXorParams
): SchemaXor<T> {
  return new SchemaXor({
    type: "union",
    options: options as any as core.$SchemaType[],
    inclusive: false,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaDiscriminatedUnion
export interface SchemaDiscriminatedUnion<
  Options extends readonly core.SomeType[] = readonly core.$SchemaType[],
  Disc extends string = string,
> extends SchemaUnion<Options>,
    core.$SchemaDiscriminatedUnion<Options, Disc> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  _schema: core.$SchemaDiscriminatedUnionInternals<Options, Disc>;
  def: core.$SchemaDiscriminatedUnionDef<Options, Disc>;
}
export const SchemaDiscriminatedUnion: core.$constructor<SchemaDiscriminatedUnion> = /*@__PURE__*/ core.$constructor(
  "SchemaDiscriminatedUnion",
  (inst, def) => {
    SchemaUnion.init(inst, def);
    core.$SchemaDiscriminatedUnion.init(inst, def);
  }
);

export function discriminatedUnion<
  Types extends readonly [core.$SchemaTypeDiscriminable, ...core.$SchemaTypeDiscriminable[]],
  Disc extends string,
>(
  discriminator: Disc,
  options: Types,
  params?: string | core.$SchemaDiscriminatedUnionParams
): SchemaDiscriminatedUnion<Types, Disc> {
  // const [options, params] = args;
  return new SchemaDiscriminatedUnion({
    type: "union",
    options: options as any as core.$SchemaType[],
    discriminator,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaIntersection
export interface SchemaIntersection<A extends core.SomeType = core.$SchemaType, B extends core.SomeType = core.$SchemaType>
  extends _SchemaType<core.$SchemaIntersectionInternals<A, B>>,
    core.$SchemaIntersection<A, B> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
}
export const SchemaIntersection: core.$constructor<SchemaIntersection> = /*@__PURE__*/ core.$constructor(
  "SchemaIntersection",
  (inst, def) => {
    core.$SchemaIntersection.init(inst, def);
    SchemaType.init(inst, def);
    inst._schema.processJSONSchema = (ctx, json, params) => processors.intersectionProcessor(inst, ctx, json, params);
  }
);

export function intersection<T extends core.SomeType, U extends core.SomeType>(
  left: T,
  right: U
): SchemaIntersection<T, U> {
  return new SchemaIntersection({
    type: "intersection",
    left: left as any as core.$SchemaType,
    right: right as any as core.$SchemaType,
  }) as any;
}

// SchemaTuple
export interface SchemaTuple<
  T extends util.TupleItems = readonly core.$SchemaType[],
  Rest extends core.SomeType | null = core.$SchemaType | null,
> extends _SchemaType<core.$SchemaTupleInternals<T, Rest>>,
    core.$SchemaTuple<T, Rest> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  rest<Rest extends core.SomeType = core.$SchemaType>(rest: Rest): SchemaTuple<T, Rest>;
  partial(): SchemaTuple<{ -readonly [k in keyof T]: SchemaOptional<T[k]> }, Rest>;
}
export const SchemaTuple: core.$constructor<SchemaTuple> = /*@__PURE__*/ core.$constructor<SchemaTuple>(
  "SchemaTuple",
  (inst, def) => {
    _ensureDefaultMemoizer();
    core.$SchemaTuple.init(inst, def);
    SchemaType.init(inst, def);
    inst._schema.processJSONSchema = (ctx, json, params) => processors.tupleProcessor(inst, ctx, json, params);
  },
  {
    rest(rest) {
      return this.clone({
        ...this._schema.def,
        rest: rest as any as core.$SchemaType,
      }) as any;
    },
    partial() {
      const def = this._schema.def;
      // a refinement was authored against the full arity; partialing would run it on a shorter array
      if (def.checks?.length) throw new Error(".partial() cannot be used on tuple schemas containing refinements");
      return this.clone({
        ...def,
        items: def.items.map((item) => new SchemaOptional({ type: "optional", innerType: item })),
      }) as any;
    },
  }
);

export function tuple<T extends readonly [core.SomeType, ...core.SomeType[]]>(
  items: T,
  params?: string | core.$SchemaTupleParams
): SchemaTuple<T, null>;
export function tuple<T extends readonly [core.SomeType, ...core.SomeType[]], Rest extends core.SomeType>(
  items: T,
  rest: Rest,
  params?: string | core.$SchemaTupleParams
): SchemaTuple<T, Rest>;
export function tuple(items: [], params?: string | core.$SchemaTupleParams): SchemaTuple<[], null>;
export function tuple(
  items: core.SomeType[],
  _paramsOrRest?: string | core.$SchemaTupleParams | core.SomeType,
  _params?: string | core.$SchemaTupleParams
) {
  const hasRest = _paramsOrRest instanceof core.$SchemaType;
  const params = hasRest ? _params : _paramsOrRest;
  const rest = hasRest ? _paramsOrRest : null;
  return new SchemaTuple({
    type: "tuple",
    items: items as any as core.$SchemaType[],
    rest,
    ...util.normalizeParams(params),
  });
}

// SchemaRecord
export interface SchemaRecord<
  Key extends core.$SchemaRecordKey = core.$SchemaRecordKey,
  Value extends core.SomeType = core.$SchemaType,
> extends _SchemaType<core.$SchemaRecordInternals<Key, Value>>,
    core.$SchemaRecord<Key, Value> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  keyType: Key;
  valueType: Value;
}
export const SchemaRecord: core.$constructor<SchemaRecord> = /*@__PURE__*/ core.$constructor("SchemaRecord", (inst, def) => {
  _ensureDefaultMemoizer();
  core.$SchemaRecord.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.recordProcessor(inst, ctx, json, params);

  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
});

export function record<Key extends core.$SchemaRecordKey, Value extends core.SomeType>(
  keyType: Key,
  valueType: Value,
  params?: string | core.$SchemaRecordParams
): SchemaRecord<Key, Value> {
  // v3-compat: Schema.record(valueType, params?) — defaults keyType to Schema.string()
  if (!valueType || !(valueType as any)._schema) {
    return new SchemaRecord({
      type: "record",
      keyType: string() as any,
      valueType: keyType as any as core.$SchemaType,
      ...util.normalizeParams(valueType as string | core.$SchemaRecordParams | undefined),
    }) as any;
  }
  return new SchemaRecord({
    type: "record",
    keyType,
    valueType: valueType as any as core.$SchemaType,
    ...util.normalizeParams(params),
  }) as any;
}
// type alksjf = core.output<core.$SchemaRecordKey>;
export function partialRecord<Key extends core.$SchemaRecordKey, Value extends core.SomeType>(
  keyType: Key,
  valueType: Value,
  params?: string | core.$SchemaRecordParams
): SchemaRecord<Key & core.$partial, Value> {
  return new SchemaRecord({
    type: "record",
    keyType,
    valueType: valueType as any,
    ...util.normalizeParams(params),
    partial: true,
  }) as any;
}

export function looseRecord<Key extends core.$SchemaRecordKey, Value extends core.SomeType>(
  keyType: Key,
  valueType: Value,
  params?: string | core.$SchemaRecordParams
): SchemaRecord<Key, Value> {
  return new SchemaRecord({
    type: "record",
    keyType,
    valueType: valueType as any as core.$SchemaType,
    mode: "loose",
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaMap
export interface SchemaMap<Key extends core.SomeType = core.$SchemaType, Value extends core.SomeType = core.$SchemaType>
  extends _SchemaType<core.$SchemaMapInternals<Key, Value>>,
    core.$SchemaMap<Key, Value> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  keyType: Key;
  valueType: Value;
  min(minSize: number, params?: string | core.$SchemaCheckMinSizeParams): this;
  nonempty(params?: string | core.$SchemaCheckMinSizeParams): this;
  max(maxSize: number, params?: string | core.$SchemaCheckMaxSizeParams): this;
  size(size: number, params?: string | core.$SchemaCheckSizeEqualsParams): this;
}
export const SchemaMap: core.$constructor<SchemaMap> = /*@__PURE__*/ core.$constructor("SchemaMap", (inst, def) => {
  _ensureDefaultMemoizer();
  core.$SchemaMap.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.mapProcessor(inst, ctx, json, params);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
  inst.min = (...args) => inst.check(core._minSize(...args));
  inst.nonempty = (params) => inst.check(core._minSize(1, params));
  inst.max = (...args) => inst.check(core._maxSize(...args));
  inst.size = (...args) => inst.check(core._size(...args));
});

export function map<Key extends core.SomeType, Value extends core.SomeType>(
  keyType: Key,
  valueType: Value,
  params?: string | core.$SchemaMapParams
): SchemaMap<Key, Value> {
  return new SchemaMap({
    type: "map",
    keyType: keyType as any as core.$SchemaType,
    valueType: valueType as any as core.$SchemaType,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaSet
export interface SchemaSet<T extends core.SomeType = core.$SchemaType>
  extends _SchemaType<core.$SchemaSetInternals<T>>,
    core.$SchemaSet<T> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  min(minSize: number, params?: string | core.$SchemaCheckMinSizeParams): this;
  nonempty(params?: string | core.$SchemaCheckMinSizeParams): this;
  max(maxSize: number, params?: string | core.$SchemaCheckMaxSizeParams): this;
  size(size: number, params?: string | core.$SchemaCheckSizeEqualsParams): this;
}
export const SchemaSet: core.$constructor<SchemaSet> = /*@__PURE__*/ core.$constructor("SchemaSet", (inst, def) => {
  _ensureDefaultMemoizer();
  core.$SchemaSet.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.setProcessor(inst, ctx, json, params);

  inst.min = (...args) => inst.check(core._minSize(...args));
  inst.nonempty = (params) => inst.check(core._minSize(1, params));
  inst.max = (...args) => inst.check(core._maxSize(...args));
  inst.size = (...args) => inst.check(core._size(...args));
});

export function set<Value extends core.SomeType>(
  valueType: Value,
  params?: string | core.$SchemaSetParams
): SchemaSet<Value> {
  return new SchemaSet({
    type: "set",
    valueType: valueType as any as core.$SchemaType,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaEnum
export interface SchemaEnum<
  /** @ts-ignore Cast variance */
  out T extends util.EnumLike = util.EnumLike,
> extends _SchemaType<core.$SchemaEnumInternals<T>>,
    core.$SchemaEnum<T> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  enum: T;
  options: Array<T[keyof T]>;

  extract<const U extends readonly (keyof T)[]>(
    values: U,
    params?: string | core.$SchemaEnumParams
  ): SchemaEnum<util.Flatten<Pick<T, U[number]>>>;
  exclude<const U extends readonly (keyof T)[]>(
    values: U,
    params?: string | core.$SchemaEnumParams
  ): SchemaEnum<util.Flatten<Omit<T, U[number]>>>;
}
export const SchemaEnum: core.$constructor<SchemaEnum> = /*@__PURE__*/ core.$constructor("SchemaEnum", (inst, def) => {
  core.$SchemaEnum.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.enumProcessor(inst, ctx, json, params);

  inst.enum = def.entries;
  // reuse the parsed value set so a numeric TS enum's reverse-mapping keys stay out
  inst.options = [...inst._schema.values] as util.EnumValue[];

  const keys = new Set(Object.keys(def.entries));

  inst.extract = (values, params) => {
    const newEntries: Record<string, any> = {};
    for (const value of values) {
      if (keys.has(value)) {
        newEntries[value] = def.entries[value];
      } else throw new Error(`Key ${value} not found in enum`);
    }
    return new SchemaEnum({
      ...def,
      checks: [],
      ...util.normalizeParams(params),
      entries: newEntries,
    }) as any;
  };

  inst.exclude = (values, params) => {
    const newEntries: Record<string, any> = { ...def.entries };
    for (const value of values) {
      if (keys.has(value)) {
        delete newEntries[value];
      } else throw new Error(`Key ${value} not found in enum`);
    }
    return new SchemaEnum({
      ...def,
      checks: [],
      ...util.normalizeParams(params),
      entries: newEntries,
    }) as any;
  };
});

function _enum<const T extends readonly string[]>(
  values: T,
  params?: string | core.$SchemaEnumParams
): SchemaEnum<util.ToEnum<T[number]>>;
function _enum<const T extends util.EnumLike>(entries: T, params?: string | core.$SchemaEnumParams): SchemaEnum<T>;
function _enum(values: any, params?: string | core.$SchemaEnumParams) {
  const entries: any = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;

  return new SchemaEnum({
    type: "enum",
    entries,
    ...util.normalizeParams(params),
  }) as any;
}
export { _enum as enum };

/** @deprecated This API has been merged into `Schema.enum()`. Use `Schema.enum()` instead.
 *
 * ```ts
 * enum Colors { red, green, blue }
 * Schema.enum(Colors);
 * ```
 */
export function nativeEnum<T extends util.EnumLike>(entries: T, params?: string | core.$SchemaEnumParams): SchemaEnum<T> {
  return new SchemaEnum({
    type: "enum",
    entries,
    ...util.normalizeParams(params),
  }) as SchemaEnum<T>;
}

// SchemaLiteral
export interface SchemaLiteral<T extends util.Literal = util.Literal>
  extends _SchemaType<core.$SchemaLiteralInternals<T>>,
    core.$SchemaLiteral<T> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  values: Set<T>;
  /** @legacy Use `.values` instead. Accessing this property will throw an error if the literal accepts multiple values. */
  value: T;
}
export const SchemaLiteral: core.$constructor<SchemaLiteral> = /*@__PURE__*/ core.$constructor("SchemaLiteral", (inst, def) => {
  core.$SchemaLiteral.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.literalProcessor(inst, ctx, json, params);
  inst.values = new Set(def.values);
  Object.defineProperty(inst, "value", {
    get() {
      if (def.values.length > 1) {
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      }
      return def.values[0];
    },
  });
});

export function literal<const T extends ReadonlyArray<util.Literal>>(
  value: T,
  params?: string | core.$SchemaLiteralParams
): SchemaLiteral<T[number]>;
export function literal<const T extends util.Literal>(
  value: T,
  params?: string | core.$SchemaLiteralParams
): SchemaLiteral<T>;
export function literal(value: any, params: any) {
  return new SchemaLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...util.normalizeParams(params),
  });
}

// SchemaFile
export interface SchemaFile extends _SchemaType<core.$SchemaFileInternals>, core.$SchemaFile {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  min(size: number, params?: string | core.$SchemaCheckMinSizeParams): this;
  max(size: number, params?: string | core.$SchemaCheckMaxSizeParams): this;
  mime(types: util.MimeTypes | Array<util.MimeTypes>, params?: string | core.$SchemaCheckMimeTypeParams): this;
}
export const SchemaFile: core.$constructor<SchemaFile> = /*@__PURE__*/ core.$constructor("SchemaFile", (inst, def) => {
  core.$SchemaFile.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.fileProcessor(inst, ctx, json, params);

  inst.min = (size, params) => inst.check(core._minSize(size, params));
  inst.max = (size, params) => inst.check(core._maxSize(size, params));
  inst.mime = (types, params) => inst.check(core._mime(Array.isArray(types) ? types : [types], params));
});

export function file(params?: string | core.$SchemaFileParams): SchemaFile {
  return core._file(SchemaFile, params) as any;
}

// SchemaTransform
export interface SchemaTransform<O = unknown, I = unknown>
  extends _SchemaType<core.$SchemaTransformInternals<O, I>>,
    core.$SchemaTransform<O, I> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
}
export const SchemaTransform: core.$constructor<SchemaTransform> = /*@__PURE__*/ core.$constructor(
  "SchemaTransform",
  (inst, def) => {
    _ensureDefaultMemoizer();
    core.$SchemaTransform.init(inst, def);
    SchemaType.init(inst, def);
    inst._schema.processJSONSchema = (ctx, json, params) => processors.transformProcessor(inst, ctx, json, params);

    inst._schema.parse = (payload, _ctx) => {
      if (_ctx.direction === "backward") {
        throw new core.$SchemaEncodeError(inst.constructor.name);
      }

      (payload as core.$RefinementCtx).addIssue = (issue) => {
        if (typeof issue === "string") {
          payload.issues.push(util.issue(issue, payload.value, def));
        } else {
          // for Schema 3 backwards compatibility
          const _issue = issue as any;

          if (_issue.fatal) _issue.continue = false;
          _issue.code ??= "custom";
          if (!("input" in _issue)) _issue.input = payload.value;
          _issue.inst ??= inst;
          // _issue.continue ??= true;
          payload.issues.push(util.issue(_issue));
        }
      };

      const output = def.transform(payload.value, payload);
      if (output instanceof Promise) {
        return output.then((output) => {
          payload.value = output;
          return payload;
        });
      }
      payload.value = output;
      return payload;
    };
  }
);

export function transform<I = unknown, O = I>(
  fn: (input: I, ctx: core.$RefinementCtx) => O
): SchemaTransform<Awaited<O>, I> {
  return new SchemaTransform({
    type: "transform",
    transform: fn as any,
  }) as any;
}

// SchemaOptional
export interface SchemaOptional<T extends core.SomeType = core.$SchemaType>
  extends _SchemaType<core.$SchemaOptionalInternals<T>>,
    core.$SchemaOptional<T> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  unwrap(): T;
}
export const SchemaOptional: core.$constructor<SchemaOptional> = /*@__PURE__*/ core.$constructor(
  "SchemaOptional",
  (inst, def) => {
    core.$SchemaOptional.init(inst, def);
    SchemaType.init(inst, def);
    inst._schema.processJSONSchema = (ctx, json, params) => processors.optionalProcessor(inst, ctx, json, params);

    inst.unwrap = () => inst._schema.def.innerType;
  }
);

export function optional<T extends core.SomeType>(innerType: T): SchemaOptional<T> {
  return new SchemaOptional({
    type: "optional",
    innerType: innerType as any as core.$SchemaType,
  }) as any;
}

// SchemaExactOptional
export interface SchemaExactOptional<T extends core.SomeType = core.$SchemaType>
  extends _SchemaType<core.$SchemaExactOptionalInternals<T>>,
    core.$SchemaExactOptional<T> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  unwrap(): T;
}
export const SchemaExactOptional: core.$constructor<SchemaExactOptional> = /*@__PURE__*/ core.$constructor(
  "SchemaExactOptional",
  (inst, def) => {
    core.$SchemaExactOptional.init(inst, def);
    SchemaType.init(inst, def);
    inst._schema.processJSONSchema = (ctx, json, params) => processors.optionalProcessor(inst, ctx, json, params);

    inst.unwrap = () => inst._schema.def.innerType;
  }
);

export function exactOptional<T extends core.SomeType>(innerType: T): SchemaExactOptional<T> {
  return new SchemaExactOptional({
    type: "optional",
    innerType: innerType as any as core.$SchemaType,
  }) as any;
}

// SchemaNullable
export interface SchemaNullable<T extends core.SomeType = core.$SchemaType>
  extends _SchemaType<core.$SchemaNullableInternals<T>>,
    core.$SchemaNullable<T> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  unwrap(): T;
}
export const SchemaNullable: core.$constructor<SchemaNullable> = /*@__PURE__*/ core.$constructor(
  "SchemaNullable",
  (inst, def) => {
    core.$SchemaNullable.init(inst, def);
    SchemaType.init(inst, def);
    inst._schema.processJSONSchema = (ctx, json, params) => processors.nullableProcessor(inst, ctx, json, params);

    inst.unwrap = () => inst._schema.def.innerType;
  }
);

export function nullable<T extends core.SomeType>(innerType: T): SchemaNullable<T> {
  return new SchemaNullable({
    type: "nullable",
    innerType: innerType as any as core.$SchemaType,
  }) as any;
}

// nullish
export function nullish<T extends core.SomeType>(innerType: T): SchemaOptional<SchemaNullable<T>> {
  return optional(nullable(innerType));
}

// SchemaDefault
export interface SchemaDefault<T extends core.SomeType = core.$SchemaType>
  extends _SchemaType<core.$SchemaDefaultInternals<T>>,
    core.$SchemaDefault<T> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  unwrap(): T;
  /** @deprecated Use `.unwrap()` instead. */
  removeDefault(): T;
}
export const SchemaDefault: core.$constructor<SchemaDefault> = /*@__PURE__*/ core.$constructor("SchemaDefault", (inst, def) => {
  core.$SchemaDefault.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.defaultProcessor(inst, ctx, json, params);

  inst.unwrap = () => inst._schema.def.innerType;
  inst.removeDefault = inst.unwrap;
});

export function _default<T extends core.SomeType>(
  innerType: T,
  defaultValue: util.NoUndefined<core.output<T>> | (() => util.NoUndefined<core.output<T>>)
): SchemaDefault<T> {
  return new SchemaDefault({
    type: "default",
    innerType: innerType as any as core.$SchemaType,
    get defaultValue() {
      return typeof defaultValue === "function" ? (defaultValue as Function)() : util.shallowClone(defaultValue);
    },
  }) as any;
}

// SchemaPrefault
export interface SchemaPrefault<T extends core.SomeType = core.$SchemaType>
  extends _SchemaType<core.$SchemaPrefaultInternals<T>>,
    core.$SchemaPrefault<T> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  unwrap(): T;
}
export const SchemaPrefault: core.$constructor<SchemaPrefault> = /*@__PURE__*/ core.$constructor(
  "SchemaPrefault",
  (inst, def) => {
    core.$SchemaPrefault.init(inst, def);
    SchemaType.init(inst, def);
    inst._schema.processJSONSchema = (ctx, json, params) => processors.prefaultProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._schema.def.innerType;
  }
);

export function prefault<T extends core.SomeType>(
  innerType: T,
  defaultValue: core.input<T> | (() => core.input<T>)
): SchemaPrefault<T> {
  return new SchemaPrefault({
    type: "prefault",
    innerType: innerType as any as core.$SchemaType,
    get defaultValue() {
      return typeof defaultValue === "function" ? (defaultValue as Function)() : util.shallowClone(defaultValue);
    },
  }) as any;
}

// SchemaNonOptional
export interface SchemaNonOptional<T extends core.SomeType = core.$SchemaType>
  extends _SchemaType<core.$SchemaNonOptionalInternals<T>>,
    core.$SchemaNonOptional<T> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  unwrap(): T;
}
export const SchemaNonOptional: core.$constructor<SchemaNonOptional> = /*@__PURE__*/ core.$constructor(
  "SchemaNonOptional",
  (inst, def) => {
    core.$SchemaNonOptional.init(inst, def);
    SchemaType.init(inst, def);
    inst._schema.processJSONSchema = (ctx, json, params) => processors.nonoptionalProcessor(inst, ctx, json, params);

    inst.unwrap = () => inst._schema.def.innerType;
  }
);

export function nonoptional<T extends core.SomeType>(
  innerType: T,
  params?: string | core.$SchemaNonOptionalParams
): SchemaNonOptional<T> {
  return new SchemaNonOptional({
    type: "nonoptional",
    innerType: innerType as any as core.$SchemaType,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaSuccess
export interface SchemaSuccess<T extends core.SomeType = core.$SchemaType>
  extends _SchemaType<core.$SchemaSuccessInternals<T>>,
    core.$SchemaSuccess<T> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  unwrap(): T;
}
export const SchemaSuccess: core.$constructor<SchemaSuccess> = /*@__PURE__*/ core.$constructor("SchemaSuccess", (inst, def) => {
  core.$SchemaSuccess.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.successProcessor(inst, ctx, json, params);

  inst.unwrap = () => inst._schema.def.innerType;
});

export function success<T extends core.SomeType>(innerType: T): SchemaSuccess<T> {
  return new SchemaSuccess({
    type: "success",
    innerType: innerType as any as core.$SchemaType,
  }) as any;
}

// SchemaCatch
export interface SchemaCatch<T extends core.SomeType = core.$SchemaType>
  extends _SchemaType<core.$SchemaCatchInternals<T>>,
    core.$SchemaCatch<T> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  unwrap(): T;
  /** @deprecated Use `.unwrap()` instead. */
  removeCatch(): T;
}
export const SchemaCatch: core.$constructor<SchemaCatch> = /*@__PURE__*/ core.$constructor("SchemaCatch", (inst, def) => {
  core.$SchemaCatch.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.catchProcessor(inst, ctx, json, params);

  inst.unwrap = () => inst._schema.def.innerType;
  inst.removeCatch = inst.unwrap;
});

function _catch<T extends core.SomeType>(
  innerType: T,
  catchValue: core.output<T> | ((ctx: core.$SchemaCatchCtx) => core.output<T>)
): SchemaCatch<T> {
  return new SchemaCatch({
    type: "catch",
    innerType: innerType as any as core.$SchemaType,
    catchValue: (typeof catchValue === "function" ? catchValue : core.util.constantCatch(catchValue)) as (
      ctx: core.$SchemaCatchCtx
    ) => core.output<T>,
  }) as any;
}
export { _catch as catch };

// SchemaNaN
export interface SchemaNaN extends _SchemaType<core.$SchemaNaNInternals>, core.$SchemaNaN {
  "~standard": SchemaStandardSchemaWithJSON<this>;
}
export const SchemaNaN: core.$constructor<SchemaNaN> = /*@__PURE__*/ core.$constructor("SchemaNaN", (inst, def) => {
  core.$SchemaNaN.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.nanProcessor(inst, ctx, json, params);
});

export function nan(params?: string | core.$SchemaNaNParams): SchemaNaN {
  return core._nan(SchemaNaN, params);
}

// SchemaPipe
export interface SchemaPipe<A extends core.SomeType = core.$SchemaType, B extends core.SomeType = core.$SchemaType>
  extends _SchemaType<core.$SchemaPipeInternals<A, B>>,
    core.$SchemaPipe<A, B> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  in: A;
  out: B;
}
export const SchemaPipe: core.$constructor<SchemaPipe> = /*@__PURE__*/ core.$constructor("SchemaPipe", (inst, def) => {
  core.$SchemaPipe.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.pipeProcessor(inst, ctx, json, params);

  inst.in = def.in;
  inst.out = def.out;
});

export function pipe<
  const A extends core.SomeType,
  B extends core.$SchemaType<unknown, core.output<A>> = core.$SchemaType<unknown, core.output<A>>,
>(in_: A, out: B | core.$SchemaType<unknown, core.output<A>>): SchemaPipe<A, B>;
export function pipe(in_: core.SomeType, out: core.SomeType) {
  return new SchemaPipe({
    type: "pipe",
    in: in_ as unknown as core.$SchemaType,
    out: out as unknown as core.$SchemaType,
    // ...util.normalizeParams(params),
  });
}

// SchemaCodec
export interface SchemaCodec<A extends core.SomeType = core.$SchemaType, B extends core.SomeType = core.$SchemaType>
  extends SchemaPipe<A, B>,
    core.$SchemaCodec<A, B> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  _schema: core.$SchemaCodecInternals<A, B>;
  def: core.$SchemaCodecDef<A, B>;
}
export const SchemaCodec: core.$constructor<SchemaCodec> = /*@__PURE__*/ core.$constructor("SchemaCodec", (inst, def) => {
  SchemaPipe.init(inst, def);
  core.$SchemaCodec.init(inst, def);
});

export function codec<const A extends core.SomeType, B extends core.SomeType = core.$SchemaType>(
  in_: A,
  out: B,
  params: {
    decode: (value: core.output<A>, payload: core.ParsePayload<core.output<A>>) => core.util.MaybeAsync<core.input<B>>;
    encode: (value: core.input<B>, payload: core.ParsePayload<core.input<B>>) => core.util.MaybeAsync<core.output<A>>;
  }
): SchemaCodec<A, B> {
  return new SchemaCodec({
    type: "pipe",
    in: in_ as any as core.$SchemaType,
    out: out as any as core.$SchemaType,
    transform: params.decode as any,
    reverseTransform: params.encode as any,
  }) as any;
}

export function invertCodec<A extends core.SomeType, B extends core.SomeType>(codec: SchemaCodec<A, B>): SchemaCodec<B, A> {
  const def = codec._schema.def;
  return new SchemaCodec({
    type: "pipe",
    in: def.out as any,
    out: def.in as any,
    transform: def.reverseTransform as any,
    reverseTransform: def.transform as any,
  }) as any;
}

// SchemaPreprocess
export interface SchemaPreprocess<B extends core.SomeType = core.$SchemaType, I = unknown>
  extends SchemaPipe<core.$SchemaTransform<unknown, I>, B>,
    core.$SchemaPreprocess<B, I> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  _schema: core.$SchemaPreprocessInternals<B, I>;
  def: core.$SchemaPreprocessDef<B, I>;
}
export const SchemaPreprocess: core.$constructor<SchemaPreprocess> = /*@__PURE__*/ core.$constructor(
  "SchemaPreprocess",
  (inst, def) => {
    SchemaPipe.init(inst, def);
    core.$SchemaPreprocess.init(inst, def);
  }
);

// SchemaReadonly
export interface SchemaReadonly<T extends core.SomeType = core.$SchemaType>
  extends _SchemaType<core.$SchemaReadonlyInternals<T>>,
    core.$SchemaReadonly<T> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  unwrap(): T;
}
export const SchemaReadonly: core.$constructor<SchemaReadonly> = /*@__PURE__*/ core.$constructor(
  "SchemaReadonly",
  (inst, def) => {
    core.$SchemaReadonly.init(inst, def);
    SchemaType.init(inst, def);
    inst._schema.processJSONSchema = (ctx, json, params) => processors.readonlyProcessor(inst, ctx, json, params);

    inst.unwrap = () => inst._schema.def.innerType;
  }
);

export function readonly<T extends core.SomeType>(innerType: T): SchemaReadonly<T> {
  return new SchemaReadonly({
    type: "readonly",
    innerType: innerType as any as core.$SchemaType,
  }) as any;
}

// SchemaTemplateLiteral
export interface SchemaTemplateLiteral<Template extends string = string>
  extends _SchemaType<core.$SchemaTemplateLiteralInternals<Template>>,
    core.$SchemaTemplateLiteral<Template> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
}
export const SchemaTemplateLiteral: core.$constructor<SchemaTemplateLiteral> = /*@__PURE__*/ core.$constructor(
  "SchemaTemplateLiteral",
  (inst, def) => {
    core.$SchemaTemplateLiteral.init(inst, def);
    SchemaType.init(inst, def);
    inst._schema.processJSONSchema = (ctx, json, params) => processors.templateLiteralProcessor(inst, ctx, json, params);
  }
);

export function templateLiteral<const Parts extends core.$SchemaTemplateLiteralPart[]>(
  parts: Parts,
  params?: string | core.$SchemaTemplateLiteralParams
): SchemaTemplateLiteral<core.$PartsToTemplateLiteral<Parts>> {
  return new SchemaTemplateLiteral({
    type: "template_literal",
    parts,
    ...util.normalizeParams(params),
  }) as any;
}

// SchemaLazy
export interface SchemaLazy<T extends core.SomeType = core.$SchemaType>
  extends _SchemaType<core.$SchemaLazyInternals<T>>,
    core.$SchemaLazy<T> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  unwrap(): T;
}
export const SchemaLazy: core.$constructor<SchemaLazy> = /*@__PURE__*/ core.$constructor("SchemaLazy", (inst, def) => {
  core.$SchemaLazy.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.lazyProcessor(inst, ctx, json, params);

  inst.unwrap = () => inst._schema.def.getter();
});

export function lazy<T extends core.SomeType>(getter: () => T): SchemaLazy<T> {
  return new SchemaLazy({
    type: "lazy",
    getter: getter as any,
  }) as any;
}

// SchemaPromise
export interface SchemaPromise<T extends core.SomeType = core.$SchemaType>
  extends _SchemaType<core.$SchemaPromiseInternals<T>>,
    core.$SchemaPromise<T> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  unwrap(): T;
}
export const SchemaPromise: core.$constructor<SchemaPromise> = /*@__PURE__*/ core.$constructor("SchemaPromise", (inst, def) => {
  core.$SchemaPromise.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.promiseProcessor(inst, ctx, json, params);

  inst.unwrap = () => inst._schema.def.innerType;
});

export function promise<T extends core.SomeType>(innerType: T): SchemaPromise<T> {
  return new SchemaPromise({
    type: "promise",
    innerType: innerType as any as core.$SchemaType,
  }) as any;
}

// SchemaFunction
export interface SchemaFunction<
  Args extends core.$SchemaFunctionIn = core.$SchemaFunctionIn,
  Returns extends core.$SchemaFunctionOut = core.$SchemaFunctionOut,
> extends _SchemaType<core.$SchemaFunctionInternals<Args, Returns>>,
    core.$SchemaFunction<Args, Returns> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
  _def: core.$SchemaFunctionDef<Args, Returns>;
  _input: core.$InferInnerFunctionType<Args, Returns>;
  _output: core.$InferOuterFunctionType<Args, Returns>;

  input<const Items extends util.TupleItems, const Rest extends core.$SchemaFunctionOut = core.$SchemaFunctionOut>(
    args: Items,
    rest?: Rest
  ): SchemaFunction<core.$SchemaTuple<Items, Rest>, Returns>;
  input<NewArgs extends core.$SchemaFunctionIn>(args: NewArgs): SchemaFunction<NewArgs, Returns>;
  input(...args: any[]): SchemaFunction<any, Returns>;

  output<NewReturns extends core.$SchemaType>(output: NewReturns): SchemaFunction<Args, NewReturns>;
}

export const SchemaFunction: core.$constructor<SchemaFunction> = /*@__PURE__*/ core.$constructor(
  "SchemaFunction",
  (inst, def) => {
    core.$SchemaFunction.init(inst, def);
    SchemaType.init(inst, def);
    inst._schema.processJSONSchema = (ctx, json, params) => processors.functionProcessor(inst, ctx, json, params);
  }
);

export function _function(): SchemaFunction;
export function _function<const In extends ReadonlyArray<core.$SchemaType>>(params: {
  input: In;
}): SchemaFunction<SchemaTuple<In, null>, core.$SchemaFunctionOut>;
export function _function<
  const In extends ReadonlyArray<core.$SchemaType>,
  const Out extends core.$SchemaFunctionOut = core.$SchemaFunctionOut,
>(params: {
  input: In;
  output: Out;
}): SchemaFunction<SchemaTuple<In, null>, Out>;
export function _function<const In extends core.$SchemaFunctionIn = core.$SchemaFunctionIn>(params: {
  input: In;
}): SchemaFunction<In, core.$SchemaFunctionOut>;
export function _function<const Out extends core.$SchemaFunctionOut = core.$SchemaFunctionOut>(params: {
  output: Out;
}): SchemaFunction<core.$SchemaFunctionIn, Out>;
export function _function<
  In extends core.$SchemaFunctionIn = core.$SchemaFunctionIn,
  Out extends core.$SchemaType = core.$SchemaType,
>(params?: {
  input: In;
  output: Out;
}): SchemaFunction<In, Out>;
export function _function(params?: {
  output?: core.$SchemaType;
  input?: core.$SchemaFunctionArgs | Array<core.$SchemaType>;
}): SchemaFunction {
  return new SchemaFunction({
    type: "function",
    input: Array.isArray(params?.input) ? tuple(params?.input as any) : (params?.input ?? array(unknown())),
    output: params?.output ?? unknown(),
  });
}

export { _function as function };

// SchemaCustom
export interface SchemaCustom<O = unknown, I = unknown>
  extends _SchemaType<core.$SchemaCustomInternals<O, I>>,
    core.$SchemaCustom<O, I> {
  "~standard": SchemaStandardSchemaWithJSON<this>;
}
export const SchemaCustom: core.$constructor<SchemaCustom> = /*@__PURE__*/ core.$constructor("SchemaCustom", (inst, def) => {
  core.$SchemaCustom.init(inst, def);
  SchemaType.init(inst, def);
  inst._schema.processJSONSchema = (ctx, json, params) => processors.customProcessor(inst, ctx, json, params);
});

// custom checks
export function check<O = unknown>(fn: core.CheckFn<O>): core.$SchemaCheck<O> {
  const ch = new core.$SchemaCheck({
    check: "custom",
    // ...util.normalizeParams(params),
  });

  ch._schema.check = fn;
  return ch;
}

export function custom<O>(
  fn?: (data: unknown) => unknown,
  _params?: string | core.$SchemaCustomParams | undefined
): SchemaCustom<O, O> {
  return core._custom(SchemaCustom, fn ?? (() => true), _params) as any;
}

export function refine<T>(
  fn: (arg: NoInfer<T>) => util.MaybeAsync<unknown>,
  _params: string | core.$SchemaCustomParams = {}
): core.$SchemaCheck<T> {
  return core._refine(SchemaCustom, fn, _params);
}

// superRefine
export function superRefine<T>(
  fn: (arg: T, payload: core.$RefinementCtx<T>) => void | Promise<void>,
  params?: core.$SchemaSuperRefineParams
): core.$SchemaCheck<T> {
  return core._superRefine(fn, params);
}

// Re-export describe and meta from core
export const describe = core.describe;
export const meta = core.meta;

type SchemaInstanceOfParams = core.Params<
  SchemaCustom,
  core.$SchemaIssueCustom,
  "type" | "check" | "checks" | "fn" | "abort" | "error" | "params" | "path"
>;

// SchemaInstanceOf
export interface SchemaInstanceOf<T = unknown> extends SchemaCustom<T, T> {
  // the shape is keyed off the instance type, so keys autocomplete and a schema that can't accept the property's type is an error. Methods are excluded: every object literal inherits Object.prototype.toString, which would otherwise collide with the constraint's own toString entry and reject every shape.
  properties<Shape extends { [k in keyof T as T[k] extends Function ? never : k]?: core.$SchemaType<unknown, T[k]> }>(
    shape: Shape,
    params?: string | core.$SchemaCheckPropertiesParams
  ): SchemaInstanceOf<T & core.$InferObjectInput<Shape, {}>>;
}
export const SchemaInstanceOf: core.$constructor<SchemaInstanceOf> = /*@__PURE__*/ core.$constructor(
  "SchemaInstanceOf",
  (inst, def) => {
    SchemaCustom.init(inst, def);
  },
  {
    properties(shape: core.$SchemaShape, params?: string | core.$SchemaCheckPropertiesParams) {
      // asserts in place, so the narrowed output type is truthful without a wrapper
      return this.check(core._properties(shape, params)) as any;
    },
  }
);

function _instanceof<T extends typeof util.Class>(
  cls: T,
  params: SchemaInstanceOfParams = {}
): SchemaInstanceOf<InstanceType<T>> {
  const inst = new SchemaInstanceOf({
    type: "custom",
    check: "custom",
    fn: (data: unknown) => data instanceof cls,
    abort: true,
    ...(util.normalizeParams(params) as any),
  });
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
export const stringbool: (_params?: string | core.$SchemaStringBoolParams) => SchemaCodec<SchemaString, SchemaBoolean> = (
  ...args
) =>
  core._stringbool(
    {
      Codec: SchemaCodec,
      Boolean: SchemaBoolean,
      String: SchemaString,
    },
    ...args
  ) as any;

// json
type _SchemaJSONSchema = SchemaUnion<
  [SchemaString, SchemaNumber, SchemaBoolean, SchemaNull, SchemaArray<SchemaJSONSchema>, SchemaRecord<SchemaString, SchemaJSONSchema>]
>;
type _SchemaJSONSchemaInternals = _SchemaJSONSchema["_schema"];

export interface SchemaJSONSchemaInternals extends _SchemaJSONSchemaInternals {
  output: util.JSONType;
  input: util.JSONType;
}
export interface SchemaJSONSchema extends _SchemaJSONSchema {
  _schema: SchemaJSONSchemaInternals;
}

export function json(params?: string | core.$SchemaCustomParams): SchemaJSONSchema {
  const jsonSchema: any = lazy(() => {
    return union([string(params), number(), boolean(), _null(), array(jsonSchema), record(string(), jsonSchema)]);
  });

  return jsonSchema;
}

// preprocess

export function preprocess<A, U extends core.SomeType, B = unknown>(
  fn: (arg: B, ctx: core.$RefinementCtx) => A,
  schema: U
): SchemaPreprocess<U, B> {
  return new SchemaPreprocess({
    type: "pipe",
    in: transform(fn as any) as any as core.$SchemaTransform,
    out: schema as any as core.$SchemaType,
  }) as any;
}
