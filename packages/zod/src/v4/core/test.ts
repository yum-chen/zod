Rename package name to @lib/schema and run  `git submodule add --branch schema/ts https://github.com/conorhealylab/starters.git packages/schema`  to add the branch schema/ts

And let's port the schema api to napi  by updating src/* => draft src/util.rs exporting the ts/js values using NAPI and port the code from ts to rs for example  follow the examples/*

// src/util.rs
// json
export type JSONType = string | number | boolean | null | JSONType[] | { [key: string]: JSONType };
export type JWTAlgorithm =
  | "HS256"
  | "HS384"
  | "HS512"
  | "RS256"
  | "RS384"
  | "RS512"
  | "ES256"
  | "ES384"
  | "ES512"
  | "PS256"
  | "PS384"
  | "PS512"
  | "EdDSA"
  | (string & {});

export type HashAlgorithm = "md5" | "sha1" | "sha256" | "sha384" | "sha512";
export type HashEncoding = "hex" | "base64" | "base64url";
export type HashFormat = `${HashAlgorithm}_${HashEncoding}`;
export type IPVersion = "v4" | "v6";
export type MimeTypes =
  | "application/json"
  | "application/xml"
  | "application/x-www-form-urlencoded"
  | "application/javascript"
  | "application/pdf"
  | "application/zip"
  | "application/vnd.ms-excel"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "application/msword"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/vnd.ms-powerpoint"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  | "application/octet-stream"
  | "application/graphql"
  | "text/html"
  | "text/plain"
  | "text/css"
  | "text/javascript"
  | "text/csv"
  | "image/png"
  | "image/jpeg"
  | "image/gif"
  | "image/svg+xml"
  | "image/webp"
  | "audio/mpeg"
  | "audio/ogg"
  | "audio/wav"
  | "audio/webm"
  | "video/mp4"
  | "video/webm"
  | "video/ogg"
  | "font/woff"
  | "font/woff2"
  | "font/ttf"
  | "font/otf"
  | "multipart/form-data"
  | (string & {});
export type ParsedTypes =
  | "string"
  | "number"
  | "bigint"
  | "boolean"
  | "symbol"
  | "undefined"
  | "object"
  | "function"
  | "file"
  | "date"
  | "array"
  | "map"
  | "set"
  | "nan"
  | "null"
  | "promise";

// utils
export type AssertEqual<T, U> = (<V>() => V extends T ? 1 : 2) extends <V>() => V extends U ? 1 : 2 ? true : false;
export type AssertNotEqual<T, U> = (<V>() => V extends T ? 1 : 2) extends <V>() => V extends U ? 1 : 2 ? false : true;
export type AssertExtends<T, U> = T extends U ? T : never;
type ToSchemaMismatch<T, S extends schemas.$SchemaType> = {
  "types do not match": {
    expected: T;
    received: S["_schema"]["output"];
  };
};

// Stays a `$SchemaType` so it still satisfies the shape constraint, and carries a brand no real schema has so the offending property is the one TypeScript reports as unassignable.
type ToSchemaKeyMismatch<Expected, Received> = schemas.$SchemaType & {
  "types do not match": { expected: Expected; received: Received };
};

// An enum reference and the union of exactly its members are mutually assignable but not identical, so `AssertEqual` alone rejects `Schema.enum(SomeEnum)` against a `SomeEnum` target. Unioning each side with a private dummy forces the union to be rebuilt, which collapses that one difference and nothing else — plain literals against an enum, member subsets, brands and `any` all still fail. The symbol is not exported, so no user type can smuggle it in and cancel a real difference.
declare const toSchemaDummy: unique symbol;

// Homomorphic, so `readonly` and optional modifiers survive the rebuild and only leaves are normalized. An intersection flattens here, which is why an intersection target and the flat object with the same keys match each other. A callable stops the walk because `keyof` a function is `never`, so mapping one would erase its signature and make every function compare equal.
type ToSchemaNormalize<T> = [T] extends [(...args: any[]) => any]
  ? T
  : [T] extends [object]
    ? { [K in keyof T]: ToSchemaNormalize<T[K]> }
    : T | typeof toSchemaDummy;

type ToSchemaEqual<Output, T> = AssertEqual<Output, T> extends true
  ? true
  : IsAny<Output> extends true
    ? false
    : IsAny<T> extends true
      ? false
      : AssertEqual<ToSchemaNormalize<Output>, ToSchemaNormalize<T>>;

// Rebuilds the shape with a marker on each key that disagrees, so the diagnostic names the key instead of failing the whole schema at the top level. A key the target lacks reports `expected: never`; a key the schema lacks reports `received: never`.
type ToSchemaShape<Shape, T> = {
  [K in keyof Shape]: Shape[K] extends schemas.$SchemaType
    ? K extends keyof T
      ? ToSchemaEqual<Shape[K]["_schema"]["output"], T[K]> extends true
        ? Shape[K]
        : ToSchemaKeyMismatch<T[K], Shape[K]["_schema"]["output"]>
      : ToSchemaKeyMismatch<never, Shape[K]["_schema"]["output"]>
    : Shape[K];
} & { [K in Exclude<keyof T, keyof Shape>]: ToSchemaKeyMismatch<T[K], never> };

// Forces the mapped type to display expanded, so the error prints the keys rather than the alias name.
type ToSchemaExpand<X> = { [K in keyof X]: X[K] } & {};

// Only localizes when a key is genuinely at fault. A whole-type difference the per-key walk cannot see — a `readonly` modifier, an intersection versus the flat object with the same keys — leaves every key agreeing, and reporting nothing there would silently accept what the top-level check rejected.
type ToSchemaTarget<S extends schemas.$SchemaType, T> = S extends schemas.$SchemaObject<infer Shape, infer Config>
  ? T extends object
    ? AssertEqual<ToSchemaExpand<ToSchemaShape<Shape, T>>, ToSchemaExpand<Shape>> extends true
      ? S & ToSchemaMismatch<T, S>
      : schemas.$SchemaObject<ToSchemaExpand<ToSchemaShape<Shape, T>>, Config>
    : S & ToSchemaMismatch<T, S>
  : S & ToSchemaMismatch<T, S>;
export type IsAny<T> = 0 extends 1 & T ? true : false;
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type OmitKeys<T, K extends string> = Pick<T, Exclude<keyof T, K>>;
export type MakePartial<T, K extends keyof T> = Omit<T, K> & InexactPartial<Pick<T, K>>;
export type MakeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type Exactly<T, X> = T & Record<Exclude<keyof X, keyof T>, never>;
export type NoUndefined<T> = T extends undefined ? never : T;
export type Whatever = {} | undefined | null;
// literal inputs widen to their primitive so a property check over `"https:"` accepts a `string` property
export type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends bigint
        ? bigint
        : T;

export type LoosePartial<T extends object> = InexactPartial<T> & {
  [k: string]: unknown;
};
export type Mask<Keys extends PropertyKey> = { [K in Keys]?: true };
export type Writeable<T> = { -readonly [P in keyof T]: T[P] } & {};
export type InexactPartial<T> = {
  [P in keyof T]?: T[P] | undefined;
};
export type EmptyObject = Record<string, never>;
export type BuiltIn =
  | (((...args: any[]) => any) | (new (...args: any[]) => any))
  | { readonly [Symbol.toStringTag]: string }
  | Date
  | Error
  | Generator
  | Promise<unknown>
  | RegExp;
export type MakeReadonly<T> = T extends Map<infer K, infer V>
  ? ReadonlyMap<K, V>
  : T extends Set<infer V>
    ? ReadonlySet<V>
    : T extends [infer Head, ...infer Tail]
      ? readonly [Head, ...Tail]
      : T extends Array<infer V>
        ? ReadonlyArray<V>
        : T extends BuiltIn
          ? T
          : Readonly<T>;
export type SomeObject = Record<PropertyKey, any>;
export type Identity<T> = T;
export type Flatten<T> = Identity<{ [k in keyof T]: T[k] }>;
export type Mapped<T> = { [k in keyof T]: T[k] };
export type Prettify<T> = {
  // @ts-ignore
  [K in keyof T]: T[K];
} & {};

export type NoNeverKeys<T> = {
  [k in keyof T]: [T[k]] extends [never] ? never : k;
}[keyof T];
export type NoNever<T> = Identity<{
  [k in NoNeverKeys<T>]: k extends keyof T ? T[k] : never;
}>;
export type Extend<A extends SomeObject, B extends SomeObject> = Flatten<
  // fast path when there is no keys overlap
  keyof A & keyof B extends never
    ? A & B
    : {
        [K in keyof A as K extends keyof B ? never : K]: A[K];
      } & {
        [K in keyof B]: B[K];
      }
>;

export type TupleItems = ReadonlyArray<schemas.SomeType>;
export type AnyFunc = (...args: any[]) => any;
export type IsProp<T, K extends keyof T> = T[K] extends AnyFunc ? never : K;
export type MaybeAsync<T> = T | Promise<T>;
export type KeyOf<T> = keyof OmitIndexSignature<T>;
export type OmitIndexSignature<T> = {
  [K in keyof T as string extends K ? never : K extends string ? K : never]: T[K];
};
export type ExtractIndexSignature<T> = {
  [K in keyof T as string extends K ? K : K extends string ? never : K]: T[K];
};
export type Keys<T extends object> = keyof OmitIndexSignature<T>;

export type SchemaClass<T extends schemas.SomeType> = {
  new (def: T["_schema"]["def"]): T;
};
export type EnumValue = string | number; // | bigint | boolean | symbol;
export type EnumLike = Readonly<Record<string, EnumValue>>;
export type ToEnum<T extends EnumValue> = Flatten<{ [k in T]: k }>;
export type KeysEnum<T extends object> = ToEnum<Exclude<keyof T, symbol>>;
export type KeysArray<T extends object> = Flatten<(keyof T & string)[]>;
export type Literal = string | number | bigint | boolean | null | undefined;
export type LiteralArray = Array<Literal>;
export type Primitive = string | number | symbol | bigint | boolean | null | undefined;
export type PrimitiveArray = Array<Primitive>;
export type HasSize = { size: number };
export type HasLength = { length: number }; // string | Array<unknown> | Set<unknown> | File;
export type Numeric = number | bigint | Date;
export type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseError<T>;
export type SafeParseSuccess<T> = { success: true; data: T; error?: never };
export type SafeParseError<T> = {
  success: false;
  data?: never;
  error: errors.$SchemaError<T>;
};

export type PropValues = Record<string, Set<Primitive>>;
export type PrimitiveSet = Set<Primitive>;

// functions
export function assertEqual<A, B>(val: AssertEqual<A, B>): AssertEqual<A, B> {
  return val;
}

export function assertNotEqual<A, B>(val: AssertNotEqual<A, B>): AssertNotEqual<A, B> {
  return val;
}

export function toSchema<T>(): <S extends schemas.$SchemaType>(
  schema: ToSchemaEqual<S["_schema"]["output"], T> extends true ? S : ToSchemaTarget<S, T>
) => S {
  return (schema) => schema as any;
}

export function assertIs<T>(_arg: T): void {}

export function assertNever(_x: never): never {
  throw new Error("Unexpected value in exhaustive check");
}
export function assert<T>(_: any): asserts _ is T {}

export function getEnumValues(entries: EnumLike): EnumValue[] {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries)
    .filter(([k, _]) => numericValues.indexOf(+k) === -1)
    .map(([_, v]) => v);
  return values;
}

export function joinValues<T extends Primitive[]>(array: T, separator = "|"): string {
  return array.map((val) => stringifyPrimitive(val)).join(separator);
}

export function jsonStringifyReplacer(_: string, value: any): any {
  if (typeof value === "bigint") return value.toString();
  return value;
}

// the accessor lives on a shared prototype: an own accessor makes every box a dictionary-mode object (~360 B and a slow load per read against ~100 B and an inlined getter here)
class Cached<T> {
  _getter: (() => T) | undefined;
  _value: T | undefined;

  constructor(getter: () => T) {
    this._getter = getter;
    this._value = undefined;
  }

  get value(): T {
    const getter = this._getter;
    if (getter !== undefined) {
      this._value = getter();
      this._getter = undefined;
    }
    return this._value as T;
  }
}

export function cached<T>(getter: () => T): { value: T } {
  return new Cached(getter);
}

export function nullish(input: any): boolean {
  return input === null || input === undefined;
}

export function cleanRegex(source: string): string {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}

export function floatSafeRemainder(val: number, step: number): number {
  const ratio = val / step;
  const roundedRatio = Math.round(ratio);
  // `val` and `step` each round to a double before the division rounds again, so a true decimal multiple's quotient can sit up to 1.5 of these scaled epsilons from the integer. A 1x tolerance therefore rejected 2.03 as a multiple of 0.07; 4x covers the worst case with margin.
  const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
  if (Math.abs(ratio - roundedRatio) < tolerance) return 0;
  return ratio - roundedRatio;
}

const EVALUATING = /* @__PURE__*/ Symbol("evaluating");

export function defineLazy<T, K extends keyof T>(object: T, key: K, getter: () => T[K]): void {
  let value: T[K] | typeof EVALUATING | undefined = undefined;
  Object.defineProperty(object, key, {
    get() {
      if (value === EVALUATING) {
        // Circular reference detected, return undefined to break the cycle
        return undefined as T[K];
      }
      if (value === undefined) {
        value = EVALUATING;
        value = getter();
      }
      return value;
    },
    set(v) {
      Object.defineProperty(object, key, {
        value: v,
        // configurable: true,
      });
      // object[key] = v;
    },
    configurable: true,
  });
}

export function objectClone(obj: object) {
  return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
}

export function assignProp<T extends object, K extends PropertyKey>(
  target: T,
  prop: K,
  value: K extends keyof T ? T[K] : any
): void {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}

/** A def's `shape` accessor, carrying whichever object it currently answers from. */
export interface ShapeGetter {
  (): Record<PropertyKey, any>;
  raw: Record<PropertyKey, any>;
}

/**
 * Whichever object a def's `shape` currently answers from: the one the caller passed until the first read, the frozen copy after it.
 *
 * Its keys and descriptors read without invoking anything, which is what lets a discriminated union check its discriminator, and the cycle walk read a shape, without resolving a getter that references the schema being constructed. A def that answers `shape` from an accessor of its own has none.
 */
export function rawShape(def: any): Record<PropertyKey, any> | undefined {
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  return desc?.get ? (desc.get as ShapeGetter).raw : desc?.value;
}

// where a builder reads its source's keys and descriptors, resolving only a shape a def answers for itself. A shape resolves by object spread, so only its enumerable keys are ever part of it.
function sourceShape(schema: schemas.$SchemaObject): Record<PropertyKey, any> {
  return rawShape(Schema._schema.def) ?? (Schema._schema.def.shape as any);
}

// a key whose value is not settled yet, self-caching so every read after the first gets the same one
function deferProp(target: object, key: PropertyKey, getter: () => any): void {
  Object.defineProperty(target, key, {
    get(this: any) {
      const value = getter();
      assignProp(this, key as any, value);
      return value;
    },
    enumerable: true,
    configurable: true,
  });
}

// Writes a settled key. A plain assignment is much cheaper than `defineProperty` and produces the same descriptor, but it runs whatever setter already answers to the key — an accessor this shape deferred, or an inherited one, which `__proto__` has on every object and prototype pollution can add for any name.
function putProp(target: any, key: PropertyKey, value: any): void {
  if (key in target) assignProp(target, key as any, value);
  else target[key] = value;
}

/**
 * Copies `keys` of `source`'s shape onto `target`, each value passed through `wrap`.
 *
 * A key the source has resolved is copied through now, so the derived shape states it outright and nothing has to resolve it to learn what it holds. A key the source still defers stays deferred, and reads back through the source's own `shape`, so it resolves once and both shapes get that one Schema.
 */
function mirrorShape(
  target: object,
  source: schemas.$SchemaObject,
  keys: PropertyKey[],
  wrap?: ((value: any, key: PropertyKey) => any) | null
): void {
  const raw = sourceShape(source);
  for (const key of keys) {
    const desc = Object.getOwnPropertyDescriptor(raw, key)!;
    if (!desc.enumerable) continue;
    if (desc.get) {
      deferProp(target, key, () => {
        const value = (source._schema.def.shape as any)[key];
        return wrap ? wrap(value, key) : value;
      });
    } else putProp(target, key, wrap ? wrap(desc.value, key) : desc.value);
  }
}

// same, for a plain shape a caller passed rather than a schema's
function mirrorProps(target: object, source: Record<PropertyKey, any>): void {
  for (const key of Reflect.ownKeys(source)) {
    const desc = Object.getOwnPropertyDescriptor(source, key)!;
    if (!desc.enumerable) continue;
    if (desc.get) deferProp(target, key, () => source[key as any]);
    else putProp(target, key, desc.value);
  }
}

export function mergeDefs(...defs: Record<string, any>[]): any {
  const mergedDescriptors: Record<string, PropertyDescriptor> = {};

  for (const def of defs) {
    const descriptors = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors);
  }

  return Object.defineProperties({}, mergedDescriptors);
}

export function cloneDef(schema: schemas.$SchemaType): any {
  return mergeDefs(Schema._schema.def);
}

export function getElementAtPath(obj: any, path: (string | number)[] | null | undefined): any {
  if (!path) return obj;
  return path.reduce((acc, key) => acc?.[key], obj);
}

export function promiseAllObject<T extends object>(promisesObj: T): Promise<{ [k in keyof T]: Awaited<T[k]> }> {
  const keys = Object.keys(promisesObj);
  const promises = keys.map((key) => (promisesObj as any)[key]);

  return Promise.all(promises).then((results) => {
    const resolvedObj: any = {};
    for (let i = 0; i < keys.length; i++) {
      resolvedObj[keys[i]!] = results[i];
    }
    return resolvedObj;
  });
}

export function randomString(length = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let str = "";
  for (let i = 0; i < length; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}

export function esc(str: string): string {
  return JSON.stringify(str);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const captureStackTrace: (targetObject: object, constructorOpt?: Function) => void = (
  "captureStackTrace" in Error ? Error.captureStackTrace : (..._args: any[]) => {}
) as any;

export function isObject(data: any): data is Record<PropertyKey, unknown> {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}

export const allowsEval: { value: boolean } = /* @__PURE__*/ cached(() => {
  // Skip the probe under `jitless`: strict CSPs report the caught `new Function` as a `securitypolicyviolation` even though the throw is swallowed.
  if (globalConfig.jitless) {
    return false;
  }

  // @ts-ignore
  if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
    return false;
  }

  try {
    const F = Function;
    new F("");
    return true;
  } catch (_) {
    return false;
  }
});

export function isPlainObject(o: any): o is Record<PropertyKey, unknown> {
  if (isObject(o) === false) return false;

  // modified constructor
  const ctor = o.constructor;
  if (ctor === undefined) return true;

  if (typeof ctor !== "function") return true;

  // modified prototype
  const prot = ctor.prototype;
  if (isObject(prot) === false) return false;

  // ctor doesn't have static `isPrototypeOf`
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }

  return true;
}

export function shallowClone(o: any): any {
  if (isPlainObject(o)) return { ...o };
  if (Array.isArray(o)) return [...o];
  if (o instanceof Map) return new Map(o);
  if (o instanceof Set) return new Set(o);
  return o;
}

export function numKeys(data: any): number {
  let keyCount = 0;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      keyCount++;
    }
  }
  return keyCount;
}

export const getParsedType = (data: any): ParsedTypes => {
  const t = typeof data;

  switch (t) {
    case "undefined":
      return "undefined";

    case "string":
      return "string";

    case "number":
      return Number.isNaN(data) ? "nan" : "number";

    case "boolean":
      return "boolean";

    case "function":
      return "function";

    case "bigint":
      return "bigint";

    case "symbol":
      return "symbol";

    case "object":
      if (Array.isArray(data)) {
        return "array";
      }
      if (data === null) {
        return "null";
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return "promise";
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return "map";
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return "set";
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return "date";
      }
      // @ts-ignore
      if (typeof File !== "undefined" && data instanceof File) {
        return "file";
      }
      return "object";

    default:
      throw new Error(`Unknown data type: ${t}`);
  }
};

export const propertyKeyTypes: Set<string> = /* @__PURE__*/ new Set(["string", "number", "symbol"]);
export const primitiveTypes: Set<string> = /* @__PURE__*/ new Set([
  "string",
  "number",
  "bigint",
  "boolean",
  "symbol",
  "undefined",
]);
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// schema-specific utils
export function clone<T extends schemas.$SchemaType>(inst: T, def?: T["_schema"]["def"], params?: { parent: boolean }): T {
  const cl = new inst._schema.constr(def ?? inst._schema.def);
  if (!def || params?.parent) cl._schema.parent = inst;
  return cl as any;
}

export type EmptyToNever<T> = keyof T extends never ? never : T;

export type Normalize<T> = T extends undefined
  ? never
  : T extends Record<any, any>
    ? Flatten<
        {
          [k in keyof Omit<T, "error" | "message">]: T[k];
        } & ("error" extends keyof T
          ? {
              error?: Exclude<T["error"], string>;
              // path?: PropertyKey[] | undefined;
              // message?: string | undefined;
            }
          : unknown)
      >
    : never;

export function normalizeParams<T>(_params: T): Normalize<T> {
  const params: any = _params;

  if (!params) return {} as any;
  if (typeof params === "string") return { error: () => params } as any;
  if (params?.message !== undefined) {
    if (params?.error !== undefined) throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string") return { ...params, error: () => params.error } as any;
  return params;
}

export function createTransparentProxy<T extends object>(getter: () => T): T {
  let target: T;
  return new Proxy(
    {},
    {
      get(_, prop, receiver) {
        target ??= getter();
        return Reflect.get(target, prop, receiver);
      },
      set(_, prop, value, receiver) {
        target ??= getter();
        return Reflect.set(target, prop, value, receiver);
      },
      has(_, prop) {
        target ??= getter();
        return Reflect.has(target, prop);
      },
      deleteProperty(_, prop) {
        target ??= getter();
        return Reflect.deleteProperty(target, prop);
      },
      ownKeys(_) {
        target ??= getter();
        return Reflect.ownKeys(target);
      },
      getOwnPropertyDescriptor(_, prop) {
        target ??= getter();
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
      defineProperty(_, prop, descriptor) {
        target ??= getter();
        return Reflect.defineProperty(target, prop, descriptor);
      },
    }
  ) as T;
}

export function stringifyPrimitive(value: any): string {
  if (typeof value === "bigint") return value.toString() + "n";
  if (typeof value === "string") return `"${value}"`;
  return `${value}`;
}

export function optionalKeys(shape: schemas.$SchemaShape): string[] {
  return Object.keys(shape).filter((k) => {
    return shape[k]!._schema.optin !== undefined && shape[k]!._schema.optout === "optional";
  });
}

export type CleanKey<T extends PropertyKey> = T extends `?${infer K}` ? K : T extends `${infer K}?` ? K : T;
export type ToCleanMap<T extends schemas.$SchemaLooseShape> = {
  [k in keyof T]: k extends `?${infer K}` ? K : k extends `${infer K}?` ? K : k;
};
export type FromCleanMap<T extends schemas.$SchemaLooseShape> = {
  [k in keyof T as k extends `?${infer K}` ? K : k extends `${infer K}?` ? K : k]: k;
};

// Wrapped in a `@__PURE__` IIFE: esbuild never tree-shakes a top-level initializer that contains a member access on `Number`, so the bare object literal survived into every bundle.
export const NUMBER_FORMAT_RANGES: Record<checks.$SchemaNumberFormats, [number, number]> = /*@__PURE__*/ (() => ({
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-3.4028234663852886e38, 3.4028234663852886e38],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE],
}))();

export const BIGINT_FORMAT_RANGES: Record<checks.$SchemaBigIntFormats, [bigint, bigint]> = {
  int64: [/* @__PURE__*/ BigInt("-9223372036854775808"), /* @__PURE__*/ BigInt("9223372036854775807")],
  uint64: [/* @__PURE__*/ BigInt(0), /* @__PURE__*/ BigInt("18446744073709551615")],
};

export function pick(schema: schemas.$SchemaObject, mask: Record<string, unknown>): any {
  const currDef = Schema._schema.def;

  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".pick() cannot be used on object schemas containing refinements");
  }

  const newShape: Writeable<schemas.$SchemaShape> = {};
  mirrorShape(newShape, schema, maskedKeys(schema, mask));

  return clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] })) as any;
}

// the mask keys that select something, checked against the source's shape without resolving it
function maskedKeys(schema: schemas.$SchemaObject, mask: object): PropertyKey[] {
  const raw = sourceShape(schema);
  const keys: PropertyKey[] = [];
  // `for...in` skips symbols, so a symbol in the mask would select nothing
  for (const key of Reflect.ownKeys(mask)) {
    if (!Object.getOwnPropertyDescriptor(raw, key)?.enumerable) {
      throw new Error(`Unrecognized key: "${String(key)}"`);
    }
    if ((mask as any)[key]) keys.push(key);
  }
  return keys;
}

export function omit(schema: schemas.$SchemaObject, mask: object): any {
  const currDef = Schema._schema.def;

  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".omit() cannot be used on object schemas containing refinements");
  }

  const omitted = new Set(maskedKeys(schema, mask));
  const newShape: Writeable<schemas.$SchemaShape> = {};
  mirrorShape(
    newShape,
    schema,
    Reflect.ownKeys(sourceShape(schema)).filter((key) => !omitted.has(key))
  );

  return clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
}

export function extend(schema: schemas.$SchemaObject, shape: schemas.$SchemaShape): any {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }

  const checks = Schema._schema.def.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    // Only throw if new shape overlaps with existing shape. Use getOwnPropertyDescriptor to check key existence without accessing values
    const existingShape = sourceShape(schema);
    for (const key of Reflect.ownKeys(shape)) {
      if (Object.getOwnPropertyDescriptor(existingShape, key) !== undefined) {
        throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
      }
    }
  }

  return clone(schema, mergeDefs(Schema._schema.def, { shape: extended(schema, shape) })) as any;
}

// the source's keys, then the caller's overlaid on top
function extended(schema: schemas.$SchemaObject, shape: schemas.$SchemaShape): schemas.$SchemaShape {
  const newShape: Writeable<schemas.$SchemaShape> = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)));
  mirrorProps(newShape, shape);
  return newShape;
}

export function safeExtend(schema: schemas.$SchemaObject, shape: schemas.$SchemaShape): any {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to safeExtend: expected a plain object");
  }
  return clone(schema, mergeDefs(Schema._schema.def, { shape: extended(schema, shape) })) as any;
}

export function merge(a: schemas.$SchemaObject, b: schemas.$SchemaObject): any {
  if (!b?._schema?.def) {
    throw new Error("Invalid input to merge: expected an object Schema. To merge a plain shape, use `.extend()`.");
  }
  if (a._schema.def.checks?.length) {
    throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
  }
  const newShape: Writeable<schemas.$SchemaShape> = {};
  mirrorShape(newShape, a, Reflect.ownKeys(sourceShape(a)));
  mirrorShape(newShape, b, Reflect.ownKeys(sourceShape(b)));

  const def = mergeDefs(a._schema.def, {
    shape: newShape,
    get catchall() {
      return b._schema.def.catchall;
    },
    checks: b._schema.def.checks ?? [],
  });

  return clone(a, def) as any;
}

export function partial(
  Class: SchemaClass<schemas.$SchemaOptional> | null,
  schema: schemas.$SchemaObject,
  mask: object | undefined,
  name = "partial"
): any {
  const currDef = Schema._schema.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
  }

  const selected = mask ? new Set(maskedKeys(schema, mask)) : undefined;
  const newShape: Writeable<schemas.$SchemaShape> = {};
  mirrorShape(
    newShape,
    schema,
    Reflect.ownKeys(sourceShape(schema)),
    Class &&
      ((value, key) => (selected && !selected.has(key) ? value : new Class({ type: "optional", innerType: value })))
  );

  return clone(schema, mergeDefs(Schema._schema.def, { shape: newShape, checks: [] })) as any;
}

export function required(
  Class: SchemaClass<schemas.$SchemaNonOptional>,
  schema: schemas.$SchemaObject,
  mask: object | undefined
): any {
  const selected = mask ? new Set(maskedKeys(schema, mask)) : undefined;
  const newShape: Writeable<schemas.$SchemaShape> = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), (value, key) =>
    // overwrite with non-optional
    selected && !selected.has(key) ? value : new Class({ type: "nonoptional", innerType: value })
  );

  return clone(schema, mergeDefs(Schema._schema.def, { shape: newShape })) as any;
}

export type Constructor<T, Def extends any[] = any[]> = new (...args: Def) => T;

// invalid_type | too_big | too_small | invalid_format | not_multiple_of | unrecognized_keys | invalid_union | invalid_key | invalid_element | invalid_value | custom
export function aborted(x: schemas.ParsePayload, startIndex = 0): boolean {
  if (x.aborted === true) return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}

// Checks for explicit abort (continue === false), as opposed to implicit abort (continue === undefined). Used to respect `abort: true` in .refine() even for checks that have a `when` function.
export function explicitlyAborted(x: schemas.ParsePayload, startIndex = 0): boolean {
  if (x.aborted === true) return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
  return false;
}

export function prefixIssues(path: PropertyKey, issues: errors.$SchemaRawIssue[]): errors.$SchemaRawIssue[] {
  return issues.map((iss) => {
    (iss as any).path ??= [];
    (iss as any).path.unshift(path);
    return iss;
  });
}

export function unwrapMessage(message: string | { message: string } | undefined | null): string | undefined {
  return typeof message === "string" ? message : message?.message;
}

