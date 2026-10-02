import type { SchemaErrorMap } from "./SchemaError.js";
import defaultErrorMap from "./locales/en.js";

let overrideErrorMap = defaultErrorMap;
export { defaultErrorMap };

export function setErrorMap(map: SchemaErrorMap) {
  overrideErrorMap = map;
}

export function getErrorMap() {
  return overrideErrorMap;
}
