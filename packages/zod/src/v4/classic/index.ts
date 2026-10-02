import * as Schema from "./external.js";

export * from "./external.js";
// See the note in `src/index.ts` — aliasing keeps the default export shakable.
export { Schema, z as default };
