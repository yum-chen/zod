import * as checks from "./checks.js";
import type { $SchemaNumberFormats } from "./checks.js";
import type { $SchemaBigIntFormats } from "./checks.js";
import * as core from "./core.js";
import { Doc } from "./doc.js";
import type * as errors from "./errors.js";
import type * as JSONSchema from "./json-Schema.js";
import { parse, parseAsync } from "./parse.js";
import * as regexes from "./regexes.js";
import type { StandardSchemaV1 } from "./standard-Schema.js";
import type { ProcessParams, ToJSONSchemaContext } from "./to-json-Schema.js";
import * as util from "./util.js";
import { version } from "./versions.js";

/////////////////////////////   PARSE   //////////////////////////////

export interface ParseContext<T extends errors.$SchemaIssueBase = never> {
  /** Customize error messages. */
  readonly error?: errors.$SchemaErrorMap<T>;
  /** Include the `input` field in issue objects. Default `false`. */
  readonly reportInput?: boolean;
  /** Skip eval-based fast path. Default `false`. */
  readonly jitless?: boolean;
  /** Abort validation after the first error. Default `false`. */
  // readonly abortEarly?: boolean;
}

/** @internal */
export interface ParseContextInternal<T extends errors.$SchemaIssueBase = never> extends ParseContext<T> {
  readonly async?: boolean | undefined;
  readonly direction?: "forward" | "backward";
  readonly skipChecks?: boolean;
  /** Set only by `validate`/`validateAsync`. A container may stop before its next child, never inside one, so a map entry and a tuple's fixed items parse whole. */
  readonly abortEarly?: boolean;
}

/** Gives a container cycle support: `attach` wraps its parse, and `alloc` registers the object it builds into before any child is parsed so a reference back to the same input resolves to it. */
export interface $SchemaMemoizer {
  attach(inst: $SchemaType): void;
  guard(inst: $SchemaType): void;
  alloc<T extends object>(inst: $SchemaType, payload: ParsePayload, empty: T, ctx: ParseContextInternal): T;
}

export interface ParsePayload<T = unknown> {
  value: T;
  issues: errors.$SchemaRawIssue[];
  /** A way to mark a whole payload as aborted. Used in codecs/pipes. */
  aborted?: boolean;
  /** @internal Set when the value came from a repeat visit to a node still being
   * parsed. Its checks run on the node itself, against the finished value. */
  memo?: boolean | undefined;
}

export type CheckFn<T> = (input: ParsePayload<T>) => util.MaybeAsync<void>;

/////////////////////////////   SCHEMAS   //////////////////////////////

export interface $SchemaTypeDef {
  type:
    | "string"
    | "number"
    | "int"
    | "boolean"
    | "bigint"
    | "symbol"
    | "null"
    | "undefined"
    | "void" // merge with undefined?
    | "never"
    | "any"
    | "unknown"
    | "date"
    | "object"
    | "record"
    | "file"
    | "array"
    | "tuple"
    | "union"
    | "intersection"
    | "map"
    | "set"
    | "enum"
    | "literal"
    | "nullable"
    | "optional"
    | "nonoptional"
    | "success"
    | "transform"
    | "default"
    | "prefault"
    | "catch"
    | "nan"
    | "pipe"
    | "readonly"
    | "template_literal"
    | "promise"
    | "lazy"
    | "function"
    | "custom";
  error?: errors.$SchemaErrorMap<never> | undefined;
  checks?: checks.$SchemaCheck<never>[];
}

export interface _$SchemaTypeInternals {
  /** The `@schema/core` version of this schema */
  version: typeof version;

  /** Schema definition. */
  def: $SchemaTypeDef;
  // types: Types;

  /** @internal Randomly generated ID for this Schema. */
  // id: string;

  /** @internal List of deferred initializers. */
  deferred: util.AnyFunc[] | undefined;

  /** @internal Parses input and runs all checks (refinements). */
  run(payload: ParsePayload<any>, ctx: ParseContextInternal): util.MaybeAsync<ParsePayload>;

  /** @internal Parses input, doesn't run checks. */
  parse(payload: ParsePayload<any>, ctx: ParseContextInternal): util.MaybeAsync<ParsePayload>;

  /** @internal  Stores identifiers for the set of traits implemented by this Schema. */
  traits: Set<string>;

  /** @internal Indicates that a schema output type should be considered optional inside objects.
   * @default Required
   */

  /** @internal Three rungs, each strictly stronger than the last:
   *   undefined    — required; the container may not omit this slot
   *   "optional"   — the container may omit it; nothing is supplied in its place
   *   "defaulted"  — the container may omit it AND this schema substitutes a value
   * Consumers asking "may the slot be absent?" test `!== undefined`.
   * $SchemaOptional asks the stronger question and tests `=== "defaulted"`. */
  optin?: "optional" | "defaulted" | undefined;
  /** @internal */
  optout?: "optional" | undefined;

  /** @internal The set of literal values that will pass validation. Must be an exhaustive set. Used to determine optionality in Schema.record().
   *
   * Defined on: enum, const, literal, null, undefined
   * Passthrough: optional, nullable, branded, default, catch, pipe
   * Todo: unions?
   */
  values?: util.PrimitiveSet | undefined;

  /** Default value bubbled up from  */
  // default?: unknown | undefined;

  /** @internal A set of literal discriminators used for the fast path in discriminated unions. */
  propValues?: util.PropValues | undefined;

  /** @internal This flag indicates that a schema validation can be represented with a regular expression. Used to determine allowable schemas in Schema.templateLiteral(). */
  pattern: RegExp | undefined;

  /** @internal The constructor function of this Schema. */
  constr: new (
    def: any
  ) => $SchemaType;

  /** @internal A catchall object for bag metadata related to this Schema. Commonly modified by checks using `onattach`. */
  bag: Record<string, unknown>;

  /** @internal The set of issues this schema might throw during type checking. */
  isst: errors.$SchemaIssueBase;

  /** @internal Subject to change, not a public API. */
  processJSONSchema?:
    | ((ctx: ToJSONSchemaContext, json: JSONSchema.BaseSchema, params: ProcessParams) => void)
    | undefined;

  /** An optional method used to override `toJSONSchema` logic. */
  toJSONSchema?: () => unknown;

  /** @internal The parent of this Schema. Only set during certain clone operations. */
  parent?: $SchemaType | undefined;
}
/** @internal */
export interface $SchemaTypeInternals<out O = unknown, out I = unknown> extends _$SchemaTypeInternals {
  /** @internal The inferred output type */
  output: O; //extends { $out: infer O } ? O : Out;
  /** @internal The inferred input type */
  input: I; //extends { $in: infer I } ? I : In;
}

export type $SchemaStandardSchema<T> = StandardSchemaV1.Props<core.input<T>, core.output<T>>;

export type SomeType = { _schema: _$SchemaTypeInternals };

export interface $SchemaType<
  O = unknown,
  I = unknown,
  Internals extends $SchemaTypeInternals<O, I> = $SchemaTypeInternals<O, I>,
> {
  _schema: Internals;
  "~standard": $SchemaStandardSchema<this>;
}
export interface _$SchemaType<T extends $SchemaTypeInternals = $SchemaTypeInternals>
  extends $SchemaType<T["output"], T["input"], T> {}

export const $SchemaType: core.$constructor<$SchemaType> = /*@__PURE__*/ core.$constructor<$SchemaType>(
  "$SchemaType",
  (inst, def) => {
    inst ??= {} as any;

    inst._schema.def = def; // set _def property
    inst._schema.bag = inst._schema.bag || {}; // initialize _bag object
    inst._schema.version = version;

    const defChecks = inst._schema.def.checks;
    // if inst is itself a checks.$SchemaCheck, run it as a check
    const checks: checks.$SchemaCheck<never>[] = inst._schema.traits.has("$SchemaCheck")
      ? [inst as any, ...(defChecks ?? [])]
      : defChecks?.length
        ? [...defChecks]
        : [];

    for (const ch of checks) {
      for (const fn of ch._schema.onattach) {
        fn(inst);
      }
    }

    if (checks.length === 0) {
      // deferred initializer inst._schema.parse is not yet defined
      inst._schema.deferred ??= [];
      inst._schema.deferred?.push(() => {
        inst._schema.run = inst._schema.parse;
      });
    } else {
      const runChecks = (
        payload: ParsePayload,
        checks: checks.$SchemaCheck<never>[],
        ctx?: ParseContextInternal | undefined
      ): util.MaybeAsync<ParsePayload> => {
        if (payload.memo) return payload;

        let isAborted = util.aborted(payload);

        let asyncResult!: Promise<unknown> | undefined;
        for (const ch of checks) {
          if (ch._schema.def.when) {
            if (util.explicitlyAborted(payload)) continue;
            const shouldRun = ch._schema.def.when(payload);
            if (!shouldRun) continue;
          } else if (isAborted) {
            continue;
          }
          const currLen = payload.issues.length;
          const _ = ch._schema.check(payload as any) as any as ParsePayload;

          if (_ instanceof Promise && ctx?.async === false) {
            throw new core.$SchemaAsyncError();
          }
          if (asyncResult || _ instanceof Promise) {
            asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
              await _;
              const nextLen = payload.issues.length;
              if (nextLen === currLen) return;
              util.attachSchema(payload.issues, currLen, inst);
              if (!isAborted) isAborted = util.aborted(payload, currLen);
            });
          } else {
            const nextLen = payload.issues.length;
            if (nextLen === currLen) continue;
            util.attachSchema(payload.issues, currLen, inst);
            if (!isAborted) isAborted = util.aborted(payload, currLen);
          }
        }

        if (asyncResult) {
          return asyncResult.then(() => {
            return payload;
          });
        }
        return payload;
      };

      const handleCanaryResult = (canary: ParsePayload, payload: ParsePayload, ctx: ParseContextInternal) => {
        // abort if the canary is aborted
        if (util.aborted(canary)) {
          canary.aborted = true;
          return canary;
        }

        // run checks first, then
        const checkResult = runChecks(payload, checks, ctx);
        if (checkResult instanceof Promise) {
          if (ctx.async === false) throw new core.$SchemaAsyncError();
          return checkResult.then((checkResult) => inst._schema.parse(checkResult, ctx));
        }
        return inst._schema.parse(checkResult, ctx);
      };

      inst._schema.run = (payload, ctx) => {
        if (ctx.skipChecks) {
          return inst._schema.parse(payload, ctx);
        }
        if (ctx.direction === "backward") {
          // run canary initial pass (no checks)
          const canary = inst._schema.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });

          if (canary instanceof Promise) {
            return canary.then((canary) => {
              return handleCanaryResult(canary, payload, ctx);
            });
          }

          return handleCanaryResult(canary, payload, ctx);
        }

        // forward
        const result = inst._schema.parse(payload, ctx);
        if (result instanceof Promise) {
          if (ctx.async === false) throw new core.$SchemaAsyncError();
          return result.then((result) => runChecks(result, checks, ctx));
        }

        return runChecks(result, checks, ctx);
      };
    }
  },
  {
    // Wrappers extend this by installing a richer factory over it; reading it eagerly would defeat the laziness.
    get "~standard"(): StandardSchemaV1.Props<any, any> {
      return util.hide(this, "~standard", standardProps(this));
    },
    set "~standard"(value: StandardSchemaV1.Props<any, any>) {
      util.own(this, "~standard", value);
    },
  }
);

/** The Standard Schema surface for `inst`. Shared so wrappers can extend it without forcing it. */
// a Standard Schema result only reports issues, so a failure finalizes them straight off the raw payload: no SchemaError, and no lazy result to read through
const toStandardResult = (r: ParsePayload, ctx: ParseContextInternal) =>
  r.issues.length ? { issues: r.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())) } : { value: r.value };

async function validateAsync(inst: $SchemaType, value: unknown) {
  const ctx: ParseContextInternal = { async: true };
  return toStandardResult((await inst._schema.run({ value, issues: [] }, ctx)) as ParsePayload, ctx);
}

export function standardProps(inst: $SchemaType): StandardSchemaV1.Props<any, any> {
  return {
    validate: (value: unknown) => {
      const ctx: ParseContextInternal = { async: false };
      try {
        const r = inst._schema.run({ value, issues: [] }, ctx);
        if (!(r instanceof Promise)) return toStandardResult(r, ctx);
      } catch (_) {}
      // async function so a synchronously throwing check rejects instead of escaping validate
      return validateAsync(inst, value);
    },
    vendor: "schema",
    version: 1 as const,
  };
}

export { clone } from "./util.js";

//////////////////////////////////////////
//////////////////////////////////////////
//////////                      //////////
//////////      $SchemaString      //////////
//////////                      //////////
//////////////////////////////////////////
//////////////////////////////////////////
export interface $SchemaStringDef extends $SchemaTypeDef {
  type: "string";
  coerce?: boolean;
  checks?: checks.$SchemaCheck<string>[];
}

export interface $SchemaStringInternals<Input> extends $SchemaTypeInternals<string, Input> {
  def: $SchemaStringDef;
  /** @deprecated Internal API, use with caution (not deprecated) */
  pattern: RegExp;

  /** @deprecated Internal API, use with caution (not deprecated) */
  isst: errors.$SchemaIssueInvalidType;
  bag: util.LoosePartial<{
    minimum: number;
    maximum: number;
    patterns: Set<RegExp>;
    format: string;
    contentEncoding: string;
    /** the pattern admits strings its `format` keyword forbids, so `toJSONSchema` must not emit it */
    laxFormat: boolean;
  }>;
}

export interface $SchemaString<Input = unknown> extends _$SchemaType<$SchemaStringInternals<Input>> {
  // _schema: $SchemaStringInternals<Input>;
}

export const $SchemaString: core.$constructor<$SchemaString> = /*@__PURE__*/ core.$constructor("$SchemaString", (inst, def) => {
  $SchemaType.init(inst, def);
  // a format's own pattern, else unbounded; a template literal derives the check-aware form itself
  inst._schema.pattern = (def as $SchemaStringFormatDef).pattern ?? regexes.anyString;
  inst._schema.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_) {}

    if (typeof payload.value === "string") return payload;

    payload.issues.push({
      expected: "string",
      code: "invalid_type",

      input: payload.value,
      inst,
    });
    return payload;
  };
});

//////////////////////////////   SchemaStringFormat   //////////////////////////////

export interface $SchemaStringFormatDef<Format extends string = string>
  extends $SchemaStringDef,
    checks.$SchemaCheckStringFormatDef<Format> {}

export interface $SchemaStringFormatInternals<Format extends string = string>
  extends $SchemaStringInternals<string>,
    checks.$SchemaCheckStringFormatInternals {
  def: $SchemaStringFormatDef<Format>;
}
export interface $SchemaStringFormat<Format extends string = string> extends $SchemaType {
  _schema: $SchemaStringFormatInternals<Format>;
}

export const $SchemaStringFormat: core.$constructor<$SchemaStringFormat> = /*@__PURE__*/ core.$constructor(
  "$SchemaStringFormat",
  (inst, def): void => {
    // check initialization must come first
    checks.$SchemaCheckStringFormat.init(inst, def);
    $SchemaString.init(inst, def);
  }
);

//////////////////////////////   SchemaGUID   //////////////////////////////
export interface $SchemaGUIDDef extends $SchemaStringFormatDef<"guid"> {}
export interface $SchemaGUIDInternals extends $SchemaStringFormatInternals<"guid"> {}

export interface $SchemaGUID extends $SchemaType {
  _schema: $SchemaGUIDInternals;
}

export const $SchemaGUID: core.$constructor<$SchemaGUID> = /*@__PURE__*/ core.$constructor("$SchemaGUID", (inst, def): void => {
  def.pattern ??= regexes.guid;
  $SchemaStringFormat.init(inst, def);
});

//////////////////////////////   SchemaUUID   //////////////////////////////

export interface $SchemaUUIDDef extends $SchemaStringFormatDef<"uuid"> {
  version?: "v1" | "v2" | "v3" | "v4" | "v5" | "v6" | "v7" | "v8";
}

export interface $SchemaUUIDInternals extends $SchemaStringFormatInternals<"uuid"> {
  def: $SchemaUUIDDef;
}

export interface $SchemaUUID extends $SchemaType {
  _schema: $SchemaUUIDInternals;
}

export const $SchemaUUID: core.$constructor<$SchemaUUID> = /*@__PURE__*/ core.$constructor("$SchemaUUID", (inst, def): void => {
  if (def.version) {
    const versionMap: Record<string, number> = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8,
    };
    const v = versionMap[def.version];
    if (v === undefined) throw new Error(`Invalid UUID version: "${def.version}"`);
    def.pattern ??= regexes.uuid(v);
  } else def.pattern ??= regexes.uuid();
  $SchemaStringFormat.init(inst, def);
});

//////////////////////////////   SchemaEmail   //////////////////////////////

export interface $SchemaEmailDef extends $SchemaStringFormatDef<"email"> {}
export interface $SchemaEmailInternals extends $SchemaStringFormatInternals<"email"> {}
export interface $SchemaEmail extends $SchemaType {
  _schema: $SchemaEmailInternals;
}

export const $SchemaEmail: core.$constructor<$SchemaEmail> = /*@__PURE__*/ core.$constructor(
  "$SchemaEmail",
  (inst, def): void => {
    def.pattern ??= regexes.email;
    $SchemaStringFormat.init(inst, def);
  }
);

//////////////////////////////   SchemaURL   //////////////////////////////

export interface $SchemaURLDef extends $SchemaStringFormatDef<"url"> {
  hostname?: RegExp | undefined;
  protocol?: RegExp | undefined;
  normalize?: boolean | undefined;
}
export interface $SchemaURLInternals extends $SchemaStringFormatInternals<"url"> {
  def: $SchemaURLDef;
}

export interface $SchemaURL extends $SchemaType {
  _schema: $SchemaURLInternals;
}

/** The `://` guard rejected the input before the URL constructor saw it. */
export const URL_BAD_FORMAT = 1;
/** The URL parser rejected the input. */
export const URL_UNPARSEABLE = 2;

export function canParseURL(input: string): boolean {
  try {
    if (typeof URL !== "undefined" && typeof URL.canParse === "function") return URL.canParse(input);
    new URL(input);
    return true;
  } catch {
    return false;
  }
}

export function validateURL(
  trimmed: string,
  def: Pick<$SchemaURLDef, "protocol" | "hostname" | "normalize">
): URL | true | typeof URL_BAD_FORMAT | typeof URL_UNPARSEABLE {
  if (!("normalize" in def) && !("hostname" in def) && !("protocol" in def)) {
    return canParseURL(trimmed) || URL_UNPARSEABLE;
  }
  return parseURLObject(trimmed, def);
}

/** Parses a URL while preserving the non-normalizing HTTP guard. */
export function parseURLObject(
  trimmed: string,
  def: Pick<$SchemaURLDef, "protocol" | "normalize">
): URL | typeof URL_BAD_FORMAT | typeof URL_UNPARSEABLE {
  // When normalize is off, require :// for http/https URLs. This prevents strings like "http:example.com" or "https:/path" from being silently accepted
  if (!def.normalize && def.protocol?.source === regexes.httpProtocol.source && !/^https?:\/\//i.test(trimmed)) {
    return URL_BAD_FORMAT;
  }

  try {
    if (typeof URL !== "undefined") {
      const URLStatic = URL as typeof URL & { parse?: (input: string) => URL | null };
      if (typeof URLStatic.parse === "function") return URLStatic.parse(trimmed) ?? URL_UNPARSEABLE;
    }
    // @ts-ignore
    return new URL(trimmed);
  } catch {
    return URL_UNPARSEABLE;
  }
}

const asciiTabOrNewline = /[\t\n\r]/g;

/** The URL parser deletes every ASCII tab, LF and CR from its input before it parses, so `new URL("https://exa\nmple.com")` reports on `example.com`. Applying the same deletion to the returned value closes the half of that divergence which can move the host; the parser's other rewrite, stripping C0 controls at the edges, cannot. */
export function stripTabAndNewline(value: string): string {
  return value.replace(asciiTabOrNewline, "");
}

export function urlHostnameOk(url: URL, hostname: RegExp): boolean {
  hostname.lastIndex = 0;
  return hostname.test(url.hostname);
}

export function urlProtocolOk(url: URL, protocol: RegExp): boolean {
  protocol.lastIndex = 0;
  return protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol);
}

export const $SchemaURL: core.$constructor<$SchemaURL> = /*@__PURE__*/ core.$constructor("$SchemaURL", (inst, def) => {
  $SchemaStringFormat.init(inst, def);
  inst._schema.check = (payload) => {
    try {
      // Trim whitespace from input
      const trimmed = payload.value.trim();
      const url = validateURL(trimmed, def);

      if (url === URL_BAD_FORMAT) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid URL format",
          input: payload.value,
          inst,
          continue: !def.abort,
        });
        return;
      }

      if (url === URL_UNPARSEABLE) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          input: payload.value,
          inst,
          continue: !def.abort,
        });
        return;
      }

      if (url === true) {
        payload.value = stripTabAndNewline(trimmed);
        return;
      }

      if (def.hostname && !urlHostnameOk(url, def.hostname)) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid hostname",
          pattern: def.hostname.source,
          input: payload.value,
          inst,
          continue: !def.abort,
        });
      }

      if (def.protocol && !urlProtocolOk(url, def.protocol)) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid protocol",
          pattern: def.protocol.source,
          input: payload.value,
          inst,
          continue: !def.abort,
        });
      }

      // Set the output value based on normalize flag
      payload.value = def.normalize ? url.href : stripTabAndNewline(trimmed);

      return;
    } catch (_) {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort,
      });
    }
  };
});

