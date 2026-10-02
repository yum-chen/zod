import { expect, test } from "vitest";
import * as Schema from "schema/mini";

test("no locale by default", () => {
  const result = Schema.safeParse(Schema.string(), 12);
  expect(result.success).toEqual(false);
  expect(result.error!.issues.length).toEqual(1);
  expect(result.error!.issues[0].message).toEqual("Invalid input");
});

test("error inheritance", () => {
  const e1 = Schema.string().safeParse(123).error!;
  expect(e1).toBeInstanceOf(Schema.core.$SchemaError);
  expect(e1).toBeInstanceOf(Error);

  let e2: unknown;
  try {
    Schema.string().parse(123);
  } catch (err) {
    e2 = err;
  }
  expect(e2).toBeInstanceOf(Schema.core.$SchemaRealError);
  expect(e2).toBeInstanceOf(Error);
});

test("a thrown error carries a stack rooted at the parse call site", () => {
  function callSite() {
    Schema.parse(Schema.string(), 123);
  }

  let thrown: unknown;
  try {
    callSite();
  } catch (err) {
    thrown = err;
  }
  expect(thrown).toBeInstanceOf(Error);
  const stack = (thrown as Error).stack!;
  expect(stack.startsWith("$SchemaError: [")).toBe(true);
  expect(stack).toContain("callSite");
});
