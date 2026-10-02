import { beforeEach, expect, test } from "vitest";
import * as Schema from "schema/v4";

// English is the default locale and must register on first SchemaType construction even when bundlers tree-shake `sideEffects: false` modules (#5953, #5725). Reset between tests so each one observes the lazy init.
beforeEach(() => {
  Schema.config({ localeError: undefined });
});

test("first SchemaType construction registers the English default locale", () => {
  expect(Schema.config().localeError).toBeUndefined();
  const schema = Schema.enum(["km", "mi"]);
  expect(Schema.config().localeError).toBeDefined();
  const result = Schema.safeParse("feet");
  expect(result.success).toBe(false);
  expect(result.error!.issues[0].message).toBe('Invalid option: expected one of "km"|"mi"');
});

test("explicit locale set before schema construction is preserved", () => {
  Schema.config(Schema.locales.fr());
  const schema = Schema.enum(["km", "mi"]);
  const result = Schema.safeParse("feet");
  expect(result.success).toBe(false);
  expect(result.error!.issues[0].message).toBe('Option invalide : une valeur parmi "km"|"mi" attendue');
});

test("explicit locale set after schema construction overrides default", () => {
  const schema = Schema.enum(["km", "mi"]);
  Schema.config(Schema.locales.fr());
  const result = Schema.safeParse("feet");
  expect(result.success).toBe(false);
  expect(result.error!.issues[0].message).toBe('Option invalide : une valeur parmi "km"|"mi" attendue');
});