//////////////////////////////   SchemaEmoji   //////////////////////////////

export interface $SchemaEmojiDef extends $SchemaStringFormatDef<"emoji"> {}
export interface $SchemaEmojiInternals extends $SchemaStringFormatInternals<"emoji"> {}

export interface $SchemaEmoji extends $SchemaType {
  _schema: $SchemaEmojiInternals;
}

export const $SchemaEmoji: core.$constructor<$SchemaEmoji> = /*@__PURE__*/ core.$constructor(
  "$SchemaEmoji",
  (inst, def): void => {
    def.pattern ??= regexes.emoji();
    $SchemaStringFormat.init(inst, def);
  }
);

//////////////////////////////   SchemaNanoID   //////////////////////////////

export interface $SchemaNanoIDDef extends $SchemaStringFormatDef<"nanoid"> {
  length?: number | undefined;
}
export interface $SchemaNanoIDInternals extends $SchemaStringFormatInternals<"nanoid"> {
  def: $SchemaNanoIDDef;
}

export interface $SchemaNanoID extends $SchemaType {
  _schema: $SchemaNanoIDInternals;
}

export const $SchemaNanoID: core.$constructor<$SchemaNanoID> = /*@__PURE__*/ core.$constructor(
  "$SchemaNanoID",
  (inst, def): void => {
    if (def.length !== undefined && (!Number.isInteger(def.length) || def.length < 1))
      throw new Error(`Invalid nanoid length: ${def.length}`);
    def.pattern ??= def.length === undefined ? regexes.nanoid : regexes.nanoidOfLength(def.length);
    $SchemaStringFormat.init(inst, def);
  }
);

//////////////////////////////   SchemaCUID   //////////////////////////////

/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link $SchemaCUID2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
export interface $SchemaCUIDDef extends $SchemaStringFormatDef<"cuid"> {}
/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link $SchemaCUID2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
export interface $SchemaCUIDInternals extends $SchemaStringFormatInternals<"cuid"> {}

/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link $SchemaCUID2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
export interface $SchemaCUID extends $SchemaType {
  _schema: $SchemaCUIDInternals;
}

/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link $SchemaCUID2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
export const $SchemaCUID: core.$constructor<$SchemaCUID> = /*@__PURE__*/ core.$constructor("$SchemaCUID", (inst, def): void => {
  def.pattern ??= regexes.cuid;
  $SchemaStringFormat.init(inst, def);
});

//////////////////////////////   SchemaCUID2   //////////////////////////////

export interface $SchemaCUID2Def extends $SchemaStringFormatDef<"cuid2"> {}
export interface $SchemaCUID2Internals extends $SchemaStringFormatInternals<"cuid2"> {}

export interface $SchemaCUID2 extends $SchemaType {
  _schema: $SchemaCUID2Internals;
}

export const $SchemaCUID2: core.$constructor<$SchemaCUID2> = /*@__PURE__*/ core.$constructor(
  "$SchemaCUID2",
  (inst, def): void => {
    def.pattern ??= regexes.cuid2;
    $SchemaStringFormat.init(inst, def);
  }
);

//////////////////////////////   SchemaULID   //////////////////////////////

export interface $SchemaULIDDef extends $SchemaStringFormatDef<"ulid"> {}
export interface $SchemaULIDInternals extends $SchemaStringFormatInternals<"ulid"> {}

export interface $SchemaULID extends $SchemaType {
  _schema: $SchemaULIDInternals;
}

export const $SchemaULID: core.$constructor<$SchemaULID> = /*@__PURE__*/ core.$constructor("$SchemaULID", (inst, def): void => {
  def.pattern ??= regexes.ulid;
  $SchemaStringFormat.init(inst, def);
});

//////////////////////////////   SchemaXID   //////////////////////////////

export interface $SchemaXIDDef extends $SchemaStringFormatDef<"xid"> {}
export interface $SchemaXIDInternals extends $SchemaStringFormatInternals<"xid"> {}

export interface $SchemaXID extends $SchemaType {
  _schema: $SchemaXIDInternals;
}

export const $SchemaXID: core.$constructor<$SchemaXID> = /*@__PURE__*/ core.$constructor("$SchemaXID", (inst, def): void => {
  def.pattern ??= regexes.xid;
  $SchemaStringFormat.init(inst, def);
});

//////////////////////////////   SchemaKSUID   //////////////////////////////

export interface $SchemaKSUIDDef extends $SchemaStringFormatDef<"ksuid"> {}
export interface $SchemaKSUIDInternals extends $SchemaStringFormatInternals<"ksuid"> {}

export interface $SchemaKSUID extends $SchemaType {
  _schema: $SchemaKSUIDInternals;
}

export const $SchemaKSUID: core.$constructor<$SchemaKSUID> = /*@__PURE__*/ core.$constructor(
  "$SchemaKSUID",
  (inst, def): void => {
    def.pattern ??= regexes.ksuid;
    $SchemaStringFormat.init(inst, def);
  }
);

//////////////////////////////   SchemaISODateTime   //////////////////////////////

export interface $SchemaISODateTimeDef extends $SchemaStringFormatDef<"datetime"> {
  precision: number | null;
  offset: boolean;
  local: boolean;
}

export interface $SchemaISODateTimeInternals extends $SchemaStringFormatInternals {
  def: $SchemaISODateTimeDef;
}

export interface $SchemaISODateTime extends $SchemaType {
  _schema: $SchemaISODateTimeInternals;
}

export const $SchemaISODateTime: core.$constructor<$SchemaISODateTime> = /*@__PURE__*/ core.$constructor(
  "$SchemaISODateTime",
  (inst, def): void => {
    def.pattern ??= regexes.datetime(def);
    $SchemaStringFormat.init(inst, def);
  }
);

//////////////////////////////   SchemaISODate   //////////////////////////////

export interface $SchemaISODateDef extends $SchemaStringFormatDef<"date"> {}
export interface $SchemaISODateInternals extends $SchemaStringFormatInternals<"date"> {}

export interface $SchemaISODate extends $SchemaType {
  _schema: $SchemaISODateInternals;
}

export const $SchemaISODate: core.$constructor<$SchemaISODate> = /*@__PURE__*/ core.$constructor(
  "$SchemaISODate",
  (inst, def): void => {
    def.pattern ??= regexes.date;
    $SchemaStringFormat.init(inst, def);
  }
);

//////////////////////////////   SchemaISOTime   //////////////////////////////

export interface $SchemaISOTimeDef extends $SchemaStringFormatDef<"time"> {
  precision?: number | null;
}

export interface $SchemaISOTimeInternals extends $SchemaStringFormatInternals<"time"> {
  def: $SchemaISOTimeDef;
}

export interface $SchemaISOTime extends $SchemaType {
  _schema: $SchemaISOTimeInternals;
}

export const $SchemaISOTime: core.$constructor<$SchemaISOTime> = /*@__PURE__*/ core.$constructor(
  "$SchemaISOTime",
  (inst, def): void => {
    def.pattern ??= regexes.time(def);
    $SchemaStringFormat.init(inst, def);
  }
);

//////////////////////////////   SchemaISODuration   //////////////////////////////

export interface $SchemaISODurationDef extends $SchemaStringFormatDef<"duration"> {}
export interface $SchemaISODurationInternals extends $SchemaStringFormatInternals<"duration"> {}

export interface $SchemaISODuration extends $SchemaType {
  _schema: $SchemaISODurationInternals;
}

export const $SchemaISODuration: core.$constructor<$SchemaISODuration> = /*@__PURE__*/ core.$constructor(
  "$SchemaISODuration",
  (inst, def): void => {
    def.pattern ??= regexes.duration;
    $SchemaStringFormat.init(inst, def);
  }
);

//////////////////////////////   SchemaIPv4   //////////////////////////////

export interface $SchemaIPv4Def extends $SchemaStringFormatDef<"ipv4"> {
  version?: "v4";
}

export interface $SchemaIPv4Internals extends $SchemaStringFormatInternals<"ipv4"> {
  def: $SchemaIPv4Def;
}

export interface $SchemaIPv4 extends $SchemaType {
  _schema: $SchemaIPv4Internals;
}

export const $SchemaIPv4: core.$constructor<$SchemaIPv4> = /*@__PURE__*/ core.$constructor("$SchemaIPv4", (inst, def): void => {
  def.pattern ??= regexes.ipv4;
  $SchemaStringFormat.init(inst, def);
});

//////////////////////////////   SchemaIPv6   //////////////////////////////

export interface $SchemaIPv6Def extends $SchemaStringFormatDef<"ipv6"> {
  version?: "v6";
}

export interface $SchemaIPv6Internals extends $SchemaStringFormatInternals<"ipv6"> {
  def: $SchemaIPv6Def;
}

export interface $SchemaIPv6 extends $SchemaType {
  _schema: $SchemaIPv6Internals;
}

/** An IPv6 address is written with hex digits, colons and dots, and nothing else. The guard is what makes the check below an IPv6 check: `new URL("http://[...]")` parses an authority, not an address, so `@` and `\` re-delimit it and `"::@1\\"` validates against the host `0.0.0.1`. The URL parser also deletes ASCII tab, LF and CR rather than failing, which is how `"::1\n"` validated as `::1`. */
const ipv6Alphabet = /^[0-9a-fA-F:.]+$/;

export function isValidIPv6(value: string): boolean {
  if (!ipv6Alphabet.test(value)) return false;
  return canParseURL(`http://[${value}]`);
}

export const $SchemaIPv6: core.$constructor<$SchemaIPv6> = /*@__PURE__*/ core.$constructor("$SchemaIPv6", (inst, def): void => {
  def.pattern ??= regexes.ipv6;
  $SchemaStringFormat.init(inst, def);

  inst._schema.check = (payload) => {
    if (!isValidIPv6(payload.value)) {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort,
      });
    }
  };
});

//////////////////////////////   SchemaMAC   //////////////////////////////
export interface $SchemaMACDef extends $SchemaStringFormatDef<"mac"> {
  delimiter?: string;
}

export interface $SchemaMACInternals extends $SchemaStringFormatInternals<"mac"> {
  def: $SchemaMACDef;
}

export interface $SchemaMAC extends $SchemaType {
  _schema: $SchemaMACInternals;
}

export const $SchemaMAC: core.$constructor<$SchemaMAC> = /*@__PURE__*/ core.$constructor("$SchemaMAC", (inst, def): void => {
  def.pattern ??= regexes.mac(def.delimiter);
  $SchemaStringFormat.init(inst, def);
});

//////////////////////////////   SchemaCIDRv4   //////////////////////////////

export interface $SchemaCIDRv4Def extends $SchemaStringFormatDef<"cidrv4"> {
  version?: "v4";
}

export interface $SchemaCIDRv4Internals extends $SchemaStringFormatInternals<"cidrv4"> {
  def: $SchemaCIDRv4Def;
}

export interface $SchemaCIDRv4 extends $SchemaType {
  _schema: $SchemaCIDRv4Internals;
}

export const $SchemaCIDRv4: core.$constructor<$SchemaCIDRv4> = /*@__PURE__*/ core.$constructor(
  "$SchemaCIDRv4",
  (inst, def): void => {
    def.pattern ??= regexes.cidrv4;
    $SchemaStringFormat.init(inst, def);
  }
);

//////////////////////////////   SchemaCIDRv6   //////////////////////////////

export interface $SchemaCIDRv6Def extends $SchemaStringFormatDef<"cidrv6"> {
  version?: "v6";
}

export interface $SchemaCIDRv6Internals extends $SchemaStringFormatInternals<"cidrv6"> {
  def: $SchemaCIDRv6Def;
}

export interface $SchemaCIDRv6 extends $SchemaType {
  _schema: $SchemaCIDRv6Internals;
}

export function isValidCIDRv6(value: string): boolean {
  const parts = value.split("/");
  if (parts.length !== 2) return false;
  const [address, prefix] = parts;
  if (!prefix) return false;
  const prefixNum = Number(prefix);
  if (`${prefixNum}` !== prefix) return false;
  if (prefixNum < 0 || prefixNum > 128) return false;
  return isValidIPv6(address);
}

export const $SchemaCIDRv6: core.$constructor<$SchemaCIDRv6> = /*@__PURE__*/ core.$constructor(
  "$SchemaCIDRv6",
  (inst, def): void => {
    def.pattern ??= regexes.cidrv6; // not used for validation
    $SchemaStringFormat.init(inst, def);

    inst._schema.check = (payload) => {
      if (!isValidCIDRv6(payload.value)) {
        payload.issues.push({
          code: "invalid_format",
          format: "cidrv6",
          input: payload.value,
          inst,
          continue: !def.abort,
        });
      }
    };
  }
);

//////////////////////////////   SchemaBase64   //////////////////////////////
export function isValidBase64(data: string): boolean {
  if (data === "") return true;
  // atob ignores whitespace, so reject it up front.
  if (/\s/.test(data)) return false;
  if (data.length % 4 !== 0) return false;
  try {
    // @ts-ignore
    atob(data);
    return true;
  } catch {
    return false;
  }
}

export interface $SchemaBase64Def extends $SchemaStringFormatDef<"base64"> {}
export interface $SchemaBase64Internals extends $SchemaStringFormatInternals<"base64"> {}

export interface $SchemaBase64 extends $SchemaType {
  _schema: $SchemaBase64Internals;
}

// lax on purpose: the quantified regexes.base64 overflows the regex stack on multi-MB input and its leading ^$| alternation leaks through template-literal composition; isValidBase64 enforces length and padding
export const base64Charset: RegExp = /^[0-9a-zA-Z+/]*={0,2}$/;

export const $SchemaBase64: core.$constructor<$SchemaBase64> = /*@__PURE__*/ core.$constructor(
  "$SchemaBase64",
  (inst, def): void => {
    def.pattern ??= base64Charset;
    $SchemaStringFormat.init(inst, def);

    inst._schema.check = (payload) => {
      if (isValidBase64(payload.value)) return;

      payload.issues.push({
        code: "invalid_format",
        format: "base64",
        input: payload.value,
        inst,
        continue: !def.abort,
      });
    };
  }
);

//////////////////////////////   SchemaBase64URL   //////////////////////////////
// lax on purpose: the quantified regexes.base64url overflows the regex stack on multi-MB input; isValidBase64 enforces length on the padded string
export const base64urlCharset: RegExp = /^[A-Za-z0-9_-]*$/;

export function isValidBase64URL(data: string): boolean {
  if (!base64urlCharset.test(data)) return false;
  const base64 = data.replace(/[-_]/g, (c) => (c === "-" ? "+" : "/"));
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return isValidBase64(padded);
}

export interface $SchemaBase64URLDef extends $SchemaStringFormatDef<"base64url"> {}
export interface $SchemaBase64URLInternals extends $SchemaStringFormatInternals<"base64url"> {}

export interface $SchemaBase64URL extends $SchemaType {
  _schema: $SchemaBase64URLInternals;
}

export const $SchemaBase64URL: core.$constructor<$SchemaBase64URL> = /*@__PURE__*/ core.$constructor(
  "$SchemaBase64URL",
  (inst, def): void => {
    def.pattern ??= base64urlCharset;
    $SchemaStringFormat.init(inst, def);

    inst._schema.check = (payload) => {
      if (isValidBase64URL(payload.value)) return;

      payload.issues.push({
        code: "invalid_format",
        format: "base64url",
        input: payload.value,
        inst,
        continue: !def.abort,
      });
    };
  }
);

//////////////////////////////   SchemaE164   //////////////////////////////

export interface $SchemaE164Def extends $SchemaStringFormatDef<"e164"> {}
export interface $SchemaE164Internals extends $SchemaStringFormatInternals<"e164"> {}

export interface $SchemaE164 extends $SchemaType {
  _schema: $SchemaE164Internals;
}

export const $SchemaE164: core.$constructor<$SchemaE164> = /*@__PURE__*/ core.$constructor("$SchemaE164", (inst, def): void => {
  def.pattern ??= regexes.e164;
  $SchemaStringFormat.init(inst, def);
});

//////////////////////////////   SchemaCreditCard   //////////////////////////////

const CC_SANITIZE = /[- ]/g;

/** Luhn checksum on a digit-only string. Adapted from valibot (MIT). */
function isLuhnAlgo(digits: string): boolean {
  let length = digits.length;
  let bit = 1;
  let sum = 0;
  while (length) {
    const value = digits.charCodeAt(--length) - 48;
    bit ^= 1;
    sum += bit ? [0, 2, 4, 6, 8, 1, 3, 5, 7, 9][value]! : value;
  }
  return sum % 10 === 0;
}

export function isValidCreditCard(input: string): boolean {
  if (!regexes.creditCard.test(input)) return false;
  return isLuhnAlgo(input.replace(CC_SANITIZE, ""));
}

export interface $SchemaCreditCardDef extends $SchemaStringFormatDef<"credit_card"> {}
export interface $SchemaCreditCardInternals extends $SchemaStringFormatInternals<"credit_card"> {
  def: $SchemaCreditCardDef;
}

export interface $SchemaCreditCard extends $SchemaType {
  _schema: $SchemaCreditCardInternals;
}

export const $SchemaCreditCard: core.$constructor<$SchemaCreditCard> = /*@__PURE__*/ core.$constructor(
  "$SchemaCreditCard",
  (inst, def): void => {
    // Shape only — the Luhn check below is not expressible as a pattern, so consumers of `pattern` (JSON Schema, template literals) get the length and separator rules alone.
    def.pattern ??= regexes.creditCard;
    $SchemaStringFormat.init(inst, def);
    inst._schema.check = (payload) => {
      if (isValidCreditCard(payload.value)) return;
      payload.issues.push({
        code: "invalid_format",
        format: "credit_card",
        input: payload.value,
        inst,
        continue: !def.abort,
      });
    };
  }
);

//////////////////////////////   SchemaIBAN   //////////////////////////////

// iso 7064 mod 97-10 checksum without BigInt
function isIso7064Mod97(iban: string): boolean {
  let remainder = 0;
  const len = iban.length;
  for (let i = 4; i < len; i++) {
    const code = iban.charCodeAt(i);
    remainder = (code >= 65 ? remainder * 100 + (code - 55) : remainder * 10 + (code - 48)) % 97;
  }
  for (let i = 0; i < 4; i++) {
    const code = iban.charCodeAt(i);
    remainder = (code >= 65 ? remainder * 100 + (code - 55) : remainder * 10 + (code - 48)) % 97;
  }
  return remainder === 1;
}

export function isValidIBAN(input: string): boolean {
  if (!regexes.iban.test(input)) return false;
  return isIso7064Mod97(input);
}

export interface $SchemaIBANDef extends $SchemaStringFormatDef<"iban"> {}
export interface $SchemaIBANInternals extends $SchemaStringFormatInternals<"iban"> {
  def: $SchemaIBANDef;
}

export interface $SchemaIBAN extends $SchemaType {
  _schema: $SchemaIBANInternals;
}

export const $SchemaIBAN: core.$constructor<$SchemaIBAN> = /*@__PURE__*/ core.$constructor("$SchemaIBAN", (inst, def): void => {
  // shape only — checksum is not expressible as a pattern
  def.pattern ??= regexes.iban;
  $SchemaStringFormat.init(inst, def);
  inst._schema.check = (payload) => {
    if (isValidIBAN(payload.value)) return;
    payload.issues.push({
      code: "invalid_format",
      format: "iban",
      input: payload.value,
      inst,
      continue: !def.abort,
    });
  };
});

//////////////////////////////   SchemaJWT   //////////////////////////////

export function isValidJWT(token: string, algorithm: util.JWTAlgorithm | null = null): boolean {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3) return false;
    const [header] = tokensParts;
    if (!header) return false;
    // @ts-ignore
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT") return false;
    if (!parsedHeader.alg) return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm)) return false;
    return true;
  } catch {
    return false;
  }
}

export interface $SchemaJWTDef extends $SchemaStringFormatDef<"jwt"> {
  alg?: util.JWTAlgorithm | undefined;
}

export interface $SchemaJWTInternals extends $SchemaStringFormatInternals<"jwt"> {
  def: $SchemaJWTDef;
}

export interface $SchemaJWT extends $SchemaType {
  _schema: $SchemaJWTInternals;
}

export const $SchemaJWT: core.$constructor<$SchemaJWT> = /*@__PURE__*/ core.$constructor("$SchemaJWT", (inst, def): void => {
  $SchemaStringFormat.init(inst, def);
  inst._schema.check = (payload) => {
    if (isValidJWT(payload.value, def.alg)) return;

    payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort,
    });
  };
});

//////////////////////////////   SchemaCustomStringFormat   //////////////////////////////

export interface $SchemaCustomStringFormatDef<Format extends string = string> extends $SchemaStringFormatDef<Format> {
  fn: (val: string) => unknown;
}

export interface $SchemaCustomStringFormatInternals<Format extends string = string>
  extends $SchemaStringFormatInternals<Format> {
  def: $SchemaCustomStringFormatDef<Format>;
}

export interface $SchemaCustomStringFormat<Format extends string = string> extends $SchemaStringFormat<Format> {
  _schema: $SchemaCustomStringFormatInternals<Format>;
}

export const $SchemaCustomStringFormat: core.$constructor<$SchemaCustomStringFormat> = /*@__PURE__*/ core.$constructor(
  "$SchemaCustomStringFormat",
  (inst, def): void => {
    $SchemaStringFormat.init(inst, def);
    inst._schema.check = (payload) => {
      if (def.fn(payload.value)) return;

      payload.issues.push({
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        inst,
        continue: !def.abort,
      });
    };
  }
);

