import { expect, expectTypeOf, test } from "vitest";

import * as zm from "schema/mini";
import * as Schema from "schema/v4";

test("validate answers like safeParse.success", () => {
  expect(Schema.validate(Schema.string(), "asdf")).toBe(true);
  expect(Schema.validate(Schema.string(), 12)).toBe(false);
  expect(Schema.validate(Schema.number().int().min(0), 5)).toBe(true);
  expect(Schema.validate(Schema.number().int().min(0), -5)).toBe(false);
  const schema = Schema.object({ a: Schema.string(), b: Schema.array(Schema.number()) });
  expect(Schema.validate(schema, { a: "x", b: [1, 2] })).toBe(true);
  expect(Schema.validate(schema, { a: "x", b: [1, "2"] })).toBe(false);
  expect(Schema.validate(schema, null)).toBe(false);
});

test("validate runs transforms and refinements for the verdict only", () => {
  const schema = z
    .string()
    .transform((s) => s.length)
    .pipe(Schema.number().max(3));
  expect(Schema.validate(schema, "ab")).toBe(true);
  expect(Schema.validate(schema, "abcd")).toBe(false);
  expect(Schema.validate(Schema.coerce.number(), "5")).toBe(true);
});

test("validate narrows to the input type", () => {
  const value: unknown = "hi";
  if (Schema.validate(Schema.string(), value)) {
    expectTypeOf(value).toEqualTypeOf<string>();
  }
  const transforming = Schema.string().transform((s) => s.length);
  if (Schema.validate(transforming, value)) {
    expectTypeOf(value).toEqualTypeOf<string>();
  }
});

test("validate throws on async schemas; validateAsync handles them", async () => {
  const schema = Schema.string().refine(async (s) => s.length > 2);
  expect(() => Schema.validate(schema, "asdf")).toThrow();
  await expect(Schema.validateAsync(schema, "asdf")).resolves.toBe(true);
  await expect(Schema.validateAsync(schema, "a")).resolves.toBe(false);
  await expect(Schema.validateAsync(Schema.string(), "a")).resolves.toBe(true);
  // a promise-returning callback that is not declared async compiles, so the compiled schema must stay off the fast path
  const compiled = Schema.compile(Schema.string().refine((s) => Promise.resolve(s.length > 1)));
  await expect(Schema.validateAsync(compiled, "abc")).resolves.toBe(true);
  await expect(Schema.validateAsync(compiled, "a")).resolves.toBe(false);
});

test("validate agrees with the compiled fast path and keeps the callback bound", () => {
  let calls = 0;
  const schema = Schema.object({
    name: Schema.string().refine((s) => {
      calls++;
      return s.length > 1;
    }),
  });
  const compiled = Schema.compile(schema);

  calls = 0;
  expect(Schema.validate(compiled, { name: "ok" })).toBe(true);
  expect(calls).toBe(1);

  calls = 0;
  expect(Schema.validate(compiled, { name: "x" })).toBe(false);
  // a user callback can throw, so its rejection is not decidable and the fallback still runs
  expect(calls).toBeLessThanOrEqual(2);

  expect(Schema.validate(compiled, { name: 42 })).toBe(false);
  expect(Schema.validate(compiled, { name: "x" }, {})).toBe(false);
  expect(Schema.validate(schema, { name: "ok" })).toBe(true);
});

test("the validate shortcut is taken for callback-free schemas only", () => {
  const definite = (s: Schema.SchemaType) => (Schema.compile(s, { strict: true }) as any)._schema.bag.validator?.definite;

  // nothing here can throw, so a compiled rejection is proof the runtime would reject
  expect(definite(Schema.object({ a: Schema.string().min(1), b: Schema.number().max(3), c: Schema.email() }))).toBe(true);
  expect(definite(Schema.array(Schema.enum(["a", "b"])))).toBe(true);

  // each of these can answer INVALID for something the interpreter throws on
  expect(definite(Schema.object({ a: Schema.string().refine(() => true) }))).toBe(false);
  expect(definite(Schema.string().transform((v) => v))).toBe(false);
  expect(definite(Schema.custom(() => true))).toBe(false);
  expect(definite(Schema.number().catch(0))).toBe(false);
  expect(definite(Schema.lazy(() => Schema.string()))).toBe(false);
  expect(
    definite(
      Schema.intersection(
        Schema.number(),
        Schema.number().transform((x) => x + 1)
      )
    )
  ).toBe(false);
  expect(
    definite(
      Schema.record(
        Schema.string().transform((k) => k),
        Schema.number()
      )
    )
  ).toBe(false);
});

