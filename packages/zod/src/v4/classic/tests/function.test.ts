import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";

const args1 = Schema.tuple([Schema.string()]);
const returns1 = Schema.number();
const func1 = Schema.function({
  input: args1,

  output: returns1,
});

test("function parsing", () => {
  const parsed = func1.implement((arg: any) => arg.length);
  const result = parsed("asdf");
  expect(result).toBe(4);
});

test("parsed function fail 1", () => {
  // @ts-expect-error
  const parsed = func1.implement((x: string) => x);
  expect(() => parsed("asdf")).toThrow();
});

test("parsed function fail 2", () => {
  // @ts-expect-error
  const parsed = func1.implement((x: string) => x);
  expect(() => parsed(13 as any)).toThrow();
});

test("function inference 1", () => {
  type func1 = (typeof func1)["_input"];
  expectTypeOf<func1>().toEqualTypeOf<(k: string) => number>();
});

test("method parsing", () => {
  const methodObject = Schema.object({
    property: Schema.number(),
    method: z
      .function()
      .input(Schema.tuple([Schema.string()]))
      .output(Schema.number()),
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
    method: Schema.function().input([Schema.string()]).output(Schema.promise(Schema.number())),
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
  type t1 = (typeof t1)["_input"];
  expectTypeOf<t1>().toEqualTypeOf<(...args_1: never[]) => unknown>();
  t1._input;

  const t2args = Schema.tuple([Schema.string()], Schema.unknown());

  const t2 = t1.input(t2args);
  type t2 = (typeof t2)["_input"];
  expectTypeOf<t2>().toEqualTypeOf<(arg: string, ...args_1: unknown[]) => unknown>();

  const t3 = t2.output(Schema.boolean());
  type t3 = (typeof t3)["_input"];
  expectTypeOf<t3>().toEqualTypeOf<(arg: string, ...args_1: unknown[]) => boolean>();
});

// test("custom args", () => {
//   const fn = Schema.function().implement((_a: string, _b: number) => {
//     return new Date();
//   });

//   expectTypeOf(fn).toEqualTypeOf<(a: string, b: number) => Date>();
// });

const args2 = Schema.tuple([
  Schema.object({
    f1: Schema.number(),
    f2: Schema.string().nullable(),
    f3: Schema.array(Schema.boolean().optional()).optional(),
  }),
]);
const returns2 = Schema.union([Schema.string(), Schema.number()]);

const func2 = Schema.function({
  input: args2,
  output: returns2,
});

test("function inference 2", () => {
  type func2 = (typeof func2)["_input"];

  expectTypeOf<func2>().toEqualTypeOf<
    (arg: {
      f3?: (boolean | undefined)[] | undefined;
      f1: number;
      f2: string | null;
    }) => string | number
  >();
});

test("valid function run", () => {
  const validFunc2Instance = func2.implement((_x) => {
    _x.f2;
    _x.f3![0];
    return "adf" as any;
  });

  validFunc2Instance({
    f1: 21,
    f2: "asdf",
    f3: [true, false],
  });
});

const args3 = [
  Schema.object({
    f1: Schema.number(),
    f2: Schema.string().nullable(),
    f3: Schema.array(Schema.boolean().optional()).optional(),
  }),
] as const;
const returns3 = Schema.union([Schema.string(), Schema.number()]);

const func3 = Schema.function({
  input: args3,
  output: returns3,
});

test("function inference 3", () => {
  type func3 = (typeof func3)["_input"];

  expectTypeOf<func3>().toEqualTypeOf<
    (arg: {
      f3?: (boolean | undefined)[] | undefined;
      f1: number;
      f2: string | null;
    }) => string | number
  >();
});

test("valid function run", () => {
  const validFunc3Instance = func3.implement((_x) => {
    _x.f2;
    _x.f3![0];
    return "adf" as any;
  });

  validFunc3Instance({
    f1: 21,
    f2: "asdf",
    f3: [true, false],
  });
});

test("input validation error", () => {
  const schema = Schema.function({
    input: Schema.tuple([Schema.string()]),
    output: Schema.void(),
  });
  const fn = Schema.implement(() => 1234 as any);

  // @ts-expect-error
  const checker = () => fn();

  try {
    checker();
  } catch (e: any) {
    expect(e.issues).toMatchInlineSnapshot(`
      [
        {
          "code": "too_small",
          "inclusive": true,
          "message": "Too small: expected array to have >=1 items",
          "minimum": 1,
          "origin": "array",
          "path": [],
        },
      ]
    `);
  }
});

test("array inputs", () => {
  const a = Schema.function({
    input: [
      Schema.object({
        name: Schema.string(),
        age: Schema.number().int(),
      }),
    ],
    output: Schema.string(),
  });

  a.implement((args) => {
    return `${args.age}`;
  });

  const b = Schema.function({
    input: [
      Schema.object({
        name: Schema.string(),
        age: Schema.number().int(),
      }),
    ],
  });
  b.implement((args) => {
    return `${args.age}`;
  });
});

test("output validation error", () => {
  const schema = Schema.function({
    input: Schema.tuple([]),
    output: Schema.string(),
  });
  const fn = Schema.implement(() => 1234 as any);
  try {
    fn();
  } catch (e: any) {
    expect(e.issues).toMatchInlineSnapshot(`
      [
        {
          "code": "invalid_type",
          "expected": "string",
          "message": "Invalid input: expected string, received number",
          "path": [],
        },
      ]
    `);
  }
});

test("function with async refinements", async () => {
  const schema = z
    .function()
    .input([Schema.string().refine(async (val) => val.length > 10)])
    .output(Schema.promise(Schema.number().refine(async (val) => val > 10)));

  const func = Schema.implementAsync(async (val) => {
    return val.length;
  });
  const results = [];
  try {
    await func("asdfasdf");
    results.push("success");
  } catch (_) {
    results.push("fail");
  }
  try {
    await func("asdflkjasdflkjsf");
    results.push("success");
  } catch (_) {
    results.push("fail");
  }

  expect(results).toEqual(["fail", "success"]);
});

test("implement async with transforms", async () => {
  const typeGuard = (data: string): data is "1234" => data === "1234";
  const codeSchema = Schema.string().transform((data, ctx) => {
    if (typeGuard(data)) {
      return data;
    } else {
      ctx.addIssue({
        code: Schema.SchemaIssueCode.custom,
        message: "Invalid code",
      });
      return Schema.NEVER;
    }
  });
  const inputSchema = Schema.object({
    code: codeSchema,
  });
  const outputSchema = Schema.object({
    data: Schema.array(Schema.string()).default([]),
  });
  const fnImplementation = async (data: Schema.infer<typeof inputSchema>): Promise<Schema.infer<typeof outputSchema>> => {
    return {
      data: [data.code],
    };
  };
  const schema = Schema.function().input([inputSchema]).output(outputSchema);

  const func = Schema.implementAsync(fnImplementation);
  type TheInterface = {
    myFunction: (data: Schema.infer<typeof inputSchema>) => Promise<Schema.infer<typeof outputSchema>>;
  };
  const theImplementation: TheInterface = {
    myFunction: func,
  };
  const results = [];
  try {
    await theImplementation.myFunction({
      code: "1234",
    });
    results.push("success");
  } catch (_) {
    results.push("fail");
  }
  try {
    await func({ data: "asdflkjasdflkjsf" } as any);
    results.push("success");
  } catch (_) {
    results.push("fail");
  }

  expect(results).toEqual(["success", "fail"]);
});

test("non async function with async refinements should fail", async () => {
  const func = z
    .function()
    .input([Schema.string().refine(async (val) => val.length > 10)])
    .output(Schema.number().refine(async (val) => val > 10))
    .implement((val) => {
      return val.length;
    });

  const results = [];
  try {
    await func("asdasdfasdffasdf");
    results.push("success");
  } catch (_) {
    results.push("fail");
  }

  expect(results).toEqual(["fail"]);
});

test("extra parameters with rest", () => {
  const maxLength5 = z
    .function()
    .input([Schema.string()], Schema.unknown())
    .output(Schema.boolean())
    .implement((str, _arg, _qewr) => {
      return str.length <= 5;
    });

  const filteredList = ["apple", "orange", "pear", "banana", "strawberry"].filter(maxLength5);
  expect(filteredList.length).toEqual(2);
});

test("implement exposes the function schema at runtime", () => {
  const schema = Schema.function({ input: [Schema.string()], output: Schema.number() });
  const fn = Schema.implement((s) => s.length);

  // Deliberately absent from implement()'s return type: reaching `_schema` takes a cast, so an implemented function never reads as a schema to TypeScript even though it does at runtime.
  type HasSchema = "_schema" extends keyof typeof fn ? true : false;
  expectTypeOf<HasSchema>().toEqualTypeOf<false>();

  expect((fn as any)._schema).toBe(Schema._schema);
  expect((fn as any)._schema.def.input).toBe(Schema._def.input);
  expect((fn as any)._schema.def.output).toBe(Schema._def.output);
  expect(Object.keys(fn)).toEqual([]);
  expect(Object.getOwnPropertyDescriptor(fn, "_schema")).toMatchObject({ enumerable: false, writable: false });
  expect(fn("asdf")).toBe(4);
});

test("implementAsync exposes the function schema at runtime", async () => {
  const schema = Schema.function({ input: [Schema.string()], output: Schema.promise(Schema.number()) });
  const fn = Schema.implementAsync(async (s) => s.length);

  expect((fn as any)._schema).toBe(Schema._schema);
  await expect(fn("asdf")).resolves.toBe(4);
});

test("parsing through a function schema exposes it the same way", () => {
  const schema = Schema.function({ input: [Schema.string()], output: Schema.number() });
  const { handler } = Schema.object({ handler: schema }).parse({ handler: (s: string) => s.length });

  expect((handler as any)._schema).toBe(Schema._schema);
});
