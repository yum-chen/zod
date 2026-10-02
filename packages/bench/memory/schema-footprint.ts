import * as Schema   from "schema";
import * as zm from "schema/mini";
import { fmtBytes, measureStable, table } from "./harness.js";

const N = 20_000;

const cases: Array<[string, (i: number) => unknown]> = [
  ["Schema.string()", () => Schema.string()],
  ["Schema.number()", () => Schema.number()],
  ["Schema.boolean()", () => Schema.boolean()],
  ["Schema.literal('a')", () => Schema.literal("a")],
  ["Schema.string().min(1)", () => Schema.string().min(1)],
  ["Schema.string().min(1).max(5)", () => Schema.string().min(1).max(5)],
  ["Schema.string().optional()", () => Schema.string().optional()],
  ["Schema.email()", () => Schema.email()],
  ["Schema.uuid()", () => Schema.uuid()],
  ["Schema.iso.datetime()", () => Schema.iso.datetime()],
  ["Schema.array(Schema.string())", () => Schema.array(Schema.string())],
  ["Schema.enum(['a','b','c'])", () => Schema.enum(["a", "b", "c"])],
  ["Schema.object({}) empty", () => Schema.object({})],
  [
    "Schema.object() 3 keys",
    () =>
      Schema.object({
        a: Schema.string(),
        b: Schema.number(),
        c: Schema.boolean(),
      }),
  ],
  [
    "Schema.object() 10 keys",
    () => {
      const shape: Record<string, Schema.SchemaType> = {};
      for (let k = 0; k < 10; k++) shape[`k${k}`] = Schema.string();
      return Schema.object(shape);
    },
  ],
  [
    "Schema.object() 10 keys (shared leaf)",
    (() => {
      const leaf = Schema.string();
      return () => {
        const shape: Record<string, Schema.SchemaType> = {};
        for (let k = 0; k < 10; k++) shape[`k${k}`] = leaf;
        return Schema.object(shape);
      };
    })(),
  ],
  ["Schema.union([str,num])", () => Schema.union([Schema.string(), Schema.number()])],
  [
    "Schema.discriminatedUnion 2",
    () =>
      Schema.discriminatedUnion("t", [
        Schema.object({ t: Schema.literal("a"), a: Schema.string() }),
        Schema.object({ t: Schema.literal("b"), b: Schema.number() }),
      ]),
  ],
  ["Schema.record(str, num)", () => Schema.record(Schema.string(), Schema.number())],
  ["Schema.tuple([str,num])", () => Schema.tuple([Schema.string(), Schema.number()])],
  ["Schema.lazy(() => str)", () => Schema.lazy(() => Schema.string())],
  ["Schema.string().refine(fn)", () => Schema.string().refine((s) => s.length > 0)],
  ["Schema.string().transform(fn)", () => Schema.string().transform((s) => s.length)],
  ["Schema.string().default('x')", () => Schema.string().default("x")],
  ["Schema.string().brand<'x'>()", () => Schema.string().brand<"x">()],
  ["Schema.string().nullable()", () => Schema.string().nullable()],
  ["Schema.pipe(str, num-ish)", () => Schema.string().pipe(Schema.string())],
  // mini variants for contrast (no method-chaining surface)
  ["mini Schema.string()", () => zm.string()],
  ["mini Schema.object() 3 keys", () => zm.object({ a: zm.string(), b: zm.number(), c: zm.boolean() })],
];

console.log(`per-instance retained heap, n=${N}\n`);

const rows = cases.map(([label, factory]) => {
  const m = measureStable(label, N, factory, 5);
  return { schema: label, bytes: m.bytesEach.toFixed(0), human: fmtBytes(m.bytesEach) };
});

table(rows);
