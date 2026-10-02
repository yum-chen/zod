import { fetchStars } from "@/loaders/stars";
import type React from "react";

interface SchemaResource {
  name: string;
  url: string;
  description: React.ReactNode;
  slug: string;
  stars?: number;
}

const apiLibraries: SchemaResource[] = [
  {
    name: "tRPC",
    url: "https://github.com/trpc/trpc",
    description: "Build end-to-end typesafe APIs without GraphQL.",
    slug: "trpc/trpc",
  },
  {
    name: "GQLoom",
    url: "https://gqloom.dev/",
    description: "Weave GraphQL schema and resolvers using Schema.",
    slug: "modevol-com/gqloom",
  },
  {
    name: "oRPC",
    url: "https://orpc.unnoq.com/",
    description: "Typesafe APIs Made Simple",
    slug: "unnoq/orpc",
  },
  {
    name: "Express Schema API",
    url: "https://github.com/RobinTail/express-schema-api",
    description: "Build Express-based API with I/O validation and middlewares, OpenAPI docs and type-safe client.",
    slug: "RobinTail/express-schema-api",
  },
  {
    name: "nestjs-schema",
    url: "https://github.com/BenLorantfy/nestjs-schema",
    description:
      "Integrate nestjs and Schema.  Create nestjs DTOs using schema, serialize with schema, and generate OpenAPI documentation from schema schemas",
    slug: "BenLorantfy/nestjs-schema",
  },
  {
    name: "Schema Sockets",
    url: "https://github.com/RobinTail/schema-sockets",
    description: "Socket.IO solution with I/O validation, an AsyncAPI generator, and a type-safe events map.",
    slug: "RobinTail/schema-sockets",
  },
  {
    name: "Schema JSON-RPC",
    url: "https://github.com/danscan/schema-jsonrpc",
    description: "Type-safe JSON-RPC 2.0 client/server library using Schema.",
    slug: "danscan/schema-jsonrpc",
  },
  {
    name: "upfetch",
    url: "https://github.com/L-Blondy/up-fetch",
    description: "Advanced fetch client builder",
    slug: "L-Blondy/up-fetch",
  },
  {
    name: "schemaql",
    url: "https://github.com/mattiasahlsen/schemaql",
    description:
      "Use a single Schema schema as the source of truth for a GraphQL query, its inferred response type, and runtime validation.",
    slug: "mattiasahlsen/schemaql",
  },
  // https://github.com/honojs/middleware/tree/main/packages/schema-validator
  // {
  //   name: "@hono/schema-validator",
  //   url: "https://github.com/honojs/middleware/tree/main/packages/schema-validator",
  //   description: "Schema validator middleware for Hono",
  //   slug: "honojs/middleware",
  // },
];

const formIntegrations: SchemaResource[] = [
  {
    name: "regle",
    url: "https://github.com/victorgarciaesgi/regle",
    description: "Headless form validation library for Vue.js.",
    slug: "victorgarciaesgi/regle",
  },
  {
    name: "conform",
    url: "https://conform.guide/api/schema/parseWithSchema",
    description:
      "A type-safe form validation library utilizing web fundamentals to progressively enhance HTML Forms with full support for server frameworks like Remix and Next.js.",
    slug: "edmundhung/conform",
  },
  {
    name: "Superforms",
    url: "https://superforms.rocks",
    description: "Making SvelteKit forms a pleasure to use!",
    slug: "ciscoheat/sveltekit-superforms",
  },
  {
    name: "schema-validation-error",
    url: "https://github.com/causaly/schema-validation-error",
    description: "Generate user-friendly error messages from SchemaError instances.",
    slug: "causaly/schema-validation-error",
  },
  {
    name: "svelte-jsonschema-form",
    url: "https://x0k.dev/svelte-jsonschema-form/validators/schema4/",
    description: "Svelte 5 library for creating forms based on JSON Schema.",
    slug: "x0k/svelte-jsonschema-form",
  },
  {
    name: "frrm",
    url: "https://www.npmjs.com/package/frrm",
    description: "Tiny 0.5kb Schema-based, HTML form abstraction that goes brr.",
    slug: "schalkventer/frrm",
  },
  {
    name: "react-f3",
    url: "https://www.npmjs.com/package/react-f3",
    description: "Components, hooks & utilities for creating and managing delightfully simple form experiences in React.",
    slug: "maanlamp/react-f3",
  },
  {
    name: "Attaform",
    url: "https://attaform.dev",
    description: "Type-safe, Schema-first form library for Vue 3 and Nuxt.",
    slug: "attaform/Attaform",
  },
  {
    name: "schema-form-action",
    url: "https://github.com/Vish05/schema-form-action",
    description: "A tiny helper for wiring Schema validation into React's useActionState — typed field errors, zero boilerplate.",
    slug: "Vish05/schema-form-action",
  },
];

