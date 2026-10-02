import { expect, test } from "vitest";

import * as Schema from "schema/v4";

test("passing validations", () => {
  const example1 = Schema.custom<number>((x) => typeof x === "number");
  example1.parse(1234);
  expect(() => example1.parse({})).toThrow();
});

test("string params", () => {
  const example1 = Schema.custom<number>((x) => typeof x !== "number", "customerr");
  const result = example1.safeParse(1234);
  expect(result.success).toEqual(false);
  expect(JSON.stringify(result.error).includes("customerr")).toEqual(true);
});

test("instanceof", () => {
  const fn = (value: string) => Uint8Array.from(Buffer.from(value, "base64"));

  // Argument of type 'SchemaCustom<Uint8Array<ArrayBuffer>, unknown>' is not assignable to parameter of type '$SchemaType<any, Uint8Array<ArrayBuffer>>'.
  Schema.string().transform(fn).pipe(Schema.instanceof(Uint8Array));
});

test("non-continuable by default", () => {
  const A = z
    .custom<string>((val) => typeof val === "string")
    .transform((_) => {
      throw new Error("Invalid input");
    });
  expect(A.safeParse(123).error!).toMatchInlineSnapshot(`
    [SchemaError: [
      {
        "code": "custom",
        "path": [],
        "message": "Invalid input"
      }
    ]]
  `);
});
