// This fixture tests Schema's .d.cts types in a CommonJS context

import { Schema } from "schema";

// Basic schema usage
const userSchema = Schema.object({
  name: Schema.string(),
  age: Schema.number().int().positive(),
  email: Schema.string().email(),
  tags: Schema.array(Schema.string()),
  role: Schema.enum(["admin", "user", "guest"]),
  metadata: Schema.record(Schema.string(), Schema.unknown()),
  createdAt: Schema.date(),
});

type User = Schema.infer<typeof userSchema>;

// Parse some data
const result = userSchema.safeParse({
  name: "Alice",
  age: 30,
  email: "alice@example.com",
  tags: ["developer"],
  role: "admin",
  metadata: { foo: "bar" },
  createdAt: new Date(),
});

if (result.success) {
  const user: User = result.data;
  console.log(user.name);
}

// Test various schema types
const complexSchema = Schema.union([
  Schema.object({ type: Schema.literal("a"), value: Schema.string() }),
  Schema.object({ type: Schema.literal("b"), value: Schema.number() }),
]);

const tupleSchema = Schema.tuple([Schema.string(), Schema.number(), Schema.boolean()]);
const intersectionSchema = Schema.intersection(Schema.object({ a: Schema.string() }), Schema.object({ b: Schema.number() }));

// Refinements and transforms
const refinedSchema = Schema.string().refine((s) => s.length > 0);
const transformedSchema = Schema.string().transform((s) => s.toUpperCase());
const pipedSchema = Schema.string().pipe(Schema.string().min(1));

// Optional/nullable
const optionalSchema = Schema.object({
  required: Schema.string(),
  optional: Schema.string().optional(),
  nullable: Schema.string().nullable(),
  nullish: Schema.string().nullish(),
  withDefault: Schema.string().default("default"),
});

export {
  userSchema,
  complexSchema,
  tupleSchema,
  intersectionSchema,
  refinedSchema,
  transformedSchema,
  pipedSchema,
  optionalSchema,
};