/////////////////////////////////////////
/////////////////////////////////////////
//////////                     //////////
//////////      SchemaNumber      //////////
//////////                     //////////
/////////////////////////////////////////
/////////////////////////////////////////

export interface $SchemaNumberDef extends $SchemaTypeDef {
  type: "number";
  coerce?: boolean;
  // checks: checks.$SchemaCheck<number>[];
}

export interface $SchemaNumberInternals<Input = unknown> extends $SchemaTypeInternals<number, Input> {
  def: $SchemaNumberDef;
  /** @deprecated Internal API, use with caution (not deprecated) */
  pattern: RegExp;
  /** @deprecated Internal API, use with caution (not deprecated) */
  isst: errors.$SchemaIssueInvalidType;
  bag: util.LoosePartial<{
    minimum: number;
    maximum: number;
    exclusiveMinimum: number;
    exclusiveMaximum: number;
    format: string;
    pattern: RegExp;
  }>;
}

export interface $SchemaNumber<Input = unknown> extends $SchemaType {
  _schema: $SchemaNumberInternals<Input>;
}

export const $SchemaNumber: core.$constructor<$SchemaNumber> = /*@__PURE__*/ core.$constructor("$SchemaNumber", (inst, def) => {
  $SchemaType.init(inst, def);

  inst._schema.pattern = regexes.number;
  inst._schema.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {}
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }

    const received =
      typeof input === "number"
        ? Number.isNaN(input)
          ? "NaN"
          : !Number.isFinite(input)
            ? String(input)
            : undefined
        : undefined;

    payload.issues.push({
      expected: "number",
      code: "invalid_type",

      input,
      inst,
      ...(received ? { received } : {}),
    });
    return payload;
  };
});

///////////////////////////////////////////////
//////////      SchemaNumberFormat      //////////
///////////////////////////////////////////////
export interface $SchemaNumberFormatDef<Format extends $SchemaNumberFormats = $SchemaNumberFormats>
  extends $SchemaNumberDef,
    checks.$SchemaCheckNumberFormatDef<Format> {}

export interface $SchemaNumberFormatInternals<Format extends $SchemaNumberFormats = $SchemaNumberFormats>
  extends $SchemaNumberInternals<number>,
    checks.$SchemaCheckNumberFormatInternals<Format> {
  def: $SchemaNumberFormatDef<Format>;
  isst: errors.$SchemaIssueInvalidType;
}

export interface $SchemaNumberFormat<Format extends $SchemaNumberFormats = $SchemaNumberFormats> extends $SchemaType {
  _schema: $SchemaNumberFormatInternals<Format>;
}

export const $SchemaNumberFormat: core.$constructor<$SchemaNumberFormat> = /*@__PURE__*/ core.$constructor(
  "$SchemaNumberFormat",
  (inst, def) => {
    checks.$SchemaCheckNumberFormat.init(inst, def);
    $SchemaNumber.init(inst, def); // no format checks
  }
);

///////////////////////////////////////////
///////////////////////////////////////////
//////////                      ///////////
//////////      $SchemaBoolean      //////////
//////////                      ///////////
///////////////////////////////////////////
///////////////////////////////////////////

export interface $SchemaBooleanDef extends $SchemaTypeDef {
  type: "boolean";
  coerce?: boolean;
  checks?: checks.$SchemaCheck<boolean>[];
}

export interface $SchemaBooleanInternals<T = unknown> extends $SchemaTypeInternals<boolean, T> {
  pattern: RegExp;
  def: $SchemaBooleanDef;
  isst: errors.$SchemaIssueInvalidType;
}

export interface $SchemaBoolean<T = unknown> extends $SchemaType {
  _schema: $SchemaBooleanInternals<T>;
}

export const $SchemaBoolean: core.$constructor<$SchemaBoolean> = /*@__PURE__*/ core.$constructor(
  "$SchemaBoolean",
  (inst, def) => {
    $SchemaType.init(inst, def);
    inst._schema.pattern = regexes.boolean;

    inst._schema.parse = (payload, _ctx) => {
      if (def.coerce)
        try {
          payload.value = Boolean(payload.value);
        } catch (_) {}
      const input = payload.value;
      if (typeof input === "boolean") return payload;
      payload.issues.push({
        expected: "boolean",
        code: "invalid_type",

        input,
        inst,
      });
      return payload;
    };
  }
);

//////////////////////////////////////////
//////////////////////////////////////////
//////////                      //////////
//////////      $SchemaBigInt      //////////
//////////                      //////////
//////////////////////////////////////////
//////////////////////////////////////////

export interface $SchemaBigIntDef extends $SchemaTypeDef {
  type: "bigint";
  coerce?: boolean;
  // checks: checks.$SchemaCheck<bigint>[];
}

export interface $SchemaBigIntInternals<T = unknown> extends $SchemaTypeInternals<bigint, T> {
  pattern: RegExp;
  /** @internal Internal API, use with caution */
  def: $SchemaBigIntDef;
  isst: errors.$SchemaIssueInvalidType;
  bag: util.LoosePartial<{
    minimum: bigint;
    maximum: bigint;
    format: string;
  }>;
}

export interface $SchemaBigInt<T = unknown> extends $SchemaType {
  _schema: $SchemaBigIntInternals<T>;
}

export const $SchemaBigInt: core.$constructor<$SchemaBigInt> = /*@__PURE__*/ core.$constructor("$SchemaBigInt", (inst, def) => {
  $SchemaType.init(inst, def);
  inst._schema.pattern = regexes.bigint;

  inst._schema.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = BigInt(payload.value);
      } catch (_) {}

    if (typeof payload.value === "bigint") return payload;
    payload.issues.push({
      expected: "bigint",
      code: "invalid_type",

      input: payload.value,
      inst,
    });
    return payload;
  };
});

///////////////////////////////////////////////
//////////      SchemaBigIntFormat      //////////
///////////////////////////////////////////////
export interface $SchemaBigIntFormatDef<Format extends $SchemaBigIntFormats = $SchemaBigIntFormats>
  extends $SchemaBigIntDef,
    checks.$SchemaCheckBigIntFormatDef<Format> {
  check: "bigint_format";
}

export interface $SchemaBigIntFormatInternals<Format extends $SchemaBigIntFormats = $SchemaBigIntFormats>
  extends $SchemaBigIntInternals<bigint>,
    checks.$SchemaCheckBigIntFormatInternals<Format> {
  def: $SchemaBigIntFormatDef<Format>;
}

export interface $SchemaBigIntFormat<Format extends $SchemaBigIntFormats = $SchemaBigIntFormats> extends $SchemaType {
  _schema: $SchemaBigIntFormatInternals<Format>;
}

export const $SchemaBigIntFormat: core.$constructor<$SchemaBigIntFormat> = /*@__PURE__*/ core.$constructor(
  "$SchemaBigIntFormat",
  (inst, def) => {
    checks.$SchemaCheckBigIntFormat.init(inst, def);
    $SchemaBigInt.init(inst, def); // no format checks
  }
);

////////////////////////////////////////////
////////////////////////////////////////////
//////////                        //////////
//////////       $SchemaSymbol       //////////
//////////                        //////////
////////////////////////////////////////////
////////////////////////////////////////////
export interface $SchemaSymbolDef extends $SchemaTypeDef {
  type: "symbol";
}

export interface $SchemaSymbolInternals extends $SchemaTypeInternals<symbol, symbol> {
  def: $SchemaSymbolDef;
  isst: errors.$SchemaIssueInvalidType;
}

export interface $SchemaSymbol extends $SchemaType {
  _schema: $SchemaSymbolInternals;
}

export const $SchemaSymbol: core.$constructor<$SchemaSymbol> = /*@__PURE__*/ core.$constructor("$SchemaSymbol", (inst, def) => {
  $SchemaType.init(inst, def);

  inst._schema.parse = (payload, _ctx) => {
    const input = payload.value;
    if (typeof input === "symbol") return payload;
    payload.issues.push({
      expected: "symbol",
      code: "invalid_type",

      input,
      inst,
    });
    return payload;
  };
});

////////////////////////////////////////////
////////////////////////////////////////////
//////////                        //////////
//////////      $SchemaUndefined     //////////
//////////                        //////////
////////////////////////////////////////////
////////////////////////////////////////////
export interface $SchemaUndefinedDef extends $SchemaTypeDef {
  type: "undefined";
}

export interface $SchemaUndefinedInternals extends $SchemaTypeInternals<undefined, undefined> {
  pattern: RegExp;
  def: $SchemaUndefinedDef;
  values: util.PrimitiveSet;
  isst: errors.$SchemaIssueInvalidType;
}

export interface $SchemaUndefined extends $SchemaType {
  _schema: $SchemaUndefinedInternals;
}

export const $SchemaUndefined: core.$constructor<$SchemaUndefined> = /*@__PURE__*/ core.$constructor(
  "$SchemaUndefined",
  (inst, def) => {
    $SchemaType.init(inst, def);
    inst._schema.pattern = regexes.undefined;
    inst._schema.values = new Set([undefined]);

    inst._schema.parse = (payload, _ctx) => {
      const input = payload.value;
      if (typeof input === "undefined") return payload;
      payload.issues.push({
        expected: "undefined",
        code: "invalid_type",

        input,
        inst,
      });
      return payload;
    };
  }
);

///////////////////////////////////////
///////////////////////////////////////
//////////                   //////////
//////////      $SchemaNull      /////////
//////////                   //////////
///////////////////////////////////////
///////////////////////////////////////

export interface $SchemaNullDef extends $SchemaTypeDef {
  type: "null";
}

export interface $SchemaNullInternals extends $SchemaTypeInternals<null, null> {
  pattern: RegExp;
  def: $SchemaNullDef;
  values: util.PrimitiveSet;
  isst: errors.$SchemaIssueInvalidType;
}

export interface $SchemaNull extends $SchemaType {
  _schema: $SchemaNullInternals;
}

export const $SchemaNull: core.$constructor<$SchemaNull> = /*@__PURE__*/ core.$constructor("$SchemaNull", (inst, def) => {
  $SchemaType.init(inst, def);
  inst._schema.pattern = regexes.null;
  inst._schema.values = new Set([null]);

  inst._schema.parse = (payload, _ctx) => {
    const input = payload.value;
    if (input === null) return payload;
    payload.issues.push({
      expected: "null",
      code: "invalid_type",

      input,
      inst,
    });
    return payload;
  };
});

//////////////////////////////////////
//////////////////////////////////////
//////////                  //////////
//////////      $SchemaAny     //////////
//////////                  //////////
//////////////////////////////////////
//////////////////////////////////////

export interface $SchemaAnyDef extends $SchemaTypeDef {
  type: "any";
}

export interface $SchemaAnyInternals extends $SchemaTypeInternals<any, any> {
  def: $SchemaAnyDef;
  isst: never;
}

export interface $SchemaAny extends $SchemaType {
  _schema: $SchemaAnyInternals;
}

export const $SchemaAny: core.$constructor<$SchemaAny> = /*@__PURE__*/ core.$constructor("$SchemaAny", (inst, def) => {
  $SchemaType.init(inst, def);

  inst._schema.parse = (payload) => payload;
});

//////////////////////////////////////////
//////////////////////////////////////////
//////////                      //////////
//////////      $SchemaUnknown     //////////
//////////                      //////////
//////////////////////////////////////////
//////////////////////////////////////////

export interface $SchemaUnknownDef extends $SchemaTypeDef {
  type: "unknown";
}

export interface $SchemaUnknownInternals extends $SchemaTypeInternals<unknown, unknown> {
  def: $SchemaUnknownDef;
  isst: never;
}

export interface $SchemaUnknown extends $SchemaType {
  _schema: $SchemaUnknownInternals;
}

export const $SchemaUnknown: core.$constructor<$SchemaUnknown> = /*@__PURE__*/ core.$constructor(
  "$SchemaUnknown",
  (inst, def) => {
    $SchemaType.init(inst, def);

    inst._schema.parse = (payload) => payload;
  }
);

/////////////////////////////////////////
/////////////////////////////////////////
//////////                     //////////
//////////      $SchemaNever      //////////
//////////                     //////////
/////////////////////////////////////////
/////////////////////////////////////////

export interface $SchemaNeverDef extends $SchemaTypeDef {
  type: "never";
}

export interface $SchemaNeverInternals extends $SchemaTypeInternals<never, never> {
  def: $SchemaNeverDef;
  isst: errors.$SchemaIssueInvalidType;
}

export interface $SchemaNever extends $SchemaType {
  _schema: $SchemaNeverInternals;
}

export const $SchemaNever: core.$constructor<$SchemaNever> = /*@__PURE__*/ core.$constructor("$SchemaNever", (inst, def) => {
  $SchemaType.init(inst, def);
  inst._schema.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",

      input: payload.value,
      inst,
    });
    return payload;
  };
});

////////////////////////////////////////
////////////////////////////////////////
//////////                    //////////
//////////      $SchemaVoid      //////////
//////////                    //////////
////////////////////////////////////////
////////////////////////////////////////

export interface $SchemaVoidDef extends $SchemaTypeDef {
  type: "void";
}

export interface $SchemaVoidInternals extends $SchemaTypeInternals<void, void> {
  def: $SchemaVoidDef;
  isst: errors.$SchemaIssueInvalidType;
}

export interface $SchemaVoid extends $SchemaType {
  _schema: $SchemaVoidInternals;
}

export const $SchemaVoid: core.$constructor<$SchemaVoid> = /*@__PURE__*/ core.$constructor("$SchemaVoid", (inst, def) => {
  $SchemaType.init(inst, def);

  inst._schema.parse = (payload, _ctx) => {
    const input = payload.value;
    if (typeof input === "undefined") return payload;
    payload.issues.push({
      expected: "void",
      code: "invalid_type",

      input,
      inst,
    });
    return payload;
  };
});

///////////////////////////////////////
///////////////////////////////////////
//////////                     ////////
//////////      $SchemaDate        ////////
//////////                     ////////
///////////////////////////////////////
///////////////////////////////////////
export interface $SchemaDateDef extends $SchemaTypeDef {
  type: "date";
  coerce?: boolean;
}

export interface $SchemaDateInternals<T = unknown> extends $SchemaTypeInternals<Date, T> {
  def: $SchemaDateDef;
  isst: errors.$SchemaIssueInvalidType; // | errors.$SchemaIssueInvalidDate;
  bag: util.LoosePartial<{
    minimum: Date;
    maximum: Date;
    format: string;
  }>;
}

export interface $SchemaDate<T = unknown> extends $SchemaType {
  _schema: $SchemaDateInternals<T>;
}

export const $SchemaDate: core.$constructor<$SchemaDate> = /*@__PURE__*/ core.$constructor("$SchemaDate", (inst, def) => {
  $SchemaType.init(inst, def);

  inst._schema.parse = (payload, _ctx) => {
    if (def.coerce) {
      try {
        payload.value = new Date(payload.value as string | number | Date);
      } catch (_err: any) {}
    }
    const input = payload.value;

    const isDate = input instanceof Date;
    const isValidDate = isDate && !Number.isNaN(input.getTime());
    if (isValidDate) return payload;
    payload.issues.push({
      expected: "date",
      code: "invalid_type",

      input,
      ...(isDate ? { received: "Invalid Date" } : {}),
      inst,
    });

    return payload;
  };
});

/////////////////////////////////////////
/////////////////////////////////////////
//////////                     //////////
//////////      $SchemaArray      //////////
//////////                     //////////
/////////////////////////////////////////
/////////////////////////////////////////

export interface $SchemaArrayDef<T extends SomeType = $SchemaType> extends $SchemaTypeDef {
  type: "array";
  element: T;
}

export interface $SchemaArrayInternals<T extends SomeType = $SchemaType> extends _$SchemaTypeInternals {
  //$SchemaTypeInternals<core.output<T>[], core.input<T>[]> {
  def: $SchemaArrayDef<T>;
  isst: errors.$SchemaIssueInvalidType;
  output: core.output<T>[];
  input: core.input<T>[];
}

export interface $SchemaArray<T extends SomeType = $SchemaType> extends $SchemaType<any, any, $SchemaArrayInternals<T>> {}

function handleArrayResult(result: ParsePayload<any>, final: ParsePayload<any[]>, index: number) {
  if (result.issues.length) {
    final.issues.push(...util.prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}

export const $SchemaArray: core.$constructor<$SchemaArray> = /*@__PURE__*/ core.$constructor("$SchemaArray", (inst, def) => {
  $SchemaType.init(inst, def);

  const memo = core.globalConfig.memoizer;
  memo?.attach(inst);

  inst._schema.parse = (payload, ctx) => {
    const input = payload.value;

    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",

        input,
        inst,
      });
      return payload;
    }

    payload.value = memo ? memo.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
    const proms: Promise<any>[] = [];
    const abortEarly = ctx?.abortEarly;
    for (let i = 0; i < input.length; i++) {
      const item = input[i];
      const result = def.element._schema.run(
        {
          value: item,
          issues: [],
        },
        ctx
      );

      if (result instanceof Promise) {
        proms.push(result.then((result) => handleArrayResult(result, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
        // the element's payload is authoritative here, since handleArrayResult forwards every issue; an object's is not, because it drops a failed absent optional
        if (abortEarly && result.issues.length !== 0 && util.aborted(result)) break;
      }
    }

    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }

    return payload; //handleArrayResultsAsync(parseResults, final);
  };
});

//////////////////////////////////////////
//////////////////////////////////////////
//////////                      //////////
//////////      $SchemaObject      //////////
//////////                      //////////
//////////////////////////////////////////
//////////////////////////////////////////

type OptionalOutSchema = { _schema: { optout: "optional" } };
type OptionalInSchema = { _schema: { optin: "optional" | "defaulted" } };

export type $InferObjectOutput<T extends $SchemaLooseShape, Extra extends Record<string, unknown>> = string extends keyof T
  ? util.IsAny<T[keyof T]> extends true
    ? Record<string, unknown>
    : { [k in string]: core.output<T[keyof T]> }
  : keyof (T & Extra) extends never
    ? Record<string, never>
    : util.Prettify<
        {
          -readonly [k in keyof T as T[k] extends OptionalOutSchema ? never : k]: T[k]["_schema"]["output"];
        } & {
          -readonly [k in keyof T as T[k] extends OptionalOutSchema ? k : never]?: T[k]["_schema"]["output"];
        } & Extra
      >;

// experimental
// export type $InferObjectOutput<T extends $SchemaLooseShape, Extra extends Record<string, unknown>> = keyof (T &
//   Extra) extends never
//   ? Record<string, never>
//   : string extends keyof T
//     ? util.Prettify<
//         {
//           [k: string]: util.IsAny<T[string]["_schema"]["output"]> extends true ? unknown : T[string]["_schema"]["output"];
//         } & $InferObjectOutputNoIndex<util.OmitIndexSignature<T>, Extra>
//       >
//     : util.Prettify<$InferObjectOutputNoIndex<T, Extra>>;

// export type $InferObjectOutputNoIndex<T extends $SchemaLooseShape, Extra extends Record<string, unknown>> = {
//   [k in keyof T as string extends k
//     ? never
//     : k extends string
//       ? T[k] extends OptionalOutSchema
//         ? never
//         : k
//       : never]: T[k]["_schema"]["output"];
// } & {
//   [k in keyof T as string extends k
//     ? never
//     : k extends string
//       ? T[k] extends OptionalOutSchema
//         ? k
//         : never
//       : never]?: T[k]["_schema"]["output"];
// } & Extra;

export type $InferObjectInput<T extends $SchemaLooseShape, Extra extends Record<string, unknown>> = string extends keyof T
  ? util.IsAny<T[keyof T]> extends true
    ? Record<string, unknown>
    : { [k in string]: core.input<T[keyof T]> }
  : keyof (T & Extra) extends never
    ? Record<string, never>
    : util.Prettify<
        {
          -readonly [k in keyof T as T[k] extends OptionalInSchema ? never : k]: T[k]["_schema"]["input"];
        } & {
          -readonly [k in keyof T as T[k] extends OptionalInSchema ? k : never]?: T[k]["_schema"]["input"];
        } & Extra
      >;

function handlePropertyResult(
  result: ParsePayload,
  final: ParsePayload,
  key: PropertyKey,
  input: any,
  optin: "optional" | "defaulted" | undefined,
  optout: "optional" | undefined
) {
  const isPresent = key in input;
  const isOptionalOut = optout === "optional";
  // The middle rung means "absence permitted, nothing supplied in its place", so an absent key contributes nothing — whatever the schema made of `undefined` is invented, not substituted. Only `optional` reaches this with a value: `defaulted` substitutes, and a schema that isn't optional-out has to keep the key.
  if (!isPresent && isOptionalOut && optin === "optional") {
    return;
  }
  if (result.issues.length) {
    // For optional-in/out schemas, ignore errors on absent keys.
    if (optin !== undefined && isOptionalOut && !isPresent) {
      return;
    }
    final.issues.push(...util.prefixIssues(key, result.issues));
  }

  if (!isPresent && optin === undefined) {
    if (!result.issues.length) {
      final.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: undefined,
        path: [key],
      });
    }
    return;
  }

  if (result.value === undefined) {
    if (isPresent || (optin === "defaulted" && !isOptionalOut)) {
      (final.value as any)[key] = undefined;
    }
  } else {
    (final.value as any)[key] = result.value;
  }
}

export type $SchemaObjectConfig = { out: Record<string, unknown>; in: Record<string, unknown> };