/* A check holds no link back to the schema it is attached to — the same check instance is shared by every clone of that schema — so the owner is stamped onto the issues a check just raised, at the only point where both are in scope. Runs on the failure path only; `start` is the issue count from before the check ran. */
export function attachSchema(issues: errors.$SchemaRawIssue[], start: number, inst: schemas.$SchemaType): void {
  for (let i = start; i < issues.length; i++) {
    (issues[i] as any).schema ??= inst;
  }
}

export function finalizeIssue(
  iss: errors.$SchemaRawIssue,
  ctx: schemas.ParseContextInternal | undefined,
  config: $SchemaConfig
): errors.$SchemaIssue {
  // A schema that raised an issue itself owns it outright, and outranks any stamp an enclosing check left in `attachSchema`. String formats and Schema.custom() are schema and check at once, so when they act as a check they defer to that stamp instead.
  const traits: Set<string> | undefined = (iss.inst as any)?._schema?.traits;
  if (traits?.has("$SchemaType")) {
    if (traits.has("$SchemaCheck")) (iss as any).schema ??= iss.inst;
    else (iss as any).schema = iss.inst;
  }

  // Decreasing specificity, first map to return a message wins. `inst` is whatever raised the issue, so a check's own map outranks the owning schema's.
  const schemaError = iss.schema !== iss.inst ? iss.schema?._schema.def?.error : undefined;
  const message = iss.message
    ? iss.message
    : (unwrapMessage(iss.inst?._schema.def?.error?.(iss as never)) ??
      unwrapMessage(schemaError?.(iss as never)) ??
      unwrapMessage(ctx?.error?.(iss as never)) ??
      unwrapMessage(config.customError?.(iss)) ??
      unwrapMessage(config.localeError?.(iss)) ??
      "Invalid input");

  // an explicit own-key copy beats object rest with excluded keys, which v8 routes through a generic runtime call; Object.keys rather than for-in so an issue pushed with a prototype does not leak inherited keys, and an own __proto__ key is dropped rather than assigned through the setter
  const full: any = {};
  for (const k of Object.keys(iss)) {
    if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__") continue;
    full[k] = (iss as any)[k];
  }
  full.path ??= [];
  full.message = message;
  if (ctx?.reportInput) {
    full.input = iss.input;
  }
  return full;
}

export function getSizableOrigin(input: any): "set" | "map" | "file" | "unknown" {
  if (input instanceof Set) return "set";
  if (input instanceof Map) return "map";
  // @ts-ignore
  if (input instanceof File) return "file";
  return "unknown";
}

const highSurrogate = /[\uD800-\uDBFF]/;

// Code points in `str`: a surrogate pair counts once, a lone surrogate as itself. Hand-rolled because the string iterator allocates and runs ~250x slower on this path; the regex probe exits ~50x quicker for a string with no astral characters.
export function codePointLength(str: string): number {
  const units = str.length;
  if (!highSurrogate.test(str)) return units;
  let count = units;
  for (let i = 0; i < units - 1; i++) {
    if ((str.charCodeAt(i) & 0xfc00) === 0xd800 && (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
      count--;
      i++;
    }
  }
  return count;
}

export function getLengthableOrigin(input: any): "array" | "string" | "unknown" {
  if (Array.isArray(input)) return "array";
  if (typeof input === "string") return "string";
  return "unknown";
}

export function parsedType(data: unknown): errors.$SchemaInvalidTypeExpected {
  const t = typeof data;
  switch (t) {
    case "number": {
      return Number.isNaN(data) ? "nan" : "number";
    }
    case "object": {
      if (data === null) {
        return "null";
      }
      if (Array.isArray(data)) {
        return "array";
      }

      const obj = data as object;
      if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) {
        return (obj.constructor as { name: string }).name;
      }
    }
  }
  return t;
}

//////////    REFINES     //////////
export function issue(_iss: string, input: any, inst: any): errors.$SchemaRawIssue;
export function issue(_iss: errors.$SchemaRawIssue): errors.$SchemaRawIssue;
export function issue(...args: [string | errors.$SchemaRawIssue, any?, any?]): errors.$SchemaRawIssue {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst,
    };
  }

  return { ...iss };
}

export function cleanEnum(obj: Record<string, EnumValue>): EnumValue[] {
  return Object.entries(obj)
    .filter(([k, _]) => {
      // return true if NaN, meaning it's not a number, thus a string key
      return Number.isNaN(Number.parseInt(k, 10));
    })
    .map((el) => el[1]);
}

// Codec utility functions
export function base64ToUint8Array(base64: string): InstanceType<typeof Uint8Array> {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binaryString = "";
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryString);
}

export function base64urlToUint8Array(base64url: string): InstanceType<typeof Uint8Array> {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  return base64ToUint8Array(base64 + padding);
}

export function uint8ArrayToBase64url(bytes: Uint8Array): string {
  return uint8ArrayToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function hexToUint8Array(hex: string): InstanceType<typeof Uint8Array> {
  const cleanHex = hex.replace(/^0x/, "");
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}

export function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// instanceof
export abstract class Class {
  constructor(..._args: any[]) {}
}

//////////    PROTOTYPE INSTALLERS     //////////
//
// Members live on the prototype and materialize per instance on first read, which keeps own-property count under the step where V8 stops using inline slots. Changing anything here means re-measuring runtime, memory and bundle size together — see "The three axes" in AGENTS.md.

/**
 * Installs a trait's members on its prototype. Each value builds that member for the instance on first read; the built value shadows the accessor as an own property, so a detached `const { parse } = schema` keeps working.
 *
 * Call this from a `proto` initializer, which runs once per prototype — never per instance.
 */
export function members(proto: object, table: object): void {
  for (const key in table) {
    const desc = Object.getOwnPropertyDescriptor(table, key)!;
    // a getter installs as written, so it stays live: `description` reads through to the registry on every access. not enumerable: an object literal's is, and a prototype member never was
    if (desc.get) Object.defineProperty(proto, key, { ...desc, enumerable: false });
    // a method materializes bound on first read, which is what keeps a detached member working: `const opt = Schema.optional; opt()`
    else defineBound(proto, key, desc.value);
  }
}

/** Shadows a prototype member with an own value, so a getter that builds from the instance runs once. */
export function own<T>(inst: object, key: PropertyKey, value: T, enumerable = true): T {
  Object.defineProperty(inst, key, { configurable: true, writable: true, enumerable, value });
  return value;
}

/** Like {@link own}, for a member that was never an own data property and has to stay out of `Object.keys`. */
export function hide<T>(inst: object, key: PropertyKey, value: T): T {
  return own(inst, key, value, false);
}

/** Adds members a table derives from the instance: each builds on first read and shadows as own data, and assignment shadows the same way, as when these were own properties. */
export /*@__NO_SIDE_EFFECTS__*/ function derived<T>(
  computes: { [K in keyof T]?: (inst: T) => T[K] },
  table: ProtoOf<T>
): ProtoOf<T> {
  for (const key in computes) {
    const compute = computes[key]!;
    // an object literal's accessor is configurable and enumerable, and `members` copies the descriptor as written
    Object.defineProperty(table, key, {
      configurable: true,
      enumerable: true,
      get(this: T) {
        return own(this as object, key, compute(this));
      },
      set(this: T, value: T[typeof key]) {
        own(this as object, key, value);
      },
    });
  }
  return table;
}

function defineBound(proto: object, key: PropertyKey, fn: AnyFunc): void {
  Object.defineProperty(proto, key, {
    configurable: true,
    get(this: any) {
      // vitest's spyOn calls a prototype getter bare to find the function it wraps, so a nullish receiver answers the raw method
      return this == null ? fn : own(this, key, fn.bind(this));
    },
    set(this: any, value: unknown) {
      own(this, key, value);
    },
  });
}

/** Returns the prototype to install on, or `undefined` if this group is already installed on it. */
function claim(inst: object, sentinel: string): object | undefined {
  const proto = Object.getPrototypeOf(inst);
  // Runs on every construction, so `in` rather than the costlier `hasOwnProperty.call`. Sentinels are keys the group itself defines.
  return sentinel in proto ? undefined : proto;
}

/** A trait's prototype members: a partial view of its own interface, with `this` typed as the instance. */
export type ProtoOf<T> = {
  // `infer R` resolves a polymorphic `this` return type to `T`, which a method written here can actually produce
  [K in keyof T]?: (T[K] extends (...args: infer A) => infer R ? (...args: A) => R : T[K]) | undefined;
} & ThisType<T>;

// The internals whose init chain is installing. A second call for the same one is a derived constructor overriding its base, so it must not construct another schema in between or the override is dropped.
let installing: object | undefined;

// Set while a getter is running, so a value that resolved through a recursion break is not memoized. One shared descriptor shadows the key for the duration, which costs no per-key allocation.
let broke = false;
const breaker: PropertyDescriptor = {
  configurable: true,
  get() {
    broke = true;
    return undefined;
  },
};

/**
 * Installs a lazily-derived internal on the `_schema` prototype of `inst`'s
 * constructor, computed from the internals object itself and cached there on
 * first read. One accessor per constructor rather than one per instance.
 */
export function defineLazyInternal<T extends { _schema: any }>(
  inst: T,
  key: string,
  compute: (schema: T["_schema"]) => unknown
): void {
  const proto = Object.getPrototypeOf(inst._schema);
  if (key in proto && installing !== inst._schema) {
    // A repeat construction: everything is installed already. Cleared here so the reference is not held past the first construction of every type.
    installing = undefined;
    return;
  }
  installing = inst._schema;

  Object.defineProperty(proto, key, {
    configurable: true,
    get(this: any) {
      // Shadowed before computing so a re-entrant read from a recursive schema resolves to undefined instead of running the getter again.
      Object.defineProperty(this, key, breaker);
      const outer = broke;
      broke = false;
      try {
        const value = compute(this);
        // A result that resolved through a recursion break is recomputed once the graph is complete; everything else memoizes, undefined included.
        if (broke) delete this[key];
        else Object.defineProperty(this, key, { configurable: true, writable: true, value });
        broke = broke || outer;
        return value;
      } catch (err) {
        // A compute that threw memoizes nothing, so a later read runs it again and fails the same way. The shadow goes with it, since leaving it installed would answer undefined for every later read.
        delete this[key];
        broke = broke || outer;
        throw err;
      }
    },
    set(this: any, value: unknown) {
      Object.defineProperty(this, key, { configurable: true, writable: true, value });
    },
  });
}

/**
 * Installs `key` on `inst`'s prototype, computed by `make` on first read and cached there as an own
 * data property. One accessor per constructor rather than one per instance, because an own accessor
 * puts every instance after the first into v8 dictionary mode. The key doubles as the sentinel.
 */
export function installLazyProp(inst: object, key: string, make: (self: any) => unknown, enumerable: boolean): void {
  const proto = claim(inst, key);
  if (!proto) return;
  Object.defineProperty(proto, key, {
    configurable: true,
    get(this: any) {
      // Shadowed before computing, so a re-entrant read from a self-referential shape resolves to undefined instead of running the getter again. A data property rather than an accessor: an own accessor is the dictionary-mode transition this exists to avoid.
      const desc = { configurable: true, writable: true, enumerable, value: undefined as unknown };
      Object.defineProperty(this, key, desc);
      // a compute that throws leaves the shadow behind, so later reads answer undefined instead of re-throwing; `defineLazy` did the same, and `defineLazyInternal`'s delete-on-catch would cost bytes in every bundle for a case only a throwing user getter reaches
      desc.value = make(this);
      Object.defineProperty(this, key, desc);
      return desc.value;
    },
    set(this: any, value: unknown) {
      Object.defineProperty(this, key, { configurable: true, writable: true, enumerable, value });
    },
  });
}

/** Marks the thunk `_catch` synthesises for a constant catch value. `Function.length` cannot tell that thunk from a user callback — rest and defaulted parameters both report arity 0 — and a user callback reads `ctx.error`, whose issues only finalize correctly against the caller's per-parse error map. Provenance can say what arity cannot. A plain string key rather than `Symbol.for`, whose call at module scope no bundler can prove pure — the same shape that anchored `urlCanParse` into every build. */
export const CONSTANT_CATCH = "~constantCatch";

/** Wraps a constant catch value in a thunk tagged with {@link CONSTANT_CATCH}. */
export function constantCatch<T>(value: T): () => T {
  const fn = () => value;
  (fn as { [CONSTANT_CATCH]?: boolean })[CONSTANT_CATCH] = true;
  return fn;
}

Also draft src/core.rs by porting from packages/

import type * as errors from "./errors.js";

import type * as schemas from "./schemas.js";
import type { Class, ProtoOf } from "./util.js";
import { members as installMembers } from "./util.js";
//////////////////////////////   CONSTRUCTORS   ///////////////////////////////////////

type SchemaTrait = { _schema: { def: any; [k: string]: any } };
export interface $constructor<T extends SchemaTrait, D = T["_schema"]["def"]> {
  new (def: D): T;
  init(inst: T, def: D): asserts inst is T;
}

export interface $constructorParams {
  Parent?: typeof Class;
}

/** A special constant with type `never` */
export const NEVER: never = /*@__PURE__*/ Object.freeze({
  status: "aborted",
}) as never;

/* Shared descriptor for installing `_schema`; defineProperty reads it
 * synchronously, so reusing one object avoids a per-instance allocation. */
const _schemaDesc: PropertyDescriptor = { value: undefined, enumerable: false };

// null where suppressing the capture would be unrecoverable: `parse()` puts the frames back with `captureStackTrace`, so without it the throw would lose its stack. also latched to null once `stackTraceLimit` proves unassignable, which a realm can do at any point by hardening Error
let _E: (ErrorConstructor & { stackTraceLimit?: number }) | null = "captureStackTrace" in Error ? Error : null;

// v8 captures a stack trace inside the Error constructor, which dominates a failed parse; costs only the frames, and parse() restores those. the constructor must RUN: Object.create is cheaper and passes instanceof, but Error.isError and util.types.isNativeError check an internal slot
function newError(Definition: new () => any): any {
  const E = _E;
  if (E) {
    const saved = E.stackTraceLimit;
    if (typeof saved === "number") {
      try {
        E.stackTraceLimit = 0;
      } catch {
        _E = null;
        return new Definition();
      }
      try {
        return new Definition();
      } finally {
        E.stackTraceLimit = saved;
      }
    }
  }
  return new Definition();
}

export /*@__NO_SIDE_EFFECTS__*/ function $constructor<T extends SchemaTrait, D = T["_schema"]["def"]>(
  name: string,
  initializer: (inst: T, def: D) => void,
  /** This trait's members, installed once on every prototype that composes it. They cannot be declared in the initializer above: that runs per instance, and the prototype is shared. */
  proto?: ProtoOf<T>,
  params?: $constructorParams
): $constructor<T, D> {
  // Prototype for this constructor's `_schema` internals. Lazily-derived fields (`values`, `pattern`, `optin`, …) install here once rather than as an accessor on every instance.
  const schemaProto: any = {};

  // Assigning the fields in the constructor body is what gives instances in-object slots; building the object literally and reparenting it costs a second allocation and a generic property copy.
  function Internals(this: any, def: D) {
    this.def = def;
    this.constr = _;
    this.traits = new Set();
  }
  Internals.prototype = schemaProto;

  const protoMembers = proto;
  // One trait's members land on every prototype whose chain composes it, so the answer is per prototype rather than per trait.
  const initialized = protoMembers && new WeakSet<object>();

  function init(inst: T, def: D) {
    if (!inst._schema) {
      _schemaDesc.value = new (Internals as any)(def);
      try {
        Object.defineProperty(inst, "_schema", _schemaDesc);
      } finally {
        // Cleared even on throw, so the shared descriptor never leaks one instance's internals into the next.
        _schemaDesc.value = undefined;
      }
    } else if (inst._schema.traits.has(name)) {
      return;
    }

    inst._schema.traits.add(name);

    initializer(inst, def);

    if (initialized) {
      // `super(def)` from a user subclass gives `this` a prototype the subclass owns, and installing there would overwrite whatever the subclass declared. `constr` built the instance, so its prototype is the one below the subclass's that should carry the members. A receiver whose chain never reaches that prototype installs on its own, which for a plain object handed straight to `init` means `Object.prototype` — unchanged from before.
      const own = Object.getPrototypeOf(inst);
      const ctorProto = inst._schema.constr.prototype;
      let up: object | null = own;
      while (up && up !== ctorProto) up = Object.getPrototypeOf(up);
      const target = up ?? own;
      if (!initialized.has(target)) {
        initialized.add(target);
        installMembers(target, protoMembers!);
      }
    }

    // support prototype modifications; for-in avoids the array allocation of Object.keys on the (usually empty) prototype
    const proto = _.prototype;
    for (const k in proto) {
      if (!Object.prototype.hasOwnProperty.call(proto, k)) continue;
      if (!(k in inst)) {
        (inst as any)[k] = proto[k].bind(inst);
      }
    }
  }

  // doesn't work if Parent has a constructor with arguments
  const Parent = params?.Parent ?? Object;
  class Definition extends Parent {}
  Object.defineProperty(Definition, "name", { value: name });

  function _(this: any, def: D) {
    const inst = params?.Parent ? newError(Definition) : this;
    init(inst, def);
    const deferred = inst._schema.deferred;
    if (deferred) {
      for (const fn of deferred) {
        fn();
      }
      // Released: initializers run once, and the list would otherwise be retained for the schema's lifetime.
      inst._schema.deferred = undefined;
    }

    // Global post-processor hook. Internal: installed by `import "schema/compile"` to enable AOT compilation for every constructed Schema. Runs last, once the instance is fully built, because it hands the instance to compile(). The post-processor is expected to be reentrancy-guarded by its own implementation.
    const pp = (globalThis as GlobalThisWithConfig).__schema_globalConfig?.postProcessor;
    if (pp) pp(inst);
    return inst;
  }

  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst: any) => {
      if (params?.Parent && inst instanceof params.Parent) return true;
      return inst?._schema?.traits?.has(name);
    },
  });
  Object.defineProperty(_, "name", { value: name });
  return _ as any;
}

//////////////////////////////   UTILITIES   ///////////////////////////////////////
export const $brand: unique symbol = /*@__PURE__*/ Symbol("schema_brand");
export type $brand<T extends string | number | symbol = string | number | symbol> = {
  [$brand]: { [k in T]: true };
};

export type $SchemaBranded<
  T extends schemas.SomeType,
  Brand extends string | number | symbol,
  Dir extends "in" | "out" | "inout" = "out",
> = T &
  (Dir extends "inout"
    ? { _schema: { input: input<T> & $brand<Brand>; output: output<T> & $brand<Brand> } }
    : Dir extends "in"
      ? { _schema: { input: input<T> & $brand<Brand> } }
      : { _schema: { output: output<T> & $brand<Brand> } });

export type $SchemaNarrow<T extends schemas.SomeType, Out> = T & { _schema: { output: Out } };

export class $SchemaAsyncError extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
}

export class $SchemaEncodeError extends Error {
  constructor(name: string) {
    super(`Encountered unidirectional transform during encode: ${name}`);
    this.name = "SchemaEncodeError";
  }
}

////////////////////////////  TYPE HELPERS  ///////////////////////////////////

// export type input<T extends schemas.$SchemaType> = T["_schema"]["input"];
// export type output<T extends schemas.$SchemaType> = T["_schema"]["output"];
// export type input<T extends schemas.$SchemaType> = T["_schema"]["input"];
// export type output<T extends schemas.$SchemaType> = T["_schema"]["output"];
export type input<T> = T extends { _schema: { input: any } } ? T["_schema"]["input"] : unknown;
export type output<T> = T extends { _schema: { output: any } } ? T["_schema"]["output"] : unknown;

export type { output as infer };

//////////////////////////////   CONFIG   ///////////////////////////////////////

export interface $SchemaConfig {
  /** Custom error map. Overrides `config().localeError`. */
  customError?: errors.$SchemaErrorMap | undefined;
  /** Localized error map. Lowest priority. */
  localeError?: errors.$SchemaErrorMap | undefined;
  /** Disable JIT schema compilation. Useful in environments that disallow `eval`. */
  jitless?: boolean | undefined;
  /** Enables parsing input that contains reference cycles. Read when a schema is constructed. */
  memoizer?: schemas.$SchemaMemoizer | undefined;
  /**
   * Internal: post-processor invoked on every freshly-constructed schema
   * instance, after init and deferred fns run. Set by `import "schema/compile"`
   * to install AOT compilation. Not part of the public API.
   * @internal
   */
  postProcessor?: ((inst: any) => void) | undefined;
}

interface GlobalThisWithConfig {
  /**
   * The globalConfig instance shared across both CommonJS and ESM builds.
   * Attached to `globalThis` (mirroring `__schema_globalRegistry`) so that a
   * single config object is used regardless of how Schema is loaded — CJS,
   * ESM, multiple bundles in a monorepo, etc. This means `Schema.config(...)`
   * applied against any one instance is observed by all of them, and
   * pre-populating it before Schema loads (e.g. `globalThis.__schema_globalConfig
   * = { jitless: true }` in an inline script) takes effect immediately on
   * import.
   */
  __schema_globalConfig?: $SchemaConfig;
}

(globalThis as GlobalThisWithConfig).__schema_globalConfig ??= {};
export const globalConfig: $SchemaConfig = (globalThis as GlobalThisWithConfig).__schema_globalConfig!;

export function config(newConfig?: Partial<$SchemaConfig>): $SchemaConfig {
  if (newConfig) Object.assign(globalConfig, newConfig);
  return globalConfig;
}




also draft src/parse and convert these methods to rust:

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


also draft src/registries.rs and porting these to rs using napi:


export class $SchemaCyclicError extends Error {
  constructor() {
    super(`Cannot parse a reference cycle that closes through a transform`);
    this.name = "SchemaCyclicError";
  }
}

interface Entry {
  value: unknown;
  /** `null` until the node's children are parsed. */
  issues: errors.$SchemaRawIssue[] | null;
}

interface State {
  /** Weak throughout because `attach` caches a bucket on the schema instance, which outlives the parse. */
  buckets: WeakMap<$SchemaType, WeakMap<object, Entry>>;
  /** Nodes a back-edge resolved to before they finished. */
  backEdges: WeakSet<object> | undefined;
}

/** Keyed off the context object every schema in one parse call already shares. */
const STATE = "~memo";
type WithState = { [STATE]?: State };

const NO_ISSUES: errors.$SchemaRawIssue[] = [];

// a value a cycle can close through
function isRef(value: unknown): value is object {
  return value !== null && typeof value === "object";
}

// Receivers prefix paths in place, so the cache and every hand-out need their own copies.
function cloneIssues(issues: errors.$SchemaRawIssue[]): errors.$SchemaRawIssue[] {
  return issues.map((iss) => (iss.path ? { ...iss, path: iss.path.slice() } : { ...iss }));
}

const recursive: WeakMap<object, boolean> = /*@__PURE__*/ new WeakMap();

/** What the walk established, in order of certainty: ordered so the strongest answer among children wins. */
const NONE = 0;
const ASSUMED = 1;
const PROVEN = 2;
type Answer = typeof NONE | typeof ASSUMED | typeof PROVEN;

/** Whether this schema's subtree contains a cycle, so one parse can re-enter it. */
function isRecursive(inst: $SchemaType, stack: Set<object>, resolve: boolean): Answer {
  const cached = recursive.get(inst);
  if (cached !== undefined) return cached ? PROVEN : NONE;
  // Relative to the walk in progress, so not cached.
  if (stack.has(inst)) return PROVEN;
  stack.add(inst);

  let result: Answer = NONE;
  const check = (child: any) => {
    if (result !== PROVEN && child?._schema) {
      const answer = isRecursive(child, stack, resolve);
      if (answer > result) result = answer;
    }
  };

  // `Reflect.ownKeys` rather than `Object.keys`, so a cycle through a declared symbol key is still seen
  const shape = (sh: object, spread: boolean): Answer => {
    let answer: Answer = NONE;
    for (const key of Reflect.ownKeys(sh)) {
      const desc = Object.getOwnPropertyDescriptor(sh, key)!;
      // an object resolves its shape by spread, so a key it does not enumerate is never parsed; `Schema.properties` reads every own key and so keeps them all
      if (spread && !desc.enumerable) continue;
      // resolving runs user code, and a factory mints a fresh subtree per read, so an edge the walk can't follow counts as a cycle
      const child = desc.get ? ASSUMED : desc.value?._schema ? isRecursive(desc.value, stack, resolve) : NONE;
      if (child > answer) answer = child;
    }
    return answer;
  };

  const merge = (answer: Answer) => {
    if (answer > result) result = answer;
  };

  const def = inst._schema.def as any;
  const kind = def.type as $SchemaTypeDef["type"];
  switch (kind) {
    case "object": {
      const raw = util.rawShape(def);
      // a def with no raw shape answers `shape` from an accessor of its own, and running that can mint a whole fresh subtree
      merge(raw ? shape(raw, true) : ASSUMED);
      check(def.catchall);
      break;
    }
    case "array":
      check(def.element);
      break;
    case "tuple":
      for (const el of def.items) check(el);
      check(def.rest);
      break;
    case "record":
    case "map":
      check(def.keyType);
      check(def.valueType);
      break;
    case "set":
      check(def.valueType);
      break;
    case "union":
      for (const el of def.options) check(el);
      break;
    case "intersection":
      check(def.left);
      check(def.right);
      break;
    case "optional":
    case "nullable":
    case "default":
    case "prefault":
    case "catch":
    case "readonly":
    case "nonoptional":
    case "promise":
    case "success":
      check(def.innerType);
      break;
    case "pipe":
      check(def.in);
      check(def.out);
      break;
    case "function":
      check(def.input);
      check(def.output);
      break;
    // `$SchemaLazy` caches its inner on the def, so a resolved edge is followed exactly
    case "lazy": {
      const inner = def._cachedInner ?? (resolve ? (inst as any)._schema.innerType : undefined);
      // walked with resolution off: one hop sees past the deferral, and a lazy that yields only another unresolved lazy is generative, so it stops there
      merge(inner ? isRecursive(inner, stack, false) : ASSUMED);
      break;
    }
    // a leaf by choice: `parts` are regex fragments, not data positions
    case "template_literal":
    // leaves
    case "string":
    case "number":
    case "int":
    case "boolean":
    case "bigint":
    case "symbol":
    case "undefined":
    case "null":
    case "void":
    case "never":
    case "any":
    case "unknown":
    case "date":
    case "nan":
    case "enum":
    case "literal":
    case "file":
    case "transform":
    case "custom":
      break;
    default: {
      // a new built-in kind becomes a compile error here
      kind satisfies never;
      // a user-defined kind can still hold children, and only its author knows where, so fall back to scanning the def — skipping accessors, since reading one can run user code
      for (const key in def) {
        const desc = Object.getOwnPropertyDescriptor(def, key);
        if (!desc || desc.get) continue;
        const value = desc.value;
        if (!value || typeof value !== "object") continue;
        if (value._schema) check(value);
        else if (Array.isArray(value)) for (const el of value) check(el);
      }
    }
  }

  stack.delete(inst);
  return settle(inst, result);
}

/** An assumed answer must not outlive the resolution that settles it, so only a certain one is cached. */
function settle(inst: $SchemaType, answer: Answer): Answer {
  if (answer !== ASSUMED) recursive.set(inst, answer === PROVEN);
  return answer;
}

/**
 * Whether one parse can re-enter this schema, i.e. its subtree contains a cycle.
 * Exported for `Schema.compile`, which refuses to compile such a schema: cycle
 * breaking is driven from here off state keyed on the parse context, and a
 * generated fast path has no context to key on.
 */
export function isRecursiveSchema(inst: $SchemaType): boolean {
  // Schema.compile never parses, so nothing would ever resolve a lazy for it; it runs once and already treats a throw here as recursive
  return isRecursive(inst, new Set(), true) !== NONE;
}

function bucketFor(state: State, inst: $SchemaType): WeakMap<object, Entry> {
  let bucket = state.buckets.get(inst);
  if (!bucket) {
    bucket = new WeakMap();
    state.buckets.set(inst, bucket);
  }
  return bucket;
}

// Set immediately before delegating to core and cleared immediately after, so `alloc` registers only for a visit this module is driving.
let handoff: WeakMap<object, Entry> | undefined;

// Allocated but unfinished entries. `alloc` and the matching pop both happen in the synchronous part of a parse, so they nest even when children are async, and one stack serves every Schema.
const open: Entry[] = [];

