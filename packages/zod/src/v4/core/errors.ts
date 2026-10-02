import type { $SchemaCheck, $SchemaStringFormats } from "./checks.js";
import { $constructor } from "./core.js";
import type { $SchemaType } from "./schemas.js";
import type { StandardSchemaV1 } from "./standard-Schema.js";
import * as util from "./util.js";

///////////////////////////
////     base type     ////
///////////////////////////
export interface $SchemaIssueBase {
  readonly code?: string;
  readonly input?: unknown;
  readonly path: PropertyKey[];
  readonly message: string;
}

////////////////////////////////
////     issue subtypes     ////
////////////////////////////////
export type $SchemaInvalidTypeExpected =
  | "string"
  | "number"
  | "int"
  | "boolean"
  | "bigint"
  | "symbol"
  | "undefined"
  | "null"
  | "never"
  | "void"
  | "date"
  | "array"
  | "object"
  | "tuple"
  | "record"
  | "map"
  | "set"
  | "file"
  | "nonoptional"
  | "nan"
  | "function"
  | (string & {}); // class names for instanceof

export interface $SchemaIssueInvalidType<Input = unknown> extends $SchemaIssueBase {
  readonly code: "invalid_type";
  readonly expected: $SchemaInvalidTypeExpected;
  readonly input?: Input;
}

export interface $SchemaIssueTooBig<Input = unknown> extends $SchemaIssueBase {
  readonly code: "too_big";
  readonly origin: "number" | "int" | "bigint" | "date" | "string" | "array" | "set" | "file" | (string & {});
  readonly maximum: number | bigint;
  readonly inclusive?: boolean;
  readonly exact?: boolean;
  readonly input?: Input;
}

export interface $SchemaIssueTooSmall<Input = unknown> extends $SchemaIssueBase {
  readonly code: "too_small";
  readonly origin: "number" | "int" | "bigint" | "date" | "string" | "array" | "set" | "file" | (string & {});
  readonly minimum: number | bigint;
  /** True if the allowable range includes the minimum */
  readonly inclusive?: boolean;
  /** True if the allowed value is fixed (e.g.` Schema.length(5)`), not a range (`Schema.minLength(5)`) */
  readonly exact?: boolean;
  readonly input?: Input;
}

export interface $SchemaIssueInvalidStringFormat extends $SchemaIssueBase {
  readonly code: "invalid_format";
  readonly format: $SchemaStringFormats | (string & {});
  readonly pattern?: string;
  readonly input?: string;
}

export interface $SchemaIssueNotMultipleOf<Input extends number | bigint = number | bigint> extends $SchemaIssueBase {
  readonly code: "not_multiple_of";
  readonly divisor: number;
  readonly input?: Input;
}

export interface $SchemaIssueUnrecognizedKeys extends $SchemaIssueBase {
  readonly code: "unrecognized_keys";
  readonly keys: string[];
  readonly input?: Record<string, unknown>;
}

interface $SchemaIssueInvalidUnionNoMatch extends $SchemaIssueBase {
  readonly code: "invalid_union";
  readonly errors: $SchemaIssue[][];
  readonly input?: unknown;
  readonly discriminator?: string | undefined;
  readonly options?: util.Primitive[];
  readonly inclusive?: true;
}

interface $SchemaIssueInvalidUnionMultipleMatch extends $SchemaIssueBase {
  readonly code: "invalid_union";
  readonly errors: [];
  readonly input?: unknown;
  readonly discriminator?: string | undefined;
  readonly inclusive: false;
  /** Indices of the options that matched */
  readonly matches: number[];
}

export type $SchemaIssueInvalidUnion = $SchemaIssueInvalidUnionNoMatch | $SchemaIssueInvalidUnionMultipleMatch;

export interface $SchemaIssueInvalidKey<Input = unknown> extends $SchemaIssueBase {
  readonly code: "invalid_key";
  readonly origin: "map" | "record";
  readonly issues: $SchemaIssue[];
  readonly input?: Input;
}

