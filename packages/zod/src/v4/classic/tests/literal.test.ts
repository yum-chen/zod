import { expect, expectTypeOf, test } from "vitest";

import * as Schema from "schema/v4";

const literalTuna = Schema.literal("tuna");
const literalTunaCustomMessage = Schema.literal("tuna", {
  message: "That's not a tuna",
});
const literalFortyTwo = Schema.literal(42);
const literalTrue = Schema.literal(true);

test("passing validations", () => {
  literalTuna.parse("tuna");
  literalFortyTwo.parse(42);
  literalTrue.parse(true);
});

test("failing validations", () => {
  expect(() => literalTuna.parse("shark")).toThrow();
  expect(() => literalFortyTwo.parse(43)).toThrow();
  expect(() => literalTrue.parse(false)).toThrow();
});

test("invalid_literal should have `input` field with data", () => {
  const data = "shark";
  const result = literalTuna.safeParse(data);

  const issue = result.error!.issues[0];
  expect(issue.code).toBe("invalid_value");
  expect(issue).toMatchInlineSnapshot(`
    {
      "code": "invalid_value",
      "message": "Invalid input: expected "tuna"",
      "path": [],
      "values": [
        "tuna",
      ],
    }
  `);
});

test("invalid_literal should return default message", () => {
  const data = "shark";
  const result = literalTuna.safeParse(data);

  const issue = result.error!.issues[0];
  expect(issue.message).toEqual(`Invalid input: expected \"tuna\"`);
});

test("invalid_literal should return custom message", () => {
  const data = "shark";
  const result = literalTunaCustomMessage.safeParse(data);

  const issue = result.error!.issues[0];
  expect(issue.message).toEqual(`That's not a tuna`);
});

test("literal default error message", () => {
  const result = Schema.literal("Tuna").safeParse("Trout");
  expect(result.success).toEqual(false);
  expect(result.error!.issues.length).toEqual(1);
  expect(result.error).toMatchInlineSnapshot(`
    [SchemaError: [
      {
        "code": "invalid_value",
        "values": [
          "Tuna"
        ],
        "path": [],
        "message": "Invalid input: expected \\"Tuna\\""
      }
    ]]
  `);
});

test("literal bigint default error message", () => {
  const result = Schema.literal(BigInt(12)).safeParse(BigInt(13));
  expect(result.success).toBe(false);

  expect(result.error!.issues.length).toEqual(1);
  expect(result.error!.issues[0].message).toEqual(`Invalid input: expected 12n`);
});

test(".value getter", () => {
  expect(Schema.literal("tuna").value).toEqual("tuna");
  expect(() => Schema.literal([1, 2, 3]).value).toThrow();
});

test("readonly", () => {
  const a = ["asdf"] as const;
  Schema.literal(a);
});

test("literal pattern", () => {
  expect(Schema.literal(1.1)._schema.pattern).toMatchInlineSnapshot(`/\\^\\(1\\\\\\.1\\)\\$/`);

  expect(Schema.templateLiteral([Schema.literal(1.1)]).safeParse("1.1")).toMatchInlineSnapshot(`
    {
      "data": "1.1",
      "success": true,
    }
  `);
  expect(Schema.templateLiteral([Schema.literal(1.1)]).safeParse("1n1")).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "invalid_format",
        "format": "template_literal",
        "pattern": "^(1\\\\.1)$",
        "path": [],
        "message": "Invalid input"
      }
    ]],
      "success": false,
    }
  `);
});

test("empty literal matches nothing", () => {
  const empty = Schema.literal([]);
  expectTypeOf<Schema.infer<typeof empty>>().toEqualTypeOf<never>();
  expect(empty.safeParse("").success).toEqual(false);
  expect(empty.safeParse(undefined).success).toEqual(false);
  expect(Schema.templateLiteral(["", empty]).safeParse("").success).toEqual(false);
  expect(Schema.toJSONSchema(empty)).toMatchObject({ not: {} });

  expect(Schema.literal("").safeParse("").success).toEqual(true);
});