const memo: $SchemaMemoizer = {
  alloc(_inst, payload, empty) {
    const bucket = handoff;
    if (!bucket) return empty;
    handoff = undefined;
    const entry: Entry = { value: empty, issues: null };
    bucket.set(payload.value as object, entry);
    open.push(entry);
    return empty;
  },

  guard(inst) {
    inst._schema.deferred ??= [];
    inst._schema.deferred.push(() => {
      const base = inst._schema.parse;
      const wrapped = (payload: ParsePayload, ctx: ParseContextInternal): util.MaybeAsync<ParsePayload> => {
        // The value is a placeholder a back-edge is still waiting on, so the cycle closes through this transform. Its output can't exist in time to bind.
        if (ctx.direction !== "backward" && isBackEdge(ctx, payload.value)) throw new $SchemaCyclicError();
        return base(payload, ctx);
      };
      inst._schema.parse = wrapped;
      if (inst._schema.run === base) inst._schema.run = wrapped;
    });
  },

  attach(inst) {
    let isRecursiveInst: boolean | undefined;
    let rechecked = false;
    // a recursive schema is re-entered many times per parse and its bucket never changes
    let lastCtx: object | undefined;
    let lastBucket: WeakMap<object, Entry> | undefined;

    // Wraps `parse` in a deferred so it sees the container's final parse. Core's own deferred copies `parse` into `run` when there are no checks, and it ran first, so `run` is patched to match; with checks, `run` reads `parse` dynamically.
    inst._schema.deferred ??= [];
    inst._schema.deferred.push(() => {
      const base = inst._schema.parse;

      const wrapped = (payload: ParsePayload, ctx: ParseContextInternal): util.MaybeAsync<ParsePayload> => {
        if (isRecursiveInst === undefined) {
          const walked = isRecursive(inst, new Set(), false);
          if (walked === NONE) {
            // Nothing here can ever fire, so take it back out.
            inst._schema.parse = base;
            if (inst._schema.run === wrapped) inst._schema.run = base;
            return base(payload, ctx);
          }
          // this parse resolves the deferred edges on its own path, so ask once more before latching
          if (walked === PROVEN || rechecked) isRecursiveInst = true;
          else rechecked = true;
        }

        const input = payload.value;
        if (!isRef(input)) return base(payload, ctx);

        let state = (ctx as WithState)[STATE];
        if (!state) {
          state = { buckets: new WeakMap(), backEdges: undefined };
          (ctx as WithState)[STATE] = state;
        }

        let bucket: WeakMap<object, Entry>;
        if (lastCtx === ctx) {
          bucket = lastBucket!;
        } else {
          bucket = bucketFor(state, inst);
          lastCtx = ctx;
          lastBucket = bucket;
        }

        const hit = bucket.get(input);
        if (hit) {
          payload.value = hit.value;
          if (hit.issues) {
            if (hit.issues.length) payload.issues.push(...cloneIssues(hit.issues));
          } else {
            // Still being parsed: its own checks cover it, so skip them here.
            payload.memo = true;
            state.backEdges ??= new WeakSet();
            state.backEdges.add(hit.value as object);
          }
          return payload;
        }

        handoff = bucket;
        const depth = open.length;
        const result = base(payload, ctx);
        handoff = undefined;
        // A container that rejected its input outright allocated nothing.
        const entry = open.length > depth ? open.pop()! : undefined;

        // Both paths written out so the sync one allocates no closure. It runs once per node, and capturing here cost more than everything else combined.
        if (result instanceof Promise) {
          return result.then((r) => {
            if (entry) entry.issues = r.issues.length ? cloneIssues(r.issues) : NO_ISSUES;
            return r;
          });
        }
        if (entry) entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES;
        return result;
      };

      inst._schema.parse = wrapped;
      if (inst._schema.run === base) inst._schema.run = wrapped;
    });
  },
};

/** The memoizer that gives containers cycle support. `schema` installs it by default; `schema/mini` opts in with `config({ memoizer: memoizer() })`. */
export function memoizer(): $SchemaMemoizer {
  return memo;
}

/** Whether this value is a node a back-edge resolved to before it finished. */
export function isBackEdge(ctx: object, value: unknown): boolean {
  const backEdges = (ctx as WithState)[STATE]?.backEdges;
  return backEdges !== undefined && isRef(value) && backEdges.has(value);
}


and let' draft src/regexes.rs by porting these to rust using napi: 

https://github.com/napi-rs/napi-rs/tree/master/examples/napi-regex-rs

/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link cuid2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
export const cuid: RegExp = /^[cC][0-9a-z]{6,}$/;
export const cuid2: RegExp = /^[0-9a-z]+$/;
export const ulid: RegExp = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
export const xid: RegExp = /^[0-9a-vA-V]{20}$/;
export const ksuid: RegExp = /^[A-Za-z0-9]{27}$/;
export const nanoid: RegExp = /^[a-zA-Z0-9_-]{21}$/;
export function nanoidOfLength(length: number): RegExp {
  return new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
}

/** ISO 8601-1 duration regex. Does not support the 8601-2 extensions like negative durations or fractional/negative components. */
export const duration: RegExp =
  /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;

/** Implements ISO 8601-2 extensions like explicit +- prefixes, mixing weeks with other units, and fractional/negative components. */
export const extendedDuration: RegExp =
  /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;

/** A regex for any UUID-like identifier: 8-4-4-4-12 hex pattern */
export const guid: RegExp = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;

/** Returns a regex for validating an RFC 9562/4122 UUID.
 *
 * @param version Optionally specify a version 1-8. If no version is specified, all versions are supported. */
export const uuid = (version?: number | undefined): RegExp => {
  if (!version)
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  return new RegExp(
    `^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`
  );
};
export const uuid4: RegExp = /*@__PURE__*/ uuid(4);
export const uuid6: RegExp = /*@__PURE__*/ uuid(6);
export const uuid7: RegExp = /*@__PURE__*/ uuid(7);

/** Practical email validation */
export const email: RegExp =
  /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;

/** Equivalent to the HTML5 input[type=email] validation implemented by browsers. Source: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email */
export const html5Email: RegExp =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/** The classic emailregex.com regex for RFC 5322-compliant emails */
export const rfc5322Email =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/** A loose regex that allows Unicode characters, enforces length limits, and that's about it. */
export const unicodeEmail = /^[^\s@"]{1,64}@[^\s@]{1,255}$/u;
export const idnEmail = unicodeEmail;

export const browserEmail: RegExp =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
// from https://thekevinscott.com/emojis-in-javascript/#writing-a-regular-expression

// Single character class, not an alternation: the two properties overlap (U+1F9B0-U+1F9B3), so `(A|B)+` backtracks exponentially on a failed match. The leading lookahead then demands one anchor — a pictograph, a regional indicator, or the enclosing keycap — because `\p{Emoji_Component}` on its own covers ASCII digits, `#`, `*`, ZWJ, variation selectors and skin tone modifiers, none of which is an emoji without a base.
const _emoji: string = `^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$`;
export function emoji(): RegExp {
  return new RegExp(_emoji, "u");
}

export const ipv4: RegExp =
  /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
export const ipv6: RegExp =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
export const mac = (delimiter?: string): RegExp => {
  const escapedDelim = util.escapeRegex(delimiter ?? ":");
  return new RegExp(`^(?:[0-9A-F]{2}${escapedDelim}){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}${escapedDelim}){5}[0-9a-f]{2}$`);
};
export const cidrv4: RegExp =
  /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
export const cidrv6: RegExp =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;

// https://stackoverflow.com/questions/7860392/determine-if-string-is-in-base64-using-javascript
export const base64: RegExp = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
export const base64url: RegExp = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;

// based on https://stackoverflow.com/questions/106179/regular-expression-to-match-dns-hostname-or-ip-address
// export const hostname: RegExp = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$/;
export const hostname: RegExp =
  /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/;

export const domain: RegExp = /^(?=.{1,253}$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

export const httpProtocol: RegExp = /^https?$/;

// https://blog.stevenlevithan.com/archives/validate-phone-number#r4-3 (regex sans spaces) E.164: leading digit must be 1-9; total digits (excluding '+') between 7-15
export const e164: RegExp = /^\+[1-9]\d{6,14}$/;

// Credit card shape: 12–19 digits, optionally separated by single spaces or single hyphens. ISO/IEC 7812 caps the PAN at 19 digits; 12 is the shortest issued length (Maestro).
export const creditCard: RegExp = /^\d(?:[ -]?\d){11,18}$/;

// ISO 4217 alpha codes from the SIX list, regenerated by scripts/update-iso-4217.ts
export const currencyCode: RegExp =
  /^(?:AED|AFN|ALL|AMD|AOA|ARS|AUD|AWG|AZN|BAM|BBD|BDT|BHD|BIF|BMD|BND|BOB|BOV|BRL|BSD|BTN|BWP|BYN|BZD|CAD|CDF|CHE|CHF|CHW|CLF|CLP|CNY|COP|COU|CRC|CUP|CVE|CZK|DJF|DKK|DOP|DZD|EGP|ERN|ETB|EUR|FJD|FKP|GBP|GEL|GHS|GIP|GMD|GNF|GTQ|GYD|HKD|HNL|HTG|HUF|IDR|ILS|INR|IQD|IRR|ISK|JMD|JOD|JPY|KES|KGS|KHR|KMF|KPW|KRW|KWD|KYD|KZT|LAK|LBP|LKR|LRD|LSL|LYD|MAD|MDL|MGA|MKD|MMK|MNT|MOP|MRU|MUR|MVR|MWK|MXN|MXV|MYR|MZN|NAD|NGN|NIO|NOK|NPR|NZD|OMR|PAB|PEN|PGK|PHP|PKR|PLN|PYG|QAR|RON|RSD|RUB|RWF|SAR|SBD|SCR|SDG|SEK|SGD|SHP|SLE|SOS|SRD|SSP|STN|SVC|SYP|SZL|THB|TJS|TMT|TND|TOP|TRY|TTD|TWD|TZS|UAH|UGX|USD|USN|UYI|UYU|UYW|UZS|VED|VES|VND|VUV|WST|XAD|XAF|XAG|XAU|XBA|XBB|XBC|XBD|XCD|XCG|XDR|XOF|XPD|XPF|XPT|XSU|XTS|XUA|XXX|YER|ZAR|ZMW|ZWG)$/;

// iban electronic format: 2-letter country, check digits 02-98 (the only values `98 - remainder` can produce), 11-30 bban characters
export const iban: RegExp = /^[A-Z]{2}(?!00|01|99)\d{2}[A-Z0-9]{11,30}$/;

const dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;

/** Anchors a pattern source. The interpolation lives here rather than at the call site because
 * esbuild will not drop a `@__PURE__` call whose own argument interpolates a variable, but it
 * will drop `anchor(dateSource)`. Keeping it inline pinned `date` into every bundle. */
function anchor(source: string): RegExp {
  return new RegExp(`^${source}$`);
}

export const date: RegExp = /*@__PURE__*/ anchor(dateSource);

function timeSource(args: { precision?: number | null | undefined; seconds?: boolean }) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex =
    typeof args.precision === "number"
      ? args.precision === -1
        ? `${hhmm}`
        : args.precision === 0
          ? `${hhmm}:[0-5]\\d`
          : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}`
      : args.seconds
        ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?`
        : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex;
}
export function time(args: {
  precision?: number | null;
  // local?: boolean;
}): RegExp {
  return new RegExp(`^${timeSource(args)}$`);
}

// Adapted from https://stackoverflow.com/a/3143231
export function datetime(args: {
  precision?: number | null;
  offset?: boolean;
  local?: boolean;
}): RegExp {
  const opts = ["Z"];
  // if (args.offset) opts.push(`([+-]\\d{2}:\\d{2})`);
  if (args.offset) opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);

  // RFC 3339 mandates seconds wherever the time carries a `Z` or an offset, so only the unqualified form `local` adds may omit them
  const qualified = `${timeSource({ precision: args.precision, seconds: true })}(?:${opts.join("|")})`;
  const timeRegex = args.local ? `${qualified}|${timeSource({ precision: args.precision })}` : qualified;

  return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}

// the unbounded form of `string()` as a literal, so every plain string shares one instance instead of building its own
export const anyString: RegExp = /^[\s\S]{0,}$/;

export const string = (params?: { minimum?: number | undefined; maximum?: number | undefined }): RegExp => {
  const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
  return new RegExp(`^${regex}$`);
};

export const bigint: RegExp = /^-?\d+n?$/;
export const integer: RegExp = /^-?\d+$/;
export const number: RegExp = /^-?\d+(?:\.\d+)?$/;
export const boolean: RegExp = /^(?:true|false)$/i;
const _null: RegExp = /^null$/i;
export { _null as null };
const _undefined: RegExp = /^undefined$/i;
export { _undefined as undefined };

// regex for string with no uppercase letters
export const lowercase: RegExp = /^[^A-Z]*$/;
// regex for string with no lowercase letters
export const uppercase: RegExp = /^[^a-z]*$/;

// regex for hexadecimal strings (any length)
export const hex: RegExp = /^[0-9a-fA-F]*$/;

// Hash regexes for different algorithms and encodings

// Helper function to create base64 regex with exact length and padding
function fixedBase64(bodyLength: number, padding: "" | "=" | "=="): RegExp {
  return new RegExp(`^[A-Za-z0-9+/]{${bodyLength}}${padding}$`);
}

// Helper function to create base64url regex with exact length (no padding)
function fixedBase64url(length: number): RegExp {
  return new RegExp(`^[A-Za-z0-9_-]{${length}}$`);
}

// MD5 (16 bytes): base64 = 24 chars total (22 + "==")
export const md5_hex: RegExp = /^[0-9a-fA-F]{32}$/;
export const md5_base64: RegExp = /*@__PURE__*/ fixedBase64(22, "==");
export const md5_base64url: RegExp = /*@__PURE__*/ fixedBase64url(22);

// SHA1 (20 bytes): base64 = 28 chars total (27 + "=")
export const sha1_hex: RegExp = /^[0-9a-fA-F]{40}$/;
export const sha1_base64: RegExp = /*@__PURE__*/ fixedBase64(27, "=");
export const sha1_base64url: RegExp = /*@__PURE__*/ fixedBase64url(27);

// SHA256 (32 bytes): base64 = 44 chars total (43 + "=")
export const sha256_hex: RegExp = /^[0-9a-fA-F]{64}$/;
export const sha256_base64: RegExp = /*@__PURE__*/ fixedBase64(43, "=");
export const sha256_base64url: RegExp = /*@__PURE__*/ fixedBase64url(43);

// SHA384 (48 bytes): base64 = 64 chars total (no padding)
export const sha384_hex: RegExp = /^[0-9a-fA-F]{96}$/;
export const sha384_base64: RegExp = /*@__PURE__*/ fixedBase64(64, "");
export const sha384_base64url: RegExp = /*@__PURE__*/ fixedBase64url(64);

// SHA512 (64 bytes): base64 = 88 chars total (86 + "==")
export const sha512_hex: RegExp = /^[0-9a-fA-F]{128}$/;
export const sha512_base64: RegExp = /*@__PURE__*/ fixedBase64(86, "==");
export const sha512_base64url: RegExp = /*@__PURE__*/ fixedBase64url(86);

and let' draft src/registries.rs by porting these to rust using napi: 

export const $output: unique symbol = /*@__PURE__*/ Symbol("SchemaOutput");
export type $output = typeof $output;
export const $input: unique symbol = /*@__PURE__*/ Symbol("SchemaInput");
export type $input = typeof $input;

export type $replace<Meta, S extends $SchemaType> = Meta extends $output
  ? core.output<S>
  : Meta extends $input
    ? core.input<S>
    : Meta extends (infer M)[]
      ? $replace<M, S>[]
      : Meta extends (...args: infer P) => infer R
        ? (
            ...args: {
              [K in keyof P]: $replace<P[K], S>; // tuple
            }
          ) => $replace<R, S>
        : // handle objects
          Meta extends object
          ? { [K in keyof Meta]: $replace<Meta[K], S> }
          : Meta;

type MetadataType = object | undefined;
export class $SchemaRegistry<Meta extends MetadataType = MetadataType, Schema extends $SchemaType = $SchemaType> {
  _meta!: Meta;
  _schema!: Schema;
  _map: WeakMap<Schema, $replace<Meta, Schema>> = new WeakMap();
  _idmap: Map<string, Schema> = new Map();

  add<S extends Schema>(
    schema: S,
    ..._meta: undefined extends Meta ? [$replace<Meta, S>?] : [$replace<Meta, S>]
  ): this {
    const meta: any = _meta[0];
    this._map.set(schema, meta!);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.set(meta.id!, schema);
    }
    return this as any;
  }

  clear(): this {
    this._map = new WeakMap();
    this._idmap = new Map();
    return this;
  }

  remove(schema: Schema): this {
    const meta: any = this._map.get(schema);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.delete(meta.id!);
    }
    this._map.delete(schema);
    return this;
  }

  get<S extends Schema>(schema: S): $replace<Meta, S> | undefined {
    // return this._map.get(schema) as any;

    // inherit metadata
    const p = Schema._schema.parent as Schema  ;
    if (p) {
      const pm: any = { ...(this.get(p) ?? {}) };
      delete pm.id; // do not inherit id
      const f = { ...pm, ...this._map.get(schema) } as any;
      return Object.keys(f).length ? f : undefined;
    }
    return this._map.get(schema) as any;
  }

  has(schema: Schema): boolean {
    return this._map.has(schema);
  }
}

export interface JSONSchemaMeta {
  id?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  deprecated?: boolean | undefined;
  [k: string]: unknown;
}

export interface GlobalMeta extends JSONSchemaMeta {}

// registries
export function registry<T extends MetadataType = MetadataType, S extends $SchemaType = $SchemaType>(): $SchemaRegistry<T, S> {
  return new $SchemaRegistry<T, S>();
}

interface GlobalThisWithRegistry {
  /**
   * The globalRegistry instance shared across both CommonJS and ESM builds.
   * By attaching the registry to `globalThis`, this property ensures a single, deduplicated instance
   * is used regardless of whether the package is loaded via `require` (CJS) or `import` (ESM).
   * This prevents dual package hazards and keeps registry state consistent.
   */
  __schema_globalRegistry?: $SchemaRegistry<GlobalMeta>;
}

(globalThis as GlobalThisWithRegistry).__schema_globalRegistry ??= registry<GlobalMeta>();
export const globalRegistry: $SchemaRegistry<GlobalMeta> = (globalThis as GlobalThisWithRegistry).__schema_globalRegistry!;



and let' draft src/schemas.rs by porting these to rust using napi: 


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


  and draft src/api.rs by porting 
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


and draft src/checks.rs by porting 
//////////////////////////////   CHECKS   ///////////////////////////////////////

export interface $SchemaCheckDef {
  check: string;
  error?: errors.$SchemaErrorMap<never> | undefined;
  /** If true, no later checks will be executed if this check fails. Default `false`. */
  abort?: boolean | undefined;
  /** If provided, the check runs only when this returns `true`. By default, it is skipped if prior parsing produced aborting issues. */
  when?: ((payload: schemas.ParsePayload) => boolean) | undefined;
}

export interface $SchemaCheckInternals<T> {
  def: $SchemaCheckDef;
  /** The set of issues this check might throw. */
  issc?: errors.$SchemaIssueBase;
  check(payload: schemas.ParsePayload<T>): util.MaybeAsync<void>;
  onattach: ((schema: schemas.$SchemaType) => void)[];
}

export interface $SchemaCheck<in T = never> {
  _schema: $SchemaCheckInternals<T>;
}

export const $SchemaCheck: core.$constructor<$SchemaCheck<any>> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheck",
  (inst, def) => {
    inst._schema ??= {} as any;
    inst._schema.def = def;
    inst._schema.onattach ??= [];
  }
);

/** Default `when` for size-based checks: run only on non-nullish values with a `size`. */
const _whenHasSize = (payload: schemas.ParsePayload): boolean => {
  const val = payload.value;
  return !util.nullish(val) && (val as any).size !== undefined;
};

/** Default `when` for length-based checks: run only on non-nullish values with a `length`. */
const _whenHasLength = (payload: schemas.ParsePayload): boolean => {
  const val = payload.value;
  return !util.nullish(val) && (val as any).length !== undefined;
};

///////////////////////////////////////
/////      $SchemaCheckLessThan      /////
///////////////////////////////////////
export interface $SchemaCheckLessThanDef extends $SchemaCheckDef {
  check: "less_than";
  value: util.Numeric;
  inclusive: boolean;
}

export interface $SchemaCheckLessThanInternals<T extends util.Numeric = util.Numeric> extends $SchemaCheckInternals<T> {
  def: $SchemaCheckLessThanDef;
  issc: errors.$SchemaIssueTooBig<T>;
}

const numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date",
} as const;
export interface $SchemaCheckLessThan<T extends util.Numeric = util.Numeric> extends $SchemaCheck<T> {
  _schema: $SchemaCheckLessThanInternals<T>;
}

export const $SchemaCheckLessThan: core.$constructor<$SchemaCheckLessThan> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckLessThan",
  (inst, def) => {
    $SchemaCheck.init(inst, def);
    const origin = numericOriginMap[typeof def.value as "number" | "bigint" | "object"];

    inst._schema.check = (payload) => {
      if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
        return;
      }

      payload.issues.push({
        origin: numericOriginMap[typeof payload.value as "number" | "bigint" | "object"] ?? origin,
        code: "too_big",
        maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
        input: payload.value,
        inclusive: def.inclusive,
        inst,
        continue: !def.abort,
      });
    };
  }
);

/////////////////////////////////////
/////    $SchemaCheckGreaterThan    /////
/////////////////////////////////////
export interface $SchemaCheckGreaterThanDef extends $SchemaCheckDef {
  check: "greater_than";
  value: util.Numeric;
  inclusive: boolean;
}

export interface $SchemaCheckGreaterThanInternals<T extends util.Numeric = util.Numeric> extends $SchemaCheckInternals<T> {
  def: $SchemaCheckGreaterThanDef;
  issc: errors.$SchemaIssueTooSmall<T>;
}

export interface $SchemaCheckGreaterThan<T extends util.Numeric = util.Numeric> extends $SchemaCheck<T> {
  _schema: $SchemaCheckGreaterThanInternals<T>;
}

export const $SchemaCheckGreaterThan: core.$constructor<$SchemaCheckGreaterThan> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckGreaterThan",
  (inst, def) => {
    $SchemaCheck.init(inst, def);
    const origin = numericOriginMap[typeof def.value as "number" | "bigint" | "object"];

    inst._schema.check = (payload) => {
      if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
        return;
      }

      payload.issues.push({
        origin: numericOriginMap[typeof payload.value as "number" | "bigint" | "object"] ?? origin,
        code: "too_small",
        minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
        input: payload.value,
        inclusive: def.inclusive,
        inst,
        continue: !def.abort,
      });
    };
  }
);

/////////////////////////////////////
/////    $SchemaCheckMultipleOf    /////
/////////////////////////////////////
// https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript/31711034#31711034

export interface $SchemaCheckMultipleOfDef<T extends number | bigint = number | bigint> extends $SchemaCheckDef {
  check: "multiple_of";
  value: T;
}

export interface $SchemaCheckMultipleOfInternals<T extends number | bigint = number | bigint>
  extends $SchemaCheckInternals<T> {
  def: $SchemaCheckMultipleOfDef<T>;
  issc: errors.$SchemaIssueNotMultipleOf;
}

export interface $SchemaCheckMultipleOf<T extends number | bigint = number | bigint> extends $SchemaCheck<T> {
  _schema: $SchemaCheckMultipleOfInternals<T>;
}

export const $SchemaCheckMultipleOf: core.$constructor<$SchemaCheckMultipleOf<number | bigint>> =
  /*@__PURE__*/ core.$constructor("$SchemaCheckMultipleOf", (inst, def) => {
    $SchemaCheck.init(inst, def);

    inst._schema.check = (payload) => {
      if (typeof payload.value !== typeof def.value)
        throw new Error("Cannot mix number and bigint in multiple_of check.");
      const isMultiple =
        typeof payload.value === "bigint"
          ? // `value % 0n` throws, and nothing is a multiple of zero — the number branch already fails this way via NaN
            (def.value as bigint) !== BigInt(0) && payload.value % (def.value as bigint) === BigInt(0)
          : util.floatSafeRemainder(payload.value, def.value as number) === 0;

      if (isMultiple) return;
      payload.issues.push({
        origin: typeof payload.value as "number",
        code: "not_multiple_of",
        divisor: def.value as number,
        input: payload.value,
        inst,
        continue: !def.abort,
      });
    };
  });

/////////////////////////////////////
/////    $SchemaCheckFinite    /////
/////////////////////////////////////
// interface $SchemaCheckFiniteDef extends $SchemaCheckDef {
//   check: "finite";
// }

// export interface $SchemaCheckFinite extends $SchemaCheckInternals<number> {
//   _def: $SchemaCheckFiniteDef;
//   _issc:
//     | errors.$SchemaIssueTooBig<"number", number>
//     | errors.$SchemaIssueTooSmall<"number", number>;
// }

// export const $SchemaCheckFinite: core.$constructor<$SchemaCheckFinite> =
//   core.$constructor("$SchemaCheckFinite", (inst, def) => {
//     $SchemaCheck.init(inst, def);

//     inst._schema.onattach = (inst) => {
//       inst["_bag"].finite = true;
//     };

//     inst._schema.check = (payload) => {
//       if (Number.isFinite(payload.value)) return;
//       payload.issues.push({
//         origin: "number",
//         ...(payload.value === Number.POSITIVE_INFINITY
//           ? {
//               code: "too_big",
//               maximum: Number.POSITIVE_INFINITY,
//             }
//           : {
//               code: "too_small",
//               minimum: Number.NEGATIVE_INFINITY,
//             }),
//         // code: payload.value === Number.POSITIVE_INFINITY ? "too_big" : "too_big",
//         // maximum: Number.POSITIVE_INFINITY,
//         inclusive: false,
//         input: payload.value,
//         inst,
//       });
//     };
//   });

///////////////////////////////////////
/////    $SchemaCheckNumberFormat    /////
///////////////////////////////////////

export type $SchemaNumberFormats = "int32" | "uint32" | "float32" | "float64" | "safeint";

export interface $SchemaCheckNumberFormatDef<Format extends $SchemaNumberFormats = $SchemaNumberFormats> extends $SchemaCheckDef {
  check: "number_format";
  format: Format;
  // abort?: boolean;
}

export interface $SchemaCheckNumberFormatInternals<Format extends $SchemaNumberFormats = $SchemaNumberFormats>
  extends $SchemaCheckInternals<number> {
  def: $SchemaCheckNumberFormatDef<Format>;
  issc: errors.$SchemaIssueInvalidType | errors.$SchemaIssueTooBig<"number"> | errors.$SchemaIssueTooSmall<"number">;
  // bag: util.LoosePartial<{
  //   minimum?: number | undefined;
  // }>;
}

export interface $SchemaCheckNumberFormat<Format extends $SchemaNumberFormats = $SchemaNumberFormats> extends $SchemaCheck<number> {
  _schema: $SchemaCheckNumberFormatInternals<Format>;
}

export const $SchemaCheckNumberFormat: core.$constructor<$SchemaCheckNumberFormat> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckNumberFormat",
  (inst, def) => {
    $SchemaCheck.init(inst, def); // no format checks
    def.format = def.format || "float64";

    const isInt = def.format?.includes("int");
    const origin = isInt ? "int" : "number";
    const [minimum, maximum] = util.NUMBER_FORMAT_RANGES[def.format];

    inst._schema.check = (payload) => {
      const input = payload.value;

      if (isInt) {
        if (!Number.isInteger(input)) {
          // invalid_format issue
          // payload.issues.push({
          //   expected: def.format,
          //   format: def.format,
          //   code: "invalid_format",
          //   input,
          //   inst,
          // });
          // invalid_type issue
          payload.issues.push({
            expected: origin,
            format: def.format,
            code: "invalid_type",
            continue: false,
            input,
            inst,
          });

          return;

          // not_multiple_of issue
          // payload.issues.push({
          //   code: "not_multiple_of",
          //   origin: "number",
          //   input,
          //   inst,
          //   divisor: 1,
          // });
        }
        if (!Number.isSafeInteger(input)) {
          if (input > 0) {
            // too_big
            payload.issues.push({
              input,
              code: "too_big",
              maximum: Number.MAX_SAFE_INTEGER,
              note: "Integers must be within the safe integer range.",
              inst,
              origin,
              inclusive: true,
              continue: !def.abort,
            });
          } else {
            // too_small
            payload.issues.push({
              input,
              code: "too_small",
              minimum: Number.MIN_SAFE_INTEGER,
              note: "Integers must be within the safe integer range.",
              inst,
              origin,
              inclusive: true,
              continue: !def.abort,
            });
          }

          return;
        }
      }

      if (input < minimum) {
        payload.issues.push({
          origin: "number",
          input,
          code: "too_small",
          minimum,
          inclusive: true,
          inst,
          continue: !def.abort,
        });
      }

      if (input > maximum) {
        payload.issues.push({
          origin: "number",
          input,
          code: "too_big",
          maximum,
          inclusive: true,
          inst,
          continue: !def.abort,
        } as any);
      }
    };
  }
);

/////////////////////////////////////
/////    $SchemaCheckBigIntFormat    /////
/////////////////////////////////////

export type $SchemaBigIntFormats = "int64" | "uint64";

export interface $SchemaCheckBigIntFormatDef<Format extends $SchemaBigIntFormats = $SchemaBigIntFormats> extends $SchemaCheckDef {
  check: "bigint_format";
  format: Format;
}

export interface $SchemaCheckBigIntFormatInternals<Format extends $SchemaBigIntFormats = $SchemaBigIntFormats>
  extends $SchemaCheckInternals<bigint> {
  def: $SchemaCheckBigIntFormatDef<Format>;
  issc: errors.$SchemaIssueTooBig<"bigint"> | errors.$SchemaIssueTooSmall<"bigint">;
}

export interface $SchemaCheckBigIntFormat<Format extends $SchemaBigIntFormats = $SchemaBigIntFormats> extends $SchemaCheck<bigint> {
  _schema: $SchemaCheckBigIntFormatInternals<Format>;
}

export const $SchemaCheckBigIntFormat: core.$constructor<$SchemaCheckBigIntFormat> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckBigIntFormat",
  (inst, def) => {
    $SchemaCheck.init(inst, def); // no format checks

    const [minimum, maximum] = util.BIGINT_FORMAT_RANGES[def.format];

    inst._schema.check = (payload) => {
      const input = payload.value;

      if (input < minimum) {
        payload.issues.push({
          origin: "bigint",
          input,
          code: "too_small",
          minimum: minimum as any,
          inclusive: true,
          inst,
          continue: !def.abort,
        });
      }

      if (input > maximum) {
        payload.issues.push({
          origin: "bigint",
          input,
          code: "too_big",
          maximum,
          inclusive: true,
          inst,
          continue: !def.abort,
        } as any);
      }
    };
  }
);