test("compiled validate keeps the fallback where INVALID is not a decidable rejection", () => {
  // an intersection answers INVALID for an unmergeable merge, which the interpreter answers with a throw — a fast false would misreport a schema bug
  const unmergeable = Schema.compile(
    Schema.intersection(
      Schema.number(),
      Schema.number().transform((x) => x + 1)
    ),
    { strict: true }
  );
  expect(() => Schema.validate(unmergeable, 1234)).toThrow("Unmergable intersection");

  // a when-gated check islands at codegen, and an island answers INVALID for an async run too
  const gated = Schema.number().refine(() => Promise.resolve(true));
  (gated._schema.def.checks![0]!._schema.def as { when?: unknown }).when = () => true;
  const compiled = Schema.compile(Schema.object({ n: gated }), { strict: true });
  expect(() => Schema.validate(compiled, { n: 3 })).toThrow(Schema.core.$SchemaAsyncError);
  expect(() => Schema.validate(Schema.object({ n: gated }), { n: 3 })).toThrow(Schema.core.$SchemaAsyncError);

  // a plain function handing back a promise answers INVALID for union parity, so a transform is never a decidable rejection
  const piped = Schema.string().transform(() => Promise.resolve(1));
  expect(() => Schema.validate(Schema.compile(piped, { strict: true }), "x")).toThrow(Schema.core.$SchemaAsyncError);
  expect(() => Schema.validate(piped, "x")).toThrow(Schema.core.$SchemaAsyncError);

  // a continuable child issue short-circuits the compiled intersection before its merge, but the interpreter reaches the merge and throws
  const continuable = Schema.intersection(
    Schema.number().min(10),
    Schema.number().transform((x) => x + 1)
  );
  expect(() => Schema.validate(Schema.compile(continuable, { strict: true }), 1)).toThrow("Unmergable intersection");
  expect(() => Schema.validate(continuable, 1)).toThrow("Unmergable intersection");
});

