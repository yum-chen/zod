import * as core from "./core.js";
import * as errors from "./errors.js";
import type * as schemas from "./schemas.js";
import * as util from "./util.js";

export type $SchemaErrorClass = { new (issues: errors.$SchemaIssue[]): errors.$SchemaError };
type $ParseParams = { callee?: util.AnyFunc; Err?: $SchemaErrorClass | undefined };

// Always both keys, so the `_params` read site in `_parse` sees one object shape rather than two.
function finalizeParams(callee: util.AnyFunc, params: $ParseParams | undefined): $ParseParams {
  return { callee: params?.callee ?? callee, Err: params?.Err };
}

///////////        METHODS       ///////////
export type $Parse = <T extends schemas.$SchemaType>(
  schema: T,
  value: unknown,
  _ctx?: schemas.ParseContext<errors.$SchemaIssue>,
  _params?: $ParseParams
) => core.output<T>;

export const _parse: (_Err: $SchemaErrorClass) => $Parse = (_Err) => {
  const fn: $Parse = (schema, value, _ctx, _params) => {
    const ctx: schemas.ParseContextInternal = _ctx ? { ..._ctx, async: false } : { async: false };
    const result = Schema._schema.run({ value, issues: [] }, ctx);
    if (result instanceof Promise) {
      throw new core.$SchemaAsyncError();
    }
    if (result.issues.length) {
      const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())));
      util.captureStackTrace(e, _params?.callee ?? fn);
      throw e;
    }
    return result.value as core.output<typeof schema>;
  };
  return fn;
};

export const parse: $Parse = /* @__PURE__*/ _parse(errors.$SchemaRealError);

export type $ParseAsync = <T extends schemas.$SchemaType>(
  schema: T,
  value: unknown,
  _ctx?: schemas.ParseContext<errors.$SchemaIssue>,
  _params?: $ParseParams
) => Promise<core.output<T>>;

export const _parseAsync: (_Err: $SchemaErrorClass) => $ParseAsync = (_Err) => {
  const fn: $ParseAsync = async (schema, value, _ctx, params) => {
    const ctx: schemas.ParseContextInternal = _ctx ? { ..._ctx, async: true } : { async: true };
    let result = Schema._schema.run({ value, issues: [] }, ctx);
    if (result instanceof Promise) result = await result;
    if (result.issues.length) {
      const e = new (params?.Err ?? _Err)(result.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())));
      util.captureStackTrace(e, params?.callee ?? fn);
      throw e;
    }
    return result.value as core.output<typeof schema>;
  };
  return fn;
};

export const parseAsync: $ParseAsync = /* @__PURE__*/ _parseAsync(errors.$SchemaRealError);

export type $SafeParse = <T extends schemas.$SchemaType>(
  schema: T,
  value: unknown,
  _ctx?: schemas.ParseContext<errors.$SchemaIssue>
) => util.SafeParseResult<core.output<T>>;

export const _safeParse: (_Err: $SchemaErrorClass) => $SafeParse = (_Err) => (schema, value, _ctx) => {
  const ctx: schemas.ParseContextInternal = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = Schema._schema.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new core.$SchemaAsyncError();
  }

  return result.issues.length ? failure(_Err, result.issues, ctx) : ({ success: true, data: result.value } as any);
};
export const safeParse: $SafeParse = /* @__PURE__*/ _safeParse(errors.$SchemaRealError);

// the error is built on the first read of `error`: finalizing the issues and constructing the instance is most of a failing parse, and a caller that only branches on `success` never pays it. a getter in the literal keeps this small; the alternative, one shared accessor descriptor plus a hidden state slot, reads ~15% faster but costs ~75 B gzipped in every bundle
function failure(Err: $SchemaErrorClass, issues: errors.$SchemaRawIssue[], ctx: schemas.ParseContextInternal): any {
  let error: errors.$SchemaError | undefined;
  return {
    success: false,
    get error() {
      if (!error) {
        error = new Err(issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())));
        // finalizeIssue drops `input`, so the built error holds nothing; keeping the raw issues past this point pins the parsed value for the life of the result
        issues = undefined as any;
        ctx = undefined as any;
      }
      return error;
    },
    set error(e: errors.$SchemaError) {
      error = e;
      // a replacement makes the getter's branch unreachable, so the captures have to go here too
      issues = undefined as any;
      ctx = undefined as any;
    },
  };
}