//////////////////////////////////
/////    $SchemaCheckMaxSize    /////
//////////////////////////////////
export interface $SchemaCheckMaxSizeDef extends $SchemaCheckDef {
  check: "max_size";
  maximum: number;
}

export interface $SchemaCheckMaxSizeInternals<T extends util.HasSize = util.HasSize> extends $SchemaCheckInternals<T> {
  def: $SchemaCheckMaxSizeDef;
  issc: errors.$SchemaIssueTooBig<T>;
}

export interface $SchemaCheckMaxSize<T extends util.HasSize = util.HasSize> extends $SchemaCheck<T> {
  _schema: $SchemaCheckMaxSizeInternals<T>;
}

export const $SchemaCheckMaxSize: core.$constructor<$SchemaCheckMaxSize> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckMaxSize",
  (inst, def) => {
    $SchemaCheck.init(inst, def);

    inst._schema.def.when ??= _whenHasSize;

    inst._schema.check = (payload) => {
      const input = payload.value;
      const size = input.size;

      if (size <= def.maximum) return;
      payload.issues.push({
        origin: util.getSizableOrigin(input),
        code: "too_big",
        maximum: def.maximum,
        inclusive: true,
        input,
        inst,
        continue: !def.abort,
      });
    };
  }
);

//////////////////////////////////
/////    $SchemaCheckMinSize    /////
//////////////////////////////////
export interface $SchemaCheckMinSizeDef extends $SchemaCheckDef {
  check: "min_size";
  minimum: number;
}

export interface $SchemaCheckMinSizeInternals<T extends util.HasSize = util.HasSize> extends $SchemaCheckInternals<T> {
  def: $SchemaCheckMinSizeDef;
  issc: errors.$SchemaIssueTooSmall<T>;
}

export interface $SchemaCheckMinSize<T extends util.HasSize = util.HasSize> extends $SchemaCheck<T> {
  _schema: $SchemaCheckMinSizeInternals<T>;
}

export const $SchemaCheckMinSize: core.$constructor<$SchemaCheckMinSize> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckMinSize",
  (inst, def) => {
    $SchemaCheck.init(inst, def);

    inst._schema.def.when ??= _whenHasSize;

    inst._schema.check = (payload) => {
      const input = payload.value;
      const size = input.size;

      if (size >= def.minimum) return;
      payload.issues.push({
        origin: util.getSizableOrigin(input),
        code: "too_small",
        minimum: def.minimum,
        inclusive: true,
        input,
        inst,
        continue: !def.abort,
      });
    };
  }
);

/////////////////////////////////////
/////    $SchemaCheckSizeEquals    /////
/////////////////////////////////////
export interface $SchemaCheckSizeEqualsDef extends $SchemaCheckDef {
  check: "size_equals";
  size: number;
}

export interface $SchemaCheckSizeEqualsInternals<T extends util.HasSize = util.HasSize> extends $SchemaCheckInternals<T> {
  def: $SchemaCheckSizeEqualsDef;
  issc: errors.$SchemaIssueTooBig<T> | errors.$SchemaIssueTooSmall<T>;
}

export interface $SchemaCheckSizeEquals<T extends util.HasSize = util.HasSize> extends $SchemaCheck<T> {
  _schema: $SchemaCheckSizeEqualsInternals<T>;
}

export const $SchemaCheckSizeEquals: core.$constructor<$SchemaCheckSizeEquals> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckSizeEquals",
  (inst, def) => {
    $SchemaCheck.init(inst, def);

    inst._schema.def.when ??= _whenHasSize;

    inst._schema.check = (payload) => {
      const input = payload.value;
      const size = input.size;
      if (size === def.size) return;

      const tooBig = size > def.size;
      payload.issues.push({
        origin: util.getSizableOrigin(input),
        ...(tooBig ? { code: "too_big", maximum: def.size } : { code: "too_small", minimum: def.size }),
        inclusive: true,
        exact: true,
        input: payload.value,
        inst,
        continue: !def.abort,
      });
    };
  }
);

//////////////////////////////////
/////    $SchemaCheckMaxLength    /////
//////////////////////////////////

export interface $SchemaCheckMaxLengthDef extends $SchemaCheckDef {
  check: "max_length";
  maximum: number;
}

export interface $SchemaCheckMaxLengthInternals<T extends util.HasLength = util.HasLength> extends $SchemaCheckInternals<T> {
  def: $SchemaCheckMaxLengthDef;
  issc: errors.$SchemaIssueTooBig<T>;
}

export interface $SchemaCheckMaxLength<T extends util.HasLength = util.HasLength> extends $SchemaCheck<T> {
  _schema: $SchemaCheckMaxLengthInternals<T>;
}

export const $SchemaCheckMaxLength: core.$constructor<$SchemaCheckMaxLength> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckMaxLength",
  (inst, def) => {
    $SchemaCheck.init(inst, def);

    inst._schema.def.when ??= _whenHasLength;

    inst._schema.check = (payload) => {
      const input = payload.value;
      const units = input.length;
      // Strings are measured in Unicode code points, not UTF-16 units. A code point is at most two units, so a string that already fits in units fits in code points; only an overflow has to be counted.
      const length = typeof input === "string" && units > def.maximum ? util.codePointLength(input) : units;

      if (length <= def.maximum) return;
      const origin = util.getLengthableOrigin(input);
      payload.issues.push({
        origin,
        code: "too_big",
        maximum: def.maximum,
        inclusive: true,
        input,
        inst,
        continue: !def.abort,
      });
    };
  }
);

//////////////////////////////////
/////    $SchemaCheckMinLength    /////
//////////////////////////////////
export interface $SchemaCheckMinLengthDef extends $SchemaCheckDef {
  check: "min_length";
  minimum: number;
}

export interface $SchemaCheckMinLengthInternals<T extends util.HasLength = util.HasLength> extends $SchemaCheckInternals<T> {
  def: $SchemaCheckMinLengthDef;
  issc: errors.$SchemaIssueTooSmall<T>;
}

export interface $SchemaCheckMinLength<T extends util.HasLength = util.HasLength> extends $SchemaCheck<T> {
  _schema: $SchemaCheckMinLengthInternals<T>;
}

export const $SchemaCheckMinLength: core.$constructor<$SchemaCheckMinLength> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckMinLength",
  (inst, def) => {
    $SchemaCheck.init(inst, def);

    inst._schema.def.when ??= _whenHasLength;

    inst._schema.check = (payload) => {
      const input = payload.value;
      const units = input.length;
      // A code point is one or two UTF-16 units, so fewer units than the floor can never reach it and twice the floor always clears it. Only in between is the exact count in doubt.
      const length =
        typeof input === "string" && units >= def.minimum && units < def.minimum * 2
          ? util.codePointLength(input)
          : units;

      if (length >= def.minimum) return;
      const origin = util.getLengthableOrigin(input);
      payload.issues.push({
        origin,
        code: "too_small",
        minimum: def.minimum,
        inclusive: true,
        input,
        inst,
        continue: !def.abort,
      });
    };
  }
);

/////////////////////////////////////
/////    $SchemaCheckLengthEquals    /////
/////////////////////////////////////
export interface $SchemaCheckLengthEqualsDef extends $SchemaCheckDef {
  check: "length_equals";
  length: number;
}

export interface $SchemaCheckLengthEqualsInternals<T extends util.HasLength = util.HasLength>
  extends $SchemaCheckInternals<T> {
  def: $SchemaCheckLengthEqualsDef;
  issc: errors.$SchemaIssueTooBig<T> | errors.$SchemaIssueTooSmall<T>;
}

export interface $SchemaCheckLengthEquals<T extends util.HasLength = util.HasLength> extends $SchemaCheck<T> {
  _schema: $SchemaCheckLengthEqualsInternals<T>;
}

export const $SchemaCheckLengthEquals: core.$constructor<$SchemaCheckLengthEquals> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckLengthEquals",
  (inst, def) => {
    $SchemaCheck.init(inst, def);

    inst._schema.def.when ??= _whenHasLength;

    inst._schema.check = (payload) => {
      const input = payload.value;
      const units = input.length;
      // A code point is one or two UTF-16 units, so outside `[length, length * 2]` units the target is missed either way — and missed in the same direction in both measures.
      const length =
        typeof input === "string" && units >= def.length && units <= def.length * 2
          ? util.codePointLength(input)
          : units;
      if (length === def.length) return;
      const origin = util.getLengthableOrigin(input);
      const tooBig = length > def.length;
      payload.issues.push({
        origin,
        ...(tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length }),
        inclusive: true,
        exact: true,
        input: payload.value,
        inst,
        continue: !def.abort,
      });
    };
  }
);

/////////////////////////////////////////////
/////    $SchemaCheckStringFormatRegex    /////
/////////////////////////////////////////////
export type $SchemaStringFormats =
  | "email"
  | "url"
  | "emoji"
  | "uuid"
  | "guid"
  | "nanoid"
  | "cuid"
  | "cuid2"
  | "ulid"
  | "xid"
  | "ksuid"
  | "datetime"
  | "date"
  | "time"
  | "duration"
  | "ipv4"
  | "ipv6"
  | "cidrv4"
  | "cidrv6"
  | "base64"
  | "base64url"
  | "json_string"
  | "e164"
  | "credit_card"
  | "iban"
  | "lowercase"
  | "uppercase"
  | "regex"
  | "jwt"
  | "starts_with"
  | "ends_with"
  | "includes";
export interface $SchemaCheckStringFormatDef<Format extends string = string> extends $SchemaCheckDef {
  check: "string_format";
  format: Format;
  pattern?: RegExp | undefined;
}

export interface $SchemaCheckStringFormatInternals extends $SchemaCheckInternals<string> {
  def: $SchemaCheckStringFormatDef;
  issc: errors.$SchemaIssueInvalidStringFormat;
}

export interface $SchemaCheckStringFormat extends $SchemaCheck<string> {
  _schema: $SchemaCheckStringFormatInternals;
}

export const $SchemaCheckStringFormat: core.$constructor<$SchemaCheckStringFormat> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckStringFormat",
  (inst, def) => {
    $SchemaCheck.init(inst, def);

    if (def.pattern)
      inst._schema.check ??= (payload) => {
        def.pattern!.lastIndex = 0;
        if (def.pattern!.test(payload.value)) return;
        payload.issues.push({
          origin: "string",
          code: "invalid_format",
          format: def.format,
          input: payload.value,
          ...(def.pattern ? { pattern: def.pattern.toString() } : {}),
          inst,
          continue: !def.abort,
        });
      };
    else inst._schema.check ??= () => {};
  }
);

////////////////////////////////
/////    $SchemaCheckRegex    /////
////////////////////////////////
export interface $SchemaCheckRegexDef extends $SchemaCheckStringFormatDef {
  format: "regex";
  pattern: RegExp;
}

export interface $SchemaCheckRegexInternals extends $SchemaCheckInternals<string> {
  def: $SchemaCheckRegexDef;
  issc: errors.$SchemaIssueInvalidStringFormat;
}

export interface $SchemaCheckRegex extends $SchemaCheck<string> {
  _schema: $SchemaCheckRegexInternals;
}

export const $SchemaCheckRegex: core.$constructor<$SchemaCheckRegex> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckRegex",
  (inst, def) => {
    $SchemaCheckStringFormat.init(inst, def);

    inst._schema.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value)) return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: "regex",
        input: payload.value,
        pattern: def.pattern.toString(),
        inst,
        continue: !def.abort,
      });
    };
  }
);

///////////////////////////////////
/////    $SchemaCheckJSONString    /////
///////////////////////////////////
// interface $SchemaCheckJSONStringDef extends $SchemaCheckStringFormatDef<"json_string"> {
//   // check: "string_format";
//   // format: "json_string";
//   // error?: errors.$SchemaErrorMap<errors.$SchemaIssueInvalidStringFormat> | undefined;
// }

// export interface $SchemaCheckJSONString extends $SchemaCheckStringFormat {
//   _def: $SchemaCheckJSONStringDef;
// }

// export const $SchemaCheckJSONString: core.$constructor<$SchemaCheckJSONString> = /*@__PURE__*/ core.$constructor(
//   "$SchemaCheckJSONString",
//   (inst, def) => {
//     $SchemaCheck.init(inst, def);

//     inst._schema.check = (payload) => {
//       try {
//         JSON.parse(payload.value);
//         return;
//       } catch (_) {
//         payload.issues.push({
//           origin: "string",
//           code: "invalid_format",
//           format: def.format,
//           input: payload.value,
//           inst,
//           continue: !def.abort,
//         });
//       }
//     };
//   }
// );

//////////////////////////////////////
/////    $SchemaCheckLowerCase    /////
//////////////////////////////////////
export interface $SchemaCheckLowerCaseDef extends $SchemaCheckStringFormatDef<"lowercase"> {}

export interface $SchemaCheckLowerCaseInternals extends $SchemaCheckInternals<string> {
  def: $SchemaCheckLowerCaseDef;
  issc: errors.$SchemaIssueInvalidStringFormat;
}

export interface $SchemaCheckLowerCase extends $SchemaCheck<string> {
  _schema: $SchemaCheckLowerCaseInternals;
}

export const $SchemaCheckLowerCase: core.$constructor<$SchemaCheckLowerCase> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckLowerCase",
  (inst, def) => {
    def.pattern ??= regexes.lowercase;
    $SchemaCheckStringFormat.init(inst, def);
  }
);

//////////////////////////////////////
/////    $SchemaCheckUpperCase    /////
//////////////////////////////////////
export interface $SchemaCheckUpperCaseDef extends $SchemaCheckStringFormatDef<"uppercase"> {}

export interface $SchemaCheckUpperCaseInternals extends $SchemaCheckInternals<string> {
  def: $SchemaCheckUpperCaseDef;
  issc: errors.$SchemaIssueInvalidStringFormat;
}

export interface $SchemaCheckUpperCase extends $SchemaCheck<string> {
  _schema: $SchemaCheckUpperCaseInternals;
}

export const $SchemaCheckUpperCase: core.$constructor<$SchemaCheckUpperCase> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckUpperCase",
  (inst, def) => {
    def.pattern ??= regexes.uppercase;
    $SchemaCheckStringFormat.init(inst, def);
  }
);

///////////////////////////////////
/////    $SchemaCheckIncludes    /////
///////////////////////////////////
export interface $SchemaCheckIncludesDef extends $SchemaCheckStringFormatDef<"includes"> {
  includes: string;
  position?: number | undefined;
}

export interface $SchemaCheckIncludesInternals extends $SchemaCheckInternals<string> {
  def: $SchemaCheckIncludesDef;
  issc: errors.$SchemaIssueInvalidStringFormat;
}

export interface $SchemaCheckIncludes extends $SchemaCheck<string> {
  _schema: $SchemaCheckIncludesInternals;
}

export const $SchemaCheckIncludes: core.$constructor<$SchemaCheckIncludes> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckIncludes",
  (inst, def) => {
    $SchemaCheck.init(inst, def);

    const escapedRegex = util.escapeRegex(def.includes);
    // `String.prototype.includes(sub, position)` matches `sub` at `position`
    // OR LATER, so the pattern must allow at least `position` leading chars
    // (`{N,}`), not exactly `position` chars (`{N}`).
    const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
    def.pattern = pattern;
    inst._schema.check = (payload) => {
      if (payload.value.includes(def.includes, def.position)) return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: "includes",
        includes: def.includes,
        input: payload.value,
        inst,
        continue: !def.abort,
      });
    };
  }
);

/////////////////////////////////////
/////    $SchemaCheckStartsWith    /////
/////////////////////////////////////
export interface $SchemaCheckStartsWithDef extends $SchemaCheckStringFormatDef<"starts_with"> {
  prefix: string;
}

export interface $SchemaCheckStartsWithInternals extends $SchemaCheckInternals<string> {
  def: $SchemaCheckStartsWithDef;
  issc: errors.$SchemaIssueInvalidStringFormat;
}

export interface $SchemaCheckStartsWith extends $SchemaCheck<string> {
  _schema: $SchemaCheckStartsWithInternals;
}

export const $SchemaCheckStartsWith: core.$constructor<$SchemaCheckStartsWith> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckStartsWith",
  (inst, def) => {
    $SchemaCheck.init(inst, def);

    const pattern = new RegExp(`^${util.escapeRegex(def.prefix)}.*`);
    def.pattern ??= pattern;
    inst._schema.check = (payload) => {
      if (payload.value.startsWith(def.prefix)) return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: "starts_with",
        prefix: def.prefix,
        input: payload.value,
        inst,
        continue: !def.abort,
      });
    };
  }
);

//////////////////////////////////
/////   $SchemaCheckEndsWith    /////
//////////////////////////////////
export interface $SchemaCheckEndsWithDef extends $SchemaCheckStringFormatDef<"ends_with"> {
  suffix: string;
}

export interface $SchemaCheckEndsWithInternals extends $SchemaCheckInternals<string> {
  def: $SchemaCheckEndsWithDef;
  issc: errors.$SchemaIssueInvalidStringFormat;
}

export interface $SchemaCheckEndsWith extends $SchemaCheckInternals<string> {
  _schema: $SchemaCheckEndsWithInternals;
}

export const $SchemaCheckEndsWith: core.$constructor<$SchemaCheckEndsWith> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckEndsWith",
  (inst, def) => {
    $SchemaCheck.init(inst, def);

    const pattern = new RegExp(`.*${util.escapeRegex(def.suffix)}$`);
    def.pattern ??= pattern;
    inst._schema.check = (payload) => {
      if (payload.value.endsWith(def.suffix)) return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: "ends_with",
        suffix: def.suffix,
        input: payload.value,
        inst,
        continue: !def.abort,
      });
    };
  }
);

///////////////////////////////////
/////    $SchemaCheckProperty    /////
///////////////////////////////////
function handleCheckPropertyResult(
  result: schemas.ParsePayload<unknown>,
  payload: schemas.ParsePayload<unknown>,
  property: string | symbol
) {
  if (result.issues.length) {
    payload.issues.push(...util.prefixIssues(property, result.issues));
  }
}
export interface $SchemaCheckPropertyDef extends $SchemaCheckDef {
  check: "property";
  property: string;
  schema: schemas.$SchemaType;
}

export interface $SchemaCheckPropertyInternals<T extends object = object> extends $SchemaCheckInternals<T> {
  def: $SchemaCheckPropertyDef;
  issc: errors.$SchemaIssue;
}

export interface $SchemaCheckProperty<T extends object = object> extends $SchemaCheck<T> {
  _schema: $SchemaCheckPropertyInternals<T>;
}

export const $SchemaCheckProperty: core.$constructor<$SchemaCheckProperty> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckProperty",
  (inst, def) => {
    $SchemaCheck.init(inst, def);

    inst._schema.check = (payload) => {
      const result = def.Schema._schema.run(
        {
          value: (payload.value as any)[def.property],
          issues: [],
        },
        {}
      );

      if (result instanceof Promise) {
        return result.then((result) => handleCheckPropertyResult(result, payload, def.property));
      }

      handleCheckPropertyResult(result, payload, def.property);
      return;
    };
  }
);

/////////////////////////////////////
/////    $SchemaCheckProperties    /////
/////////////////////////////////////
export interface $SchemaCheckPropertiesDef<Shape extends schemas.$SchemaShape = schemas.$SchemaShape> extends $SchemaCheckDef {
  check: "properties";
  shape: Shape;
}

// typed over the input side, since each child's result is discarded; a literal widens to its primitive so spreading over a `string` property still type-checks (#6520)
export type $SchemaCheckPropertiesInput<Shape extends schemas.$SchemaShape = schemas.$SchemaShape> = {
  -readonly [k in keyof Shape]: util.Widen<core.input<Shape[k]>>;
};

export interface $SchemaCheckPropertiesInternals<Shape extends schemas.$SchemaShape = schemas.$SchemaShape>
  extends $SchemaCheckInternals<$SchemaCheckPropertiesInput<Shape>> {
  def: $SchemaCheckPropertiesDef<Shape>;
  issc: errors.$SchemaIssue;
}

export interface $SchemaCheckProperties<Shape extends schemas.$SchemaShape = schemas.$SchemaShape>
  extends $SchemaCheck<$SchemaCheckPropertiesInput<Shape>> {
  _schema: $SchemaCheckPropertiesInternals<Shape>;
  // yields the check itself, so `.check(...Schema.properties(shape))` spread call sites keep working
  [Symbol.iterator](): Iterator<this>;
}

export const $SchemaCheckProperties: core.$constructor<$SchemaCheckProperties> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckProperties",
  (inst, def) => {
    $SchemaCheck.init(inst, def);
    util.hide(inst, Symbol.iterator, function* () {
      yield inst;
    });

    // key and schema snapshotted together: reading one live and the other cached lets a later mutation of the caller's shape object pair a stale key with a missing schema
    let entries!: [string | symbol, schemas.$SchemaType][];
    inst._schema.check = (payload) => {
      // the base schema already typed the value, so only a nullish one is rejected here: the properties read on a primitive too, matching Schema.property() on a string's length
      if (payload.value == null) {
        payload.issues.push({ expected: "object", code: "invalid_type", input: payload.value, inst });
        return undefined;
      }
      entries ??= Reflect.ownKeys(def.shape).map((key) => [key, (def.shape as any)[key] as schemas.$SchemaType]);
      const input = payload.value as any;
      let proms: Promise<any>[] | undefined;
      for (const [key, schema] of entries) {
        const result = Schema._schema.run({ value: input[key], issues: [] }, {});
        if (result instanceof Promise) {
          proms ??= [];
          proms.push(result.then((result) => handleCheckPropertyResult(result, payload, key)));
        } else {
          handleCheckPropertyResult(result, payload, key);
        }
      }
      if (proms) return Promise.all(proms).then(() => undefined);
      return undefined;
    };
  }
);

///////////////////////////////////
/////    $SchemaCheckMimeType    /////
///////////////////////////////////
export interface $SchemaCheckMimeTypeDef extends $SchemaCheckDef {
  check: "mime_type";
  mime: util.MimeTypes[];
}

export interface $SchemaCheckMimeTypeInternals<T extends schemas.File = schemas.File> extends $SchemaCheckInternals<T> {
  def: $SchemaCheckMimeTypeDef;
  issc: errors.$SchemaIssueInvalidValue;
}

export interface $SchemaCheckMimeType<T extends schemas.File = schemas.File> extends $SchemaCheck<T> {
  _schema: $SchemaCheckMimeTypeInternals<T>;
}

export const $SchemaCheckMimeType: core.$constructor<$SchemaCheckMimeType> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckMimeType",
  (inst, def) => {
    $SchemaCheck.init(inst, def);
    const mimeSet = new Set(def.mime);
    inst._schema.check = (payload) => {
      if (mimeSet.has(payload.value.type)) return;
      payload.issues.push({
        code: "invalid_value",
        values: def.mime,
        input: payload.value.type,
        inst,
        continue: !def.abort,
      });
    };
  }
);

///////////////////////////////////
/////    $SchemaCheckFileName    /////
///////////////////////////////////
// interface $SchemaCheckFileNameDef extends $SchemaCheckDef {
//   check: "file_name";
//   fileName: string;
//   error?: errors.$SchemaErrorMap<errors.$SchemaIssueInvalidType> | undefined;
// }
// export interface $SchemaCheckFileName<T extends File = File>
//   extends $SchemaCheckInternals<T> {
//   _def: $SchemaCheckFileNameDef;
// }

// export const $SchemaCheckFileName: core.$constructor<$SchemaCheckFileName> =
//   core.$constructor("$SchemaCheckFileName", (inst, def) => {
//     $SchemaCheck.init(inst, def);

//     inst._schema.check = (payload) => {
//       if (def.fileName === payload.value.name) return;
//       payload.issues.push({
//         origin: "file",
//         code: "invalid_value",
//         options: [def.fileName],
//         input: payload.value,
//         path: ["name"],
//         inst,
//       });
//     };
//   });

///////////////////////////////////
/////    $SchemaCheckOverwrite    /////
///////////////////////////////////
export interface $SchemaCheckOverwriteDef<T = unknown> extends $SchemaCheckDef {
  check: "overwrite";
  tx(value: T): T;
}

export interface $SchemaCheckOverwriteInternals<T = unknown> extends $SchemaCheckInternals<T> {
  def: $SchemaCheckOverwriteDef<T>;
  issc: never;
}

export interface $SchemaCheckOverwrite<T = unknown> extends $SchemaCheck<T> {
  _schema: $SchemaCheckOverwriteInternals<T>;
}

export const $SchemaCheckOverwrite: core.$constructor<$SchemaCheckOverwrite> = /*@__PURE__*/ core.$constructor(
  "$SchemaCheckOverwrite",
  (inst, def) => {
    $SchemaCheck.init(inst, def);

    inst._schema.check = (payload) => {
      payload.value = def.tx(payload.value);
    };
  }
);

// ///////////////////////////////
// /////    $SchemaCheckTrim    /////
// ///////////////////////////////
// export interface $SchemaCheckTrimDef extends $SchemaCheckDef {
//   check: "trim";
//   error?: errors.$SchemaErrorMap<never> | undefined;
// }
// export interface $SchemaCheckTrim extends $SchemaCheckInternals<string> {
//   _def: $SchemaCheckTrimDef;
// }

// export const $SchemaCheckTrim: core.$constructor<$SchemaCheckTrim> =
//   core.$constructor("$SchemaCheckTrim", (inst, def) => {
//     $SchemaCheck.init(inst, def);

//     inst._schema.check = (payload) => {
//       payload.value = payload.value.trim();
//     };
//   });

// //////////////////////////////////////
// /////    $SchemaCheckNormalize    /////
// //////////////////////////////////////
// interface $SchemaCheckNormalizeDef extends $SchemaCheckDef {
//   check: "normalize";
//   error?: errors.$SchemaErrorMap<never> | undefined;
// }

// export interface $SchemaCheckNormalize extends $SchemaCheckInternals<string> {
//   _def: $SchemaCheckNormalizeDef;
// }

// export const $SchemaCheckNormalize: core.$constructor<$SchemaCheckNormalize> =
//   core.$constructor("$SchemaCheckNormalize", (inst, def) => {
//     $SchemaCheck.init(inst, def);

//     inst._schema.check = (payload) => {
//       payload.value = payload.value.normalize();
//     };
//   });

export type $SchemaChecks =
  | $SchemaCheckLessThan
  | $SchemaCheckGreaterThan
  | $SchemaCheckMultipleOf
  | $SchemaCheckNumberFormat
  | $SchemaCheckBigIntFormat
  | $SchemaCheckMaxSize
  | $SchemaCheckMinSize
  | $SchemaCheckSizeEquals
  | $SchemaCheckMaxLength
  | $SchemaCheckMinLength
  | $SchemaCheckLengthEquals
  | $SchemaCheckStringFormat
  | $SchemaCheckProperty
  | $SchemaCheckMimeType
  | $SchemaCheckOverwrite;

export type $SchemaStringFormatChecks =
  | $SchemaCheckRegex
  | $SchemaCheckLowerCase
  | $SchemaCheckUpperCase
  | $SchemaCheckIncludes
  | $SchemaCheckStartsWith
  | $SchemaCheckEndsWith
  | schemas.$SchemaStringFormatTypes; // union of string format schema types


  and draft src/errors.rs by porting import type { $SchemaCheck, $SchemaStringFormats } from "./checks.js";
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


and so on 

and draft comprehensive tests for each one using ts :  src/api.test.ts , src/core.test.ts, src/parse.test.ts, src/checks.test.ts, src/util.test.ts, 

and then update ReadMe.md and draft docs/user-manual.md : 


## Primitives

```ts
import * as Schema   from "schema";

// primitive types
Schema.string();
Schema.number();
Schema.bigint();
Schema.boolean();
Schema.symbol();
Schema.undefined();
Schema.null();
```


### Coercion

To coerce input data to the appropriate type, use `Schema.coerce` instead:

```ts
Schema.coerce.string();    // String(input)
Schema.coerce.number();    // Number(input)
Schema.coerce.boolean();   // Boolean(input)
Schema.coerce.bigint();    // BigInt(input)
```

The coerced variant of these schemas attempts to convert the input value to the appropriate type.

```ts
const schema = Schema.coerce.string();

Schema.parse("tuna");    // => "tuna"
Schema.parse(42);        // => "42"
Schema.parse(true);      // => "true"
Schema.parse(null);      // => "null"
```

The input type of these coerced schemas is `unknown` by default. To specify a more specific input type, pass a generic parameter:

```ts
const A = Schema.coerce.number();
type AInput = Schema.input<typeof A>; // => unknown

const B = Schema.coerce.number<number>();
type BInput = Schema.input<typeof B>; // => number
```