test("compiled validate agrees with the interpreter, verdict and throw alike", () => {
  // guards the `definite` flag: a new generator that answers INVALID for something the interpreter throws on must clear it, or this fails
  const thenable = () => Promise.resolve(1) as never;
  const schemas: Schema.SchemaType[] = [
    Schema.object({ a: Schema.string(), b: Schema.number().min(1) }),
    Schema.strictObject({ a: Schema.string() }),
    Schema.array(Schema.string().min(1)),
    Schema.tuple([Schema.string()], Schema.number()),
    Schema.record(Schema.string(), Schema.number()),
    // a record key compiles in its own context, so its definiteness has to be carried out
    Schema.record(Schema.string().transform(thenable), Schema.number()),
    Schema.record(Schema.email(), Schema.number()),
    Schema.union([Schema.string(), Schema.number()]),
    Schema.intersection(
      Schema.number(),
      Schema.number().transform((x) => x + 1)
    ),
    Schema.intersection(
      Schema.number().min(10),
      Schema.number().transform((x) => x + 1)
    ),
    // unmergeable with no user callback in it, so only the intersection itself can clear the flag
    Schema.intersection(Schema.string().default("a"), Schema.string().default("b")),
    Schema.lazy(() => Schema.object({ a: Schema.string() })),
    Schema.number().catch(0),
    Schema.nonoptional(Schema.string().optional()),
    Schema.map(Schema.string(), Schema.number()),
    Schema.set(Schema.string().min(2)),
    Schema.templateLiteral(["a", Schema.number()]),
    Schema.coerce.number(),
    Schema.stringbool(),
    Schema.string().transform(thenable),
    Schema.union([Schema.string().transform(thenable), Schema.number()]),
    Schema.array(Schema.string().transform(thenable)),
    Schema.custom(thenable),
    Schema.string().refine(thenable),
    Schema.string().pipe(Schema.string().min(3)),
    // a codec's decode is the pipe branch's transform, and a plain function can still hand back a promise
    Schema.codec(Schema.string(), Schema.number(), { decode: thenable, encode: String }),
    Schema.object({ first: Schema.string(), second: Schema.codec(Schema.string(), Schema.number(), { decode: thenable, encode: String }) }),
    // a continuable check does not settle the interpreter's walk, so it reaches a throwing callback the compiled path short-circuits past — the first-failure exit does not cover the check chain
    z
      .string()
      .min(5)
      .refine(() => {
        throw new RangeError("u");
      }),
    z
      .string()
      .min(5)
      .superRefine(() => {
        throw new RangeError("u");
      }),
    // a user callback can throw, and compiled code can reject an earlier sibling before ever reaching it
    Schema.object({
      first: Schema.string(),
      second: Schema.string().refine(() => {
        throw new RangeError("u");
      }),
    }),
    Schema.object({
      first: Schema.string(),
      second: Schema.custom(() => {
        throw new TypeError("u");
      }),
    }),
    // superRefine and check take the other branch of the refine generator than refine does
    Schema.object({
      first: Schema.string(),
      second: Schema.string().superRefine(() => {
        throw new RangeError("u");
      }),
    }),
    Schema.string().superRefine(thenable as never),
    Schema.object({
      first: Schema.string(),
      second: Schema.string().transform(() => {
        throw new RangeError("u");
      }),
    }),
    Schema.object({ first: Schema.string(), second: Schema.custom(thenable) }),
    Schema.tuple([
      Schema.string(),
      Schema.number().catch(() => {
        throw new RangeError("u");
      }),
    ]),
  ];
  const inputs = [
    "x",
    "ab",
    "",
    0,
    1,
    Number.NaN,
    true,
    null,
    undefined,
    {},
    { a: "x" },
    { a: 1 },
    [],
    ["x"],
    new Map(),
    new Set(["a"]),
    "true",
    // the exposing shape: an earlier field the compiled path rejects before it reaches the throwing one
    { first: 1, second: "s" },
    { first: "s", second: "s" },
    { first: 1 },
    [1, "x"],
    ["s", "x"],
  ];
  const outcome = (fn: () => unknown) => {
    try {
      return `ok:${fn()}`;
    } catch (err) {
      return `throw:${(err as Error)?.constructor?.name}`;
    }
  };

  for (const schema of schemas) {
    let compiled: Schema.SchemaType;
    try {
      compiled = Schema.compile(schema, { strict: true });
    } catch {
      continue; // refused at codegen, so there is no fast path to disagree
    }
    for (const input of inputs) {
      expect(
        outcome(() => Schema.validate(compiled, input)),
        `${JSON.stringify(input)} on ${Schema._schema.def.type}`
      ).toBe(outcome(() => Schema.validate(schema, input)));
    }
  }
});

test("validate is exported from schema/mini", () => {
  expect(zm.validate(zm.string(), "a")).toBe(true);
  expect(zm.validate(zm.string(), 1)).toBe(false);
  expect(zm.validate(zm.object({ a: zm.number() }), { a: 1 })).toBe(true);
});

test("the validate method matches the top-level function", () => {
  expect(Schema.string().validate("asdf")).toBe(true);
  expect(Schema.string().validate(12)).toBe(false);
  expect(Schema.object({ a: Schema.string() }).validate({ a: "x" })).toBe(true);
  expect(Schema.object({ a: Schema.string() }).validate({ a: 1 })).toBe(false);
  expect(Schema.compile(Schema.object({ a: Schema.string() })).validate({ a: "x" })).toBe(true);
});

