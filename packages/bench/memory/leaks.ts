/**
 * Empirical leak detection.
 *
 * Each scenario runs a workload that creates schemas and/or parses data and
 * then DROPS every reference it created. A correct scenario returns to its
 * starting heap. Anything that grows linearly with iteration count is
 * retaining something it shouldn't.
 *
 * Growth is measured across two batches of different sizes so a fixed
 * one-time cost (module init, lazily-installed prototypes) doesn't read as a
 * leak: only the SLOPE matters.
 */
import * as Schema   from "schema";
import { collect, fmtBytes, table } from "./harness.js";

interface Scenario {
  label: string;
  /** Must leave nothing reachable behind. */
  run: (i: number) => void;
  /** Known-leaky scenarios we assert ON, to prove the detector works. */
  expectLeak?: boolean;
}

const scenarios: Scenario[] = [
  // --- controls: these MUST show a leak, proving the detector is sensitive ---
  {
    label: "CONTROL: push to module array",
    run: (i) => void leakSink.push(Schema.string().min(i % 5)),
    expectLeak: true,
  },
  {
    label: "CONTROL: no-op",
    run: () => {},
  },

  // --- schema construction, all references dropped ---
  { label: "Schema.string()", run: () => void Schema.string() },
  { label: "Schema.string().min(1)", run: () => void Schema.string().min(1) },
  { label: "Schema.object({...})", run: () => void Schema.object({ a: Schema.string(), b: Schema.number() }) },
  { label: "Schema.object().extend()", run: () => void Schema.object({ a: Schema.string() }).extend({ b: Schema.number() }) },
  { label: "Schema.object().partial()", run: () => void Schema.object({ a: Schema.string() }).partial() },
  {
    label: "Schema.discriminatedUnion",
    run: () => void Schema.discriminatedUnion("t", [Schema.object({ t: Schema.literal("a") }), Schema.object({ t: Schema.literal("b") })]),
  },
  {
    label: "Schema.lazy recursive",
    run: () => {
      const s: any = Schema.lazy(() => Schema.object({ v: Schema.string(), next: s.optional() }));
      void s.safeParse({ v: "x", next: { v: "y" } });
    },
  },

  // --- registry / metadata ---
  { label: ".describe()", run: (i) => void Schema.string().describe(`d${i}`) },
  { label: ".meta() no id", run: (i) => void Schema.string().meta({ title: `t${i}` }) },
  { label: ".meta() WITH id", run: (i) => void Schema.string().meta({ id: `id-${i}` }) },
  { label: "custom registry .add() w/ id", run: (i) => void localRegistry.add(Schema.string(), { id: `r-${i}` }) },

  // --- parsing: input data must not be retained ---
  { label: "parse (fresh schema each time)", run: (i) => void Schema.object({ a: Schema.string() }).parse({ a: `v${i}` }) },
  { label: "parse big payload (shared schema)", run: (i) => void bigSchema.parse(makeBig(i)) },
  {
    label: "safeParse FAILURE (shared schema)",
    run: (i) => void bigSchema.safeParse({ ...makeBig(i), n: "not-a-number" }),
  },
  {
    label: "parse throw+catch (shared schema)",
    run: (i) => {
      try {
        bigSchema.parse({ ...makeBig(i), n: "not-a-number" });
      } catch {}
    },
  },
  { label: "refine failure (shared schema)", run: (i) => void refined.safeParse(`x${i}`) },

  // --- JSON schema generation ---
  { label: "toJSONSchema (shared schema)", run: () => void Schema.toJSONSchema(bigSchema) },
  { label: "toJSONSchema (fresh schema)", run: () => void Schema.toJSONSchema(Schema.object({ a: Schema.string() })) },

  // --- standard-schema surface ---
  { label: "~standard.validate", run: (i) => void bigSchema["~standard"].validate(makeBig(i)) },
];

const leakSink: unknown[] = [];
const localRegistry = Schema.registry<{ id: string }>();
const bigSchema = Schema.object({
  s: Schema.string(),
  n: Schema.number(),
  arr: Schema.array(Schema.string()),
  nested: Schema.object({ deep: Schema.object({ deeper: Schema.string() }) }),
});
const refined = Schema.string().refine((s) => s.length > 1000, "too short");

function makeBig(i: number) {
  return {
    s: `string-value-${i}`,
    n: i,
    arr: Array.from({ length: 20 }, (_, k) => `item-${i}-${k}-padding-padding-padding`),
    nested: { deep: { deeper: `deep-${i}` } },
  };
}

function heapAfter(run: (i: number) => void, iterations: number, offset: number): number {
  for (let i = 0; i < iterations; i++) run(offset + i);
  collect();
  return process.memoryUsage().heapUsed;
}

const SMALL = 2_000;
const LARGE = 10_000;

const rows = scenarios.map((s) => {
  // Warm everything (lazy prototype installs, JIT compilation) so one-time costs land before the first measurement.
  for (let i = 0; i < 500; i++) s.run(i);
  collect();

  const base = process.memoryUsage().heapUsed;
  const afterSmall = heapAfter(s.run, SMALL, 1_000_000);
  const afterLarge = heapAfter(s.run, LARGE, 2_000_000);

  // Bytes retained per iteration, from the slope between the two batches. Using the slope cancels any fixed cost captured in `base`.
  const slope = (afterLarge - afterSmall) / LARGE;
  const totalGrowth = afterLarge - base;
  const leaking = slope > 24; // below ~1 pointer/iteration is noise

  return {
    scenario: s.label,
    "bytes/iter": slope.toFixed(1),
    "total growth": fmtBytes(totalGrowth),
    verdict: leaking ? "LEAK" : "ok",
    expected: s.expectLeak ? "leak" : "ok",
    agree: leaking === !!s.expectLeak ? "" : "  <-- MISMATCH",
  };
});

table(rows);

const mismatches = rows.filter((r) => r.agree !== "");
console.log(
  `\n${mismatches.length === 0 ? "all scenarios matched expectations" : `${mismatches.length} MISMATCH(ES)`}`
);
if (leakSink.length === 0) throw new Error("unreachable");