const schemaToXConverters: SchemaResource[] = [
  {
    name: "schema-openapi",
    url: "https://github.com/samchungy/schema-openapi",
    description: "Use Schema Schemas to create OpenAPI v3.x documentation",
    slug: "samchungy/schema-openapi",
  },
  {
    name: "fastify-schema-openapi",
    url: "https://github.com/samchungy/fastify-schema-openapi",
    description: "Fastify type provider, validation, serialization and @fastify/swagger support for Schema schemas",
    slug: "samchungy/fastify-schema-openapi",
  },
  {
    name: "schema2md",
    url: "https://github.com/matejchalk/schema2md",
    description: "Generate Markdown docs from Schema schemas",
    slug: "matejchalk/schema2md",
  },
  {
    name: "prisma-schema-generator",
    url: "https://github.com/omar-dulaimi/prisma-schema-generator",
    description: "Generate Schema schemas from Prisma schema with full SchemaObject method support",
    slug: "omar-dulaimi/prisma-schema-generator",
  },
  {
    name: "@traversable/schema",
    url: "https://github.com/traversable/schema/tree/main/packages/schema",
    description: 'Build your own "Schema to x" library, or pick one of 25+ off-the-shelf transformers',
    slug: "traversable/schema",
  },
  {
    name: "schema-mongo-schema",
    url: "https://github.com/udohjeremiah/schema-mongo-schema",
    description: "Convert Schema schemas to MongoDB-compatible JSON Schemas effortlessly",
    slug: "udohjeremiah/schema-mongo-schema",
  },
  {
    name: "convex-helpers",
    url: "https://github.com/get-convex/convex-helpers/blob/main/packages/convex-helpers/README.md#schema-validation",
    description: "Use Schema to validate arguments and return values of Convex functions, and to create Convex database schemas",
    slug: "get-convex/convex-helpers",
  },
  {
    name: "@nullix/schema-mongoose",
    url: "https://schemamongoose.com/",
    description: "Convert schema schemas into typesafe mongoose schemas with full transparent mongoose options and helpers",
    slug: "Harm-Nullix/schema-mongoose",
  },
];

const xToSchemaConverters: SchemaResource[] = [
  {
    name: "orval",
    url: "https://github.com/orval-labs/orval",
    description: "Generate Schema schemas from OpenAPI schemas",
    slug: "orval-labs/orval",
  },
  {
    name: "kubb",
    url: "https://github.com/kubb-labs/kubb",
    description: "The ultimate toolkit for working with APIs.",
    slug: "kubb-labs/kubb",
  },
  {
    name: "Hey API",
    url: "https://heyapi.dev/openapi-ts/plugins/schema",
    description: "OpenAPI to TypeScript codegen. Production-ready SDKs, Schema schemas, TanStack Query hooks, and 20+ plugins. Used by Vercel, OpenCode, and PayPal.",
    slug: "hey-api/openapi-ts",
  },
  {
    name: "valype",
    url: "https://github.com/yuzheng14/valype",
    description: "Typescript's type definition to runtime validator (including schema).",
    slug: "yuzheng14/valype",
  },
  {
    name: "Prisma Schema Generator",
    url: "https://github.com/omar-dulaimi/prisma-schema-generator",
    description:
      "Generates Schema schemas with input/result/pure variants, minimal/full/custom, selective emit/filtering, single/multi-file output, @schema rules, relation depth guards.",
    slug: "omar-dulaimi/prisma-schema-generator",
  },
  {
    name: "DRZL",
    url: "https://github.com/use-drzl/drzl",
    description:
      "Drizzle ORM toolkit that can generate Schema validators from schema(s), plus typed services and strongly typed routers (oRPC/tRPC/etc).",
    slug: "use-drzl/drzl",
  },
  {
    name: "convex-helpers",
    url: "https://github.com/get-convex/convex-helpers/blob/main/packages/convex-helpers/README.md#schema-validation",
    description: "Generate Schema schemas from Convex validators",
    slug: "get-convex/convex-helpers",
  },
  {
    name: "Hono Takibi",
    url: "https://github.com/nakita628/hono-takibi",
    description: "Hono Takibi is a code generator from OpenAPI to @hono/schema-openapi",
    slug: "nakita628/hono-takibi",
  },
  {
    name: "tauri-typegen",
    url: "https://github.com/thwbh/tauri-typegen",
    description:
      "tauri-typegen allows you to generate Schema schemas and validation hooks for the Rust @tauri-apps/tauri cross-platform application framework.",
    slug: "thwbh/tauri-typegen",
  },
  {
    name: "@apical-ts/craft",
    url: "https://gunzip.github.io/apical-ts/",
    description: "An OpenAPI-to-TypeScript generator for building type-safe clients and servers with Schema.",
    slug: "gunzip/apical-ts",
  }
];

