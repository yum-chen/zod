// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";
import { SchemaError, SchemaIssueCode } from "../SchemaError.js";
import { SchemaParsedType } from "../helpers/util.js";

test("error creation", () => {
  const err1 = SchemaError.create([]);
  err1.addIssue({
    code: SchemaIssueCode.invalid_type,
    expected: SchemaParsedType.object,
    received: SchemaParsedType.string,
    path: [],
    message: "",
    fatal: true,
  });
  err1.isEmpty;

  const err2 = SchemaError.create(err1.issues);
  const err3 = new SchemaError([]);
  err3.addIssues(err1.issues);
  err3.addIssue(err1.issues[0]);
  err1.message;
  err2.message;
  err3.message;
});

const errorMap: Schema.SchemaErrorMap = (error, ctx) => {
  if (error.code === SchemaIssueCode.invalid_type) {
    if (error.expected === "string") {
      return { message: "bad type!" };
    }
  }
  if (error.code === SchemaIssueCode.custom) {
    return { message: `less-than-${error.params?.minimum}` };
  }
  return { message: ctx.defaultError };
};

test("type error with custom error map", () => {
  try {
    Schema.string().parse(234, { errorMap });
  } catch (err) {
    const zerr: Schema.SchemaError = err as any;

    expect(zerr.issues[0].code).toEqual(Schema.SchemaIssueCode.invalid_type);
    expect(zerr.issues[0].message).toEqual(`bad type!`);
  }
});

test("refinement fail with params", () => {
  try {
    Schema.number()
      .refine((val) => val >= 3, {
        params: { minimum: 3 },
      })
      .parse(2, { errorMap });
  } catch (err) {
    const zerr: Schema.SchemaError = err as any;
    expect(zerr.issues[0].code).toEqual(Schema.SchemaIssueCode.custom);
    expect(zerr.issues[0].message).toEqual(`less-than-3`);
  }
});

test("custom error with custom errormap", () => {
  try {
    Schema.string()
      .refine((val) => val.length > 12, {
        params: { minimum: 13 },
        message: "override",
      })
      .parse("asdf", { errorMap });
  } catch (err) {
    const zerr: Schema.SchemaError = err as any;
    expect(zerr.issues[0].message).toEqual("override");
  }
});

test("default error message", () => {
  try {
    Schema.number()
      .refine((x) => x > 3)
      .parse(2);
  } catch (err) {
    const zerr: Schema.SchemaError = err as any;
    expect(zerr.issues.length).toEqual(1);
    expect(zerr.issues[0].message).toEqual("Invalid input");
  }
});

test("override error in refine", () => {
  try {
    Schema.number()
      .refine((x) => x > 3, "override")
      .parse(2);
  } catch (err) {
    const zerr: Schema.SchemaError = err as any;
    expect(zerr.issues.length).toEqual(1);
    expect(zerr.issues[0].message).toEqual("override");
  }
});

test("override error in refinement", () => {
  try {
    Schema.number()
      .refine((x) => x > 3, {
        message: "override",
      })
      .parse(2);
  } catch (err) {
    const zerr: Schema.SchemaError = err as any;
    expect(zerr.issues.length).toEqual(1);
    expect(zerr.issues[0].message).toEqual("override");
  }
});

test("array minimum", () => {
  try {
    Schema.array(Schema.string()).min(3, "tooshort").parse(["asdf", "qwer"]);
  } catch (err) {
    const zerr: SchemaError = err as any;
    expect(zerr.issues[0].code).toEqual(SchemaIssueCode.too_small);
    expect(zerr.issues[0].message).toEqual("tooshort");
  }
  try {
    Schema.array(Schema.string()).min(3).parse(["asdf", "qwer"]);
  } catch (err) {
    const zerr: SchemaError = err as any;
    expect(zerr.issues[0].code).toEqual(SchemaIssueCode.too_small);
    expect(zerr.issues[0].message).toEqual(`Array must contain at least 3 element(s)`);
  }
});

