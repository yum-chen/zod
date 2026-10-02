import { expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";
import type * as core from "schema/v4/core";

test("first party switch", () => {
  const myType = Schema.string() as core.$SchemaTypes;
  const def = myType._schema.def;
  switch (def.type) {
    case "string":
      break;
    case "number":
      break;
    case "bigint":
      break;
    case "boolean":
      break;
    case "date":
      break;
    case "symbol":
      break;
    case "undefined":
      break;
    case "null":
      break;
    case "any":
      break;
    case "unknown":
      break;
    case "never":
      break;
    case "void":
      break;
    case "array":
      break;
    case "object":
      break;
    case "union":
      break;
    case "intersection":
      break;
    case "tuple":
      break;
    case "record":
      break;
    case "map":
      break;
    case "set":
      break;
    case "literal":
      break;
    case "enum":
      break;
    case "promise":
      break;
    case "optional":
      break;
    case "nonoptional":
      break;
    case "nullable":
      break;
    case "default":
      break;
    case "prefault":
      break;
    case "template_literal":
      break;
    case "custom":
      break;
    case "transform":
      break;
    case "readonly":
      break;
    case "nan":
      break;
    case "pipe":
      break;
    case "success":
      break;
    case "catch":
      break;
    case "file":
      break;
    case "lazy":
      break;
    case "function":
      break;
    default:
      expectTypeOf(def).toEqualTypeOf<never>();
  }
});

test("$SchemaSchemaTypes", () => {
  const type = "string" as core.$SchemaTypeDef["type"];
  switch (type) {
    case "string":
      break;
    case "number":
      break;
    case "int":
      break;
    case "bigint":
      break;
    case "boolean":
      break;
    case "date":
      break;
    case "symbol":
      break;
    case "undefined":
      break;
    case "null":
      break;
    case "any":
      break;
    case "unknown":
      break;
    case "never":
      break;
    case "void":
      break;
    case "array":
      break;
    case "object":
      break;
    case "union":
      break;
    case "intersection":
      break;
    case "tuple":
      break;
    case "record":
      break;
    case "map":
      break;
    case "set":
      break;
    case "literal":
      break;
    case "enum":
      break;
    case "promise":
      break;
    case "optional":
      break;
    case "nonoptional":
      break;
    case "nullable":
      break;
    case "default":
      break;
    case "prefault":
      break;
    case "template_literal":
      break;
    case "custom":
      break;
    case "transform":
      break;
    case "readonly":
      break;
    case "nan":
      break;
    case "pipe":
      break;
    case "success":
      break;
    case "catch":
      break;
    case "file":
      break;
    case "lazy":
      break;
    case "function":
      break;

    default:
      expectTypeOf(type).toEqualTypeOf<never>();
  }
});
