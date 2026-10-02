import { spawnSync } from "node:child_process";
import * as Schema   from "schema";
import { INVALID, SchemaCompileUnsupportedError, compile, compileFn } from "schema/v4/core";

// Broad compiled-vs-runtime sweep across schema categories.
//
// Methodology: absolute ops/sec on a laptop drifts by tens of percent between runs (thermal state, other processes), so a table of absolute numbers taken minutes apart is not comparable. Each case therefore measures runtime and compiled *interleaved* inside one round and keeps the best of N rounds — the minimum time is the closest estimate of the noise floor, and the speedup is a ratio of two measurements taken microseconds apart. Correctness is checked before timing: a fast path that returns the wrong value is not faster.

interface Case {
  group: string;
  name: string;
  schema: Schema.SchemaType;
  input: unknown;
}

const cases: Case[] = [];
const add = (group: string, name: string, schema: Schema.SchemaType, input: unknown) =>
  cases.push({ group, name, schema, input });

// --- primitives ---
add("primitive", "string", Schema.string(), "hello world");
add("primitive", "number", Schema.number(), 42.5);
add("primitive", "boolean", Schema.boolean(), true);
add("primitive", "bigint", Schema.bigint(), 123n);
add("primitive", "date", Schema.date(), new Date());
add("primitive", "literal", Schema.literal("active"), "active");
add("primitive", "enum (4)", Schema.enum(["a", "b", "c", "d"]), "c");

// --- string formats + checks ---
add(
  "string",
  "min/max/regex",
  z
    .string()
    .min(3)
    .max(64)
    .regex(/^[a-z ]+$/),
  "hello world"
);
add("string", "email", Schema.email(), "user@example.com");
add("string", "uuid", Schema.uuid(), "550e8400-e29b-41d4-a716-446655440000");
add("string", "url", Schema.url(), "https://example.com/a/b?c=1");
add("string", "iso.datetime", Schema.iso.datetime(), "2026-08-16T12:00:00Z");
add("string", "base64", Schema.base64(), "aGVsbG8gd29ybGQ=");
add("string", "creditCard", Schema.creditCard(), "4111111111111111");
add("string", "iban", Schema.iban(), "DE89370400440532013000");
add("string", "trim + toLowerCase", Schema.string().trim().toLowerCase(), "  MiXeD Case  ");

// --- numbers ---
add("number", "int + range", Schema.number().int().min(0).max(1000), 500);
add("number", "int32", Schema.int32(), 1234);
add("number", "multipleOf", Schema.number().multipleOf(0.5), 12.5);

// --- objects ---
const flat = { a: "x", b: 1, c: true, d: "y", e: 2 };
add(
  "object",
  "flat (5 keys)",
  Schema.object({ a: Schema.string(), b: Schema.number(), c: Schema.boolean(), d: Schema.string(), e: Schema.number() }),
  flat
);
add(
  "object",
  "strict (5 keys)",
  Schema.strictObject({ a: Schema.string(), b: Schema.number(), c: Schema.boolean(), d: Schema.string(), e: Schema.number() }),
  flat
);
add("object", "loose (5 keys)", Schema.looseObject({ a: Schema.string(), b: Schema.number() }), { a: "x", b: 1, extra: "kept" });
add("object", "catchall", Schema.object({ a: Schema.string() }).catchall(Schema.number()), { a: "x", n1: 1, n2: 2 });

const moltar = Schema.object({
  number: Schema.number(),
  negNumber: Schema.number(),
  maxNumber: Schema.number(),
  string: Schema.string(),
  longString: Schema.string(),
  boolean: Schema.boolean(),
  deeplyNested: Schema.object({ foo: Schema.string(), num: Schema.number(), bool: Schema.boolean() }),
});
add("object", "nested (moltar)", moltar, {
  number: 1,
  negNumber: -1,
  maxNumber: Number.MAX_VALUE,
  string: "string",
  longString: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
  boolean: true,
  deeplyNested: { foo: "bar", num: 1, bool: false },
});

add(
  "object",
  "optional keys",
  Schema.object({ a: Schema.string(), b: Schema.string().optional(), c: Schema.number().optional(), d: Schema.boolean().optional() }),
  { a: "x", c: 3 }
);
add("object", "defaults", Schema.object({ a: Schema.string().default("d"), b: Schema.number().default(7), c: Schema.boolean() }), {
  c: true,
});
add(
  "object",
  "wide (20 keys)",
  Schema.object(Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`k${i}`, Schema.string()]))) as Schema  .SchemaType,
  Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`k${i}`, "v"]))
);