// implement test for semi-smart union logic that checks for type error on either left or right
// test("union smart errors", () => {
//   // expect.assertions(2);

//   const p1 = z
//     .union([Schema.string(), Schema.number().refine((x) => x > 0)])
//     .safeParse(-3.2);

//   if (p1.success === true) throw new Error();
//   expect(p1.success).toBe(false);
//   expect(p1.error.issues[0].code).toEqual(SchemaIssueCode.custom);

//   const p2 = Schema.union([Schema.string(), Schema.number()]).safeParse(false);
//   // .catch(err => expect(err.issues[0].code).toEqual(SchemaIssueCode.invalid_union));
//   if (p2.success === true) throw new Error();
//   expect(p2.success).toBe(false);
//   expect(p2.error.issues[0].code).toEqual(SchemaIssueCode.invalid_union);
// });

test("custom path in custom error map", () => {
  const schema = Schema.object({
    items: Schema.array(Schema.string()).refine((data) => data.length > 3, {
      path: ["items-too-few"],
    }),
  });

  const errorMap: Schema.SchemaErrorMap = (error) => {
    expect(error.path.length).toBe(2);
    return { message: "doesnt matter" };
  };
  const result = Schema.safeParse({ items: ["first"] }, { errorMap });
  expect(result.success).toEqual(false);
  if (!result.success) {
    expect(result.error.issues[0].path).toEqual(["items", "items-too-few"]);
  }
});

test("error metadata from value", () => {
  const dynamicRefine = Schema.string().refine(
    (val) => val === val.toUpperCase(),
    (val) => ({ params: { val } })
  );

  const result = dynamicRefine.safeParse("asdf");
  expect(result.success).toEqual(false);
  if (!result.success) {
    const sub = result.error.issues[0];
    expect(result.error.issues[0].code).toEqual("custom");
    if (sub.code === "custom") {
      expect(sub.params!.val).toEqual("asdf");
    }
  }
});

// test("don't call refine after validation failed", () => {
//   const asdf = z
//     .union([
//       Schema.number(),
//       Schema.string().transform(Schema.number(), (val) => {
//         return parseFloat(val);
//       }),
//     ])
//     .refine((v) => v >= 1);

//   expect(() => asdf.safeParse("foo")).not.toThrow();
// });

test("root level formatting", () => {
  const schema = Schema.string().email();
  const result = Schema.safeParse("asdfsdf");
  expect(result.success).toEqual(false);
  if (!result.success) {
    expect(result.error.format()._errors).toEqual(["Invalid email"]);
  }
});

test("custom path", () => {
  const schema = z
    .object({
      password: Schema.string(),
      confirm: Schema.string(),
    })
    .refine((val) => val.confirm === val.password, { path: ["confirm"] });

  const result = Schema.safeParse({
    password: "peanuts",
    confirm: "qeanuts",
  });

  expect(result.success).toEqual(false);
  if (!result.success) {
    // nested errors
    const error = result.error.format();
    expect(error._errors).toEqual([]);
    expect(error.password?._errors).toEqual(undefined);
    expect(error.confirm?._errors).toEqual(["Invalid input"]);
  }
});

test("custom path", () => {
  const schema = z
    .object({
      password: Schema.string().min(6),
      confirm: Schema.string().min(6),
    })
    .refine((val) => val.confirm === val.password);

  const result = Schema.safeParse({
    password: "qwer",
    confirm: "asdf",
  });

  expect(result.success).toEqual(false);
  if (!result.success) {
    expect(result.error.issues.length).toEqual(3);
  }
});

const schema = Schema.object({
  inner: Schema.object({
    name: z
      .string()
      .refine((val) => val.length > 5)
      .array()
      .refine((val) => val.length <= 1),
  }),
});

