// @ts-ignore TS6133
import { test } from "vitest";

import * as Schema from "schema/v3";
import { util } from "../helpers/util.js";

test("first party switch", () => {
  const myType = Schema.string() as Schema  .SchemaFirstPartySchemaTypes;
  const def = myType._def;

  switch (def.typeName) {
    case Schema.SchemaFirstPartyTypeKind.SchemaString:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaNumber:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaNaN:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaBigInt:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaBoolean:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaDate:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaUndefined:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaNull:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaAny:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaUnknown:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaNever:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaVoid:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaArray:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaObject:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaUnion:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaDiscriminatedUnion:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaIntersection:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaTuple:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaRecord:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaMap:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaSet:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaFunction:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaLazy:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaLiteral:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaEnum:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaEffects:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaNativeEnum:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaOptional:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaNullable:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaDefault:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaCatch:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaPromise:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaBranded:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaPipeline:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaSymbol:
      break;
    case Schema.SchemaFirstPartyTypeKind.SchemaReadonly:
      break;
    default:
      util.assertNever(def);
  }
});