export type $loose = {
  out: Record<string, unknown>;
  in: Record<string, unknown>;
};
export type $strict = {
  out: {};
  in: {};
};
export type $strip = {
  out: {};
  in: {};
};

export type $catchall<T extends SomeType> = {
  out: { [k: string]: core.output<T> };
  in: { [k: string]: core.input<T> };
};

export type $SchemaShape = Readonly<{ [k: string]: $SchemaType }>;

export interface $SchemaObjectDef<Shape extends $SchemaShape = $SchemaShape> extends $SchemaTypeDef {
  type: "object";
  shape: Shape;
  catchall?: $SchemaType | undefined;
}

export interface $SchemaObjectInternals<
  /** @ts-ignore Cast variance */
  out Shape extends $SchemaShape = $SchemaShape,
  out Config extends $SchemaObjectConfig = $SchemaObjectConfig,
> extends _$SchemaTypeInternals {
  def: $SchemaObjectDef<Shape>;
  config: Config;
  isst: errors.$SchemaIssueInvalidType | errors.$SchemaIssueUnrecognizedKeys;
  propValues: util.PropValues;
  output: $InferObjectOutput<Shape, Config["out"]>;
  input: $InferObjectInput<Shape, Config["in"]>;
  optin?: "optional" | undefined;
  optout?: "optional" | undefined;
}
export type $SchemaLooseShape = Record<string, any>;

export interface $SchemaObject<
  /** @ts-ignore Cast variance */
  out Shape extends Readonly<$SchemaShape> = Readonly<$SchemaShape>,
  out Params extends $SchemaObjectConfig = $SchemaObjectConfig,
> extends $SchemaType<any, any, $SchemaObjectInternals<Shape, Params>> {}

// one shared instance; a fresh [] per schema cost 56 bytes retained
const NO_SYMBOL_KEYS: symbol[] = [];

function normalizeDef(def: $SchemaObjectDef) {
  const keys = Object.keys(def.shape);
  const ownSymbols = Object.getOwnPropertySymbols(def.shape);
  const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
  // aliases `keys` when there are no symbols, so a string-only shape keeps one array
  const allKeys: (string | symbol)[] = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
  for (const k of allKeys) {
    if (!(def.shape as any)?.[k]?._schema?.traits?.has("$SchemaType")) {
      throw new Error(`Invalid element at key "${String(k)}": expected a Schema schema`);
    }
  }
  const okeys = util.optionalKeys(def.shape);

  return {
    ...def,
    allKeys,
    symbolKeys,
    // string-only: handleCatchall matches it against `for...in`, which never yields a symbol
    keySet: new Set(keys),
    numKeys: keys.length,
    optionalKeys: new Set(okeys),
  };
}

function handleCatchall(
  proms: Promise<any>[],
  input: any,
  payload: ParsePayload,
  ctx: ParseContextInternal,
  def: ReturnType<typeof normalizeDef>,
  inst: $SchemaObject,
  abortEarly: boolean
) {
  const unrecognized: string[] = [];
  const keySet = def.keySet;
  const _catchall = def.catchall!._schema;
  const t = _catchall.def.type;
  const optin = _catchall.optin;
  const optout = _catchall.optout;
  // starts at 0, not the current length: the shape phase already ran and may have aborted
  let seen = 0;
  for (const key in input) {
    if (abortEarly && payload.issues.length !== seen) {
      if (util.aborted(payload, seen)) break;
      seen = payload.issues.length;
    }
    // Must precede the __proto__ branch: a declared key is not unrecognized, even though the shape loop deliberately strips __proto__ from the parsed output.
    if (keySet.has(key)) continue;
    // Don't copy an undeclared __proto__ into the result; assignment to a plain {} would replace the result prototype. But in strict mode it is still an unknown key, so report it before skipping.
    if (key === "__proto__") {
      if (t === "never") unrecognized.push(key);
      continue;
    }
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r = _catchall.run({ value: input[key], issues: [] }, ctx);

    if (r instanceof Promise) {
      proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
    } else {
      handlePropertyResult(r, payload, key, input, optin, optout);
    }
  }

  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst,
      // Describes the shape of the input, not the validity of the parsed value, so it never aborts. The parse still fails; the schema's own checks just get to run first, and an enclosing intersection can reconcile the key against a sibling operand.
      continue: true,
    });
  }

  if (!proms.length) return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}

export const $SchemaObject: core.$constructor<$SchemaObject> = /*@__PURE__*/ core.$constructor("$SchemaObject", (inst, def) => {
  // requires cast because technically $SchemaObject doesn't extend
  $SchemaType.init(inst, def);
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  // a cloned def carries its source's accessor, which knows the shape it answers from; adopting that keeps the clone's keys readable without running it
  const sh = desc?.get ? (desc.get as util.ShapeGetter).raw : (def.shape ?? {});
  if (sh) {
    // Freezes the shape on first read, so its getters resolve once and every later read sees the same schemas.
    const get: util.ShapeGetter = () => {
      const newSh = { ...sh };
      Object.defineProperty(def, "shape", { value: newSh });
      get.raw = newSh;
      return newSh;
    };
    get.raw = sh;
    Object.defineProperty(def, "shape", { get });
  }

  const _normalized = util.cached(() => normalizeDef(def));

  util.defineLazyInternal(inst, "propValues", (schema) => {
    const shape = Schema.def.shape;
    const propValues: util.PropValues = {};
    for (const key in shape) {
      const field = shape[key]!._schema;
      if (field.values) {
        if (!Object.prototype.hasOwnProperty.call(propValues, key)) {
          util.assignProp(propValues, key, new Set());
        }
        for (const v of field.values) propValues[key].add(v);
        // An omittable slot reads back as undefined at a discriminator lookup, so it has to claim undefined: two options that can both omit the key are not discriminable on it.
        if (field.optin !== undefined) propValues[key].add(undefined);
      }
    }
    return propValues;
  });

  const isObject = util.isObject;
  const catchall = def.catchall;

  let value!: typeof _normalized.value;
  const memo = core.globalConfig.memoizer;
  memo?.attach(inst);

  inst._schema.parse = (payload, ctx) => {
    value ??= _normalized.value;
    const input = payload.value;
    if (!isObject(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst,
      });
      return payload;
    }

    payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};

    const proms: Promise<any>[] = [];
    const shape = value.shape;
    const abortEarly = ctx?.abortEarly;
    let seen = payload.issues.length;

    for (const key of value.allKeys) {
      if (abortEarly && payload.issues.length !== seen) {
        if (util.aborted(payload, seen)) break;
        seen = payload.issues.length;
      }
      if (key === "__proto__") continue;
      const el = (shape as any)[key]!;
      const optin = el._schema.optin;
      const optout = el._schema.optout;

      const r = el._schema.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
      } else {
        handlePropertyResult(r, payload, key, input, optin, optout);
      }
    }

    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }

    return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
  };
});

export const $SchemaObjectJIT: core.$constructor<$SchemaObject> = /*@__PURE__*/ core.$constructor(
  "$SchemaObjectJIT",
  (inst, def) => {
    // requires cast because technically $SchemaObject doesn't extend
    $SchemaObject.init(inst, def);

    const superParse = inst._schema.parse;
    const _normalized = util.cached(() => normalizeDef(def));

    const memo = core.globalConfig.memoizer;

    const generateFastpass = (shape: any) => {
      const normalized = _normalized.value;
      const syms = normalized.symbolKeys;
      // a symbol has no source literal, so it is read as `syms[i]` off the closed-over scope
      const doc = new Doc(["payload", "ctx"], { shape, inst, memo, syms });

      const parseStr = (k: string) => `shape[${k}]._schema.run({ value: input[${k}], issues: [] }, ctx)`;

      // prefixes in place, like util.prefixIssues. newResult must land before the early return: a catchall runs after this and would otherwise write onto the caller's input
      const prefixStr = (id: string, k: string) => `
          let ${id}_ab = false;
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${id}_ab = true;
          }
          if (${id}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;

      doc.write(`const input = payload.value;`);

      const ids: any = Object.create(null);
      let counter = 0;
      for (const key of normalized.allKeys) {
        ids[key] = `key_${counter++}`;
      }

      // A: preserve key order {
      doc.write(memo ? `const newResult = memo.alloc(inst, payload, {}, ctx);` : `const newResult = {};`);
      for (const key of normalized.allKeys) {
        if (key === "__proto__") continue;
        const id = ids[key];
        const k = typeof key === "symbol" ? `syms[${syms.indexOf(key)}]` : util.esc(key);
        const isPresent = `${k} in input`;
        const schema = shape[key];
        const optin = schema?._schema?.optin;
        const isOptionalIn = optin !== undefined;
        const isOptionalOut = schema?._schema?.optout === "optional";

        doc.write(`const ${id} = ${parseStr(k)};`);

        if (isOptionalIn && isOptionalOut) {
          // For optional-in/out schemas, ignore errors on absent keys — and, like the interpreted path, drop the value produced alongside them. The middle rung goes further: it permits absence without supplying anything in its place, so an absent key contributes nothing at all.
          const assign = optin === "optional" ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
          doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
        } else if (!isOptionalIn) {
          doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
        } else {
          doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
      `);
          if (optin === "defaulted") {
            doc.write(`newResult[${k}] = ${id}.value;`);
          } else {
            doc.write(`
        if (${id}.value !== undefined || ${isPresent}) {
          newResult[${k}] = ${id}.value;
        }
      `);
          }
        }
      }

      doc.write(`payload.value = newResult;`);
      doc.write(`return payload;`);
      // closing `shape` in is what pays: turbofan specializes the parser against that one shape object, so every `shape[k]._schema.run` folds to a known callee. as a parameter it stays a generic load and measures 13% slower even with the forwarding frame gone
      return doc.compile() as (payload: any, ctx: any) => any;
    };

    let fastpass!: ReturnType<typeof generateFastpass>;

    const isObject = util.isObject;
    const jit = !core.globalConfig.jitless;
    const allowsEval = util.allowsEval;

    const fastEnabled = jit && allowsEval.value; // && !def.catchall;
    const catchall = def.catchall;

    let value!: typeof _normalized.value;

    inst._schema.parse = (payload, ctx) => {
      value ??= _normalized.value;
      const input = payload.value;
      if (!isObject(input)) {
        payload.issues.push({
          expected: "object",
          code: "invalid_type",
          input,
          inst,
        });
        return payload;
      }

      if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
        // always synchronous
        if (!fastpass) fastpass = generateFastpass(def.shape);
        payload = fastpass(payload, ctx);

        if (!catchall) return payload;
        return handleCatchall([], input, payload, ctx, value, inst, ctx?.abortEarly === true);
      }

      return superParse(payload, ctx);
    };
  }
);

/////////////////////////////////////////
/////////////////////////////////////////
//////////                    ///////////
//////////      $SchemaUnion      //////////
//////////                    ///////////
/////////////////////////////////////////
/////////////////////////////////////////
// use generic to distribute union types
export type $InferUnionOutput<T extends SomeType> = T extends any ? core.output<T> : never;
export type $InferUnionInput<T extends SomeType> = T extends any ? core.input<T> : never;
export interface $SchemaUnionDef<Options extends readonly SomeType[] = readonly $SchemaType[]> extends $SchemaTypeDef {
  type: "union";
  options: Options;
  inclusive?: boolean;
}

type IsOptionalIn<T extends SomeType> = T extends OptionalInSchema ? true : false;
type IsOptionalOut<T extends SomeType> = T extends OptionalOutSchema ? true : false;

export interface $SchemaUnionInternals<T extends readonly SomeType[] = readonly $SchemaType[]> extends _$SchemaTypeInternals {
  def: $SchemaUnionDef<T>;
  isst: errors.$SchemaIssueInvalidUnion;
  pattern: T[number]["_schema"]["pattern"];
  values: T[number]["_schema"]["values"]; //GetValues<T[number]>;
  output: $InferUnionOutput<T[number]>;
  input: $InferUnionInput<T[number]>;
  // if any element in the union is optional, then the union is optional
  optin: IsOptionalIn<T[number]> extends false ? "optional" | "defaulted" | undefined : "optional" | "defaulted";
  optout: IsOptionalOut<T[number]> extends false ? "optional" | undefined : "optional";
}

export interface $SchemaUnion<T extends readonly SomeType[] = readonly $SchemaType[]>
  extends $SchemaType<any, any, $SchemaUnionInternals<T>> {
  _schema: $SchemaUnionInternals<T>;
}

function handleUnionResults(results: ParsePayload[], final: ParsePayload, inst: $SchemaUnion, ctx?: ParseContext) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }

  const nonaborted = results.filter((r) => !util.aborted(r));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }

  final.issues.push({
    code: "invalid_union",

    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config()))),
  });

  return final;
}

export const $SchemaUnion: core.$constructor<$SchemaUnion> = /*@__PURE__*/ core.$constructor("$SchemaUnion", (inst, def) => {
  $SchemaType.init(inst, def);

  util.defineLazyInternal(inst, "optin", (schema) =>
    Schema.def.options.some((o) => o._schema.optin === "defaulted")
      ? "defaulted"
      : Schema.def.options.some((o) => o._schema.optin !== undefined)
        ? "optional"
        : undefined
  );

  util.defineLazyInternal(inst, "optout", (schema) =>
    Schema.def.options.some((o) => o._schema.optout === "optional") ? "optional" : undefined
  );

  util.defineLazyInternal(inst, "values", (schema) => {
    if (Schema.def.options.every((o) => o._schema.values)) {
      return new Set<util.Primitive>(Schema.def.options.flatMap((option) => Array.from(option._schema.values!)));
    }
    return undefined;
  });

  util.defineLazyInternal(inst, "pattern", (schema) => {
    if (Schema.def.options.every((o) => o._schema.pattern)) {
      const patterns = Schema.def.options.map((o) => o._schema.pattern);
      return new RegExp(`^(${patterns.map((p) => util.cleanRegex(p!.source)).join("|")})$`);
    }
    return undefined;
  });

  const first = def.options.length === 1 ? def.options[0]._schema.run : null;

  inst._schema.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;

    const results: util.MaybeAsync<ParsePayload>[] = [];
    for (const option of def.options) {
      const result = option._schema.run(
        {
          value: payload.value,
          issues: [],
        },
        ctx
      );
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0) return result;
        results.push(result);
      }
    }

    if (!async) return handleUnionResults(results as ParsePayload[], payload, inst, ctx);
    return Promise.all(results).then((results) => {
      return handleUnionResults(results as ParsePayload[], payload, inst, ctx);
    });
  };
});

function handleExclusiveUnionResults(
  results: ParsePayload[],
  final: ParsePayload,
  inst: $SchemaUnion,
  ctx?: ParseContext
) {
  const matches: number[] = [];
  for (let i = 0; i < results.length; i++) {
    if (results[i].issues.length === 0) matches.push(i);
  }

  if (matches.length === 1) {
    final.value = results[matches[0]].value;
    return final;
  }

  if (matches.length === 0) {
    // No matches - same as regular union
    final.issues.push({
      code: "invalid_union",
      input: final.value,
      inst,
      errors: results.map((result) => result.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config()))),
    });
  } else {
    // Multiple matches - exclusive union failure
    final.issues.push({
      code: "invalid_union",
      input: final.value,
      inst,
      errors: [],
      inclusive: false,
      matches,
    });
  }

  return final;
}

export interface $SchemaXorInternals<T extends readonly SomeType[] = readonly $SchemaType[]> extends $SchemaUnionInternals<T> {}

export interface $SchemaXor<T extends readonly SomeType[] = readonly $SchemaType[]>
  extends $SchemaType<any, any, $SchemaXorInternals<T>> {
  _schema: $SchemaXorInternals<T>;
}

export const $SchemaXor: core.$constructor<$SchemaXor> = /*@__PURE__*/ core.$constructor("$SchemaXor", (inst, def) => {
  $SchemaUnion.init(inst, def);
  def.inclusive = false;

  const first = def.options.length === 1 ? def.options[0]._schema.run : null;

  inst._schema.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;

    const results: util.MaybeAsync<ParsePayload>[] = [];
    for (const option of def.options) {
      const result = option._schema.run(
        {
          value: payload.value,
          issues: [],
        },
        ctx
      );
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        results.push(result);
      }
    }

    if (!async) return handleExclusiveUnionResults(results as ParsePayload[], payload, inst, ctx);
    return Promise.all(results).then((results) => {
      return handleExclusiveUnionResults(results as ParsePayload[], payload, inst, ctx);
    });
  };
});

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
//////////                                  //////////
//////////      $SchemaDiscriminatedUnion      //////////
//////////                                  //////////
//////////////////////////////////////////////////////
//////////////////////////////////////////////////////

export interface $SchemaDiscriminatedUnionDef<
  Options extends readonly SomeType[] = readonly $SchemaType[],
  Disc extends string = string,
> extends $SchemaUnionDef<Options> {
  discriminator: Disc;
  unionFallback?: boolean;
}

export interface $SchemaDiscriminatedUnionInternals<
  Options extends readonly SomeType[] = readonly $SchemaType[],
  Disc extends string = string,
> extends $SchemaUnionInternals<Options> {
  def: $SchemaDiscriminatedUnionDef<Options, Disc>;
  propValues: util.PropValues;
  bag: util.LoosePartial<{
    optionsMap: Map<util.Primitive, $SchemaType | null>;
  }>;
}

/** The discriminator values a member of `Options` can declare. An omittable discriminator contributes `undefined`, matching what `propValues` claims for it. */
export type $DiscriminatorValue<Options extends readonly SomeType[], Disc extends string> = {
  [I in keyof Options]: Options[I] extends { _schema: { output: infer Out } }
    ? Disc extends keyof Out
      ? Out[Disc]
      : never
    : never;
}[number];

/** The member of `Options` that declares `V`. */
export type $DiscriminatedOption<Options extends readonly SomeType[], Disc extends string, V> = {
  [I in keyof Options]: Options[I] extends { _schema: { output: infer Out } }
    ? Disc extends keyof Out
      ? V extends Out[Disc]
        ? Options[I]
        : never
      : never
    : never;
}[number];

/** Returns the option whose discriminator claims `value`, or throws if ambiguous. */
export function getDiscriminatedOption<
  Options extends readonly SomeType[],
  Disc extends string,
  const V extends $DiscriminatorValue<Options, Disc>,
>(union: $SchemaDiscriminatedUnion<Options, Disc>, value: V): $DiscriminatedOption<Options, Disc, V> {
  const internals = union._schema;
  let map = internals.bag.optionsMap;
  if (!map) {
    map = discriminatorMap(internals.def);
    internals.bag.optionsMap = map;
  }
  const option = map.get(value as util.Primitive);
  if (option === null) throw new Error(`Ambiguous discriminator value "${String(value)}"`);
  return option as any;
}

function discriminatorMap(def: $SchemaDiscriminatedUnionDef<readonly SomeType[]>): Map<util.Primitive, $SchemaType | null> {
  const map = new Map<util.Primitive, $SchemaType | null>();
  for (const option of def.options as readonly $SchemaType[]) {
    const values = option._schema.propValues?.[def.discriminator];
    if (!values || values.size === 0)
      throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
    for (const value of values) {
      if (map.has(value)) {
        if (value !== undefined) throw new Error(`Duplicate discriminator value "${String(value)}"`);
        // keep the collision marked so a later member cannot reclaim it
        map.set(value, null);
      } else {
        map.set(value, option);
      }
    }
  }
  return map;
}

export interface $SchemaDiscriminatedUnion<
  Options extends readonly SomeType[] = readonly $SchemaType[],
  Disc extends string = string,
> extends $SchemaType {
  _schema: $SchemaDiscriminatedUnionInternals<Options, Disc>;
}

export const $SchemaDiscriminatedUnion: core.$constructor<$SchemaDiscriminatedUnion> =
  /*@__PURE__*/
  core.$constructor("$SchemaDiscriminatedUnion", (inst, def) => {
    def.inclusive = false;

    $SchemaUnion.init(inst, def);

    const _super = inst._schema.parse;
    util.defineLazyInternal(inst, "propValues", (schema) => {
      const propValues: util.PropValues = {};
      let undefinedCount = 0;
      for (const option of Schema.def.options) {
        const pv = option._schema.propValues;
        if (!pv || Object.keys(pv).length === 0)
          throw new Error(`Invalid discriminated union option at index "${Schema.def.options.indexOf(option)}"`);
        if (pv[Schema.def.discriminator]?.has(undefined)) undefinedCount++;
        for (const [k, v] of Object.entries(pv!)) {
          if (!Object.prototype.hasOwnProperty.call(propValues, k)) {
            util.assignProp(propValues, k, new Set());
          }
          for (const val of v) {
            propValues[k].add(val);
          }
        }
      }
      if (!Schema.def.unionFallback && undefinedCount > 1) propValues[Schema.def.discriminator]?.delete(undefined);
      return propValues;
    });

    // Checked now rather than in the lookup map below, so an option that lacks the discriminator fails at the `discriminatedUnion` call instead of on the first object parsed. Options whose shape cannot be enumerated without resolving it — pipes and lazies — are left to the map.
    def.options.forEach((option, i) => {
      const propShape = util.rawShape(option._schema.def);
      if (propShape && !Object.prototype.hasOwnProperty.call(propShape, def.discriminator)) {
        throw new Error(`Invalid discriminated union option at index "${i}"`);
      }
    });

    const disc = util.cached(() => discriminatorMap(def));

    inst._schema.parse = (payload, ctx) => {
      const input = payload.value;
      if (!util.isObject(input)) {
        payload.issues.push({
          code: "invalid_type",

          expected: "object",
          input,
          inst,
        });
        return payload;
      }

      const value = input?.[def.discriminator];
      const opt = disc.value.get(value as util.Primitive);
      // forward metadata cannot choose an encoder for an absent tag
      if (opt && (value !== undefined || ctx.direction !== "backward")) {
        return opt._schema.run(payload, ctx) as any;
      }

      // Fall back to union matching when the fast discriminator path fails:
      // - explicitly enabled via unionFallback, or
      // - during backward direction (encode), since codec-based discriminators have different values in forward vs backward directions
      if (def.unionFallback || ctx.direction === "backward") {
        return _super(payload, ctx);
      }

      // no matching discriminator
      payload.issues.push({
        code: "invalid_union",
        errors: [],
        note: "No matching discriminator",
        discriminator: def.discriminator,
        options: Array.from(disc.value.keys()).filter((value) => disc.value.get(value) !== null),
        input,
        path: [def.discriminator],
        inst,
      });

      return payload;
    };
  });

