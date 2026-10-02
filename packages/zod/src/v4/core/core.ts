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
