/**
 * Whole-application memory: how much heap does a realistically-sized schema
 * catalogue cost? This is the number a service actually pays — a few hundred
 * schemas held for the process lifetime, each with nested objects, unions,
 * arrays and refinements.
 */
import * as Schema   from "schema";
import { collect, fmtBytes, table } from "./harness.js";

/** One "resource" the way an API codebase tends to define them. */
function makeResource(i: number) {
  const Address = Schema.object({
    street: Schema.string().min(1).max(200),
    city: Schema.string().min(1),
    postalCode: Schema.string().regex(/^\d{5}$/),
    country: Schema.string().length(2),
  });

  const Contact = Schema.object({
    email: Schema.email(),
    phone: Schema.string().optional(),
    address: Address.optional(),
  });

  const Status = Schema.enum(["active", "pending", "archived", "deleted"]);

  const Event = Schema.discriminatedUnion("kind", [
    Schema.object({ kind: Schema.literal("created"), at: Schema.iso.datetime(), by: Schema.uuid() }),
    Schema.object({ kind: Schema.literal("updated"), at: Schema.iso.datetime(), fields: Schema.array(Schema.string()) }),
    Schema.object({ kind: Schema.literal("deleted"), at: Schema.iso.datetime(), reason: Schema.string().nullable() }),
  ]);

  return z
    .object({
      id: Schema.uuid(),
      slug: Schema.string().regex(/^[a-z0-9-]+$/),
      title: Schema.string().min(1).max(300),
      description: Schema.string().max(5000).optional(),
      status: Status,
      count: Schema.number().int().nonnegative(),
      score: Schema.number().min(0).max(100),
      tags: Schema.array(Schema.string().min(1)).max(50),
      contact: Contact,
      history: Schema.array(Event),
      metadata: Schema.record(Schema.string(), Schema.unknown()).optional(),
      createdAt: Schema.iso.datetime(),
      updatedAt: Schema.iso.datetime().nullable(),
    })
    .refine((v) => v.createdAt <= (v.updatedAt ?? v.createdAt), `resource ${i}: updatedAt precedes createdAt`);
}

const COUNTS = [50, 200, 500];

const rows = COUNTS.map((n) => {
  // Warm the lazily-installed prototypes so they aren't billed to the payload.
  makeResource(-1);
  collect();
  const before = process.memoryUsage().heapUsed;

  const catalogue: unknown[] = [];
  for (let i = 0; i < n; i++) catalogue.push(makeResource(i));

  collect();
  const after = process.memoryUsage().heapUsed;
  if (catalogue.length !== n) throw new Error("unreachable");

  return {
    "resource schemas": n,
    "heap held": fmtBytes(after - before),
    "per resource": fmtBytes((after - before) / n),
    bytes: (after - before).toFixed(0),
  };
});

console.log("realistic schema catalogue (each resource is ~40 schema nodes)\n");
table(rows);
