import type { Primitive } from "./helpers/typeAliases.js";
import { util, type SchemaParsedType } from "./helpers/util.js";
import type { TypeOf, SchemaType } from "./index.js";

type allKeys<T> = T extends any ? keyof T : never;

export type inferFlattenedErrors<T extends SchemaType<any, any, any>, U = string> = typeToFlattenedError<TypeOf<T>, U>;
export type typeToFlattenedError<T, U = string> = {
  formErrors: U[];
  fieldErrors: {
    [P in allKeys<T>]?: U[];
  };
};

export const SchemaIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite",
]);

export type SchemaIssueCode = keyof typeof SchemaIssueCode;

export type SchemaIssueBase = {
  path: (string | number)[];
  message?: string | undefined;
};

export interface SchemaInvalidTypeIssue extends SchemaIssueBase {
  code: typeof SchemaIssueCode.invalid_type;
  expected: SchemaParsedType;
  received: SchemaParsedType;
}

export interface SchemaInvalidLiteralIssue extends SchemaIssueBase {
  code: typeof SchemaIssueCode.invalid_literal;
  expected: unknown;
  received: unknown;
}

export interface SchemaUnrecognizedKeysIssue extends SchemaIssueBase {
  code: typeof SchemaIssueCode.unrecognized_keys;
  keys: string[];
}

export interface SchemaInvalidUnionIssue extends SchemaIssueBase {
  code: typeof SchemaIssueCode.invalid_union;
  unionErrors: SchemaError[];
}

export interface SchemaInvalidUnionDiscriminatorIssue extends SchemaIssueBase {
  code: typeof SchemaIssueCode.invalid_union_discriminator;
  options: Primitive[];
}

export interface SchemaInvalidEnumValueIssue extends SchemaIssueBase {
  received: string | number;
  code: typeof SchemaIssueCode.invalid_enum_value;
  options: (string | number)[];
}

export interface SchemaInvalidArgumentsIssue extends SchemaIssueBase {
  code: typeof SchemaIssueCode.invalid_arguments;
  argumentsError: SchemaError;
}

export interface SchemaInvalidReturnTypeIssue extends SchemaIssueBase {
  code: typeof SchemaIssueCode.invalid_return_type;
  returnTypeError: SchemaError;
}

export interface SchemaInvalidDateIssue extends SchemaIssueBase {
  code: typeof SchemaIssueCode.invalid_date;
}

export type StringValidation =
  | "email"
  | "url"
  | "emoji"
  | "uuid"
  | "nanoid"
  | "regex"
  | "cuid"
  | "cuid2"
  | "ulid"
  | "datetime"
  | "date"
  | "time"
  | "duration"
  | "ip"
  | "cidr"
  | "base64"
  | "jwt"
  | "base64url"
  | { includes: string; position?: number | undefined }
  | { startsWith: string }
  | { endsWith: string };

export interface SchemaInvalidStringIssue extends SchemaIssueBase {
  code: typeof SchemaIssueCode.invalid_string;
  validation: StringValidation;
}

export interface SchemaTooSmallIssue extends SchemaIssueBase {
  code: typeof SchemaIssueCode.too_small;
  minimum: number | bigint;
  inclusive: boolean;
  exact?: boolean;
  type: "array" | "string" | "number" | "set" | "date" | "bigint";
}

export interface SchemaTooBigIssue extends SchemaIssueBase {
  code: typeof SchemaIssueCode.too_big;
  maximum: number | bigint;
  inclusive: boolean;
  exact?: boolean;
  type: "array" | "string" | "number" | "set" | "date" | "bigint";
}

export interface SchemaInvalidIntersectionTypesIssue extends SchemaIssueBase {
  code: typeof SchemaIssueCode.invalid_intersection_types;
}

export interface SchemaNotMultipleOfIssue extends SchemaIssueBase {
  code: typeof SchemaIssueCode.not_multiple_of;
  multipleOf: number | bigint;
}

export interface SchemaNotFiniteIssue extends SchemaIssueBase {
  code: typeof SchemaIssueCode.not_finite;
}

export interface SchemaCustomIssue extends SchemaIssueBase {
  code: typeof SchemaIssueCode.custom;
  params?: { [k: string]: any };
}

export type DenormalizedError = { [k: string]: DenormalizedError | string[] };

export type SchemaIssueOptionalMessage =
  | SchemaInvalidTypeIssue
  | SchemaInvalidLiteralIssue
  | SchemaUnrecognizedKeysIssue
  | SchemaInvalidUnionIssue
  | SchemaInvalidUnionDiscriminatorIssue
  | SchemaInvalidEnumValueIssue
  | SchemaInvalidArgumentsIssue
  | SchemaInvalidReturnTypeIssue
  | SchemaInvalidDateIssue
  | SchemaInvalidStringIssue
  | SchemaTooSmallIssue
  | SchemaTooBigIssue
  | SchemaInvalidIntersectionTypesIssue
  | SchemaNotMultipleOfIssue
  | SchemaNotFiniteIssue
  | SchemaCustomIssue;