// --- collections ---
add(
  "collection",
  "array<number> x100",
  Schema.array(Schema.number()),
  Array.from({ length: 100 }, (_, i) => i)
);
add(
  "collection",
  "array<string> x10",
  Schema.array(Schema.string()),
  Array.from({ length: 10 }, (_, i) => `s${i}`)
);
add(
  "collection",
  "array<object> x10",
  Schema.array(Schema.object({ id: Schema.number(), name: Schema.string() })),
  Array.from({ length: 10 }, (_, i) => ({ id: i, name: `n${i}` }))
);
add("collection", "tuple", Schema.tuple([Schema.string(), Schema.number(), Schema.boolean()]), ["a", 1, true]);
add("collection", "set", Schema.set(Schema.number()), new Set([1, 2, 3, 4, 5]));
add(
  "collection",
  "map",
  Schema.map(Schema.string(), Schema.number()),
  new Map([
    ["a", 1],
    ["b", 2],
  ])
);

// --- records (the key-schema path) ---
const rec20 = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`k${i}`, i]));
add("record", "string keys x20", Schema.record(Schema.string(), Schema.number()), rec20);
add(
  "record",
  "email keys x20",
  Schema.record(Schema.email(), Schema.number()),
  Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`u${i}@e.com`, i]))
);
add("record", "checked keys x20", Schema.record(Schema.string().min(2), Schema.number()), rec20);
add(
  "record",
  "number keys x20",
  Schema.record(Schema.number(), Schema.string()),
  Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i, `v${i}`]))
);
add("record", "enum keys", Schema.record(Schema.enum(["a", "b", "c"]), Schema.number()), { a: 1, b: 2, c: 3 });
add(
  "record",
  "loose email keys x20",
  Schema.looseRecord(Schema.email(), Schema.number()),
  Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`u${i}@e.com`, i]))
);

// --- unions ---
add("union", "primitives (3)", Schema.union([Schema.string(), Schema.number(), Schema.boolean()]), 42);
add(
  "union",
  "objects (3, last match)",
  Schema.union([Schema.object({ a: Schema.string() }), Schema.object({ b: Schema.number() }), Schema.object({ c: Schema.boolean() })]),
  { c: true }
);
const du = (n: number) =>
  Schema.discriminatedUnion(
    "kind",
    Array.from({ length: n }, (_, i) => Schema.object({ kind: Schema.literal(`k${i}`), v: Schema.number() }))
  ) as Schema  .SchemaType;
add("union", "discriminated (3)", du(3), { kind: "k2", v: 1 });
add("union", "discriminated (10)", du(10), { kind: "k9", v: 1 });

// --- wrappers ---
add("wrapper", "optional", Schema.string().optional(), "x");
add("wrapper", "nullable", Schema.string().nullable(), null);
add("wrapper", "default (absent)", Schema.string().default("d"), undefined);
add("wrapper", "readonly object", Schema.object({ a: Schema.string() }).readonly(), { a: "x" });
add("wrapper", "catch", Schema.number().catch(0), "not a number");

// --- refinements / transforms ---
add(
  "refine",
  "refine",
  Schema.number().refine((n) => n > 0),
  5
);
add(
  "refine",
  "transform",
  Schema.string().transform((s) => s.length),
  "hello"
);
add(
  "refine",
  "overwrite",
  Schema.string().overwrite((s) => s.toUpperCase()),
  "hello"
);
add("refine", "pipe", Schema.string().pipe(Schema.string().min(2)), "hello");
add(
  "refine",
  "object + refine",
  Schema.object({ a: Schema.number(), b: Schema.number() }).refine((o) => o.a < o.b),
  { a: 1, b: 2 }
);

// --- intersections ---
add("intersect", "two objects", Schema.intersection(Schema.object({ a: Schema.string() }), Schema.object({ b: Schema.number() })), {
  a: "x",
  b: 1,
});

// --- known fallbacks (expect ~1x; here to prove they aren't slower) ---
const tree: Schema.SchemaType = Schema.object({
  v: Schema.number(),
  get kids() {
    return Schema.array(tree);
  },
}) as Schema  .SchemaType;
add("fallback", "recursive tree", tree, { v: 1, kids: [{ v: 2, kids: [] }] });
add("fallback", "xor", Schema.xor([Schema.object({ a: Schema.string() }), Schema.object({ b: Schema.number() })]) as Schema  .SchemaType, { a: "x" });

// ---------------------------------------------------------------------------