test("the validate method narrows to the input type", () => {
  const value: unknown = "hi";
  if (Schema.string().validate(value)) {
    expectTypeOf(value).toEqualTypeOf<string>();
  }
  const transforming = Schema.string().transform((s) => s.length);
  if (transforming.validate(value)) {
    expectTypeOf(value).toEqualTypeOf<string>();
    expectTypeOf(value).not.toEqualTypeOf<number>();
  }
});

test("the validate method takes a params argument", () => {
  let calls = 0;
  const error = () => {
    calls++;
    return "bad";
  };
  expect(Schema.string().validate(12, { error })).toBe(false);
  expect(Schema.string().validate("ok", { error })).toBe(true);
  // a ctx defeats the compiled definite shortcut, so this is the fallback answering
  expect(Schema.compile(Schema.string()).validate(12, { error })).toBe(false);
  expect(Schema.string().validate("ok", { jitless: true })).toBe(true);
  // no issue is ever finalized, so an error map never runs
  expect(calls).toBe(0);
});

test("the validateAsync method handles async schemas the method form throws on", async () => {
  const schema = Schema.string().refine(async (s) => s.length > 2);
  expect(() => Schema.validate("asdf")).toThrow(Schema.core.$SchemaAsyncError);
  await expect(Schema.validateAsync("asdf")).resolves.toBe(true);
  await expect(Schema.validateAsync("a")).resolves.toBe(false);
  await expect(Schema.string().validateAsync(12)).resolves.toBe(false);
});

test("schema/mini has no validate method", () => {
  const schema = zm.string();
  expect("parse" in schema).toBe(true);
  expect("validate" in schema).toBe(false);
  expect("validateAsync" in schema).toBe(false);
});

// counts reads of each child slot, so a stopped walk is observable without putting a callback in the schema — a refinement spy would work too, but reading the input says nothing about what ran
function counted(
  slots: Record<string, unknown>,
  bad: Record<string, unknown> = {}
): [Record<string, unknown>, () => number] {
  let reads = 0;
  const obj: Record<string, unknown> = { ...bad };
  for (const [k, v] of Object.entries(slots)) {
    Object.defineProperty(obj, k, {
      enumerable: true,
      get() {
        reads++;
        return v;
      },
    });
  }
  return [obj, () => reads];
}

test("validate stops a container at its first aborting issue", () => {
  const shape = { a: Schema.number(), b: Schema.string(), c: Schema.string() };

  for (const jitless of [false, true]) {
    const label = jitless ? "interpreted" : "compiled";
    const [input, reads] = counted({ b: "x", c: "x" }, { a: "no" });
    expect(Schema.validate(Schema.object(shape), input, { jitless }), label).toBe(false);
    expect(reads(), `${label}: keys read after the first abort`).toBe(0);

    const [ok, okReads] = counted({ b: "x", c: "x" }, { a: 1 });
    expect(Schema.validate(Schema.object(shape), ok, { jitless }), label).toBe(true);
    expect(okReads(), `${label}: a valid parse still reads every key`).toBe(2);
  }

  // an array stops at the first bad element
  const arr: unknown[] = [1];
  let elementReads = 0;
  for (const i of [1, 2]) {
    Object.defineProperty(arr, i, {
      enumerable: true,
      get() {
        elementReads++;
        return "x";
      },
    });
  }
  expect(Schema.validate(Schema.array(Schema.string()), arr)).toBe(false);
  expect(elementReads, "elements read after the first abort").toBe(0);

  // the shape phase's abort carries across into the catchall
  const [co, coReads] = counted({ b: "x" }, { a: "no" });
  expect(Schema.validate(Schema.object({ a: Schema.number() }).catchall(Schema.string()), co)).toBe(false);
  expect(coReads(), "catchall keys read after the shape aborted").toBe(0);

  // and a tuple's fixed items carry into its rest
  const tup: unknown[] = ["no"];
  let restReads = 0;
  for (const i of [1, 2]) {
    Object.defineProperty(tup, i, {
      enumerable: true,
      get() {
        restReads++;
        return "x";
      },
    });
  }
  expect(Schema.validate(Schema.tuple([Schema.number()], Schema.string()), tup)).toBe(false);
  expect(restReads, "rest elements read after a fixed item aborted").toBe(0);
});

