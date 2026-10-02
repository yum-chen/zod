/**
 * Construction and parse throughput, so memory work can be shown not to cost
 * speed. Reports ops/sec; compare runs across commits.
 */
import * as Schema   from "schema";
import { table } from "./harness.js";

function timeOnce(fn: () => void, ms: number): number {
  let ops = 0;
  const start = process.hrtime.bigint();
  const budget = BigInt(ms) * 1_000_000n;
  while (process.hrtime.bigint() - start < budget) {
    for (let i = 0; i < 200; i++) fn();
    ops += 200;
  }
  return ops / (Number(process.hrtime.bigint() - start) / 1e9);
}

const ROUNDS = 7;
const CASES: Array<[string, () => void]> = [];
function bench(label: string, fn: () => void): void {
  CASES.push([label, fn]);
}

/**
 * Rounds are interleaved across all cases rather than run case-by-case, so a
 * transient (thermal, GC, other processes) hits every case roughly equally
 * instead of ruining one. Reported value is the median round.
 */
function runAll(ms = 400): Array<{ label: string; opsPerSec: number; spreadPct: number }> {
  for (const [, fn] of CASES) for (let i = 0; i < 5_000; i++) fn();

  const samples = new Map<string, number[]>(CASES.map(([l]) => [l, []]));
  for (let r = 0; r < ROUNDS; r++) {
    for (const [label, fn] of CASES) {
      samples.get(label)!.push(timeOnce(fn, ms));
    }
  }
  return CASES.map(([label]) => {
    const s = samples.get(label)!.sort((a, b) => a - b);
    const median = s[Math.floor(s.length / 2)]!;
    return { label, opsPerSec: median, spreadPct: ((s.at(-1)! - s[0]!) / median) * 100 };
  });
}

const shape = { a: Schema.string(), b: Schema.number(), c: Schema.boolean() };
const objSchema = Schema.object(shape);
const strSchema = Schema.string();
const minSchema = Schema.string().min(1);
const arrSchema = Schema.array(Schema.string());
const unionSchema = Schema.union([Schema.string(), Schema.number()]);
const data = { a: "x", b: 1, c: true };
const arrData = ["a", "b", "c", "d"];

// construction
bench("construct Schema.string()", () => void Schema.string());
bench("construct Schema.number()", () => void Schema.number());
bench("construct Schema.bigint()", () => void Schema.bigint());
bench("construct Schema.object(3)", () => void Schema.object({ a: Schema.string(), b: Schema.number(), c: Schema.boolean() }));
bench("construct Schema.array(str)", () => void Schema.array(Schema.string()));
bench("construct .min(1)", () => void Schema.string().min(1));
// parsing (hot path must not regress)
bench("parse string", () => void strSchema.parse("hello"));
bench("parse string.min", () => void minSchema.parse("hello"));
bench("parse object(3)", () => void objSchema.parse(data));
bench("parse array(4)", () => void arrSchema.parse(arrData));
bench("parse union", () => void unionSchema.parse("hi"));
bench("safeParse object", () => void objSchema.safeParse(data));
// method access (the lazy-bind getters)
bench("first .optional() on new", () => void Schema.string().optional());
bench("first .email() on new", () => void Schema.string().email());

table(
  runAll().map((r) => ({
    bench: r.label,
    "ops/sec": Math.round(r.opsPerSec).toLocaleString(),
    "spread%": r.spreadPct.toFixed(0),
  }))
);