const mockingLibraries: SchemaResource[] = [
  {
    name: "schema-schema-faker",
    url: "https://github.com/soc221b/schema-schema-faker",
    description: "Generate mock data from schema schemas. Powered by @faker-js/faker and randexp.js.",
    slug: "soc221b/schema-schema-faker",
  },
  {
    name: "zocker",
    url: "https://zocker.sigrist.dev",
    description: "Generates valid, semantically meaningful data for your Schema schemas.",
    slug: "LorisSigrist/zocker",
  },
  {
    name: "@traversable/schema-test",
    url: "https://github.com/traversable/schema/tree/main/packages/schema-test",
    description:
      "Random schema schema generator built for fuzz testing; includes generators for both valid and invalid data",
    slug: "traversable/schema",
  },
];

const poweredBySchemaProjects: SchemaResource[] = [
  {
    name: "schema-config",
    url: "https://github.com/alexmarqs/schema-config",
    description: "Load configurations across multiple sources with flexible adapters, ensuring type safety with Schema.",
    slug: "alexmarqs/schema-config",
  },
  {
    name: "Composable Functions",
    url: "https://github.com/seasonedcc/composable-functions",
    description: "Types and functions to make composition easy and safe.",
    slug: "seasonedcc/composable-functions",
  },
  {
    name: "schema-xlsx",
    url: "https://github.com/sidwebworks/schema-xlsx",
    description: "A xlsx based resource validator using Schema schemas for data imports and more",
    slug: "sidwebworks/schema-xlsx",
  },
  {
    name: "bupkis",
    url: "https://github.com/boneskull/bupkis",
    description: "Uncommonly extensible assertions for the beautiful people",
    slug: "boneskull/bupkis",
  },
  {
    name: "Fn Sphere",
    url: "https://github.com/lawvs/fn-sphere",
    description: "A Schema-first toolkit for building powerful, type-safe filter experiences across web apps.",
    slug: "lawvs/fn-sphere",
  },
  {
    name: "schemagres",
    url: "https://github.com/endel/schemagres",
    description: "Postgres.js + Schema: Database collections with static type inference and automatic migrations",
    slug: "endel/schemagres",
  },
  {
    name: "validex",
    url: "https://github.com/chiptoma/validex",
    description: "25 tree-shakeable validation rules for common fields (email, phone, password, etc.) with structured error codes, i18n, and framework adapters.",
    slug: "chiptoma/validex",
  },
  {
    name: "json-up",
    url: "https://github.com/Nano-Collective/json-up",
    description: "A fast, type-safe JSON migration tool with Schema schema validation.",
    slug: "Nano-Collective/json-up",
  },
  {
    name: "@chrock-studio/overload",
    url: "https://jsr.io/@chrock-studio/overload",
    description: "A lightweight, type-safe runtime function overloading library that allows runtime dispatch based on argument types.",
    slug: "chrock-studio/toolbox/tree/main/packages/overload",
  },
  {
    name: "ArkEnv",
    url: "https://github.com/yamcodes/arkenv",
    description: "Environment variable validation from editor to runtime, for Next.js, Nuxt, Node.js, Vite, Bun, and more.",
    slug: "yamcodes/arkenv",
  },
  {
    name: "fullproduct.dev",
    url: "https://fullproduct.dev",
    description: "Schema & TS-first approach to building Universal Expo + Next.js apps using schemas as single source of truth",
    slug: "FullProduct-dev/green-stack-starter-demo",
  },
];