////////////////////////////////////////////////
////////////////////////////////////////////////
//////////                            //////////
//////////      $SchemaIntersection      //////////
//////////                            //////////
////////////////////////////////////////////////
////////////////////////////////////////////////

export interface $SchemaIntersectionDef<Left extends SomeType = $SchemaType, Right extends SomeType = $SchemaType>
  extends $SchemaTypeDef {
  type: "intersection";
  left: Left;
  right: Right;
}

export interface $SchemaIntersectionInternals<A extends SomeType = $SchemaType, B extends SomeType = $SchemaType>
  extends _$SchemaTypeInternals {
  // $SchemaTypeInternals<core.output<A> & core.output<B>, core.input<A> & core.input<B>>
  def: $SchemaIntersectionDef<A, B>;
  isst: never;
  optin: A["_schema"]["optin"] | B["_schema"]["optin"];
  optout: A["_schema"]["optout"] | B["_schema"]["optout"];
  output: core.output<A> & core.output<B>;
  input: core.input<A> & core.input<B>;
}

export interface $SchemaIntersection<A extends SomeType = $SchemaType, B extends SomeType = $SchemaType> extends $SchemaType {
  _schema: $SchemaIntersectionInternals<A, B>;
}

export const $SchemaIntersection: core.$constructor<$SchemaIntersection> = /*@__PURE__*/ core.$constructor(
  "$SchemaIntersection",
  (inst, def) => {
    $SchemaType.init(inst, def);

    inst._schema.parse = (payload, ctx) => {
      const input = payload.value;
      const left = def.left._schema.run({ value: input, issues: [] }, ctx);
      const right = def.right._schema.run({ value: input, issues: [] }, ctx);
      const async = left instanceof Promise || right instanceof Promise;

      if (async) {
        return Promise.all([left, right]).then(([left, right]) => {
          return handleIntersectionResults(payload, left, right);
        });
      }

      return handleIntersectionResults(payload, left, right);
    };
  }
);

export function mergeValues(
  a: any,
  b: any
): { valid: true; data: any } | { valid: false; mergeErrorPath: (string | number)[] } {
  // const aType = parse.t(a);
  // const bType = parse.t(b);

  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (util.isPlainObject(a) && util.isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);

    const newObj: any = { ...a, ...b };
    if (Object.prototype.hasOwnProperty.call(newObj, "__proto__")) delete newObj.__proto__;
    for (const key of sharedKeys) {
      if (key === "__proto__") continue;
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath],
        };
      }
      newObj[key] = sharedValue.data;
    }

    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }

    const newArray: unknown[] = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);

      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath],
        };
      }

      newArray.push(sharedValue.data);
    }

    return { valid: true, data: newArray };
  }

  return { valid: false, mergeErrorPath: [] };
}

function handleIntersectionResults(result: ParsePayload, left: ParsePayload, right: ParsePayload): ParsePayload {
  // Track which side(s) reject each key. A key rejection is reported only when BOTH sides reject it, so a key owned by one branch survives the other's key Schema. strictObject reports these as unrecognized_keys; a record with an open key schema reports one invalid_key per key.
  const unrecKeys = new Map<string, { l?: true; r?: true }>();
  let unrecIssue: errors.$SchemaRawIssue | undefined;
  const keyIssues = new Map<string, errors.$SchemaRawIssue>();

  const collect = (iss: errors.$SchemaRawIssue, side: "l" | "r"): boolean => {
    let keys: string[];
    if (iss.code === "unrecognized_keys" && !iss.path?.length) {
      unrecIssue ??= iss;
      keys = iss.keys as string[];
    } else if (iss.code === "invalid_key" && iss.origin === "record" && iss.path?.length === 1) {
      const k = String(iss.path[0]);
      if (!keyIssues.has(k)) keyIssues.set(k, iss);
      keys = [k];
    } else {
      return false;
    }
    for (const k of keys) {
      if (!unrecKeys.has(k)) unrecKeys.set(k, {});
      unrecKeys.get(k)![side] = true;
    }
    return true;
  };

  for (const iss of left.issues) {
    if (!collect(iss, "l")) result.issues.push(iss);
  }

  for (const iss of right.issues) {
    if (!collect(iss, "r")) result.issues.push(iss);
  }

  // Report only keys rejected by BOTH sides
  const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
  if (bothKeys.length) {
    const aggregated = unrecIssue ? bothKeys.filter((k) => (unrecIssue!.keys as string[]).includes(k)) : [];
    if (aggregated.length) result.issues.push({ ...unrecIssue!, keys: aggregated });
    for (const k of bothKeys) {
      if (!aggregated.includes(k) && keyIssues.has(k)) result.issues.push(keyIssues.get(k)!);
    }
  }

  const merged = mergeValues(left.value, right.value);

  if (!merged.valid) {
    if (util.aborted(result)) return result;
    throw new Error(`Unmergable intersection. Error path: ` + `${JSON.stringify(merged.mergeErrorPath)}`);
  }

  result.value = merged.data;
  return result;
}

/////////////////////////////////////////
/////////////////////////////////////////
//////////                     //////////
//////////      $SchemaTuple      //////////
//////////                     //////////
/////////////////////////////////////////
/////////////////////////////////////////

export interface $SchemaTupleDef<
  T extends util.TupleItems = readonly $SchemaType[],
  Rest extends SomeType | null = $SchemaType | null,
> extends $SchemaTypeDef {
  type: "tuple";
  items: T;
  rest: Rest;
}

export type $InferTupleInputType<T extends util.TupleItems, Rest extends SomeType | null> = [
  ...TupleInputTypeWithOptionals<T>,
  ...(Rest extends SomeType ? core.input<Rest>[] : []),
];
type TupleInputTypeNoOptionals<T extends util.TupleItems> = {
  [k in keyof T]: core.input<T[k]>;
};
type TupleInputTypeWithOptionals<T extends util.TupleItems> = T extends readonly [
  ...infer Prefix extends SomeType[],
  infer Tail extends SomeType,
]
  ? Tail["_schema"]["optin"] extends "optional" | "defaulted"
    ? [...TupleInputTypeWithOptionals<Prefix>, core.input<Tail>?]
    : TupleInputTypeNoOptionals<T>
  : [];

export type $InferTupleOutputType<T extends util.TupleItems, Rest extends SomeType | null> = [
  ...TupleOutputTypeWithOptionals<T>,
  ...(Rest extends SomeType ? core.output<Rest>[] : []),
];
type TupleOutputTypeNoOptionals<T extends util.TupleItems> = {
  [k in keyof T]: core.output<T[k]>;
};
type TupleOutputTypeWithOptionals<T extends util.TupleItems> = T extends readonly [
  ...infer Prefix extends SomeType[],
  infer Tail extends SomeType,
]
  ? Tail["_schema"]["optout"] extends "optional"
    ? [...TupleOutputTypeWithOptionals<Prefix>, core.output<Tail>?]
    : TupleOutputTypeNoOptionals<T>
  : [];

export interface $SchemaTupleInternals<
  T extends util.TupleItems = readonly $SchemaType[],
  Rest extends SomeType | null = $SchemaType | null,
> extends _$SchemaTypeInternals {
  def: $SchemaTupleDef<T, Rest>;
  isst: errors.$SchemaIssueInvalidType | errors.$SchemaIssueTooBig<unknown[]> | errors.$SchemaIssueTooSmall<unknown[]>;
  // $SchemaTypeInternals<$InferTupleOutputType<T, Rest>, $InferTupleInputType<T, Rest>>
  output: $InferTupleOutputType<T, Rest>;
  input: $InferTupleInputType<T, Rest>;
}

export interface $SchemaTuple<
  T extends util.TupleItems = readonly $SchemaType[],
  Rest extends SomeType | null = $SchemaType | null,
> extends $SchemaType {
  _schema: $SchemaTupleInternals<T, Rest>;
}

export const $SchemaTuple: core.$constructor<$SchemaTuple> = /*@__PURE__*/ core.$constructor("$SchemaTuple", (inst, def) => {
  $SchemaType.init(inst, def);
  const items = def.items;
  const memo = core.globalConfig.memoizer;
  memo?.attach(inst);

  inst._schema.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        input,
        inst,
        expected: "tuple",
        code: "invalid_type",
      });
      return payload;
    }

    payload.value = memo ? memo.alloc(inst, payload, [] as unknown[], ctx) : [];
    const proms: Promise<any>[] = [];

    const optinStart = getTupleOptStart(items, "optin");
    const optoutStart = getTupleOptStart(items, "optout");

    if (!def.rest) {
      if (input.length < optinStart) {
        payload.issues.push({
          code: "too_small",
          minimum: optinStart,
          inclusive: true,
          input,
          inst,
          origin: "array" as const,
        });
        return payload;
      }
      if (input.length > items.length) {
        payload.issues.push({
          code: "too_big",
          maximum: items.length,
          inclusive: true,
          input,
          inst,
          origin: "array" as const,
        });
      }
    }

    // Run every item in parallel, collecting results into an indexed array. The post-processing in `handleTupleResults` walks them in order so it can decide whether an absent optional-output error can truncate the tail or must be reported to preserve required output.
    const itemResults: ParsePayload[] = new Array(items.length);
    // only tracked when there is a rest loop to skip
    const abortEarly = def.rest ? ctx?.abortEarly : undefined;
    let itemAborted = false;
    for (let i = 0; i < items.length; i++) {
      const r = items[i]._schema.run({ value: input[i], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(
          r.then((rr) => {
            itemResults[i] = rr;
          })
        );
      } else {
        itemResults[i] = r;
        if (abortEarly && !itemAborted && r.issues.length) itemAborted = util.aborted(r);
      }
    }

    // sound because rest is non-empty exactly when every fixed index is present, the one case handleTupleResults cannot discard an item's issues
    if (def.rest && !itemAborted) {
      let i = items.length - 1;
      const rest = input.slice(items.length);
      let seen = payload.issues.length;
      for (const el of rest) {
        if (abortEarly && payload.issues.length !== seen) {
          if (util.aborted(payload, seen)) break;
          seen = payload.issues.length;
        }
        i++;
        const result = def.rest._schema.run({ value: el, issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((r) => handleTupleResult(r, payload, i)));
        } else {
          handleTupleResult(result, payload, i);
        }
      }
    }

    if (proms.length) {
      return Promise.all(proms).then(() => handleTupleResults(itemResults, payload, items, input, optoutStart));
    }
    return handleTupleResults(itemResults, payload, items, input, optoutStart);
  };
});

function getTupleOptStart(items: readonly $SchemaType[], key: "optin" | "optout") {
  for (let i = items.length - 1; i >= 0; i--) {
    // optin is a three-rung ladder so any rung above `undefined` permits an absent slot; optout stays two-valued.
    const omittable = key === "optin" ? items[i]._schema.optin !== undefined : items[i]._schema.optout === "optional";
    if (!omittable) return i + 1;
  }
  return 0;
}

function handleTupleResult(result: ParsePayload, final: ParsePayload<any[]>, index: number) {
  if (result.issues.length) {
    final.issues.push(...util.prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}

function handleTupleResults(
  itemResults: ParsePayload[],
  final: ParsePayload<any[]>,
  items: readonly $SchemaType[],
  input: unknown[],
  optoutStart: number
) {
  // Walk results in order. Mirror $SchemaObject's swallow-on-absent-optional rule, but only after `optoutStart`: the first index where the output tuple tail can be absent.
  for (let i = 0; i < items.length; i++) {
    const r = itemResults[i];
    const isPresent = i < input.length;
    // The array analog of `handlePropertyResult`'s absent-key early return: the middle rung permits absence without supplying anything in its place, so the tail truncates here instead of materializing whatever the item made of `undefined`.
    if (!isPresent && i >= optoutStart && items[i]._schema.optin === "optional") {
      final.value.length = i;
      break;
    }
    if (r.issues.length) {
      if (!isPresent && i >= optoutStart) {
        final.value.length = i;
        break;
      }
      final.issues.push(...util.prefixIssues(i, r.issues));
    }
    final.value[i] = r.value;
  }

  // Drop trailing slots that produced `undefined` for absent input
  // (the array analog of an absent optional key on an object). The
  // `i >= input.length` floor is critical: an explicit `undefined`
  // *inside* the input must be preserved even when the schema is
  // optional-out (e.g. `Schema.string().or(Schema.undefined())` accepting an
  // explicit undefined value).
  for (let i = final.value.length - 1; i >= input.length; i--) {
    if (items[i]._schema.optout === "optional" && final.value[i] === undefined) {
      final.value.length = i;
    } else {
      break;
    }
  }
  return final;
}

//////////////////////////////////////////
//////////////////////////////////////////
//////////                      //////////
//////////      $SchemaRecord      //////////
//////////                      //////////
//////////////////////////////////////////
//////////////////////////////////////////

export type $SchemaRecordKey = $SchemaType<string | number | symbol, unknown>; // $HasValues | $HasPattern;
export interface $SchemaRecordDef<Key extends $SchemaRecordKey = $SchemaRecordKey, Value extends SomeType = $SchemaType>
  extends $SchemaTypeDef {
  type: "record";
  keyType: Key;
  valueType: Value;
  /** @default "strict" - errors on keys not matching keyType. "loose" passes through non-matching keys unchanged. */
  mode?: "strict" | "loose";
  partial?: boolean;
}

// export type $InferSchemaRecordOutput<
//   Key extends $SchemaRecordKey = $SchemaRecordKey,
//   Value extends SomeType = $SchemaType,
// > = undefined extends Key["_schema"]["values"]
//   ? string extends core.output<Key>
//     ? Record<core.output<Key>, core.output<Value>>
//     : number extends core.output<Key>
//       ? Record<core.output<Key>, core.output<Value>>
//       : symbol extends core.output<Key>
//         ? Record<core.output<Key>, core.output<Value>>
//         : Record<core.output<Key>, core.output<Value>>
//   : Record<core.output<Key>, core.output<Value>>;
export type $InferSchemaRecordOutput<
  Key extends $SchemaRecordKey = $SchemaRecordKey,
  Value extends SomeType = $SchemaType,
> = Key extends $partial
  ? Partial<Record<core.output<Key>, core.output<Value>>>
  : Record<core.output<Key>, core.output<Value>>;

// export type $InferSchemaRecordInput<
//   Key extends $SchemaRecordKey = $SchemaRecordKey,
//   Value extends SomeType = $SchemaType,
// > = undefined extends Key["_schema"]["values"]
//   ? string extends core.input<Key>
//     ? Record<core.input<Key>, core.input<Value>>
//     : number extends core.input<Key>
//       ? Record<core.input<Key>, core.input<Value>>
//       : symbol extends core.input<Key>
//         ? Record<core.input<Key>, core.input<Value>>
//         : Record<core.input<Key>, core.input<Value>>
//   : Record<core.input<Key>, core.input<Value>>;

export type $InferSchemaRecordInput<
  Key extends $SchemaRecordKey = $SchemaRecordKey,
  Value extends SomeType = $SchemaType,
> = Key extends $partial
  ? Partial<Record<core.input<Key> & PropertyKey, core.input<Value>>>
  : // A value schema that accepts an absent slot makes the key omittable on the way in, exactly as it does in an object shape. The output side keeps every key, since the parser fills each one.
    [Value] extends [OptionalInSchema]
    ? Partial<Record<core.input<Key> & PropertyKey, core.input<Value>>>
    : Record<core.input<Key> & PropertyKey, core.input<Value>>;

export interface $SchemaRecordInternals<Key extends $SchemaRecordKey = $SchemaRecordKey, Value extends SomeType = $SchemaType>
  extends $SchemaTypeInternals<$InferSchemaRecordOutput<Key, Value>, $InferSchemaRecordInput<Key, Value>> {
  def: $SchemaRecordDef<Key, Value>;
  isst: errors.$SchemaIssueInvalidType | errors.$SchemaIssueInvalidKey<Record<PropertyKey, unknown>>;
  optin?: "optional" | undefined;
  optout?: "optional" | undefined;
}

export type $partial = { "~~partial": true };
export interface $SchemaRecord<Key extends $SchemaRecordKey = $SchemaRecordKey, Value extends SomeType = $SchemaType>
  extends $SchemaType {
  _schema: $SchemaRecordInternals<Key, Value>;
}

export const $SchemaRecord: core.$constructor<$SchemaRecord> = /*@__PURE__*/ core.$constructor("$SchemaRecord", (inst, def) => {
  $SchemaType.init(inst, def);
  const memo = core.globalConfig.memoizer;
  memo?.attach(inst);

  inst._schema.parse = (payload, ctx) => {
    const input = payload.value;

    if (!util.isPlainObject(input)) {
      payload.issues.push({
        expected: "record",
        code: "invalid_type",

        input,
        inst,
      });
      return payload;
    }

    // no guard in either loop below: a record's invalid_key aborts but an enclosing intersection can reconcile it, so a stopped loop hides keys the sibling does not own and the intersection then rejects nothing
    const proms: Promise<any>[] = [];

    const values = def.keyType._schema.values;
    if (values && !def.partial) {
      payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
      const recordKeys = new Set<string | symbol>();
      for (const key of values) {
        if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
          recordKeys.add(typeof key === "number" ? key.toString() : key);
          // A declared __proto__ is stripped but is not an unrecognized key.
          if (key === "__proto__") continue;
          const keyResult = def.keyType._schema.run({ value: key, issues: [] }, ctx);
          if (keyResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (keyResult.issues.length) {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())),
              input: key,
              path: [key],
              inst,
            });
            continue;
          }
          const outKey = keyResult.value as PropertyKey;
          if (outKey === "__proto__") continue;
          const result = def.valueType._schema.run({ value: input[key], issues: [] }, ctx);

          if (result instanceof Promise) {
            proms.push(
              result.then((result) => {
                if (result.issues.length) {
                  payload.issues.push(...util.prefixIssues(key, result.issues));
                }
                payload.value[outKey] = result.value;
              })
            );
          } else {
            if (result.issues.length) {
              payload.issues.push(...util.prefixIssues(key, result.issues));
            }
            payload.value[outKey] = result.value;
          }
        }
      }

      let unrecognized!: string[];
      for (const key in input) {
        if (!recordKeys.has(key)) {
          if (def.mode === "loose") {
            // skip __proto__ so it can't replace the result prototype via the assignment setter on the plain {} we build into
            if (key === "__proto__") continue;
            payload.value[key] = input[key];
          } else {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key);
          }
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",

          input,
          inst,
          keys: unrecognized,
          continue: true,
        });
      }
    } else {
      payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
      // An enumerable key schema declares which keys the record owns, so a key outside the set is unrecognized. A non-enumerable one (regex, refine) is a constraint every key must satisfy, so a failing key is invalid. Only the former is reconcilable against the other side of an intersection.
      let unrecognized!: string[];
      // Reflect.ownKeys for Symbol-key support; filter non-enumerable to match Schema.object()
      for (const key of Reflect.ownKeys(input)) {
        if (key === "__proto__") continue;
        if (!Object.prototype.propertyIsEnumerable.call(input, key)) continue;
        let keyResult = def.keyType._schema.run({ value: key, issues: [] }, ctx);
        if (keyResult instanceof Promise) {
          throw new Error("Async schemas not supported in object keys currently");
        }

        // Numeric string fallback: if key is a numeric string and failed, retry with Number(key). This handles Schema.number(), Schema.literal([1, 2, 3]), and unions containing numeric literals
        const checkNumericKey = typeof key === "string" && regexes.number.test(key) && keyResult.issues.length;
        if (checkNumericKey) {
          const retryResult = def.keyType._schema.run({ value: Number(key), issues: [] }, ctx);
          if (retryResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (retryResult.issues.length === 0) {
            keyResult = retryResult;
          }
        }

        if (keyResult.issues.length) {
          if (def.mode === "loose") {
            // Pass through unchanged
            payload.value[key] = input[key];
          } else if (values) {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key as string);
          } else {
            // Default "strict" behavior: error on invalid key
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())),
              input: key,
              path: [key],
              inst,
            });
          }
          continue;
        }

        // the guard above tests the raw input key, but the key schema can normalize an ordinary key into __proto__; re-check the key we actually write under
        const outKey = keyResult.value as PropertyKey;
        if (outKey === "__proto__") continue;

        const result = def.valueType._schema.run({ value: input[key], issues: [] }, ctx);

        if (result instanceof Promise) {
          proms.push(
            result.then((result) => {
              if (result.issues.length) {
                payload.issues.push(...util.prefixIssues(key, result.issues));
              }
              payload.value[outKey] = result.value;
            })
          );
        } else {
          if (result.issues.length) {
            payload.issues.push(...util.prefixIssues(key, result.issues));
          }
          payload.value[outKey] = result.value;
        }
      }

      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",

          input,
          inst,
          keys: unrecognized,
          continue: true,
        });
      }
    }

    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});