<Accordions type="single">
<Accordion title="How coercion works in Schema">
  
  Schema coerces all inputs using the built-in constructors. 

  | Schema API                  | Coercion                   |
  |--------------------------|----------------------------|
  | `Schema.coerce.string()`      | `String(value)`            |
  | `Schema.coerce.number()`      | `Number(value)`            |
  | `Schema.coerce.boolean()`     | `Boolean(value)`           |
  | `Schema.coerce.bigint()`      | `BigInt(value)`            |
  | `Schema.coerce.date()`        | `new Date(value)`          |

  Boolean coercion with `Schema.coerce.boolean()` may not work how you expect. Any [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) value is coerced to `true`, and any [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) value is coerced to `false`.

  ```ts
  const schema = Schema.coerce.boolean(); // Boolean(input)

  Schema.parse("tuna"); // => true
  Schema.parse("true"); // => true
  Schema.parse("false"); // => true
  Schema.parse(1); // => true
  Schema.parse([]); // => true

  Schema.parse(0); // => false
  Schema.parse(""); // => false
  Schema.parse(undefined); // => false
  Schema.parse(null); // => false
  ```

  For total control over coercion logic, consider using [`Schema.transform()`](#transforms) or [`Schema.pipe()`](#pipes).

</Accordion>
<Accordion title="Customizing the input type">
  
  By default the _input_ type of any `Schema.coerce` schema is `unknown`. In some cases, it may be preferable for the input type to be more specific. You can specify the input type with a generic parameter.

  ```ts
  const regularCoerce = Schema.coerce.string();
  type RegularInput = Schema.input<typeof regularCoerce>; // => unknown
  type RegularOutput = Schema.output<typeof regularCoerce>; // => string

  const customInput = Schema.coerce.string<string>();
  type CustomInput = Schema.input<typeof customInput>; // => string
  type CustomOutput = Schema.output<typeof customInput>; // => string
  ```

</Accordion>
</Accordions>



## Literals

Literal schemas represent a [literal type](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types), like `"hello world"` or `5`.

```ts
const tuna = Schema.literal("tuna");
const twelve = Schema.literal(12);
const twobig = Schema.literal(2n);
const tru = Schema.literal(true);
```

To represent the JavaScript literals `null` and `undefined`:

```ts
Schema.null();
Schema.undefined();
Schema.void(); // equivalent to Schema.undefined()
```

To allow multiple literal values:

```ts
const colors = Schema.literal(["red", "green", "blue"]);

colors.parse("green"); // ✅
colors.parse("yellow"); // ❌
```

To extract the set of allowed values from a literal schema:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
colors.values; // => Set<"red" | "green" | "blue">
```
</Tab>
<Tab value="Schema Mini">
```ts
// no equivalent
```
</Tab>
</Tabs>



## Strings

{/* Schema provides a handful of built-in string validation and transform APIs.

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
Schema.string().startsWith("fourscore")
```
</Tab>
<Tab value="Schema Mini">
```ts
Schema.string().check(Schema.startsWith("fourscore"))
```
</Tab>
</Tabs>

All of the APIs documented below support the `error` parameter for customizing the error message.

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
Schema.string().startsWith("fourscore", {error: "Nice try, buddy"})
```
</Tab>
<Tab value="Schema Mini">
```ts
Schema.string().check(Schema.startsWith("fourscore", {error: "Nice try, buddy"}))
```
</Tab></Tabs> */}


Schema provides a handful of built-in string validation and transform APIs. To perform some common string validations:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
Schema.string().max(5);
Schema.string().min(5);
Schema.string().length(5);
Schema.string().nonempty(); // alias for .min(1)
Schema.string().regex(/^[a-z]+$/);
Schema.string().startsWith("aaa");
Schema.string().endsWith("zzz");
Schema.string().includes("---");
Schema.string().uppercase();
Schema.string().lowercase();
```
</Tab>
<Tab value="Schema Mini">
```ts
Schema.string().check(Schema.maxLength(5));
Schema.string().check(Schema.minLength(5));
Schema.string().check(Schema.length(5));
Schema.string().check(Schema.minLength(1)); // alias for .nonempty()
Schema.string().check(Schema.regex(/^[a-z]+$/));
Schema.string().check(Schema.startsWith("aaa"));
Schema.string().check(Schema.endsWith("zzz"));
Schema.string().check(Schema.includes("---"));
Schema.string().check(Schema.uppercase());
Schema.string().check(Schema.lowercase());
```
</Tab>
</Tabs>

Length is measured in Unicode code points, not UTF-16 code units. Emoji outside the Basic Multilingual Plane count as one, and combining marks and ZWJ sequences count as several.

```ts
Schema.string().length(1).parse("😀"); // one code point, two UTF-16 units
Schema.string().length(2).parse("e\u0301"); // "é" — an e plus a combining acute
Schema.string().length(3).parse("🧑‍🍼"); // person + ZWJ + baby bottle
```

To perform some simple string transforms:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
Schema.string().trim(); // trim whitespace
Schema.string().toLowerCase(); // toLowerCase
Schema.string().toUpperCase(); // toUpperCase
Schema.string().normalize(); // normalize unicode characters
```
</Tab>
<Tab value="Schema Mini">
```ts
Schema.string().check(Schema.trim()); // trim whitespace
Schema.string().check(Schema.toLowerCase()); // toLowerCase
Schema.string().check(Schema.toUpperCase()); // toUpperCase
Schema.string().check(Schema.normalize()); // normalize unicode characters
```
</Tab>
</Tabs>

## String formats

To validate against some common string formats:

```ts
Schema.email();
Schema.uuid();
Schema.url();
Schema.httpUrl();       // http or https URLs only
Schema.hostname();
Schema.e164();          // E.164 phone numbers
Schema.emoji();         // validates a single emoji character
Schema.base64();
Schema.base64url();
Schema.hex();
Schema.jwt();
Schema.nanoid();
Schema.cuid();
Schema.cuid2();
Schema.ulid();
Schema.ipv4();
Schema.ipv6();
Schema.mac();
Schema.cidrv4();        // ipv4 CIDR block
Schema.cidrv6();        // ipv6 CIDR block
Schema.creditCard();    // credit card number (Luhn checksum)
Schema.currencyCode();  // ISO 4217 currency code
Schema.iban();          // IBAN (ISO 7064 mod-97 checksum)
Schema.hash("sha256");  // or "sha1", "sha384", "sha512", "md5"
Schema.iso.date();
Schema.iso.time();
Schema.iso.datetime();
Schema.iso.duration();
```

### Emails

To validate email addresses:

```ts
Schema.email();
```

By default, Schema uses a comparatively strict email regex designed to validate normal email addresses containing common characters. It's roughly equivalent to the rules enforced by Gmail. To learn more about this regex, refer to [this post](https://colinhacks.com/essays/reasonable-email-regex).

```ts
/^(?!\.)(?!.*\.\.)([a-z0-9_'+\-\.]*)[a-z0-9_+-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/i
```

To customize the email validation behavior, you can pass a custom regular expression to the `pattern` param.

```ts
Schema.email({ pattern: /your regex here/ });
```

Schema exports several useful regexes you could use.

```ts
// Schema's default email regex
Schema.email();
Schema.email({ pattern: Schema.regexes.email }); // equivalent

// the regex used by browsers to validate input[type=email] fields
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email
Schema.email({ pattern: Schema.regexes.html5Email });

// the classic emailregex.com regex (RFC 5322)
Schema.email({ pattern: Schema.regexes.rfc5322Email });

// a loose regex that allows Unicode (good for intl emails)
Schema.email({ pattern: Schema.regexes.unicodeEmail });
```

### UUIDs

To validate UUIDs:

```ts
Schema.uuid();
```

To specify a particular UUID version:

```ts
// supports "v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8"
Schema.uuid({ version: "v4" });

// for convenience
Schema.uuidv4();
Schema.uuidv6();
Schema.uuidv7();
```

The RFC 9562/4122 UUID spec requires the first two bits of byte 8 to be `10`. Other UUID-like identifiers do not enforce this constraint. To validate any UUID-like identifier:

```ts
Schema.guid();
```

### URLs

To validate any WHATWG-compatible URL:

```ts
const schema = Schema.url();

Schema.parse("https://example.com"); // ✅
Schema.parse("http://localhost"); // ✅
Schema.parse("mailto:noreply@Schema.dev"); // ✅
```

As you can see this is quite permissive. Internally this uses the `new URL()` constructor to validate inputs; this behavior may differ across platforms and runtimes but it's the mostly rigorous way to validate URIs/URLs on any given JS runtime/engine. 

To validate the hostname against a specific regex:

```ts
const schema = Schema.url({ hostname: /^example\.com$/ });

Schema.parse("https://example.com"); // ✅
Schema.parse("https://zombo.com"); // ❌
```

To validate the protocol against a specific regex, use the `protocol` param.

```ts
const schema = Schema.url({ protocol: /^https$/ });

Schema.parse("https://example.com"); // ✅
Schema.parse("http://example.com"); // ❌
```

<Callout>
  **Web URLs** — In many cases, you'll want to validate Web URLs specifically. Use `Schema.httpUrl()`:

  ```ts
  Schema.httpUrl();

  // equivalent to
  Schema.url({
    protocol: /^https?$/,
    hostname: Schema.regexes.domain
  });
  ```

  This restricts the protocol to `http`/`https` and ensures the hostname is a valid domain name with the `Schema.regexes.domain` regular expression:

  ```ts
  /^(?=.{1,253}$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/
  ```
</Callout>

To normalize URLs, use the `normalize` flag. This will overwrite the input value with the [normalized URL](https://chatgpt.com/share/6881547f-bebc-800f-9093-f5981e277c2c) returned by `new URL()`.

```ts
new URL("HTTP://ExAmPle.com:80/./a/../b?X=1#f oo").href
// => "http://example.com/b?X=1#f%20oo"
```

### Phone numbers

To validate phone numbers in E.164 format:

```ts
const phone = Schema.e164();

phone.parse("+15555555555"); // ✅
phone.parse("555-555-5555"); // ❌
```

This schema validates strings with a leading `+`, a non-zero country code, and 7 to 15 digits total.

### ISO datetimes

As you may have noticed, Schema string includes a few date/time related validations. These validations are regular expression based, so they are not as strict as a full date/time library. However, they are very convenient for validating user input.

The `Schema.iso.datetime()` method accepts a strict subset of ISO 8601; by default, no timezone offsets are allowed:

```ts
const datetime = Schema.iso.datetime();

datetime.parse("2020-01-01T06:15:00Z"); // ✅
datetime.parse("2020-01-01T06:15:00.123Z"); // ✅
datetime.parse("2020-01-01T06:15:00.123456Z"); // ✅ (arbitrary precision)
datetime.parse("2020-01-01T06:15:00+02:00"); // ❌ (offsets not allowed)
datetime.parse("2020-01-01T06:15:00"); // ❌ (local not allowed)
```

To allow timezone offsets:

```ts
const datetime = Schema.iso.datetime({ offset: true });

// allows timezone offsets
datetime.parse("2020-01-01T06:15:00+02:00"); // ✅

// basic offsets not allowed
datetime.parse("2020-01-01T06:15:00+02");    // ❌
datetime.parse("2020-01-01T06:15:00+0200");  // ❌

// Z is still supported
datetime.parse("2020-01-01T06:15:00Z"); // ✅ 
```

To allow unqualified (timezone-less) datetimes:

```ts
const schema = Schema.iso.datetime({ local: true });
Schema.parse("2020-01-01T06:15:01"); // ✅
Schema.parse("2020-01-01T06:15"); // ✅ seconds optional
Schema.parse("2020-01-01T06:15:00Z"); // ✅
Schema.parse("2020-01-01T06:15Z"); // ❌ (a `Z` requires seconds)
```

To constrain the allowable time `precision`. By default, seconds are required and sub-second precision is arbitrary. RFC 3339 mandates the seconds wherever a `Z` or an offset is present, so only the unqualified form `local` adds may omit them.

```ts
const a = Schema.iso.datetime();
a.parse("2020-01-01T06:15Z"); // ❌ (seconds required)
a.parse("2020-01-01T06:15:00Z"); // ✅
a.parse("2020-01-01T06:15:00.123Z"); // ✅

const b = Schema.iso.datetime({ precision: -1 }); // minute precision (no seconds)
b.parse("2020-01-01T06:15Z"); // ✅
b.parse("2020-01-01T06:15:00Z"); // ❌
b.parse("2020-01-01T06:15:00.123Z"); // ❌

const c = Schema.iso.datetime({ precision: 0 }); // second precision only
c.parse("2020-01-01T06:15Z"); // ❌
c.parse("2020-01-01T06:15:00Z"); // ✅
c.parse("2020-01-01T06:15:00.123Z"); // ❌

const d = Schema.iso.datetime({ precision: 3 }); // millisecond precision only
d.parse("2020-01-01T06:15Z"); // ❌
d.parse("2020-01-01T06:15:00Z"); // ❌
d.parse("2020-01-01T06:15:00.123Z"); // ✅
```

To accept minute precision alongside the rest, union the two — no single `precision` covers both.

```ts
const mixed = Schema.union([Schema.iso.datetime(), Schema.iso.datetime({ precision: -1 })]);
mixed.parse("2020-01-01T06:15Z"); // ✅
mixed.parse("2020-01-01T06:15:00.123Z"); // ✅
mixed.parse("2020-01-01T06:15"); // ❌ (still qualified-only)
```

### ISO dates

The `Schema.iso.date()` method validates strings in the format `YYYY-MM-DD`.

```ts
const date = Schema.iso.date();

date.parse("2020-01-01"); // ✅
date.parse("2020-1-1"); // ❌
date.parse("2020-01-32"); // ❌
```

### ISO times

The `Schema.iso.time()` method validates strings in the format `HH:MM[:SS[.s+]]`. By default seconds are optional, as are sub-second decimals.

```ts
const time = Schema.iso.time();

time.parse("03:15"); // ✅
time.parse("03:15:00"); // ✅
time.parse("03:15:00.9999999"); // ✅ (arbitrary precision)
```

No offsets of any kind are allowed.

```ts
time.parse("03:15:00Z"); // ❌ (no `Z` allowed)
time.parse("03:15:00+02:00"); // ❌ (no offsets allowed)
```

Use the `precision` parameter to constrain the allowable decimal precision.

```ts
Schema.iso.time({ precision: -1 }); // HH:MM (minute precision)
Schema.iso.time({ precision: 0 });  // HH:MM:SS (second precision)
Schema.iso.time({ precision: 1 });  // HH:MM:SS.s (decisecond precision)
Schema.iso.time({ precision: 2 });  // HH:MM:SS.ss (centisecond precision)
Schema.iso.time({ precision: 3 });  // HH:MM:SS.sss (millisecond precision)
```

### IP addresses

```ts
const ipv4 = Schema.ipv4();
ipv4.parse("192.168.0.0"); // ✅

const ipv6 = Schema.ipv6();
ipv6.parse("2001:db8:85a3::8a2e:370:7334"); // ✅
```

### IP blocks (CIDR)

Validate IP address ranges specified with [CIDR notation](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing).

```ts
const cidrv4 = Schema.cidrv4();
cidrv4.parse("192.168.0.0/24"); // ✅

const cidrv6 = Schema.cidrv6();
cidrv6.parse("2001:db8::/32"); // ✅
```

### MAC Addresses

Validate standard 48-bit MAC address [IEEE 802](https://en.wikipedia.org/wiki/MAC_address).

```ts
const mac = Schema.mac(); 
mac.parse("00:1A:2B:3C:4D:5E");  // ✅
mac.parse("00-1a-2b-3c-4d-5e");  // ❌ colon-delimited by default
mac.parse("001A:2B3C:4D5E");     // ❌ standard formats only
mac.parse("00:1A:2b:3C:4d:5E");  // ❌ no mixed case

// custom delimiter
const dashMac = Schema.mac({ delimiter: "-" });
dashMac.parse("00-1A-2B-3C-4D-5E"); // ✅
```

### Credit card numbers

Validate a card number: 12 to 19 digits with a valid [Luhn](https://en.wikipedia.org/wiki/Luhn_algorithm) checksum. The issuer is not identified, so cards from any scheme are accepted.

```ts
const card = Schema.creditCard();
card.parse("4111111111111111");     // ✅
card.parse("4111 1111 1111 1111");  // ✅ single spaces
card.parse("4111-1111-1111-1111");  // ✅ single hyphens
card.parse("4111  1111 1111 1111"); // ❌ no repeated separators
card.parse(" 4111111111111111");    // ❌ no surrounding whitespace
card.parse("4111.1111.1111.1111");  // ❌ spaces and hyphens only
card.parse("4111111111111112");     // ❌ failed checksum
```

### Currency codes

The `Schema.currencyCode()` method validates three-letter ISO 4217 currency codes.

```ts
const currency = Schema.currencyCode();

currency.parse("USD"); // ✅
currency.parse("usd"); // ❌
currency.parse("ANG"); // ❌ withdrawn from ISO 4217
```

### IBANs

Validate an International Bank Account Number (IBAN): 2-letter country code, 2 check digits, and 11 to 30 alphanumeric characters with a valid [ISO 7064 MOD 97-10](https://en.wikipedia.org/wiki/International_Bank_Account_Number#Validating_the_IBAN) checksum. The country registry is not consulted, so any country code is accepted and no country's own account length is enforced. Electronic format only.

```ts
const iban = Schema.iban();
iban.parse("DE89370400440532013000");      // ✅
iban.parse("NO9386011117947");             // ✅
iban.parse("DE89 3704 0044 0532 0130 00"); // ❌ no spaces
iban.parse("de89370400440532013000");      // ❌ uppercase only
iban.parse("DE89370400440532013001");      // ❌ failed checksum
iban.parse("DE00000000000000000066");      // ❌ check digits are always 02–98
```

### JWTs

Validate [JSON Web Tokens](https://jwt.io/).

```ts
Schema.jwt();
Schema.jwt({ alg: "HS256" });
```

### Hashes

To validate cryptographic hash values:

```ts
Schema.hash("md5");
Schema.hash("sha1");
Schema.hash("sha256");
Schema.hash("sha384");
Schema.hash("sha512");
```

By default, `Schema.hash()` expects hexadecimal encoding, as is conventional. You can specify a different encoding with the `enc` parameter:

```ts
Schema.hash("sha256", { enc: "hex" });       // default
Schema.hash("sha256", { enc: "base64" });    // base64 encoding
Schema.hash("sha256", { enc: "base64url" }); // base64url encoding (no padding)
```

<Accordions>
<Accordion title="Expected lengths and padding">

| Algorithm / Encoding | `"hex"`  | `"base64"`  | `"base64url"`  |
|-----------|-----------|--------------|-----------------|
| `"md5"`   | 32        | 24 (22 + "==") | 22              |
| `"sha1"`  | 40        | 28 (27 + "=")  | 27              |
| `"sha256"`| 64        | 44 (43 + "=")  | 43              |
| `"sha384"`| 96        | 64 (no padding)| 64              |
| `"sha512"`| 128       | 88 (86 + "==") | 86              |

</Accordion>
</Accordions>

### Custom formats

To define your own string formats:

```ts
const coolId = Schema.stringFormat("cool-id", (val)=>{
  // arbitrary validation here
  return val.length === 100 && val.startsWith("cool-");
});

// a regex is also accepted
Schema.stringFormat("cool-id", /^cool-[a-z0-9]{95}$/);
```

This schema will produce `"invalid_format"` issues, which are more descriptive than the `"custom"` errors produced by refinements or `Schema.custom()`.

```ts
myFormat.parse("invalid input!");
// SchemaError: [
//   {
//     "code": "invalid_format",
//     "format": "cool-id",
//     "path": [],
//     "message": "Invalid cool-id"
//   }
// ]
```

## Template literals

> Introduced in `schema@4.0`.

To define a template literal schema:

```ts
const schema = Schema.templateLiteral([ "hello, ", Schema.string(), "!" ]);
// `hello, ${string}!`
```

The `Schema.templateLiteral` API can handle any number of string literals (e.g. `"hello"`) and schemas. Any schema with an inferred type that's assignable to `string | number | bigint | boolean | null | undefined` can be passed.

```ts
Schema.templateLiteral([ "hi there" ]);
// `hi there`

Schema.templateLiteral([ "email: ", Schema.string() ]);
// `email: ${string}`

Schema.templateLiteral([ "high", Schema.literal(5) ]);
// `high5`

Schema.templateLiteral([ Schema.nullable(Schema.literal("grassy")) ]);
// `grassy` | `null`

Schema.templateLiteral([ Schema.number(), Schema.enum(["px", "em", "rem"]) ]);
// `${number}px` | `${number}em` | `${number}rem`
```

## Numbers

Use `Schema.number()` to validate numbers. It allows any finite number.

```ts
const schema = Schema.number();

Schema.parse(3.14);      // ✅
Schema.parse(NaN);       // ❌
Schema.parse(Infinity);  // ❌
```

Schema implements a handful of number-specific validations:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
Schema.number().gt(5);
Schema.number().gte(5);                     // alias .min(5)
Schema.number().lt(5);
Schema.number().lte(5);                     // alias .max(5)
Schema.number().positive();                 // alias .gt(0)
Schema.number().nonnegative();    
Schema.number().negative(); 
Schema.number().nonpositive(); 
Schema.number().multipleOf(5);              // alias .step(5)
```
</Tab>
<Tab value="Schema Mini">
```ts
Schema.number().check(Schema.gt(5));
Schema.number().check(Schema.gte(5));            // alias .minimum(5)
Schema.number().check(Schema.lt(5));
Schema.number().check(Schema.lte(5));            // alias .maximum(5)
Schema.number().check(Schema.positive());        // alias .gt(0)
Schema.number().check(Schema.nonnegative()); 
Schema.number().check(Schema.negative()); 
Schema.number().check(Schema.nonpositive()); 
Schema.number().check(Schema.multipleOf(5));     // alias .step(5)
```
</Tab>
</Tabs>

If (for some reason) you want to validate `NaN`, use `Schema.nan()`.

```ts
Schema.nan().parse(NaN);              // ✅
Schema.nan().parse("anything else");  // ❌
```

## Integers

To validate integers:

```ts
Schema.int();     // restricts to safe integer range
Schema.int32();   // restrict to int32 range
```

## BigInts

To validate BigInts:

```ts
Schema.bigint();
```

Schema includes a handful of bigint-specific validations.

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
Schema.bigint().gt(5n);
Schema.bigint().gte(5n);                    // alias `.min(5n)`
Schema.bigint().lt(5n);
Schema.bigint().lte(5n);                    // alias `.max(5n)`
Schema.bigint().positive();                 // alias `.gt(0n)`
Schema.bigint().nonnegative(); 
Schema.bigint().negative(); 
Schema.bigint().nonpositive(); 
Schema.bigint().multipleOf(5n);             // alias `.step(5n)`
```
</Tab>
<Tab value="Schema Mini">
```ts
Schema.bigint().check(Schema.gt(5n));
Schema.bigint().check(Schema.gte(5n));           // alias `.minimum(5n)`
Schema.bigint().check(Schema.lt(5n));
Schema.bigint().check(Schema.lte(5n));           // alias `.maximum(5n)`
Schema.bigint().check(Schema.positive());        // alias `.gt(0n)`
Schema.bigint().check(Schema.nonnegative());
Schema.bigint().check(Schema.negative());
Schema.bigint().check(Schema.nonpositive());
Schema.bigint().check(Schema.multipleOf(5n));    // alias `.step(5n)`
```

</Tab>
</Tabs>

## Booleans

To validate boolean values:

```ts
Schema.boolean().parse(true); // => true
Schema.boolean().parse(false); // => false
```

## Dates

Use `Schema.date()` to validate `Date` instances.

```ts
Schema.date().safeParse(new Date()); // success: true
Schema.date().safeParse("2022-01-12T06:15:00.000Z"); // success: false
```

To customize the error message:

```ts
Schema.date({
  error: issue => issue.input === undefined ? "Required" : "Invalid date"
});
```

Schema provides a handful of date-specific validations.

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
Schema.date().min(new Date("1900-01-01"), { error: "Too old!" });
Schema.date().max(new Date(), { error: "Too young!" });
```
</Tab>
<Tab value="Schema Mini">
```ts
Schema.date().check(Schema.minimum(new Date("1900-01-01"), { error: "Too old!" }));
Schema.date().check(Schema.maximum(new Date(), { error: "Too young!" }));
```
</Tab>
</Tabs>

<div id="schema-enums" style={{height:"0px" }} /> 

## Enums

Use `Schema.enum` to validate inputs against a fixed set of allowable _string_ values.

```ts
const FishEnum = Schema.enum(["Salmon", "Tuna", "Trout"]);

FishEnum.parse("Salmon"); // => "Salmon"
FishEnum.parse("Swordfish"); // => ❌
```

<Callout>
  Careful — If you declare your string array as a variable, Schema won't be able to properly infer the exact values of each element.

  ```ts
  const fish = ["Salmon", "Tuna", "Trout"];
  
  const FishEnum = Schema.enum(fish);
  type FishEnum = Schema.infer<typeof FishEnum>; // string
  ```

  To fix this, always pass the array directly into the `Schema.enum()` function, or use [`as const`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions).

  ```ts
  const fish = ["Salmon", "Tuna", "Trout"] as const;

  const FishEnum = Schema.enum(fish);
  type FishEnum = Schema.infer<typeof FishEnum>; // "Salmon" | "Tuna" | "Trout"
  ```
</Callout>

Enum-like object literals (`{ [key: string]: string | number }`) are supported. 

```ts
const Fish = {
  Salmon: 0,
  Tuna: 1
} as const

const FishEnum = Schema.enum(Fish)
FishEnum.parse(Fish.Salmon); // => ✅
FishEnum.parse(0); // => ✅
FishEnum.parse(2); // => ❌
```

You can also pass in an externally-declared TypeScript enum.

```ts
enum Fish {
  Salmon = 0,
  Tuna = 1
}

const FishEnum = Schema.enum(Fish);
FishEnum.parse(Fish.Salmon); // => ✅
FishEnum.parse(0); // => ✅
FishEnum.parse(2); // => ❌
```

<Callout>
Use `Schema.enum()` for externally declared TypeScript enums. The `Schema.nativeEnum()` API is deprecated.

Note that using TypeScript's `enum` keyword is [not recommended](https://www.totaltypescript.com/why-i-dont-like-typescript-enums). 
</Callout>

```ts
enum Fish {
  Salmon = "Salmon",
  Tuna = "Tuna",
  Trout = "Trout",
}

const FishEnum = Schema.enum(Fish);
```

### `.enum`

To extract the schema's values as an enum-like object:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const FishEnum = Schema.enum(["Salmon", "Tuna", "Trout"]);

FishEnum.enum;
// => { Salmon: "Salmon", Tuna: "Tuna", Trout: "Trout" }
```
</Tab>
<Tab value="Schema Mini">
```ts
const FishEnum = Schema.enum(["Salmon", "Tuna", "Trout"]);

FishEnum.def.entries;
// => { Salmon: "Salmon", Tuna: "Tuna", Trout: "Trout" }
```
</Tab>
</Tabs>

### `.exclude()`

To create a new enum schema, excluding certain values:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const FishEnum = Schema.enum(["Salmon", "Tuna", "Trout"]);
const TunaOnly = FishEnum.exclude(["Salmon", "Trout"]);
```
</Tab>
<Tab value="Schema Mini">
```ts
// no equivalent
 
```
</Tab>
</Tabs>

### `.extract()`

To create a new enum schema, extracting certain values:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const FishEnum = Schema.enum(["Salmon", "Tuna", "Trout"]);
const SalmonAndTroutOnly = FishEnum.extract(["Salmon", "Trout"]);
```
</Tab>
<Tab value="Schema Mini">
```ts
// no equivalent
 
```
</Tab>
</Tabs>

## Stringbools [#stringbool]

> Introduced in `schema@4.0`.

In some cases (e.g. parsing environment variables) it's valuable to parse certain string "boolish" values to a plain `boolean` value. Use `Schema.stringbool()` for this:

```ts
const strbool = Schema.stringbool();

strbool.parse("true")         // => true
strbool.parse("1")            // => true
strbool.parse("yes")          // => true
strbool.parse("on")           // => true
strbool.parse("y")            // => true
strbool.parse("enabled")      // => true

strbool.parse("false");       // => false
strbool.parse("0");           // => false
strbool.parse("no");          // => false
strbool.parse("off");         // => false
strbool.parse("n");           // => false
strbool.parse("disabled");    // => false

strbool.parse(/* anything else */); // SchemaError<[{ code: "invalid_value" }]>
```

To customize the truthy and falsy values:

```ts
// these are the defaults
Schema.stringbool({
  truthy: ["true", "1", "yes", "on", "y", "enabled"],
  falsy: ["false", "0", "no", "off", "n", "disabled"],
});
```

By default the schema is *case-insensitive*; all inputs are converted to lowercase before comparison to the `truthy`/`falsy` values. To make it case-sensitive:

```ts
Schema.stringbool({
  case: "sensitive"
});
```


## Optionals

To make a schema *optional* (that is, to allow `undefined` inputs).

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
Schema.optional(Schema.literal("yoda")); // or Schema.literal("yoda").optional()
```
</Tab>
<Tab value="Schema Mini">
```ts
Schema.optional(Schema.literal("yoda"));
```
</Tab>
</Tabs>

This returns a `SchemaOptional` instance that wraps the original Schema. To extract the inner schema:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
optionalYoda.unwrap(); // SchemaLiteral<"yoda">
```
</Tab>
<Tab value="Schema Mini">
```ts
optionalYoda.def.innerType; // SchemaMiniLiteral<"yoda">
```
</Tab>
</Tabs>

<Callout>
  **Exact optionals** — To allow an absent key without allowing an explicit `undefined`, use `.exactOptional()`, per TypeScript's [`exactOptionalPropertyTypes`](https://www.typescriptlang.org/tsconfig/#exactOptionalPropertyTypes).

  <Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
  <Tab value="Schema">
  ```ts
  const User = Schema.object({
    name: Schema.string().optional(),
    nick: Schema.string().exactOptional(),
  });
  // { name?: string | undefined; nick?: string }

  User.parse({ name: undefined }); // ✅
  User.parse({ nick: undefined }); // ❌
  ```
  </Tab>
  <Tab value="Schema Mini">
  ```ts
  const User = Schema.object({
    name: Schema.optional(Schema.string()),
    nick: Schema.exactOptional(Schema.string()),
  });
  // { name?: string | undefined; nick?: string }

  Schema.parse(User, { name: undefined }); // ✅
  Schema.parse(User, { nick: undefined }); // ❌
  ```
  </Tab>
  </Tabs>
</Callout>

## Nullables

To make a schema *nullable* (that is, to allow `null` inputs).

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
Schema.nullable(Schema.literal("yoda")); // or Schema.literal("yoda").nullable()
```
</Tab>
<Tab value="Schema Mini">
```ts
const nullableYoda = Schema.nullable(Schema.literal("yoda"));
```
</Tab>
</Tabs>

This returns a `SchemaNullable` instance that wraps the original Schema. To extract the inner schema:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
nullableYoda.unwrap(); // SchemaLiteral<"yoda">
```
</Tab>
<Tab value="Schema Mini">
```ts
nullableYoda.def.innerType; // SchemaMiniLiteral<"yoda">
```
</Tab>
</Tabs>

## Nullish

To make a schema *nullish* (both optional and nullable):

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const nullishYoda = Schema.nullish(Schema.literal("yoda"));
```
</Tab>
<Tab value="Schema Mini">
```ts
const nullishYoda = Schema.nullish(Schema.literal("yoda"));
```
</Tab>
</Tabs>

Refer to the TypeScript manual for more about the concept of [nullish](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#nullish-coalescing).

## Unknown

Schema aims to mirror TypeScript's type system one-to-one. As such, Schema provides APIs to represent the following special types:

```ts
// allows any values
Schema.any(); // inferred type: `any`
Schema.unknown(); // inferred type: `unknown`
```

As object properties, their keys are required, matching `{ a: any }` in TypeScript.

```ts
Schema.object({ a: Schema.any() }).parse({}); // ❌
Schema.object({ a: Schema.any() }).parse({ a: undefined }); // ✅
Schema.object({ a: Schema.any().optional() }).parse({}); // ✅
```

## Never

No value will pass validation.

```ts
Schema.never(); // inferred type: `never`
```

## Objects

To define an object type:

```ts Schema.object
  // all properties are required by default
  const Person = Schema.object({
    name: Schema.string(),
    age: Schema.number(),
  });

  type Person = Schema.infer<typeof Person>;
  // => { name: string; age: number; }
  ```
By default, all properties are required. To make certain properties optional:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts Schema.object
const Dog = Schema.object({
  name: Schema.string(),
  age: Schema.number().optional(),
});

Dog.parse({ name: "Yeller" }); // ✅
```
</Tab>
<Tab value="Schema Mini">
```ts Schema.object
const Dog = Schema.object({
  name: Schema.string(),
  age: Schema.optional(Schema.number())
});

Dog.parse({ name: "Yeller" }); // ✅
```
</Tab>
</Tabs>



By default, unrecognized keys are *stripped* from the parsed result:

```ts Schema.object
Dog.parse({ name: "Yeller", extraKey: true });
// => { name: "Yeller" }
```

### `Schema.strictObject`

To define a *strict* schema that throws an error when unknown keys are found:

```ts Schema.object
const StrictDog = Schema.strictObject({
  name: Schema.string(),
});

StrictDog.parse({ name: "Yeller", extraKey: true });
// ❌ throws
```

### `Schema.looseObject`

To define a *loose* schema that allows unknown keys to pass through:

```ts Schema.object
const LooseDog = Schema.looseObject({
  name: Schema.string(),
});

LooseDog.parse({ name: "Yeller", extraKey: true });
// => { name: "Yeller", extraKey: true }
```

### `.catchall()`

To define a *catchall schema* that will be used to validate any unrecognized keys:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts Schema.object
const DogWithStrings = z
  .object({
    name: Schema.string(),
    age: Schema.number().optional(),
  })
  .catchall(Schema.string());


DogWithStrings.parse({ name: "Yeller", extraKey: "extraValue" }); // ✅
DogWithStrings.parse({ name: "Yeller", extraKey: 42 }); // ❌
```
</Tab>
<Tab value="Schema Mini">
```ts Schema.object
const DogWithStrings = Schema.catchall(
  Schema.object({
    name: Schema.string(),
    age: Schema.number().optional(),
  }),
  Schema.string()
);

DogWithStrings.parse({ name: "Yeller", extraKey: "extraValue" }); // ✅
DogWithStrings.parse({ name: "Yeller", extraKey: 42 }); // ❌
```
</Tab>
</Tabs>


### `.shape`

To access the internal schemas:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
Dog.shape.name; // => string schema
Dog.shape.age; // => number schema
```
</Tab>
<Tab value="Schema Mini">
```ts
Dog.def.shape.name; // => string schema
Dog.def.shape.age; // => number schema
```
</Tab>
</Tabs>

### `.keyof()`

To create a `SchemaEnum` schema from the keys of an object schema:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const keySchema = Dog.keyof();
// => SchemaEnum<{ name: "name"; age: "age" }>
```
</Tab>
<Tab value="Schema Mini">
```ts
const keySchema = Schema.keyof(Dog);
// => SchemaEnum<{ name: "name"; age: "age" }>
```
</Tab>
</Tabs>

### `.extend()`

To add additional fields to an object schema:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const DogWithBreed = Dog.extend({
  breed: Schema.string(),
});
```
</Tab>
<Tab value="Schema Mini">
```ts
const DogWithBreed = Schema.extend(Dog, {
  breed: Schema.string(),
});
```
</Tab>
</Tabs>

This API can be used to overwrite existing fields! Be careful with this power! If the two schemas share keys, B will override A.

<Callout>
**Alternative: spread syntax** — You can alternatively avoid `.extend()` altogether by creating a new object schema entirely. This makes the strictness level of the resulting schema visually obvious.

```ts
const DogWithBreed = Schema.object({ // or Schema.strictObject() or Schema.looseObject()...
  ...Dog.shape,
  breed: Schema.string(),
});
```

You can also use this to merge multiple objects in one go.

```ts
const DogWithBreed = Schema.object({
  ...Animal.shape,
  ...Pet.shape,
  breed: Schema.string(),
});
```

This approach has a few advantages:

1. It uses language-level features ([spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)) instead of library-specific APIs
2. The same syntax works in Schema and Schema Mini
3. It's more `tsc`-efficient — the `.extend()` method can be expensive on large schemas, and due to [a TypeScript limitation](https://github.com/microsoft/TypeScript/pull/61505) it gets quadratically more expensive when calls are chained
4. If you wish, you can change the strictness level of the resulting schema by using `Schema.strictObject()` or `Schema.looseObject()`
</Callout>

### `.safeExtend()`

The `.safeExtend()` method works similarly to `.extend()`, but it won't let you overwrite an existing property with a non-assignable Schema. In other words, the result of `.safeExtend()` will have an inferred type that [`extends`](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#conditional-type-constraints) the original (in the TypeScript sense).

```ts
Schema.object({ a: Schema.string() }).safeExtend({ a: Schema.string().min(5) }); // ✅
Schema.object({ a: Schema.string() }).safeExtend({ a: Schema.any() }); // ✅
Schema.object({ a: Schema.string() }).safeExtend({ a: Schema.number() });
//                                       ^  ❌ SchemaNumber is not assignable 
```

Use `.safeExtend()` to extend schemas that contain refinements. (Regular `.extend()` will throw an error when used on schemas with refinements.)

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const Base = Schema.object({
  a: Schema.string(),
  b: Schema.string()
}).refine(user => user.a === user.b);

// Extended inherits the refinements of Base
const Extended = Base.safeExtend({
  a: Schema.string().min(10)
});
```
</Tab>
<Tab value="Schema Mini">
```ts
const Base = Schema.object({
  a: Schema.string(),
  b: Schema.string()
}).check(Schema.refine(user => user.a === user.b));

// Extended inherits the refinements of Base
const Extended = Schema.safeExtend(Base, {
  a: Schema.string().min(10)
});
```
</Tab>
</Tabs>

### `.pick()`

Inspired by TypeScript's built-in `Pick` and `Omit` utility types, Schema provides dedicated APIs for picking and omitting certain keys from an object Schema.

Starting from this initial schema:

```ts Schema.object
const Recipe = Schema.object({
  title: Schema.string(),
  description: Schema.string().optional(),
  ingredients: Schema.array(Schema.string()),
});
// { title: string; description?: string | undefined; ingredients: string[] }
```
To pick certain keys:


<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts schema
const JustTheTitle = Recipe.pick({ title: true });
```
</Tab>
<Tab value="Schema Mini">
```ts
const JustTheTitle = Schema.pick(Recipe, { title: true });
```
</Tab>
</Tabs>


### `.omit()`

To omit certain keys:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts schema
const RecipeNoId = Recipe.omit({ id: true });
```
</Tab>
<Tab value="Schema Mini">
```ts
const RecipeNoId = Schema.omit(Recipe, { id: true });
```
</Tab>
</Tabs>


### `.partial()`

For convenience, Schema provides a dedicated API for making some or all properties optional, inspired by the built-in TypeScript utility type [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype).


To make all fields optional:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts schema
const PartialRecipe = Recipe.partial();
// { title?: string | undefined; description?: string | undefined; ingredients?: string[] | undefined }
```
</Tab>
<Tab value="Schema Mini">
```ts
const PartialRecipe = Schema.partial(Recipe);
// { title?: string | undefined; description?: string | undefined; ingredients?: string[] | undefined }
```
</Tab>
</Tabs>

To make certain properties optional:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts schema
const RecipeOptionalIngredients = Recipe.partial({
  ingredients: true,
});
// { title: string; description?: string | undefined; ingredients?: string[] | undefined }
```
</Tab>
<Tab value="Schema Mini">
```ts
const RecipeOptionalIngredients = Schema.partial(Recipe, {
  ingredients: true,
});
// { title: string; description?: string | undefined; ingredients?: string[] | undefined }
```
</Tab>
</Tabs>

### `.exactPartial()`

Identical to `.partial()`, but wraps each field in [`exactOptional()`](#optionals) instead of `optional()`:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts schema
const PartialRecipe = Recipe.exactPartial();
// { title?: string; description?: string | undefined; ingredients?: string[] }
```
</Tab>
<Tab value="Schema Mini">
```ts
const PartialRecipe = Schema.exactPartial(Recipe);
// { title?: string; description?: string | undefined; ingredients?: string[] }
```
</Tab>
</Tabs>

### `Schema.deepPartial()` [#deep-partial]

Where `.partial()` only touches the top-level shape, `Schema.deepPartial()` recurses to every object in the tree — through arrays, tuples, unions, records, and wrappers.

```ts
const Post = Schema.object({
  title: Schema.string(),
  author: Schema.object({ name: Schema.string(), email: Schema.string() }),
});

Schema.deepPartial(Post).parse({ author: {} }); // ✅
```

The source schema is never modified, and the result is still a `SchemaObject`, so `.shape` and `.extend()` keep working. A [discriminated union](#discriminated-unions) degrades to a plain `Schema.union()`, since an optional discriminator defeats the discriminated lookup. Like `.partial()`, it throws on an object carrying its own [refinement](#refinements).

### `.required()`

Schema provides an API for making some or all properties *required*, inspired by TypeScript's [`Required`](https://www.typescriptlang.org/docs/handbook/utility-types.html#requiredtype) utility type.

To make all properties required:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts schema
const RequiredRecipe = Recipe.required();
// { title: string; description: string; ingredients: string[] }
```
</Tab>
<Tab value="Schema Mini">
```ts
const RequiredRecipe = Schema.required(Recipe);
// { title: string; description: string; ingredients: string[] }
```
</Tab>
</Tabs>

To make certain properties required:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts schema
const RecipeRequiredDescription = Recipe.required({description: true});
// { title: string; description: string; ingredients: string[] }
```
</Tab>
<Tab value="Schema Mini">
```ts
const RecipeRequiredDescription = Schema.required(Recipe, {description: true});
// { title: string; description: string; ingredients: string[] }
```
</Tab>
</Tabs>

### Symbol keys

A shape can declare a symbol key. A `const` symbol infers as `unique symbol`, so the key is tracked in the inferred type and its value is validated like any other:

```ts
const TAG = Symbol("tag");
const Post = Schema.object({ title: Schema.string(), [TAG]: Schema.number() });
// { title: string; [TAG]: number }

Post.parse({ title: "hello", [TAG]: 42 }); // ✅
Post.parse({ title: "hello" });            // ❌ the symbol key is required
```

Declared symbol keys work with `.partial()`, `.pick()`, `.omit()`, `.extend()`, and the rest. Symbol keys the shape doesn't declare are ignored — `Schema.looseObject()` won't pass them through, and `Schema.strictObject()` won't flag them.

## Recursive objects

To define a self-referential type, use a [getter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get) on the key. This lets JavaScript resolve the cyclical schema at runtime.

```ts
const Category = Schema.object({
  name: Schema.string(),
  get subcategories(){
    return Schema.array(Category)
  }
});

type Category = Schema.infer<typeof Category>;
// { name: string; subcategories: Category[] }
```

Cyclical inputs work out of the box with Schema. For bundle size reasons, Schema Mini requires you to register a memoizer explicitly (see code example).

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const input: any = { name: "root", subcategories: [] };
input.subcategories.push(input);

const result = Category.parse(input);
result.subcategories[0] === result; // true

// the output graph mirrors the input graph
result.subcategories[0].subcategories[0] === result; // true
```
</Tab>
<Tab value="Schema Mini">
```ts
// Schema Mini requires a memoizer, registered before schemas are defined
Schema.config({ memoizer: Schema.memoizer() });

const input: any = { name: "root", subcategories: [] };
input.subcategories.push(input);

const result = Category.parse(input);
result.subcategories[0] === result; // true
```
</Tab>
</Tabs>

You can also represent *mutually recursive types*:

```ts
const User = Schema.object({
  email: Schema.email(),
  get posts(){
    return Schema.array(Post)
  }
});

const Post = Schema.object({
  title: Schema.string(),
  get author(){
    return User
  }
});
```

All object APIs (`.pick()`, `.omit()`, `.required()`, `.partial()`, etc.) work as you'd expect.

### Circularity errors

Due to TypeScript limitations, recursive type inference can be finicky, and it only works in certain scenarios. Some more complicated types may trigger recursive type errors like this:

```ts
const Activity = Schema.object({
  name: Schema.string(),
  get subactivities() {
    // ^ ❌ 'subactivities' implicitly has return type 'any' because it does not
    // have a return type annotation and is referenced directly or indirectly
    // in one of its return expressions.ts(7023)

    return Schema.nullable(Schema.array(Activity));
  },
});
```

In these cases, you can resolve the error with a type annotation on the offending getter:

```ts
const Activity = Schema.object({
  name: Schema.string(),
  get subactivities(): Schema.SchemaNullable<Schema.SchemaArray<typeof Activity>> {
    return Schema.nullable(Schema.array(Activity));
  },
});
```

{/* Some general rules of thumb for avoiding circularity  */}

{/* 
<Accordions>
  <Accordion title="Resolving type errors in recursive schemas">
    Recursive type inference can by mysterious. TypeScript is capable of it in certain limited scenarios. Depending on what you're trying to do, you may encounter errors like this:

    ```ts
    export const Activity = Schema.object({
      name: Schema.string(),
      get children() {
        // ^ ❌ 'children' implicitly has return type 'any' because it does not 
        // have a return type annotation and is referenced directly or indirectly 
        // in one of its return expressions.ts(7023)

        return Schema.optional(Schema.array(Activity)); //.optional();
      },
    });
    ```

    Here are a couple rules of thumb:

    ### Object types only 
    
    Generally speaking, recursive inference only works with object types that are referencing each other. TypeScript has special handling for resolving getter-based recursive objects, which is what Schema relies on. If you try to add non-object types into the mix, you'll likely encounter errors.

    ```ts
    const Activity = Schema.object({
      name: Schema.string(),
      get children() { // ❌ type error
        return Schema.optional(ActivityArray);
      },
    });

    const ActivityArray = Schema.array(Activity);
    ```

    Sometimes you can get around this limitation by defining 


    ### Avoid nesting function calls
    
    Functions like `Schema.array()` and `Schema.optional()` accept Schema schemas, so when you use them TypeScript will do some type-checking on their inputs to make sure they are valid. But type checking is the enemy of recursive type inference—it's hard for TypeScript to *check* and *infer* types at the same time. Methods do not have this problem, so prefer methods over functions when possible (sorry Schema Mini users).

    ```ts
    const Activity = Schema.object({
      name: Schema.string(),
      get subactivities() {
        // ^ ❌ 'subactivities' implicitly has return type 'any' because it does not 
        // have a return type annotation and is referenced directly or indirectly 
        // in one of its return expressions.ts(7023)

        return Schema.union([Schema.null(), Activity]);
      },
    });
    ```

    ### Fall back to type annotations on your getters
    
    When in doubt, you can generally sidestep these issues with some carefully deployed type annotations on your getters. Due to the limitations described above, this is particularly necessary when using Schema Mini.

    ```ts
    import * as Schema   from "schema";

    const Activity = Schema.object({
      name: Schema.string(),
      get subactivities(): Schema.SchemaMiniDefault<Schema.SchemaMiniArray<typeof Activity>> {
        return Schema._default(Schema.array(Activity), []);
      },
    });
    ```

  </Accordion>
</Accordions> */}

## Arrays

To define an array schema:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const stringArray = Schema.array(Schema.string()); // or Schema.string().array()
```
</Tab>
<Tab value="Schema Mini">
```ts
const stringArray = Schema.array(Schema.string());
```
</Tab>
</Tabs>

To access the inner schema for an element of the array.

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
stringArray.unwrap(); // => string schema
```
</Tab>
<Tab value="Schema Mini">
```ts
stringArray.def.element; // => string schema
```
</Tab>
</Tabs>

Schema implements a number of array-specific validations:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
Schema.array(Schema.string()).nonempty(); // must contain at least 1 item
Schema.array(Schema.string()).min(5); // must contain 5 or more items
Schema.array(Schema.string()).max(5); // must contain 5 or fewer items
Schema.array(Schema.string()).length(5); // must contain 5 items exactly
```
</Tab>
<Tab value="Schema Mini">
```ts
Schema.array(Schema.string()).check(Schema.minLength(1)); // alias for .nonempty()
Schema.array(Schema.string()).check(Schema.minLength(5)); // must contain 5 or more items
Schema.array(Schema.string()).check(Schema.maxLength(5)); // must contain 5 or fewer items
Schema.array(Schema.string()).check(Schema.length(5)); // must contain 5 items exactly
```
</Tab>
</Tabs>

{/* Unlike `.nonempty()` these methods do not change the inferred type. */}

## Tuples

Unlike arrays, tuples are typically fixed-length arrays that specify different schemas for each index.

```ts
const MyTuple = Schema.tuple([
  Schema.string(),
  Schema.number(),
  Schema.boolean()
]);

type MyTuple = Schema.infer<typeof MyTuple>;
// [string, number, boolean]
```

To add a variadic ("rest") argument:

```ts
const variadicTuple = Schema.tuple([Schema.string()], Schema.number());
// => [string, ...number[]];
```

To make every element optional:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts schema
const PartialTuple = Schema.tuple([Schema.string(), Schema.number()]).partial();
// => [(string | undefined)?, (number | undefined)?]

Schema.tuple([Schema.string()], Schema.number()).partial();
// => [(string | undefined)?, ...number[]]
```
</Tab>
<Tab value="Schema Mini">
```ts
const PartialTuple = Schema.partial(Schema.tuple([Schema.string(), Schema.number()]));
// => [(string | undefined)?, (number | undefined)?]

Schema.partial(Schema.tuple([Schema.string()], Schema.number()));
// => [(string | undefined)?, ...number[]]
```
</Tab>
</Tabs>

## Unions

Union types (`A | B`) represent a logical "OR". Schema union schemas will check the input against each option in order. The first value that validates successfully is returned.

```ts
const stringOrNumber = Schema.union([Schema.string(), Schema.number()]);
// string | number

stringOrNumber.parse("foo"); // passes
stringOrNumber.parse(14); // passes
```

To extract the internal option schemas:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
stringOrNumber.options; // [SchemaString, SchemaNumber]
```
</Tab>
<Tab value="Schema Mini">
```ts
stringOrNumber.def.options; // [SchemaString, SchemaNumber]
```
</Tab>
</Tabs>

{/* For convenience, you can also use the [`.or` method](#or):

```ts
const stringOrNumber = Schema.string().or(Schema.number());
``` */}

{/* **Optional string validation:**

To validate an optional form input, you can union the desired string validation with an empty string [literal](#literals).

This example validates an input that is optional but needs to contain a [valid URL](#strings):

```ts
const optionalUrl = Schema.union([Schema.string().url().nullish(), Schema.literal("")]);

console.log(optionalUrl.safeParse(undefined).success); // true
console.log(optionalUrl.safeParse(null).success); // true
console.log(optionalUrl.safeParse("").success); // true
console.log(optionalUrl.safeParse("https://Schema.dev").success); // true
console.log(optionalUrl.safeParse("not a valid url").success); // false
```

<br/> */}

## Exclusive unions (XOR)

An exclusive union (XOR) is a union where exactly one option must match. Unlike regular unions that succeed when any option matches, `Schema.xor()` fails if zero options match OR if multiple options match.

```ts
const schema = Schema.xor([Schema.string(), Schema.number()]);

Schema.parse("hello"); // ✅ passes
Schema.parse(42);      // ✅ passes
Schema.parse(true);    // ❌ fails (zero matches)
```

This is useful when you want to ensure mutual exclusivity between options:

```ts
// Validate that exactly ONE of these matches
const payment = Schema.xor([
  Schema.object({ type: Schema.literal("card"), cardNumber: Schema.string() }),
  Schema.object({ type: Schema.literal("bank"), accountNumber: Schema.string() }),
]);

payment.parse({ type: "card", cardNumber: "1234" }); // ✅ passes
```

If the input could match multiple options, `Schema.xor()` will fail. The resulting issue has `inclusive: false` and a `matches` array listing the indices of the options that matched:

```ts
const overlapping = Schema.xor([Schema.string(), Schema.any()]);
overlapping.parse("hello"); // ❌ fails (matches both string and any)
// SchemaError: Invalid input: more than one option matched
```

Object options overlap more often than you'd expect, since `Schema.object()` strips unknown keys instead of rejecting them. Below, an input with both keys matches *both* options — the first strips `version`, the second keeps it. Use `Schema.strictObject()` (or `.strict()`) on the narrower option to make the branches mutually exclusive:

```ts
const name = Schema.object({ name: Schema.string() });
const version = name.extend({ version: Schema.string() });

Schema.xor([name, version]).parse({ name: "schema", version: "4" });           // ❌ fails (matches both)
Schema.xor([name.strict(), version]).parse({ name: "schema", version: "4" });  // ✅ passes
```


## Discriminated unions

A [discriminated union](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions) is a special kind of union in which a) all the options are object schemas that b) share a particular key (the "discriminator"). Based on the value of the discriminator key, TypeScript is able to "narrow" the type signature as you'd expect.

```ts
type MyResult =
  | { status: "success"; data: string }
  | { status: "failed"; error: string };

function handleResult(result: MyResult){
  if(result.status === "success"){
    result.data; // string
  } else {
    result.error; // string
  }
}
```

You could represent it with a regular `Schema.union()`. But regular unions are *naive*—they check the input against each option in order and return the first one that passes. This can be slow for large unions.

So Schema provides a `Schema.discriminatedUnion()` API that uses a *discriminator key* to make parsing more efficient.


```ts
const MyResult = Schema.discriminatedUnion("status", [
  Schema.object({ status: Schema.literal("success"), data: Schema.string() }),
  Schema.object({ status: Schema.literal("failed"), error: Schema.string() }),
]);
```

Each option should be an *object schema* whose discriminator prop (`status` in the example above) corresponds to some literal value or set of values, usually `Schema.enum()`, `Schema.literal()`, `Schema.null()`, or `Schema.undefined()`.

<Accordions type="single">
<Accordion title="Nesting discriminated unions">

  For advanced use cases, discriminated unions can be nested. Schema will figure out the optimal parsing strategy to leverage the discriminators at each level.

  ```ts
  const BaseError = { status: Schema.literal("failed"), message: Schema.string() };
  const MyErrors = Schema.discriminatedUnion("code", [
    Schema.object({ ...BaseError, code: Schema.literal(400) }),
    Schema.object({ ...BaseError, code: Schema.literal(401) }),
    Schema.object({ ...BaseError, code: Schema.literal(500) }),
  ]);

  const MyResult = Schema.discriminatedUnion("status", [
    Schema.object({ status: Schema.literal("success"), data: Schema.string() }),
    MyErrors
  ]);
  ```

</Accordion>
</Accordions>

### `Schema.getDiscriminatedOption()`

To retrieve a single option by its discriminator value. The value must be one the union declares; anything else is a TypeScript error.

```ts
const Success = Schema.object({ status: Schema.literal("success"), data: Schema.string() });
const Failed = Schema.object({ status: Schema.literal("failed"), error: Schema.string() });
const MyResult = Schema.discriminatedUnion("status", [Success, Failed]);

Schema.getDiscriminatedOption(MyResult, "success"); // typeof Success
Schema.getDiscriminatedOption(MyResult, "pending"); // ❌ not a declared discriminator
```

The option is returned as-is, so `.shape` and the other object methods keep working.

If multiple options accept an absent discriminator, looking up `undefined` throws an ambiguity error. Their unique explicit tags remain retrievable.

## Intersections

Intersection types (`A & B`) represent a logical "AND". 

```ts
const a = Schema.union([Schema.number(), Schema.string()]);
const b = Schema.union([Schema.number(), Schema.boolean()]);
const c = Schema.intersection(a, b);

type c = Schema.infer<typeof c>; // => number
```

This can be useful for intersecting two object types. 

```ts
const Person = Schema.object({ name: Schema.string() });
type Person = Schema.infer<typeof Person>;

const Employee = Schema.object({ role: Schema.string() });
type Employee = Schema.infer<typeof Employee>;

const EmployedPerson = Schema.intersection(Person, Employee);
type EmployedPerson = Schema.infer<typeof EmployedPerson>;
// Person & Employee
```

<Callout type="warn">
  When merging object schemas, prefer [`A.extend(B)`](#extend) over intersections. Using `.extend()` will give you a new object schema, whereas `Schema.intersection(A, B)` returns a `SchemaIntersection` instance which lacks common object methods like `pick` and `omit`.
</Callout>

## Records

Record schemas are used to validate types such as `Record<string, string>`.

### `Schema.record`

```ts
const IdCache = Schema.record(Schema.string(), Schema.string());
type IdCache = Schema.infer<typeof IdCache>; // Record<string, string>

IdCache.parse({
  carlotta: "77d2586b-9e8e-4ecf-8b21-ea7e0530eadd",
  jimmie: "77d2586b-9e8e-4ecf-8b21-ea7e0530eadd",
});
```

The key schema can be any Schema schema that is assignable to `string | number | symbol`.

```ts
const Keys = Schema.union([Schema.string(), Schema.number(), Schema.symbol()]);
const AnyObject = Schema.record(Keys, Schema.unknown());
// Record<string | number | symbol, unknown>
```

To create an object schemas containing keys defined by an enum:

```ts
const Keys = Schema.enum(["id", "name", "email"]);
const Person = Schema.record(Keys, Schema.string());
// { id: string; name: string; email: string }
```

Schema supports numeric keys inside records in a way that closely mirrors TypeScript itself. A `number` schema, when used as a record key, will validate that the key is a valid "numeric string". Additional numerical constraints (min, max, step, etc.) will also be validated.

```ts
const numberKeys = Schema.record(Schema.number(), Schema.string());
numberKeys.parse({ 
  1: "one", // ✅
  2: "two", // ✅
  "1.5": "one", // ✅
  "-3": "two", // ✅
  abc: "one" // ❌
});

// further validation is also supported
const intKeys = Schema.record(Schema.int().step(1).min(0).max(10), Schema.string());
intKeys.parse({ 
  0: "zero", // ✅
  1: "one", // ✅
  2: "two", // ✅
  12: "twelve", // ❌
  abc: "one" // ❌
});
```

A value schema that can stand in for an absent key — `.default()`, `.prefault()`, `.optional()` — makes that key optional on the input side, the same as it does inside `Schema.object()`:

```ts
const Person = Schema.record(Schema.enum(["id", "name"]), Schema.string().default(""));

type Input = Schema.input<typeof Person>; // { id?: string; name?: string }
type Output = Schema.output<typeof Person>; // { id: string; name: string }
```

### `Schema.partialRecord`


<Callout>
  If you pass a `Schema.enum` as the first argument to `Schema.record()`, Schema will exhaustively check that all enum values exist in the input as keys. This behavior agrees with TypeScript:

  ```ts
  type MyRecord = Record<"a" | "b", string>;
  const myRecord: MyRecord = { a: "foo", b: "bar" }; // ✅
  const myRecord: MyRecord = { a: "foo" }; // ❌ missing required key `b`
  ```

  For partial key sets, use `Schema.partialRecord()`.

</Callout>

If you want a *partial* record type, use `Schema.partialRecord()`. This skips the special exhaustiveness checks Schema normally runs with `Schema.enum()` and `Schema.literal()` key schemas.

```ts
const Keys = Schema.enum(["id", "name", "email"]).or(Schema.never()); 
const Person = Schema.partialRecord(Keys, Schema.string());
// { id?: string; name?: string; email?: string }
```

### `Schema.looseRecord`

By default, `Schema.record()` errors on keys that don't match the key Schema. Use `Schema.looseRecord()` to pass through non-matching keys unchanged. This is particularly useful when combined with intersections to model multiple pattern properties:

```ts
const schema = z
  .object({ name: Schema.string() })
  .and(Schema.looseRecord(Schema.string().regex(/_phone$/), Schema.e164()));

type schema = Schema.infer<typeof schema>;
// => { name: string } & Record<string, string>

Schema.parse({ 
  name: "John",
  home_phone: "+12345678900",     // validated as phone number
  work_phone: "+12345678900",     // validated as phone number
});
```


## Maps

```ts
const StringNumberMap = Schema.map(Schema.string(), Schema.number());
type StringNumberMap = Schema.infer<typeof StringNumberMap>; // Map<string, number>

const myMap: StringNumberMap = new Map();
myMap.set("one", 1);
myMap.set("two", 2);

StringNumberMap.parse(myMap);
```

Map schemas can be further constrained with the following utility methods.

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
Schema.map(Schema.string(), Schema.number()).nonempty(); // must contain at least 1 item
Schema.map(Schema.string(), Schema.number()).min(5); // must contain 5 or more items
Schema.map(Schema.string(), Schema.number()).max(5); // must contain 5 or fewer items
Schema.map(Schema.string(), Schema.number()).size(5); // must contain 5 items exactly
```
</Tab>
<Tab value='Schema Mini'>
```ts
Schema.map(Schema.string(), Schema.number()).check(Schema.minSize(1)); // alias for .nonempty()
Schema.map(Schema.string(), Schema.number()).check(Schema.minSize(5)); // must contain 5 or more items
Schema.map(Schema.string(), Schema.number()).check(Schema.maxSize(5)); // must contain 5 or fewer items
Schema.map(Schema.string(), Schema.number()).check(Schema.size(5)); // must contain 5 items exactly
```
</Tab>
</Tabs>

## Sets

```ts
const NumberSet = Schema.set(Schema.number());
type NumberSet = Schema.infer<typeof NumberSet>; // Set<number>

const mySet: NumberSet = new Set();
mySet.add(1);
mySet.add(2);
NumberSet.parse(mySet);
```

Set schemas can be further constrained with the following utility methods.

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
Schema.set(Schema.string()).nonempty(); // must contain at least 1 item
Schema.set(Schema.string()).min(5); // must contain 5 or more items
Schema.set(Schema.string()).max(5); // must contain 5 or fewer items
Schema.set(Schema.string()).size(5); // must contain 5 items exactly
```
</Tab>
<Tab value='Schema Mini'>
```ts
Schema.set(Schema.string()).check(Schema.minSize(1)); // alias for .nonempty()
Schema.set(Schema.string()).check(Schema.minSize(5)); // must contain 5 or more items
Schema.set(Schema.string()).check(Schema.maxSize(5)); // must contain 5 or fewer items
Schema.set(Schema.string()).check(Schema.size(5)); // must contain 5 items exactly
```
</Tab>
</Tabs>

## Files

To validate `File` instances:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const fileSchema = Schema.file();

fileSchema.min(10_000); // minimum .size (bytes)
fileSchema.max(1_000_000); // maximum .size (bytes)
fileSchema.mime("image/png"); // MIME type
fileSchema.mime(["image/png", "image/jpeg"]); // multiple MIME types
```

</Tab>
<Tab value='Schema Mini'>
```ts
const fileSchema = Schema.file();

fileSchema.check(Schema.minSize(10_000)); // minimum .size (bytes)
fileSchema.check(Schema.maxSize(1_000_000)); // maximum .size (bytes)
fileSchema.check(Schema.mime("image/png")); // MIME type
fileSchema.check(Schema.mime(["image/png", "image/jpeg"])); // multiple MIME types
```
</Tab>
</Tabs>

## Promises

<Callout type="warn">
  **Deprecated** — `Schema.promise()` is deprecated. There are vanishingly few valid uses cases for a `Promise` Schema. If you suspect a value might be a `Promise`, simply `await` it before parsing it with Schema.
</Callout>

<Accordions type="single"><Accordion title="See Schema.promise() documentation">

```ts
const numberPromise = Schema.promise(Schema.number());
```

"Parsing" works a little differently with promise schemas. Validation happens in two parts:

1. Schema synchronously checks that the input is an instance of Promise (i.e. an object with `.then` and `.catch` methods.).
2. Schema uses `.then` to attach an additional validation step onto the existing Promise. You'll have to use `.catch` on the returned Promise to handle validation failures.

```ts
numberPromise.parse("tuna");
// SchemaError: Non-Promise type: string

numberPromise.parse(Promise.resolve("tuna"));
// => Promise<number>

const test = async () => {
  await numberPromise.parse(Promise.resolve("tuna"));
  // SchemaError: Non-number type: string

  await numberPromise.parse(Promise.resolve(3.14));
  // => 3.14
};
```

</Accordion></Accordions>

## Instanceof

You can use `Schema.instanceof` to check that the input is an instance of a class. This is useful to validate inputs against classes that are exported from third-party libraries.

```ts
class Test {
  name: string;
}

const TestSchema = Schema.instanceof(Test);

TestSchema.parse(new Test()); // ✅
TestSchema.parse("whatever"); // ❌
```

This works with built-in classes too.

```ts
Schema.instanceof(RegExp);
Schema.instanceof(URL);
Schema.instanceof(Error);
```

Parsing returns the exact object that was passed in. Unlike `Schema.object()`, nothing is cloned, so the prototype, the unlisted properties, and the object identity all survive.

```ts
const url = new URL("https://example.com");

Schema.instanceof(URL).parse(url) === url; // true
```

### `Schema.property()` [#property]

To validate a particular property of a class instance against a Schema schema:

```ts
const blobSchema = Schema.instanceof(URL).check(
  Schema.property("protocol", Schema.literal("https:", "Only HTTPS allowed"))
);

blobSchema.parse(new URL("https://example.com")); // ✅
blobSchema.parse(new URL("http://example.com")); // ❌
```

The `Schema.property()` API works with any data type (but it's most useful when used in conjunction with `Schema.instanceof()`).

```ts
const blobSchema = Schema.string().check(
  Schema.property("length", Schema.number().min(10))
);

blobSchema.parse("hello there!"); // ✅
blobSchema.parse("hello."); // ❌
```

### `Schema.properties()` [#properties]

To check several properties at once:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const okResponse = Schema.instanceof(Response).check(
  ...Schema.properties({
    status: Schema.number().min(200).max(299),
    redirected: Schema.literal(false),
  })
);

okResponse.parse(new Response("ok")); // ✅
okResponse.parse(new Response("", { status: 404 })); // ❌ status
```
</Tab>
<Tab value="Schema Mini">
```ts
const okResponse = Schema.instanceof(Response).check(
  ...Schema.properties({
    status: Schema.number().check(Schema.minimum(200), Schema.maximum(299)),
    redirected: Schema.literal(false),
  })
);

okResponse.parse(new Response("ok")); // ✅
okResponse.parse(new Response("", { status: 404 })); // ❌ status
```
</Tab>
</Tabs>

Each property is asserted in place. The schemas in the shape are validated but their results are discarded, so a transform or a default never changes the parsed value.

In Schema, `Schema.instanceof()` also has a `.properties()` method. It spreads the same check and narrows the inferred type:

```ts
const okResponse = Schema.instanceof(Response).properties({
  status: Schema.number().min(200).max(299),
  redirected: Schema.literal(false),
});

type OkResponse = Schema.infer<typeof okResponse>;
// => Response & { status: number; redirected: false }
```

## Refinements

Every Schema schema stores an array of *refinements*. Refinements are a way to perform custom validation that Schema doesn't provide a native API for.

### `.refine()`

{/* <Callout>
  Checks do not (in fact, cannot) change the inferred type of the Schema.
</Callout>

### `.refine()` */}

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const myString = Schema.string().refine((val) => val.length <= 255);
```
</Tab>
<Tab value="Schema Mini">
```ts
const myString = Schema.string().check(Schema.refine((val) => val.length <= 255));
```
</Tab>
</Tabs>

<Callout type="warn">
  Refinement functions should never throw. Instead they should return a falsy value to signal failure. Thrown errors are not caught by Schema.
</Callout>

#### `error` 

To customize the error message:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const myString = Schema.string().refine((val) => val.length > 8, { 
  error: "Too short!" 
});
```
</Tab>
<Tab value="Schema Mini">
```ts
const myString = Schema.string().check(
  Schema.refine((val) => val.length > 8, { error: "Too short!" })
);
```
</Tab>
</Tabs>

The `error` option also accepts a function that receives the issue:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const myString = Schema.string().refine((val) => val.length > 8, {
  error: (iss) => `Too short: "${iss.input}"`
});

myString.parse("OH NO"); // ❌ Too short: "OH NO"
```
</Tab>
<Tab value="Schema Mini">
```ts
const myString = Schema.string().check(
  Schema.refine((val) => val.length > 8, { error: (iss) => `Too short: "${iss.input}"` })
);

Schema.parse(myString, "OH NO"); // ❌ Too short: "OH NO"
```
</Tab>
</Tabs>

#### `abort` 

By default, validation issues from checks are considered *continuable*; that is, Schema will execute *all* checks in sequence, even if one of them causes a validation error. This is usually desirable, as it means Schema can surface as many errors as possible in one go.

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const myString = Schema.string()
  .refine((val) => val.length > 8, { error: "Too short!" })
  .refine((val) => val === val.toLowerCase(), { error: "Must be lowercase" });
  

const result = myString.safeParse("OH NO");
result.error?.issues;
/* [
  { "code": "custom", "message": "Too short!" },
  { "code": "custom", "message": "Must be lowercase" }
] */
```
</Tab>
<Tab value="Schema Mini">
```ts
const myString = Schema.string().check(
  Schema.refine((val) => val.length > 8, { error: "Too short!" }),
  Schema.refine((val) => val === val.toLowerCase(), { error: "Must be lowercase" })
);

const result = Schema.safeParse(myString, "OH NO");
result.error?.issues;
/* [
  { "code": "custom", "message": "Too short!" },
  { "code": "custom", "message": "Must be lowercase" }
] */
```
</Tab>
</Tabs>


To mark a particular refinement as *non-continuable*, use the `abort` parameter. Validation will terminate if the check fails.

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const myString = Schema.string()
  .refine((val) => val.length > 8, { error: "Too short!", abort: true })
  .refine((val) => val === val.toLowerCase(), { error: "Must be lowercase", abort: true });


const result = myString.safeParse("OH NO");
result.error?.issues;
// => [{ "code": "custom", "message": "Too short!" }]
```
</Tab>
<Tab value="Schema Mini">
```ts
const myString = Schema.string().check(
  Schema.refine((val) => val.length > 8, { error: "Too short!", abort: true }),
  Schema.refine((val) => val === val.toLowerCase(), { error: "Must be lowercase", abort: true })
);

const result = Schema.safeParse(myString, "OH NO");
result.error?.issues;
// [ { "code": "custom", "message": "Too short!" }]
```
</Tab>
</Tabs>

#### `path`

To customize the error path, use the `path` parameter. This is typically only useful in the context of object schemas.

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const passwordForm = z
  .object({
    password: Schema.string(),
    confirm: Schema.string(),
  })
  .refine((data) => data.password === data.confirm, {
    error: "Passwords don't match",
    path: ["confirm"], // path of error
  });
```
</Tab>
<Tab value="Schema Mini">
```ts
const passwordForm = z
  .object({
    password: Schema.string(),
    confirm: Schema.string(),
  })
  .check(Schema.refine((data) => data.password === data.confirm, {
    error: "Passwords don't match",
    path: ["confirm"], // path of error
  }));
```
</Tab>
</Tabs>


This will set the `path` parameter in the associated issue:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const result = passwordForm.safeParse({ password: "asdf", confirm: "qwer" });
result.error.issues;
/* [{
  "code": "custom",
  "path": [ "confirm" ],
  "message": "Passwords don't match"
}] */
```
</Tab>
<Tab value="Schema Mini">
```ts
const result = Schema.safeParse(passwordForm, { password: "asdf", confirm: "qwer" });
result.error.issues;
/* [{
  "code": "custom",
  "path": [ "confirm" ],
  "message": "Passwords don't match"
}] */
```
</Tab>
</Tabs>

To define an asynchronous refinement, just pass an `async` function:

```ts
const userId = Schema.string().refine(async (id) => {
  // verify that ID exists in database
  return true;
});
```

<Callout>
  If you use async refinements, you must use the `.parseAsync` method to parse data! Otherwise Schema will throw an error.

  <Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
  <Tab value="Schema">
  ```ts
  const result = await userId.parseAsync("abc123");
  ```
  </Tab>
  <Tab value="Schema Mini">
  ```ts
  const result = await Schema.parseAsync(userId, "abc123");
  ```
  </Tab>
  </Tabs>
</Callout>

#### `when`

> **Note** — This is a power user feature and can absolutely be abused in ways that will increase the probability of uncaught errors originating from inside your refinements. 

By default, refinements don't run if any *non-continuable* issues have already been encountered. Schema is careful to ensure the type signature of the value is correct before passing it into any refinement functions.

```ts
const schema = Schema.string().refine((val) => {
  return val.length > 8
});

Schema.parse(1234); // invalid_type: refinement won't be executed
```

In some cases, you want finer control over when refinements run. For instance consider this "password confirm" check:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const schema = z
  .object({
    password: Schema.string().min(8),
    confirmPassword: Schema.string(),
    anotherField: Schema.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

Schema.parse({
  password: "asdf",
  confirmPassword: "asdf",
  anotherField: 1234 // ❌ this error will prevent the password check from running
});
```
</Tab>
<Tab value="Schema Mini">
```ts
const schema = z
  .object({
    password: Schema.string().check(Schema.minLength(8)),
    confirmPassword: Schema.string(),
    anotherField: Schema.string(),
  })
  .check(Schema.refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }));

Schema.parse({
  password: "asdf",
  confirmPassword: "asdf",
  anotherField: 1234 // ❌ this error will prevent the password check from running
});
```
</Tab>
</Tabs>

An error on `anotherField` will prevent the password confirmation check from executing, even though the check doesn't depend on `anotherField`. To control when a refinement will run, use the `when` parameter:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const baseSchema = Schema.object({
  password: Schema.string().min(8),
  confirmPassword: Schema.string(),
  anotherField: Schema.string(),
});

const schema = baseSchema
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],

    // run if password & confirmPassword are valid
    when(payload) { // [!code ++]
      return baseSchema // [!code ++]
        .pick({ password: true, confirmPassword: true }) // [!code ++]
        .safeParse(payload.value).success; // [!code ++]
    },  // [!code ++]
  });

Schema.parse({
  password: "asdf",
  confirmPassword: "asdf",
  anotherField: 1234 // ❌ this error will not prevent the password check from running
});
```
</Tab>
<Tab value="Schema Mini">
```ts
const schema = z
  .object({
    password: Schema.string().min(8),
    confirmPassword: Schema.string(),
    anotherField: Schema.string(),
  })
  .check(Schema.refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],

    when(payload) { // [!code ++]
      // no issues with `password` or `confirmPassword` // [!code ++]
      return payload.issues.every((iss) => { // [!code ++]
        const firstPathEl = iss.path?.[0]; // [!code ++]
        return firstPathEl !== "password" && firstPathEl !== "confirmPassword"; // [!code ++]
      }); // [!code ++]
    },  // [!code ++]
  }));

Schema.parse({
  password: "asdf",
  confirmPassword: "asdf",
  anotherField: 1234 // ❌ this error will prevent the password check from running
});
```
</Tab>
</Tabs>


### `.superRefine()`
    

The regular `.refine` API only generates a single issue with a `"custom"` error code, but `.superRefine()` makes it possible to create multiple issues using any of Schema's [internal issue types](https://github.com/colinhacks/schema/blob/main/packages/schema/src/v4/core/errors.ts).

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const UniqueStringArray = Schema.array(Schema.string()).superRefine((val, ctx) => {
  if (val.length > 3) {
    ctx.addIssue({
      code: "too_big",
      maximum: 3,
      origin: "array",
      inclusive: true,
      message: "Too many items 😡",
      input: val,
    });
  }

  if (val.length !== new Set(val).size) {
    ctx.addIssue({
      code: "custom",
      message: `No duplicates allowed.`,
      input: val,
    });
  }
});


```
</Tab>
<Tab value="Schema Mini">
```ts
const UniqueStringArray = Schema.array(Schema.string()).check(
  Schema.superRefine((val, ctx) => {
    if (val.length > 3) {
      ctx.addIssue({
        code: "too_big",
        maximum: 3,
        origin: "array",
        inclusive: true,
        message: "Too many items 😡",
        input: val,
      });
    }

    if (val.length !== new Set(val).size) {
      ctx.addIssue({
        code: "custom",
        message: `No duplicates allowed.`,
        input: val,
      });
    }
  })
);
```
</Tab>
</Tabs>

### `.check()`

<Callout>
**Note** — The `.check()` API is a more low-level API that's generally more complex than `.superRefine()`. It can be faster in performance-sensitive code paths, but it's also more verbose.
</Callout>

<Accordions>
<Accordion title="View example">
The `.refine()` API is syntactic sugar atop a more versatile (and verbose) API called `.check()`. You can use this API to create multiple issues in a single refinement or have full control of the generated issue objects.

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const UniqueStringArray = Schema.array(Schema.string()).check((ctx) => {
  if (ctx.value.length > 3) {
    // full control of issue objects
    ctx.issues.push({
      code: "too_big",
      maximum: 3,
      origin: "array",
      inclusive: true,
      message: "Too many items 😡",
      input: ctx.value
    });
  }

  // create multiple issues in one refinement
  if (ctx.value.length !== new Set(ctx.value).size) {
    ctx.issues.push({
      code: "custom",
      message: `No duplicates allowed.`,
      input: ctx.value,
      continue: true // make this issue continuable (default: false)
    });
  }
});
```
</Tab>
<Tab value="Schema Mini">
```ts
const UniqueStringArray = Schema.array(Schema.string()).check((ctx) => {
  // full control of issue objects
  if (ctx.value.length > 3) {
    ctx.issues.push({
      code: "too_big",
      maximum: 3,
      origin: "array",
      inclusive: true,
      message: "Too many items 😡",
      input: ctx.value
    });
  }

// create multiple issues in one refinement
  if (ctx.value.length !== new Set(ctx.value).size) {
    ctx.issues.push({
      code: "custom",
      message: `No duplicates allowed.`,
      input: ctx.value,
      continue: true // make this issue continuable (default: false)
    });
  }
});
```
</Tab>
</Tabs>
</Accordion>
</Accordions>

## Codecs

> Introduced in `schema@4.1`. Refer to the dedicated [Codecs](/codecs) page for more information.

Codecs are a special kind of schema that implement *bidirectional transformations* between two other schemas.

```ts
const stringToDate = Schema.codec(
  Schema.iso.datetime(),  // input schema: ISO date string
  Schema.date(),          // output schema: Date object
  {
    decode: (isoString) => new Date(isoString), // ISO string → Date
    encode: (date) => date.toISOString(),       // Date → ISO string
  }
);
```

A regular `.parse()` operations performs the *forward transform*. It calls the codec's `decode` function.

```ts
stringToDate.parse("2024-01-15T10:30:00.000Z"); // => Date
```

You can alternatively use the top-level `Schema.decode()` function. Unlike `.parse()` (which accepts `unknown` input), `Schema.decode()` expects a strongly-typed input (`string` in this example).

```ts
Schema.decode(stringToDate, "2024-01-15T10:30:00.000Z"); // => Date
```

To perform the *reverse transform*, use the inverse: `Schema.encode()`.

```ts
Schema.encode(stringToDate, new Date("2024-01-15")); // => "2024-01-15T00:00:00.000Z"
```

Use `Schema.invertCodec()` to derive a new codec with the input and output schemas swapped.

```ts
const dateToString = Schema.invertCodec(stringToDate);

Schema.decode(dateToString, new Date("2024-01-15")); // => string
Schema.encode(dateToString, "2024-01-15T00:00:00.000Z"); // => Date
```

Refer to the dedicated [Codecs](/codecs) page for more information. That page contains implementations for commonly-needed codecs that you can copy/paste into your project:

- [**`stringToNumber`**](/codecs#stringtonumber)
- [**`stringToInt`**](/codecs#stringtoint)
- [**`stringToBigInt`**](/codecs#stringtobigint)
- [**`numberToBigInt`**](/codecs#numbertobigint)
- [**`isoDatetimeToDate`**](/codecs#isodatetimetodate)
- [**`epochSecondsToDate`**](/codecs#epochsecondstodate)
- [**`epochMillisToDate`**](/codecs#epochmillistodate)
- [**`jsonCodec`**](/codecs#jsoncodec)
- [**`utf8ToBytes`**](/codecs#utf8tobytes)
- [**`bytesToUtf8`**](/codecs#bytestoutf8)
- [**`base64ToBytes`**](/codecs#base64tobytes)
- [**`base64urlToBytes`**](/codecs#base64urltobytes)
- [**`hexToBytes`**](/codecs#hextobytes)
- [**`stringToURL`**](/codecs#stringtourl)
- [**`stringToHttpURL`**](/codecs#stringtohttpurl)
- [**`uriComponent`**](/codecs#uricomponent)
- [**`stringToBoolean`**](/codecs#stringtoboolean)

## Pipes

Schemas can be chained together into "pipes". Pipes are primarily useful when used in conjunction with [Transforms](#transforms).

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const stringToLength = Schema.string().pipe(Schema.transform(val => val.length));

stringToLength.parse("hello"); // => 5
```
</Tab>
<Tab value="Schema Mini">
```ts
const stringToLength = Schema.pipe(Schema.string(), Schema.transform(val => val.length));

Schema.parse(stringToLength, "hello"); // => 5
```
</Tab>
</Tabs>

### `Schema.input()` and `Schema.output()` [#input-output]

Runtime counterparts to the type-level `Schema.input<T>` / `Schema.output<T>`: they replace every pipe in a schema with its input or output side. Useful for reaching [codecs](/codecs) nested inside objects, records, or maps, where `.in` / `.out` can't.

```ts
const Event = Schema.object({ name: Schema.string(), at: stringToDate });

Schema.input(Event).parse({ name: "launch", at: "2024-01-01T00:00:00Z" }); // ✅
Schema.output(Event).parse({ name: "launch", at: new Date() });            // ✅
```

Only codecs have two real sides. `Schema.output()` on a one-way [transform](#transforms) returns the transform, which validates nothing; `Schema.input()` on a `Schema.preprocess()` returns the schema the preprocessor feeds.

A wrapper's stored value survives only on the side it belongs to, so with a codec underneath, `Schema.input()` drops a `.default()` or `.catch()` and `Schema.output()` drops a `.prefault()`.

## Transforms

> **Note** — For bi-directional transforms, use [codecs](/codecs).

Transforms are a special kind of schema that perform a unidirectional transformation. Instead of validating input, they accept anything and perform some transformation on the data. To define a transform:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const castToString = Schema.transform((val) => String(val));

castToString.parse("asdf"); // => "asdf"
castToString.parse(123); // => "123"
castToString.parse(true); // => "true"
```
</Tab>
<Tab value="Schema Mini">
```ts
const castToString = Schema.transform((val) => String(val));

Schema.parse(castToString, "asdf"); // => "asdf"
Schema.parse(castToString, 123); // => "123"
Schema.parse(castToString, true); // => "true"
```
</Tab>
</Tabs>

<Callout type="warn">
  Transform functions should never throw. Thrown errors are not caught by Schema.
</Callout>

{/* The output type of the schema is inferred from the transform function:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const castToString = Schema.transform((val) => String(val));

type CastToString = Schema.infer<typeof castToString>; // string
```
</Tab>
<Tab value="Schema Mini">
```ts
const castToString = Schema.transform((val) => String(val));

type CastToString = Schema.infer<typeof castToString>; // string
```
</Tab>
</Tabs> */}


To perform validation logic inside a transform, use `ctx`. To report a validation issue, push a new issue onto `ctx.issues` (similar to the [`.check()`](#check) API).

```ts
const coercedInt = Schema.transform((val, ctx) => {
  try {
    const parsed = Number.parseInt(String(val));
    return parsed;
  } catch (e) {
    ctx.issues.push({
      code: "custom",
      message: "Not a number",
      input: val,
    });

    // this is a special constant with type `never`
    // returning it lets you exit the transform without impacting the inferred return type
    return Schema.NEVER;
  }
});
```

Most commonly, transforms are used in conjunction with [Pipes](#pipes). This combination is useful for performing some initial validation, then transforming the parsed data into another form.


<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const stringToLength = Schema.string().pipe(Schema.transform(val => val.length));

stringToLength.parse("hello"); // => 5
```
</Tab>
<Tab value="Schema Mini">
```ts
const stringToLength = Schema.pipe(Schema.string(), Schema.transform(val => val.length));

Schema.parse(stringToLength, "hello"); // => 5
```
</Tab>
</Tabs>

### `.transform()`

Piping some schema into a transform is a common pattern, so Schema provides a convenience `.transform()` method.

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const stringToLength = Schema.string().transform(val => val.length); 
```
</Tab>
<Tab value="Schema Mini">
```ts
// no equivalent
```
</Tab>
</Tabs>

Transforms can also be async:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const idToUser = z
  .string()
  .transform(async (id) => {
    // fetch user from database
    return db.getUserById(id); 
  });

const user = await idToUser.parseAsync("abc123");
```
</Tab>
<Tab value="Schema Mini">
```ts
const idToUser = Schema.pipe(
  Schema.string(),
  Schema.transform(async (id) => {
    // fetch user from database
    return db.getUserById(id); 
  }));

const user = await idToUser.parse("abc123");
```
</Tab>
</Tabs>

<Callout>
  If you use async transforms, you must use a `.parseAsync` or `.safeParseAsync` when parsing data! Otherwise Schema will throw an error.
</Callout>

### `.preprocess()` 

Piping a transform into another schema is another common pattern, so Schema provides a convenience `Schema.preprocess()` function.

```ts
const coercedInt = Schema.preprocess((val) => {
  if (typeof val === "string") {
    return Number.parseInt(val);
  }
  return val;
}, Schema.int());
```

By default, the input type of a `Schema.preprocess()` schema is `unknown`, since the preprocessor is expected to handle arbitrary input. To narrow the input type, annotate the preprocessor's parameter directly:

```ts
const trimmed = Schema.preprocess(
  (val: string | null | undefined) => val?.trim() ?? "",
  Schema.string()
);

type Input = Schema.input<typeof trimmed>;  // string | null | undefined
type Output = Schema.output<typeof trimmed>; // string
```

This is useful when integrating with libraries like `react-hook-form` that derive their form value type from `Schema.input<>`.

## Defaults

To set a default value for a schema:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const defaultTuna = Schema.string().default("tuna");

defaultTuna.parse(undefined); // => "tuna"
```
</Tab>
<Tab value="Schema Mini">
```ts
const defaultTuna = Schema._default(Schema.string(), "tuna");

defaultTuna.parse(undefined); // => "tuna"
```
</Tab>
</Tabs>

Alternatively, you can pass a function which will be re-executed whenever a default value needs to be generated:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const randomDefault = Schema.number().default(Math.random);

randomDefault.parse(undefined);    // => 0.4413456736055323
randomDefault.parse(undefined);    // => 0.1871840107401901
randomDefault.parse(undefined);    // => 0.7223408162401552
```
</Tab>
<Tab value="Schema Mini">
```ts
const randomDefault = Schema._default(Schema.number(), Math.random);

Schema.parse(randomDefault, undefined); // => 0.4413456736055323
Schema.parse(randomDefault, undefined); // => 0.1871840107401901
Schema.parse(randomDefault, undefined); // => 0.7223408162401552
```
</Tab>
</Tabs>


## Prefaults

In Schema, setting a *default* value will short-circuit the parsing process. If the input is `undefined`, the default value is eagerly returned. As such, the default value must be assignable to the *output type* of the Schema.

```ts
const schema = Schema.string().transform(val => val.length).default(0);
Schema.parse(undefined); // => 0
```

Sometimes, it's useful to define a *prefault* ("pre-parse default") value. If the input is `undefined`, the prefault value will be parsed instead. The parsing process is *not* short circuited. As such, the prefault value must be assignable to the *input type* of the Schema.

```ts
const schema = Schema.string().transform(val => val.length).prefault("tuna");
Schema.parse(undefined); // => 4
```

This is also useful if you want to pass some input value through some mutating refinements.

```ts
const a = Schema.string().trim().toUpperCase().prefault("  tuna  ");
a.parse(undefined); // => "TUNA"

const b = Schema.string().trim().toUpperCase().default("  tuna  ");
b.parse(undefined); // => "  tuna  "
```

## Catch

Use `.catch()` to define a fallback value to be returned in the event of a validation error:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const numberWithCatch = Schema.number().catch(42);

numberWithCatch.parse(5); // => 5
numberWithCatch.parse("tuna"); // => 42
```
</Tab>
<Tab value="Schema Mini">
```ts
const numberWithCatch = Schema.catch(Schema.number(), 42);

numberWithCatch.parse(5); // => 5
numberWithCatch.parse("tuna"); // => 42
```
</Tab>
</Tabs>


Alternatively, you can pass a function which will be re-executed whenever a catch value needs to be generated.

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const numberWithRandomCatch = Schema.number().catch((ctx) => {
  ctx.error; // the caught SchemaError

  return Math.random();
});

numberWithRandomCatch.parse("sup"); // => 0.4413456736055323
numberWithRandomCatch.parse("sup"); // => 0.1871840107401901
numberWithRandomCatch.parse("sup"); // => 0.7223408162401552
```
</Tab>
<Tab value="Schema Mini">
```ts
const numberWithRandomCatch = Schema.catch(Schema.number(), (ctx) => {
  ctx.value;   // the input value
  ctx.issues;  // the caught validation issue
  return Math.random();
});

Schema.parse(numberWithRandomCatch, "sup"); // => 0.4413456736055323
Schema.parse(numberWithRandomCatch, "sup"); // => 0.1871840107401901
Schema.parse(numberWithRandomCatch, "sup"); // => 0.7223408162401552
```
</Tab>
</Tabs>

## Branded types

TypeScript's type system is [structural](https://www.typescriptlang.org/docs/handbook/type-compatibility.html), meaning that two types that are structurally equivalent are considered the same.

```ts
type Cat = { name: string };
type Dog = { name: string };

const pluto: Dog = { name: "pluto" };
const simba: Cat = pluto; // works fine
```

In some cases, it can be desirable to simulate [nominal typing](https://en.wikipedia.org/wiki/Nominal_type_system) inside TypeScript. This can be achieved with *branded types* (also known as "opaque types").

```ts
const Cat = Schema.object({ name: Schema.string() }).brand<"Cat">();
const Dog = Schema.object({ name: Schema.string() }).brand<"Dog">();

type Cat = Schema.infer<typeof Cat>; // { name: string } & Schema.$brand<"Cat">
type Dog = Schema.infer<typeof Dog>; // { name: string } & Schema.$brand<"Dog">

const pluto = Dog.parse({ name: "pluto" });
const simba: Cat = pluto; // ❌ not allowed
```

Under the hood, this works by attaching a "brand" to the schema's inferred type.

```ts
const Cat = Schema.object({ name: Schema.string() }).brand<"Cat">();
type Cat = Schema.output<typeof Cat>; // { name: string } & Schema.$brand<"Cat">
```

With this brand, plain (unbranded) data structures are not assignable to the inferred type. You have to parse some data with the schema to get branded data.

> Note that branded types do not affect the runtime result of `.parse`. It is a static-only construct.

By default, only the *output type* is branded. 

```ts
const USD = Schema.string().brand<"USD">();

type USDOutput = Schema.output<typeof USD>; // string & Schema.$brand<"USD">
type USDInput = Schema.input<typeof USD>; // string
```

To customize this, pass a second generic to `.brand()` to specify the direction of the brand.

```ts
// requires Schema 4.2+
Schema.string().brand<"Cat", "out">(); // output is branded (default)
Schema.string().brand<"Cat", "in">(); // input is branded
Schema.string().brand<"Cat", "inout">(); // both are branded
```

## Readonly

To mark a schema as readonly:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const ReadonlyUser = Schema.object({ name: Schema.string() }).readonly();
type ReadonlyUser = Schema.infer<typeof ReadonlyUser>;
// Readonly<{ name: string }>
```
</Tab>
<Tab value="Schema Mini">
```ts
const ReadonlyUser = Schema.readonly(Schema.object({ name: Schema.string() }));
type ReadonlyUser = Schema.infer<typeof ReadonlyUser>;
// Readonly<{ name: string }>
```
</Tab>
</Tabs>

The inferred type is marked as `readonly`. Note that in TypeScript, this only affects objects, arrays, tuples, `Set`, and `Map`:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
Schema.object({ name: Schema.string() }).readonly(); // { readonly name: string }
Schema.array(Schema.string()).readonly(); // readonly string[]
Schema.tuple([Schema.string(), Schema.number()]).readonly(); // readonly [string, number]
Schema.map(Schema.string(), Schema.date()).readonly(); // ReadonlyMap<string, Date>
Schema.set(Schema.string()).readonly(); // ReadonlySet<string>
```
</Tab>
<Tab value="Schema Mini">
```ts
Schema.readonly(Schema.object({ name: Schema.string() })); // { readonly name: string }
Schema.readonly(Schema.array(Schema.string())); // readonly string[]
Schema.readonly(Schema.tuple([Schema.string(), Schema.number()])); // readonly [string, number]
Schema.readonly(Schema.map(Schema.string(), Schema.date())); // ReadonlyMap<string, Date>
Schema.readonly(Schema.set(Schema.string())); // ReadonlySet<string>
```
</Tab>
</Tabs>

Inputs will be parsed like normal, then the result will be frozen with [`Object.freeze()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) to prevent modifications.

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const result = ReadonlyUser.parse({ name: "fido" });
result.name = "simba"; // throws TypeError
```
</Tab>
<Tab value="Schema Mini">
```ts
const result = Schema.parse(ReadonlyUser, { name: "fido" });
result.name = "simba"; // throws TypeError
```
</Tab>
</Tabs>

## JSON

To validate any JSON-encodable value:

```ts
const jsonSchema = Schema.json();
```

This is a convenience API that returns the following union schema:

```ts
const jsonSchema = Schema.lazy(() => {
  return Schema.union([
    Schema.string(params), 
    Schema.number(), 
    Schema.boolean(), 
    Schema.null(), 
    Schema.array(jsonSchema), 
    Schema.record(Schema.string(), jsonSchema)
  ]);
});
```



## Functions

Schema provides a `Schema.function()` utility for defining Schema-validated functions. This way, you can avoid intermixing validation code with your business logic.

```ts
const MyFunction = Schema.function({
  input: [Schema.string()], // parameters (must be an array or a SchemaTuple)
  output: Schema.number()  // return type
});

type MyFunction = Schema.infer<typeof MyFunction>;
// (input: string) => number
```

Function schemas have an `.implement()` method which accepts a function and returns a new function that automatically validates its inputs and outputs.

```ts
const computeTrimmedLength = MyFunction.implement((input) => {
  // TypeScript knows input is a string!
  return input.trim().length;
});

computeTrimmedLength("sandwich"); // => 8
computeTrimmedLength(" asdf "); // => 4
```

This function will throw a `SchemaError` if the input is invalid:

```ts
computeTrimmedLength(42); // throws SchemaError
```

If you only care about validating inputs, you can omit the `output` field.

```ts
const MyFunction = Schema.function({
  input: [Schema.string()], // parameters (must be an array or a SchemaTuple)
});

const computeTrimmedLength = MyFunction.implement((input) => input.trim.length);
```


Use the `.implementAsync()` method to create an async function.

```ts
const computeTrimmedLengthAsync = MyFunction.implementAsync(
  async (input) => input.trim().length
);

computeTrimmedLengthAsync("sandwich"); // => Promise<8>
```

## Custom

You can create a Schema schema for any TypeScript type by using `Schema.custom()`. This is useful for validating types from third-party libraries or any other type that isn't covered by a built-in Schema. For class instances, prefer [`Schema.instanceof()`](#instanceof); for template literal types, prefer [`Schema.templateLiteral()`](#template-literals).

```ts
import { Decimal } from "decimal.js";

const decimalSchema = Schema.custom<Decimal>((val) => Decimal.isDecimal(val));

decimalSchema.parse(new Decimal("1.5")); // passes
decimalSchema.parse("1.5");              // throws
```

If you don't provide a validation function, Schema will allow any value. This can be dangerous!

```ts
Schema.custom<{ arg: string }>(); // performs no validation
```

You can customize the error message and other options by passing a second argument. This parameter works the same way as the params parameter of [`.refine`](#refine).

```ts
Schema.custom<...>((val) => ..., "custom error message");
```

## Apply

Use `.apply()` to incorporate external functions into Schema's method chain:

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
function setCommonNumberChecks<T extends Schema.SchemaNumber>(schema: T) {
  return schema
    .min(0)
    .max(100);
}

const schema = Schema.number()
  .apply(setCommonNumberChecks)
  .nullable();

Schema.parse(0);  // => 0
Schema.parse(-1); // ❌ throws
Schema.parse(101); // ❌ throws
Schema.parse(null); // => null
```
</Tab>
<Tab value="Schema Mini">
```ts
function setCommonNumberChecks<T extends Schema.SchemaMiniNumber>(schema: T) {
  return Schema.check(
    Schema.minimum(0), Schema.maximum(100)
  );
}

const schema = Schema.nullable(
  Schema.number().apply(setCommonNumberChecks)
);

Schema.parse(schema, 0);   // => 0
Schema.parse(schema, -1);  // ❌ throws
Schema.parse(schema, 101); // ❌ throws
Schema.parse(schema, null); // => null
```
</Tab>
</Tabs>

Additional arguments are passed through to the function:

```ts
function withDefault<T extends Schema.SchemaType>(schema: T, value: Schema.output<T>) {
  return Schema.nullish().transform((val) => val ?? value);
}

const schema = Schema.string().apply(withDefault, "anonymous");

Schema.parse(undefined); // => "anonymous"
Schema.parse("sandwich"); // => "sandwich"
```

## Matching an existing type

Sometimes the type comes first: a database model, a type from a generated client, an interface you don't own. Pass it to `Schema.toSchema<T>()` and TypeScript checks that the schema's output type is exactly `T`.

```ts
type Player = {
  username: string;
  xp: number;
};

const Player = Schema.toSchema<Player>()(
  Schema.object({
    username: Schema.string(),
    xp: Schema.number(),
  })
);

Player.shape.username; // SchemaString — the schema is returned unchanged
```

The check is exact type equality, so any drift from the type is a compile error:

```ts
Schema.toSchema<Player>()(
  Schema.object({
    username: Schema.string(),
    xp: Schema.number(),
    admin: Schema.boolean(), // ❌ extra key
  })
);
```

The usual alternative is `satisfies Schema.SchemaType<Player>`, which only checks assignability. It catches a missing required key, but extra keys, omitted optional keys, and a bare `Schema.any()` all slip through:

```ts
Schema.object({
  username: Schema.string(),
  xp: Schema.number(),
  admin: Schema.boolean(),
}) satisfies Schema.SchemaType<Player>; // ✅ no error

Schema.any() satisfies Schema.SchemaType<Player>; // ✅ no error
```

An enum target matches `Schema.enum(...)`, and stays nominal — a plain literal union doesn't satisfy it:

```ts
enum Level {
  Noob = "noob",
  Pro = "pro",
}

Schema.toSchema<{ level: Level }>()(Schema.object({ level: Schema.enum(Level) })); // ✅
Schema.toSchema<{ level: Level }>()(Schema.object({ level: Schema.enum(["noob", "pro"]) })); // ❌
```



All Schema schemas can process inputs in both the forward and backward direction: 

- **Forward**: `Input` to `Output`
  - `.parse()`
  - `.decode()`
- **Backward**: `Output` to `Input`
  - `.encode()`

In most cases, this is a distinction without a difference. The input and output types are identical, so there's no difference between "forward" and "backward".

<Tabs groupId="lib" items={["Schema", "Schema Mini"]}>
<Tab value="Schema">
```ts
const schema = Schema.string();

type Input = Schema.input<typeof schema>;    // string
type Output = Schema.output<typeof schema>;  // string

Schema.parse("asdf");   // => "asdf"
Schema.decode("asdf");  // => "asdf"
Schema.encode("asdf");  // => "asdf"
```
</Tab>
<Tab value="Schema Mini">
```ts
const schema = Schema.string();

type Input = Schema.input<typeof schema>;    // string
type Output = Schema.output<typeof schema>;  // string

Schema.parse(schema, "asdf");   // => "asdf"
Schema.decode(schema, "asdf");  // => "asdf"
Schema.encode(schema, "asdf");  // => "asdf"
```
</Tab>
</Tabs>


However, some schema types cause the input and output types to diverge, notably `Schema.codec()`. Codecs are a special type of schema that defines a *bi-directional transformation* between two other schemas.

```ts
const stringToDate = Schema.codec(
  Schema.iso.datetime(),  // input schema: ISO date string
  Schema.date(),          // output schema: Date object
  {
    decode: (isoString) => new Date(isoString), // ISO string → Date
    encode: (date) => date.toISOString(),       // Date → ISO string
  }
);
```

In these cases, `Schema.decode()` and `Schema.encode()` behave quite differently.

<Tabs items={['Schema', 'Schema Mini']}>
<Tab value="Schema">
```ts
stringToDate.decode("2024-01-15T10:30:00.000Z")
// => Date

stringToDate.encode(new Date("2024-01-15T10:30:00.000Z"))
// => string
```
</Tab>
<Tab value="Schema Mini">
```ts
Schema.decode(stringToDate, "2024-01-15T10:30:00.000Z")
// => Date

Schema.encode(stringToDate, new Date("2024-01-15T10:30:00.000Z"))
// => string
```
</Tab>
</Tabs>

> **Note** —There's nothing special about the directions or terminology here. Instead of *encoding* with an `A -> B` codec, you could instead *decode* with a `B -> A` codec. The use of the terms "decode" and "encode" is just a convention.

This is particularly useful when parsing data at a network boundary. You can share a single Schema schema between your client and server, then use this single schema to convert between a network-friendly format (say, JSON) and a richer JavaScript representation.

<ThemedImage 
  lightSrc="/codecs/codecs-network-light.svg" 
  darkSrc="/codecs/codecs-network-dark.svg" 
  alt="Codecs encoding and decoding data across a network boundary" 
/>

### Inverting codecs

Use `Schema.invertCodec()` to derive the reverse codec from an existing one. The returned codec swaps the input and output schemas, then swaps the `decode` and `encode` transforms.

<Tabs items={['Schema', 'Schema Mini']}>
<Tab value="Schema">
```ts
const dateToString = Schema.invertCodec(stringToDate);

dateToString.decode(new Date("2024-01-15T10:30:00.000Z"));
// => string

dateToString.encode("2024-01-15T10:30:00.000Z");
// => Date
```
</Tab>
<Tab value="Schema Mini">
```ts
const dateToString = Schema.invertCodec(stringToDate);

Schema.decode(dateToString, new Date("2024-01-15T10:30:00.000Z"));
// => string

Schema.encode(dateToString, "2024-01-15T10:30:00.000Z");
// => Date
```
</Tab>
</Tabs>

`Schema.invertCodec()` only inverts the codec you pass to it. It does not recursively invert codecs nested inside another schema; invert those codecs where you define the reversed Schema.

### Composability

> **Note** — You can use `Schema.encode()` and `Schema.decode()` with any Schema. It doesn't have to be a SchemaCodec.

Codecs are a schema like any other. You can nest them inside objects, arrays, pipes, etc. There are no rules on where you can use them!

```ts
const payloadSchema = Schema.object({ 
  startDate: stringToDate 
});

payloadSchema.decode({
  startDate: "2024-01-15T10:30:00.000Z"
}); // => { startDate: Date }
```


### Type-safe inputs

While `.parse()` and `.decode()` behave identically at *runtime*, they have different type signatures. The `.parse()` method accepts `unknown` as input, and returns a value that matches the schema's inferred *output type*. By contrast, the `Schema.decode()` and `Schema.encode()` functions have *strongly-typed inputs*. 

```ts
stringToDate.parse(12345); 
// no complaints from TypeScript (fails at runtime)

stringToDate.decode(12345); 
// ❌ TypeScript error: Argument of type 'number' is not assignable to parameter of type 'string'.

stringToDate.encode(12345); 
// ❌ TypeScript error: Argument of type 'number' is not assignable to parameter of type 'Date'.
```

Why the difference? Encoding and decoding imply *transformation*. In many cases, the inputs to these methods are already strongly typed in application code, so Schema.decode/Schema.encode accept strongly typed inputs to surface mistakes at compile time.
Here's a diagram demonstrating the differences between the type signatures for `parse()`, `decode()`, and `encode()`.

<ThemedImage 
  lightSrc="/codecs/codecs-light.png" 
  darkSrc="/codecs/codecs-dark.png" 
  alt="Codec directionality diagram showing bidirectional transformation between input and output schemas" 
/>

### Async and safe variants

As with `.transform()` and `.refine()`, codecs support async transforms.

```ts
const asyncCodec = Schema.codec(Schema.string(), Schema.number(), {
  decode: async (str) => Number(str),
  encode: async (num) => num.toString(),
});
```

As with regular `parse()`, there are "safe" and "async" variants of `decode()` and `encode()`.

```ts
stringToDate.decode("2024-01-15T10:30:00.000Z"); 
// => Date

stringToDate.decodeAsync("2024-01-15T10:30:00.000Z"); 
// => Promise<Date>

stringToDate.safeDecode("2024-01-15T10:30:00.000Z"); 
// => { success: true, data: Date } | { success: false, error: SchemaError }

stringToDate.safeDecodeAsync("2024-01-15T10:30:00.000Z"); 
// => Promise<{ success: true, data: Date } | { success: false, error: SchemaError }>
```

## How encoding works

There are some subtleties to how certain Schema schemas "reverse" their parse behavior. 

### Codecs

This one is fairly self-explanatory. Codecs encapsulate a bi-directional transformation between two types. `Schema.decode()` triggers the `decode` transform to convert input into a parsed value, while `Schema.encode()` triggers the `encode` transform to serialize it back.

```ts
const stringToDate = Schema.codec(
  Schema.iso.datetime(),  // input schema: ISO date string
  Schema.date(),          // output schema: Date object
  {
    decode: (isoString) => new Date(isoString), // ISO string → Date
    encode: (date) => date.toISOString(),       // Date → ISO string
  }
);

stringToDate.decode("2024-01-15T10:30:00.000Z"); 
// => Date

stringToDate.encode(new Date("2024-01-15")); 
// => string
```


### Pipes

> **Fun fact** — Codecs are implemented internally as *subclasses* of pipes with "interstitial" transform logic. 

During regular decoding, a `SchemaPipe<A, B>` schema will first parse the data with `A`, then pass it into `B`. As you might expect, during encoding, the data is first encoded with `B`, then passed into `A`.

### Refinements

All checks (`.refine()`, `.min()`, `.max()`, etc.) are still executed in both directions. 

```ts
const schema = stringToDate.refine((date) => date.getFullYear() >= 2000, "Must be this millennium");

Schema.encode(new Date("2000-01-01"));
// => Date

Schema.encode(new Date("1999-01-01"));
// => ❌ SchemaError: [
//   {
//     "code": "custom",
//     "path": [],
//     "message": "Must be this millennium"
//   }
// ]
```

To avoid unexpected errors in your custom `.refine()` logic, Schema performs two "passes" during `Schema.encode()`. The first pass ensures the input type conforms to the expected type (no `invalid_type` errors). If that passes, Schema performs the second pass which executes the refinement logic.

This approach also supports "mutating transforms" like `Schema.string().trim()` or `Schema.string().toLowerCase()`:

```ts
const schema = Schema.string().trim();

Schema.decode("  hello  ");
// => "hello"

Schema.encode("  hello  ");
// => "hello"
```

### Defaults and prefaults

Defaults and prefaults are only applied in the "forward" direction. 
```ts
const stringWithDefault = Schema.string().default("hello");

stringWithDefault.decode(undefined); 
// => "hello"

stringWithDefault.encode(undefined); 
// => SchemaError: Expected string, received undefined
```

When you attach a default value to a schema, the input becomes optional (`| undefined`) but the output does not. As such, `undefined` is not a valid input to `Schema.encode()` and defaults/prefaults will not be applied. 

### Catch

Similarly, `.catch()` is only applied in the "forward" direction.

```ts
const stringWithCatch = Schema.string().catch("hello");

stringWithCatch.decode(1234); 
// => "hello"

stringWithCatch.encode(1234); 
// => SchemaError: Expected string, received number
```

### Stringbool

> **Note** — [Stringbool](/api#stringbool) pre-dates the introduction of codecs in Schema. It has since been internally re-implemented as a codec. 

The `Schema.stringbool()` API converts string values (`"true"`, `"false"`, `"yes"`, `"no"`, etc.) into `boolean`. By default, it will convert `true` to `"true"` and `false` to `"false"` during `Schema.encode()`.

```ts
const stringbool = Schema.stringbool();

stringbool.decode("true");  // => true
stringbool.decode("false"); // => false

stringbool.encode(true);    // => "true"
stringbool.encode(false);   // => "false"
```

If you specify a custom set of `truthy` and `falsy` values, the *first element in the array* will be used instead.

```ts
const stringbool = Schema.stringbool({ truthy: ["yes", "y"], falsy: ["no", "n"] });

stringbool.encode(true);    // => "yes"
stringbool.encode(false);   // => "no"
```

### Transforms

⚠️ — The `.transform()` API implements a *unidirectional* transformation. If any `.transform()` exists anywhere in your schema, attempting a `Schema.encode()` operation will throw a *runtime error* (not a `SchemaError`). 

```ts
const schema = Schema.string().transform(val => val.length);

Schema.encode(1234); 
// ❌ Error: Encountered unidirectional transform during encode: SchemaTransform
```

{/* ### Success

`SchemaSuccess` is also strictly unidirectional, and will throw an error if encountered during an encode operation.

```ts
const successSchema = Schema.success(Schema.string());

Schema.decode(successSchema, "hello"); 
// => true

Schema.encode(successSchema, true);    
// ❌ Error: Encountered unidirectional transform during encode: SchemaSuccess
``` */}


## Useful codecs

Below are implementations for a bunch of commonly-needed codecs. For the sake of customizability, these are not included as first-class APIs in Schema itself. Instead, you should copy/paste them into your project and modify them as needed.

> **Note** — The codec implementations below are tested for correctness. 

### `stringToNumber`

Converts string representations of numbers to JavaScript `number` type using `parseFloat()`.

```ts
const stringToNumber = Schema.codec(Schema.string().regex(Schema.regexes.number), Schema.number(), {
  decode: (str) => Number.parseFloat(str),
  encode: (num) => num.toString(),
});

stringToNumber.decode("42.5");  // => 42.5
stringToNumber.encode(42.5);    // => "42.5"
```

### `stringToInt`

Converts string representations of integers to JavaScript `number` type using `parseInt()`.

```ts
const stringToInt = Schema.codec(Schema.string().regex(Schema.regexes.integer), Schema.int(), {
  decode: (str) => Number.parseInt(str, 10),
  encode: (num) => num.toString(),
});

stringToInt.decode("42");  // => 42
stringToInt.encode(42);    // => "42"
```

### `stringToBigInt`

Converts string representations to JavaScript `bigint` type.

```ts
const stringToBigInt = Schema.codec(Schema.string(), Schema.bigint(), {
  decode: (str) => BigInt(str),
  encode: (bigint) => bigint.toString(),
});

stringToBigInt.decode("12345");  // => 12345n
stringToBigInt.encode(12345n);   // => "12345"
```

### `numberToBigInt`

Converts JavaScript `number` to `bigint` type.

```ts
const numberToBigInt = Schema.codec(Schema.int(), Schema.bigint(), {
  decode: (num) => BigInt(num),
  encode: (bigint) => Number(bigint),
});

numberToBigInt.decode(42);   // => 42n
numberToBigInt.encode(42n);  // => 42
```

### `isoDatetimeToDate`

Converts ISO datetime strings to JavaScript `Date` objects.

```ts
const isoDatetimeToDate = Schema.codec(Schema.iso.datetime(), Schema.date(), {
  decode: (isoString) => new Date(isoString),
  encode: (date) => date.toISOString(),
});

isoDatetimeToDate.decode("2024-01-15T10:30:00.000Z");  // => Date object
isoDatetimeToDate.encode(new Date("2024-01-15"));       // => "2024-01-15T00:00:00.000Z"
```

### `epochSecondsToDate`

Converts Unix timestamps (seconds since epoch) to JavaScript `Date` objects.

```ts
const epochSecondsToDate = Schema.codec(Schema.int().min(0), Schema.date(), {
  decode: (seconds) => new Date(seconds * 1000),
  encode: (date) => Math.floor(date.getTime() / 1000),
});

epochSecondsToDate.decode(1705314600);  // => Date object
epochSecondsToDate.encode(new Date());  // => Unix timestamp in seconds
```

### `epochMillisToDate`

Converts Unix timestamps (milliseconds since epoch) to JavaScript `Date` objects.

```ts
const epochMillisToDate = Schema.codec(Schema.int().min(0), Schema.date(), {
  decode: (millis) => new Date(millis),
  encode: (date) => date.getTime(),
});

epochMillisToDate.decode(1705314600000);  // => Date object
epochMillisToDate.encode(new Date());     // => Unix timestamp in milliseconds
```

### `json(schema)`

Parses JSON strings into structured data and serializes back to JSON. This generic function accepts an output schema to validate the parsed JSON data.

```ts
const jsonCodec = <T extends Schema.core.$SchemaType>(schema: T) =>
  Schema.codec(Schema.string(), schema, {
    decode: (jsonString, ctx) => {
      try {
        return JSON.parse(jsonString);
      } catch (err: any) {
        ctx.issues.push({
          code: "invalid_format",
          format: "json",
          input: jsonString,
          message: err.message,
        });
        return Schema.NEVER;
      }
    },
    encode: (value) => JSON.stringify(value),
  });
```

Usage example with a specific schema:

```ts
const jsonToObject = jsonCodec(Schema.object({ name: Schema.string(), age: Schema.number() }));

jsonToObject.decode('{"name":"Alice","age":30}');  
// => { name: "Alice", age: 30 }

jsonToObject.encode({ name: "Bob", age: 25 });     
// => '{"name":"Bob","age":25}'

jsonToObject.decode('~~invalid~~'); 
// SchemaError: [
//   {
//     "code": "invalid_format",
//     "format": "json",
//     "path": [],
//     "message": "Unexpected token '~', \"~~invalid~~\" is not valid JSON"
//   }
// ]
```

### `utf8ToBytes`

Converts UTF-8 strings to `Uint8Array` byte arrays.

```ts
const utf8ToBytes = Schema.codec(Schema.string(), Schema.instanceof(Uint8Array), {
  decode: (str) => new TextEncoder().encode(str),
  encode: (bytes) => new TextDecoder().decode(bytes),
});

utf8ToBytes.decode("Hello, 世界!");  // => Uint8Array
utf8ToBytes.encode(bytes);          // => "Hello, 世界!"
```

### `bytesToUtf8`

Converts `Uint8Array` byte arrays to UTF-8 strings.

```ts
const bytesToUtf8 = Schema.codec(Schema.instanceof(Uint8Array), Schema.string(), {
  decode: (bytes) => new TextDecoder().decode(bytes),
  encode: (str) => new TextEncoder().encode(str),
});

bytesToUtf8.decode(bytes);          // => "Hello, 世界!"
bytesToUtf8.encode("Hello, 世界!");  // => Uint8Array
```

### `base64ToBytes`

Converts base64 strings to `Uint8Array` byte arrays and vice versa.

```ts
const base64ToBytes = Schema.codec(Schema.base64(), Schema.instanceof(Uint8Array), {
  decode: (base64String) => Schema.util.base64ToUint8Array(base64String),
  encode: (bytes) => Schema.util.uint8ArrayToBase64(bytes),
});

base64ToBytes.decode("SGVsbG8=");  // => Uint8Array([72, 101, 108, 108, 111])
base64ToBytes.encode(bytes);       // => "SGVsbG8="
```

### `base64urlToBytes`

Converts base64url strings (URL-safe base64) to `Uint8Array` byte arrays.

```ts
const base64urlToBytes = Schema.codec(Schema.base64url(), Schema.instanceof(Uint8Array), {
  decode: (base64urlString) => Schema.util.base64urlToUint8Array(base64urlString),
  encode: (bytes) => Schema.util.uint8ArrayToBase64url(bytes),
});

base64urlToBytes.decode("SGVsbG8");  // => Uint8Array([72, 101, 108, 108, 111])
base64urlToBytes.encode(bytes);      // => "SGVsbG8"
```

### `hexToBytes`

Converts hexadecimal strings to `Uint8Array` byte arrays and vice versa.

```ts
const hexToBytes = Schema.codec(Schema.hex(), Schema.instanceof(Uint8Array), {
  decode: (hexString) => Schema.util.hexToUint8Array(hexString),
  encode: (bytes) => Schema.util.uint8ArrayToHex(bytes),
});

hexToBytes.decode("48656c6c6f");     // => Uint8Array([72, 101, 108, 108, 111])
hexToBytes.encode(bytes);            // => "48656c6c6f"
```

### `stringToURL`

Converts URL strings to JavaScript `URL` objects.

```ts
const stringToURL = Schema.codec(Schema.url(), Schema.instanceof(URL), {
  decode: (urlString) => new URL(urlString),
  encode: (url) => url.href,
});

stringToURL.decode("https://example.com/path");  // => URL object
stringToURL.encode(new URL("https://example.com"));  // => "https://example.com/"
```

### `stringToHttpURL`

Converts HTTP/HTTPS URL strings to JavaScript `URL` objects.

```ts
const stringToHttpURL = Schema.codec(Schema.httpUrl(), Schema.instanceof(URL), {
  decode: (urlString) => new URL(urlString),
  encode: (url) => url.href,
});

stringToHttpURL.decode("https://api.example.com/v1");  // => URL object
stringToHttpURL.encode(url);                           // => "https://api.example.com/v1"
```

### `uriComponent`

Encodes and decodes URI components using `encodeURIComponent()` and `decodeURIComponent()`.

```ts
const uriComponent = Schema.codec(Schema.string(), Schema.string(), {
  decode: (encodedString) => decodeURIComponent(encodedString),
  encode: (decodedString) => encodeURIComponent(decodedString),
});

uriComponent.decode("Hello%20World%21");  // => "Hello World!"
uriComponent.encode("Hello World!");      // => "Hello%20World!"
```
