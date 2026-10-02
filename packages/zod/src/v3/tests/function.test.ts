// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";
import { util } from "../helpers/util.js";

const args1 = Schema.tuple([Schema.string()]);
const returns1 = Schema.number();
const func1 = Schema.function(args1, returns1);

test("function parsing", () => {
  const parsed = func1.parse((arg: any) => arg.length);
  const result = parsed("asdf");
  expect(result).toBe(4);
});

test("parsed function fail 1", () => {
  const parsed = func1.parse((x: string) => x);
  expect(() => parsed("asdf")).toThrow();
});

test("parsed function fail 2", () => {
  const parsed = func1.parse((x: string) => x);
  expect(() => parsed(13 as any)).toThrow();
});

test("function inference 1", () => {
  type func1 = Schema.TypeOf<typeof func1>;
  util.assertEqual<func1, (k: string) => number>(true);
});

test("method parsing", () => {
  const methodObject = Schema.object({
    property: Schema.number(),
    method: Schema.function().args(Schema.string()).returns(Schema.number()),
  });
  const methodInstance = {
    property: 3,
    method: function (s: string) {
      return s.length + this.property;
    },
  };
  const parsed = methodObject.parse(methodInstance);
  expect(parsed.method("length=8")).toBe(11); // 8 length + 3 property
});

test("async method parsing", async () => {
  const methodObject = Schema.object({
    property: Schema.number(),
    method: Schema.function().args(Schema.string()).returns(Schema.promise(Schema.number())),
  });
  const methodInstance = {
    property: 3,
    method: async function (s: string) {
      return s.length + this.property;
    },
  };
  const parsed = methodObject.parse(methodInstance);
  expect(await parsed.method("length=8")).toBe(11); // 8 length + 3 property
});

test("args method", () => {
  const t1 = Schema.function();
  type t1 = Schema.infer<typeof t1>;
  util.assertEqual<t1, (...args_1: unknown[]) => unknown>(true);

  const t2 = t1.args(Schema.string());
  type t2 = Schema.infer<typeof t2>;
  util.assertEqual<t2, (arg: string, ...args_1: unknown[]) => unknown>(true);

  const t3 = t2.returns(Schema.boolean());
  type t3 = Schema.infer<typeof t3>;
  util.assertEqual<t3, (arg: string, ...args_1: unknown[]) => boolean>(true);
});

const args2 = Schema.tuple([
  Schema.object({
    f1: Schema.number(),
    f2: Schema.string().nullable(),
    f3: Schema.array(Schema.boolean().optional()).optional(),
  }),
]);
const returns2 = Schema.union([Schema.string(), Schema.number()]);

const func2 = Schema.function(args2, returns2);

test("function inference 2", () => {
  type func2 = Schema.TypeOf<typeof func2>;
  util.assertEqual<
    func2,
    (arg: {
      f1: number;
      f2: string | null;
      f3?: (boolean | undefined)[] | undefined;
    }) => string | number
  >(true);
});

test("valid function run", () => {
  const validFunc2Instance = func2.validate((_x) => {
    return "adf" as any;
  });

  const checker = () => {
    validFunc2Instance({
      f1: 21,
      f2: "asdf",
      f3: [true, false],
    });
  };

  checker();
});

test("input validation error", () => {
  const invalidFuncInstance = func2.validate((_x) => {
    return "adf" as any;
  });

  const checker = () => {
    invalidFuncInstance("Invalid_input" as any);
  };

  expect(checker).toThrow();
});

test("output validation error", () => {
  const invalidFuncInstance = func2.validate((_x) => {
    return ["this", "is", "not", "valid", "output"] as any;
  });

  const checker = () => {
    invalidFuncInstance({
      f1: 21,
      f2: "asdf",
      f3: [true, false],
    });
  };

  expect(checker).toThrow();
});

Schema.function(Schema.tuple([Schema.string()])).args()._def.args;

test("special function error codes", () => {
  const checker = Schema.function(Schema.tuple([Schema.string()]), Schema.boolean()).implement((arg) => {
    return arg.length as any;
  });
  try {
    checker("12" as any);
  } catch (err) {
    const zerr = err as Schema  .SchemaError;
    const first = zerr.issues[0];
    if (first.code !== Schema.SchemaIssueCode.invalid_return_type) throw new Error();

    expect(first.returnTypeError).toBeInstanceOf(Schema.SchemaError);
  }

  try {
    checker(12 as any);
  } catch (err) {
    const zerr = err as Schema  .SchemaError;
    const first = zerr.issues[0];
    if (first.code !== Schema.SchemaIssueCode.invalid_arguments) throw new Error();
    expect(first.argumentsError).toBeInstanceOf(Schema.SchemaError);
  }
});

test("function with async refinements", async () => {
  const func = z
    .function()
    .args(Schema.string().refine(async (val) => val.length > 10))
    .returns(Schema.promise(Schema.number().refine(async (val) => val > 10)))
    .implement(async (val) => {
      return val.length;
    });
  const results = [];
  try {
    await func("asdfasdf");
    results.push("success");
  } catch (_err) {
    results.push("fail");
  }
  try {
    await func("asdflkjasdflkjsf");
    results.push("success");
  } catch (_err) {
    results.push("fail");
  }

  expect(results).toEqual(["fail", "success"]);
});

test("non async function with async refinements should fail", async () => {
  const func = z
    .function()
    .args(Schema.string().refine(async (val) => val.length > 10))
    .returns(Schema.number().refine(async (val) => val > 10))
    .implement((val) => {
      return val.length;
    });

  const results = [];
  try {
    await func("asdasdfasdffasdf");
    results.push("success");
  } catch (_err) {
    results.push("fail");
  }

  expect(results).toEqual(["fail"]);
});

test("allow extra parameters", () => {
  const maxLength5 = z
    .function()
    .args(Schema.string())
    .returns(Schema.boolean())
    .implement((str, _arg, _qewr) => {
      return str.length <= 5;
    });

  const filteredList = ["apple", "orange", "pear", "banana", "strawberry"].filter(maxLength5);
  expect(filteredList.length).toEqual(2);
});

test("params and returnType getters", () => {
  const func = Schema.function().args(Schema.string()).returns(Schema.string());

  const paramResult = func.parameters().items[0].parse("asdf");
  expect(paramResult).toBe("asdf");

  const returnResult = func.returnType().parse("asdf");
  expect(returnResult).toBe("asdf");
});

test("inference with transforms", () => {
  const funcSchema = z
    .function()
    .args(Schema.string().transform((val) => val.length))
    .returns(Schema.object({ val: Schema.number() }));
  const myFunc = funcSchema.implement((val) => {
    return { val, extra: "stuff" };
  });
  myFunc("asdf");

  util.assertEqual<typeof myFunc, (arg: string, ...args_1: unknown[]) => { val: number; extra: string }>(true);
});

test("fallback to OuterTypeOfFunction", () => {
  const funcSchema = z
    .function()
    .args(Schema.string().transform((val) => val.length))
    .returns(Schema.object({ arg: Schema.number() }).transform((val) => val.arg));

  const myFunc = funcSchema.implement((val) => {
    return { arg: val, arg2: false };
  });

  util.assertEqual<typeof myFunc, (arg: string, ...args_1: unknown[]) => number>(true);
});
