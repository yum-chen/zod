import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";

test("Schema.stringbool", () => {
  const a = Schema.stringbool();
  type a = Schema.infer<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<boolean>();
  type a_in = Schema.input<typeof a>;
  expectTypeOf<a_in>().toEqualTypeOf<string>();

  expect(Schema.parse(a, "true")).toEqual(true);
  expect(Schema.parse(a, "yes")).toEqual(true);
  expect(Schema.parse(a, "1")).toEqual(true);
  expect(Schema.parse(a, "on")).toEqual(true);
  expect(Schema.parse(a, "y")).toEqual(true);
  expect(Schema.parse(a, "enabled")).toEqual(true);
  expect(Schema.parse(a, "TRUE")).toEqual(true);

  expect(Schema.parse(a, "false")).toEqual(false);
  expect(Schema.parse(a, "no")).toEqual(false);
  expect(Schema.parse(a, "0")).toEqual(false);
  expect(Schema.parse(a, "off")).toEqual(false);
  expect(Schema.parse(a, "n")).toEqual(false);
  expect(Schema.parse(a, "disabled")).toEqual(false);
  expect(Schema.parse(a, "FALSE")).toEqual(false);

  expect(Schema.safeParse(a, "other")).toMatchObject({ success: false });
  expect(Schema.safeParse(a, "")).toMatchObject({ success: false });
  expect(Schema.safeParse(a, undefined)).toMatchObject({ success: false });
  expect(Schema.safeParse(a, {})).toMatchObject({ success: false });
  expect(Schema.safeParse(a, true)).toMatchObject({ success: false });
  expect(Schema.safeParse(a, false)).toMatchObject({ success: false });
});

test("custom values", () => {
  const b = Schema.stringbool({
    truthy: ["y"],
    falsy: ["N"],
  });
  expect(Schema.parse(b, "y")).toEqual(true);
  expect(Schema.parse(b, "Y")).toEqual(true);
  expect(Schema.parse(b, "n")).toEqual(false);
  expect(Schema.parse(b, "N")).toEqual(false);
  expect(Schema.safeParse(b, "true")).toMatchObject({ success: false });
  expect(Schema.safeParse(b, "false")).toMatchObject({ success: false });
});

test("custom values - case sensitive", () => {
  const c = Schema.stringbool({
    truthy: ["y"],
    falsy: ["N"],
    case: "sensitive",
  });
  expect(Schema.parse(c, "y")).toEqual(true);
  expect(Schema.safeParse(c, "Y")).toMatchObject({ success: false });
  expect(Schema.parse(c, "N")).toEqual(false);
  expect(Schema.safeParse(c, "n")).toMatchObject({ success: false });
  expect(Schema.safeParse(c, "TRUE")).toMatchObject({ success: false });
});

// test custom error messages
test("Schema.stringbool with custom error messages", () => {
  const a = Schema.stringbool("wrong!");

  expect(() => a.parse("")).toThrowError("wrong!");
});

test("Schema.stringbool codec encoding", () => {
  const schema = Schema.stringbool();

  // Test encoding with default values
  expect(Schema.encode(schema, true)).toEqual("true");
  expect(Schema.encode(schema, false)).toEqual("false");
});

test("Schema.stringbool codec encoding with custom values", () => {
  const schema = Schema.stringbool({
    truthy: ["yes", "on", "1"],
    falsy: ["no", "off", "0"],
  });

  // Should return first element of custom arrays
  expect(Schema.encode(schema, true)).toEqual("yes");
  expect(Schema.encode(schema, false)).toEqual("no");
});

test("Schema.stringbool codec round trip", () => {
  const schema = Schema.stringbool({
    truthy: ["enabled", "active"],
    falsy: ["disabled", "inactive"],
  });

  // Test round trip: string -> boolean -> string
  const decoded = Schema.decode(schema, "enabled");
  expect(decoded).toEqual(true);

  const encoded = Schema.encode(schema, decoded);
  expect(encoded).toEqual("enabled"); // First element of truthy array

  // Test with falsy value
  const decodedFalse = Schema.decode(schema, "inactive");
  expect(decodedFalse).toEqual(false);

  const encodedFalse = Schema.encode(schema, decodedFalse);
  expect(encodedFalse).toEqual("disabled"); // First element of falsy array
});

test("Schema.stringbool exposes truthy/falsy/case via _schema.bag", () => {
  const a = Schema.stringbool();
  expect(a._schema.bag.truthy).toEqual(["true", "1", "yes", "on", "y", "enabled"]);
  expect(a._schema.bag.falsy).toEqual(["false", "0", "no", "off", "n", "disabled"]);
  expect(a._schema.bag.case).toEqual("insensitive");

  // values are normalized when case-insensitive
  const b = Schema.stringbool({ truthy: ["Y", "yes"], falsy: ["N"] });
  expect(b._schema.bag.truthy).toEqual(["y", "yes"]);
  expect(b._schema.bag.falsy).toEqual(["n"]);
  expect(b._schema.bag.case).toEqual("insensitive");

  const c = Schema.stringbool({ truthy: ["Y"], falsy: ["N"], case: "sensitive" });
  expect(c._schema.bag.truthy).toEqual(["Y"]);
  expect(c._schema.bag.falsy).toEqual(["N"]);
  expect(c._schema.bag.case).toEqual("sensitive");
});