function deepEq(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== "object") {
    return Number.isNaN(a) && Number.isNaN(b);
  }
  if (a instanceof Set && b instanceof Set) return a.size === b.size && [...a].every((v) => b.has(v));
  if (a instanceof Map && b instanceof Map) return a.size === b.size && [...a].every(([k, v]) => deepEq(b.get(k), v));
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEq((a as any)[k], (b as any)[k]));
}

const ROUNDS = 15;

function timed(fn: () => void, iters: number): number {
  const start = process.hrtime.bigint();
  for (let i = 0; i < iters; i++) fn();
  return Number(process.hrtime.bigint() - start) / 1e6; // ms
}

/** Iterations that put one measurement near ~40ms, so a round is short but not noise. */
function calibrate(fn: () => void): number {
  let iters = 64;
  for (;;) {
    const ms = timed(fn, iters);
    if (ms > 25 || iters > 4_000_000) return iters;
    iters = Math.max(iters * 2, Math.ceil((iters * 40) / Math.max(ms, 0.05)));
  }
}

interface Row {
  group: string;
  name: string;
  runtime: number;
  compiled: number;
  raw: number | null;
  status: string;
}

const fmt = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : n.toFixed(0);
const pad = (s: string, n: number) => s.padEnd(n);
const padL = (s: string, n: number) => s.padStart(n);

function report(rows: Row[], problems: string[]): void {
  console.log();
  console.log(
    `compiled vs runtime — best of ${ROUNDS} interleaved rounds, ops/sec (${isolate ? "one process per schema" : "one shared process"})`
  );
  console.log();
  console.log(
    `${pad("group", 11)}${pad("schema", 24)}${padL("runtime", 10)}${padL("compiled", 10)}${padL("raw fast", 10)}${padL("speedup", 10)}  status`
  );
  console.log("-".repeat(88));

  let lastGroup = "";
  for (const r of rows) {
    const speedup = r.compiled / r.runtime;
    console.log(
      `${pad(r.group === lastGroup ? "" : r.group, 11)}${pad(r.name, 24)}${padL(fmt(r.runtime), 10)}${padL(fmt(r.compiled), 10)}${padL(r.raw ? fmt(r.raw) : "-", 10)}${padL(`${speedup.toFixed(2)}x`, 10)}  ${r.status}`
    );
    lastGroup = r.group;
  }

  const compiledRows = rows.filter((r) => r.status === "compiled");
  const speedups = compiledRows.map((r) => r.compiled / r.runtime).sort((a, b) => a - b);
  console.log("-".repeat(88));
  if (speedups.length) {
    console.log(
      `${compiledRows.length}/${rows.length} compiled — speedup median ${speedups[Math.floor(speedups.length / 2)].toFixed(2)}x, range ${speedups[0].toFixed(2)}x–${speedups[speedups.length - 1].toFixed(2)}x`
    );
    const slower = compiledRows.filter((r) => r.compiled < r.runtime);
    if (slower.length) {
      console.log(`slower compiled than uncompiled (${slower.length}):`);
      for (const r of slower) console.log(`  ${r.group}/${r.name} ${(r.compiled / r.runtime).toFixed(2)}x`);
    }
  }
  for (const r of rows.filter((x) => x.status !== "compiled")) {
    console.log(`  ${r.status}: ${r.group}/${r.name} (${(r.compiled / r.runtime).toFixed(2)}x)`);
  }
  if (problems.length) {
    console.log();
    console.log("PROBLEMS:");
    for (const p of problems) console.log(`  ${p}`);
  }
  console.log();
}

// Every case shares one `safeParse` call site, and so do schema's own internal dispatch sites. Run all 55 in one process and those caches go megamorphic, which taxes the interpreter more than it taxes a single generated function, so the same schema reads faster compiled that way (median 2.4x) than it does measured alone (1.6x). Neither is wrong; they answer different questions, and the default is the shared one because an application holds many schemas at once and that is the number its users will see. `--isolate` runs one child process per case, which is what to use when tuning a single Schema.
const arg = process.argv[2];
const isolate = arg === "--isolate";
const filter = isolate ? undefined : arg;
const match = (c: Case) => {
  const id = `${c.group}/${c.name}`;
  return filter!.includes("/") ? id === filter : id.includes(filter!);
};
const selected = filter ? cases.filter(match) : cases;

const rows: Row[] = [];
const problems: string[] = [];

