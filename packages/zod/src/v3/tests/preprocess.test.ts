// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";
import { util } from "../helpers/util.js";

test("preprocess", () => {
  const schema = Schema.preprocess((data) => [data], Schema.string().array());

  const value = Schema.parse("asdf");
  expect(value).toEqual(["asdf"]);
  util.assertEqual<(typeof schema)["_input"], unknown>(true);
});

test("async preprocess", async () => {
  const schema = Schema.preprocess(async (data) => [data], Schema.string().array());

  const value = await Schema.parseAsync("asdf");
  expect(value).toEqual(["asdf"]);
});

test("preprocess ctx.addIssue with parse", () => {
  expect(() => {
    Schema.preprocess((data, ctx) => {
      ctx.addIssue({
        code: "custom",
        message: `${data} is not one of our allowed strings`,
      });
      return data;
    }, Schema.string()).parse("asdf");
  }).toThrow(
    JSON.stringify(
      [
        {
          code: "custom",
          message: "asdf is not one of our allowed strings",
          path: [],
        },
      ],
      null,
      2
    )
  );
});

test("preprocess ctx.addIssue non-fatal by default", () => {
  try {
    Schema.preprocess((data, ctx) => {
      ctx.addIssue({
        code: "custom",
        message: `custom error`,
      });
      return data;
    }, Schema.string()).parse(1234);
  } catch (err) {
    Schema.SchemaError.assert(err);
    expect(err.issues.length).toEqual(2);
  }
});

test("preprocess ctx.addIssue fatal true", () => {
  try {
    Schema.preprocess((data, ctx) => {
      ctx.addIssue({
        code: "custom",
        message: `custom error`,
        fatal: true,
      });
      return data;
    }, Schema.string()).parse(1234);
  } catch (err) {
    Schema.SchemaError.assert(err);
    expect(err.issues.length).toEqual(1);
  }
});

test("async preprocess ctx.addIssue with parse", async () => {
  const schema = Schema.preprocess(async (data, ctx) => {
    ctx.addIssue({
      code: "custom",
      message: `custom error`,
    });
    return data;
  }, Schema.string());

  expect(await Schema.safeParseAsync("asdf")).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "code": "custom",
        "message": "custom error",
        "path": []
      }
    ]],
      "success": false,
    }
  `);
});

test("preprocess ctx.addIssue with parseAsync", async () => {
  const result = await z
    .preprocess(async (data, ctx) => {
      ctx.addIssue({
        code: "custom",
        message: `${data} is not one of our allowed strings`,
      });
      return data;
    }, Schema.string())
    .safeParseAsync("asdf");

  expect(JSON.parse(JSON.stringify(result))).toEqual({
    success: false,
    error: {
      issues: [
        {
          code: "custom",
          message: "asdf is not one of our allowed strings",
          path: [],
        },
      ],
      name: "SchemaError",
    },
  });
});

test("Schema.NEVER in preprocess", () => {
  const foo = Schema.preprocess((val, ctx) => {
    if (!val) {
      ctx.addIssue({ code: Schema.SchemaIssueCode.custom, message: "bad" });
      return Schema.NEVER;
    }
    return val;
  }, Schema.number());

  type foo = Schema.infer<typeof foo>;
  util.assertEqual<foo, number>(true);
  const arg = foo.safeParse(undefined);
  expect(arg.error!.issues).toHaveLength(2);
  expect(arg.error!.issues[0].message).toEqual("bad");
});
test("preprocess as the second property of object", () => {
  const schema = Schema.object({
    nonEmptyStr: Schema.string().min(1),
    positiveNum: Schema.preprocess((v) => Number(v), Schema.number().positive()),
  });
  const result = Schema.safeParse({
    nonEmptyStr: "",
    positiveNum: "",
  });
  expect(result.success).toEqual(false);
  if (!result.success) {
    expect(result.error.issues.length).toEqual(2);
    expect(result.error.issues[0].code).toEqual(Schema.SchemaIssueCode.too_small);
    expect(result.error.issues[1].code).toEqual(Schema.SchemaIssueCode.too_small);
  }
});

test("preprocess validates with sibling errors", () => {
  expect(() => {
    Schema.object({
      // Must be first
      missing: Schema.string().refine(() => false),
      preprocess: Schema.preprocess((data: any) => data?.trim(), Schema.string().regex(/ asdf/)),
    }).parse({ preprocess: " asdf" });
  }).toThrow(
    JSON.stringify(
      [
        {
          code: "invalid_type",
          expected: "string",
          received: "undefined",
          path: ["missing"],
          message: "Required",
        },
        {
          validation: "regex",
          code: "invalid_string",
          message: "Invalid",
          path: ["preprocess"],
        },
      ],
      null,
      2
    )
  );
});
