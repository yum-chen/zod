import Benchmark from "benchmark";

import { Schema } from "schema/v3";

const shortSuite = new Benchmark.Suite("realworld");

const People = Schema.array(
  Schema.object({
    type: Schema.literal("person"),
    hair: Schema.enum(["blue", "brown"]),
    active: Schema.boolean(),
    name: Schema.string(),
    age: Schema.number().int(),
    hobbies: Schema.array(Schema.string()),
    address: Schema.object({
      street: Schema.string(),
      zip: Schema.string(),
      country: Schema.string(),
    }),
  })
);

let i = 0;

function num() {
  return ++i;
}

function str() {
  return (++i % 100).toString(16);
}

function array<T>(fn: () => T): T[] {
  return Array.from({ length: ++i % 10 }, () => fn());
}

const people = Array.from({ length: 100 }, () => {
  return {
    type: "person",
    hair: i % 2 ? "blue" : "brown",
    active: !!(i % 2),
    name: str(),
    age: num(),
    hobbies: array(str),
    address: {
      street: str(),
      zip: str(),
      country: str(),
    },
  };
});

shortSuite
  .add("valid", () => {
    People.parse(people);
  })
  .on("cycle", (e: Benchmark.Event) => {
    console.log(`${(shortSuite as any).name}: ${e.target}`);
  });

export default {
  suites: [shortSuite],
};
