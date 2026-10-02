import { afterEach, expect, test } from "vitest";
import * as Schema from "schema/v4";

afterEach(() => {
  Schema.config({ customError: undefined });
});

/** Error maps run on the first read of `error`, so a test that only observes them reads it. */
const fail = (r: { error?: unknown }) => r.error;

/** Collects the owning schema's registered metadata for every issue an error map sees. */
function captureMeta(): { seen: (Schema.core.GlobalMeta | undefined)[] } {
  const seen: (Schema.core.GlobalMeta | undefined)[] = [];
  Schema.config({
    customError: (issue) => {
      seen.push(issue.schema && Schema.globalRegistry.get(issue.schema));
      return undefined;
    },
  });
  return { seen };
}

test("check-originated issues expose the owning schema", () => {
  const { seen } = captureMeta();

  fail(Schema.object({ name: Schema.string().min(5).meta({ title: "Name" }) }).safeParse({ name: "ab" }));
  fail(Schema.string().max(2).meta({ title: "Max" }).safeParse("abc"));
  fail(Schema.email().meta({ title: "Email" }).safeParse("nope"));
  fail(Schema.number().multipleOf(3).meta({ title: "Multiple" }).safeParse(4));
  fail(Schema.array(Schema.string()).min(2).meta({ title: "Array" }).safeParse([]));

  expect(seen).toEqual([
    { title: "Name" },
    { title: "Max" },
    { title: "Email" },
    { title: "Multiple" },
    { title: "Array" },
  ]);
});

test("schema-originated issues expose the owning schema", () => {
  const { seen } = captureMeta();

  fail(Schema.object({ name: Schema.string().min(5).meta({ title: "Name" }) }).safeParse({ name: 123 }));
  fail(Schema.email().meta({ title: "Email" }).safeParse(123));

  expect(seen).toEqual([{ title: "Name" }, { title: "Email" }]);
});

test("refinements attribute to the refined schema, not the internal check schema", () => {
  const { seen } = captureMeta();

  fail(
    z
      .string()
      .refine(() => false)
      .meta({ title: "Refine" })
      .safeParse("abc")
  );
  fail(
    z
      .string()
      .superRefine((_, ctx) => ctx.addIssue({ code: "custom", message: "" }))
      .meta({ title: "SuperRefine" })
      .safeParse("abc")
  );

  expect(seen).toEqual([{ title: "Refine" }, { title: "SuperRefine" }]);
});

test("the innermost schema owns the issue", () => {
  const { seen } = captureMeta();

  fail(
    z
      .array(Schema.string().min(5).meta({ title: "Element" }))
      .meta({ title: "Array" })
      .safeParse(["ab"])
  );
  fail(
    z
      .string()
      .pipe(Schema.string().min(5).meta({ title: "Target" }))
      .meta({ title: "Pipe" })
      .safeParse("ab")
  );
  fail(
    z
      .looseObject({})
      .check(Schema.property("a", Schema.string().meta({ title: "Property" })))
      .meta({ title: "Object" })
      .safeParse({ a: 1 })
  );

  expect(seen).toEqual([{ title: "Element" }, { title: "Target" }, { title: "Property" }]);
});

test("issues carrying no usable `inst` still get the owning schema", () => {
  const { seen } = captureMeta();

  // A hand-pushed issue may carry no inst at all, and ctx.addIssue(string) puts the check's def — not a Schema object — on inst.
  fail(
    z
      .string()
      .check((payload) => {
        payload.issues.push({ code: "custom", input: payload.value });
      })
      .meta({ title: "Bare" })
      .safeParse("abc")
  );
  const shorthand = z
    .string()
    .superRefine((_, ctx) => ctx.addIssue("bad stuff"))
    .meta({ title: "Shorthand" })
    .safeParse("abc");

  expect(seen).toEqual([{ title: "Bare" }]);
  expect(shorthand.error!.issues[0].message).toEqual("bad stuff");
});

test("async checks expose the owning schema", async () => {
  const { seen } = captureMeta();

  fail(
    await z
      .string()
      .refine(async () => false)
      .meta({ title: "Async" })
      .safeParseAsync("abc")
  );

  expect(seen).toEqual([{ title: "Async" }]);
});

test("the owning schema is the clone `.meta()` registered, not the pre-metadata schema", () => {
  const bare = Schema.string().min(5);
  const labeled = bare.meta({ title: "Labeled" });
  const seen: unknown[] = [];
  Schema.config({
    customError: (issue) => {
      seen.push(issue.schema === labeled);
      return undefined;
    },
  });

  fail(labeled.safeParse("ab"));

  expect(seen).toEqual([true]);
});

test("`inst` keeps its meaning and `schema` stays off the finalized issue", () => {
  const insts: string[] = [];
  Schema.config({
    customError: (issue) => {
      insts.push(issue.inst!.constructor.name);
      return undefined;
    },
  });

  const tooSmall = Schema.string().min(5).safeParse("ab").error!;
  const wrongType = Schema.string().safeParse(123).error!;

  expect(insts).toEqual(["$SchemaCheckMinLength", "SchemaString"]);
  expect(Object.keys(tooSmall.issues[0])).not.toContain("schema");
  expect(Object.keys(wrongType.issues[0])).not.toContain("schema");
});

test("every error map kind receives the owning schema", () => {
  const seen: Record<string, Schema.core.GlobalMeta | undefined> = {};
  const capture = (key: string) => (issue: { schema?: Schema.core.$SchemaType | undefined }) => {
    seen[key] = issue.schema && Schema.globalRegistry.get(issue.schema);
    return undefined;
  };

  fail(
    z
      .string()
      .min(5, { error: capture("check") })
      .meta({ title: "Check" })
      .safeParse("ab")
  );

  // A schema-bound map is only consulted for issues the schema itself raised, so this one needs a type error.
  fail(
    z
      .string({ error: capture("schema") })
      .meta({ title: "Schema" })
      .safeParse(123)
  );

  fail(
    z
      .string()
      .min(5)
      .meta({ title: "Parse" })
      .safeParse("ab", { error: capture("parse") })
  );

  Schema.config({ customError: capture("customError") });
  fail(Schema.string().min(5).meta({ title: "Custom" }).safeParse("ab"));

  // localeError carries the default English locale, so it is restored rather than cleared.
  const localeError = Schema.config().localeError;
  Schema.config({ customError: undefined, localeError: capture("localeError") });
  fail(Schema.string().min(5).meta({ title: "Locale" }).safeParse("ab"));
  Schema.config({ localeError });

  expect(seen).toEqual({
    check: { title: "Check" },
    schema: { title: "Schema" },
    parse: { title: "Parse" },
    customError: { title: "Custom" },
    localeError: { title: "Locale" },
  });
});
