import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";

const nested = Schema.object({
  name: Schema.string(),
  age: Schema.number(),
  outer: Schema.object({
    inner: Schema.string(),
  }),
  array: Schema.array(Schema.object({ asdf: Schema.string() })),
});

test("shallow inference", () => {
  const shallow = nested.partial();
  type shallow = Schema.infer<typeof shallow>;

  expectTypeOf<shallow>().toEqualTypeOf<{
    name?: string | undefined;
    age?: number | undefined;
    outer?: { inner: string } | undefined;
    array?: { asdf: string }[] | undefined;
  }>();
});

test("shallow partial parse", () => {
  const shallow = nested.partial();
  shallow.parse({});
  shallow.parse({
    name: "asdf",
    age: 23143,
  });
});

test("required", () => {
  const object = Schema.object({
    name: Schema.string(),
    age: Schema.number().optional(),
    field: Schema.string().optional().default("asdf"),
    nullableField: Schema.number().nullable(),
    nullishField: Schema.string().nullish(),
  });

  const requiredObject = object.required();
  expect(requiredObject.shape.name).toBeInstanceOf(Schema.SchemaNonOptional);
  expect(requiredObject.shape.name.unwrap()).toBeInstanceOf(Schema.SchemaString);
  expect(requiredObject.shape.age).toBeInstanceOf(Schema.SchemaNonOptional);
  expect(requiredObject.shape.age.unwrap()).toBeInstanceOf(Schema.SchemaOptional);
  expect(requiredObject.shape.field).toBeInstanceOf(Schema.SchemaNonOptional);
  expect(requiredObject.shape.field.unwrap()).toBeInstanceOf(Schema.SchemaDefault);
  expect(requiredObject.shape.nullableField).toBeInstanceOf(Schema.SchemaNonOptional);
  expect(requiredObject.shape.nullableField.unwrap()).toBeInstanceOf(Schema.SchemaNullable);
  expect(requiredObject.shape.nullishField).toBeInstanceOf(Schema.SchemaNonOptional);
  expect(requiredObject.shape.nullishField.unwrap()).toBeInstanceOf(Schema.SchemaOptional);
  expect(requiredObject.shape.nullishField.unwrap().unwrap()).toBeInstanceOf(Schema.SchemaNullable);
});

test("required inference", () => {
  const object = Schema.object({
    name: Schema.string(),
    age: Schema.number().optional(),
    field: Schema.string().optional().default("asdf"),
    nullableField: Schema.number().nullable(),
    nullishField: Schema.string().nullish(),
  });

  const requiredObject = object.required();

  type required = Schema.infer<typeof requiredObject>;
  type expected = {
    name: string;
    age: number;
    field: string;
    nullableField: number | null;
    nullishField: string | null;
  };
  expectTypeOf<expected>().toEqualTypeOf<required>();
});

test("required with mask", () => {
  const object = Schema.object({
    name: Schema.string(),
    age: Schema.number().optional(),
    field: Schema.string().optional().default("asdf"),
    country: Schema.string().optional(),
  });

  const requiredObject = object.required({ age: true });
  expect(requiredObject.shape.name).toBeInstanceOf(Schema.SchemaString);
  expect(requiredObject.shape.age).toBeInstanceOf(Schema.SchemaNonOptional);
  expect(requiredObject.shape.field).toBeInstanceOf(Schema.SchemaDefault);
  expect(requiredObject.shape.country).toBeInstanceOf(Schema.SchemaOptional);
});

test("required with mask -- ignore falsy values", () => {
  const object = Schema.object({
    name: Schema.string(),
    age: Schema.number().optional(),
    field: Schema.string().optional().default("asdf"),
    country: Schema.string().optional(),
  });

  // @ts-expect-error
  const requiredObject = object.required({ age: true, country: false });
  expect(requiredObject.shape.name).toBeInstanceOf(Schema.SchemaString);
  expect(requiredObject.shape.age).toBeInstanceOf(Schema.SchemaNonOptional);
  expect(requiredObject.shape.field).toBeInstanceOf(Schema.SchemaDefault);
  expect(requiredObject.shape.country).toBeInstanceOf(Schema.SchemaOptional);
});

