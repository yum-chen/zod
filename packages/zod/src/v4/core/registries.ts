import type * as core from "./core.js";
import type { $SchemaType } from "./schemas.js";

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