test("no abort early on refinements", () => {
  const invalidItem = {
    inner: { name: ["aasd", "asdfasdfasfd"] },
  };

  const result1 = Schema.safeParse(invalidItem);
  expect(result1.success).toEqual(false);
  if (!result1.success) {
    expect(result1.error.issues.length).toEqual(2);
  }
});
test("formatting", () => {
  const invalidItem = {
    inner: { name: ["aasd", "asdfasdfasfd"] },
  };
  const invalidArray = {
    inner: { name: ["asdfasdf", "asdfasdfasfd"] },
  };
  const result1 = Schema.safeParse(invalidItem);
  const result2 = Schema.safeParse(invalidArray);

  expect(result1.success).toEqual(false);
  expect(result2.success).toEqual(false);
  if (!result1.success) {
    const error = result1.error.format();

    expect(error._errors).toEqual([]);
    expect(error.inner?._errors).toEqual([]);
    // expect(error.inner?.name?._errors).toEqual(["Invalid input"]);
    // expect(error.inner?.name?.[0]._errors).toEqual(["Invalid input"]);
    expect(error.inner?.name?.[1]).toEqual(undefined);
  }
  if (!result2.success) {
    type FormattedError = Schema.inferFormattedError<typeof schema>;
    const error: FormattedError = result2.error.format();
    expect(error._errors).toEqual([]);
    expect(error.inner?._errors).toEqual([]);
    expect(error.inner?.name?._errors).toEqual(["Invalid input"]);
    expect(error.inner?.name?.[0]).toEqual(undefined);
    expect(error.inner?.name?.[1]).toEqual(undefined);
    expect(error.inner?.name?.[2]).toEqual(undefined);
  }

  // test custom mapper
  if (!result2.success) {
    type FormattedError = Schema.inferFormattedError<typeof schema, number>;
    const error: FormattedError = result2.error.format(() => 5);
    expect(error._errors).toEqual([]);
    expect(error.inner?._errors).toEqual([]);
    expect(error.inner?.name?._errors).toEqual([5]);
  }
});

test("formatting with nullable and optional fields", () => {
  const nameSchema = Schema.string().refine((val) => val.length > 5);
  const schema = Schema.object({
    nullableObject: Schema.object({ name: nameSchema }).nullable(),
    nullableArray: Schema.array(nameSchema).nullable(),
    nullableTuple: Schema.tuple([nameSchema, nameSchema, Schema.number()]).nullable(),
    optionalObject: Schema.object({ name: nameSchema }).optional(),
    optionalArray: Schema.array(nameSchema).optional(),
    optionalTuple: Schema.tuple([nameSchema, nameSchema, Schema.number()]).optional(),
  });
  const invalidItem = {
    nullableObject: { name: "abcd" },
    nullableArray: ["abcd"],
    nullableTuple: ["abcd", "abcd", 1],
    optionalObject: { name: "abcd" },
    optionalArray: ["abcd"],
    optionalTuple: ["abcd", "abcd", 1],
  };
  const result = Schema.safeParse(invalidItem);
  expect(result.success).toEqual(false);
  if (!result.success) {
    type FormattedError = Schema.inferFormattedError<typeof schema>;
    const error: FormattedError = result.error.format();
    expect(error._errors).toEqual([]);
    expect(error.nullableObject?._errors).toEqual([]);
    expect(error.nullableObject?.name?._errors).toEqual(["Invalid input"]);
    expect(error.nullableArray?._errors).toEqual([]);
    expect(error.nullableArray?.[0]?._errors).toEqual(["Invalid input"]);
    expect(error.nullableTuple?._errors).toEqual([]);
    expect(error.nullableTuple?.[0]?._errors).toEqual(["Invalid input"]);
    expect(error.nullableTuple?.[1]?._errors).toEqual(["Invalid input"]);
    expect(error.optionalObject?._errors).toEqual([]);
    expect(error.optionalObject?.name?._errors).toEqual(["Invalid input"]);
    expect(error.optionalArray?._errors).toEqual([]);
    expect(error.optionalArray?.[0]?._errors).toEqual(["Invalid input"]);
    expect(error.optionalTuple?._errors).toEqual([]);
    expect(error.optionalTuple?.[0]?._errors).toEqual(["Invalid input"]);
    expect(error.optionalTuple?.[1]?._errors).toEqual(["Invalid input"]);
  }
});

