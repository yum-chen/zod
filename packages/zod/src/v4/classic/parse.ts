import * as core from "../core/index.js";
import { type SchemaError, SchemaRealError } from "./errors.js";

export type SchemaSafeParseResult<T> = SchemaSafeParseSuccess<T> | SchemaSafeParseError<T>;
export type SchemaSafeParseSuccess<T> = { success: true; data: T; error?: never };
export type SchemaSafeParseError<T> = { success: false; data?: never; error: SchemaError<T> };

export const parse: <T extends core.$SchemaType>(
  schema: T,
  value: unknown,
  _ctx?: core.ParseContext<core.$SchemaIssue>,
  _params?: { callee?: core.util.AnyFunc; Err?: core.$SchemaErrorClass }
) => core.output<T> = /* @__PURE__ */ core._parse(SchemaRealError);

export const parseAsync: <T extends core.$SchemaType>(
  schema: T,
  value: unknown,
  _ctx?: core.ParseContext<core.$SchemaIssue>,
  _params?: { callee?: core.util.AnyFunc; Err?: core.$SchemaErrorClass }
) => Promise<core.output<T>> = /* @__PURE__ */ core._parseAsync(SchemaRealError);

export const safeParse: <T extends core.$SchemaType>(
  schema: T,
  value: unknown,
  _ctx?: core.ParseContext<core.$SchemaIssue>
  // _params?: { callee?: core.util.AnyFunc; Err?: core.$SchemaErrorClass }
) => SchemaSafeParseResult<core.output<T>> = /* @__PURE__ */ core._safeParse(SchemaRealError) as any;

export const safeParseAsync: <T extends core.$SchemaType>(
  schema: T,
  value: unknown,
  _ctx?: core.ParseContext<core.$SchemaIssue>
) => Promise<SchemaSafeParseResult<core.output<T>>> = /* @__PURE__ */ core._safeParseAsync(SchemaRealError) as any;

export { validate, validateAsync } from "../core/index.js";

// Codec functions
export const encode: <T extends core.$SchemaType>(
  schema: T,
  value: core.output<T>,
  _ctx?: core.ParseContext<core.$SchemaIssue>,
  _params?: { callee?: core.util.AnyFunc; Err?: core.$SchemaErrorClass }
) => core.input<T> = /* @__PURE__ */ core._encode(SchemaRealError);

export const decode: <T extends core.$SchemaType>(
  schema: T,
  value: core.input<T>,
  _ctx?: core.ParseContext<core.$SchemaIssue>,
  _params?: { callee?: core.util.AnyFunc; Err?: core.$SchemaErrorClass }
) => core.output<T> = /* @__PURE__ */ core._decode(SchemaRealError);

export const encodeAsync: <T extends core.$SchemaType>(
  schema: T,
  value: core.output<T>,
  _ctx?: core.ParseContext<core.$SchemaIssue>,
  _params?: { callee?: core.util.AnyFunc; Err?: core.$SchemaErrorClass }
) => Promise<core.input<T>> = /* @__PURE__ */ core._encodeAsync(SchemaRealError);

export const decodeAsync: <T extends core.$SchemaType>(
  schema: T,
  value: core.input<T>,
  _ctx?: core.ParseContext<core.$SchemaIssue>,
  _params?: { callee?: core.util.AnyFunc; Err?: core.$SchemaErrorClass }
) => Promise<core.output<T>> = /* @__PURE__ */ core._decodeAsync(SchemaRealError);

export const safeEncode: <T extends core.$SchemaType>(
  schema: T,
  value: core.output<T>,
  _ctx?: core.ParseContext<core.$SchemaIssue>
) => SchemaSafeParseResult<core.input<T>> = /* @__PURE__ */ core._safeEncode(SchemaRealError) as any;

export const safeDecode: <T extends core.$SchemaType>(
  schema: T,
  value: core.input<T>,
  _ctx?: core.ParseContext<core.$SchemaIssue>
) => SchemaSafeParseResult<core.output<T>> = /* @__PURE__ */ core._safeDecode(SchemaRealError) as any;

export const safeEncodeAsync: <T extends core.$SchemaType>(
  schema: T,
  value: core.output<T>,
  _ctx?: core.ParseContext<core.$SchemaIssue>
) => Promise<SchemaSafeParseResult<core.input<T>>> = /* @__PURE__ */ core._safeEncodeAsync(SchemaRealError) as any;

export const safeDecodeAsync: <T extends core.$SchemaType>(
  schema: T,
  value: core.input<T>,
  _ctx?: core.ParseContext<core.$SchemaIssue>
) => Promise<SchemaSafeParseResult<core.output<T>>> = /* @__PURE__ */ core._safeDecodeAsync(SchemaRealError) as any;