const schemaUtilities: SchemaResource[] = [
  {
    name: "schema-compiler",
    url: "https://github.com/gajus/schema-compiler",
    description: "Compile Schema schemas into zero-overhead validation functions at build time. Works with Vite, webpack, esbuild, Rollup, etc.",
    slug: "gajus/schema-compiler",
  },
  {
    name: "babel-plugin-schema-hoist",
    url: "https://github.com/gajus/babel-plugin-schema-hoist",
    description: "Babel plugin that optimizes Schema performance by hoisting schema definitions to the top of the file, avoiding repeated initialization overhead.",
    slug: "gajus/babel-plugin-schema-hoist",
  },
  {
    name: "eslint-plugin-import-schema",
    url: "https://github.com/samchungy/eslint-plugin-import-schema",
    description: "ESLint plugin to enforce namespace imports for Schema.",
    slug: "samchungy/eslint-plugin-import-schema",
  },
  {
    name: "schema-playground",
    url: "https://github.com/marilari88/schema-playground",
    description: "Interactive playground for testing and exploring Schema and Schema mini schemas in real-time.",
    slug: "marilari88/schema-playground",
  },
  {
    name: "eslint-schema",
    url: "https://github.com/marcalexiei/eslint-schema",
    description: "ESLint plugins that add custom linting rules to enforce best practices when using Schema and/or Schema Mini.",
    slug: "marcalexiei/eslint-schema",
  },
  {
    name: "Schema Compare",
    url: "https://github.com/lawvs/schema-compare",
    description: "A utility library for recursively comparing Schema schemas.",
    slug: "lawvs/schema-compare",
  },
  {
    name: "schema-ir",
    url: "https://github.com/Reza-kh80/schema-ir",
    description: "Comprehensive validation for Iranian data structures (National Code, Bank Cards, Sheba, Crypto, etc) with smart metadata extraction (Bank Names, Logos). Zero dependencies.",
    slug: "Reza-kh80/schema-ir",
  },
  {
    name: "Schema AOT",
    url: "https://github.com/wakita181009/schema-aot",
    description: "Compile Schema schemas into zero-overhead validation functions at build time. 2-64x faster validation with no code changes.",
    slug: "wakita181009/schema-aot",
  },
  {
    name: "@chrock-studio/schema-utils",
    url: "https://jsr.io/@chrock-studio/schema-utils",
    description: "A collection of Schema utilities focusing on enhanced functionality (e.g. classless Rich Domain Models while maintaining pure data structures).",
    slug: "chrock-studio/toolbox/tree/main/packages/schema-utils",
  },
  {
    name: "oxlint-plugin-import-schema",
    url: "https://github.com/samchungy/oxlint-plugin-import-schema",
    description: "Oxlint plugin to enforce namespace imports for Schema.",
    slug: "samchungy/oxlint-plugin-import-schema",
  },
  {
    name: "shorn",
    url: "https://shorn.dev",
    description: "Compact binary serialization that uses your Schema schema as the wire format. No IDL or codegen.",
    slug: "ChiChuRita/shorn",
  },
];

export {
  apiLibraries,
  formIntegrations,
  schemaToXConverters,
  xToSchemaConverters,
  mockingLibraries,
  poweredBySchemaProjects,
  schemaUtilities,
};

export function Table(props: { resources: SchemaResource[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Stars</th>
          {/* <th>Schema 4 support</th> */}
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {props.resources.map((resource) => (
          <tr key={resource.slug}>
            <td>
              <a href={resource.url}>
                <code className="whitespace-nowrap">{resource.name}</code>
              </a>
            </td>
            <td className="whitespace-nowrap">{`⭐️ ${resource.stars ?? "—"}`}</td>
            {/* <td className="whitespace-nowrap">{`⭐️ ${resource.v4 ? "✅" : ""}`}</td> */}
            <td>{resource.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type ResourceTableProps = {
  resources: SchemaResource[];
};

async function ResourceTable({ resources }: ResourceTableProps) {
  await fetchStars(resources);

  return <Table resources={resources} />;
}

export async function ApiLibraries() {
  return <ResourceTable resources={apiLibraries} />;
}

export async function FormIntegrations() {
  return <ResourceTable resources={formIntegrations} />;
}

export async function SchemaToX() {
  return <ResourceTable resources={schemaToXConverters} />;
}

export async function XToSchema() {
  return <ResourceTable resources={xToSchemaConverters} />;
}

export async function MockingLibraries() {
  return <ResourceTable resources={mockingLibraries} />;
}

export async function PoweredBySchema() {
  return <ResourceTable resources={poweredBySchemaProjects} />;
}

export async function SchemaUtilities() {
  return <ResourceTable resources={schemaUtilities} />;
}