///////////////////////////////////////
///////////////////////////////////////
//////////                   //////////
//////////      $SchemaMap      //////////
//////////                   //////////
///////////////////////////////////////
///////////////////////////////////////
export interface $SchemaMapDef<Key extends SomeType = $SchemaType, Value extends SomeType = $SchemaType> extends $SchemaTypeDef {
  type: "map";
  keyType: Key;
  valueType: Value;
}

export interface $SchemaMapInternals<Key extends SomeType = $SchemaType, Value extends SomeType = $SchemaType>
  extends $SchemaTypeInternals<Map<core.output<Key>, core.output<Value>>, Map<core.input<Key>, core.input<Value>>> {
  def: $SchemaMapDef<Key, Value>;
  isst: errors.$SchemaIssueInvalidType | errors.$SchemaIssueInvalidKey | errors.$SchemaIssueInvalidElement<unknown>;
  optin?: "optional" | undefined;
  optout?: "optional" | undefined;
}

export interface $SchemaMap<Key extends SomeType = $SchemaType, Value extends SomeType = $SchemaType> extends $SchemaType {
  _schema: $SchemaMapInternals<Key, Value>;
}

export const $SchemaMap: core.$constructor<$SchemaMap> = /*@__PURE__*/ core.$constructor("$SchemaMap", (inst, def) => {
  $SchemaType.init(inst, def);
  const memo = core.globalConfig.memoizer;
  memo?.attach(inst);

  inst._schema.parse = (payload, ctx) => {
    const input = payload.value;
    if (!(input instanceof Map)) {
      payload.issues.push({
        expected: "map",
        code: "invalid_type",

        input,
        inst,
      });
      return payload;
    }

    const proms: Promise<any>[] = [];
    payload.value = memo ? memo.alloc(inst, payload, new Map(), ctx) : new Map();
    const abortEarly = ctx?.abortEarly;
    let seen = payload.issues.length;

    for (const [key, value] of input) {
      if (abortEarly && payload.issues.length !== seen) {
        if (util.aborted(payload, seen)) break;
        seen = payload.issues.length;
      }
      const keyResult = def.keyType._schema.run({ value: key, issues: [] }, ctx);
      const valueResult = def.valueType._schema.run({ value: value, issues: [] }, ctx);

      if (keyResult instanceof Promise || valueResult instanceof Promise) {
        proms.push(
          Promise.all([keyResult, valueResult]).then(([keyResult, valueResult]) => {
            handleMapResult(keyResult, valueResult, payload, key, input, inst, ctx);
          })
        );
      } else {
        handleMapResult(keyResult as ParsePayload, valueResult as ParsePayload, payload, key, input, inst, ctx);
      }
    }

    if (proms.length) return Promise.all(proms).then(() => payload);
    return payload;
  };
});

function handleMapResult(
  keyResult: ParsePayload,
  valueResult: ParsePayload,
  final: ParsePayload<Map<unknown, unknown>>,
  key: unknown,
  input: Map<any, any>,
  inst: $SchemaMap,
  ctx?: ParseContext | undefined
): void {
  if (keyResult.issues.length) {
    if (util.propertyKeyTypes.has(typeof key)) {
      final.issues.push(...util.prefixIssues(key as PropertyKey, keyResult.issues));
    } else {
      final.issues.push({
        code: "invalid_key",

        origin: "map",
        input,
        inst,
        issues: keyResult.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())),
      });
    }
  }
  if (valueResult.issues.length) {
    if (util.propertyKeyTypes.has(typeof key)) {
      final.issues.push(...util.prefixIssues(key as PropertyKey, valueResult.issues));
    } else {
      final.issues.push({
        origin: "map",
        code: "invalid_element",

        input,
        inst,
        key: key,
        issues: valueResult.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())),
      });
    }
  }
  final.value.set(keyResult.value, valueResult.value);
}

///////////////////////////////////////
///////////////////////////////////////
//////////                   //////////
//////////      $SchemaSet      //////////
//////////                   //////////
///////////////////////////////////////
///////////////////////////////////////
export interface $SchemaSetDef<T extends SomeType = $SchemaType> extends $SchemaTypeDef {
  type: "set";
  valueType: T;
}

export interface $SchemaSetInternals<T extends SomeType = $SchemaType>
  extends $SchemaTypeInternals<Set<core.output<T>>, Set<core.input<T>>> {
  def: $SchemaSetDef<T>;
  isst: errors.$SchemaIssueInvalidType;
  optin?: "optional" | undefined;
  optout?: "optional" | undefined;
}

export interface $SchemaSet<T extends SomeType = $SchemaType> extends $SchemaType {
  _schema: $SchemaSetInternals<T>;
}

export const $SchemaSet: core.$constructor<$SchemaSet> = /*@__PURE__*/ core.$constructor("$SchemaSet", (inst, def) => {
  $SchemaType.init(inst, def);
  const memo = core.globalConfig.memoizer;
  memo?.attach(inst);

  inst._schema.parse = (payload, ctx) => {
    const input = payload.value;
    if (!(input instanceof Set)) {
      payload.issues.push({
        input,
        inst,
        expected: "set",
        code: "invalid_type",
      });
      return payload;
    }

    const proms: Promise<any>[] = [];
    payload.value = memo ? memo.alloc(inst, payload, new Set(), ctx) : new Set();
    const abortEarly = ctx?.abortEarly;
    let seen = payload.issues.length;
    for (const item of input) {
      if (abortEarly && payload.issues.length !== seen) {
        if (util.aborted(payload, seen)) break;
        seen = payload.issues.length;
      }
      const result = def.valueType._schema.run({ value: item, issues: [] }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result) => handleSetResult(result, payload)));
      } else handleSetResult(result, payload);
    }

    if (proms.length) return Promise.all(proms).then(() => payload);
    return payload;
  };
});

function handleSetResult(result: ParsePayload, final: ParsePayload<Set<any>>) {
  if (result.issues.length) {
    final.issues.push(...result.issues);
  }
  final.value.add(result.value);
}

////////////////////////////////////////
////////////////////////////////////////
//////////                    //////////
//////////      $SchemaEnum      //////////
//////////                    //////////
////////////////////////////////////////
////////////////////////////////////////
export type $InferEnumOutput<T extends util.EnumLike> = T[keyof T] & {};
export type $InferEnumInput<T extends util.EnumLike> = T[keyof T] & {};

export interface $SchemaEnumDef<T extends util.EnumLike = util.EnumLike> extends $SchemaTypeDef {
  type: "enum";
  entries: T;
}

export interface $SchemaEnumInternals<
  /** @ts-ignore Cast variance */
  out T extends util.EnumLike = util.EnumLike,
> extends $SchemaTypeInternals<$InferEnumOutput<T>, $InferEnumInput<T>> {
  // enum: T;

  def: $SchemaEnumDef<T>;
  /** @deprecated Internal API, use with caution (not deprecated) */
  values: util.PrimitiveSet;
  /** @deprecated Internal API, use with caution (not deprecated) */
  pattern: RegExp;
  isst: errors.$SchemaIssueInvalidValue;
}

export interface $SchemaEnum<T extends util.EnumLike = util.EnumLike> extends $SchemaType {
  _schema: $SchemaEnumInternals<T>;
}

