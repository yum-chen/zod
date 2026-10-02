import { expect, test } from "vitest";
import * as Schema from "schema/v4";

declare module "schema/v4" {
  interface SchemaType {
    /** @deprecated */
    _classic(): string;
  }
}

test("prototype extension", () => {
  Schema.SchemaType.prototype._classic = function () {
    return "_classic";
  };

  // should pass
  const result = Schema.string()._classic();
  expect(result).toBe("_classic");
  // expectTypeOf<typeof result>().toEqualTypeOf<string>();

  // clean up
  Schema.SchemaType.prototype._classic = undefined;
});