export type $SafeParseAsync = <T extends schemas.$SchemaType>(
  schema: T,
  value: unknown,
  _ctx?: schemas.ParseContext<errors.$SchemaIssue>
) => Promise<util.SafeParseResult<core.output<T>>>;

export const _safeParseAsync: (_Err: $SchemaErrorClass) => $SafeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx: schemas.ParseContextInternal = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = Schema._schema.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) result = await result;

  return result.issues.length ? failure(_Err, result.issues, ctx) : ({ success: true, data: result.value } as any);
};

export const safeParseAsync: $SafeParseAsync = /* @__PURE__*/ _safeParseAsync(errors.$SchemaRealError);

// registry mirrors of the compiler's sentinels, so this module never imports the compiler
const COMPILE_INVALID = /* @__PURE__ */ Symbol.for("Schema.compile.invalid");
const COMPILE_FALLBACK = /* @__PURE__ */ Symbol.for("Schema.compile.fallback");

interface CompiledBag {
  validator?: ((input: unknown) => unknown) & { definite?: boolean | undefined };
  fallbackRun?: (payload: schemas.ParsePayload, ctx: schemas.ParseContextInternal) => unknown;
}

export type $Validate = <T extends schemas.$SchemaType>(
  schema: T,
  value: unknown,
  _ctx?: schemas.ParseContext<errors.$SchemaIssue>
) => value is core.input<T>;

// Deliberately tiny, because v8 will not inline a body carrying the fallback's object literals and throw. Everything that is not the compiled happy path lives in validateFallback, and that split is worth ~35% on a compiled Schema.
export const validate: $Validate = ((
  schema: schemas.$SchemaType,
  value: unknown,
  _ctx?: schemas.ParseContext<errors.$SchemaIssue>
): boolean => {
  const validator = (Schema._schema.bag as CompiledBag).validator;
  if (validator !== undefined) {
    if (validator(value) !== COMPILE_INVALID) return true;
    // a definite sentinel means the runtime would reject, so skip the re-parse; a ctx can still change the answer
    if (validator.definite === true && _ctx === undefined) return false;
  }
  return validateFallback(schema, value, _ctx);
}) as $Validate;

function validateFallback(
  schema: schemas.$SchemaType,
  value: unknown,
  _ctx?: schemas.ParseContext<errors.$SchemaIssue>
): boolean {
  const ctx: schemas.ParseContextInternal = _ctx
    ? { ..._ctx, async: false, abortEarly: true }
    : { async: false, abortEarly: true };
  const fallbackRun = (Schema._schema.bag as CompiledBag).fallbackRun;
  let result: unknown;
  if (fallbackRun) {
    // skip nested fast paths on the fallback, so user callbacks keep the at-most-twice bound
    (ctx as Record<symbol, unknown>)[COMPILE_FALLBACK] = true;
    result = fallbackRun({ value, issues: [] }, ctx);
  } else {
    result = Schema._schema.run({ value, issues: [] }, ctx);
  }
  if (result instanceof Promise) {
    throw new core.$SchemaAsyncError();
  }
  return (result as schemas.ParsePayload).issues.length === 0;
}

export type $ValidateAsync = <T extends schemas.$SchemaType>(
  schema: T,
  value: unknown,
  _ctx?: schemas.ParseContext<errors.$SchemaIssue>
) => Promise<boolean>;

// no fast path: the compiler keeps async parses on the runtime, because a promise-returning callback that is not declared async compiles to a throw
export const validateAsync: $ValidateAsync = async (schema, value, _ctx) => {
  const ctx: schemas.ParseContextInternal = _ctx
    ? { ..._ctx, async: true, abortEarly: true }
    : { async: true, abortEarly: true };
  let result: unknown = Schema._schema.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) result = await result;
  return (result as schemas.ParsePayload).issues.length === 0;
};

// Codec functions
export type $Encode = <T extends schemas.$SchemaType>(
  schema: T,
  value: core.output<T>,
  _ctx?: schemas.ParseContext<errors.$SchemaIssue>,
  _params?: $ParseParams
) => core.input<T>;

export const _encode: (_Err: $SchemaErrorClass) => $Encode = (_Err) => {
  const parse = _parse(_Err);
  const fn: $Encode = (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" as const } : { direction: "backward" as const };
    return parse(schema, value, ctx as any, finalizeParams(fn, _params)) as any;
  };
  return fn;
};

export const encode: $Encode = /* @__PURE__*/ _encode(errors.$SchemaRealError);

