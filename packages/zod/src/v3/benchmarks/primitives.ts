import Benchmark from "benchmark";

import { Schema } from "schema/v3";
import { Mocker } from "../tests/Mocker.js";

const val = new Mocker();

const enumSuite = new Benchmark.Suite("Schema.enum");
const enumSchema = Schema.enum(["a", "b", "c"]);

enumSuite
  .add("valid", () => {
    enumSchema.parse("a");
  })
  .add("invalid", () => {
    try {
      enumSchema.parse("x");
    } catch (_e: any) {}
  })
  .on("cycle", (e: Benchmark.Event) => {
    console.log(`Schema.enum: ${e.target}`);
  });

const longEnumSuite = new Benchmark.Suite("long Schema.enum");
const longEnumSchema = Schema.enum([
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
]);

longEnumSuite
  .add("valid", () => {
    longEnumSchema.parse("five");
  })
  .add("invalid", () => {
    try {
      longEnumSchema.parse("invalid");
    } catch (_e: any) {}
  })
  .on("cycle", (e: Benchmark.Event) => {
    console.log(`long Schema.enum: ${e.target}`);
  });

const undefinedSuite = new Benchmark.Suite("Schema.undefined");
const undefinedSchema = Schema.undefined();

undefinedSuite
  .add("valid", () => {
    undefinedSchema.parse(undefined);
  })
  .add("invalid", () => {
    try {
      undefinedSchema.parse(1);
    } catch (_e: any) {}
  })
  .on("cycle", (e: Benchmark.Event) => {
    console.log(`Schema.undefined: ${e.target}`);
  });

const literalSuite = new Benchmark.Suite("Schema.literal");
const short = "short";
const bad = "bad";
const literalSchema = Schema.literal("short");

literalSuite
  .add("valid", () => {
    literalSchema.parse(short);
  })
  .add("invalid", () => {
    try {
      literalSchema.parse(bad);
    } catch (_e: any) {}
  })
  .on("cycle", (e: Benchmark.Event) => {
    console.log(`Schema.literal: ${e.target}`);
  });

const numberSuite = new Benchmark.Suite("Schema.number");
const numberSchema = Schema.number().int();

numberSuite
  .add("valid", () => {
    numberSchema.parse(1);
  })
  .add("invalid type", () => {
    try {
      numberSchema.parse("bad");
    } catch (_e: any) {}
  })
  .add("invalid number", () => {
    try {
      numberSchema.parse(0.5);
    } catch (_e: any) {}
  })
  .on("cycle", (e: Benchmark.Event) => {
    console.log(`Schema.number: ${e.target}`);
  });

const dateSuite = new Benchmark.Suite("Schema.date");

const plainDate = Schema.date();
const minMaxDate = Schema.date().min(new Date("2021-01-01")).max(new Date("2030-01-01"));

dateSuite
  .add("valid", () => {
    plainDate.parse(new Date());
  })
  .add("invalid", () => {
    try {
      plainDate.parse(1);
    } catch (_e: any) {}
  })
  .add("valid min and max", () => {
    minMaxDate.parse(new Date("2023-01-01"));
  })
  .add("invalid min", () => {
    try {
      minMaxDate.parse(new Date("2019-01-01"));
    } catch (_e: any) {}
  })
  .add("invalid max", () => {
    try {
      minMaxDate.parse(new Date("2031-01-01"));
    } catch (_e: any) {}
  })
  .on("cycle", (e: Benchmark.Event) => {
    console.log(`Schema.date: ${e.target}`);
  });

const symbolSuite = new Benchmark.Suite("Schema.symbol");
const symbolSchema = Schema.symbol();

symbolSuite
  .add("valid", () => {
    symbolSchema.parse(val.symbol);
  })
  .add("invalid", () => {
    try {
      symbolSchema.parse(1);
    } catch (_e: any) {}
  })
  .on("cycle", (e: Benchmark.Event) => {
    console.log(`Schema.symbol: ${e.target}`);
  });

export default {
  suites: [enumSuite, longEnumSuite, undefinedSuite, literalSuite, numberSuite, dateSuite, symbolSuite],
};
