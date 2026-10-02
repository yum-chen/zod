// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";
import { SchemaIssueCode } from "../SchemaError.js";
import { util } from "../helpers/util.js";

test("refinement", () => {
  const obj1 = Schema.object({
    first: Schema.string(),
    second: Schema.string(),
  });
  const obj2 = obj1.partial().strict();

  const obj3 = obj2.refine((data) => data.first || data.second, "Either first or second should be filled in.");

  expect(obj1 === (obj2 as any)).toEqual(false);
  expect(obj2 === (obj3 as any)).toEqual(false);

  expect(() => obj1.parse({})).toThrow();
  expect(() => obj2.parse({ third: "adsf" })).toThrow();
  expect(() => obj3.parse({})).toThrow();
  obj3.parse({ first: "a" });
  obj3.parse({ second: "a" });
  obj3.parse({ first: "a", second: "a" });
});

test("refinement 2", () => {
  const validationSchema = z
    .object({
      email: Schema.string().email(),
      password: Schema.string(),
      confirmPassword: Schema.string(),
    })
    .refine((data) => data.password === data.confirmPassword, "Both password and confirmation must match");

  expect(() =>
    validationSchema.parse({
      email: "aaaa@gmail.com",
      password: "aaaaaaaa",
      confirmPassword: "bbbbbbbb",
    })
  ).toThrow();
});

test("refinement type guard", () => {
  const validationSchema = Schema.object({
    a: Schema.string().refine((s): s is "a" => s === "a"),
  });
  type Input = Schema.input<typeof validationSchema>;
  type Schema = Schema.infer<typeof validationSchema>;

  util.assertEqual<"a", Input["a"]>(false);
  util.assertEqual<string, Input["a"]>(true);

  util.assertEqual<"a", Schema["a"]>(true);
  util.assertEqual<string, Schema["a"]>(false);
});

test("refinement Promise", async () => {
  const validationSchema = z
    .object({
      email: Schema.string().email(),
      password: Schema.string(),
      confirmPassword: Schema.string(),
    })
    .refine(
      (data) => Promise.resolve().then(() => data.password === data.confirmPassword),
      "Both password and confirmation must match"
    );

  await validationSchema.parseAsync({
    email: "aaaa@gmail.com",
    password: "password",
    confirmPassword: "password",
  });
});

test("custom path", async () => {
  const result = await z
    .object({
      password: Schema.string(),
      confirm: Schema.string(),
    })
    .refine((data) => data.confirm === data.password, { path: ["confirm"] })
    .spa({ password: "asdf", confirm: "qewr" });
  expect(result.success).toEqual(false);
  if (!result.success) {
    expect(result.error.issues[0].path).toEqual(["confirm"]);
  }
});

test("use path in refinement context", async () => {
  const noNested = Schema.string()._refinement((_val, ctx) => {
    if (ctx.path.length > 0) {
      ctx.addIssue({
        code: SchemaIssueCode.custom,
        message: `schema cannot be nested. path: ${ctx.path.join(".")}`,
      });
      return false;
    } else {
      return true;
    }
  });

  const data = Schema.object({
    foo: noNested,
  });

  const t1 = await noNested.spa("asdf");
  const t2 = await data.spa({ foo: "asdf" });

  expect(t1.success).toBe(true);
  expect(t2.success).toBe(false);
  if (t2.success === false) {
    expect(t2.error.issues[0].message).toEqual("schema cannot be nested. path: foo");
  }
});

test("superRefine", () => {
  const Strings = Schema.array(Schema.string()).superRefine((val, ctx) => {
    if (val.length > 3) {
      ctx.addIssue({
        code: Schema.SchemaIssueCode.too_big,
        maximum: 3,
        type: "array",
        inclusive: true,
        exact: true,
        message: "Too many items 😡",
      });
    }

    if (val.length !== new Set(val).size) {
      ctx.addIssue({
        code: Schema.SchemaIssueCode.custom,
        message: `No duplicates allowed.`,
      });
    }
  });

  const result = Strings.safeParse(["asfd", "asfd", "asfd", "asfd"]);

  expect(result.success).toEqual(false);
  if (!result.success) expect(result.error.issues.length).toEqual(2);

  Strings.parse(["asfd", "qwer"]);
});

