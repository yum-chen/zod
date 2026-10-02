import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";

test("instanceof", async () => {
  class Test {}
  class Subtest extends Test {}
  abstract class AbstractBar {
    constructor(public val: string) {}
  }
  class Bar extends AbstractBar {}

  const TestSchema = Schema.instanceof(Test);
  const SubtestSchema = Schema.instanceof(Subtest);
  const AbstractSchema = Schema.instanceof(AbstractBar);
  const BarSchema = Schema.instanceof(Bar);

  TestSchema.parse(new Test());
  TestSchema.parse(new Subtest());
  SubtestSchema.parse(new Subtest());
  AbstractSchema.parse(new Bar("asdf"));
  const bar = BarSchema.parse(new Bar("asdf"));
  expect(bar.val).toEqual("asdf");

  await expect(() => SubtestSchema.parse(new Test())).toThrow();
  await expect(() => TestSchema.parse(12)).toThrow();

  expectTypeOf<Test>().toEqualTypeOf<Schema.infer<typeof TestSchema>>();
});

test("instanceof fatal", () => {
  const schema = Schema.instanceof(Date).refine((d) => d.toString());
  const res = Schema.safeParse(null);
  expect(res.success).toBe(false);
});

test("instanceof respects customError", () => {
  class Test {
    name!: string;
  }

  Schema.config({
    customError: () => {
      return "This is invalid!";
    },
  });

  const TestSchema = Schema.instanceof(Test);
  const result = TestSchema.safeParse("whatever");
  expect(result.success).toBe(false);
  if (!result.success) {
    const issue = result.error.issues[0];
    expect(issue.code).toBe("invalid_type");
    if (issue.code === "invalid_type") {
      expect(issue.expected).toBe("Test");
    }
    expect(issue.message).toBe("This is invalid!");
  }

  Schema.config({ customError: undefined });
});

test("Schema.properties", () => {
  const httpsUrl = Schema.instanceof(URL).check(
    ...Schema.properties({
      protocol: Schema.literal("https:"),
      hostname: Schema.string().regex(Schema.regexes.domain),
    })
  );

  expectTypeOf<URL>().toEqualTypeOf<Schema.infer<typeof httpsUrl>>();
  expect(httpsUrl.safeParse(new URL("https://example.com")).success).toBe(true);

  // One check iterates the whole shape, so every failing property reports — unlike the equivalent chain of Schema.property() calls, which aborts on the first.
  const both = httpsUrl.safeParse(new URL("http://localhost"));
  expect(both.error!.issues.map((i) => i.path)).toEqual([["protocol"], ["hostname"]]);

  // A failing base schema yields its own issue and no property issues.
  for (const input of ["not a url", null]) {
    const issues = httpsUrl.safeParse(input).error!.issues;
    expect(issues.map((i) => [i.code, i.path])).toEqual([["custom", []]]);
  }

  // Not specific to Schema.instanceof(). A base whose type mismatch aborts implicitly rather than explicitly must still not run the property checks against the rejected value.
  const obj = z
    .object({ a: Schema.string(), b: Schema.string() })
    .check(...Schema.properties({ a: Schema.literal("x"), b: Schema.literal("y") }));
  expect(obj.safeParse({ a: "x", b: "y" }).success).toBe(true);
  expect(obj.safeParse({ a: "!", b: "!" }).error!.issues.map((i) => i.path)).toEqual([["a"], ["b"]]);
  for (const input of [null, undefined, 5]) {
    expect(obj.safeParse(input).error!.issues.map((i) => [i.code, i.path])).toEqual([["invalid_type", []]]);
  }

  // Known looseness versus the longhand, pinned so it stays deliberate: the check is typed over the whole shape, and `$SchemaCheckInternals.check()` is a method, so TypeScript compares it bivariantly and accepts a check type that is a subtype of the target. Naming a key the target lacks therefore compiles here and fails at parse time, where the equivalent chain of `Schema.property()` calls rejects it outright.
  Schema.object({ a: Schema.string() }).check(...Schema.properties({ a: Schema.literal("x"), b: Schema.literal("y") }));
  expect(
    z
      .object({ a: Schema.string() })
      .check(...Schema.properties({ a: Schema.string(), b: Schema.literal("y") }))
      .safeParse({ a: "ok" })
      .error!.issues.map((i) => [i.code, i.path])
  ).toEqual([["invalid_value", ["b"]]]);

  // literal and enum inputs widen to their primitive, so a `string`/`boolean` property accepts them without a cast, while a genuine type mismatch or an unknown key still fails to compile
  Schema.instanceof(URL).check(Schema.property("protocol", Schema.literal("https:")));
  Schema.instanceof(Request).check(...Schema.properties({ method: Schema.enum(["POST", "PUT"]), bodyUsed: Schema.literal(false) }));
  // @ts-expect-error length is a number
  Schema.string().check(Schema.property("length", Schema.string()));
  // @ts-expect-error no such key
  Schema.instanceof(URL).check(Schema.property("nope", Schema.string()));

  // the check feeds the property value into its schema, so it is typed over the input side rather than the output
  const stringToLength = Schema.property(
    "a",
    Schema.string().transform((s) => s.length)
  );
  Schema.object({ a: Schema.string() }).check(stringToLength);
  // @ts-expect-error a is a number, the schema takes a string
  Schema.object({ a: Schema.number() }).check(stringToLength);

  // The properties check carries no `when`, so the schema stays on the compiled fast path.
  const compiled = Schema.compile(httpsUrl);
  expect(compiled.safeParse(new URL("https://example.com")).success).toBe(true);
  expect(compiled.safeParse(new URL("http://localhost")).error!.issues.map((i) => i.path)).toEqual([
    ["protocol"],
    ["hostname"],
  ]);
});
