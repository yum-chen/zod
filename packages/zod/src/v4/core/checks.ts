// import { $SchemaType } from "./schemas.js";

import * as core from "./core.js";
import type * as errors from "./errors.js";
import * as regexes from "./regexes.js";
import type * as schemas from "./schemas.js";
import * as util from "./util.js";

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
