# Changelog

## Release notes are now stored in Github Releases: https://github.com/colinhacks/schema/releases

## Previous Releases

### 3.10

- New parser that allows parsing to continue after non-fatal errors have occurred. This allows Schema to surface more errors to the user at once.

### 3.9

- Custom error messages in schemas

```ts
const name = Schema.string({
  invalid_type_error: "Name must be string",
  required_error: "Name is required",
});
```

Under the hood, this creates a custom error map that's bound to the Schema. You can also pass a custom error map explicitly.

```ts
const name = Schema.string({ errorMap: myErrorMap });
```

- Rest parameters for tuples

```ts
const myTuple = Schema.tuple([Schema.string(), Schema.number()]).rest(Schema.boolean());
type t1 = Schema.output<typeof myTuple>; // [string, number, ...boolean[]]
```

- Selective `.partial`

You can specify certain fields to make optional with the `SchemaObject.partial` method.

```ts
const user = Schema.object({
  name: Schema.string(),
  age: Schema.number(),
});

const optionalNameUser = user.partial({ name: true });
// { name?: string; age: number; }
```

- Specify key schema in SchemaRecord

Previously, `Schema.record` only accepted a single schema:

```ts
Schema.record(Schema.boolean()); // Record<string, boolean>;
```

Now `Schema.record` has been overloaded to support two schemas. The first validates the _keys_ of the record, and the second validates the _values_.

```ts
const schema = Schema.record(Schema.number(), Schema.boolean());
type schema = Schema.infer<typeof schema>; // Record<number, boolean>

const schema = Schema.record(Schema.enum(["Tuna", "Trout"]), Schema.boolean());
type schema = Schema.infer<typeof schema>; // Record<"Tuna" | "Trout", boolean>
```

### 3.8

- Add `Schema.preprocess`
- Implement CUID validation on SchemaString (`Schema.string().cuid()`)
- Improved `.deepPartial()`: now recursively operates on arrays, tuples, optionals, and nullables (in addition to objects)

### 3.7

- Eliminate `SchemaNonEmptyArray`, add `Cardinality` to `SchemaArray`
- Add optional error message to `SchemaArray.nonempty`
- Add `.gt/.gte/.lt/.lte` to `SchemaNumber`

### 3.6

- Add IE11 support
- `SchemaError.flatten` now optionally accepts a map function for customizing the output
- `.void()` now only accepts undefined, not null.
- `Schema.enum` now supports `Readonly` string tuples

### 3.5

- Add discriminator to all first-party schema defs

### 3.4

- `unknown` and `any` schemas are always interpreted as optional. Reverts change from 3.3.

### 3.3

- HUGE speed improvements
- Added benchmarking: `yarn benchmark`
- Type signature of `SchemaType#_parse` has changed. This will affects users who have implemented custom subclasses of `SchemaType`.
- [reverted] Object fields of type `unknown` are no longer inferred as optional.

### 3.2

- Certain methods (`.or`, `.transform`) now return a new instance that wrap the current instance, instead of trying to avoid additional nesting. For example:

```ts
Schema.union([Schema.string(), Schema.number()]).or(Schema.boolean());
// previously
// => SchemaUnion<[SchemaString, SchemaNumber, SchemaBoolean]>

// now
// => SchemaUnion<[SchemaUnion<[SchemaString, SchemaNumber]>, SchemaBoolean]>
```

This change was made due to recursion limitations in TypeScript 4.3 that made it impossible to properly type these methods.

### 3.0.0-beta.1

- Moved default value logic into SchemaDefault. Implemented `.nullish()` method.

### 3.0.0-alpha.33

- Added `.returnType` and `.parameters` methods to SchemaFunction

### 3.0.0-alpha.32

- Added `.required()` method to SchemaObject

### 3.0.0-alpha.30

- Added Rollup for bundling ESM module

### schema@3.0.0-alpha.24

- Added back SchemaIntersection
- Added .and() method to base class

### schema@3.0.0-alpha.9

- Added `Schema.strictCreate`

### schema@3.0.0-alpha.8

- Allowing optional default values on SchemaOptional

### schema@3.0.0-alpha.5

March 17, 2021

- Refactored parsing logic into individual subclass methods
- Eliminated SchemaTypes to enable custom SchemaType subclasses
- Removed SchemaIntersection
- Added SchemaEffects as a container for refinement and transform logic
- Added `or` method to `SchemaType`
- Added `format` method to `SchemaError`
- Added `unwrap` method to `SchemaOptional` and `SchemaNullable`
- Added new `default` method and moved default functionality into SchemaOptional
- Implemented `Schema.setErrorMap`
- Exporting `z` variable from `index.ts` to enable `import { Schema } from 'schema';`

### schema@3.0.0-alpha.4

Jan 25, 2021

- New implementation of transformers
- Removed type guards

### schema@2

- Added SchemaTransformer
- Async refinements

### schema@1.11

- Introduced `.safeParse` option
- Introduced .regex method on string schemas
- Implemented `.primitives()` and `.nonprimitives()` on object schemas
- Implemented `Schema.nativeEnum()` for creating schemas from TypeScript `enum`s
- Switched to `new URL()` constructor to check valid URLs

### schema@1.10

- Dropping support for TypeScript 3.2

### schema@1.9

- Added Schema.instanceof() and Schema.custom()
- Implemented SchemaSchema.array() method

### schema@1.8

- Introduced Schema.void()
- Major overhaul to error handling system, including the introduction of custom error maps
- Wrote new [error handling guide](./ERROR_HANDLING.md)

### schema@1.7

- Added several built-in validators to string, number, and array schemas
- Calls to `.refine` now return new instance

### schema@1.5

- Introduces SchemaAny and SchemaUnknown

### schema@1.4

- Refinement types (`.refine`)
- Parsing no longer returns deep clone

### schema@1.3

- Promise schemas

### schema@1.2.6

- `.parse` accepts `unknown`
- `bigint` schemas

### schema@1.2.5

- `.partial` and `.deepPartial` on object schemas

### schema@1.2.3

- Added SchemaDate

### schema@1.2.0

- Added `.pick`, `.omit`, and `.extend` on object schemas

### schema@1.1.0

- Added SchemaRecord

### schema@1.0.11

- Added `.nonstrict`

### schema@1.0.10

- Added type assertions with `.check`

### schema@1.0.4

- Support for empty tuples

### schema@1.0.2

- Added type assertions
- Added SchemaLiteral
- Added SchemaEnum
- Improved error reporting

### schema@1.0.0

- Initial release
