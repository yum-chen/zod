// @ts-ignore TS6133
import { test } from "vitest";

import type { SchemaFirstPartySchemaTypes, SchemaFirstPartyTypeKind } from "schema/v3";
import { util } from "../helpers/util.js";

test("Identify missing [SchemaFirstPartySchemaTypes]", () => {
  type SchemaFirstPartySchemaForType<T extends SchemaFirstPartyTypeKind> = SchemaFirstPartySchemaTypes extends infer Schema
    ? Schema extends { _def: { typeName: T } }
      ? Schema
      : never
    : never;
  type SchemaMappedTypes = {
    [key in SchemaFirstPartyTypeKind]: SchemaFirstPartySchemaForType<key>;
  };
  type SchemaFirstPartySchemaTypesMissingFromUnion = keyof {
    [key in keyof SchemaMappedTypes as SchemaMappedTypes[key] extends { _def: never } ? key : never]: unknown;
  };

  util.assertEqual<SchemaFirstPartySchemaTypesMissingFromUnion, never>(true);
});