test("a default provider runs only when the key is absent", () => {
  const boom = (): never => {
    throw new RangeError("boom");
  };
  // the provider sits behind an accessor, so reading the def would call it
  for (const [name, schema] of [
    ["default", Schema.object({ a: Schema.number(), b: Schema.string().default(boom as any) })],
    ["prefault", Schema.object({ a: Schema.number(), b: Schema.string().prefault(boom as any) })],
  ] as const) {
    expect(Schema.validate(schema, { a: "bad", b: "ok" }), name).toBe(false);
    expect(Schema.validate(schema, { a: 1, b: "ok" }), name).toBe(true);
  }
  // absent, the provider does run, and its throw is the parse's own
  expect(() => Schema.validate(Schema.object({ b: Schema.string().default(boom as any) }), {})).toThrow(RangeError);
});

test("the first failure stops the walk whatever follows it", () => {
  // a sibling after the failure is never parsed, so its refinement never runs
  let calls = 0;
  const spy = Schema.string().refine(() => {
    calls++;
    return true;
  });
  expect(Schema.validate(Schema.object({ a: Schema.number(), b: spy, c: spy }), { a: "no", b: "x", c: "x" })).toBe(false);
  expect(calls).toBe(0);

  // reads of the trailing key say whether the walk stopped, without putting a callback in the schema
  const skips = (b: Schema.SchemaType, value: unknown = "x") => {
    let reads = 0;
    const input: Record<string, unknown> = { a: "no" };
    Object.defineProperty(input, "b", {
      enumerable: true,
      get() {
        reads++;
        return value;
      },
    });
    Schema.validate(Schema.object({ a: Schema.number(), b }), input);
    return reads === 0;
  };

  // the trailing key is skipped no matter what it holds -- user code included, since it is never reached
  for (const [name, b, value] of [
    ["plain", Schema.string(), "x"],
    ["min", Schema.string().min(2), "x"],
    ["email", Schema.email(), "x"],
    ["array", Schema.array(Schema.string().min(2)), ["ab"]],
    ["error map", Schema.string({ error: () => "nope" }), "x"],
    ["transform", Schema.string().transform((v) => v), "x"],
    ["refine", Schema.string().refine(() => true), "x"],
    ["custom", Schema.custom(() => true), "x"],
    ["catch", Schema.string().catch("x"), "x"],
    ["lazy", Schema.lazy(() => Schema.string()), "x"],
    ["coerce", Schema.coerce.number(), 1],
  ] as [string, Schema.SchemaType, unknown][]) {
    expect(skips(b, value), name).toBe(true);
  }
});

test("a continuable issue never stops the walk", () => {
  // .min() is continuable, so a surrounding schema can still reconcile it and the guard must not stop
  let calls = 0;
  const el = z
    .string()
    .min(5)
    .refine(() => {
      calls++;
      return true;
    });
  expect(Schema.validate(Schema.array(el), ["a", "b", "c"])).toBe(false);
  expect(calls).toBe(3);
});

test("Schema.record keeps walking under validate", () => {
  // deliberate asymmetry: a record's invalid_key aborts, but an enclosing intersection reconciles it against the sibling operand, so a stopped loop hides keys the sibling does not own
  let reads = 0;
  const input: Record<string, unknown> = { a: 1 };
  for (const k of ["b", "c"]) {
    Object.defineProperty(input, k, {
      enumerable: true,
      get() {
        reads++;
        return "x";
      },
    });
  }
  expect(Schema.validate(Schema.record(Schema.string(), Schema.string()), input)).toBe(false);
  expect(reads).toBe(2);
});

