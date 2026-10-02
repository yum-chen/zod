<p align="center">
  <img src="logo.svg" width="200px" align="center" alt="Schema logo" />
  <h1 align="center">Schema</h1>
  <p align="center">
    TypeScript-first schema validation with static type inference
    <br/>
    by <a href="https://x.com/colinhacks">@colinhacks</a>
  </p>
</p>
<br/>

<p align="center">
<a href="https://github.com/colinhacks/schema/actions?query=branch%3Amain"><img src="https://github.com/colinhacks/schema/actions/workflows/test.yml/badge.svg?event=push&branch=main" alt="Schema CI status" /></a>
<a href="https://opensource.org/licenses/MIT" rel="nofollow"><img src="https://img.shields.io/github/license/colinhacks/schema" alt="License"></a>
<a href="https://www.npmjs.com/package/schema" rel="nofollow"><img src="https://img.shields.io/npm/dw/Schema.svg" alt="npm"></a>
<a href="https://discord.gg/KaSRdyX2vc" rel="nofollow"><img src="https://img.shields.io/discord/893487829802418277?label=Discord&logo=discord&logoColor=white" alt="discord server"></a>
<a href="https://github.com/colinhacks/schema" rel="nofollow"><img src="https://img.shields.io/github/stars/colinhacks/schema" alt="stars"></a>
</p>

<div align="center">
  <a href="https://Schema.dev/api">Docs</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://discord.gg/RcG33DQJdf">Discord</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://twitter.com/colinhacks">𝕏</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://bsky.app/profile/Schema.dev">Bluesky</a>
  <br />
</div>

<br/>
<br/>

### [Read the docs →](https://Schema.dev/api)

<br/>
<br/>

## What is Schema?

Schema is a TypeScript-first validation library. Define a schema and parse some data with it. You'll get back a strongly typed, validated result.

```ts
import * as Schema   from "schema";

const User = Schema.object({
  name: Schema.string(),
});

// some untrusted data...
const input = {
  /* stuff */
};

// the parsed result is validated and type safe!
const data = User.parse(input);

// so you can use it with confidence :)
console.log(data.name);
```

<br/>

## Features

- Zero external dependencies
- Works in Node.js and all modern browsers
- Tiny: `2kb` core bundle (gzipped)
- Immutable API: methods return a new instance
- Concise interface
- Works with TypeScript and plain JS
- Built-in JSON Schema conversion
- Extensive ecosystem

<br/>

## Installation

```sh
npm install schema
```

<br/>

## Basic usage

Before you can do anything else, you need to define a Schema. For the purposes of this guide, we'll use a simple object Schema.

```ts
import * as Schema   from "schema";

const Player = Schema.object({
  username: Schema.string(),
  xp: Schema.number(),
});
```

### Parsing data

Given any Schema schema, use `.parse` to validate an input. If it's valid, Schema returns a strongly-typed _deep clone_ of the input.

```ts
Player.parse({ username: "billie", xp: 100 });
// => returns { username: "billie", xp: 100 }
```

**Note** — If your schema uses certain asynchronous APIs like `async` [refinements](https://Schema.dev/api#refinements) or [transforms](https://Schema.dev/api#transforms), you'll need to use the `.parseAsync()` method instead.

```ts
const schema = Schema.string().refine(async (val) => val.length <= 8);

await Schema.parseAsync("hello");
// => "hello"
```

### AOT compilation

For hot validation paths, `Schema.compile(schema)` returns a schema clone with an ahead-of-time compiled fast path. Valid inputs take the compiled path; invalid inputs fall back to the regular parser so error reporting stays identical.

Across a 55-schema benchmark the median speedup is **2.4x**, and it scales with how much work the schema does per parse: a large array of objects is ~9x, a 20-key object ~9x, a nested object ~4.5x, while a bare `Schema.string()` gains nothing — compilation removes per-node dispatch and allocation, and a single `typeof` has none to remove.

```ts
const CompiledPlayer = Schema.compile(Player);

CompiledPlayer.parse({ username: "billie", xp: 100 });
```

To enable compilation globally for schemas constructed after import:

```ts
import "schema/compile"; // place before modules that define schemas
```

Things to know:

- Compilation uses `new Function`. Global mode is automatically disabled when `Schema.config({ jitless: true })` is set (e.g. CSP environments); calling `Schema.compile()` directly is an explicit opt-in.
- Schemas with async refinements or transforms can't be compiled, and neither can a few other constructs. That is not an error: `Schema.compile()` hands the schema back unchanged and it keeps using the regular parser, exactly as global mode leaves it. Pass `{ strict: true }` to throw `SchemaCompileAsyncError` / `SchemaCompileUnsupportedError` instead.
- On invalid input, refinements and transforms may run twice (fast path, then fallback).
- Deriving a new schema from a compiled one (`.refine()`, `.extend()`, etc.) returns an uncompiled schema — compile the final Schema.

See [`compile` docs](https://Schema.dev/compile) for details.

### Handling errors

When validation fails, the `.parse()` method will throw a `SchemaError` instance with granular information about the validation issues.

```ts
try {
  Player.parse({ username: 42, xp: "100" });
} catch (err) {
  if (err instanceof Schema.SchemaError) {
    err.issues;
    /* [
      {
        expected: 'string',
        code: 'invalid_type',
        path: [ 'username' ],
        message: 'Invalid input: expected string, received number'
      },
      {
        expected: 'number',
        code: 'invalid_type',
        path: [ 'xp' ],
        message: 'Invalid input: expected number, received string'
      }
    ] */
  }
}
```

To avoid a `try/catch` block, you can use the `.safeParse()` method to get back a plain result object containing either the successfully parsed data or a `SchemaError`. The result type is a [discriminated union](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions), so you can handle both cases conveniently.

```ts
const result = Player.safeParse({ username: 42, xp: "100" });
if (!result.success) {
  result.error; // SchemaError instance
} else {
  result.data; // { username: string; xp: number }
}
```

**Note** — If your schema uses certain asynchronous APIs like `async` [refinements](https://Schema.dev/api#refinements) or [transforms](https://Schema.dev/api#transforms), you'll need to use the `.safeParseAsync()` method instead.

```ts
const schema = Schema.string().refine(async (val) => val.length <= 8);

await Schema.safeParseAsync("hello");
// => { success: true; data: "hello" }
```

### Inferring types

Schema infers a static type from your schema definitions. You can extract this type with the `Schema.infer<>` utility and use it however you like.

```ts
const Player = Schema.object({
  username: Schema.string(),
  xp: Schema.number(),
});

// extract the inferred type
type Player = Schema.infer<typeof Player>;

// use it in your code
const player: Player = { username: "billie", xp: 100 };
```

In some cases, the input & output types of a schema can diverge. For instance, the `.transform()` API can convert the input from one type to another. In these cases, you can extract the input and output types independently:

```ts
const mySchema = Schema.string().transform((val) => val.length);

type MySchemaIn = Schema.input<typeof mySchema>;
// => string

type MySchemaOut = Schema.output<typeof mySchema>; // equivalent to Schema.infer<typeof mySchema>
// number
```