test("partial with mask", async () => {
  const object = Schema.object({
    name: Schema.string(),
    age: Schema.number().optional(),
    field: Schema.string().optional().default("asdf"),
    country: Schema.string(),
  });

  const masked = object.partial({ age: true, field: true, name: true }).strict();

  expect(masked.shape.name).toBeInstanceOf(Schema.SchemaOptional);
  expect(masked.shape.age).toBeInstanceOf(Schema.SchemaOptional);
  expect(masked.shape.field).toBeInstanceOf(Schema.SchemaOptional);
  expect(masked.shape.country).toBeInstanceOf(Schema.SchemaString);

  masked.parse({ country: "US" });
  await masked.parseAsync({ country: "US" });
});

test("partial with mask -- ignore falsy values", async () => {
  const object = Schema.object({
    name: Schema.string(),
    age: Schema.number().optional(),
    field: Schema.string().optional().default("asdf"),
    country: Schema.string(),
  });

  // @ts-expect-error
  const masked = object.partial({ name: true, country: false }).strict();

  expect(masked.shape.name).toBeInstanceOf(Schema.SchemaOptional);
  expect(masked.shape.age).toBeInstanceOf(Schema.SchemaOptional);
  expect(masked.shape.field).toBeInstanceOf(Schema.SchemaDefault);
  expect(masked.shape.country).toBeInstanceOf(Schema.SchemaString);

  masked.parse({ country: "US" });
  await masked.parseAsync({ country: "US" });
});

test("catch/prefault/default", () => {
  const mySchema = Schema.object({
    a: Schema.string().catch("catch value").optional(),
    b: Schema.string().default("default value").optional(),
    c: Schema.string().prefault("prefault value").optional(),
    d: Schema.string().catch("catch value"),
    e: Schema.string().default("default value"),
    f: Schema.string().prefault("prefault value"),
  });

  // Catch (d) and default/prefault (b, c, e, f) handle absent keys gracefully. `a: catch().optional()` short-circuits to undefined when the original input was undefined, so the property is omitted from the output. All other catch/default/prefault keys produce their fallback values.
  expect(mySchema.parse({})).toMatchInlineSnapshot(`
    {
      "b": "default value",
      "c": "prefault value",
      "d": "catch value",
      "e": "default value",
      "f": "prefault value",
    }
  `);
  expect(mySchema.parse({}, { jitless: true })).toMatchInlineSnapshot(`
    {
      "b": "default value",
      "c": "prefault value",
      "d": "catch value",
      "e": "default value",
      "f": "prefault value",
    }
  `);

  expect(mySchema.parse({ d: undefined })).toMatchInlineSnapshot(`
    {
      "b": "default value",
      "c": "prefault value",
      "d": "catch value",
      "e": "default value",
      "f": "prefault value",
    }
  `);

  expect(mySchema.parse({ d: undefined }, { jitless: true })).toMatchInlineSnapshot(`
    {
      "b": "default value",
      "c": "prefault value",
      "d": "catch value",
      "e": "default value",
      "f": "prefault value",
    }
  `);
});