// Parent driver: one child per case, each measuring a single schema in a fresh process. Children re-enter this file with the case id; execArgv carries the runtime flags and `--conditions`, so the child resolves schema the same way.
if (!filter && isolate) {
  for (const c of cases) {
    const id = `${c.group}/${c.name}`;
    const child = spawnSync(process.argv[0], [...process.execArgv, process.argv[1], id], {
      encoding: "utf8",
      env: { ...process.env, ZOD_BENCH_CHILD: "1" },
    });
    const line = child.stdout?.split("\n").find((l) => l.startsWith("ROW "));
    if (line) rows.push(JSON.parse(line.slice(4)));
    else
      problems.push(
        `${id}: child produced no result${child.stderr ? ` (${child.stderr.trim().split("\n").pop()})` : ""}`
      );
  }
  report(rows, problems);
  process.exit(0);
}

// Consumed by every timed call and printed at the end. Without this V8 sees the parse result is dead and eliminates the call outright, reporting a trivial schema at an impossible ~1.6ns/op. `escaped` additionally defeats escape analysis: left un-escaped, the result object is stack-allocated and the measurement stops resembling a caller that actually keeps its data.
let sink = 0;
let escaped: unknown;

for (const c of selected) {
  // Feed the input through an array load. Passed as a constant the whole call is
  // loop-invariant and V8 hoists it out of the timing loop — plain interpreter
  // code far more readily than an opaque `new Function` closure, which flatters
  // the runtime by ~1.9x on cheap schemas. An array read is enough to stop it;
  // the values do not need to differ (measured: identical either way).
  const pool = Array.from({ length: 64 }, () => c.input);
  let idx = 0;
  const runtimeParse = () => {
    const r = c.Schema.safeParse(pool[idx++ & 63]);
    sink += r.success ? 1 : 0;
    escaped = r;
  };

  let compiledSchema: Schema.SchemaType | null = null;
  let status = "compiled";
  try {
    // Strict: this table classifies refusals, so it wants the error rather than the silent uncompiled fallback.
    compiledSchema = compile(c.schema, { strict: true });
  } catch (err) {
    status = err instanceof SchemaCompileUnsupportedError ? "fallback" : `refused: ${(err as Error).name}`;
  }

  // Correctness gate. Benchmarking a fast path that disagrees with the runtime measures the wrong thing, so a mismatch is reported instead of timed.
  const expected = c.Schema.safeParse(c.input);
  if (!expected.success) {
    problems.push(`${c.group}/${c.name}: input does not parse under the runtime`);
    continue;
  }
  if (compiledSchema) {
    const got = compiledSchema.safeParse(c.input);
    if (!got.success || !deepEq(got.data, expected.data)) {
      problems.push(`${c.group}/${c.name}: compiled output differs from runtime`);
      continue;
    }
  }

  // Did the fast path actually produce this value, or silently fall through?
  let rawFn: (() => void) | null = null;
  if (compiledSchema) {
    try {
      const fp = compileFn(c.schema);
      if (fp(c.input) === INVALID) status = "fallthrough";
      else
        rawFn = () => {
          const v = fp(pool[idx++ & 63]);
          sink += v === INVALID ? 0 : 1;
          escaped = v;
        };
    } catch {
      status = "fallback";
    }
  }

  const compiledParse = compiledSchema
    ? () => {
        const r = compiledSchema.safeParse(pool[idx++ & 63]);
        sink += r.success ? 1 : 0;
        escaped = r;
      }
    : runtimeParse;

  const iters = calibrate(runtimeParse);
  for (let i = 0; i < 3; i++) {
    runtimeParse();
    compiledParse();
    rawFn?.();
  }

  let bestRuntime = Number.POSITIVE_INFINITY;
  let bestCompiled = Number.POSITIVE_INFINITY;
  let bestRaw = Number.POSITIVE_INFINITY;
  for (let r = 0; r < ROUNDS; r++) {
    bestRuntime = Math.min(bestRuntime, timed(runtimeParse, iters));
    bestCompiled = Math.min(bestCompiled, timed(compiledParse, iters));
    if (rawFn) bestRaw = Math.min(bestRaw, timed(rawFn, iters));
  }

  rows.push({
    group: c.group,
    name: c.name,
    runtime: (iters / bestRuntime) * 1000,
    compiled: (iters / bestCompiled) * 1000,
    raw: rawFn ? (iters / bestRaw) * 1000 : null,
    status,
  });
}

// A child reports its one row to the parent; nothing else it prints is read.
if (process.env.ZOD_BENCH_CHILD === "1") {
  for (const r of rows) console.log(`ROW ${JSON.stringify(r)}`);
  process.exit(0);
}

report(rows, problems);
console.log(`(sink ${sink}${escaped === undefined ? "" : ""})`);