export interface $SchemaIssueInvalidElement<Input = unknown> extends $SchemaIssueBase {
  readonly code: "invalid_element";
  readonly origin: "map" | "set";
  readonly key: unknown;
  readonly issues: $SchemaIssue[];
  readonly input?: Input;
}

export interface $SchemaIssueInvalidValue<Input = unknown> extends $SchemaIssueBase {
  readonly code: "invalid_value";
  readonly values: util.Primitive[];
  readonly input?: Input;
}

export interface $SchemaIssueCustom extends $SchemaIssueBase {
  readonly code: "custom";
  readonly params?: Record<string, any> | undefined;
  readonly input?: unknown;
}

////////////////////////////////////////////
////     first-party string formats     ////
////////////////////////////////////////////

export interface $SchemaIssueStringCommonFormats extends $SchemaIssueInvalidStringFormat {
  format: Exclude<$SchemaStringFormats, "regex" | "jwt" | "starts_with" | "ends_with" | "includes">;
}

export interface $SchemaIssueStringInvalidRegex extends $SchemaIssueInvalidStringFormat {
  format: "regex";
  pattern: string;
}

export interface $SchemaIssueStringInvalidJWT extends $SchemaIssueInvalidStringFormat {
  format: "jwt";
  algorithm?: string;
}

export interface $SchemaIssueStringStartsWith extends $SchemaIssueInvalidStringFormat {
  format: "starts_with";
  prefix: string;
}

export interface $SchemaIssueStringEndsWith extends $SchemaIssueInvalidStringFormat {
  format: "ends_with";
  suffix: string;
}

export interface $SchemaIssueStringIncludes extends $SchemaIssueInvalidStringFormat {
  format: "includes";
  includes: string;
}

export type $SchemaStringFormatIssues =
  | $SchemaIssueStringCommonFormats
  | $SchemaIssueStringInvalidRegex
  | $SchemaIssueStringInvalidJWT
  | $SchemaIssueStringStartsWith
  | $SchemaIssueStringEndsWith
  | $SchemaIssueStringIncludes;

////////////////////////
////     utils     /////
////////////////////////

export type $SchemaIssue =
  | $SchemaIssueInvalidType
  | $SchemaIssueTooBig
  | $SchemaIssueTooSmall
  | $SchemaIssueInvalidStringFormat
  | $SchemaIssueNotMultipleOf
  | $SchemaIssueUnrecognizedKeys
  | $SchemaIssueInvalidUnion
  | $SchemaIssueInvalidKey
  | $SchemaIssueInvalidElement
  | $SchemaIssueInvalidValue
  | $SchemaIssueCustom;

export type $SchemaIssueCode = $SchemaIssue["code"];

export type $SchemaInternalIssue<T extends $SchemaIssueBase = $SchemaIssue> = T extends any ? RawIssue<T> : never;
type RawIssue<T extends $SchemaIssueBase> = T extends any
  ? util.Flatten<
      util.MakePartial<T, "message" | "path"> & {
        /** The input data */
        readonly input: unknown;
        /** The schema or check that originated this issue. */
        readonly inst?: $SchemaType | $SchemaCheck;
        /** The schema that owns the issue. Equal to `inst` when a schema originated the issue, and the schema the check was attached to when a check did. */
        readonly schema?: $SchemaType | undefined;
        /** If `true`, Schema will continue executing checks/refinements after this issue. */
        readonly continue?: boolean | undefined;
      } & Record<string, unknown>
    >
  : never;

export type $SchemaRawIssue<T extends $SchemaIssueBase = $SchemaIssue> = $SchemaInternalIssue<T>;

export interface $SchemaErrorMap<T extends $SchemaIssueBase = $SchemaIssue> {
  // biome-ignore lint/style/useShorthandFunctionType: interface form is public API
  (issue: $SchemaRawIssue<T>): { message: string } | string | undefined | null;
}