test("handleOptionalObjectResult branches", () => {
  const mySchema = Schema.object({
    // Branch: input[key] === undefined, key not in input, caught error
    caughtMissing: Schema.string().catch("caught").optional(),
    // Branch: input[key] === undefined, key in input, caught error
    caughtUndefined: Schema.string().catch("caught").optional(),
    // Branch: input[key] === undefined, key not in input, validation issues
    issueMissing: Schema.string().min(5).optional(),
    // Branch: input[key] === undefined, key in input, validation issues
    issueUndefined: Schema.string().min(5).optional(),
    // Branch: input[key] === undefined, validation returns undefined
    validUndefined: Schema.string().optional(),
    // Branch: input[key] === undefined, non-undefined result (default/transform)
    defaultValue: Schema.string().default("default").optional(),
    // Branch: input[key] defined, caught error
    caughtDefined: Schema.string().catch("caught").optional(),
    // Branch: input[key] defined, validation issues
    issueDefined: Schema.string().min(5).optional(),
    // Branch: input[key] defined, validation returns undefined
    validDefinedUndefined: z
      .string()
      .transform(() => undefined)
      .optional(),
    // Branch: input[key] defined, non-undefined value
    validDefined: Schema.string().optional(),
  });

  // Test input[key] === undefined cases
  const result1 = mySchema.parse(
    {
      // caughtMissing: not present (key not in input)
      caughtUndefined: undefined, // key in input
      // issueMissing: not present (key not in input)
      issueUndefined: undefined, // key in input
      validUndefined: undefined,
      // defaultValue: not present, will get default
    },
    { jitless: true }
  );

  expect(result1).toEqual({
    caughtUndefined: undefined,
    issueUndefined: undefined,
    validUndefined: undefined,
    defaultValue: "default",
  });

  // Test input[key] defined cases (successful)
  const result2 = mySchema.parse(
    {
      caughtDefined: 123, // invalid type, should catch
      validDefinedUndefined: "test", // transforms to undefined
      validDefined: "valid", // valid value
    },
    { jitless: true }
  );

  expect(result2).toEqual({
    caughtDefined: "caught",
    validDefinedUndefined: undefined,
    validDefined: "valid",
    defaultValue: "default",
  });

  // Test validation issues are properly reported (input[key] defined, validation fails)
  expect(() =>
    mySchema.parse(
      {
        issueDefined: "abc", // too short
      },
      { jitless: true }
    )
  ).toThrow();
});

test("fastpass vs non-fastpass consistency", () => {
  const mySchema = Schema.object({
    caughtMissing: Schema.string().catch("caught").optional(),
    caughtUndefined: Schema.string().catch("caught").optional(),
    issueMissing: Schema.string().min(5).optional(),
    issueUndefined: Schema.string().min(5).optional(),
    validUndefined: Schema.string().optional(),
    defaultValue: Schema.string().default("default").optional(),
    caughtDefined: Schema.string().catch("caught").optional(),
    validDefinedUndefined: z
      .string()
      .transform(() => undefined)
      .optional(),
    validDefined: Schema.string().optional(),
  });

  const input = {
    caughtUndefined: undefined,
    issueUndefined: undefined,
    validUndefined: undefined,
    caughtDefined: 123,
    validDefinedUndefined: "test",
    validDefined: "valid",
  };

  // Test both paths produce identical results
  const jitlessResult = mySchema.parse(input, { jitless: true });
  const fastpassResult = mySchema.parse(input);

  expect(jitlessResult).toEqual(fastpassResult);
  expect(jitlessResult).toEqual({
    caughtUndefined: undefined,
    issueUndefined: undefined,
    validUndefined: undefined,
    defaultValue: "default",
    caughtDefined: "caught",
    validDefinedUndefined: undefined,
    validDefined: "valid",
  });
});

test("optional with check", () => {
  const baseSchema = z
    .string()
    .optional()
    .check(({ value, ...ctx }) => {
      ctx.issues.push({
        code: "custom",
        input: value,
        message: "message",
      });
    });

  // this correctly fails
  expect(baseSchema.safeParse(undefined)).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "custom",
        "message": "message",
        "path": []
      }
    ]],
      "success": false,
    }
  `);

  const schemaObject = Schema.object({
    date: baseSchema,
  });

  expect(schemaObject.safeParse({ date: undefined })).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "custom",
        "message": "message",
        "path": [
          "date"
        ]
      }
    ]],
      "success": false,
    }
  `);
});

test("partial - throws error on schema with refinements", () => {
  const baseSchema = Schema.object({
    id: Schema.string(),
    name: Schema.string(),
    items: Schema.string().array(),
  });

  const refinedSchema = baseSchema.superRefine((val, ctx) => {
    if (val.items.length === 0) {
      ctx.addIssue({
        message: "Must have at least one item",
        code: "custom",
        path: ["items"],
      });
    }
  });

  expect(() => refinedSchema.partial()).toThrow(".partial() cannot be used on object schemas containing refinements");
});

