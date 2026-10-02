import * as core from "../core/index.js";
import { SchemaISODate, SchemaISODateTime, SchemaISODuration, SchemaISOTime } from "./schemas.js";

export { SchemaISODate, SchemaISODateTime, SchemaISODuration, SchemaISOTime } from "./schemas.js";

export function datetime(params?: string | core.$SchemaISODateTimeParams): SchemaISODateTime {
  return core._isoDateTime(SchemaISODateTime, params);
}

export function date(params?: string | core.$SchemaISODateParams): SchemaISODate {
  return core._isoDate(SchemaISODate, params);
}

export function time(params?: string | core.$SchemaISOTimeParams): SchemaISOTime {
  return core._isoTime(SchemaISOTime, params);
}

export function duration(params?: string | core.$SchemaISODurationParams): SchemaISODuration {
  return core._isoDuration(SchemaISODuration, params);
}
