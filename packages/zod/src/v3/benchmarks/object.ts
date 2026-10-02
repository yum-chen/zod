import Benchmark from "benchmark";

import { Schema } from "schema/v3";

const emptySuite = new Benchmark.Suite("Schema.object: empty");
const shortSuite = new Benchmark.Suite("Schema.object: short");
const longSuite = new Benchmark.Suite("Schema.object: long");

const empty = Schema.object({});
const short = Schema.object({
  string: Schema.string(),
});
const long = Schema.object({
  string: Schema.string(),
  number: Schema.number(),
  boolean: Schema.boolean(),
});

emptySuite
  .add("valid", () => {
    empty.parse({});
  })
  .add("valid: extra keys", () => {
    empty.parse({ string: "string" });
  })
  .add("invalid: null", () => {
    try {
      empty.parse(null);
    } catch (_err) {}
  })
  .on("cycle", (e: Benchmark.Event) => {
    console.log(`${(emptySuite as any).name}: ${e.target}`);
  });

shortSuite
  .add("valid", () => {
    short.parse({ string: "string" });
  })
  .add("valid: extra keys", () => {
    short.parse({ string: "string", number: 42 });
  })
  .add("invalid: null", () => {
    try {
      short.parse(null);
    } catch (_err) {}
  })
  .on("cycle", (e: Benchmark.Event) => {
    console.log(`${(shortSuite as any).name}: ${e.target}`);
  });

longSuite
  .add("valid", () => {
    long.parse({ string: "string", number: 42, boolean: true });
  })
  .add("valid: extra keys", () => {
    long.parse({ string: "string", number: 42, boolean: true, list: [] });
  })
  .add("invalid: null", () => {
    try {
      long.parse(null);
    } catch (_err) {}
  })
  .on("cycle", (e: Benchmark.Event) => {
    console.log(`${(longSuite as any).name}: ${e.target}`);
  });

export default {
  suites: [emptySuite, shortSuite, longSuite],
};