export const $SchemaEnum: core.$constructor<$SchemaEnum> = /*@__PURE__*/ core.$constructor("$SchemaEnum", (inst, def) => {
  $SchemaType.init(inst, def);

  const values = util.getEnumValues(def.entries);
  const valuesSet = new Set<util.Primitive>(values);
  inst._schema.values = valuesSet;

  util.defineLazyInternal(inst, "pattern", (schema) => {
    const patternValues = util.getEnumValues(Schema.def.entries).filter((k) => util.propertyKeyTypes.has(typeof k));
    // unmatchable fallback, RE2-safe: an empty alternation would compile to /^()$/, which matches ""
    return new RegExp(
      patternValues.length ? `^(${patternValues.map((o) => util.escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$"
    );
  });

  inst._schema.parse = (payload, _ctx) => {
    const input = payload.value;
    if (valuesSet.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",

      values,
      input,
      inst,
    });
    return payload;
  };
});

////////////////////////////////////////
////////////////////////////////////////
//////////                    //////////
//////////      $SchemaLiteral      //////////
//////////                    //////////
////////////////////////////////////////
////////////////////////////////////////

export interface $SchemaLiteralDef<T extends util.Literal> extends $SchemaTypeDef {
  type: "literal";
  values: T[];
}

export interface $SchemaLiteralInternals<T extends util.Literal = util.Literal> extends $SchemaTypeInternals<T, T> {
  def: $SchemaLiteralDef<T>;
  values: Set<T>;
  pattern: RegExp;
  isst: errors.$SchemaIssueInvalidValue;
}

export interface $SchemaLiteral<T extends util.Literal = util.Literal> extends $SchemaType {
  _schema: $SchemaLiteralInternals<T>;
}

export const $SchemaLiteral: core.$constructor<$SchemaLiteral> = /*@__PURE__*/ core.$constructor(
  "$SchemaLiteral",
  (inst, def) => {
    $SchemaType.init(inst, def);

    const values = new Set<util.Literal>(def.values);
    inst._schema.values = values;

    util.defineLazyInternal(inst, "pattern", (schema) => {
      const vals = Schema.def.values;
      // unmatchable fallback, RE2-safe: an empty alternation would compile to /^()$/, which matches ""
      return new RegExp(
        vals.length
          ? `^(${vals
              .map((o: util.Literal) =>
                typeof o === "string" ? util.escapeRegex(o) : o ? util.escapeRegex(o.toString()) : String(o)
              )
              .join("|")})$`
          : "^[^\\s\\S]$"
      );
    });

    inst._schema.parse = (payload, _ctx) => {
      const input = payload.value;
      if (values.has(input)) {
        return payload;
      }
      payload.issues.push({
        code: "invalid_value",

        values: def.values,
        input,
        inst,
      });
      return payload;
    };
  }
);

////////////////////////////////////////
////////////////////////////////////////
//////////                    //////////
//////////      $SchemaConst      //////////
//////////                    //////////
////////////////////////////////////////
////////////////////////////////////////

// export interface $SchemaConstDef extends $SchemaTypeDef {
//   type: "const";
//   value: unknown;
// }

// export _interface $SchemaConstInternals<T extends util.Literal = util.Literal> extends $SchemaTypeInternals<T, T> {
//   _def: $SchemaConstDef;
//   _values: util.PrimitiveSet;
//   _pattern: RegExp;
//   _isst: errors.$SchemaIssueInvalidValue;
// }

// export const $SchemaConst: core.$constructor<{_schema: $SchemaConstInternals}> = /*@__PURE__*/ core.$constructor("$SchemaConst", (inst, def) => {
//   $SchemaType.init(inst, def);

//   if (util.primitiveTypes.has(typeof def.value) || def.value === null) {
//     inst._schema.values = new Set<util.Primitive>(def.value as any);
//   }

//   if (util.propertyKeyTypes.has(typeof def.value)) {
//     inst._schema.pattern = new RegExp(
//       `^(${typeof def.value === "string" ? util.escapeRegex(def.value) : (def.value as any).toString()})$`
//     );
//   } else {
//     throw new Error("Const value cannot be converted to regex");
//   }

//   inst._schema.parse = (payload, _ctx) => {
//     payload.value = def.value; // always override
//     return payload;
//   };
// });

//////////////////////////////////////////
//////////////////////////////////////////
//////////                      //////////
//////////      $SchemaFile        //////////
//////////                      //////////
//////////////////////////////////////////
//////////////////////////////////////////

// provide a fallback in case the File interface isn't provided in the environment
type _File = typeof globalThis extends { File: infer F extends new (...args: any[]) => any } ? InstanceType<F> : {};
/** Do not reference this directly. */
export interface File extends _File {
  readonly type: string;
  readonly size: number;
}

export interface $SchemaFileDef extends $SchemaTypeDef {
  type: "file";
}

export interface $SchemaFileInternals extends $SchemaTypeInternals<File, File> {
  def: $SchemaFileDef;
  isst: errors.$SchemaIssueInvalidType;
  bag: util.LoosePartial<{
    minimum: number;
    maximum: number;
    mime: util.MimeTypes[];
  }>;
}

export interface $SchemaFile extends $SchemaType {
  _schema: $SchemaFileInternals;
}

export const $SchemaFile: core.$constructor<$SchemaFile> = /*@__PURE__*/ core.$constructor("$SchemaFile", (inst, def) => {
  $SchemaType.init(inst, def);

  inst._schema.parse = (payload, _ctx) => {
    const input = payload.value;
    // @ts-ignore
    if (input instanceof File) return payload;
    payload.issues.push({
      expected: "file",
      code: "invalid_type",

      input,
      inst,
    });
    return payload;
  };
});

//////////////////////////////////////////////
//////////////////////////////////////////////
//////////                          //////////
//////////        $SchemaTransform        //////////
//////////                          //////////
//////////////////////////////////////////////
//////////////////////////////////////////////
export interface $SchemaTransformDef extends $SchemaTypeDef {
  type: "transform";
  transform: (input: unknown, payload: ParsePayload<unknown>) => util.MaybeAsync<unknown>;
}
export interface $SchemaTransformInternals<O = unknown, I = unknown> extends $SchemaTypeInternals<O, I> {
  def: $SchemaTransformDef;
  isst: never;
}

export interface $SchemaTransform<O = unknown, I = unknown> extends $SchemaType {
  _schema: $SchemaTransformInternals<O, I>;
}

export const $SchemaTransform: core.$constructor<$SchemaTransform> = /*@__PURE__*/ core.$constructor(
  "$SchemaTransform",
  (inst, def) => {
    $SchemaType.init(inst, def);
    inst._schema.optin = "optional";
    core.globalConfig.memoizer?.guard(inst);

    inst._schema.parse = (payload, ctx) => {
      if (ctx.direction === "backward") {
        throw new core.$SchemaEncodeError(inst.constructor.name);
      }

      const _out = def.transform(payload.value, payload);
      if (ctx.async) {
        const output = _out instanceof Promise ? _out : Promise.resolve(_out);
        return output.then((output) => {
          payload.value = output;
          return payload;
        });
      }

      if (_out instanceof Promise) {
        throw new core.$SchemaAsyncError();
      }

      payload.value = _out;
      return payload;
    };
  }
);

////////////////////////////////////////////
////////////////////////////////////////////
//////////                        //////////
//////////      $SchemaOptional      //////////
//////////                        //////////
////////////////////////////////////////////
////////////////////////////////////////////
export interface $SchemaOptionalDef<T extends SomeType = $SchemaType> extends $SchemaTypeDef {
  type: "optional";
  innerType: T;
}

export interface $SchemaOptionalInternals<T extends SomeType = $SchemaType>
  extends $SchemaTypeInternals<core.output<T> | undefined, core.input<T> | undefined> {
  def: $SchemaOptionalDef<T>;
  optin: "optional" | "defaulted";
  optout: "optional";
  isst: never;
  values: T["_schema"]["values"];
  pattern: T["_schema"]["pattern"];
}

export interface $SchemaOptional<T extends SomeType = $SchemaType> extends $SchemaType {
  _schema: $SchemaOptionalInternals<T>;
}

function handleOptionalResult(payload: ParsePayload, result: ParsePayload) {
  // A substituting schema that still failed has no usable answer; yield undefined. Its issues are simply dropped: it ran on a payload of its own, so there is no shared array to truncate and nothing of the caller's to lose with it.
  payload.value = result.issues.length ? undefined : result.value;
  return payload;
}

export const $SchemaOptional: core.$constructor<$SchemaOptional> = /*@__PURE__*/ core.$constructor(
  "$SchemaOptional",
  (inst, def) => {
    $SchemaType.init(inst, def);
    // .optional() propagates absence rather than substituting for it, so a defaulted inner keeps its rung.
    util.defineLazyInternal(inst, "optin", (schema) =>
      Schema.def.innerType._schema.optin === "defaulted" ? "defaulted" : "optional"
    );
    inst._schema.optout = "optional";

    util.defineLazyInternal(inst, "values", (schema) => {
      const values = (Schema.def as $SchemaOptionalDef).innerType._schema.values;
      return values ? new Set([...values, undefined]) : undefined;
    });
    util.defineLazyInternal(inst, "pattern", (schema) => {
      const pattern = (Schema.def as $SchemaOptionalDef).innerType._schema.pattern;
      return pattern ? new RegExp(`^(${util.cleanRegex(pattern.source)})?$`) : undefined;
    });

    inst._schema.parse = (payload, ctx) => {
      if (payload.value === undefined) {
        // Only the top rung substitutes a value for absence; everything else leaves it intact, which is what .optional() means.
        if (def.innerType._schema.optin !== "defaulted") return payload;
        // Its own payload, for the same reason $SchemaCatch gets one: a pipe forwards an unrecognized key through the caller's issues array, and this must not read that as the substituting schema failing and drop it.
        const result = def.innerType._schema.run({ value: payload.value, issues: [] }, ctx);
        if (result instanceof Promise) return result.then((result) => handleOptionalResult(payload, result));
        return handleOptionalResult(payload, result);
      }
      return def.innerType._schema.run(payload, ctx);
    };
  }
);

////////////////////////////////////////////////
////////////////////////////////////////////////
//////////                            //////////
//////////      $SchemaExactOptional     //////////
//////////                            //////////
////////////////////////////////////////////////
////////////////////////////////////////////////

// Def extends $SchemaOptionalDef (no additional fields needed)
export interface $SchemaExactOptionalDef<T extends SomeType = $SchemaType> extends $SchemaOptionalDef<T> {}

// Internals extends $SchemaOptionalInternals but narrows output/input types (removes | undefined)
export interface $SchemaExactOptionalInternals<T extends SomeType = $SchemaType> extends $SchemaOptionalInternals<T> {
  def: $SchemaExactOptionalDef<T>;
  output: core.output<T>; // NO | undefined (narrowed from parent)
  input: core.input<T>; // NO | undefined (narrowed from parent)
}

export interface $SchemaExactOptional<T extends SomeType = $SchemaType> extends $SchemaType {
  _schema: $SchemaExactOptionalInternals<T>;
}

export const $SchemaExactOptional: core.$constructor<$SchemaExactOptional> = /*@__PURE__*/ core.$constructor(
  "$SchemaExactOptional",
  (inst, def) => {
    // Call parent init - inherits optin/optout = "optional"
    $SchemaOptional.init(inst, def);

    // Override values/pattern to NOT add undefined
    util.defineLazyInternal(inst, "values", (schema) => Schema.def.innerType._schema.values);
    util.defineLazyInternal(inst, "pattern", (schema) => Schema.def.innerType._schema.pattern);

    // Override parse to just delegate (no undefined handling)
    inst._schema.parse = (payload, ctx) => {
      return def.innerType._schema.run(payload, ctx);
    };
  }
);

////////////////////////////////////////////
////////////////////////////////////////////
//////////                        //////////
//////////      $SchemaNullable      //////////
//////////                        //////////
////////////////////////////////////////////
////////////////////////////////////////////
export interface $SchemaNullableDef<T extends SomeType = $SchemaType> extends $SchemaTypeDef {
  type: "nullable";
  innerType: T;
}

export interface $SchemaNullableInternals<T extends SomeType = $SchemaType>
  extends $SchemaTypeInternals<core.output<T> | null, core.input<T> | null> {
  def: $SchemaNullableDef<T>;
  optin: T["_schema"]["optin"];
  optout: T["_schema"]["optout"];
  isst: never;
  values: T["_schema"]["values"];
  pattern: T["_schema"]["pattern"];
}

export interface $SchemaNullable<T extends SomeType = $SchemaType> extends $SchemaType {
  _schema: $SchemaNullableInternals<T>;
}

export const $SchemaNullable: core.$constructor<$SchemaNullable> = /*@__PURE__*/ core.$constructor(
  "$SchemaNullable",
  (inst, def) => {
    $SchemaType.init(inst, def);
    util.defineLazyInternal(inst, "optin", (schema) => Schema.def.innerType._schema.optin);
    util.defineLazyInternal(inst, "optout", (schema) => Schema.def.innerType._schema.optout);

    util.defineLazyInternal(inst, "pattern", (schema) => {
      const pattern = Schema.def.innerType._schema.pattern;
      return pattern ? new RegExp(`^(${util.cleanRegex(pattern.source)}|null)$`) : undefined;
    });

    util.defineLazyInternal(inst, "values", (schema) => {
      return Schema.def.innerType._schema.values ? new Set([...Schema.def.innerType._schema.values, null]) : undefined;
    });

    inst._schema.parse = (payload, ctx) => {
      // Forward direction (decode): allow null to pass through
      if (payload.value === null) return payload;
      return def.innerType._schema.run(payload, ctx);
    };
  }
);
// );

////////////////////////////////////////////
////////////////////////////////////////////
//////////                        //////////
//////////      $SchemaDefault       //////////
//////////                        //////////
////////////////////////////////////////////
////////////////////////////////////////////
export interface $SchemaDefaultDef<T extends SomeType = $SchemaType> extends $SchemaTypeDef {
  type: "default";
  innerType: T;
  /** The default value. May be a getter. */
  defaultValue: util.NoUndefined<core.output<T>>;
}

export interface $SchemaDefaultInternals<T extends SomeType = $SchemaType>
  extends $SchemaTypeInternals<util.NoUndefined<core.output<T>>, core.input<T> | undefined> {
  def: $SchemaDefaultDef<T>;
  optin: "defaulted";
  optout?: "optional" | undefined; // required
  isst: never;
  values: T["_schema"]["values"];
}

export interface $SchemaDefault<T extends SomeType = $SchemaType> extends $SchemaType {
  _schema: $SchemaDefaultInternals<T>;
}

export const $SchemaDefault: core.$constructor<$SchemaDefault> = /*@__PURE__*/ core.$constructor(
  "$SchemaDefault",
  (inst, def) => {
    $SchemaType.init(inst, def);

    // inst._schema.qin = "true";
    inst._schema.optin = "defaulted";
    util.defineLazyInternal(inst, "values", (schema) => Schema.def.innerType._schema.values);

    inst._schema.parse = (payload, ctx) => {
      if (ctx.direction === "backward") {
        return def.innerType._schema.run(payload, ctx);
      }

      // Forward direction (decode): apply defaults for undefined input
      if (payload.value === undefined) {
        payload.value = def.defaultValue;
        /**
         * $SchemaDefault returns the default value immediately in forward direction.
         * It doesn't pass the default value into the validator ("prefault"). There's no reason to pass the default value through validation. The validity of the default is enforced by TypeScript statically. Otherwise, it's the responsibility of the user to ensure the default is valid. In the case of pipes with divergent in/out types, you can specify the default on the `in` schema of your SchemaPipe to set a "prefault" for the pipe.   */
        return payload;
      }
      // Forward direction: continue with default handling
      const result = def.innerType._schema.run(payload, ctx);
      if (result instanceof Promise) {
        return result.then((result) => handleDefaultResult(result, def));
      }
      return handleDefaultResult(result, def);
    };
  }
);

function handleDefaultResult(payload: ParsePayload, def: $SchemaDefaultDef) {
  if (payload.value === undefined) {
    payload.value = def.defaultValue;
  }
  return payload;
}

////////////////////////////////////////////
////////////////////////////////////////////
//////////                        //////////
//////////      $SchemaPrefault      //////////
//////////                        //////////
////////////////////////////////////////////
////////////////////////////////////////////

export interface $SchemaPrefaultDef<T extends SomeType = $SchemaType> extends $SchemaTypeDef {
  type: "prefault";
  innerType: T;
  /** The default value. May be a getter. */
  defaultValue: core.input<T>;
}

export interface $SchemaPrefaultInternals<T extends SomeType = $SchemaType>
  extends $SchemaTypeInternals<core.output<T>, core.input<T> | undefined> {
  def: $SchemaPrefaultDef<T>;
  optin: "defaulted";
  optout?: "optional" | undefined;
  isst: never;
  values: T["_schema"]["values"];
}

export interface $SchemaPrefault<T extends SomeType = $SchemaType> extends $SchemaType {
  _schema: $SchemaPrefaultInternals<T>;
}

export const $SchemaPrefault: core.$constructor<$SchemaPrefault> = /*@__PURE__*/ core.$constructor(
  "$SchemaPrefault",
  (inst, def) => {
    $SchemaType.init(inst, def);

    inst._schema.optin = "defaulted";
    util.defineLazyInternal(inst, "values", (schema) => Schema.def.innerType._schema.values);

    inst._schema.parse = (payload, ctx) => {
      if (ctx.direction === "backward") {
        return def.innerType._schema.run(payload, ctx);
      }

      // Forward direction (decode): apply prefault for undefined input
      if (payload.value === undefined) {
        payload.value = def.defaultValue;
      }
      return def.innerType._schema.run(payload, ctx);
    };
  }
);

///////////////////////////////////////////////
///////////////////////////////////////////////
//////////                           //////////
//////////      $SchemaNonOptional      //////////
//////////                           //////////
///////////////////////////////////////////////
///////////////////////////////////////////////
export interface $SchemaNonOptionalDef<T extends SomeType = $SchemaType> extends $SchemaTypeDef {
  type: "nonoptional";
  innerType: T;
}

export interface $SchemaNonOptionalInternals<T extends SomeType = $SchemaType>
  extends $SchemaTypeInternals<util.NoUndefined<core.output<T>>, util.NoUndefined<core.input<T>>> {
  def: $SchemaNonOptionalDef<T>;
  isst: errors.$SchemaIssueInvalidType;
  values: T["_schema"]["values"];
  optin: "optional" | undefined;
  optout: "optional" | undefined;
}

export interface $SchemaNonOptional<T extends SomeType = $SchemaType> extends $SchemaType {
  _schema: $SchemaNonOptionalInternals<T>;
}

export const $SchemaNonOptional: core.$constructor<$SchemaNonOptional> = /*@__PURE__*/ core.$constructor(
  "$SchemaNonOptional",
  (inst, def) => {
    $SchemaType.init(inst, def);

    util.defineLazyInternal(inst, "values", (schema) => {
      const v = Schema.def.innerType._schema.values;
      return v ? new Set([...v].filter((x) => x !== undefined)) : undefined;
    });

    inst._schema.parse = (payload, ctx) => {
      const result = def.innerType._schema.run(payload, ctx);
      if (result instanceof Promise) {
        return result.then((result) => handleNonOptionalResult(result, inst));
      }
      return handleNonOptionalResult(result, inst);
    };
  }
);

function handleNonOptionalResult(payload: ParsePayload, inst: $SchemaNonOptional) {
  if (!payload.issues.length && payload.value === undefined) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst,
    });
  }
  return payload;
}

////////////////////////////////////////////
////////////////////////////////////////////
//////////                        //////////
//////////      $SchemaCoalesce      //////////
//////////                        //////////
////////////////////////////////////////////
////////////////////////////////////////////
// export interface $SchemaCoalesceDef<T extends $SchemaType = $SchemaType> extends $SchemaTypeDef {
//   type: "coalesce";
//   innerType: T;
//   defaultValue: () => NonNullable<T['_schema']["output"]>;
// }

// export _interface $SchemaCoalesceInternals<T extends $SchemaType = $SchemaType>
//   extends $SchemaTypeInternals<NonNullable<T['_schema']["output"]>, T['_schema']["input"] | undefined | null> {
//   _def: $SchemaCoalesceDef<T>;
//   _isst: errors.$SchemaIssueInvalidType;
//   _qin: "true";
// }

// function handleCoalesceResult(payload: ParsePayload, def: $SchemaCoalesceDef) {
//   payload.value ??= def.defaultValue();
//   return payload;
// }

// export const $SchemaCoalesce: core.$constructor<{_schema: $SchemaCoalesceInternals}> = /*@__PURE__*/ core.$constructor(
//   "$SchemaCoalesce",
//   (inst, def) => {
//     $SchemaType.init(inst, def);
// inst._schema.qin = "true";
//     inst._schema.parse = (payload, ctx) => {
//       const result = def.innerType._schema.run(payload, ctx);
//       if (result instanceof Promise) {
//         return result.then((result) => handleCoalesceResult(result, def));
//       }
//       return handleCoalesceResult(result, def);
//     };
//   }
// );

/////////////////////////////////////////////
/////////////////////////////////////////////
//////////                         //////////
//////////      $SchemaSuccess        //////////
//////////                         //////////
/////////////////////////////////////////////
/////////////////////////////////////////////
export interface $SchemaSuccessDef<T extends SomeType = $SchemaType> extends $SchemaTypeDef {
  type: "success";
  innerType: T;
}

export interface $SchemaSuccessInternals<T extends SomeType = $SchemaType> extends $SchemaTypeInternals<boolean, core.input<T>> {
  def: $SchemaSuccessDef<T>;
  isst: never;
  optin: T["_schema"]["optin"];
  optout: "optional" | undefined;
}

export interface $SchemaSuccess<T extends SomeType = $SchemaType> extends $SchemaType {
  _schema: $SchemaSuccessInternals<T>;
}

export const $SchemaSuccess: core.$constructor<$SchemaSuccess> = /*@__PURE__*/ core.$constructor(
  "$SchemaSuccess",
  (inst, def) => {
    $SchemaType.init(inst, def);

    inst._schema.parse = (payload, ctx) => {
      if (ctx.direction === "backward") {
        throw new core.$SchemaEncodeError("SchemaSuccess");
      }

      const result = def.innerType._schema.run(payload, ctx);
      if (result instanceof Promise) {
        return result.then((result) => {
          payload.value = result.issues.length === 0;
          return payload;
        });
      }
      payload.value = result.issues.length === 0;
      return payload;
    };
  }
);

////////////////////////////////////////////
////////////////////////////////////////////
//////////                        //////////
//////////       $SchemaCatch        //////////
//////////                        //////////
////////////////////////////////////////////
////////////////////////////////////////////
export interface $SchemaCatchCtx extends ParsePayload {
  /** @deprecated Use `ctx.issues` */
  error: { issues: errors.$SchemaIssue[] };
  /** @deprecated Use `ctx.value` */
  input: unknown;
}
export interface $SchemaCatchDef<T extends SomeType = $SchemaType> extends $SchemaTypeDef {
  type: "catch";
  innerType: T;
  catchValue: (ctx: $SchemaCatchCtx) => unknown;
}

export interface $SchemaCatchInternals<T extends SomeType = $SchemaType>
  extends $SchemaTypeInternals<core.output<T>, core.input<T>> {
  def: $SchemaCatchDef<T>;
  optin: T["_schema"]["optin"];
  optout: T["_schema"]["optout"];
  isst: never;
  values: T["_schema"]["values"];
}

export interface $SchemaCatch<T extends SomeType = $SchemaType> extends $SchemaType {
  _schema: $SchemaCatchInternals<T>;
}

function handleCatchResult(payload: ParsePayload, result: ParsePayload, def: $SchemaCatchDef, ctx: ParseContextInternal) {
  if (!result.issues.length) {
    payload.value = result.value;
    // The value carries up, so the flag describing it has to carry with it: a back-edge into a node still being parsed must not be frozen by an enclosing readonly, and its checks belong to the node itself. Guarded so the ordinary case adds no own property.
    if (result.memo) payload.memo = true;
    return payload;
  }

  // Spread the inner's own payload, not ours: `value` has to stay the input the catch was handed, and the inner ran on a payload of its own so its issues are already private to this call.
  payload.value = def.catchValue({
    ...result,
    value: payload.value,
    error: {
      issues: result.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())),
    },
    input: payload.value,
  });
  return payload;
}

export const $SchemaCatch: core.$constructor<$SchemaCatch> = /*@__PURE__*/ core.$constructor("$SchemaCatch", (inst, def) => {
  $SchemaType.init(inst, def);
  util.defineLazyInternal(inst, "optin", (schema) =>
    Schema.def.innerType._schema.optin === "defaulted" ? "defaulted" : "optional"
  );
  util.defineLazyInternal(inst, "optout", (schema) => Schema.def.innerType._schema.optout);
  util.defineLazyInternal(inst, "values", (schema) => Schema.def.innerType._schema.values);

  inst._schema.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._schema.run(payload, ctx);
    }

    // Forward direction (decode): apply catch logic
    const result = def.innerType._schema.run({ value: payload.value, issues: [] }, ctx);
    if (result instanceof Promise) {
      return result.then((result) => handleCatchResult(payload, result, def, ctx));
    }

    return handleCatchResult(payload, result, def, ctx);
  };
});

////////////////////////////////////////////
////////////////////////////////////////////
//////////                        //////////
//////////        $SchemaNaN         //////////
//////////                        //////////
////////////////////////////////////////////
////////////////////////////////////////////
export interface $SchemaNaNDef extends $SchemaTypeDef {
  type: "nan";
}

export interface $SchemaNaNInternals extends $SchemaTypeInternals<number, number> {
  def: $SchemaNaNDef;
  isst: errors.$SchemaIssueInvalidType;
}

export interface $SchemaNaN extends $SchemaType {
  _schema: $SchemaNaNInternals;
}

export const $SchemaNaN: core.$constructor<$SchemaNaN> = /*@__PURE__*/ core.$constructor("$SchemaNaN", (inst, def) => {
  $SchemaType.init(inst, def);

  inst._schema.parse = (payload, _ctx) => {
    if (typeof payload.value !== "number" || !Number.isNaN(payload.value)) {
      payload.issues.push({
        input: payload.value,
        inst,
        expected: "nan",
        code: "invalid_type",
      });
      return payload;
    }
    return payload;
  };
});

////////////////////////////////////////////
////////////////////////////////////////////
//////////                        //////////
//////////      $SchemaPipe      //////////
//////////                        //////////
////////////////////////////////////////////
////////////////////////////////////////////
export interface $SchemaPipeDef<A extends SomeType = $SchemaType, B extends SomeType = $SchemaType> extends $SchemaTypeDef {
  type: "pipe";
  in: A;
  out: B;
  /** Only defined inside $SchemaCodec instances. */
  transform?: (value: core.output<A>, payload: ParsePayload<core.output<A>>) => util.MaybeAsync<core.input<B>>;
  /** Only defined inside $SchemaCodec instances. */
  reverseTransform?: (value: core.input<B>, payload: ParsePayload<core.input<B>>) => util.MaybeAsync<core.output<A>>;
}

export interface $SchemaPipeInternals<A extends SomeType = $SchemaType, B extends SomeType = $SchemaType>
  extends $SchemaTypeInternals<core.output<B>, core.input<A>> {
  def: $SchemaPipeDef<A, B>;
  isst: never;
  values: A["_schema"]["values"];
  optin: A["_schema"]["optin"];
  optout: B["_schema"]["optout"];
  propValues: A["_schema"]["propValues"];
}

export interface $SchemaPipe<A extends SomeType = $SchemaType, B extends SomeType = $SchemaType> extends $SchemaType {
  _schema: $SchemaPipeInternals<A, B>;
}

export const $SchemaPipe: core.$constructor<$SchemaPipe> = /*@__PURE__*/ core.$constructor("$SchemaPipe", (inst, def) => {
  $SchemaType.init(inst, def);
  util.defineLazyInternal(inst, "values", (schema) => Schema.def.in._schema.values);
  util.defineLazyInternal(inst, "optin", (schema) => Schema.def.in._schema.optin);
  util.defineLazyInternal(inst, "optout", (schema) => Schema.def.out._schema.optout);
  util.defineLazyInternal(inst, "propValues", (schema) => Schema.def.in._schema.propValues);

  inst._schema.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      const right = def.out._schema.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right) => handlePipeResult(right, def.in, ctx));
      }
      return handlePipeResult(right, def.in, ctx);
    }

    const left = def.in._schema.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left) => handlePipeResult(left, def.out, ctx));
    }
    return handlePipeResult(left, def.out, ctx);
  };
});

function handlePipeResult(left: ParsePayload, next: $SchemaType, ctx: ParseContextInternal) {
  // Any issue stops the pipe, so a failing refinement never feeds its transform. An unrecognized key is the exception: it describes the input's extra properties, not the value being piped, and an enclosing intersection may yet reconcile it.
  if (left.issues.some((iss) => iss.code !== "unrecognized_keys")) {
    // prevent further checks
    left.aborted = true;
    return left;
  }
  return next._schema.run({ value: left.value, issues: left.issues }, ctx);
}

////////////////////////////////////////////
////////////////////////////////////////////
//////////                        //////////
//////////      $SchemaCodec         //////////
//////////                        //////////
////////////////////////////////////////////
////////////////////////////////////////////
export interface $SchemaCodecDef<A extends SomeType = $SchemaType, B extends SomeType = $SchemaType> extends $SchemaPipeDef<A, B> {
  transform: (value: core.output<A>, payload: ParsePayload<core.output<A>>) => util.MaybeAsync<core.input<B>>;
  reverseTransform: (value: core.input<B>, payload: ParsePayload<core.input<B>>) => util.MaybeAsync<core.output<A>>;
}

export interface $SchemaCodecInternals<A extends SomeType = $SchemaType, B extends SomeType = $SchemaType>
  extends $SchemaTypeInternals<core.output<B>, core.input<A>> {
  def: $SchemaCodecDef<A, B>;
  isst: never;
  values: A["_schema"]["values"];
  optin: A["_schema"]["optin"];
  optout: B["_schema"]["optout"];
  propValues: A["_schema"]["propValues"];
}

export interface $SchemaCodec<A extends SomeType = $SchemaType, B extends SomeType = $SchemaType> extends $SchemaType {
  _schema: $SchemaCodecInternals<A, B>;
}

export const $SchemaCodec: core.$constructor<$SchemaCodec> = /*@__PURE__*/ core.$constructor("$SchemaCodec", (inst, def) => {
  $SchemaType.init(inst, def);
  util.defineLazyInternal(inst, "values", (schema) => Schema.def.in._schema.values);
  util.defineLazyInternal(inst, "optin", (schema) => Schema.def.in._schema.optin);
  util.defineLazyInternal(inst, "optout", (schema) => Schema.def.out._schema.optout);
  util.defineLazyInternal(inst, "propValues", (schema) => Schema.def.in._schema.propValues);

  inst._schema.parse = (payload, ctx) => {
    const direction = ctx.direction || "forward";
    if (direction === "forward") {
      const left = def.in._schema.run(payload, ctx);
      if (left instanceof Promise) {
        return left.then((left) => handleCodecAResult(left, def, ctx));
      }
      return handleCodecAResult(left, def, ctx);
    } else {
      const right = def.out._schema.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right) => handleCodecAResult(right, def, ctx));
      }
      return handleCodecAResult(right, def, ctx);
    }
  };
});

function handleCodecAResult(result: ParsePayload, def: $SchemaCodecDef, ctx: ParseContextInternal) {
  if (result.issues.length) {
    // prevent further checks
    result.aborted = true;
    return result;
  }

  const direction = ctx.direction || "forward";

  if (direction === "forward") {
    const transformed = def.transform(result.value, result);
    if (transformed instanceof Promise) {
      return transformed.then((value) => handleCodecTxResult(result, value, def.out, ctx));
    }
    return handleCodecTxResult(result, transformed, def.out, ctx);
  } else {
    const transformed = def.reverseTransform(result.value, result);
    if (transformed instanceof Promise) {
      return transformed.then((value) => handleCodecTxResult(result, value, def.in, ctx));
    }
    return handleCodecTxResult(result, transformed, def.in, ctx);
  }
}

function handleCodecTxResult(left: ParsePayload, value: any, nextSchema: SomeType, ctx: ParseContextInternal) {
  // Check if transform added any issues
  if (left.issues.length) {
    left.aborted = true;
    return left;
  }

  return nextSchema._schema.run({ value, issues: left.issues }, ctx);
}

/////////////////////////////////////////////////
/////////////////////////////////////////////////
//////////                             //////////
//////////      $SchemaPreprocess         //////////
//////////                             //////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
export interface $SchemaPreprocessDef<B extends SomeType = $SchemaType, I = unknown>
  extends $SchemaPipeDef<$SchemaTransform<unknown, I>, B> {
  in: $SchemaTransform<unknown, I>;
  out: B;
}

export interface $SchemaPreprocessInternals<B extends SomeType = $SchemaType, I = unknown>
  extends $SchemaPipeInternals<$SchemaTransform<unknown, I>, B> {
  def: $SchemaPreprocessDef<B, I>;
  optin: B["_schema"]["optin"];
  optout: B["_schema"]["optout"];
}

export interface $SchemaPreprocess<B extends SomeType = $SchemaType, I = unknown>
  extends $SchemaPipe<$SchemaTransform<unknown, I>, B> {
  _schema: $SchemaPreprocessInternals<B, I>;
}

export const $SchemaPreprocess: core.$constructor<$SchemaPreprocess> = /*@__PURE__*/ core.$constructor(
  "$SchemaPreprocess",
  (inst, def) => {
    $SchemaPipe.init(inst, def);
  }
);

////////////////////////////////////////////
////////////////////////////////////////////
//////////                        //////////
//////////      $SchemaReadonly      //////////
//////////                        //////////
////////////////////////////////////////////
////////////////////////////////////////////

export interface $SchemaReadonlyDef<T extends SomeType = $SchemaType> extends $SchemaTypeDef {
  type: "readonly";
  innerType: T;
}

export interface $SchemaReadonlyInternals<T extends SomeType = $SchemaType>
  extends $SchemaTypeInternals<util.MakeReadonly<core.output<T>>, util.MakeReadonly<core.input<T>>> {
  def: $SchemaReadonlyDef<T>;
  optin: T["_schema"]["optin"];
  optout: T["_schema"]["optout"];
  isst: never;
  propValues: T["_schema"]["propValues"];
  values: T["_schema"]["values"];
}

export interface $SchemaReadonly<T extends SomeType = $SchemaType> extends $SchemaType {
  _schema: $SchemaReadonlyInternals<T>;
}

export const $SchemaReadonly: core.$constructor<$SchemaReadonly> = /*@__PURE__*/ core.$constructor(
  "$SchemaReadonly",
  (inst, def) => {
    $SchemaType.init(inst, def);
    util.defineLazyInternal(inst, "propValues", (schema) => Schema.def.innerType._schema.propValues);
    util.defineLazyInternal(inst, "values", (schema) => Schema.def.innerType._schema.values);
    util.defineLazyInternal(inst, "optin", (schema) => Schema.def.innerType?._schema?.optin);
    util.defineLazyInternal(inst, "optout", (schema) => Schema.def.innerType?._schema?.optout);

    inst._schema.parse = (payload, ctx) => {
      if (ctx.direction === "backward") {
        return def.innerType._schema.run(payload, ctx);
      }
      const result = def.innerType._schema.run(payload, ctx);
      if (result instanceof Promise) {
        return result.then(handleReadonlyResult);
      }
      return handleReadonlyResult(result);
    };
  }
);

function handleReadonlyResult(payload: ParsePayload): ParsePayload {
  // A repeat visit hands back a node that is still being built; freezing it here would make the rest of its keys fail to assign.
  if (!payload.memo) payload.value = Object.freeze(payload.value);
  return payload;
}

/////////////////////////////////////////////
/////////////////////////////////////////////
//////////                         //////////
//////////   $SchemaTemplateLiteral   //////////
//////////                         //////////
/////////////////////////////////////////////
/////////////////////////////////////////////

export interface $SchemaTemplateLiteralDef extends $SchemaTypeDef {
  type: "template_literal";
  parts: $SchemaTemplateLiteralPart[];
  format?: string | undefined;
}
export interface $SchemaTemplateLiteralInternals<Template extends string = string>
  extends $SchemaTypeInternals<Template, Template> {
  pattern: RegExp;
  def: $SchemaTemplateLiteralDef;
  isst: errors.$SchemaIssueInvalidType;
}

export interface $SchemaTemplateLiteral<Template extends string = string> extends $SchemaType {
  _schema: $SchemaTemplateLiteralInternals<Template>;
}

type LiteralPart = Exclude<util.Literal, symbol>; //string | number | boolean | null | undefined;
interface SchemaPartInternals extends $SchemaTypeInternals<LiteralPart, LiteralPart> {
  pattern: RegExp;
}
interface SchemaPart extends $SchemaType {
  _schema: SchemaPartInternals;
}
export type $SchemaTemplateLiteralPart = LiteralPart | SchemaPart;

type UndefinedToEmptyString<T> = T extends undefined ? "" : T;
type AppendToTemplateLiteral<
  Template extends string,
  Suffix extends LiteralPart | $SchemaType,
> = Suffix extends LiteralPart
  ? `${Template}${UndefinedToEmptyString<Suffix>}`
  : Suffix extends $SchemaType
    ? `${Template}${core.output<Suffix> extends infer T extends LiteralPart ? UndefinedToEmptyString<T> : never}`
    : never;

export type ConcatenateTupleOfStrings<T extends string[]> = T extends [
  infer First extends string,
  ...infer Rest extends string[],
]
  ? Rest extends string[]
    ? First extends ""
      ? ConcatenateTupleOfStrings<Rest>
      : `${First}${ConcatenateTupleOfStrings<Rest>}`
    : never
  : "";
export type ConvertPartsToStringTuple<Parts extends $SchemaTemplateLiteralPart[]> = {
  [K in keyof Parts]: Parts[K] extends LiteralPart
    ? `${UndefinedToEmptyString<Parts[K]>}`
    : Parts[K] extends $SchemaType
      ? `${core.output<Parts[K]> extends infer T extends LiteralPart ? UndefinedToEmptyString<T> : never}`
      : never;
};

export type ToTemplateLiteral<Parts extends $SchemaTemplateLiteralPart[]> = ConcatenateTupleOfStrings<
  ConvertPartsToStringTuple<Parts>
>;
// type lkjasd = ConcatenateTupleOfStrings<["Hello", " ", "World", "!"]>; // "Hello World!"
export type $PartsToTemplateLiteral<Parts extends $SchemaTemplateLiteralPart[]> = [] extends Parts
  ? ``
  : Parts extends [...infer Rest, infer Last extends $SchemaTemplateLiteralPart]
    ? Rest extends $SchemaTemplateLiteralPart[]
      ? AppendToTemplateLiteral<$PartsToTemplateLiteral<Rest>, Last>
      : never
    : never;

// a leaf's pattern source with its own checks folded in: the last pattern-carrying check wins, else length bounds narrow the catch-all, else an integer format narrows the number form. the fold lives here instead of on `_schema.pattern` so a bundle without template literals never pays for it
function leafPattern(schema: $SchemaType): string | undefined {
  const def = Schema._schema.def as { pattern?: RegExp; format?: string; checks?: checks.$SchemaCheck[] };
  let pattern = def.pattern;
  let isInt = !!def.format?.includes("int");
  let minimum: number | undefined;
  let maximum: number | undefined;
  for (const ch of def.checks ?? []) {
    const d = ch._schema.def as { pattern?: RegExp; format?: string; minimum?: number; maximum?: number; length?: number };
    if (d.pattern) pattern = d.pattern;
    isInt ||= !!d.format?.includes("int");
    const lo = d.minimum ?? d.length;
    const hi = d.maximum ?? d.length;
    if (lo !== undefined && (minimum === undefined || lo > minimum)) minimum = lo;
    if (hi !== undefined && (maximum === undefined || hi < maximum)) maximum = hi;
  }
  if (pattern) return pattern.source;
  // an empty range matches nothing at runtime, and `{8,5}` is not a legal quantifier
  if (minimum !== undefined && maximum !== undefined && minimum > maximum) return "(?!)";
  if (minimum !== undefined || maximum !== undefined) return regexes.string({ minimum, maximum }).source;
  const own = Schema._schema.pattern;
  return (isInt && own === regexes.number ? regexes.integer : own)?.source;
}

// a part's pattern source. a wrapper's pattern embeds its inner pattern's source verbatim, so the folded form is substituted in place without knowing the wrapper's own composition; a union's options are joined the way the union builds its own pattern
function partPattern(schema: $SchemaType): string | undefined {
  const def = Schema._schema.def as { innerType?: $SchemaType; options?: $SchemaType[] };
  const own = Schema._schema.pattern?.source;
  // lazy resolves its inner on the internals, not the def
  const inner = def.innerType ?? (Schema._schema as { innerType?: $SchemaType }).innerType;
  if (inner) {
    const before = inner._schema.pattern?.source;
    const after = partPattern(inner);
    if (own && before && after && after !== before) {
      return own.replace(util.cleanRegex(before), () => util.cleanRegex(after));
    }
    return own;
  }
  if (def.options) {
    const sources = def.options.map(partPattern);
    if (sources.every(Boolean)) return `^(${sources.map((s) => util.cleanRegex(s!)).join("|")})$`;
  }
  return leafPattern(schema);
}

export const $SchemaTemplateLiteral: core.$constructor<$SchemaTemplateLiteral> = /*@__PURE__*/ core.$constructor(
  "$SchemaTemplateLiteral",
  (inst, def) => {
    $SchemaType.init(inst, def);
    const regexParts: string[] = [];
    for (const part of def.parts) {
      if (typeof part === "object" && part !== null) {
        // is Schema schema
        const source = partPattern(part);
        if (!source) {
          throw new Error(`Invalid template literal part, no pattern found: ${[...(part as any)._schema.traits].shift()}`);
        }
        regexParts.push(util.cleanRegex(source));
      } else if (part === null || util.primitiveTypes.has(typeof part)) {
        regexParts.push(util.escapeRegex(`${part}`));
      } else {
        throw new Error(`Invalid template literal part: ${part}`);
      }
    }
    inst._schema.pattern = new RegExp(`^${regexParts.join("")}$`);

    inst._schema.parse = (payload, _ctx) => {
      if (typeof payload.value !== "string") {
        payload.issues.push({
          input: payload.value,
          inst,
          expected: "string",
          code: "invalid_type",
        });
        return payload;
      }

      inst._schema.pattern.lastIndex = 0;

      if (!inst._schema.pattern.test(payload.value)) {
        payload.issues.push({
          input: payload.value,
          inst,

          code: "invalid_format",
          format: def.format ?? "template_literal",
          pattern: inst._schema.pattern.source,
        });
        return payload;
      }

      return payload;
    };
  }
);

//////////////////////////////////////////
//////////////////////////////////////////
//////////                      //////////
//////////     $SchemaFunction     //////////
//////////                      //////////
//////////////////////////////////////////
//////////////////////////////////////////
export type $SchemaFunctionArgs = $SchemaType<unknown[], unknown[]>;
export type $SchemaFunctionIn = $SchemaFunctionArgs;
export type $SchemaFunctionOut = $SchemaType;

export type $InferInnerFunctionType<Args extends $SchemaFunctionIn, Returns extends $SchemaFunctionOut> = (
  ...args: $SchemaFunctionIn extends Args ? never[] : core.output<Args>
) => core.input<Returns>;

export type $InferInnerFunctionTypeAsync<Args extends $SchemaFunctionIn, Returns extends $SchemaFunctionOut> = (
  ...args: $SchemaFunctionIn extends Args ? never[] : core.output<Args>
) => util.MaybeAsync<core.input<Returns>>;

export type $InferOuterFunctionType<Args extends $SchemaFunctionIn, Returns extends $SchemaFunctionOut> = (
  ...args: $SchemaFunctionIn extends Args ? never[] : core.input<Args>
) => core.output<Returns>;

export type $InferOuterFunctionTypeAsync<Args extends $SchemaFunctionIn, Returns extends $SchemaFunctionOut> = (
  ...args: $SchemaFunctionIn extends Args ? never[] : core.input<Args>
) => Promise<core.output<Returns>>;

export interface $SchemaFunctionDef<
  In extends $SchemaFunctionIn = $SchemaFunctionIn,
  Out extends $SchemaFunctionOut = $SchemaFunctionOut,
> extends $SchemaTypeDef {
  type: "function";
  input: In;
  output: Out;
}

export interface $SchemaFunctionInternals<Args extends $SchemaFunctionIn, Returns extends $SchemaFunctionOut>
  extends $SchemaTypeInternals<$InferOuterFunctionType<Args, Returns>, $InferInnerFunctionType<Args, Returns>> {
  def: $SchemaFunctionDef<Args, Returns>;
  isst: errors.$SchemaIssueInvalidType;
}

export interface $SchemaFunction<
  Args extends $SchemaFunctionIn = $SchemaFunctionIn,
  Returns extends $SchemaFunctionOut = $SchemaFunctionOut,
> extends $SchemaType<any, any, $SchemaFunctionInternals<Args, Returns>> {
  /** @deprecated */
  _def: $SchemaFunctionDef<Args, Returns>;
  _input: $InferInnerFunctionType<Args, Returns>;
  _output: $InferOuterFunctionType<Args, Returns>;

  implement<F extends $InferInnerFunctionType<Args, Returns>>(
    func: F
  ): // allow for return type inference
  (
    ...args: Parameters<this["_output"]>
  ) => ReturnType<F> extends ReturnType<this["_output"]> ? ReturnType<F> : ReturnType<this["_output"]>;

  implementAsync<F extends $InferInnerFunctionTypeAsync<Args, Returns>>(
    func: F
  ): F extends $InferOuterFunctionTypeAsync<Args, Returns> ? F : $InferOuterFunctionTypeAsync<Args, Returns>;

  input<const Items extends util.TupleItems, const Rest extends $SchemaFunctionOut = $SchemaFunctionOut>(
    args: Items,
    rest?: Rest
  ): $SchemaFunction<$SchemaTuple<Items, Rest>, Returns>;
  input<NewArgs extends $SchemaFunctionIn>(args: NewArgs): $SchemaFunction<NewArgs, Returns>;
  input(...args: any[]): $SchemaFunction<any, Returns>;

  output<NewReturns extends $SchemaType>(output: NewReturns): $SchemaFunction<Args, NewReturns>;
}

export interface $SchemaFunctionParams<I extends $SchemaFunctionIn, O extends $SchemaType> {
  input?: I;
  output?: O;
}

export const $SchemaFunction: core.$constructor<$SchemaFunction> = /*@__PURE__*/ core.$constructor(
  "$SchemaFunction",
  (inst, def) => {
    $SchemaType.init(inst, def);
    // Defined, not assigned: the classic prototype exposes `_def` as a getter with no setter.
    Object.defineProperty(inst, "_def", { value: def });
    inst._schema.def = def;

    inst.implement = (func) => {
      if (typeof func !== "function") {
        throw new Error("implement() must be called with a function");
      }
      // Defined inline so the closure stays anonymous: binding it to a `const` first names it, which costs 256 bytes per implemented function.
      return Object.defineProperty(
        function (this: any, ...args: never[]) {
          const parsedArgs = inst._def.input ? parse(inst._def.input, args) : args;
          const result = Reflect.apply(func, this, parsedArgs as never[]);
          if (inst._def.output) {
            return parse(inst._def.output, result);
          }
          return result as any;
        },
        "_schema",
        { value: inst._schema, enumerable: false }
      ) as any;
    };

    inst.implementAsync = (func) => {
      if (typeof func !== "function") {
        throw new Error("implementAsync() must be called with a function");
      }
      return Object.defineProperty(
        async function (this: any, ...args: never[]) {
          const parsedArgs = inst._def.input ? await parseAsync(inst._def.input, args) : args;
          const result = await Reflect.apply(func, this, parsedArgs as never[]);
          if (inst._def.output) {
            return await parseAsync(inst._def.output, result);
          }
          return result;
        },
        "_schema",
        { value: inst._schema, enumerable: false }
      ) as any;
    };

    inst._schema.parse = (payload, _ctx) => {
      if (typeof payload.value !== "function") {
        payload.issues.push({
          code: "invalid_type",
          expected: "function",
          input: payload.value,
          inst,
        });
        return payload;
      }

      // Check if output is a promise type to determine if we should use async implementation
      const hasPromiseOutput = inst._def.output && inst._def.output._schema.def.type === "promise";

      if (hasPromiseOutput) {
        payload.value = inst.implementAsync(payload.value);
      } else {
        payload.value = inst.implement(payload.value);
      }
      return payload;
    };

    inst.input = (...args: any[]): $SchemaFunction<any, any> => {
      const F: any = inst.constructor;
      if (Array.isArray(args[0])) {
        return new F({
          type: "function",
          input: new $SchemaTuple({
            type: "tuple",
            items: args[0],
            rest: args[1],
          }),
          output: inst._def.output,
        });
      }

      return new F({
        type: "function",
        input: args[0],
        output: inst._def.output,
      });
    };

    inst.output = (output) => {
      const F: any = inst.constructor;
      return new F({
        type: "function",
        input: inst._def.input,
        output,
      });
    };

    return inst;
  }
);

/////////////////////////////////////////
/////////////////////////////////////////
//////////                     //////////
//////////     $SchemaPromise     //////////
//////////                     //////////
/////////////////////////////////////////
/////////////////////////////////////////
export interface $SchemaPromiseDef<T extends SomeType = $SchemaType> extends $SchemaTypeDef {
  type: "promise";
  innerType: T;
}

export interface $SchemaPromiseInternals<T extends SomeType = $SchemaType>
  extends $SchemaTypeInternals<Promise<core.output<T>>, util.MaybeAsync<core.input<T>>> {
  def: $SchemaPromiseDef<T>;
  isst: never;
}

export interface $SchemaPromise<T extends SomeType = $SchemaType> extends $SchemaType {
  _schema: $SchemaPromiseInternals<T>;
}

export const $SchemaPromise: core.$constructor<$SchemaPromise> = /*@__PURE__*/ core.$constructor(
  "$SchemaPromise",
  (inst, def) => {
    $SchemaType.init(inst, def);

    inst._schema.parse = (payload, ctx) => {
      return Promise.resolve(payload.value).then((inner) => def.innerType._schema.run({ value: inner, issues: [] }, ctx));
    };
  }
);

//////////////////////////////////////////
//////////////////////////////////////////
//////////                      //////////
//////////      $SchemaLazy        //////////
//////////                      //////////
//////////////////////////////////////////
//////////////////////////////////////////

export interface $SchemaLazyDef<T extends SomeType = $SchemaType> extends $SchemaTypeDef {
  type: "lazy";
  getter: () => T;
}

export interface $SchemaLazyInternals<T extends SomeType = $SchemaType>
  extends $SchemaTypeInternals<core.output<T>, core.input<T>> {
  def: $SchemaLazyDef<T>;
  isst: never;
  /** Auto-cached way to retrieve the inner schema */
  innerType: T;
  pattern: T["_schema"]["pattern"];
  propValues: T["_schema"]["propValues"];
  optin: T["_schema"]["optin"];
  optout: T["_schema"]["optout"];
}

export interface $SchemaLazy<T extends SomeType = $SchemaType> extends $SchemaType {
  _schema: $SchemaLazyInternals<T>;
}

export const $SchemaLazy: core.$constructor<$SchemaLazy> = /*@__PURE__*/ core.$constructor("$SchemaLazy", (inst, def) => {
  $SchemaType.init(inst, def);

  // Cache the resolved inner type on the shared `def` so all clones of this lazy (e.g. via `.describe()`/`.meta()`) share the same inner instance, preserving identity for cycle detection on recursive schemas.
  util.defineLazy(inst._schema, "innerType", () => {
    const d = def as $SchemaLazyDef & { _cachedInner?: $SchemaType };
    if (!d._cachedInner) d._cachedInner = def.getter() as $SchemaType;
    return d._cachedInner;
  });
  util.defineLazyInternal(inst, "pattern", (schema) => Schema.innerType?._schema?.pattern);
  util.defineLazyInternal(inst, "propValues", (schema) => Schema.innerType?._schema?.propValues);
  util.defineLazyInternal(inst, "optin", (schema) => Schema.innerType?._schema?.optin ?? undefined);
  util.defineLazyInternal(inst, "optout", (schema) => Schema.innerType?._schema?.optout ?? undefined);
  inst._schema.parse = (payload, ctx) => {
    const inner = inst._schema.innerType;
    return inner._schema.run(payload, ctx);
  };
});

////////////////////////////////////////
////////////////////////////////////////
//////////                    //////////
//////////     $SchemaCustom     //////////
//////////                    //////////
////////////////////////////////////////
////////////////////////////////////////
export interface $SchemaCustomDef<O = unknown> extends $SchemaTypeDef, checks.$SchemaCheckDef {
  type: "custom";
  check: "custom";
  path?: PropertyKey[] | undefined;
  error?: errors.$SchemaErrorMap | undefined;
  params?: Record<string, any> | undefined;
  fn: (arg: O) => unknown;
}

export interface $SchemaCustomInternals<O = unknown, I = unknown>
  extends $SchemaTypeInternals<O, I>,
    checks.$SchemaCheckInternals<O> {
  def: $SchemaCustomDef;
  issc: errors.$SchemaIssue;
  isst: never;
  bag: util.LoosePartial<{
    Class: typeof util.Class;
  }>;
}

export interface $SchemaCustom<O = unknown, I = unknown> extends $SchemaType {
  _schema: $SchemaCustomInternals<O, I>;
}

export const $SchemaCustom: core.$constructor<$SchemaCustom> = /*@__PURE__*/ core.$constructor("$SchemaCustom", (inst, def) => {
  checks.$SchemaCheck.init(inst, def);
  $SchemaType.init(inst, def);

  inst._schema.parse = (payload, _) => {
    return payload;
  };

  inst._schema.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input as any);
    if (r instanceof Promise) {
      return r.then((r) => handleRefineResult(r, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});

function handleRefineResult(result: unknown, payload: ParsePayload, input: unknown, inst: $SchemaCustom): void {
  if (!result) {
    const _iss: any = {
      code: "custom",
      input,
      inst, // incorporates params.error into issue reporting
      path: [...(inst._schema.def.path ?? [])], // incorporates params.error into issue reporting
      continue: !inst._schema.def.abort,
      // params: inst._schema.def.params,
    };
    if (inst._schema.def.params) _iss.params = inst._schema.def.params;
    payload.issues.push(util.issue(_iss));
  }
}

export type $SchemaTypes =
  | $SchemaString
  | $SchemaNumber
  | $SchemaBigInt
  | $SchemaBoolean
  | $SchemaDate
  | $SchemaSymbol
  | $SchemaUndefined
  | $SchemaNullable
  | $SchemaNull
  | $SchemaAny
  | $SchemaUnknown
  | $SchemaNever
  | $SchemaVoid
  | $SchemaArray
  | $SchemaObject
  | $SchemaUnion
  | $SchemaIntersection
  | $SchemaTuple
  | $SchemaRecord
  | $SchemaMap
  | $SchemaSet
  | $SchemaLiteral
  | $SchemaEnum
  | $SchemaFunction
  | $SchemaPromise
  | $SchemaLazy
  | $SchemaOptional
  | $SchemaDefault
  | $SchemaPrefault
  | $SchemaTemplateLiteral
  | $SchemaCustom
  | $SchemaTransform
  | $SchemaNonOptional
  | $SchemaReadonly
  | $SchemaNaN
  | $SchemaPipe
  | $SchemaSuccess
  | $SchemaCatch
  | $SchemaFile;

export type $SchemaStringFormatTypes =
  | $SchemaGUID
  | $SchemaUUID
  | $SchemaEmail
  | $SchemaURL
  | $SchemaEmoji
  | $SchemaNanoID
  | $SchemaCUID
  | $SchemaCUID2
  | $SchemaULID
  | $SchemaXID
  | $SchemaKSUID
  | $SchemaISODateTime
  | $SchemaISODate
  | $SchemaISOTime
  | $SchemaISODuration
  | $SchemaIPv4
  | $SchemaIPv6
  | $SchemaMAC
  | $SchemaCIDRv4
  | $SchemaCIDRv6
  | $SchemaBase64
  | $SchemaBase64URL
  | $SchemaE164
  | $SchemaCreditCard
  | $SchemaIBAN
  | $SchemaJWT
  | $SchemaCustomStringFormat<"hex">
  | $SchemaCustomStringFormat<util.HashFormat>
  | $SchemaCustomStringFormat<"hostname">
  | $SchemaCustomStringFormat<"currency_code">;
