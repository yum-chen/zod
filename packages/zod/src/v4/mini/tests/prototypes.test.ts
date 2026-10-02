import { expect, test } from "vitest";
import * as Schema from "schema/mini";

declare module "schema/v4/core" {
  interface $SchemaType {
    /** @deprecated */
    _core(): string;
  }
}

test("prototype extension", () => {
  Schema.core.$SchemaType.prototype._core = function () {
    return "_core";
  };

  // should pass
  const result = Schema.string()._core();
  expect(result).toBe("_core");
  // expectTypeOf<typeof result>().toEqualTypeOf<string>();

  // clean up
  Schema.SchemaMiniType.prototype._core = undefined;
});

declare module "schema/v4/mini" {
  interface SchemaMiniType {
    /** @deprecated */
    _mini(): string;
  }
}

test("prototype extension", () => {
  Schema.SchemaMiniType.prototype._mini = function () {
    return "_mini";
  };

  // should pass
  const result = Schema.string()._mini();
  expect(result).toBe("_mini");

  // clean up
  Schema.SchemaMiniType.prototype._mini = undefined;
});