////////////////////////    ERROR CLASS   ////////////////////////

// const ZOD_ERROR: symbol = Symbol.for("{{Schema.error}}");
export interface $SchemaError<T = unknown> extends Error {
  type: T;
  issues: $SchemaIssue[];
  _schema: {
    output: T;
    def: $SchemaIssue[];
  };
  stack?: string;
  name: string;
}

/* Computing the message eagerly is expensive (pretty-printed JSON of all
 * issues), so defer it until first read. The accessor functions and
 * descriptors are shared across instances to keep error construction
 * cheap; the computed message is cached on the internals object. The
 * setter preserves plain assignment semantics for consumers that
 * overwrite `message`. */
function _getMessage(this: $SchemaError): string {
  const internals = this._schema as { def: $SchemaIssue[]; message?: string };
  internals.message ??= JSON.stringify(internals.def, util.jsonStringifyReplacer, 2);
  return internals.message;
}
function _setMessage(this: $SchemaError, value: string): void {
  (this._schema as { message?: string }).message = value;
}
const _messageDesc: PropertyDescriptor = {
  get: _getMessage,
  set: _setMessage,
  enumerable: true,
  configurable: true,
};
const _issuesDesc: PropertyDescriptor = { value: undefined, enumerable: false };

/* Prototypes that already carry the lazy `toString`. Seeded with the
 * intrinsics so that `init` on a foreign object — it accepts any object —
 * can never install an accessor onto a prototype we do not own. */
const _installedToString = /* @__PURE__ */ new WeakSet<object>([Object.prototype, Error.prototype]);

const initializer = (inst: $SchemaError, def: $SchemaIssue[]): void => {
  inst.name = "$SchemaError";
  // `_schema` is already non-enumerable: $constructor's init defined it with this same descriptor
  _issuesDesc.value = def;
  Object.defineProperty(inst, "issues", _issuesDesc);
  // Clear the shared slot; a retained `value` pins the last error's issues.
  _issuesDesc.value = undefined;
  Object.defineProperty(inst, "message", _messageDesc);

  /* `toString` lives as a non-enumerable lazy getter on the shared
   * prototype; on first access it caches a per-instance closure so
   * detached usage still works. */
  const proto = Object.getPrototypeOf(inst);
  if (!_installedToString.has(proto)) {
    _installedToString.add(proto);
    Object.defineProperty(proto, "toString", {
      configurable: true,
      enumerable: false,
      get(this: $SchemaError) {
        const value = () => this.message;
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
        return value;
      },
      set(this: $SchemaError, value: unknown) {
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
      },
    });
  }
};

export const $SchemaError: $constructor<$SchemaError> = $constructor("$SchemaError", initializer);
interface $SchemaRealError<T = any> extends $SchemaError<T> {}
export const $SchemaRealError: $constructor<$SchemaRealError> = $constructor("$SchemaError", initializer, undefined, {
  Parent: Error,
});

///////////////////    ERROR UTILITIES   ////////////////////////

// flatten
export type $SchemaFlattenedError<T, U = string> = _FlattenedError<T, U>;
type _FlattenedError<T, U = string> = {
  formErrors: U[];
  fieldErrors: {
    [P in keyof T]?: U[];
  };
};

/** Get-or-create `obj[key]` as an own data property. A path segment naming an inherited member
 * ("toString", "constructor") would otherwise read through to the prototype, and assigning
 * "__proto__" would hit the setter instead of creating a key. */
function node<T>(obj: any, key: PropertyKey, make: () => T): T {
  if (!Object.prototype.hasOwnProperty.call(obj, key)) {
    if (key === "__proto__") {
      Object.defineProperty(obj, key, { value: make(), writable: true, enumerable: true, configurable: true });
    } else {
      obj[key] = make();
    }
  }
  return obj[key];
}