test("partial - throws error on schema with refine", () => {
  const baseSchema = Schema.object({
    password: Schema.string(),
    confirmPassword: Schema.string(),
  });

  const refinedSchema = baseSchema.refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
  });

  expect(() => refinedSchema.partial()).toThrow(".partial() cannot be used on object schemas containing refinements");
});

test("required - preserves refinements", () => {
  const baseSchema = Schema.object({
    name: Schema.string().optional(),
    age: Schema.number().optional(),
  });

  const refinedSchema = baseSchema.superRefine((val, ctx) => {
    if (val.name === "admin") {
      ctx.addIssue({
        message: "Name cannot be admin",
        code: "custom",
        path: ["name"],
      });
    }
  });

  const requiredSchema = refinedSchema.required();

  // The refinement should still be applied
  const result = requiredSchema.safeParse({ name: "admin", age: 25 });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0].message).toBe("Name cannot be admin");
  }

  // Valid data should pass
  const validResult = requiredSchema.safeParse({ name: "user", age: 25 });
  expect(validResult.success).toBe(true);
});

test("required - refinement is executed on required schema", () => {
  const baseSchema = Schema.object({
    password: Schema.string().optional(),
    confirmPassword: Schema.string().optional(),
  });

  const refinedSchema = baseSchema.refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
  });

  const requiredSchema = refinedSchema.required();

  // Mismatched passwords should fail refinement
  const result = requiredSchema.safeParse({ password: "abc", confirmPassword: "xyz" });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0].message).toBe("Passwords must match");
  }

  // Matching passwords should pass
  const validResult = requiredSchema.safeParse({ password: "abc", confirmPassword: "abc" });
  expect(validResult.success).toBe(true);
});

test("exactPartial - shallow inference", () => {
  const shallow = nested.exactPartial();
  type shallow = Schema.infer<typeof shallow>;
  expectTypeOf<shallow>().toEqualTypeOf<{
    name?: string;
    age?: number;
    outer?: { inner: string };
    array?: { asdf: string }[];
  }>();

  // The point of exactPartial: unlike partial(), this matches TypeScript's Partial<> under exactOptionalPropertyTypes.
  expectTypeOf<shallow>().toEqualTypeOf<Partial<Schema.infer<typeof nested>>>();
});

test("exactPartial - wraps fields in SchemaExactOptional", () => {
  const object = Schema.object({ name: Schema.string(), age: Schema.number() });
  const exact = object.exactPartial();
  expect(exact.shape.name).toBeInstanceOf(Schema.SchemaExactOptional);
  expect(exact.shape.age).toBeInstanceOf(Schema.SchemaExactOptional);
  expect(exact.shape.name.unwrap()).toBeInstanceOf(Schema.SchemaString);
});

test("exactPartial - absent keys pass, explicit undefined rejected", () => {
  const exact = Schema.object({ name: Schema.string(), age: Schema.number() }).exactPartial();
  expect(exact.parse({})).toEqual({});
  expect(exact.parse({ name: "asdf" })).toEqual({ name: "asdf" });
  expect(exact.safeParse({ name: undefined }).success).toBe(false);
});

test("exactPartial with mask", () => {
  const object = Schema.object({ name: Schema.string(), age: Schema.number(), country: Schema.string() });
  const masked = object.exactPartial({ name: true, age: true });
  expect(masked.shape.name).toBeInstanceOf(Schema.SchemaExactOptional);
  expect(masked.shape.age).toBeInstanceOf(Schema.SchemaExactOptional);
  expect(masked.shape.country).toBeInstanceOf(Schema.SchemaString);

  type masked = Schema.infer<typeof masked>;
  expectTypeOf<masked>().toEqualTypeOf<{ name?: string; age?: number; country: string }>();

  expect(masked.parse({ country: "US" })).toEqual({ country: "US" });
  expect(masked.safeParse({ country: "US", name: undefined }).success).toBe(false);
});

test("exactPartial - throws on schema with refinements", () => {
  const refined = Schema.object({ name: Schema.string() }).refine(() => true);
  expect(() => refined.exactPartial()).toThrow(
    ".exactPartial() cannot be used on object schemas containing refinements"
  );
});
