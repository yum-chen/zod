# Migration guide

This is a migration guide to walk you through the process of upgrading to Schema 3.

- If you're upgrading directly from Schema 1, you should read through the list of features + changes in both Schema 2 and Schema 3.
- If you're upgrading from Schema 2 -> 3, you can skip to the

## Upgrading from Schema 1 → Schema 2

Schema 2 is being retired and will not leave beta. This is due to some unintuitive ramifications of the transformers API: details [here](https://github.com/colinhacks/schema/issues/264).

### New features

- Transformers! These let you provide default values, do casting/coercion, and a lot more. Read more here: [Transformers](https://github.com/colinhacks/schema#transformers)
- Asynchronous refinements and new .parseAsync and .safeParseAsync methods. Read more here: [Refinements](https://github.com/colinhacks/schema#refinements)
- Modify unknown key behavior for object schemas: `.strip()` (the default), `.passthrough()`, and `.strict()`
- New .catchall() method for object schemas: [catchall](https://github.com/colinhacks/schema#catchall)

### Breaking changes

- Object schemas now _strip_ unknown keys by default.
- Schema parsing now returns a deep clone of the data you pass in (instead of the exact value you pass in)
- Relatedly, Schema no longer supports cyclical data. Recursive schemas are still supported, but Schema can't properly parse nested objects that contain cycles.
- Optional and nullable schemas are now represented with the dedicated SchemaOptional and SchemaNullable classes, instead of using SchemaUnion.

## Upgrading from Schema 2 → Schema 3

### New features

- You can now import Schema like `import { Schema } from 'schema';` instead of using `import * as` syntax.
- **Structured error messages**. Use the `.format()` method to SchemaError to convert the error into a strongly-typed, nested object: [format method](#error-formatting)
- **Easier unions**. Use the `or` method to SchemaType (the base class for all Schema schemas) to easily create union types like `Schema.string().or(Schema.number())`
- **Easier intersections**. Use the `and` method to SchemaType (the base class for all Schema schemas) to easily create intersection types
- **Global error customization**. Use `Schema.setErrorMap(myErrorMap)` to _globally_ customize the error messages produced by Schema: [setErrorMap](ERROR_HANDLING.md#customizing-errors-with-schemaerrormap)
- **Maps and sets**. Schema now supports [`Map`](#maps) and [`Set`](#set) schemas.
- **Optional and nullable unwrapping**. SchemaOptional and SchemaNullable now have a `.unwrap()` method for retrieving the schema they wrap.
- **A new implementation of transformers**. Details below.

### Breaking changes

- The **minimum TypeScript version** is now _4.1_ (up from 3.7 for Schema 2). Several features have been rewritten to use [recursive conditional types](https://devblogs.microsoft.com/typescript/announcing-typescript-4-1/#recursive-conditional-types), an incredibly powerful new feature introduced in TS4.1.

- **Transformers syntax**. Previously, creating a transformer required an input schema, an output schema, and a function to transform between them. You created transformers like `Schema.transform(A, B, func)`, where `A` and `B` are Schema schemas. This is no longer the case. Accordingly:

  The old syntax is no longer available:

  ```ts
  # not available
  Schema.transformer(A, B, func);
  A.transform(B, func)
  ```

  Instead, apply transformations by simply using the `.transform()` method that exists on all Schema schemas.

  ```ts
  Schema.string().transform((val) => val.length);
  ```

- Under the hood, all refinements and transformations are executed inside a dedicated "SchemaEffects" class. Post-parsing, SchemaEffects passes the data through a chain of refinements and transformations, then returns the final value. As such, you can now _interleave_ transformations and refinements. For instance:

  ```ts
  const test = z
    .string()
    .transform((val) => val.length)
    .refine((val) => val > 5, { message: "Input is too short" })
    .transform((val) => val * 2);

  test.parse("12characters"); // => 24
  ```

- **Type guards** (the `.check()` method) have been removed. Type guards interact with transformers in unintuitive ways so they were removed. Use `.safeParse` instead.

- Object merging now behaves differently. If you merge two object schema (`A.merge(B)`), the fields of B will overwrite the fields of A if there are shared keys. This is how the `.extend` method already works. If you're looking to create an intersection of the two types, use `Schema.intersection(A, B)` or use the new `.and` method (`A.and(B)`).

- **Default values**: default value logic is now implemented inside a `SchemaDefault` class, instead of using transformers. (In a previous alpha version of Schema 3, default values were implemented inside the SchemaOptional class.)

- There have been small internal changes to the SchemaIssue subtypes. See the new subtypes in the [Error Handling guide](ERROR_HANDLING.md). This may impact user who have written a custom error maps. Most users will not be affected.
