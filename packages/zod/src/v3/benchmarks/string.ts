import Benchmark from "benchmark";

import { Schema } from "schema/v3";

const SUITE_NAME = "Schema.string";
const suite = new Benchmark.Suite(SUITE_NAME);

const empty = "";
const short = "short";
const long = "long".repeat(256);
const manual = (str: unknown) => {
  if (typeof str !== "string") {
    throw new Error("Not a string");
  }

  return str;
};
const stringSchema = Schema.string();
const optionalStringSchema = Schema.string().optional();
const optionalNullableStringSchema = Schema.string().optional().nullable();

suite
  .add("empty string", () => {
    stringSchema.parse(empty);
  })
  .add("short string", () => {
    stringSchema.parse(short);
  })
  .add("long string", () => {
    stringSchema.parse(long);
  })
  .add("optional string", () => {
    optionalStringSchema.parse(long);
  })
  .add("nullable string", () => {
    optionalNullableStringSchema.parse(long);
  })
  .add("nullable (null) string", () => {
    optionalNullableStringSchema.parse(null);
  })
  .add("invalid: null", () => {
    try {
      stringSchema.parse(null);
    } catch (_err) {}
  })
  .add("manual parser: long", () => {
    manual(long);
  })
  .on("cycle", (e: Benchmark.Event) => {
    console.log(`${SUITE_NAME}: ${e.target}`);
  });

export default {
  suites: [suite],
};