test("validate matches safeParse where an issue can still be reconciled away", async () => {
  const recA = Schema.record(Schema.string().regex(/^a/), Schema.any());
  const recB = Schema.record(Schema.string().regex(/^b/), Schema.any());
  const schemas: Schema.SchemaType[] = [
    Schema.intersection(recA, recB),
    Schema.intersection(recA.pipe(Schema.any()), recB.pipe(Schema.any())),
    Schema.intersection(Schema.strictObject({ a: Schema.string() }), Schema.strictObject({ b: Schema.number() })),
    Schema.intersection(Schema.array(Schema.string()), Schema.array(Schema.string().min(2))),
    Schema.strictObject({ a: Schema.string() }).pipe(Schema.any()),
    Schema.union([Schema.strictObject({ a: Schema.string() }), Schema.strictObject({ a: Schema.string(), b: Schema.number() })]),
    Schema.array(Schema.string()).catch([]),
    Schema.object({ a: Schema.string() }).optional(),
  ];
  const inputs: unknown[] = [
    { a1: 1, b1: 2 },
    { a1: 1, b1: 2, zz: 3 },
    { a1: 1, zz: 2, b1: 3, yy: 4 },
    { b1: 1, a1: 2, zz: 3, yy: 4 },
    { a: "x", b: 1 },
    { a: "x", b: 1, c: 9 },
    { a: "x" },
    ["ab", "cd"],
    ["a", "b"],
    undefined,
  ];

  const outcome = (fn: () => unknown) => {
    try {
      return `ok:${fn()}`;
    } catch (err) {
      return `throw:${(err as Error)?.constructor?.name}`;
    }
  };
  const outcomeAsync = async (fn: () => Promise<unknown>) => {
    try {
      return `ok:${await fn()}`;
    } catch (err) {
      return `throw:${(err as Error)?.constructor?.name}`;
    }
  };

  for (const schema of schemas) {
    for (const input of inputs) {
      const label = `${Schema._schema.def.type} on ${JSON.stringify(input)}`;
      expect(
        outcome(() => Schema.validate(schema, input)),
        label
      ).toBe(outcome(() => Schema.safeParse(input).success));
      expect(await outcomeAsync(() => Schema.validateAsync(schema, input)), label).toBe(
        await outcomeAsync(async () => (await Schema.safeParseAsync(input)).success)
      );
    }
  }
});

test("abortEarly does not leak into safeParse", () => {
  const schema = Schema.object({ a: Schema.string(), b: Schema.string(), c: Schema.string() });
  expect(Schema.safeParse({ a: 1, b: 2, c: 3 }).error!.issues).toHaveLength(3);
  expect(Schema.validate(schema, { a: 1, b: 2, c: 3 })).toBe(false);
  expect(Schema.safeParse({ a: 1, b: 2, c: 3 }).error!.issues).toHaveLength(3);
});

test("a callback after the first failure never runs, so validate answers where safeParse throws", () => {
  const boom = (): never => {
    throw new RangeError("boom");
  };
  // the deliberate divergence, in every shape that can carry a callback: an earlier sibling settles the boolean, so the later throw is never reached
  const lateSym = Symbol("late");
  const cases: [string, Schema.SchemaType, unknown][] = [
    ["object transform", Schema.object({ a: Schema.number(), b: Schema.string().transform(boom) }), { a: "bad", b: "ok" }],
    ["object refine", Schema.object({ a: Schema.number(), b: Schema.string().refine(boom) }), { a: "bad", b: "ok" }],
    ["object custom", Schema.object({ a: Schema.number(), b: Schema.custom(boom) }), { a: "bad", b: "ok" }],
    // these three hang the callback off `_schema.check` rather than the def
    ["object check", Schema.object({ a: Schema.number(), b: Schema.string().check(boom) }), { a: "bad", b: "ok" }],
    ["object superRefine", Schema.object({ a: Schema.number(), b: Schema.string().superRefine(boom) }), { a: "bad", b: "ok" }],
    ["object overwrite", Schema.object({ a: Schema.number(), b: Schema.string().overwrite(boom as any) }), { a: "bad", b: "ok" }],
    // the input must carry the same symbol with a value the field accepts, or the transform never runs and the row asserts nothing
    [
      "symbol key",
      Schema.object({ a: Schema.number(), [lateSym]: Schema.string().transform(boom) } as any),
      { a: "bad", [lateSym]: "ok" },
    ],
    ["object catch", Schema.object({ a: Schema.number(), b: Schema.string().catch(boom) }), { a: "bad", b: 1 }],
    ["object lazy", Schema.object({ a: Schema.number(), b: Schema.lazy(() => Schema.string().transform(boom)) }), { a: "bad", b: "ok" }],
    ["array", Schema.array(Schema.union([Schema.number(), Schema.string().transform(boom)])), [true, "throws"]],
    ["tuple rest", Schema.tuple([Schema.number()], Schema.string().transform(boom)), ["bad", "throws"]],
    ["catchall", Schema.object({ a: Schema.number() }).catchall(Schema.string().transform(boom)), { a: "bad", b: "ok" }],
    ["set", Schema.set(Schema.union([Schema.number(), Schema.string().transform(boom)])), new Set([true, "throws"])],
    [
      "map",
      Schema.map(Schema.string(), Schema.union([Schema.number(), Schema.string().transform(boom)])),
      new Map<any, any>([
        [1, 0],
        ["k", "throws"],
      ]),
    ],
  ];

  const outcome = (fn: () => unknown) => {
    try {
      return `ok:${fn()}`;
    } catch (err) {
      return `throw:${(err as Error)?.constructor?.name}`;
    }
  };

  for (const [name, schema, input] of cases) {
    // safeParse walks the whole tree and reaches the throw; validate settled the answer at the earlier sibling and never runs it
    expect(
      outcome(() => Schema.safeParse(input).success),
      `${name}: safeParse`
    ).toBe("throw:RangeError");
    expect(
      outcome(() => Schema.validate(schema, input)),
      `${name}: validate`
    ).toBe("ok:false");
  }
});

