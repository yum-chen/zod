import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/mini";

test("Schema.object", () => {
  const a = Schema.object({
    name: Schema.string(),
    age: Schema.number(),
    points: Schema.optional(Schema.number()),
    "test?": Schema.boolean(),
  });

  a._schema.def.shape["test?"];
  a._schema.def.shape.points._schema.optin;

  type a = Schema.output<typeof a>;

  expectTypeOf<a>().toEqualTypeOf<{
    name: string;
    age: number;
    points?: number | undefined;
    "test?": boolean;
  }>();
  expect(Schema.parse(a, { name: "john", age: 30, "test?": true })).toEqual({
    name: "john",
    age: 30,
    "test?": true,
  });
  // "test?" is required in SchemaObject
  expect(() => Schema.parse(a, { name: "john", age: "30" })).toThrow();
  expect(() => Schema.parse(a, "hello")).toThrow();

  // null prototype
  const schema = Schema.object({ a: Schema.string() });
  const obj = Object.create(null);
  obj.a = "foo";
  expect(Schema.parse(obj)).toEqual({ a: "foo" });
});

test("Schema.object().check()", () => {
  const a = Schema.object({
    name: Schema.string(),
    age: Schema.number(),
    points: Schema.optional(Schema.number()),
    "test?": Schema.boolean(),
  });

  type a = Schema.output<typeof a>;

  a.check(({ value }) => {
    expectTypeOf(value).toEqualTypeOf<a>();
  });
});

test("Schema.strictObject", () => {
  const a = Schema.strictObject({
    name: Schema.string(),
  });
  expect(Schema.parse(a, { name: "john" })).toEqual({ name: "john" });
  expect(() => Schema.parse(a, { name: "john", age: 30 })).toThrow();
  expect(() => Schema.parse(a, "hello")).toThrow();
});

test("Schema.looseObject", () => {
  const a = Schema.looseObject({
    name: Schema.string(),
    age: Schema.number(),
  });
  expect(Schema.parse(a, { name: "john", age: 30 })).toEqual({
    name: "john",
    age: 30,
  });
  expect(Schema.parse(a, { name: "john", age: 30, extra: true })).toEqual({
    name: "john",
    age: 30,
    extra: true,
  });
  expect(() => Schema.parse(a, "hello")).toThrow();
});

const userSchema = Schema.object({
  name: Schema.string(),
  age: Schema.number(),
  email: Schema.optional(Schema.string()),
});

test("Schema.keyof", () => {
  // Schema.keyof returns an enum schema of the keys of an object schema
  const userKeysSchema = Schema.keyof(userSchema);
  type UserKeys = Schema.infer<typeof userKeysSchema>;
  expectTypeOf<UserKeys>().toEqualTypeOf<"name" | "age" | "email">();
  expect(userKeysSchema).toBeDefined();
  expect(userKeysSchema._schema.def.type).toBe("enum");
  expect(userKeysSchema._schema.def.entries).toEqual({
    name: "name",
    age: "age",
    email: "email",
  });
  expect(Schema.safeParse(userKeysSchema, "name").success).toBe(true);
  expect(Schema.safeParse(userKeysSchema, "age").success).toBe(true);
  expect(Schema.safeParse(userKeysSchema, "email").success).toBe(true);
  expect(Schema.safeParse(userKeysSchema, "isAdmin").success).toBe(false);
});

test("Schema.extend", () => {
  const extendedSchema = Schema.extend(userSchema, {
    isAdmin: Schema.boolean(),
  });
  type ExtendedUser = Schema.infer<typeof extendedSchema>;
  expectTypeOf<ExtendedUser>().toEqualTypeOf<{
    name: string;
    age: number;
    email?: string | undefined;
    isAdmin: boolean;
  }>();
  expect(extendedSchema).toBeDefined();
  expect(Schema.safeParse(extendedSchema, { name: "John", age: 30, isAdmin: true }).success).toBe(true);
});

