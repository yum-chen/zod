<p align="center">
  <img src="https://raw.githubusercontent.com/colinhacks/schema/main/logo.svg" width="200px" align="center" alt="Schema logo" />
  <h1 align="center">Schema</h1>
  <p align="center">
  <a href="https://Schema.dev">Schema.dev</a>
  <br/>
    TypeScript-first schema validation with static type inference
  </p>
</p>
<p align="center">
<a href="https://github.com/colinhacks/schema/actions?query=branch%3Amain"><img src="https://github.com/colinhacks/schema/actions/workflows/test.yml/badge.svg?event=push&branch=main" alt="Schema CI status" /></a>
<a href="https://twitter.com/colinhacks" rel="nofollow"><img src="https://img.shields.io/badge/created%20by-@colinhacks-4BBAAB.svg" alt="Created by Colin McDonnell"></a>
<a href="https://opensource.org/licenses/MIT" rel="nofollow"><img src="https://img.shields.io/github/license/colinhacks/schema" alt="License"></a>
<a href="https://www.npmjs.com/package/schema" rel="nofollow"><img src="https://img.shields.io/npm/dw/Schema.svg" alt="npm"></a>
<a href="https://github.com/colinhacks/schema" rel="nofollow"><img src="https://img.shields.io/github/stars/colinhacks/schema" alt="stars"></a>
</p>

<div align="center">
  <a href="https://Schema.dev">Website</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  
  <a href="https://discord.gg/RcG33DQJdf">Discord</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://twitter.com/colinhacks">𝕏</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://bsky.app/profile/Schema.dev">Bluesky</a>
  <br />
</div>

<br/><br/>

<table align="center" style="justify-content:center;align-items:center;display:flex;"><td>
  <p align="center">Schema 4 is now available!
  <br/>
  <a target="_blank" rel="noopener noreferrer" href="https://Schema.dev/v4">Read the announcement 👉</a></p></td>
</table>

<br/>
<br/>

## Table of contents

> These docs have been translated into [Chinese](./README_ZH.md) and [Korean](./README_KO.md).