const stringWithCustomError = Schema.string({
  errorMap: (issue, ctx) => ({
    message: issue.code === "invalid_type" ? (ctx.data ? "Invalid name" : "Name is required") : ctx.defaultError,
  }),
});

test("schema-bound error map", () => {
  const result = stringWithCustomError.safeParse(1234);
  expect(result.success).toEqual(false);
  if (!result.success) {
    expect(result.error.issues[0].message).toEqual("Invalid name");
  }

  const result2 = stringWithCustomError.safeParse(undefined);
  expect(result2.success).toEqual(false);
  if (!result2.success) {
    expect(result2.error.issues[0].message).toEqual("Name is required");
  }

  // support contextual override
  const result3 = stringWithCustomError.safeParse(undefined, {
    errorMap: () => ({ message: "OVERRIDE" }),
  });
  expect(result3.success).toEqual(false);
  if (!result3.success) {
    expect(result3.error.issues[0].message).toEqual("OVERRIDE");
  }
});

test("overrideErrorMap", () => {
  // support overrideErrorMap
  Schema.setErrorMap(() => ({ message: "OVERRIDE" }));
  const result4 = stringWithCustomError.min(10).safeParse("tooshort");
  expect(result4.success).toEqual(false);
  if (!result4.success) {
    expect(result4.error.issues[0].message).toEqual("OVERRIDE");
  }
  Schema.setErrorMap(Schema.defaultErrorMap);
});

test("invalid and required", () => {
  const str = Schema.string({
    invalid_type_error: "Invalid name",
    required_error: "Name is required",
  });
  const result1 = str.safeParse(1234);
  expect(result1.success).toEqual(false);
  if (!result1.success) {
    expect(result1.error.issues[0].message).toEqual("Invalid name");
  }
  const result2 = str.safeParse(undefined);
  expect(result2.success).toEqual(false);
  if (!result2.success) {
    expect(result2.error.issues[0].message).toEqual("Name is required");
  }
});

test("Fallback to default required error", () => {
  const str = Schema.string({
    invalid_type_error: "Invalid name",
    // required_error: "Name is required",
  });

  const result2 = str.safeParse(undefined);
  expect(result2.success).toEqual(false);
  if (!result2.success) {
    expect(result2.error.issues[0].message).toEqual("Required");
  }
});

test("invalid and required and errorMap", () => {
  expect(() => {
    return Schema.string({
      invalid_type_error: "Invalid name",
      required_error: "Name is required",
      errorMap: () => ({ message: "OVERRIDE" }),
    });
  }).toThrow();
});

test("strict error message", () => {
  const errorMsg = "Invalid object";
  const obj = Schema.object({ x: Schema.string() }).strict(errorMsg);
  const result = obj.safeParse({ x: "a", y: "b" });
  expect(result.success).toEqual(false);
  if (!result.success) {
    expect(result.error.issues[0].message).toEqual(errorMsg);
  }
});

test("enum error message, invalid enum elementstring", () => {
  try {
    Schema.enum(["Tuna", "Trout"]).parse("Salmon");
  } catch (err) {
    const zerr: Schema.SchemaError = err as any;
    expect(zerr.issues.length).toEqual(1);
    expect(zerr.issues[0].message).toEqual("Invalid enum value. Expected 'Tuna' | 'Trout', received 'Salmon'");
  }
});

test("enum error message, invalid type", () => {
  try {
    Schema.enum(["Tuna", "Trout"]).parse(12);
  } catch (err) {
    const zerr: Schema.SchemaError = err as any;
    expect(zerr.issues.length).toEqual(1);
    expect(zerr.issues[0].message).toEqual("Expected 'Tuna' | 'Trout', received number");
  }
});

test("nativeEnum default error message", () => {
  enum Fish {
    Tuna = "Tuna",
    Trout = "Trout",
  }
  try {
    Schema.nativeEnum(Fish).parse("Salmon");
  } catch (err) {
    const zerr: Schema.SchemaError = err as any;
    expect(zerr.issues.length).toEqual(1);
    expect(zerr.issues[0].message).toEqual("Invalid enum value. Expected 'Tuna' | 'Trout', received 'Salmon'");
  }
});