test("Schema.merge", () => {
  const mergedSchema = Schema.merge(userSchema, Schema.object({ isAdmin: Schema.boolean() }));
  type MergedUser = Schema.infer<typeof mergedSchema>;
  expectTypeOf<MergedUser>().toEqualTypeOf<{
    name: string;
    age: number;
    email?: string | undefined;
    isAdmin: boolean;
  }>();
  expect(Schema.safeParse(mergedSchema, { name: "John", age: 30, isAdmin: true }).success).toBe(true);

  // the second schema's catchall wins, matching classic
  const strict = Schema.merge(userSchema, Schema.strictObject({ isAdmin: Schema.boolean() }));
  expect(Schema.safeParse(strict, { name: "John", age: 30, isAdmin: true, extra: 1 }).success).toBe(false);

  expect(() =>
    // @ts-expect-error second argument is a schema, not a shape
    Schema.merge(userSchema, { isAdmin: Schema.boolean() })
  ).toThrow("Invalid input to merge");
});

test("Schema.safeExtend", () => {
  const extended = Schema.safeExtend(userSchema, { name: Schema.string() });
  expect(Schema.safeParse(extended, { name: "John", age: 30 }).success).toBe(true);
  type Extended = Schema.infer<typeof extended>;
  expectTypeOf<Extended>().toEqualTypeOf<{ name: string; age: number; email?: string | undefined }>();
  // @ts-expect-error
  Schema.safeExtend(userSchema, { name: Schema.number() });
});

test("Schema.pick", () => {
  const pickedSchema = Schema.pick(userSchema, { name: true, email: true });
  type PickedUser = Schema.infer<typeof pickedSchema>;
  expectTypeOf<PickedUser>().toEqualTypeOf<{ name: string; email?: string | undefined }>();
  expect(pickedSchema).toBeDefined();
  expect(Schema.safeParse(pickedSchema, { name: "John", email: "john@example.com" }).success).toBe(true);
});

test("Schema.omit", () => {
  const omittedSchema = Schema.omit(userSchema, { age: true });
  type OmittedUser = Schema.infer<typeof omittedSchema>;
  expectTypeOf<OmittedUser>().toEqualTypeOf<{
    name: string;
    email?: string | undefined;
  }>();
  expect(omittedSchema).toBeDefined();
  expect(Reflect.ownKeys(omittedSchema._schema.def.shape)).toEqual(["name", "email"]);
  expect(Schema.safeParse(omittedSchema, { name: "John", email: "john@example.com" }).success).toBe(true);
});

test("Schema.partial", () => {
  const partialSchema = Schema.partial(userSchema);
  type PartialUser = Schema.infer<typeof partialSchema>;
  expectTypeOf<PartialUser>().toEqualTypeOf<{
    name?: string | undefined;
    age?: number | undefined;
    email?: string | undefined;
  }>();
  expect(Schema.safeParse(partialSchema, { name: "John" }).success).toBe(true);
});

test("Schema.partial with mask", () => {
  const partialSchemaWithMask = Schema.partial(userSchema, { name: true });
  type PartialUserWithMask = Schema.infer<typeof partialSchemaWithMask>;
  expectTypeOf<PartialUserWithMask>().toEqualTypeOf<{
    name?: string | undefined;
    age: number;
    email?: string | undefined;
  }>();
  expect(Schema.safeParse(partialSchemaWithMask, { age: 30 }).success).toBe(true);
  expect(Schema.safeParse(partialSchemaWithMask, { name: "John" }).success).toBe(false);
});

test("Schema.exactPartial", () => {
  const partialSchema = Schema.exactPartial(userSchema);
  type PartialUser = Schema.infer<typeof partialSchema>;
  expectTypeOf<PartialUser>().toEqualTypeOf<{
    name?: string;
    age?: number;
    email?: string | undefined;
  }>();
  expect(Schema.safeParse(partialSchema, { name: "John" }).success).toBe(true);
  expect(Schema.safeParse(partialSchema, {}).success).toBe(true);
  expect(Schema.safeParse(partialSchema, { name: undefined }).success).toBe(false);
  expect(Schema.safeParse(partialSchema, { email: undefined }).success).toBe(true);
});