- [Table of contents](#table-of-contents)
- [Introduction](#introduction)
- [Sponsors](#sponsors)
  - [Ecosystem](#ecosystem)
    - [Resources](#resources)
    - [API libraries](#api-libraries)
    - [Form integrations](#form-integrations)
    - [Schema to X](#schema-to-x)
    - [X to Schema](#x-to-schema)
    - [Mocking](#mocking)
    - [Powered by Schema](#powered-by-schema)
    - [Utilities for Schema](#utilities-for-schema)
- [Installation](#installation)
  - [Requirements](#requirements)
  - [From `npm`](#from-npm)
- [Basic usage](#basic-usage)
- [Primitives](#primitives)
- [Coercion for primitives](#coercion-for-primitives)
- [Literals](#literals)
- [Strings](#strings)
  - [Datetimes](#datetimes)
  - [Dates](#dates)
  - [Times](#times)
  - [IP addresses](#ip-addresses)
  - [IP ranges (CIDR)](#ip-ranges-cidr)
- [Numbers](#numbers)
- [BigInts](#bigints)
- [NaNs](#nans)
- [Booleans](#booleans)
- [Dates](#dates-1)
- [Schema enums](#schema-enums)
- [Native enums](#native-enums)
- [Optionals](#optionals)
- [Nullables](#nullables)
- [Objects](#objects)
  - [`.shape`](#shape)
  - [`.keyof`](#keyof)
  - [`.extend`](#extend)
  - [`.merge`](#merge)
  - [`.pick/.omit`](#pickomit)
  - [`.partial`](#partial)
  - [`.deepPartial`](#deeppartial)
  - [`.required`](#required)
  - [`.passthrough`](#passthrough)
  - [`.strict`](#strict)
  - [`.strip`](#strip)
  - [`.catchall`](#catchall)
- [Arrays](#arrays)
  - [`.element`](#element)
  - [`.nonempty`](#nonempty)
  - [`.min/.max/.length`](#minmaxlength)
- [Tuples](#tuples)
- [Unions](#unions)
- [Discriminated unions](#discriminated-unions)
- [Records](#records)
- [Maps](#maps)
- [Sets](#sets)
- [Intersections](#intersections)
- [Recursive types](#recursive-types)
  - [SchemaType with SchemaEffects](#schematype-with-schemaeffects)
  - [JSON type](#json-type)
  - [Cyclical objects](#cyclical-objects)
- [Promises](#promises)
- [Instanceof](#instanceof)
- [Functions](#functions)
- [Preprocess](#preprocess)
- [Custom schemas](#custom-schemas)
- [Schema methods](#schema-methods)
  - [`.parse`](#parse)
  - [`.parseAsync`](#parseasync)
  - [`.safeParse`](#safeparse)
  - [`.safeParseAsync`](#safeparseasync)
  - [`.refine`](#refine)
    - [Arguments](#arguments)
    - [Customize error path](#customize-error-path)
    - [Asynchronous refinements](#asynchronous-refinements)
    - [Relationship to transforms](#relationship-to-transforms)
  - [`.superRefine`](#superrefine)
    - [Abort early](#abort-early)
    - [Type refinements](#type-refinements)
  - [`.transform`](#transform)
    - [Chaining order](#chaining-order)
    - [Validating during transform](#validating-during-transform)
    - [Relationship to refinements](#relationship-to-refinements)
    - [Async transforms](#async-transforms)
  - [`.default`](#default)
  - [`.describe`](#describe)
  - [`.catch`](#catch)
  - [`.optional`](#optional)
  - [`.nullable`](#nullable)
  - [`.nullish`](#nullish)
  - [`.array`](#array)
  - [`.promise`](#promise)
  - [`.or`](#or)
  - [`.and`](#and)
  - [`.brand`](#brand)
  - [`.readonly`](#readonly)
  - [`.pipe`](#pipe)
- [Guides and concepts](#guides-and-concepts)
  - [Type inference](#type-inference)
  - [Writing generic functions](#writing-generic-functions)
    - [Inferring the inferred type](#inferring-the-inferred-type)
    - [Constraining allowable inputs](#constraining-allowable-inputs)
  - [Error handling](#error-handling)
  - [Error formatting](#error-formatting)
- [Comparison](#comparison)
  - [Joi](#joi)
  - [Yup](#yup)
  - [io-ts](#io-ts)
  - [Runtypes](#runtypes)
  - [Ow](#ow)
- [Changelog](#changelog)

<br/>

## Introduction

Schema is a TypeScript-first schema declaration and validation library. I'm using the term "schema" to broadly refer to any data type, from a simple `string` to a complex nested object.

Schema is designed to be as developer-friendly as possible. The goal is to eliminate duplicative type declarations. With Schema, you declare a validator _once_ and Schema will automatically infer the static TypeScript type. It's easy to compose simpler types into complex data structures.

Some other great aspects:

- Zero dependencies
- Works in Node.js and all modern browsers
- Tiny: 8kb minified + zipped
- Immutable: methods (e.g. `.optional()`) return a new instance
- Concise, chainable interface
- Functional approach: [parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)
- Works with plain JavaScript too! You don't need to use TypeScript.

<br/>

## Sponsors

Sponsorship at any level is appreciated and encouraged. If you built a paid product using Schema, consider one of the [corporate tiers](https://github.com/sponsors/colinhacks).

<br/>

<h3 align="center">Platinum</h3>

<table align="center" style="justify-content: center;align-items: center;display: flex;">
  <tr>
    <td align="center">
      <p></p>
      <p>
      <a href="https://trigger.dev/?utm_source=schema">
        <picture height="80px">
          <source media="(prefers-color-scheme: dark)" srcset="https://trigger.dev/assets/triggerdev-lockup--light.svg">
          <img alt="Trigger.dev logo" height="80px" src="https://trigger.dev/assets/triggerdev-lockup--dark.svg">
        </picture>
      </a>
      <br  />
      Build and deploy fully-managed AI agents and workflows
      <br/>
      <a href="https://trigger.dev/?utm_source=schema" style="text-decoration:none;">trigger.dev</a>
      </p>
      <p></p>
    </td>
  </tr>
</table>

<br/>

<h3 align="center">Gold</h3>

<table align="center" style="justify-content: center;align-items: center;display: flex;">
  <tr>
    <td align="center">
      <p></p>
      <p>
      <a href="https://www.coderabbit.ai/">
        <picture height="80px">
          <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/eea24edb-ff20-4532-b57c-e8719f455d6d">
          <img alt="CodeRabbit logo" height="80px" src="https://github.com/user-attachments/assets/d791bc7d-dc60-4d55-9c31-97779839cb74">
        </picture>
      </a>
      <br  />
      Cut code review time & bugs in half
      <br/>
      <a href="https://www.coderabbit.ai/" style="text-decoration:none;">coderabbit.ai</a>
      </p>
      <p></p>
    </td>
  </tr>
</table>

<br/>

<h3 align="center">Silver</h3>

<table align="center" style="justify-content: center;align-items: center;display: flex;">
  <tr>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/176449348?s=200&v=4" height="50px;" alt="Subtotal" />
      <br />
      <a style="text-decoration:none;" href="https://www.subtotal.com/?utm_source=schema" target="_blank">Subtotal</a>
    </td>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/89474619?s=200&v=4" height="50px;" alt="PropelAuth" />
      <br />
      <a style="text-decoration:none;" href="https://www.propelauth.com/" target="_blank">PropelAuth</a>
    </td>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/301879?s=200&v=4" height="50px;" alt="Scalar.com logo" />
      <br />
      <a style="text-decoration:none;" href="https://scalar.com/" target="_blank">Scalar</a>
    </td>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/125754?s=200&v=4" height="50px;" alt="Transloadit logo" />
      <br />
      <a style="text-decoration:none;" href="https://transloadit.com/?utm_source=schema&utm_medium=refe
    rral&utm_campaign=sponsorship&utm_content=github" target="_blank">Transloadit</a>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/91036480?s=200&v=4" height="50px;" alt="Whop logo" />
      <br />
      <a style="text-decoration:none;" href="https://whop.com/" target="_blank">Whop</a>
    </td>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/78935958?s=200&v=4" height="50px;" alt="Inngest logo" />
      <br />
      <a style="text-decoration:none;" href="https://inngest.com/" target="_blank">Inngest</a>
    </td>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/13880908?s=200&v=4" height="50px;" alt="Storyblok CMS" />
      <br />
      <a style="text-decoration:none;" href="https://storyblok.com/" target="_blank">Storyblok</a>
    </td>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/16199997?s=200&v=4" height="50px;" alt="Mux logo" />
      <br />
      <a style="text-decoration:none;" href="https://mux.link/schema" target="_blank">Mux</a>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/76428554?s=200&v=4" height="50px;" alt="Cybozu logo" />
      <br />
      <a style="text-decoration:none;" href="https://cybozu.co.jp/index.html" target="_blank">Cybozu</a>
    </td>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/117220588?s=200&v=4" height="50px;" alt="9thCO" />
      <br />
      <a style="text-decoration:none;" href="https://www.9thco.com/?utm_source=schema" target="_blank">9thCO</a>
    </td>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/28635252?s=200&v=4" height="50px;" alt="StackBlitz" />
      <br />
      <a style="text-decoration:none;" href="https://stackblitz.com/?utm_source=schema" target="_blank">StackBlitz</a>
    </td>
  </tr>
</table>

<br/>

<h3 align="center">Bronze</h3>

<table align="center" style="justify-content: center;align-items: center;display: flex;">
  <tr>
    <td align="center">
      <a href="https://www.code4japan.org/?utm_source=schema">
        <img src="https://Schema.dev/sponsors/code-for-japan.png" height="40px;" alt="Code for Japan logo" />
      </a>
    </td>
    <td align="center">
      <a href="https://www.route4me.com/">
        <img src="https://avatars.githubusercontent.com/u/7936820?s=200&v=4" height="40px;" alt="route4me logo" />
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/jasonLaster">
        <img src="https://avatars.githubusercontent.com/u/254562?v=4" height="40px;" alt="Jason Laster" />
      </a>
    </td>
    <td align="center">
      <a href="https://convex.dev/?utm_source=schema">
        <img src="https://avatars.githubusercontent.com/u/81530787?s=200&v=4" height="40px;" alt="Convex logo" />
      </a>
    </td>
    <td align="center">
      <a href="https://n8n.io/?utm_source=schema">
        <img src="https://avatars.githubusercontent.com/u/104988782?s=200&v=4" height="40px;" alt="n8n logo" />
      </a>
    </td>
  </tr>
</table>

<!-- <h3 align="center">Bronze</h3>

<table align="center" style="justify-content: center;align-items: center;display: flex;">
  <tr>
    <td>Brandon Bayer</td>
    <td>Jiří Brabec</td>
    <td>Alex Johansson</td>
    <td>Fungible Systems</td>
  </tr>
  <tr>
    <td>Adaptable</td>
    <td>Avana Wallet</td>
    <td>Jason Lengstorf</td>
    <td>Global Illumination, Inc.</td>
  </tr>
  <tr>
    <td>MasterBorn</td>
    <td>Ryan Palmer</td>
    <td>Michael Sweeney</td>
    <td>Nextbase</td>
  </tr>
  <tr>
    <td>Remotion</td>
    <td>Connor Sinnott</td>
    <td>Mohammad-Ali A'râbi</td>
    <td>Supatool</td>
  </tr>
</table> -->

### Ecosystem

There are a growing number of tools that are built atop or support Schema natively! If you've built a tool or library on top of Schema, tell me about it [on Twitter](https://twitter.com/colinhacks) or [start a Discussion](https://github.com/colinhacks/schema/discussions). I'll add it below and tweet it out.

#### Resources

- [Total TypeScript Schema Tutorial](https://www.totaltypescript.com/tutorials/schema) by [@mattpocockuk](https://twitter.com/mattpocockuk)
- [Fixing TypeScript's Blindspot: Runtime Typechecking](https://www.youtube.com/watch?v=rY_XqfSHock) by [@jherr](https://twitter.com/jherr)

#### API libraries

- [`tRPC`](https://github.com/trpc/trpc): Build end-to-end typesafe APIs without GraphQL.
- [`@anatine/schema-nestjs`](https://github.com/anatine/schema-plugins/tree/main/packages/schema-nestjs): Helper methods for using Schema in a NestJS project.
- [`schema-endpoints`](https://github.com/flock-community/schema-endpoints): Contract-first strictly typed endpoints with Schema. OpenAPI compatible.
- [`zhttp`](https://github.com/evertdespiegeleer/zhttp): An OpenAPI compatible, strictly typed http library with Schema input and response validation.
- [`domain-functions`](https://github.com/SeasonedSoftware/domain-functions/): Decouple your business logic from your framework using composable functions. With first-class type inference from end to end powered by Schema schemas.
- [`@schemaios/core`](https://github.com/ecyrbe/schemaios): A typescript API client with runtime and compile time validation backed by axios and Schema.
- [`express-schema-api`](https://github.com/RobinTail/express-schema-api): Build Express-based APIs with I/O schema validation and custom middlewares.
- [`tapiduck`](https://github.com/sumukhbarve/monoduck/blob/main/src/tapiduck/README.md): End-to-end typesafe JSON APIs with Schema and Express; a bit like tRPC, but simpler.
- [`koa-schema-router`](https://github.com/JakeFenley/koa-schema-router): Create typesafe routes in Koa with I/O validation using Schema.
- [`schema-sockets`](https://github.com/RobinTail/schema-sockets): Schema-powered Socket.IO microframework with I/O validation and built-in AsyncAPI specs
- [`oas-tsschema-gen`](https://github.com/inkognitro/oas-tsschema-gen): Client SDK code generator to convert OpenApi v3 specifications into TS endpoint caller functions with Schema types.
- [`GQLoom`](https://github.com/modevol-com/gqloom): Weave GraphQL schema and resolvers using Schema.
- [`oRPC`](https://github.com/unnoq/orpc): Typesafe APIs Made Simple

#### Form integrations

- [`react-hook-form`](https://github.com/react-hook-form/resolvers#schema): A first-party Schema resolver for React Hook Form.
- [`TanStack Form`](https://github.com/TanStack/form): Headless, performant, and type-safe form state management for TS/JS, React, Vue, Angular, Solid, and Lit
- [`schema-validation-error`](https://github.com/causaly/schema-validation-error): Generate user-friendly error messages from `SchemaError`s.
- [`schema-formik-adapter`](https://github.com/robertLichtnow/schema-formik-adapter): A community-maintained Formik adapter for Schema.
- [`react-zorm`](https://github.com/esamattis/react-zorm): Standalone `<form>` generation and validation for React using Schema.
- [`schemaix`](https://github.com/rileytomasek/schemaix): Schema utilities for FormData and URLSearchParams in Remix loaders and actions.
- [`conform`](https://conform.guide/api/schema/parseWithSchema): A typesafe form validation library for progressive enhancement of HTML forms. Works with Remix and Next.js.
- [`remix-params-helper`](https://github.com/kiliman/remix-params-helper): Simplify integration of Schema with standard URLSearchParams and FormData for Remix apps.
- [`formik-validator-schema`](https://github.com/glazy/formik-validator-schema): Formik-compliant validator library that simplifies using Schema with Formik.
- [`schema-i18n-map`](https://github.com/aiji42/schema-i18n): Useful for translating Schema error messages.
- [`@modular-forms/solid`](https://github.com/fabian-hiller/modular-forms): Modular form library for SolidJS that supports Schema for validation.
- [`houseform`](https://github.com/crutchcorn/houseform/): A React form library that uses Schema for validation.
- [`sveltekit-superforms`](https://github.com/ciscoheat/sveltekit-superforms): Supercharged form library for SvelteKit with Schema validation.
- [`mobx-schema-form`](https://github.com/MonoidDev/mobx-schema-form): Data-first form builder based on MobX & Schema.
- [`@vee-validate/schema`](https://github.com/logaretm/vee-validate/tree/main/packages/schema): Form library for Vue.js with Schema schema validation.
- [`schema-form-renderer`](https://github.com/thepeaklab/schema-form-renderer): Auto-infer form fields from schema schema and render them with react-hook-form with E2E type safety.
- [`antd-schema`](https://github.com/MrBr/antd-schema): Schema adapter for Ant Design form fields validation.
- [`frrm`](https://github.com/schalkventer/frrm): Tiny 0.5kb Schema-based, HTML form abstraction that goes brr.

#### Schema to X

- [`schema-to-ts`](https://github.com/sachinraja/schema-to-ts): Generate TypeScript definitions from Schema schemas.
- [`schema-to-json-schema`](https://github.com/StefanTerdell/schema-to-json-schema): Convert your Schema schemas into [JSON Schemas](https://json-Schema.org/).
- [`@anatine/schema-openapi`](https://github.com/anatine/schema-plugins/tree/main/packages/schema-openapi): Converts a Schema schema to an OpenAPI v3.x `SchemaObject`.
- [`schema-fast-check`](https://github.com/DavidTimms/schema-fast-check): Generate `fast-check` arbitraries from Schema schemas.
- [`schema-dto`](https://github.com/kbkk/abitia/tree/master/packages/schema-dto): Generate Nest.js DTOs from a Schema Schema.
- [`fastify-type-provider-schema`](https://github.com/turkerdev/fastify-type-provider-schema): Create Fastify type providers from Schema schemas.
- [`schema-to-openapi`](https://github.com/asteasolutions/schema-to-openapi): Generate full OpenAPI (Swagger) docs from Schema, including schemas, endpoints & parameters.
- [`nestjs-graphql-schema`](https://github.com/incetarik/nestjs-graphql-schema): Generates NestJS GraphQL model classes from Schema schemas. Provides GraphQL method decorators working with Schema schemas.
- [`schema-openapi`](https://github.com/samchungy/schema-openapi): Create full OpenAPI v3.x documentation from Schema schemas.
- [`fastify-schema-openapi`](https://github.com/samchungy/fastify-schema-openapi): Fastify type provider, validation, serialization and @fastify/swagger support for Schema schemas.
- [`typeschema`](https://typeschema.com/): Universal adapter for schema validation.
- [`schemaex`](https://github.com/commonbaseapp/schemaex): (De)serialization for schema schemas
- [`convex-helpers`](https://github.com/get-convex/convex-helpers/blob/main/packages/convex-helpers/README.md#schema-validation): Use Schema to validate arguments and return values of Convex functions, and to create Convex database schemas.

#### X to Schema

- [`ts-to-schema`](https://github.com/fabien0102/ts-to-schema): Convert TypeScript definitions into Schema schemas.
- [`@runtyping/schema`](https://github.com/johngeorgewright/runtyping): Generate Schema from static types & JSON Schema.
- [`json-schema-to-schema`](https://github.com/StefanTerdell/json-schema-to-schema): Convert your [JSON Schemas](https://json-Schema.org/) into Schema schemas. [Live demo](https://StefanTerdell.github.io/json-schema-to-schema-react/).
- [`json-to-schema`](https://github.com/rsinohara/json-to-schema): Convert JSON objects into Schema schemas. [Live demo](https://rsinohara.github.io/json-to-schema-react/).
- [`graphql-codegen-typescript-validation-schema`](https://github.com/Code-Hex/graphql-codegen-typescript-validation-schema): GraphQL Code Generator plugin to generate form validation schema from your GraphQL Schema.
- [`schema-prisma`](https://github.com/CarterGrimmeisen/schema-prisma): Generate Schema schemas from your Prisma Schema.
- [`Supervillain`](https://github.com/Southclaws/supervillain): Generate Schema schemas from your Go structs.
- [`prisma-schema-generator`](https://github.com/omar-dulaimi/prisma-schema-generator): Emit Schema schemas from your Prisma Schema.
- [`drizzle-schema`](https://orm.drizzle.team/docs/schema): Emit Schema schemas from your Drizzle Schema.
- [`prisma-trpc-generator`](https://github.com/omar-dulaimi/prisma-trpc-generator): Emit fully implemented tRPC routers and their validation schemas using Schema.
- [`schema-prisma-types`](https://github.com/chrishoermann/schema-prisma-types) Create Schema types from your Prisma models.
- [`quicktype`](https://app.quicktype.io/): Convert JSON objects and JSON schemas into Schema schemas.
- [`@sanity-typed/schema`](https://github.com/saiichihashimoto/sanity-typed/tree/main/packages/schema): Generate Schema Schemas from [Sanity Schemas](https://www.sanity.io/docs/schema-types).
- [`java-to-schema`](https://github.com/ivangreene/java-to-schema): Convert POJOs to Schema schemas
- [`Orval`](https://github.com/anymaniax/orval): Generate Schema schemas from OpenAPI schemas
- [`Kubb`](https://github.com/kubb-labs/kubb): Generate SDKs and Schema schemas from your OpenAPI schemas
- [`convex-helpers`](https://github.com/get-convex/convex-helpers/blob/main/packages/convex-helpers/README.md#schema-validation): Generate Schema schemas from Convex validators.

#### Mocking

- [`@anatine/schema-mock`](https://github.com/anatine/schema-plugins/tree/main/packages/schema-mock): Generate mock data from a Schema Schema. Powered by [faker.js](https://github.com/faker-js/faker).
- [`schema-mocking`](https://github.com/dipasqualew/schema-mocking): Generate mock data from your Schema schemas.
- [`schema-fixture`](https://github.com/timdeschryver/schema-fixture): Use your schema schemas to automate the generation of non-relevant test fixtures in a deterministic way.
- [`zocker`](https://zocker.sigrist.dev): Generate plausible mock-data from your schemas.
- [`schemaock`](https://github.com/ItMaga/schemaock) Generate mock data based on Schema schemas.
- [`schema-schema-faker`](https://github.com/soc221b/schema-schema-faker) Generates mock data from Schema schemas. Powered by [@faker-js/faker](https://github.com/faker-js/faker) and [randexp.js](https://github.com/fent/randexp.js)

#### Powered by Schema

- [`freerstore`](https://github.com/JacobWeisenburger/freerstore): Firestore cost optimizer.
- [`slonik`](https://github.com/gajus/slonik/tree/gajus/add-schema-validation-backwards-compatible#runtime-validation-and-static-type-inference): Node.js Postgres client with strong Schema integration.
- [`schemql`](https://github.com/a2lix/schemql): Enhances your SQL workflow by combining raw SQL with targeted type safety and schema validation.
- [`soly`](https://github.com/mdbetancourt/soly): Create CLI applications with Schema.
- [`pastel`](https://github.com/vadimdemedes/pastel): Create CLI applications with react, schema, and ink.
- [`schema-xlsx`](https://github.com/sidwebworks/schema-xlsx): A xlsx based resource validator using Schema schemas.
- [`znv`](https://github.com/lostfictions/znv): Type-safe environment parsing and validation for Node.js with Schema schemas.
- [`schema-config`](https://github.com/alexmarqs/schema-config): Load configurations across multiple sources with flexible adapters, ensuring type safety with Schema.
- [`unplugin-environment`](https://github.com/r17x/js/tree/main/packages/unplugin-environment#readme): A plugin for loading environment variables safely with schema validation, simple with virtual module, type-safe with intellisense, and better DX 🔥 🚀 👷. Powered by Schema.
- [`schema-struct`](https://codeberg.org/reesericci/schema-struct): Create runtime-checked structs with Schema.
- [`schema-csv`](https://github.com/bartoszgolebiowski/schema-csv): Validation helpers for schema for parsing CSV data.
- [`fullproduct.dev`](https://fullproduct.dev?identity=freelancers&v=z3): Universal Expo + Next.js App Starter that uses Schema schemas as the single source of truth to keep generated MDX docs, GraphQL, database models, forms, and fetcher functions in sync.

#### Utilities for Schema

- [`schema_utilz`](https://github.com/JacobWeisenburger/schema_utilz): Framework agnostic utilities for Schema.
- [`schema-playground`](https://github.com/marilari88/schema-playground): A tool for learning and testing Schema schema validation functionalities. [Link](https://schema-playground.vercel.app/).
- [`schema-sandbox`](https://github.com/nereumelo/schema-sandbox): Controlled environment for testing schema schemas. [Live demo](https://schema-sandbox.vercel.app/).
- [`schema-dev`](https://github.com/schalkventer/schema-dev): Conditionally disables Schema runtime parsing in production.
- [`schema-accelerator`](https://github.com/duplojs/duplojs-schema-accelerator): Accelerates Schema's throughput up to ~100x.
- [`schema-ir`](https://github.com/Reza-kh80/schema-ir): Comprehensive validation for Iranian data structures (National Code, Bank Cards, Sheba, Crypto, etc) with **smart metadata extraction** (Bank Names, Logos). Zero dependencies.

<br/>

## Installation

### Requirements

- TypeScript 4.5+!
- You must enable `strict` mode in your `tsconfig.json`. This is a best practice for all TypeScript projects.

  ```ts
  // tsconfig.json
  {
    // ...
    "compilerOptions": {
      // ...
      "strict": true
    }
  }
  ```

### From `npm`

```sh
npm install schema       # npm
deno add npm:schema      # deno
yarn add schema          # yarn
bun add schema           # bun
pnpm add schema          # pnpm
```

> The rest of this README assumes you are using npm and importing directly from the `"schema"` package.

<br/>

## Basic usage

Creating a simple string schema

```ts
import { Schema } from "schema";

// creating a schema for strings
const mySchema = Schema.string();

// parsing
mySchema.parse("tuna"); // => "tuna"
mySchema.parse(12); // => throws SchemaError

// "safe" parsing (doesn't throw error if validation fails)
mySchema.safeParse("tuna"); // => { success: true; data: "tuna" }
mySchema.safeParse(12); // => { success: false; error: SchemaError }
```

Creating an object schema

```ts
import { Schema } from "schema";

const User = Schema.object({
  username: Schema.string(),
});

User.parse({ username: "Ludwig" });

// extract the inferred type
type User = Schema.infer<typeof User>;
// { username: string }
```

<br/>

## Primitives

```ts
import { Schema } from "schema";

// primitive values
Schema.string();
Schema.number();
Schema.bigint();
Schema.boolean();
Schema.date();
Schema.symbol();

// empty types
Schema.undefined();
Schema.null();
Schema.void(); // accepts undefined

// catch-all types
// allows any value
Schema.any();
Schema.unknown();

// never type
// allows no values
Schema.never();
```

<br/>

## Coercion for primitives

Schema now provides a more convenient way to coerce primitive values.

```ts
const schema = Schema.coerce.string();
Schema.parse("tuna"); // => "tuna"
Schema.parse(12); // => "12"
```

During the parsing step, the input is passed through the `String()` function, which is a JavaScript built-in for coercing data into strings.

```ts
Schema.parse(12); // => "12"
Schema.parse(true); // => "true"
Schema.parse(undefined); // => "undefined"
Schema.parse(null); // => "null"
```

The returned schema is a normal `SchemaString` instance so you can use all string methods.

```ts
Schema.coerce.string().email().min(5);
```

**How coercion works**

All primitive types support coercion. Schema coerces all inputs using the built-in constructors: `String(input)`, `Number(input)`, `new Date(input)`, etc.

```ts
Schema.coerce.string(); // String(input)
Schema.coerce.number(); // Number(input)
Schema.coerce.boolean(); // Boolean(input)
Schema.coerce.bigint(); // BigInt(input)
Schema.coerce.date(); // new Date(input)
```

**Note** — Boolean coercion with `Schema.coerce.boolean()` may not work how you expect. Any [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) value is coerced to `true`, and any [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) value is coerced to `false`.

```ts
const schema = Schema.coerce.boolean(); // Boolean(input)

Schema.parse("tuna"); // => true
Schema.parse("true"); // => true
Schema.parse("false"); // => true
Schema.parse(1); // => true
Schema.parse([]); // => true

Schema.parse(0); // => false
Schema.parse(""); // => false
Schema.parse(undefined); // => false
Schema.parse(null); // => false
```

For more control over coercion logic, consider using [`Schema.preprocess`](#preprocess) or [`Schema.pipe()`](#pipe).

<br/>

## Literals

Literal schemas represent a [literal type](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types), like `"hello world"` or `5`.

```ts
const tuna = Schema.literal("tuna");
const twelve = Schema.literal(12);
const twobig = Schema.literal(2n); // bigint literal
const tru = Schema.literal(true);

const terrificSymbol = Symbol("terrific");
const terrific = Schema.literal(terrificSymbol);

// retrieve literal value
tuna.value; // "tuna"
```

> Currently there is no support for Date literals in Schema. If you have a use case for this feature, please file an issue.

<br/>

## Strings

Schema includes a handful of string-specific validations.

```ts
// validations
Schema.string().max(5);
Schema.string().min(5);
Schema.string().length(5);
Schema.string().email();
Schema.string().url();
Schema.string().emoji();
Schema.string().uuid();
Schema.string().nanoid();
Schema.string().cuid();
Schema.string().cuid2();
Schema.string().ulid();
Schema.string().regex(regex);
Schema.string().includes(string);
Schema.string().startsWith(string);
Schema.string().endsWith(string);
Schema.string().datetime(); // ISO 8601; by default only `Z` timezone allowed
Schema.string().ip(); // defaults to allow both IPv4 and IPv6
Schema.string().cidr(); // defaults to allow both IPv4 and IPv6

// transforms
Schema.string().trim(); // trim whitespace
Schema.string().toLowerCase(); // toLowerCase
Schema.string().toUpperCase(); // toUpperCase

// added in Schema 3.23
Schema.string().date(); // ISO date format (YYYY-MM-DD)
Schema.string().time(); // ISO time format (HH:mm:ss[.SSSSSS] or HH:mm)
Schema.string().duration(); // ISO 8601 duration
Schema.string().base64();
```

> Check out [validator.js](https://github.com/validatorjs/validator.js) for a bunch of other useful string validation functions that can be used in conjunction with [Refinements](#refine).

You can customize some common error messages when creating a string Schema.

```ts
const name = Schema.string({
  required_error: "Name is required",
  invalid_type_error: "Name must be a string",
});
```

When using validation methods, you can pass in an additional argument to provide a custom error message.

```ts
Schema.string().min(5, { message: "Must be 5 or more characters long" });
Schema.string().max(5, { message: "Must be 5 or fewer characters long" });
Schema.string().length(5, { message: "Must be exactly 5 characters long" });
Schema.string().email({ message: "Invalid email address" });
Schema.string().url({ message: "Invalid url" });
Schema.string().emoji({ message: "Contains non-emoji characters" });
Schema.string().uuid({ message: "Invalid UUID" });
Schema.string().includes("tuna", { message: "Must include tuna" });
Schema.string().startsWith("https://", { message: "Must provide secure URL" });
Schema.string().endsWith(".com", { message: "Only .com domains allowed" });
Schema.string().datetime({ message: "Invalid datetime string! Must be UTC." });
Schema.string().date({ message: "Invalid date string!" });
Schema.string().time({ message: "Invalid time string!" });
Schema.string().ip({ message: "Invalid IP address" });
Schema.string().cidr({ message: "Invalid CIDR" });
```

### Datetimes

As you may have noticed, Schema string includes a few date/time related validations. These validations are regular expression based, so they are not as strict as a full date/time library. However, they are very convenient for validating user input.

The `Schema.string().datetime()` method enforces ISO 8601; default is no timezone offsets and arbitrary sub-second decimal precision. Seconds may be omitted if precision is not set.

```ts
const datetime = Schema.string().datetime();

datetime.parse("2020-01-01T00:00:00Z"); // pass
datetime.parse("2020-01-01T00:00:00.123Z"); // pass
datetime.parse("2020-01-01T00:00:00.123456Z"); // pass (arbitrary precision)
datetime.parse("2020-01-01T00:00Z"); // pass (hours and minutes only)
datetime.parse("2020-01-01T00:00:00+02:00"); // fail (no offsets allowed)
```

Timezone offsets can be allowed by setting the `offset` option to `true`.

```ts
const datetime = Schema.string().datetime({ offset: true });

datetime.parse("2020-01-01T00:00:00+02:00"); // pass
datetime.parse("2020-01-01T00:00+02:00"); // pass
datetime.parse("2020-01-01T00:00:00.123+02:00"); // pass (millis optional)
datetime.parse("2020-01-01T00:00:00.123+0200"); // pass (millis optional)
datetime.parse("2020-01-01T00:00:00.123+02"); // pass (only offset hours)
datetime.parse("2020-01-01T00:00:00Z"); // pass (Z still supported)
```

Allow unqualified (timezone-less) datetimes with the `local` flag.

```ts
const schema = Schema.string().datetime({ local: true });
Schema.parse("2020-01-01T00:00:00"); // pass
Schema.parse("2020-01-01T00:00"); // pass
```

You can additionally constrain the allowable `precision`. By default, arbitrary sub-second precision is supported (but optional).

```ts
const datetime = Schema.string().datetime({ precision: 3 });

datetime.parse("2020-01-01T00:00:00.123Z"); // pass
datetime.parse("2020-01-01T00:00:00Z"); // fail
datetime.parse("2020-01-01T00:00Z"); // fail
datetime.parse("2020-01-01T00:00:00.123456Z"); // fail
```

### Dates

> Added in Schema 3.23

The `Schema.string().date()` method validates strings in the format `YYYY-MM-DD`.

```ts
const date = Schema.string().date();

date.parse("2020-01-01"); // pass
date.parse("2020-1-1"); // fail
date.parse("2020-01-32"); // fail
```

### Times

> Added in Schema 3.23

The `Schema.string().time()` method validates strings in the format `HH:MM` or `HH:MM:SS[.s+]`. The second can include arbitrary decimal precision. It does not allow timezone offsets of any kind.

```ts
const time = Schema.string().time();

time.parse("00:00:00"); // pass
time.parse("09:52:31"); // pass
time.parse("09:52"); // pass
time.parse("23:59:59.9999999"); // pass (arbitrary precision)

time.parse("00:00:00.123Z"); // fail (no `Z` allowed)
time.parse("00:00:00.123+02:00"); // fail (no offsets allowed)
```

You can set the `precision` option to constrain the allowable decimal precision.

```ts
const time = Schema.string().time({ precision: 3 });

time.parse("00:00:00.123"); // pass
time.parse("00:00:00.123456"); // fail
time.parse("00:00:00"); // fail
time.parse("00:00"); // fail
```

### IP addresses

By default `.ip()` allows both IPv4 and IPv6.

```ts
const ip = Schema.string().ip();

ip.parse("192.168.1.1"); // pass
ip.parse("84d5:51a0:9114:1855:4cfa:f2d7:1f12:7003"); // pass
ip.parse("84d5:51a0:9114:1855:4cfa:f2d7:1f12:192.168.1.1"); // pass

ip.parse("256.1.1.1"); // fail
ip.parse("84d5:51a0:9114:gggg:4cfa:f2d7:1f12:7003"); // fail
```

You can additionally set the IP `version`.

```ts
const ipv4 = Schema.string().ip({ version: "v4" });
ipv4.parse("84d5:51a0:9114:1855:4cfa:f2d7:1f12:7003"); // fail

const ipv6 = Schema.string().ip({ version: "v6" });
ipv6.parse("192.168.1.1"); // fail
```

### IP ranges (CIDR)

Validate IP address ranges specified with [CIDR notation](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing). By default, `.cidr()` allows both IPv4 and IPv6.

```ts
const cidr = Schema.string().cidr();
cidr.parse("192.168.0.0/24"); // pass
cidr.parse("2001:db8::/32"); // pass
```

You can specify a version with the `version` parameter.

```ts
const ipv4Cidr = Schema.string().cidr({ version: "v4" });
ipv4Cidr.parse("84d5:51a0:9114:1855:4cfa:f2d7:1f12:7003"); // fail

const ipv6Cidr = Schema.string().cidr({ version: "v6" });
ipv6Cidr.parse("192.168.1.1"); // fail
```

<br/>

## Numbers

You can customize certain error messages when creating a number Schema.

```ts
const age = Schema.number({
  required_error: "Age is required",
  invalid_type_error: "Age must be a number",
});
```

Schema includes a handful of number-specific validations.

```ts
Schema.number().gt(5);
Schema.number().gte(5); // alias .min(5)
Schema.number().lt(5);
Schema.number().lte(5); // alias .max(5)

Schema.number().int(); // value must be an integer

Schema.number().positive(); //     > 0
Schema.number().nonnegative(); //  >= 0
Schema.number().negative(); //     < 0
Schema.number().nonpositive(); //  <= 0

Schema.number().multipleOf(5); // Evenly divisible by 5. Alias .step(5)

Schema.number().finite(); // value must be finite, not Infinity or -Infinity
Schema.number().safe(); // value must be between Number.MIN_SAFE_INTEGER and Number.MAX_SAFE_INTEGER
```

Optionally, you can pass in a second argument to provide a custom error message.

```ts
Schema.number().lte(5, { message: "this👏is👏too👏big" });
```

<br/>

## BigInts

Schema includes a handful of bigint-specific validations.

```ts
Schema.bigint().gt(5n);
Schema.bigint().gte(5n); // alias `.min(5n)`
Schema.bigint().lt(5n);
Schema.bigint().lte(5n); // alias `.max(5n)`

Schema.bigint().positive(); // > 0n
Schema.bigint().nonnegative(); // >= 0n
Schema.bigint().negative(); // < 0n
Schema.bigint().nonpositive(); // <= 0n

Schema.bigint().multipleOf(5n); // Evenly divisible by 5n.
```

<br/>

## NaNs

You can customize certain error messages when creating a nan Schema.

```ts
const isNaN = Schema.nan({
  required_error: "isNaN is required",
  invalid_type_error: "isNaN must be 'not a number'",
});
```

<br/>

## Booleans

You can customize certain error messages when creating a boolean Schema.

```ts
const isActive = Schema.boolean({
  required_error: "isActive is required",
  invalid_type_error: "isActive must be a boolean",
});
```

<br/>

## Dates

Use Schema.date() to validate `Date` instances.

```ts
Schema.date().safeParse(new Date()); // success: true
Schema.date().safeParse("2022-01-12T00:00:00.000Z"); // success: false
```

You can customize certain error messages when creating a date Schema.

```ts
const myDateSchema = Schema.date({
  required_error: "Please select a date and time",
  invalid_type_error: "That's not a date!",
});
```

Schema provides a handful of date-specific validations.

```ts
Schema.date().min(new Date("1900-01-01"), { message: "Too old" });
Schema.date().max(new Date(), { message: "Too young!" });
```

**Coercion to Date**

Since [schema 3.20](https://github.com/colinhacks/schema/releases/tag/v3.20), use [`Schema.coerce.date()`](#coercion-for-primitives) to pass the input through `new Date(input)`.

```ts
const dateSchema = Schema.coerce.date();
type DateSchema = Schema.infer<typeof dateSchema>;
// type DateSchema = Date

/* valid dates */
console.log(dateSchema.safeParse("2023-01-10T00:00:00.000Z").success); // true
console.log(dateSchema.safeParse("2023-01-10").success); // true
console.log(dateSchema.safeParse("1/10/23").success); // true
console.log(dateSchema.safeParse(new Date("1/10/23")).success); // true

/* invalid dates */
console.log(dateSchema.safeParse("2023-13-10").success); // false
console.log(dateSchema.safeParse("0000-00-00").success); // false
```

For older schema versions, use [`Schema.preprocess`](#preprocess) like [described in this thread](https://github.com/colinhacks/schema/discussions/879#discussioncomment-2036276).

<br/>

## Schema enums

```ts
const FishEnum = Schema.enum(["Salmon", "Tuna", "Trout"]);
type FishEnum = Schema.infer<typeof FishEnum>;
// 'Salmon' | 'Tuna' | 'Trout'
```

`Schema.enum` is a Schema-native way to declare a schema with a fixed set of allowable _string_ values. Pass the array of values directly into `Schema.enum()`. Alternatively, use `as const` to define your enum values as a tuple of strings. See the [const assertion docs](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions) for details.

```ts
const VALUES = ["Salmon", "Tuna", "Trout"] as const;
const FishEnum = Schema.enum(VALUES);
```

This is not allowed, since Schema isn't able to infer the exact values of each element.

```ts
const fish = ["Salmon", "Tuna", "Trout"];
const FishEnum = Schema.enum(fish);
```

**`.enum`**

To get autocompletion with a Schema enum, use the `.enum` property of your schema:

```ts
FishEnum.enum.Salmon; // => autocompletes

FishEnum.enum;
/*
=> {
  Salmon: "Salmon",
  Tuna: "Tuna",
  Trout: "Trout",
}
*/
```

You can also retrieve the list of options as a tuple with the `.options` property:

```ts
FishEnum.options; // ["Salmon", "Tuna", "Trout"];
```

**`.exclude/.extract()`**

You can create subsets of a Schema enum with the `.exclude` and `.extract` methods.

```ts
const FishEnum = Schema.enum(["Salmon", "Tuna", "Trout"]);
const SalmonAndTrout = FishEnum.extract(["Salmon", "Trout"]);
const TunaOnly = FishEnum.exclude(["Salmon", "Trout"]);
```

<br/>

## Native enums

Schema enums are the recommended approach to defining and validating enums. But if you need to validate against an enum from a third-party library (or you don't want to rewrite your existing enums) you can use `Schema.nativeEnum()`.

**Numeric enums**

```ts
enum Fruits {
  Apple,
  Banana,
}

const FruitEnum = Schema.nativeEnum(Fruits);
type FruitEnum = Schema.infer<typeof FruitEnum>; // Fruits

FruitEnum.parse(Fruits.Apple); // passes
FruitEnum.parse(Fruits.Banana); // passes
FruitEnum.parse(0); // passes
FruitEnum.parse(1); // passes
FruitEnum.parse(3); // fails
```

**String enums**

```ts
enum Fruits {
  Apple = "apple",
  Banana = "banana",
  Cantaloupe, // you can mix numerical and string enums
}

const FruitEnum = Schema.nativeEnum(Fruits);
type FruitEnum = Schema.infer<typeof FruitEnum>; // Fruits

FruitEnum.parse(Fruits.Apple); // passes
FruitEnum.parse(Fruits.Cantaloupe); // passes
FruitEnum.parse("apple"); // passes
FruitEnum.parse("banana"); // passes
FruitEnum.parse(0); // passes
FruitEnum.parse("Cantaloupe"); // fails
```

**Const enums**

The `.nativeEnum()` function works for `as const` objects as well. ⚠️ `as const` requires TypeScript 3.4+!

```ts
const Fruits = {
  Apple: "apple",
  Banana: "banana",
  Cantaloupe: 3,
} as const;

const FruitEnum = Schema.nativeEnum(Fruits);
type FruitEnum = Schema.infer<typeof FruitEnum>; // "apple" | "banana" | 3

FruitEnum.parse("apple"); // passes
FruitEnum.parse("banana"); // passes
FruitEnum.parse(3); // passes
FruitEnum.parse("Cantaloupe"); // fails
```

You can access the underlying object with the `.enum` property:

```ts
FruitEnum.enum.Apple; // "apple"
```

<br/>

## Optionals

You can make any schema optional with `Schema.optional()`. This wraps the schema in a `SchemaOptional` instance and returns the result.

```ts
const schema = Schema.optional(Schema.string());

Schema.parse(undefined); // => returns undefined
type A = Schema.infer<typeof schema>; // string | undefined
```

For convenience, you can also call the `.optional()` method on an existing Schema.

```ts
const user = Schema.object({
  username: Schema.string().optional(),
});
type C = Schema.infer<typeof user>; // { username?: string | undefined };
```

You can extract the wrapped schema from a `SchemaOptional` instance with `.unwrap()`.

```ts
const stringSchema = Schema.string();
const optionalString = stringSchema.optional();
optionalString.unwrap() === stringSchema; // true
```

<br/>

## Nullables

Similarly, you can create nullable types with `Schema.nullable()`.

```ts
const nullableString = Schema.nullable(Schema.string());
nullableString.parse("asdf"); // => "asdf"
nullableString.parse(null); // => null
```

Or use the `.nullable()` method.

```ts
const E = Schema.string().nullable(); // equivalent to nullableString
type E = Schema.infer<typeof E>; // string | null
```

Extract the inner schema with `.unwrap()`.

```ts
const stringSchema = Schema.string();
const nullableString = stringSchema.nullable();
nullableString.unwrap() === stringSchema; // true
```

<br/>

## Objects

```ts
// all properties are required by default
const Dog = Schema.object({
  name: Schema.string(),
  age: Schema.number(),
});

// extract the inferred type like this
type Dog = Schema.infer<typeof Dog>;

// equivalent to:
type Dog = {
  name: string;
  age: number;
};
```

### `.shape`

Use `.shape` to access the schemas for a particular key.

```ts
Dog.shape.name; // => string schema
Dog.shape.age; // => number schema
```

### `.keyof`

Use `.keyof` to create a `SchemaEnum` schema from the keys of an object Schema.

```ts
const keySchema = Dog.keyof();
keySchema; // SchemaEnum<["name", "age"]>
```

### `.extend`

You can add additional fields to an object schema with the `.extend` method.

```ts
const DogWithBreed = Dog.extend({
  breed: Schema.string(),
});
```

You can use `.extend` to overwrite fields! Be careful with this power!

### `.merge`

Equivalent to `A.extend(B.shape)`.

```ts
const BaseTeacher = Schema.object({ students: Schema.array(Schema.string()) });
const HasID = Schema.object({ id: Schema.string() });

const Teacher = BaseTeacher.merge(HasID);
type Teacher = Schema.infer<typeof Teacher>; // => { students: string[], id: string }
```

> If the two schemas share keys, the properties of B overrides the property of A. The returned schema also inherits the "unknownKeys" policy (strip/strict/passthrough) and the catchall schema of B.

### `.pick/.omit`

Inspired by TypeScript's built-in `Pick` and `Omit` utility types, all Schema object schemas have `.pick` and `.omit` methods that return a modified version. Consider this Recipe schema:

```ts
const Recipe = Schema.object({
  id: Schema.string(),
  name: Schema.string(),
  ingredients: Schema.array(Schema.string()),
});
```

To only keep certain keys, use `.pick` .

```ts
const JustTheName = Recipe.pick({ name: true });
type JustTheName = Schema.infer<typeof JustTheName>;
// => { name: string }
```

To remove certain keys, use `.omit` .

```ts
const NoIDRecipe = Recipe.omit({ id: true });

type NoIDRecipe = Schema.infer<typeof NoIDRecipe>;
// => { name: string, ingredients: string[] }
```

### `.partial`

Inspired by the built-in TypeScript utility type [Partial](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype), the `.partial` method makes all properties optional.

Starting from this object:

```ts
const user = Schema.object({
  email: Schema.string(),
  username: Schema.string(),
});
// { email: string; username: string }
```

We can create a partial version:

```ts
const partialUser = user.partial();
// { email?: string | undefined; username?: string | undefined }
```

You can also specify which properties to make optional:

```ts
const optionalEmail = user.partial({
  email: true,
});
/*
{
  email?: string | undefined;
  username: string
}
*/
```

### `.deepPartial`

The `.partial` method is shallow — it only applies one level deep. There is also a "deep" version:

```ts
const user = Schema.object({
  username: Schema.string(),
  location: Schema.object({
    latitude: Schema.number(),
    longitude: Schema.number(),
  }),
  strings: Schema.array(Schema.object({ value: Schema.string() })),
});

const deepPartialUser = user.deepPartial();

/*
{
  username?: string | undefined,
  location?: {
    latitude?: number | undefined;
    longitude?: number | undefined;
  } | undefined,
  strings?: { value?: string}[]
}
*/
```

> Important limitation: deep partials only work as expected in hierarchies of objects, arrays, and tuples.

### `.required`

Contrary to the `.partial` method, the `.required` method makes all properties required.

Starting from this object:

```ts
const user = z
  .object({
    email: Schema.string(),
    username: Schema.string(),
  })
  .partial();
// { email?: string | undefined; username?: string | undefined }
```

We can create a required version:

```ts
const requiredUser = user.required();
// { email: string; username: string }
```

You can also specify which properties to make required:

```ts
const requiredEmail = user.required({
  email: true,
});
/*
{
  email: string;
  username?: string | undefined;
}
*/
```

### `.passthrough`

By default Schema object schemas strip out unrecognized keys during parsing.

```ts
const person = Schema.object({
  name: Schema.string(),
});

person.parse({
  name: "bob dylan",
  extraKey: 61,
});
// => { name: "bob dylan" }
// extraKey has been stripped
```

Instead, if you want to pass through unknown keys, use `.passthrough()` .

```ts
person.passthrough().parse({
  name: "bob dylan",
  extraKey: 61,
});
// => { name: "bob dylan", extraKey: 61 }
```

### `.strict`

By default Schema object schemas strip out unrecognized keys during parsing. You can _disallow_ unknown keys with `.strict()` . If there are any unknown keys in the input, Schema will throw an error.

```ts
const person = z
  .object({
    name: Schema.string(),
  })
  .strict();

person.parse({
  name: "bob dylan",
  extraKey: 61,
});
// => throws SchemaError
```

### `.strip`

You can use the `.strip` method to reset an object schema to the default behavior (stripping unrecognized keys).

### `.catchall`

You can pass a "catchall" schema into an object Schema. All unknown keys will be validated against it.

```ts
const person = z
  .object({
    name: Schema.string(),
  })
  .catchall(Schema.number());

person.parse({
  name: "bob dylan",
  validExtraKey: 61, // works fine
});

person.parse({
  name: "bob dylan",
  validExtraKey: false, // fails
});
// => throws SchemaError
```

Using `.catchall()` obviates `.passthrough()` , `.strip()` , or `.strict()`. All keys are now considered "known".

<br/>

## Arrays

```ts
const stringArray = Schema.array(Schema.string());

// equivalent
const stringArray = Schema.string().array();
```

Be careful with the `.array()` method. It returns a new `SchemaArray` instance. This means the _order_ in which you call methods matters. For instance:

```ts
Schema.string().optional().array(); // (string | undefined)[]
Schema.string().array().optional(); // string[] | undefined
```

### `.element`

Use `.element` to access the schema for an element of the array.

```ts
stringArray.element; // => string schema
```

### `.nonempty`

If you want to ensure that an array contains at least one element, use `.nonempty()`.

```ts
const nonEmptyStrings = Schema.string().array().nonempty();
// the inferred type is now
// [string, ...string[]]

nonEmptyStrings.parse([]); // throws: "Array cannot be empty"
nonEmptyStrings.parse(["Ariana Grande"]); // passes
```

You can optionally specify a custom error message:

```ts
// optional custom error message
const nonEmptyStrings = Schema.string().array().nonempty({
  message: "Can't be empty!",
});
```

### `.min/.max/.length`

```ts
Schema.string().array().min(5); // must contain 5 or more items
Schema.string().array().max(5); // must contain 5 or fewer items
Schema.string().array().length(5); // must contain 5 items exactly
```

Unlike `.nonempty()` these methods do not change the inferred type.

<br/>

## Tuples

Unlike arrays, tuples have a fixed number of elements and each element can have a different type.

```ts
const athleteSchema = Schema.tuple([
  Schema.string(), // name
  Schema.number(), // jersey number
  Schema.object({
    pointsScored: Schema.number(),
  }), // statistics
]);

type Athlete = Schema.infer<typeof athleteSchema>;
// type Athlete = [string, number, { pointsScored: number }]
```

A variadic ("rest") argument can be added with the `.rest` method.

```ts
const variadicTuple = Schema.tuple([Schema.string()]).rest(Schema.number());
const result = variadicTuple.parse(["hello", 1, 2, 3]);
// => [string, ...number[]];
```

<br/>

## Unions

Schema includes a built-in `Schema.union` method for composing "OR" types.

```ts
const stringOrNumber = Schema.union([Schema.string(), Schema.number()]);

stringOrNumber.parse("foo"); // passes
stringOrNumber.parse(14); // passes
```

Schema will test the input against each of the "options" in order and return the first value that validates successfully.

For convenience, you can also use the [`.or` method](#or):

```ts
const stringOrNumber = Schema.string().or(Schema.number());
```

**Optional string validation:**

To validate an optional form input, you can union the desired string validation with an empty string [literal](#literals).

This example validates an input that is optional but needs to contain a [valid URL](#strings):

```ts
const optionalUrl = Schema.union([Schema.string().url().nullish(), Schema.literal("")]);

console.log(optionalUrl.safeParse(undefined).success); // true
console.log(optionalUrl.safeParse(null).success); // true
console.log(optionalUrl.safeParse("").success); // true
console.log(optionalUrl.safeParse("https://Schema.dev").success); // true
console.log(optionalUrl.safeParse("not a valid url").success); // false
```

<br/>

## Discriminated unions

A discriminated union is a union of object schemas that all share a particular key.

```ts
type MyUnion =
  | { status: "success"; data: string }
  | { status: "failed"; error: Error };
```

Such unions can be represented with the `Schema.discriminatedUnion` method. This enables faster evaluation, because Schema can check the _discriminator key_ (`status` in the example above) to determine which schema should be used to parse the input. This makes parsing more efficient and lets Schema report friendlier errors.

With the basic union method, the input is tested against each of the provided "options", and in the case of invalidity, issues for all the "options" are shown in the schema error. On the other hand, the discriminated union allows for selecting just one of the "options", testing against it, and showing only the issues related to this "option".

```ts
const myUnion = Schema.discriminatedUnion("status", [
  Schema.object({ status: Schema.literal("success"), data: Schema.string() }),
  Schema.object({ status: Schema.literal("failed"), error: Schema.instanceof(Error) }),
]);

myUnion.parse({ status: "success", data: "yippie ki yay" });
```

You can extract a reference to the array of schemas with the `.options` property.

```ts
myUnion.options; // [SchemaObject<...>, SchemaObject<...>]
```

To merge two or more discriminated unions, use `.options` with destructuring.

```ts
const A = Schema.discriminatedUnion("status", [
  /* options */
]);
const B = Schema.discriminatedUnion("status", [
  /* options */
]);

const AB = Schema.discriminatedUnion("status", [...A.options, ...B.options]);
```

<br/>

## Records

Record schemas are used to validate types such as `Record<string, number>`. This is particularly useful for storing or caching items by ID.

<!-- If you want to validate the _values_ of an object against some schema but don't care about the keys, use `Schema.record(valueType)`:

```ts
const NumberCache = Schema.record(Schema.number());

type NumberCache = Schema.infer<typeof NumberCache>;
// => { [k: string]: number }
``` -->

```ts
const User = Schema.object({ name: Schema.string() });

const UserStore = Schema.record(Schema.string(), User);
type UserStore = Schema.infer<typeof UserStore>;
// => Record<string, { name: string }>
```

The schema and inferred type can be used like so:

```ts
const userStore: UserStore = {};

userStore["77d2586b-9e8e-4ecf-8b21-ea7e0530eadd"] = {
  name: "Carlotta",
}; // passes

userStore["77d2586b-9e8e-4ecf-8b21-ea7e0530eadd"] = {
  whatever: "Ice cream sundae",
}; // TypeError
```

**A note on numerical keys**

While `Schema.record(keyType, valueType)` is able to accept numerical key types and TypeScript's built-in Record type is `Record<KeyType, ValueType>`, it's hard to represent the TypeScript type `Record<number, any>` in Schema.

As it turns out, TypeScript's behavior surrounding `[k: number]` is a little unintuitive:

```ts
const testMap: { [k: number]: string } = {
  1: "one",
};

for (const key in testMap) {
  console.log(`${key}: ${typeof key}`);
}
// prints: `1: string`
```

As you can see, JavaScript automatically casts all object keys to strings under the hood. Since Schema is trying to bridge the gap between static and runtime types, it doesn't make sense to provide a way of creating a record schema with numerical keys, since there's no such thing as a numerical key in runtime JavaScript.

<br/>

## Maps

```ts
const stringNumberMap = Schema.map(Schema.string(), Schema.number());

type StringNumberMap = Schema.infer<typeof stringNumberMap>;
// type StringNumberMap = Map<string, number>
```

<br/>

## Sets

```ts
const numberSet = Schema.set(Schema.number());
type NumberSet = Schema.infer<typeof numberSet>;
// type NumberSet = Set<number>
```

Set schemas can be further constrained with the following utility methods.

```ts
Schema.set(Schema.string()).nonempty(); // must contain at least one item
Schema.set(Schema.string()).min(5); // must contain 5 or more items
Schema.set(Schema.string()).max(5); // must contain 5 or fewer items
Schema.set(Schema.string()).size(5); // must contain 5 items exactly
```

<br/>

## Intersections

Intersections are useful for creating "logical AND" types. This is useful for intersecting two object types.

```ts
const Person = Schema.object({
  name: Schema.string(),
});

const Employee = Schema.object({
  role: Schema.string(),
});

const EmployedPerson = Schema.intersection(Person, Employee);

// equivalent to:
const EmployedPerson = Person.and(Employee);
```

Though in many cases, it is recommended to use `A.merge(B)` to merge two objects. The `.merge` method returns a new `SchemaObject` instance, whereas `A.and(B)` returns a less useful `SchemaIntersection` instance that lacks common object methods like `pick` and `omit`.

```ts
const a = Schema.union([Schema.number(), Schema.string()]);
const b = Schema.union([Schema.number(), Schema.boolean()]);
const c = Schema.intersection(a, b);

type c = Schema.infer<typeof c>; // => number
```

<!-- Intersections in Schema are not smart. Whatever data you pass into `.parse()` gets passed into the two intersected schemas. Because Schema object schemas don't allow any unknown keys by default, there are some unintuitive behavior surrounding intersections of object schemas. -->

<!--

``` ts
const A = Schema.object({
  a: Schema.string(),
});

const B = Schema.object({
  b: Schema.string(),
});

const AB = Schema.intersection(A, B);

type Teacher = Schema.infer<typeof Teacher>;
// { id:string; name:string };
```  -->

<br/>

## Recursive types

You can define a recursive schema in Schema, but because of a limitation of TypeScript, their type can't be statically inferred. Instead you'll need to define the type definition manually, and provide it to Schema as a "type hint".

```ts
const baseCategorySchema = Schema.object({
  name: Schema.string(),
});

type Category = Schema.infer<typeof baseCategorySchema> & {
  subcategories: Category[];
};

const categorySchema: Schema.SchemaType<Category> = baseCategorySchema.extend({
  subcategories: Schema.lazy(() => categorySchema.array()),
});

categorySchema.parse({
  name: "People",
  subcategories: [
    {
      name: "Politicians",
      subcategories: [
        {
          name: "Presidents",
          subcategories: [],
        },
      ],
    },
  ],
}); // passes
```

Thanks to [crasite](https://github.com/crasite) for this example.

### SchemaType with SchemaEffects

When using `Schema.SchemaType` with `Schema.SchemaEffects` (
[`.refine`](https://github.com/colinhacks/schema#refine),
[`.transform`](https://github.com/colinhacks/schema#transform),
[`preprocess`](https://github.com/colinhacks/schema#preprocess),
etc...
), you will need to define the input and output types of the Schema. `Schema.SchemaType<Output, Schema.SchemaTypeDef, Input>`

```ts
const isValidId = (id: string): id is `${string}/${string}` =>
  id.split("/").length === 2;

const baseSchema = Schema.object({
  id: Schema.string().refine(isValidId),
});

type Input = Schema.input<typeof baseSchema> & {
  children: Input[];
};

type Output = Schema.output<typeof baseSchema> & {
  children: Output[];
};

const schema: Schema.SchemaType<Output, Schema.SchemaTypeDef, Input> = baseSchema.extend({
  children: Schema.lazy(() => Schema.array()),
});
```

Thanks to [marcus13371337](https://github.com/marcus13371337) and [JoelBeeldi](https://github.com/JoelBeeldi) for this example.

### JSON type

If you want to validate any JSON value, you can use the snippet below.

```ts
const literalSchema = Schema.union([Schema.string(), Schema.number(), Schema.boolean(), Schema.null()]);
type Literal = Schema.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];
const jsonSchema: Schema.SchemaType<Json> = Schema.lazy(() =>
  Schema.union([literalSchema, Schema.array(jsonSchema), Schema.record(jsonSchema)]),
);

jsonSchema.parse(data);
```

Thanks to [ggoodman](https://github.com/ggoodman) for suggesting this.

### Cyclical objects

Despite supporting recursive schemas, passing cyclical data into Schema will cause an infinite loop in some cases.

> To detect cyclical objects before they cause problems, consider [this approach](https://gist.github.com/colinhacks/d35825e505e635df27cc950776c5500b).

<br/>

## Promises

```ts
const numberPromise = Schema.promise(Schema.number());
```

"Parsing" works a little differently with promise schemas. Validation happens in two parts:

1. Schema synchronously checks that the input is an instance of Promise (i.e. an object with `.then` and `.catch` methods.).
2. Schema uses `.then` to attach an additional validation step onto the existing Promise. You'll have to use `.catch` on the returned Promise to handle validation failures.

```ts
numberPromise.parse("tuna");
// SchemaError: Non-Promise type: string

numberPromise.parse(Promise.resolve("tuna"));
// => Promise<number>

const test = async () => {
  await numberPromise.parse(Promise.resolve("tuna"));
  // SchemaError: Non-number type: string

  await numberPromise.parse(Promise.resolve(3.14));
  // => 3.14
};
```

<!-- #### Non-native promise implementations

When "parsing" a promise, Schema checks that the passed value is an object with `.then` and `.catch` methods — that's it. So you should be able to pass non-native Promises (Bluebird, etc) into `Schema.promise(...).parse` with no trouble. One gotcha: the return type of the parse function will be a _native_ `Promise` , so if you have downstream logic that uses non-standard Promise methods, this won't work. -->

<br/>

## Instanceof

You can use `Schema.instanceof` to check that the input is an instance of a class. This is useful to validate inputs against classes that are exported from third-party libraries.

```ts
class Test {
  name: string;
}

const TestSchema = Schema.instanceof(Test);

const blob: any = "whatever";
TestSchema.parse(new Test()); // passes
TestSchema.parse(blob); // throws
```

<br/>

## Functions

Schema also lets you define "function schemas". This makes it easy to validate the inputs and outputs of a function without intermixing your validation code and "business logic".

You can create a function schema with `Schema.function(args, returnType)` .

```ts
const myFunction = Schema.function();

type myFunction = Schema.infer<typeof myFunction>;
// => ()=>unknown
```

Define inputs and outputs.

```ts
const myFunction = z
  .function()
  .args(Schema.string(), Schema.number()) // accepts an arbitrary number of arguments
  .returns(Schema.boolean());

type myFunction = Schema.infer<typeof myFunction>;
// => (arg0: string, arg1: number)=>boolean
```

<!--

``` ts
const args = Schema.tuple([Schema.string()]);

const returnType = Schema.number();

const myFunction = Schema.function(args, returnType);
type myFunction = Schema.infer<typeof myFunction>;
// => (arg0: string)=>number
``` -->

Function schemas have an `.implement()` method which accepts a function and returns a new function that automatically validates its inputs and outputs.

```ts
const trimmedLength = z
  .function()
  .args(Schema.string()) // accepts an arbitrary number of arguments
  .returns(Schema.number())
  .implement((x) => {
    // TypeScript knows x is a string!
    return x.trim().length;
  });

trimmedLength("sandwich"); // => 8
trimmedLength(" asdf "); // => 4
```

If you only care about validating inputs, just don't call the `.returns()` method. The output type will be inferred from the implementation.

> You can use the special `Schema.void()` option if your function doesn't return anything. This will let Schema properly infer the type of void-returning functions. (Void-returning functions actually return undefined.)

```ts
const myFunction = z
  .function()
  .args(Schema.string())
  .implement((arg) => {
    return [arg.length];
  });

myFunction; // (arg: string)=>number[]
```

Extract the input and output schemas from a function Schema.

```ts
myFunction.parameters();
// => SchemaTuple<[SchemaString, SchemaNumber]>

myFunction.returnType();
// => SchemaBoolean
```

<!-- `Schema.function()` accepts two arguments:

* `args: SchemaTuple` The first argument is a tuple (created with `Schema.tuple([...])` and defines the schema of the arguments to your function. If the function doesn't accept arguments, you can pass an empty tuple (`Schema.tuple([])`).
* `returnType: any Schema schema` The second argument is the function's return type. This can be any Schema Schema. -->

<br/>

## Preprocess

> Schema now supports primitive coercion without the need for `.preprocess()`. See the [coercion docs](#coercion-for-primitives) for more information.

Typically Schema operates under a "parse then transform" paradigm. Schema validates the input first, then passes it through a chain of transformation functions. (For more information about transforms, read the [.transform docs](#transform).)

But sometimes you want to apply some transform to the input _before_ parsing happens. A common use case: type coercion. Schema enables this with the `Schema.preprocess()`.

```ts
const castToString = Schema.preprocess((val) => String(val), Schema.string());
```

This returns a `SchemaEffects` instance. `SchemaEffects` is a wrapper class that contains all logic pertaining to preprocessing, refinements, and transforms.

<br/>

## Custom schemas

You can create a Schema schema for any TypeScript type by using `Schema.custom()`. This is useful for creating schemas for types that are not supported by Schema out of the box, such as template string literals.

```ts
const px = Schema.custom<`${number}px`>((val) => {
  return typeof val === "string" ? /^\d+px$/.test(val) : false;
});

type px = Schema.infer<typeof px>; // `${number}px`

px.parse("42px"); // "42px"
px.parse("42vw"); // throws;
```

If you don't provide a validation function, Schema will allow any value. This can be dangerous!

```ts
Schema.custom<{ arg: string }>(); // performs no validation
```

You can customize the error message and other options by passing a second argument. This parameter works the same way as the params parameter of [`.refine`](#refine).

```ts
Schema.custom<...>((val) => ..., "custom error message");
```

<br/>

## Schema methods

All Schema schemas contain certain methods.

### `.parse`

`.parse(data: unknown): T`

Given any Schema schema, you can call its `.parse` method to check `data` is valid. If it is, a value is returned with full type information! Otherwise, an error is thrown.

> IMPORTANT: The value returned by `.parse` is a _deep clone_ of the variable you passed in.

```ts
const stringSchema = Schema.string();

stringSchema.parse("fish"); // => returns "fish"
stringSchema.parse(12); // throws error
```

### `.parseAsync`

`.parseAsync(data:unknown): Promise<T>`

If you use asynchronous [refinements](#refine) or [transforms](#transform) (more on those later), you'll need to use `.parseAsync`.

```ts
const stringSchema = Schema.string().refine(async (val) => val.length <= 8);

await stringSchema.parseAsync("hello"); // => returns "hello"
await stringSchema.parseAsync("hello world"); // => throws error
```

### `.safeParse`

`.safeParse(data:unknown): { success: true; data: T; } | { success: false; error: SchemaError; }`

If you don't want Schema to throw errors when validation fails, use `.safeParse`. This method returns an object containing either the successfully parsed data or a SchemaError instance containing detailed information about the validation problems.

```ts
stringSchema.safeParse(12);
// => { success: false; error: SchemaError }

stringSchema.safeParse("billie");
// => { success: true; data: 'billie' }
```

The result is a _discriminated union_, so you can handle errors very conveniently:

```ts
const result = stringSchema.safeParse("billie");
if (!result.success) {
  // handle error then return
  result.error;
} else {
  // do something
  result.data;
}
```

### `.safeParseAsync`

> Alias: `.spa`

An asynchronous version of `safeParse`.

```ts
await stringSchema.safeParseAsync("billie");
```

For convenience, this has been aliased to `.spa`:

```ts
await stringSchema.spa("billie");
```

### `.refine`

`.refine(validator: (data:T)=>any, params?: RefineParams)`

Schema lets you provide custom validation logic via _refinements_. (For advanced features like creating multiple issues and customizing error codes, see [`.superRefine`](#superrefine).)

Schema was designed to mirror TypeScript as closely as possible. But there are many so-called "refinement types" you may wish to check for that can't be represented in TypeScript's type system. For instance: checking that a number is an integer or that a string is a valid email address.

For example, you can define a custom validation check on _any_ Schema schema with `.refine` :

```ts
const myString = Schema.string().refine((val) => val.length <= 255, {
  message: "String can't be more than 255 characters",
});
```

> ⚠️ Refinement functions should not throw. Instead they should return a falsy value to signal failure.

#### Arguments

As you can see, `.refine` takes two arguments.

1. The first is the validation function. This function takes one input (of type `T` — the inferred type of the schema) and returns `any`. Any truthy value will pass validation. (Prior to schema@1.6.2 the validation function had to return a boolean.)
2. The second argument accepts some options. You can use this to customize certain error-handling behavior:

```ts
type RefineParams = {
  // override error message
  message?: string;

  // appended to error path
  path?: (string | number)[];

  // params object you can use to customize message
  // in error map
  params?: object;
};
```

For advanced cases, the second argument can also be a function that returns `RefineParams`.

```ts
const longString = Schema.string().refine(
  (val) => val.length > 10,
  (val) => ({ message: `${val} is not more than 10 characters` }),
);
```

#### Customize error path

```ts
const passwordForm = z
  .object({
    password: Schema.string(),
    confirm: Schema.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords don't match",
    path: ["confirm"], // path of error
  });

passwordForm.parse({ password: "asdf", confirm: "qwer" });
```

Because you provided a `path` parameter, the resulting error will be:

```ts
SchemaError {
  issues: [{
    "code": "custom",
    "path": [ "confirm" ],
    "message": "Passwords don't match"
  }]
}
```

#### Asynchronous refinements

Refinements can also be async:

```ts
const userId = Schema.string().refine(async (id) => {
  // verify that ID exists in database
  return true;
});
```

> ⚠️ If you use async refinements, you must use the `.parseAsync` method to parse data! Otherwise Schema will throw an error.

#### Relationship to transforms

Transforms and refinements can be interleaved:

```ts
Schema.string()
  .transform((val) => val.length)
  .refine((val) => val > 25);
```

<!-- Note that the `path` is set to `["confirm"]` , so you can easily display this error underneath the "Confirm password" textbox.

```ts
const allForms = Schema.object({ passwordForm }).parse({
  passwordForm: {
    password: "asdf",
    confirm: "qwer",
  },
});
```

would result in

```

SchemaError {
  issues: [{
    "code": "custom",
    "path": [ "passwordForm", "confirm" ],
    "message": "Passwords don't match"
  }]
}
``` -->

### `.superRefine`

The `.refine` method is actually syntactic sugar atop a more versatile (and verbose) method called `superRefine`. Here's an example:

```ts
const Strings = Schema.array(Schema.string()).superRefine((val, ctx) => {
  if (val.length > 3) {
    ctx.addIssue({
      code: Schema.SchemaIssueCode.too_big,
      maximum: 3,
      type: "array",
      inclusive: true,
      message: "Too many items 😡",
    });
  }

  if (val.length !== new Set(val).size) {
    ctx.addIssue({
      code: Schema.SchemaIssueCode.custom,
      message: `No duplicates allowed.`,
    });
  }
});
```

You can add as many issues as you like. If `ctx.addIssue` is _not_ called during the execution of the function, validation passes.

Normally refinements always create issues with a `SchemaIssueCode.custom` error code, but with `superRefine` it's possible to throw issues of any `SchemaIssueCode`. Each issue code is described in detail in the Error Handling guide: [ERROR_HANDLING.md](ERROR_HANDLING.md).

#### Abort early

By default, parsing will continue even after a refinement check fails. For instance, if you chain together multiple refinements, they will all be executed. However, it may be desirable to _abort early_ to prevent later refinements from being executed. To achieve this, pass the `fatal` flag to `ctx.addIssue` and return `Schema.NEVER`.

```ts
const schema = Schema.number().superRefine((val, ctx) => {
  if (val < 10) {
    ctx.addIssue({
      code: Schema.SchemaIssueCode.custom,
      message: "should be >= 10",
      fatal: true,
    });

    return Schema.NEVER;
  }

  if (val !== 12) {
    ctx.addIssue({
      code: Schema.SchemaIssueCode.custom,
      message: "should be twelve",
    });
  }
});
```

#### Type refinements

If you provide a [type predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) to `.refine()` or `.superRefine()`, the resulting type will be narrowed down to your predicate's type. This is useful if you are mixing multiple chained refinements and transformations:

```ts
const schema = z
  .object({
    first: Schema.string(),
    second: Schema.number(),
  })
  .nullable()
  .superRefine((arg, ctx): arg is { first: string; second: number } => {
    if (!arg) {
      ctx.addIssue({
        code: Schema.SchemaIssueCode.custom, // customize your issue
        message: "object should exist",
      });
    }

    return Schema.NEVER; // The return value is not used, but we need to return something to satisfy the typing
  })
  // here, TS knows that arg is not null
  .refine((arg) => arg.first === "bob", "`first` is not `bob`!");
```

> ⚠️ You **must** use `ctx.addIssue()` instead of returning a boolean value to indicate whether the validation passes. If `ctx.addIssue` is _not_ called during the execution of the function, validation passes.

### `.transform`

To transform data after parsing, use the `transform` method.

```ts
const stringToNumber = Schema.string().transform((val) => val.length);

stringToNumber.parse("string"); // => 6
```

#### Chaining order

Note that `stringToNumber` above is an instance of the `SchemaEffects` subclass. It is NOT an instance of `SchemaString`. If you want to use the built-in methods of `SchemaString` (e.g. `.email()`) you must apply those methods _before_ any transforms.

```ts
const emailToDomain = z
  .string()
  .email()
  .transform((val) => val.split("@")[1]);

emailToDomain.parse("colinhacks@example.com"); // => example.com
```

#### Validating during transform

The `.transform` method can simultaneously validate and transform the value. This is often simpler and less duplicative than chaining `transform` and `refine`.

As with `.superRefine`, the transform function receives a `ctx` object with an `addIssue` method that can be used to register validation issues.

```ts
const numberInString = Schema.string().transform((val, ctx) => {
  const parsed = parseInt(val);
  if (isNaN(parsed)) {
    ctx.addIssue({
      code: Schema.SchemaIssueCode.custom,
      message: "Not a number",
    });

    // This is a special symbol you can use to
    // return early from the transform function.
    // It has type `never` so it does not affect the
    // inferred return type.
    return Schema.NEVER;
  }
  return parsed;
});
```

#### Relationship to refinements

Transforms and refinements can be interleaved. These will be executed in the order they are declared.

```ts
const nameToGreeting = z
  .string()
  .transform((val) => val.toUpperCase())
  .refine((val) => val.length > 15)
  .transform((val) => `Hello ${val}`)
  .refine((val) => val.indexOf("!") === -1);
```

#### Async transforms

Transforms can also be async.

```ts
const IdToUser = z
  .string()
  .uuid()
  .transform(async (id) => {
    return await getUserById(id);
  });
```

> ⚠️ If your schema contains asynchronous transforms, you must use .parseAsync() or .safeParseAsync() to parse data. Otherwise Schema will throw an error.

### `.default`

You can use transforms to implement the concept of "default values" in Schema.

```ts
const stringWithDefault = Schema.string().default("tuna");

stringWithDefault.parse(undefined); // => "tuna"
```

Optionally, you can pass a function into `.default` that will be re-executed whenever a default value needs to be generated:

```ts
const numberWithRandomDefault = Schema.number().default(Math.random);

numberWithRandomDefault.parse(undefined); // => 0.4413456736055323
numberWithRandomDefault.parse(undefined); // => 0.1871840107401901
numberWithRandomDefault.parse(undefined); // => 0.7223408162401552
```

Conceptually, this is how Schema processes default values:

1. If the input is `undefined`, the default value is substituted
2. Then the data is parsed using the base Schema. Your default value will be parsed by the schema (including any potential transforms).

### `.describe`

Use `.describe()` to add a `description` property to the resulting Schema.

```ts
const documentedString = z
  .string()
  .describe("A useful bit of text, if you know what to do with it.");
documentedString.description; // A useful bit of text…
```

This can be useful for documenting a field, for example in a JSON Schema using a library like [`schema-to-json-schema`](https://github.com/StefanTerdell/schema-to-json-schema)).

### `.catch`

Use `.catch()` to provide a "catch value" to be returned in the event of a parsing error.

```ts
const numberWithCatch = Schema.number().catch(42);

numberWithCatch.parse(5); // => 5
numberWithCatch.parse("tuna"); // => 42
```

Optionally, you can pass a function into `.catch` that will be re-executed whenever a default value needs to be generated. A `ctx` object containing the caught error will be passed into this function.

```ts
const numberWithRandomCatch = Schema.number().catch((ctx) => {
  ctx.error; // the caught SchemaError
  return Math.random();
});

numberWithRandomCatch.parse("sup"); // => 0.4413456736055323
numberWithRandomCatch.parse("sup"); // => 0.1871840107401901
numberWithRandomCatch.parse("sup"); // => 0.7223408162401552
```

Conceptually, this is how Schema processes "catch values":

1. The data is parsed using the base schema
2. If the parsing fails, the "catch value" is returned

### `.optional`

A convenience method that returns an optional version of a Schema.

```ts
const optionalString = Schema.string().optional(); // string | undefined

// equivalent to
Schema.optional(Schema.string());
```

### `.nullable`

A convenience method that returns a nullable version of a Schema.

```ts
const nullableString = Schema.string().nullable(); // string | null

// equivalent to
Schema.nullable(Schema.string());
```

### `.nullish`

A convenience method that returns a "nullish" version of a Schema. Nullish schemas will accept both `undefined` and `null`. Read more about the concept of "nullish" [in the TypeScript 3.7 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#nullish-coalescing).

```ts
const nullishString = Schema.string().nullish(); // string | null | undefined

// equivalent to
Schema.string().nullable().optional();
```

### `.array`

A convenience method that returns an array schema for the given type:

```ts
const stringArray = Schema.string().array(); // string[]

// equivalent to
Schema.array(Schema.string());
```

### `.promise`

A convenience method for promise types:

```ts
const stringPromise = Schema.string().promise(); // Promise<string>

// equivalent to
Schema.promise(Schema.string());
```

### `.or`

A convenience method for [union types](#unions).

```ts
const stringOrNumber = Schema.string().or(Schema.number()); // string | number

// equivalent to
Schema.union([Schema.string(), Schema.number()]);
```

### `.and`

A convenience method for creating intersection types.

```ts
const nameAndAge = z
  .object({ name: Schema.string() })
  .and(Schema.object({ age: Schema.number() })); // { name: string } & { age: number }

// equivalent to
Schema.intersection(Schema.object({ name: Schema.string() }), Schema.object({ age: Schema.number() }));
```

### `.brand`

`.brand<T>() => SchemaBranded<this, B>`

TypeScript's type system is structural, which means that any two types that are structurally equivalent are considered the same.

```ts
type Cat = { name: string };
type Dog = { name: string };

const petCat = (cat: Cat) => {};
const fido: Dog = { name: "fido" };
petCat(fido); // works fine
```

In some cases, its can be desirable to simulate _nominal typing_ inside TypeScript. For instance, you may wish to write a function that only accepts an input that has been validated by Schema. This can be achieved with _branded types_ (AKA _opaque types_).

```ts
const Cat = Schema.object({ name: Schema.string() }).brand<"Cat">();
type Cat = Schema.infer<typeof Cat>;

const petCat = (cat: Cat) => {};

// this works
const simba = Cat.parse({ name: "simba" });
petCat(simba);

// this doesn't
petCat({ name: "fido" });
```

Under the hood, this works by attaching a "brand" to the inferred type using an intersection type. This way, plain/unbranded data structures are no longer assignable to the inferred type of the Schema.

```ts
const Cat = Schema.object({ name: Schema.string() }).brand<"Cat">();
type Cat = Schema.infer<typeof Cat>;
// {name: string} & {[symbol]: "Cat"}
```

Note that branded types do not affect the runtime result of `.parse`. It is a static-only construct.

### `.readonly`

`.readonly() => SchemaReadonly<this>`

This method returns a `SchemaReadonly` schema instance that parses the input using the base schema, then calls `Object.freeze()` on the result. The inferred type is also marked as `readonly`.

```ts
const schema = Schema.object({ name: Schema.string() }).readonly();
type schema = Schema.infer<typeof schema>;
// Readonly<{name: string}>

const result = Schema.parse({ name: "fido" });
result.name = "simba"; // error
```

The inferred type uses TypeScript's built-in readonly types when relevant.

```ts
Schema.array(Schema.string()).readonly();
// readonly string[]

Schema.tuple([Schema.string(), Schema.number()]).readonly();
// readonly [string, number]

Schema.map(Schema.string(), Schema.date()).readonly();
// ReadonlyMap<string, Date>

Schema.set(Schema.string()).readonly();
// ReadonlySet<string>
```

### `.pipe`

Schemas can be chained into validation "pipelines". It's useful for easily validating the result after a `.transform()`:

```ts
Schema.string()
  .transform((val) => val.length)
  .pipe(Schema.number().min(5));
```

The `.pipe()` method returns a `SchemaPipeline` instance.

<br/>

## Guides and concepts

### Type inference

You can extract the TypeScript type of any schema with `Schema.infer<typeof mySchema>` .

```ts
const A = Schema.string();
type A = Schema.infer<typeof A>; // string

const u: A = 12; // TypeError
const u: A = "asdf"; // compiles
```

**What about transforms?**

In reality each Schema schema internally tracks **two** types: an input and an output. For most schemas (e.g. `Schema.string()`) these two are the same. But once you add transforms into the mix, these two values can diverge. For instance `Schema.string().transform(val => val.length)` has an input of `string` and an output of `number`.

You can separately extract the input and output types like so:

```ts
const stringToNumber = Schema.string().transform((val) => val.length);

// ⚠️ Important: Schema.infer returns the OUTPUT type!
type input = Schema.input<typeof stringToNumber>; // string
type output = Schema.output<typeof stringToNumber>; // number

// equivalent to Schema.output!
type inferred = Schema.infer<typeof stringToNumber>; // number
```

### Writing generic functions

With TypeScript generics, you can write reusable functions that accept Schema schemas as parameters. This enables you to create custom validation logic, schema transformations, and more, while maintaining type safety and inference.

When attempting to write a function that accepts a Schema schema as an input, it's tempting to try something like this:

```ts
function inferSchema<T>(schema: Schema.SchemaType<T>) {
  return schema;
}
```

This approach is incorrect, and limits TypeScript's ability to properly infer the argument. No matter what you pass in, the type of `schema` will be an instance of `SchemaType`.

```ts
inferSchema(Schema.string());
// => SchemaType<string>
```

This approach loses type information, namely _which subclass_ the input actually is (in this case, `SchemaString`). That means you can't call any string-specific methods like `.min()` on the result of `inferSchema`.

A better approach is to infer _the schema as a whole_ instead of merely its inferred type. You can do this with a utility type called `Schema.SchemaTypeAny`.

```ts
function inferSchema<T extends Schema.SchemaTypeAny>(schema: T) {
  return schema;
}

inferSchema(Schema.string());
// => SchemaString
```

> `SchemaTypeAny` is just a shorthand for `SchemaType<any, any, any>`, a type that is broad enough to match any Schema Schema.

The Result is now fully and properly typed, and the type system can infer the specific subclass of the Schema.

#### Inferring the inferred type

If you follow the best practice of using `Schema.SchemaTypeAny` as the generic parameter for your schema, you may encounter issues with the parsed data being typed as `any` instead of the inferred type of the Schema.

```ts
function parseData<T extends Schema.SchemaTypeAny>(data: unknown, schema: T) {
  return Schema.parse(data);
}

parseData("sup", Schema.string());
// => any
```

Due to how TypeScript inference works, it is treating `schema` like a `SchemaTypeAny` instead of the inferred type. You can fix this with a type cast using `Schema.infer`.

```ts
function parseData<T extends Schema.SchemaTypeAny>(data: unknown, schema: T) {
  return Schema.parse(data) as Schema  .infer<T>;
  //                        ^^^^^^^^^^^^^^ <- add this
}

parseData("sup", Schema.string());
// => string
```

#### Constraining allowable inputs

The `SchemaType` class has three generic parameters.

```ts
class SchemaType<
  Output = any,
  Def extends SchemaTypeDef = SchemaTypeDef,
  Input = Output
> { ... }
```

By constraining these in your generic input, you can limit what schemas are allowable as inputs to your function:

```ts
function makeSchemaOptional<T extends Schema.SchemaType<string>>(schema: T) {
  return Schema.optional();
}

makeSchemaOptional(Schema.string());
// works fine

makeSchemaOptional(Schema.number());
// Error: 'SchemaNumber' is not assignable to parameter of type 'SchemaType<string, SchemaTypeDef, string>'
```

### Error handling

Schema provides a subclass of Error called `SchemaError`. SchemaErrors contain an `issues` array containing detailed information about the validation problems.

```ts
const result = z
  .object({
    name: Schema.string(),
  })
  .safeParse({ name: 12 });

if (!result.success) {
  result.error.issues;
  /* [
      {
        "code": "invalid_type",
        "expected": "string",
        "received": "number",
        "path": [ "name" ],
        "message": "Expected string, received number"
      }
  ] */
}
```

> For detailed information about the possible error codes and how to customize error messages, check out the dedicated error handling guide: [ERROR_HANDLING.md](ERROR_HANDLING.md)

Schema's error reporting emphasizes _completeness_ and _correctness_. If you are looking to present a useful error message to the end user, you should either override Schema's error messages using an error map (described in detail in the Error Handling guide) or use a third-party library like [`schema-validation-error`](https://github.com/causaly/schema-validation-error)

### Error formatting

You can use the `.format()` method to convert this error into a nested object.

```ts
const result = z
  .object({
    name: Schema.string(),
  })
  .safeParse({ name: 12 });

if (!result.success) {
  const formatted = result.error.format();
  /* {
    name: { _errors: [ 'Expected string, received number' ] }
  } */

  formatted.name?._errors;
  // => ["Expected string, received number"]
}
```

<br/>

## Comparison

There are a handful of other widely-used validation libraries, but all of them have certain design limitations that make for a non-ideal developer experience.

<!-- The table below summarizes the feature differences. Below the table there are more involved discussions of certain alternatives, where necessary. -->

<!-- | Feature                                                                                                                | [Schema](https://github.com/colinhacks) | [Joi](https://github.com/hapijs/joi) | [Yup](https://github.com/jquense/yup) | [io-ts](https://github.com/gcanti/io-ts) | [Runtypes](https://github.com/pelotom/runtypes) | [ow](https://github.com/sindresorhus/ow) | [class-validator](https://github.com/typestack/class-validator) |
| ---------------------------------------------------------------------------------------------------------------------- | :-----------------------------: | :----------------------------------: | :-----------------------------------: | :--------------------------------------: | :---------------------------------------------: | :--------------------------------------: | :-------------------------------------------------------------: |
| <abbr title='Any ability to extract a TypeScript type from a validator instance counts.'>Type inference</abbr>         |               🟢                |                  🔴                  |                  🟢                   |                    🟢                    |                       🟢                        |                    🟢                    |                               🟢                                |
| <abbr title="Yup's inferred types are incorrect in certain cases, see discussion below.">Correct type inference</abbr> |               🟢                |                  🔴                  |                  🔴                   |                    🟢                    |                       🟢                        |                    🟢                    |                               🟢                                |

<abbr title="number, string, boolean, null, undefined">Primitive Types</abbr>
<abbr title="Includes any checks beyond 'Is this a string?', e.g. min/max length, isEmail, isURL, case checking, etc.">String Validation</abbr>
<abbr title="Includes any checks beyond 'Is this a number?', e.g. min/max, isPositive, integer vs float, etc.">Number Validation</abbr>
Dates

Primitive Literals
Object Literals
Tuple Literals
Objects
Arrays
Non-empty arrays
Unions
Optionals
Nullable
Enums
Enum Autocomplete
Intersections
Object Merging
Tuples
Recursive Types
Function Schemas

<abbr title="For instance, Yup allows custom error messages with the syntax yup.number().min(5, 'Number must be more than 5!')">Validation Messages</abbr>
Immutable instances
Type Guards
Validity Checking
Casting
Default Values
Rich Errors
Branded -->

<!-- - Missing object methods: (pick, omit, partial, deepPartial, merge, extend)

* Missing nonempty arrays with proper typing (`[T, ...T[]]`)
* Missing lazy/recursive types
* Missing promise schemas
* Missing function schemas
* Missing union & intersection schemas
* Missing support for parsing cyclical data (maybe)
* Missing error customization -->

### Joi

[https://github.com/hapijs/joi](https://github.com/hapijs/joi)

Doesn't support static type inference 😕

### Yup

[https://github.com/jquense/yup](https://github.com/jquense/yup)

Yup is a full-featured library that was implemented first in vanilla JS, and later rewritten in TypeScript.

- Supports casting and transforms
- All object fields are optional by default
<!-- - Missing nonempty arrays with proper typing (`[T, ...T[]]`) -->
- Missing promise schemas
- Missing function schemas
- Missing union & intersection schemas

<!-- ¹Yup has a strange interpretation of the word `required`. Instead of meaning "not undefined", Yup uses it to mean "not empty". So `yup.string().required()` will not accept an empty string, and `yup.array(yup.string()).required()` will not accept an empty array. Instead, Yup us Schema arrays there is a dedicated `.nonempty()` method to indicate this, or you can implement it with a custom refinement. -->

### io-ts

[https://github.com/gcanti/io-ts](https://github.com/gcanti/io-ts)

io-ts is an excellent library by gcanti. The API of io-ts heavily inspired the design of Schema.

In our experience, io-ts prioritizes functional programming purity over developer experience in many cases. This is a valid and admirable design goal, but it makes io-ts particularly hard to integrate into an existing codebase with a more procedural or object-oriented bias. For instance, consider how to define an object with optional properties in io-ts:

```ts
import * as t from "io-ts";

const A = t.type({
  foo: t.string,
});

const B = t.partial({
  bar: t.number,
});

const C = t.intersection([A, B]);

type C = t.TypeOf<typeof C>;
// returns { foo: string; bar?: number | undefined }
```

You must define the required and optional props in separate object validators, pass the optionals through `t.partial` (which marks all properties as optional), then combine them with `t.intersection` .

Consider the equivalent in Schema:

```ts
const C = Schema.object({
  foo: Schema.string(),
  bar: Schema.number().optional(),
});

type C = Schema.infer<typeof C>;
// returns { foo: string; bar?: number | undefined }
```

This more declarative API makes schema definitions vastly more concise.

`io-ts` also requires the use of gcanti's functional programming library `fp-ts` to parse results and handle errors. This is another fantastic resource for developers looking to keep their codebase strictly functional. But depending on `fp-ts` necessarily comes with a lot of intellectual overhead; a developer has to be familiar with functional programming concepts and the `fp-ts` nomenclature to use the library.

- Supports codecs with serialization & deserialization transforms
- Supports branded types
- Supports advanced functional programming, higher-kinded types, `fp-ts` compatibility
- Missing object methods: (pick, omit, partial, deepPartial, merge, extend)
- Missing nonempty arrays with proper typing (`[T, ...T[]]`)
- Missing promise schemas
- Missing function schemas

### Runtypes

[https://github.com/runtypes/runtypes](https://github.com/runtypes/runtypes)

Runtypes is focused on ergonomics, with good type inference support.

- Supports "pattern matching": computed properties that distribute over unions
- Supports branded types
- Supports template literals
- Supports conformance to predefined static types
- Missing object methods: (deepPartial, merge)
- Missing promise schemas
- Missing error customization

### Ow

[https://github.com/sindresorhus/ow](https://github.com/sindresorhus/ow)

Ow is focused on function input validation. It's a library that makes it easy to express complicated assert statements, but it doesn't let you parse untyped data. They support a much wider variety of types; Schema has a nearly one-to-one mapping with TypeScript's type system, whereas ow lets you validate several highly-specific types out of the box (e.g. `int32Array` , see full list in their README).

If you want to validate function inputs, use function schemas in Schema! It's a much simpler approach that lets you reuse a function type declaration without repeating yourself (namely, copy-pasting a bunch of ow assertions at the beginning of every function). Also Schema lets you validate your return types as well, so you can be sure there won't be any unexpected data passed downstream.

<br/>

## Changelog

View the changelog at [CHANGELOG.md](CHANGELOG.md)