export type SchemaIssue = SchemaIssueOptionalMessage & {
  fatal?: boolean | undefined;
  message: string;
};

export const quotelessJson = (obj: any) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};

type recursiveSchemaFormattedError<T> = T extends [any, ...any[]]
  ? { [K in keyof T]?: SchemaFormattedError<T[K]> }
  : T extends any[]
    ? { [k: number]: SchemaFormattedError<T[number]> }
    : T extends object
      ? { [K in keyof T]?: SchemaFormattedError<T[K]> }
      : unknown;

export type SchemaFormattedError<T, U = string> = {
  _errors: U[];
} & recursiveSchemaFormattedError<NonNullable<T>>;

export type inferFormattedError<T extends SchemaType<any, any, any>, U = string> = SchemaFormattedError<TypeOf<T>, U>;

export class SchemaError<T = any> extends Error {
  issues: SchemaIssue[] = [];

  get errors() {
    return this.issues;
  }

  constructor(issues: SchemaIssue[]) {
    super();

    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      // eslint-disable-next-line ban/ban
      Object.setPrototypeOf(this, actualProto);
    } else {
      (this as any).__proto__ = actualProto;
    }
    this.name = "SchemaError";
    this.issues = issues;
  }

  format(): SchemaFormattedError<T>;
  format<U>(mapper: (issue: SchemaIssue) => U): SchemaFormattedError<T, U>;
  format(_mapper?: any) {
    const mapper: (issue: SchemaIssue) => any =
      _mapper ||
      function (issue: SchemaIssue) {
        return issue.message;
      };
    const fieldErrors: SchemaFormattedError<T> = { _errors: [] } as any;
    const processError = (error: SchemaError) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          (fieldErrors as any)._errors.push(mapper(issue));
        } else {
          let curr: any = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i]!;
            const terminal = i === issue.path.length - 1;

            // `_errors` is reserved by this legacy format, so merge a matching path segment into the current node instead of treating its array as a child.
            if (el === "_errors") {
              if (terminal) curr._errors.push(mapper(issue));
              i++;
              continue;
            }

            // Create `el` as an own data property. A segment naming an inherited member ("toString", "constructor") would otherwise read through to the prototype, and assigning "__proto__" would hit the setter and walk into Object.prototype.
            if (!Object.prototype.hasOwnProperty.call(curr, el)) {
              if (el === "__proto__") {
                Object.defineProperty(curr, el, {
                  value: { _errors: [] },
                  writable: true,
                  enumerable: true,
                  configurable: true,
                });
              } else {
                curr[el] = { _errors: [] };
              }
            }

            curr = curr[el];
            if (terminal) {
              curr._errors.push(mapper(issue));
            }
            i++;
          }
        }
      }
    };

    processError(this);
    return fieldErrors;
  }

  static create = (issues: SchemaIssue[]) => {
    const error = new SchemaError(issues);
    return error;
  };

  static assert(value: unknown): asserts value is SchemaError {
    if (!(value instanceof SchemaError)) {
      throw new Error(`Not a SchemaError: ${value}`);
    }
  }

  override toString() {
    return this.message;
  }
  override get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }

  get isEmpty(): boolean {
    return this.issues.length === 0;
  }

  addIssue = (sub: SchemaIssue) => {
    this.issues = [...this.issues, sub];
  };

  addIssues = (subs: SchemaIssue[] = []) => {
    this.issues = [...this.issues, ...subs];
  };

  flatten(): typeToFlattenedError<T>;
  flatten<U>(mapper?: (issue: SchemaIssue) => U): typeToFlattenedError<T, U>;
  flatten<U = string>(mapper: (issue: SchemaIssue) => U = (issue: SchemaIssue) => issue.message as any): any {
    const fieldErrors: any = Object.create(null);
    const formErrors: U[] = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0]!;
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }

  get formErrors() {
    return this.flatten();
  }
}

type stripPath<T extends object> = T extends any ? util.OmitKeys<T, "path"> : never;

export type IssueData = stripPath<SchemaIssueOptionalMessage> & {
  path?: (string | number)[];
  fatal?: boolean | undefined;
};

export type ErrorMapCtx = {
  defaultError: string;
  data: any;
};

export type SchemaErrorMap = (issue: SchemaIssueOptionalMessage, _ctx: ErrorMapCtx) => { message: string };