export type $Decode = <T extends schemas.$SchemaType>(
  schema: T,
  value: core.input<T>,
  _ctx?: schemas.ParseContext<errors.$SchemaIssue>,
  _params?: $ParseParams
) => core.output<T>;

export const _decode: (_Err: $SchemaErrorClass) => $Decode = (_Err) => {
  const parse = _parse(_Err);
  const fn: $Decode = (schema, value, _ctx, _params) => {
    return parse(schema, value, _ctx, finalizeParams(fn, _params));
  };
  return fn;
};

export const decode: $Decode = /* @__PURE__*/ _decode(errors.$SchemaRealError);

export type $EncodeAsync = <T extends schemas.$SchemaType>(
  schema: T,
  value: core.output<T>,
  _ctx?: schemas.ParseContext<errors.$SchemaIssue>,
  _params?: $ParseParams
) => Promise<core.input<T>>;

export const _encodeAsync: (_Err: $SchemaErrorClass) => $EncodeAsync = (_Err) => {
  const parseAsync = _parseAsync(_Err);
  const fn: $EncodeAsync = async (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" as const } : { direction: "backward" as const };
    return (await parseAsync(schema, value, ctx as any, finalizeParams(fn, _params))) as any;
  };
  return fn;
};

export const encodeAsync: $EncodeAsync = /* @__PURE__*/ _encodeAsync(errors.$SchemaRealError);

export type $DecodeAsync = <T extends schemas.$SchemaType>(
  schema: T,
  value: core.input<T>,
  _ctx?: schemas.ParseContext<errors.$SchemaIssue>,
  _params?: $ParseParams
) => Promise<core.output<T>>;

export const _decodeAsync: (_Err: $SchemaErrorClass) => $DecodeAsync = (_Err) => {
  const parseAsync = _parseAsync(_Err);
  const fn: $DecodeAsync = async (schema, value, _ctx, _params) => {
    return await parseAsync(schema, value, _ctx, finalizeParams(fn, _params));
  };
  return fn;
};

export const decodeAsync: $DecodeAsync = /* @__PURE__*/ _decodeAsync(errors.$SchemaRealError);

export type $SafeEncode = <T extends schemas.$SchemaType>(
  schema: T,
  value: core.output<T>,
  _ctx?: schemas.ParseContext<errors.$SchemaIssue>
) => util.SafeParseResult<core.input<T>>;

export const _safeEncode: (_Err: $SchemaErrorClass) => $SafeEncode = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" as const } : { direction: "backward" as const };
  return _safeParse(_Err)(schema, value, ctx as any) as any;
};

export const safeEncode: $SafeEncode = /* @__PURE__*/ _safeEncode(errors.$SchemaRealError);

export type $SafeDecode = <T extends schemas.$SchemaType>(
  schema: T,
  value: core.input<T>,
  _ctx?: schemas.ParseContext<errors.$SchemaIssue>
) => util.SafeParseResult<core.output<T>>;

export const _safeDecode: (_Err: $SchemaErrorClass) => $SafeDecode = (_Err) => (schema, value, _ctx) => {
  return _safeParse(_Err)(schema, value, _ctx);
};

export const safeDecode: $SafeDecode = /* @__PURE__*/ _safeDecode(errors.$SchemaRealError);

export type $SafeEncodeAsync = <T extends schemas.$SchemaType>(
  schema: T,
  value: core.output<T>,
  _ctx?: schemas.ParseContext<errors.$SchemaIssue>
) => Promise<util.SafeParseResult<core.input<T>>>;

export const _safeEncodeAsync: (_Err: $SchemaErrorClass) => $SafeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" as const } : { direction: "backward" as const };
  return _safeParseAsync(_Err)(schema, value, ctx as any) as any;
};

export const safeEncodeAsync: $SafeEncodeAsync = /* @__PURE__*/ _safeEncodeAsync(errors.$SchemaRealError);

export type $SafeDecodeAsync = <T extends schemas.$SchemaType>(
  schema: T,
  value: core.input<T>,
  _ctx?: schemas.ParseContext<errors.$SchemaIssue>
) => Promise<util.SafeParseResult<core.output<T>>>;

export const _safeDecodeAsync: (_Err: $SchemaErrorClass) => $SafeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
  return _safeParseAsync(_Err)(schema, value, _ctx);
};

export const safeDecodeAsync: $SafeDecodeAsync = /* @__PURE__*/ _safeDecodeAsync(errors.$SchemaRealError);
