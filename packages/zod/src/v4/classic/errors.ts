import * as core from "../core/index.js";
import { $SchemaError } from "../core/index.js";
import * as util from "../core/util.js";

/** @deprecated Use `Schema.core.$SchemaIssue` from `@schema/core` instead, especially if you are building a library on top of Schema. */
export type SchemaIssue = core.$SchemaIssue;

/** An Error-like class used to store Schema validation issues.  */
export interface SchemaError<T = unknown> extends $SchemaError<T> {
  /** @deprecated Use the `Schema.treeifyError(err)` function instead. */
  format(): core.$SchemaFormattedError<T>;
  format<U>(mapper: (issue: core.$SchemaIssue) => U): core.$SchemaFormattedError<T, U>;
  /** @deprecated Use the `Schema.treeifyError(err)` function instead. */
  flatten(): core.$SchemaFlattenedError<T>;
  flatten<U>(mapper: (issue: core.$SchemaIssue) => U): core.$SchemaFlattenedError<T, U>;
  /** @deprecated Push directly to `.issues` instead. */
  addIssue(issue: core.$SchemaIssue): void;
  /** @deprecated Push directly to `.issues` instead. */
  addIssues(issues: core.$SchemaIssue[]): void;

  /** @deprecated Check `err.issues.length === 0` instead. */
  isEmpty: boolean;
}

/* Prototypes that already carry the lazy helper methods. Seeded with the
 * intrinsics so that `init` on a foreign object — it accepts any object —
 * can never install an accessor onto a prototype we do not own. */
const _installedErrorProtos = /* @__PURE__ */ new WeakSet<object>([Object.prototype, Error.prototype]);

/* Helper methods live as non-enumerable lazy getters on the shared
 * prototype instead of own properties on every instance. On first
 * access the getter allocates the per-instance closure and caches it
 * as a non-enumerable own property, so detached usage still works and
 * the allocation only happens for methods actually touched. */
function _lazyMethod(proto: object, key: string, make: (self: SchemaError) => unknown): void {
  Object.defineProperty(proto, key, {
    configurable: true,
    enumerable: false,
    get(this: SchemaError) {
      const value = make(this);
      Object.defineProperty(this, key, { value, configurable: true, writable: true });
      return value;
    },
    set(this: SchemaError, value: unknown) {
      Object.defineProperty(this, key, { value, configurable: true, writable: true });
    },
  });
}

const initializer = (inst: SchemaError, issues: core.$SchemaIssue[]) => {
  $SchemaError.init(inst, issues);
  inst.name = "SchemaError";

  const proto = Object.getPrototypeOf(inst);
  if (_installedErrorProtos.has(proto)) return;
  _installedErrorProtos.add(proto);

  _lazyMethod(proto, "format", (self) => (mapper: any) => core.formatError(self, mapper));
  _lazyMethod(proto, "flatten", (self) => (mapper: any) => core.flattenError(self, mapper));
  _lazyMethod(proto, "addIssue", (self) => (issue: any) => {
    self.issues.push(issue);
    self.message = JSON.stringify(self.issues, util.jsonStringifyReplacer, 2);
  });
  _lazyMethod(proto, "addIssues", (self) => (issues: any) => {
    self.issues.push(...issues);
    self.message = JSON.stringify(self.issues, util.jsonStringifyReplacer, 2);
  });
  Object.defineProperty(proto, "isEmpty", {
    configurable: true,
    enumerable: false,
    get(this: SchemaError) {
      return this.issues.length === 0;
    },
  });
};
export const SchemaError: core.$constructor<SchemaError> = /*@__PURE__*/ core.$constructor("SchemaError", initializer);
export const SchemaRealError: core.$constructor<SchemaError> = /*@__PURE__*/ core.$constructor(
  "SchemaError",
  initializer,
  undefined,
  {
    Parent: Error,
  }
);

/** @deprecated Use `Schema.core.$SchemaFlattenedError` instead. */
export type SchemaFlattenedError<T, U = string> = core.$SchemaFlattenedError<T, U>;
/** @deprecated Use `Schema.core.$SchemaFormattedError` instead. */
export type SchemaFormattedError<T, U = string> = core.$SchemaFormattedError<T, U>;
/** @deprecated Use `Schema.core.$SchemaErrorMap` instead. */
export type SchemaErrorMap<T extends core.$SchemaIssueBase = core.$SchemaIssue> = core.$SchemaErrorMap<T>;

/** @deprecated Use `Schema.core.$SchemaRawIssue` instead. */
export type IssueData = core.$SchemaRawIssue;

// /** @deprecated Use `Schema.core.$SchemaErrorMapCtx` instead. */
// export type ErrorMapCtx = core.$SchemaErrorMapCtx;