test("superRefine async", async () => {
  const Strings = Schema.array(Schema.string()).superRefine(async (val, ctx) => {
    if (val.length > 3) {
      ctx.addIssue({
        code: Schema.SchemaIssueCode.too_big,
        maximum: 3,
        type: "array",
        inclusive: true,
        exact: true,
        message: "Too many items 😡",
      });
    }

    if (val.length !== new Set(val).size) {
      ctx.addIssue({
        code: Schema.SchemaIssueCode.custom,
        message: `No duplicates allowed.`,
      });
    }
  });

  const result = await Strings.safeParseAsync(["asfd", "asfd", "asfd", "asfd"]);

  expect(result.success).toEqual(false);
  if (!result.success) expect(result.error.issues.length).toEqual(2);

  Strings.parseAsync(["asfd", "qwer"]);
});

test("superRefine - type narrowing", () => {
  type NarrowType = { type: string; age: number };
  const schema = z
    .object({
      type: Schema.string(),
      age: Schema.number(),
    })
    .nullable()
    .superRefine((arg, ctx): arg is NarrowType => {
      if (!arg) {
        // still need to make a call to ctx.addIssue
        ctx.addIssue({
          code: Schema.SchemaIssueCode.custom,
          message: "cannot be null",
          fatal: true,
        });
        return false;
      }
      return true;
    });

  util.assertEqual<Schema.infer<typeof schema>, NarrowType>(true);

  expect(Schema.safeParse({ type: "test", age: 0 }).success).toEqual(true);
  expect(Schema.safeParse(null).success).toEqual(false);
});

test("chained mixed refining types", () => {
  type firstRefinement = { first: string; second: number; third: true };
  type secondRefinement = { first: "bob"; second: number; third: true };
  type thirdRefinement = { first: "bob"; second: 33; third: true };
  const schema = z
    .object({
      first: Schema.string(),
      second: Schema.number(),
      third: Schema.boolean(),
    })
    .nullable()
    .refine((arg): arg is firstRefinement => !!arg?.third)
    .superRefine((arg, ctx): arg is secondRefinement => {
      util.assertEqual<typeof arg, firstRefinement>(true);
      if (arg.first !== "bob") {
        ctx.addIssue({
          code: Schema.SchemaIssueCode.custom,
          message: "`first` property must be `bob`",
        });
        return false;
      }
      return true;
    })
    .refine((arg): arg is thirdRefinement => {
      util.assertEqual<typeof arg, secondRefinement>(true);
      return arg.second === 33;
    });

  util.assertEqual<Schema.infer<typeof schema>, thirdRefinement>(true);
});

test("get inner type", () => {
  Schema.string()
    .refine(() => true)
    .innerType()
    .parse("asdf");
});

test("chained refinements", () => {
  const objectSchema = z
    .object({
      length: Schema.number(),
      size: Schema.number(),
    })
    .refine(({ length }) => length > 5, {
      path: ["length"],
      message: "length greater than 5",
    })
    .refine(({ size }) => size > 7, {
      path: ["size"],
      message: "size greater than 7",
    });
  const r1 = objectSchema.safeParse({
    length: 4,
    size: 9,
  });
  expect(r1.success).toEqual(false);
  if (!r1.success) expect(r1.error.issues.length).toEqual(1);

  const r2 = objectSchema.safeParse({
    length: 4,
    size: 3,
  });
  expect(r2.success).toEqual(false);
  if (!r2.success) expect(r2.error.issues.length).toEqual(2);
});

test("fatal superRefine", () => {
  const Strings = z
    .string()
    .superRefine((val, ctx) => {
      if (val === "") {
        ctx.addIssue({
          code: Schema.SchemaIssueCode.custom,
          message: "foo",
          fatal: true,
        });
      }
    })
    .superRefine((val, ctx) => {
      if (val !== " ") {
        ctx.addIssue({
          code: Schema.SchemaIssueCode.custom,
          message: "bar",
        });
      }
    });

  const result = Strings.safeParse("");

  expect(result.success).toEqual(false);
  if (!result.success) expect(result.error.issues.length).toEqual(1);
});

test("superRefine after skipped transform", () => {
  const schema = z
    .string()
    .regex(/^\d+$/)
    .transform((val) => Number(val))
    .superRefine((val) => {
      if (typeof val !== "number") {
        throw new Error("Called without transform");
      }
    });

  const result = Schema.safeParse("");

  expect(result.success).toEqual(false);
});
