import * as Schema   from "schema";
import { fmtBytes, table } from "./harness.js";
import { diffAllocation } from "./snapshot.js";

const which = process.argv[2] ?? "string";

const factories: Record<string, () => unknown> = {
  string: () => Schema.string(),
  number: () => Schema.number(),
  "object-empty": () => Schema.object({}),
  "object-3": () => Schema.object({ a: Schema.string(), b: Schema.number(), c: Schema.boolean() }),
  "string-min": () => Schema.string().min(1),
  optional: () => Schema.string().optional(),
  union: () => Schema.union([Schema.string(), Schema.number()]),
  array: () => Schema.array(Schema.string()),
};

const factory = factories[which];
if (!factory) {
  console.error(`unknown case "${which}"; try: ${Object.keys(factories).join(", ")}`);
  process.exit(1);
}

const rows = diffAllocation(factory, 2_000, 8_000);
const total = rows.reduce((sum, r) => sum + r.bytesEach, 0);

console.log(`allocation breakdown for ${which} (per instance)\n`);
table(
  rows.map((r) => ({
    node: r.what,
    "per inst": r.countEach.toFixed(2),
    bytes: r.bytesEach.toFixed(0),
    human: fmtBytes(r.bytesEach),
  }))
);
console.log(`\ntotal attributed: ${fmtBytes(total)}`);
