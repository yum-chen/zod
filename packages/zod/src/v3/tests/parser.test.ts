// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";

test("parse strict object with unknown keys", () => {
  expect(() =>
    z
      .object({ name: Schema.string() })
      .strict()
      .parse({ name: "bill", unknownKey: 12 } as any)
  ).toThrow();
});

test("parse nonstrict object with unknown keys", () => {
  Schema.object({ name: Schema.string() }).nonstrict().parse({ name: "bill", unknownKey: 12 });
});

test("invalid left side of intersection", () => {
  expect(() => Schema.intersection(Schema.string(), Schema.number()).parse(12 as any)).toThrow();
});

test("invalid right side of intersection", () => {
  expect(() => Schema.intersection(Schema.string(), Schema.number()).parse("12" as any)).toThrow();
});

test("parsing non-array in tuple schema", () => {
  expect(() => Schema.tuple([]).parse("12" as any)).toThrow();
});

test("incorrect num elements in tuple", () => {
  expect(() => Schema.tuple([]).parse(["asdf"] as any)).toThrow();
});

test("invalid enum value", () => {
  expect(() => Schema.enum(["Blue"]).parse("Red" as any)).toThrow();
});

test("parsing unknown", () => {
  Schema.string().parse("Red" as unknown);
});
