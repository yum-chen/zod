/**
 * Per-instance own-property census across every schema type. `funcs` counts
 * own properties whose value is a distinct function per instance — i.e. a
 * closure allocated at construction time that could live on the prototype.
 *
 * V8 switches an object to dictionary mode past ~30 dynamically-added
 * properties, so `own` is also a proxy for whether instances pay for a
 * NameDictionary instead of inline slots.
 */
import * as Schema   from "schema";
import { table } from "./harness.js";

function census(a: any, b: any): { own: number; schema: number; funcs: number; accessors: number } {
  let funcs = 0;
  let accessors = 0;
  for (const [objA, objB] of [
    [a, b],
    [a._schema, b._schema],
  ] as const) {
    for (const key of Reflect.ownKeys(objA)) {
      const d = Object.getOwnPropertyDescriptor(objA, key)!;
      const dB = objB && Object.getOwnPropertyDescriptor(objB, key);
      if (d.get || d.set) {
        if (dB && (d.get !== dB.get || d.set !== dB.set)) accessors++;
      } else if (typeof d.value === "function" && dB && d.value !== dB.value) {
        funcs++;
      }
    }
  }
  return { own: Reflect.ownKeys(a).length, schema: Reflect.ownKeys(a._schema).length, funcs, accessors };
}

const cases: Array<[string, () => any]> = [
  ["string", () => Schema.string()],
  ["number", () => Schema.number()],
  ["boolean", () => Schema.boolean()],
  ["bigint", () => Schema.bigint()],
  ["date", () => Schema.date()],
  ["file", () => Schema.file()],
  ["symbol", () => Schema.symbol()],
  ["literal", () => Schema.literal("a")],
  ["enum", () => Schema.enum(["a", "b"])],
  ["array", () => Schema.array(Schema.string())],
  ["object", () => Schema.object({ a: Schema.string() })],
  ["record", () => Schema.record(Schema.string(), Schema.string())],
  ["map", () => Schema.map(Schema.string(), Schema.string())],
  ["set", () => Schema.set(Schema.string())],
  ["tuple", () => Schema.tuple([Schema.string()])],
  ["union", () => Schema.union([Schema.string(), Schema.number()])],
  ["intersection", () => Schema.intersection(Schema.object({}), Schema.object({}))],
  ["optional", () => Schema.string().optional()],
  ["nullable", () => Schema.string().nullable()],
  ["default", () => Schema.string().default("x")],
  ["catch", () => Schema.string().catch("x")],
  ["pipe", () => Schema.string().pipe(Schema.string())],
  ["lazy", () => Schema.lazy(() => Schema.string())],
  ["promise", () => Schema.promise(Schema.string())],
  ["readonly", () => Schema.string().readonly()],
  ["success", () => Schema.success(Schema.string())],
  ["transform", () => Schema.transform((x) => x)],
  ["email (fmt)", () => Schema.email()],
  ["custom", () => Schema.custom(() => true)],
];

const rows = cases.map(([label, f]) => {
  const c = census(f(), f());
  return {
    schema: label,
    "own(inst)": c.own,
    "own(_schema)": c.schema,
    "per-inst fns": c.funcs,
    "per-inst accessors": c.accessors,
    "dict mode?": c.own > 30 ? "LIKELY" : "",
  };
});
rows.sort((a, b) => (b["per-inst fns"] as number) - (a["per-inst fns"] as number));
table(rows);

const total = rows.reduce((s, r) => s + (r["per-inst fns"] as number), 0);
console.log(`\ntotal per-instance closures across ${rows.length} types: ${total}`);