test("Schema.exactPartial with mask", () => {
  const partialSchemaWithMask = Schema.exactPartial(userSchema, { name: true });
  type PartialUserWithMask = Schema.infer<typeof partialSchemaWithMask>;
  expectTypeOf<PartialUserWithMask>().toEqualTypeOf<{
    name?: string;
    age: number;
    email?: string | undefined;
  }>();
  expect(Schema.safeParse(partialSchemaWithMask, { age: 30 }).success).toBe(true);
  expect(Schema.safeParse(partialSchemaWithMask, { age: 30, name: undefined }).success).toBe(false);
});

test("Schema.required", () => {
  const requiredSchema = Schema.required(userSchema);
  type RequiredUser = Schema.infer<typeof requiredSchema>;
  expectTypeOf<RequiredUser>().toEqualTypeOf<{ name: string; age: number; email: string }>();
  expect(requiredSchema.shape.email).toBeInstanceOf(Schema.SchemaMiniNonOptional);
  expect(Schema.safeParse(requiredSchema, { name: "John", age: 30 }).success).toBe(false);
  expect(Schema.safeParse(requiredSchema, { name: "John", age: 30, email: "john@example.com" }).success).toBe(true);
});

test("Schema.required with mask", () => {
  const schema = Schema.object({ name: Schema.optional(Schema.string()), age: Schema.optional(Schema.number()) });
  const requiredSchemaWithMask = Schema.required(schema, { name: true });
  type RequiredWithMask = Schema.infer<typeof requiredSchemaWithMask>;
  expectTypeOf<RequiredWithMask>().toEqualTypeOf<{ name: string; age?: number | undefined }>();
  expect(requiredSchemaWithMask.shape.name).toBeInstanceOf(Schema.SchemaMiniNonOptional);
  expect(requiredSchemaWithMask.shape.age).toBeInstanceOf(Schema.SchemaMiniOptional);
});

test("Schema.pick/omit/partial/required - do not allow unknown keys", () => {
  const schema = Schema.object({
    name: Schema.string(),
    age: Schema.number(),
  });

  // Mixed valid + invalid keys - throws at parse time (lazy evaluation)
  // @ts-expect-error
  expect(() => Schema.parse(Schema.pick(schema, { name: true, asdf: true }), {})).toThrow();
  // @ts-expect-error
  expect(() => Schema.parse(Schema.omit(schema, { name: true, asdf: true }), {})).toThrow();
  // @ts-expect-error
  expect(() => Schema.parse(Schema.partial(schema, { name: true, asdf: true }), {})).toThrow();
  // @ts-expect-error
  expect(() => Schema.parse(Schema.required(schema, { name: true, asdf: true }), {})).toThrow();

  // Only invalid keys
  // @ts-expect-error
  expect(() => Schema.parse(Schema.pick(schema, { $unknown: true }), {})).toThrow();
  // @ts-expect-error
  expect(() => Schema.parse(Schema.omit(schema, { $unknown: true }), {})).toThrow();
  // @ts-expect-error
  expect(() => Schema.parse(Schema.partial(schema, { $unknown: true }), {})).toThrow();
  // @ts-expect-error
  expect(() => Schema.parse(Schema.required(schema, { $unknown: true }), {})).toThrow();
});

test("Schema.catchall", () => {
  // Schema.catchall()
  const schema = Schema.catchall(
    Schema.object({
      name: Schema.string(),
      // age: Schema.number(),
    }),
    Schema.string()
  );

  type schemaIn = Schema.input<typeof schema>;
  type schemaOut = Schema.output<typeof schema>;
  expectTypeOf<schemaIn>().toEqualTypeOf<{
    name: string;
    [key: string]: string;
  }>();

  expectTypeOf<schemaOut>().toEqualTypeOf<{
    name: string;
    [key: string]: string;
  }>();

  Schema.parse({
    name: "john",
    age: "30",
    extra: "extra value",
  });

  expect(() => Schema.parse({ name: "john", age: 30 })).toThrow();
});