test("the stop lands between children, not inside one", () => {
  const boom = (): never => {
    throw new RangeError("boom");
  };
  // both parse as a unit, so an abort in one half cannot skip the other; stopping inside either risks a discarded issue turning a false into a true
  const pairs: [string, Schema.SchemaType, unknown][] = [
    ["map entry", Schema.map(Schema.number(), Schema.string().transform(boom)), new Map([["bad", "ok"]])],
    ["tuple fixed item", Schema.tuple([Schema.number(), Schema.string().transform(boom)]), ["bad", "ok"]],
  ];
  for (const [name, schema, input] of pairs) {
    expect(() => Schema.validate(schema, input), name).toThrow(RangeError);
    expect(() => Schema.safeParse(input), `${name}: safeParse agrees`).toThrow(RangeError);
  }

  // between children, the stop does happen
  expect(Schema.validate(Schema.object({ a: Schema.number(), b: Schema.string().transform(boom) }), { a: "bad", b: "ok" })).toBe(false);
  expect(Schema.validate(Schema.array(Schema.union([Schema.number(), Schema.string().transform(boom)])), [true, "ok"])).toBe(false);
});

test("validate rethrows a callback it actually reaches", () => {
  const boom = (): never => {
    throw new RangeError("boom");
  };
  // nothing rejects before the callback, so validate reaches it and the throw is the caller's
  const cases: [string, Schema.SchemaType, unknown][] = [
    ["transform", Schema.object({ a: Schema.string().transform(boom), b: Schema.number() }), { a: "ok", b: "bad" }],
    ["refine", Schema.object({ a: Schema.string().refine(boom), b: Schema.number() }), { a: "ok", b: "bad" }],
    ["check", Schema.object({ a: Schema.string().check(boom), b: Schema.number() }), { a: "ok", b: "bad" }],
    ["array element", Schema.array(Schema.string().transform(boom)), ["ok", "ok"]],
    ["catchall", Schema.object({}).catchall(Schema.string().transform(boom)), { a: "ok" }],
    ["set", Schema.set(Schema.string().transform(boom)), new Set(["ok"])],
    ["map", Schema.map(Schema.string(), Schema.string().transform(boom)), new Map([["k", "ok"]])],
    ["tuple rest", Schema.tuple([Schema.string()], Schema.string().transform(boom)), ["ok", "ok"]],
  ];
  for (const [name, schema, input] of cases) {
    expect(() => Schema.validate(schema, input), name).toThrow(RangeError);
  }
});