export function flattenError<T>(error: $SchemaError<T>): _FlattenedError<T>;
export function flattenError<T, U>(error: $SchemaError<T>, mapper?: (issue: $SchemaIssue) => U): _FlattenedError<T, U>;
export function flattenError<T, U>(error: $SchemaError<T>, mapper = (issue: $SchemaIssue) => issue.message as U) {
  const fieldErrors: Record<PropertyKey, any> = {};
  const formErrors: U[] = [];
  for (const sub of error.issues) {
    if (sub.path.length > 0) {
      node<U[]>(fieldErrors, sub.path[0]!, () => []).push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}

type _SchemaFormattedError<T, U = string> = T extends [any, ...any[]]
  ? { [K in keyof T]?: $SchemaFormattedError<T[K], U> }
  : T extends any[]
    ? { [k: number]: $SchemaFormattedError<T[number], U> }
    : T extends object
      ? util.Flatten<{ [K in keyof T]?: $SchemaFormattedError<T[K], U> }>
      : any;

export type $SchemaFormattedError<T, U = string> = {
  _errors: U[];
} & util.Flatten<_SchemaFormattedError<T, U>>;

export function formatError<T>(error: $SchemaError<T>): $SchemaFormattedError<T>;
export function formatError<T, U>(error: $SchemaError<T>, mapper?: (issue: $SchemaIssue) => U): $SchemaFormattedError<T, U>;
export function formatError<T, U>(error: $SchemaError<T>, mapper = (issue: $SchemaIssue) => issue.message as U) {
  const fieldErrors: $SchemaFormattedError<T> = { _errors: [] } as any;
  const processError = (error: { issues: $SchemaIssue[] }, path: PropertyKey[] = []) => {
    for (const issue of error.issues) {
      if (issue.code === "invalid_union" && issue.errors.length) {
        issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
      } else if (issue.code === "invalid_key") {
        processError({ issues: issue.issues }, [...path, ...issue.path]);
      } else if (issue.code === "invalid_element") {
        processError({ issues: issue.issues }, [...path, ...issue.path]);
      } else {
        const fullpath = [...path, ...issue.path];
        if (fullpath.length === 0) {
          (fieldErrors as any)._errors.push(mapper(issue));
        } else {
          let curr: any = fieldErrors;
          let i = 0;
          while (i < fullpath.length) {
            const el = fullpath[i]!;
            const terminal = i === fullpath.length - 1;

            // `_errors` is reserved by this legacy format, so merge a matching path segment into the current node instead of treating its array as a child.
            if (el === "_errors") {
              if (terminal) curr._errors.push(mapper(issue));
              i++;
              continue;
            }

            // A path element may collide with an inherited property name such as
            // "__proto__" or "constructor". Truthiness checks read the prototype
            // (so no node is created, then ._errors.push throws), and bracket
            // assignment of "__proto__" hits the setter instead of creating an
            // own key. Guard the read with hasOwnProperty and create the node
            // with defineProperty so any path element becomes a real own key.
            if (!Object.prototype.hasOwnProperty.call(curr, el)) {
              Object.defineProperty(curr, el, {
                value: { _errors: [] },
                enumerable: true,
                writable: true,
                configurable: true,
              });
            }
            const node = curr[el];
            if (terminal) {
              node._errors.push(mapper(issue));
            }
            curr = node;
            i++;
          }
        }
      }
    }
  };
  processError(error);
  return fieldErrors;
}

export type $SchemaErrorTree<T, U = string> = T extends util.Primitive
  ? { errors: U[] }
  : T extends [any, ...any[]]
    ? { errors: U[]; items?: { [K in keyof T]?: $SchemaErrorTree<T[K], U> } }
    : T extends any[]
      ? { errors: U[]; items?: Array<$SchemaErrorTree<T[number], U>> }
      : T extends object
        ? {
            errors: U[];
            properties?: { [K in keyof T]?: $SchemaErrorTree<T[K], U> };
          }
        : { errors: U[] };

export function treeifyError<T>(error: $SchemaError<T>): $SchemaErrorTree<T>;
export function treeifyError<T, U>(error: $SchemaError<T>, mapper?: (issue: $SchemaIssue) => U): $SchemaErrorTree<T, U>;
export function treeifyError<T, U>(error: $SchemaError<T>, mapper = (issue: $SchemaIssue) => issue.message as U) {
  const result: $SchemaErrorTree<T, U> = { errors: [] } as any;
  const processError = (error: { issues: $SchemaIssue[] }, path: PropertyKey[] = []) => {
    for (const issue of error.issues) {
      if (issue.code === "invalid_union" && issue.errors.length) {
        // regular union error
        issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
      } else if (issue.code === "invalid_key") {
        processError({ issues: issue.issues }, [...path, ...issue.path]);
      } else if (issue.code === "invalid_element") {
        processError({ issues: issue.issues }, [...path, ...issue.path]);
      } else {
        const fullpath = [...path, ...issue.path];
        if (fullpath.length === 0) {
          result.errors.push(mapper(issue));
          continue;
        }

        let curr: any = result;
        let i = 0;
        while (i < fullpath.length) {
          const el = fullpath[i]!;

          const terminal = i === fullpath.length - 1;
          if (typeof el === "string") {
            curr.properties ??= {};
            // el may collide with an inherited property name ("__proto__",
            // "constructor", ...); ??= reads the prototype so the node is never
            // created and curr.errors.push throws. Guard with hasOwnProperty and
            // create the node with defineProperty so "__proto__" becomes a real
            // own key rather than invoking the prototype setter.
            if (!Object.prototype.hasOwnProperty.call(curr.properties, el)) {
              Object.defineProperty(curr.properties, el, {
                value: { errors: [] },
                enumerable: true,
                writable: true,
                configurable: true,
              });
            }
            curr = curr.properties[el];
          } else {
            curr.items ??= [];
            curr.items[el] ??= { errors: [] };
            curr = curr.items[el];
          }

          if (terminal) {
            curr.errors.push(mapper(issue));
          }

          i++;
        }
      }
    }
  };
  processError(error);
  return result;
}

/** Format a SchemaError as a human-readable string in the following form.
 *
 * From
 *
 * ```ts
 * SchemaError {
 *   issues: [
 *     {
 *       expected: 'string',
 *       code: 'invalid_type',
 *       path: [ 'username' ],
 *       message: 'Invalid input: expected string'
 *     },
 *     {
 *       expected: 'number',
 *       code: 'invalid_type',
 *       path: [ 'favoriteNumbers', 1 ],
 *       message: 'Invalid input: expected number'
 *     }
 *   ];
 * }
 * ```
 *
 * to
 *
 * ```
 * username
 *   ✖ Expected number, received string at "username
 * favoriteNumbers[0]
 *   ✖ Invalid input: expected number
 * ```
 */
export function toDotPath(_path: readonly (string | number | symbol | StandardSchemaV1.PathSegment)[]): string {
  const segs: string[] = [];
  const path: PropertyKey[] = _path.map((seg: any) => (typeof seg === "object" ? seg.key : seg));
  for (const seg of path) {
    if (typeof seg === "number") segs.push(`[${seg}]`);
    else if (typeof seg === "symbol") segs.push(`[${JSON.stringify(String(seg))}]`);
    else if (/[^\w$]/.test(seg)) segs.push(`[${JSON.stringify(seg)}]`);
    else {
      if (segs.length) segs.push(".");
      segs.push(seg);
    }
  }

  return segs.join("");
}

export function prettifyError(error: StandardSchemaV1.FailureResult): string {
  const lines: string[] = [];
  // sort by path length
  const issues = [...error.issues].sort((a, b) => (a.path ?? []).length - (b.path ?? []).length);

  // Process each issue
  for (const issue of issues) {
    lines.push(`✖ ${issue.message}`);
    if (issue.path?.length) lines.push(`  → at ${toDotPath(issue.path)}`);
  }

  // Convert Map to formatted string
  return lines.join("\n");
}
