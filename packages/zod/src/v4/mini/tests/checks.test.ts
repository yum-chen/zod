import { expect, test } from "vitest";
import * as Schema from "../index.js";

// lt;
test("Schema.lt", () => {
  const a = Schema.number().check(Schema.lt(10));
  expect(Schema.safeParse(a, 9).success).toEqual(true);
  expect(Schema.safeParse(a, 9).data).toEqual(9);
  expect(Schema.safeParse(a, 10).success).toEqual(false);
});

// lte;
test("Schema.lte", () => {
  const a = Schema.number().check(Schema.lte(10));
  expect(Schema.safeParse(a, 10).success).toEqual(true);
  expect(Schema.safeParse(a, 10).data).toEqual(10);
  expect(Schema.safeParse(a, 11).success).toEqual(false);
});

// min;
test("Schema.max", () => {
  const a = Schema.number().check(Schema.maximum(10));
  expect(Schema.safeParse(a, 10).success).toEqual(true);
  expect(Schema.safeParse(a, 10).data).toEqual(10);
  expect(Schema.safeParse(a, 11).success).toEqual(false);
});

// gt;
test("Schema.gt", () => {
  const a = Schema.number().check(Schema.gt(10));
  expect(Schema.safeParse(a, 11).success).toEqual(true);
  expect(Schema.safeParse(a, 11).data).toEqual(11);
  expect(Schema.safeParse(a, 10).success).toEqual(false);
});

// gte;
test("Schema.gte", () => {
  const a = Schema.number().check(Schema.gte(10));
  expect(Schema.safeParse(a, 10).success).toEqual(true);
  expect(Schema.safeParse(a, 10).data).toEqual(10);
  expect(Schema.safeParse(a, 9).success).toEqual(false);
});

test("Schema.gte/Schema.lte origin on a date schema with a numeric bound", () => {
  const bound = new Date(Date.UTC(2022, 10, 5)).getTime();
  const tooSmall = Schema.safeParse(Schema.date().check(Schema.gte(bound)), new Date(Date.UTC(2022, 10, 4)));
  const tooBig = Schema.safeParse(Schema.date().check(Schema.lte(bound)), new Date(Date.UTC(2022, 10, 6)));
  expect(tooSmall.error!.issues[0]).toMatchObject({ code: "too_small", origin: "date" });
  expect(tooBig.error!.issues[0]).toMatchObject({ code: "too_big", origin: "date" });
});

// min;
test("Schema.min", () => {
  const a = Schema.number().check(Schema.minimum(10));
  expect(Schema.safeParse(a, 10).success).toEqual(true);
  expect(Schema.safeParse(a, 10).data).toEqual(10);
  expect(Schema.safeParse(a, 9).success).toEqual(false);
});

// maxSize;
test("Schema.maxLength", () => {
  const a = Schema.array(Schema.string()).check(Schema.maxLength(3));
  expect(Schema.safeParse(a, ["a", "b", "c"]).success).toEqual(true);
  expect(Schema.safeParse(a, ["a", "b", "c", "d"]).success).toEqual(false);
});

// minSize;
test("Schema.minLength", () => {
  const a = Schema.array(Schema.string()).check(Schema.minLength(3));
  expect(Schema.safeParse(a, ["a", "b"]).success).toEqual(false);
  expect(Schema.safeParse(a, ["a", "b", "c"]).success).toEqual(true);
});

// size;
test("Schema.length", () => {
  const a = Schema.array(Schema.string()).check(Schema.length(3));
  expect(Schema.safeParse(a, ["a", "b"]).success).toEqual(false);
  expect(Schema.safeParse(a, ["a", "b", "c"]).success).toEqual(true);
  expect(Schema.safeParse(a, ["a", "b", "c", "d"]).success).toEqual(false);
});

// regex;
test("Schema.regex", () => {
  const a = Schema.string().check(Schema.regex(/^aaa$/));
  expect(Schema.safeParse(a, "aaa")).toMatchObject({ success: true, data: "aaa" });
  expect(Schema.safeParse(a, "aa")).toMatchObject({ success: false });
});

// includes;
test("Schema.includes", () => {
  const a = Schema.string().check(Schema.includes("asdf"));
  Schema.parse(a, "qqqasdfqqq");
  Schema.parse(a, "asdf");
  Schema.parse(a, "qqqasdf");
  Schema.parse(a, "asdfqqq");
  expect(Schema.safeParse(a, "qqq")).toMatchObject({ success: false });
});

// startsWith;
test("Schema.startsWith", () => {
  const a = Schema.string().check(Schema.startsWith("asdf"));
  Schema.parse(a, "asdf");
  Schema.parse(a, "asdfqqq");
  expect(Schema.safeParse(a, "qqq")).toMatchObject({ success: false });
});

// endsWith;
test("Schema.endsWith", () => {
  const a = Schema.string().check(Schema.endsWith("asdf"));
  Schema.parse(a, "asdf");
  Schema.parse(a, "qqqasdf");
  expect(Schema.safeParse(a, "asdfqqq")).toMatchObject({ success: false });
});

// lowercase;
test("Schema.lowercase", () => {
  const a = Schema.string().check(Schema.lowercase());
  Schema.parse(a, "asdf");
  expect(Schema.safeParse(a, "ASDF")).toMatchObject({ success: false });
});

// uppercase;
test("Schema.uppercase", () => {
  const a = Schema.string().check(Schema.uppercase());
  Schema.parse(a, "ASDF");
  expect(Schema.safeParse(a, "asdf")).toMatchObject({ success: false });
});

// filename;
// fileType;
// overwrite;
test("Schema.overwrite", () => {
  const a = Schema.string().check(Schema.overwrite((val) => val.toUpperCase()));
  expect(Schema.safeParse(a, "asdf")).toMatchObject({ data: "ASDF" });
});

// normalize;
// trim;
// toLowerCase;
// toUpperCase;
// property

test("Schema.properties", () => {
  const a = Schema.instanceof(URL).check(...Schema.properties({ protocol: Schema.literal("https:"), hostname: Schema.string() }));
  expect(Schema.safeParse(a, new URL("https://example.com")).success).toEqual(true);
  expect(Schema.safeParse(a, new URL("http://example.com")).error!.issues.map((i) => i.path)).toEqual([["protocol"]]);
});

test("abort early", () => {
  const schema = Schema.string().check(
    Schema.refine((val) => val.length > 1),
    Schema.refine((val) => val.length > 2, { abort: true }),
    Schema.refine((val) => val.length > 3)
  );
  const data = "";
  const result = Schema.safeParse(schema, data);
  expect(result.error!.issues.length).toEqual(2);
});
