import Benchmark from "benchmark";

import { Schema } from "schema/v3";

const doubleSuite = new Benchmark.Suite("Schema.discriminatedUnion: double");
const manySuite = new Benchmark.Suite("Schema.discriminatedUnion: many");

const aSchema = Schema.object({
  type: Schema.literal("a"),
});
const objA = {
  type: "a",
};

const bSchema = Schema.object({
  type: Schema.literal("b"),
});
const objB = {
  type: "b",
};

const cSchema = Schema.object({
  type: Schema.literal("c"),
});
const objC = {
  type: "c",
};

const dSchema = Schema.object({
  type: Schema.literal("d"),
});

const double = Schema.discriminatedUnion("type", [aSchema, bSchema]);
const many = Schema.discriminatedUnion("type", [aSchema, bSchema, cSchema, dSchema]);

doubleSuite
  .add("valid: a", () => {
    double.parse(objA);
  })
  .add("valid: b", () => {
    double.parse(objB);
  })
  .add("invalid: null", () => {
    try {
      double.parse(null);
    } catch (_err) {}
  })
  .add("invalid: wrong shape", () => {
    try {
      double.parse(objC);
    } catch (_err) {}
  })
  .on("cycle", (e: Benchmark.Event) => {
    console.log(`${(doubleSuite as any).name}: ${e.target}`);
  });

manySuite
  .add("valid: a", () => {
    many.parse(objA);
  })
  .add("valid: c", () => {
    many.parse(objC);
  })
  .add("invalid: null", () => {
    try {
      many.parse(null);
    } catch (_err) {}
  })
  .add("invalid: wrong shape", () => {
    try {
      many.parse({ type: "unknown" });
    } catch (_err) {}
  })
  .on("cycle", (e: Benchmark.Event) => {
    console.log(`${(manySuite as any).name}: ${e.target}`);
  });

export default {
  suites: [doubleSuite, manySuite],
};
