import * as core from "../core/index.js";
import * as schemas from "./schemas.js";

// iso time
export interface SchemaMiniISODateTime extends schemas.SchemaMiniStringFormat<"datetime"> {
  _schema: core.$SchemaISODateTimeInternals;
}
export const SchemaMiniISODateTime: core.$constructor<SchemaMiniISODateTime> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniISODateTime",
  (inst, def) => {
    core.$SchemaISODateTime.init(inst, def);
    schemas.SchemaMiniStringFormat.init(inst, def);
  }
);
// @__NO_SIDE_EFFECTS__
export function datetime(params?: string | core.$SchemaISODateTimeParams): SchemaMiniISODateTime {
  return core._isoDateTime(SchemaMiniISODateTime, params);
}

// iso date
export interface SchemaMiniISODate extends schemas.SchemaMiniStringFormat<"date"> {
  _schema: core.$SchemaISODateInternals;
}
export const SchemaMiniISODate: core.$constructor<SchemaMiniISODate> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniISODate",
  (inst, def) => {
    core.$SchemaISODate.init(inst, def);
    schemas.SchemaMiniStringFormat.init(inst, def);
  }
);
// @__NO_SIDE_EFFECTS__
export function date(params?: string | core.$SchemaISODateParams): SchemaMiniISODate {
  return core._isoDate(SchemaMiniISODate, params);
}

// iso time
export interface SchemaMiniISOTime extends schemas.SchemaMiniStringFormat<"time"> {
  _schema: core.$SchemaISOTimeInternals;
}
export const SchemaMiniISOTime: core.$constructor<SchemaMiniISOTime> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniISOTime",
  (inst, def) => {
    core.$SchemaISOTime.init(inst, def);
    schemas.SchemaMiniStringFormat.init(inst, def);
  }
);
// @__NO_SIDE_EFFECTS__
export function time(params?: string | core.$SchemaISOTimeParams): SchemaMiniISOTime {
  return core._isoTime(SchemaMiniISOTime, params);
}

// iso duration
export interface SchemaMiniISODuration extends schemas.SchemaMiniStringFormat<"duration"> {
  _schema: core.$SchemaISODurationInternals;
}
export const SchemaMiniISODuration: core.$constructor<SchemaMiniISODuration> = /*@__PURE__*/ core.$constructor(
  "SchemaMiniISODuration",
  (inst, def) => {
    core.$SchemaISODuration.init(inst, def);
    schemas.SchemaMiniStringFormat.init(inst, def);
  }
);
// @__NO_SIDE_EFFECTS__
export function duration(params?: string | core.$SchemaISODurationParams): SchemaMiniISODuration {
  return core._isoDuration(SchemaMiniISODuration, params);
}
