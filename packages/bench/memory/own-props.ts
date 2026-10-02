/**
 * Enumerates exactly what each schema instance owns: own properties on the
 * instance and on `_schema`, split by whether the value is a per-instance
 * function (a closure allocated at construction) or shared/data.
 */
import * as Schema   from "schema";
import { table } from "./harness.js";

function describe(label: string, a: any, b: any): void {
  const report: Array<{ where: string; key: string; kind: string; perInstance: string }> = [];

  for (const [where, objA, objB] of [
    ["inst", a, b],
    ["_schema", a._schema, b._schema],
  ] as const) {
    for (const key of Reflect.ownKeys(objA)) {
      const d = Object.getOwnPropertyDescriptor(objA, key)!;
      const dB = Object.getOwnPropertyDescriptor(objB, key);
      let kind: string;
      let perInstance: string;
      if (d.get || d.set) {
        kind = `accessor${d.get ? " get" : ""}${d.set ? " set" : ""}`;
        // Accessor pairs defined per-instance are distinct function objects.
        perInstance = dB && (d.get !== dB.get || d.set !== dB.set) ? "YES" : "no";
      } else {
        const v = d.value;
        kind = typeof v === "function" ? "function" : Array.isArray(v) ? `array[${v.length}]` : typeof v;
        perInstance = dB && typeof v === "object" && v !== null ? (v !== dB.value ? "YES" : "no") : "";
        if (typeof v === "function") perInstance = dB && v !== dB.value ? "YES" : "no";
      }
      report.push({ where, key: String(key), kind, perInstance });
    }
  }

  const closures = report.filter(
    (r) => (r.kind === "function" || r.kind.startsWith("accessor")) && r.perInstance === "YES"
  );
  const objects = report.filter((r) => r.kind === "object" && r.perInstance === "YES");

  console.log(`\n=== ${label} ===`);
  console.log(
    `own props: inst=${Reflect.ownKeys(a).length}, _schema=${Reflect.ownKeys(a._schema).length}` +
      `  |  per-instance functions: ${closures.length}, per-instance objects: ${objects.length}`
  );
  table(report);
}

describe("Schema.string()", Schema.string(), Schema.string());
describe("Schema.object({a: string})", Schema.object({ a: Schema.string() }), Schema.object({ a: Schema.string() }));