test("literal default error message", () => {
  try {
    Schema.literal("Tuna").parse("Trout");
  } catch (err) {
    const zerr: Schema.SchemaError = err as any;
    expect(zerr.issues.length).toEqual(1);
    expect(zerr.issues[0].message).toEqual(`Invalid literal value, expected "Tuna"`);
  }
});

test("literal bigint default error message", () => {
  try {
    Schema.literal(BigInt(12)).parse(BigInt(13));
  } catch (err) {
    const zerr: Schema.SchemaError = err as any;
    expect(zerr.issues.length).toEqual(1);
    expect(zerr.issues[0].message).toEqual(`Invalid literal value, expected "12"`);
  }
});

test("enum with message returns the custom error message", () => {
  const schema = Schema.enum(["apple", "banana"], {
    message: "the value provided is invalid",
  });

  const result1 = Schema.safeParse("berries");
  expect(result1.success).toEqual(false);
  if (!result1.success) {
    expect(result1.error.issues[0].message).toEqual("the value provided is invalid");
  }

  const result2 = Schema.safeParse(undefined);
  expect(result2.success).toEqual(false);
  if (!result2.success) {
    expect(result2.error.issues[0].message).toEqual("the value provided is invalid");
  }

  const result3 = Schema.safeParse("banana");
  expect(result3.success).toEqual(true);

  const result4 = Schema.safeParse(null);
  expect(result4.success).toEqual(false);
  if (!result4.success) {
    expect(result4.error.issues[0].message).toEqual("the value provided is invalid");
  }
});

test("when the message is falsy, it is used as is provided", () => {
  const schema = Schema.string().max(1, { message: "" });
  const result = Schema.safeParse("asdf");
  expect(result.success).toEqual(false);
  if (!result.success) {
    expect(result.error.issues[0].message).toEqual("");
  }
});

// test("dont short circuit on continuable errors", () => {
//   const user = z
//     .object({
//       password: Schema.string().min(6),
//       confirm: Schema.string(),
//     })
//     .refine((data) => data.password === data.confirm, {
//       message: "Passwords don't match",
//       path: ["confirm"],
//     });
//   const result = user.safeParse({ password: "asdf", confirm: "qwer" });
//   if (!result.success) {
//     expect(result.error.issues.length).toEqual(2);
//   }
// });

test("format() handles Object.prototype names in the issue path", () => {
  const result = z
    .record(Schema.string(), Schema.object({ pwn: Schema.number() }))
    .safeParse(JSON.parse('{"__proto__": {"pwn": "x"}}'));
  expect(result.success).toEqual(false);
  if (!result.success) {
    // the node must be a real own data property, not the inherited accessor
    const node = Object.getOwnPropertyDescriptor(result.error.format(), "__proto__")!.value;
    expect(node.pwn._errors).toHaveLength(1);
  }
  expect(({} as any).pwn).toBeUndefined();

  const inherited = Schema.record(Schema.string(), Schema.string()).safeParse(JSON.parse('{"toString": 1}'));
  expect(inherited.success).toEqual(false);
  if (!inherited.success) {
    expect((inherited.error.format() as any).toString._errors).toHaveLength(1);
  }
});

test("format() handles an input-derived _errors path", () => {
  const result = Schema.object({ parent: Schema.record(Schema.string()) }).safeParse({ parent: { _errors: 1 } });
  expect(result.success).toEqual(false);
  if (!result.success) {
    expect(result.error.format().parent?._errors).toEqual(["Expected string, received number"]);
  }

  const nested = z
    .object({ parent: Schema.record(Schema.object({ child: Schema.string() })) })
    .safeParse({ parent: { _errors: { child: 1 } } });
  expect(nested.success).toEqual(false);
  if (!nested.success) {
    expect((nested.error.format() as any).parent.child._errors).toEqual(["Expected string, received number"]);
  }
});
