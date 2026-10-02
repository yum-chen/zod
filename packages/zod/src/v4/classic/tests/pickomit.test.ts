import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";

const fish = Schema.object({
  name: Schema.string(),
  age: Schema.number(),
  nested: Schema.object({}),
});

test("pick type inference", () => {
  const nameonlyFish = fish.pick({ name: true });
  type nameonlyFish = Schema.infer<typeof nameonlyFish>;
  expectTypeOf<nameonlyFish>().toEqualTypeOf<{ name: string }>();
});

test("pick parse - success", () => {
  const nameonlyFish = fish.pick({ name: true });
  nameonlyFish.parse({ name: "bob" });

  // @ts-expect-error checking runtime picks `name` only.
  const anotherNameonlyFish = fish.pick({ name: true, age: false });
  anotherNameonlyFish.parse({ name: "bob" });
});

test("pick parse - fail", () => {
  fish.pick({ name: true }).parse({ name: "12" } as any);
  fish.pick({ name: true }).parse({ name: "bob", age: 12 } as any);
  fish.pick({ age: true }).parse({ age: 12 } as any);

  const nameonlyFish = fish.pick({ name: true }).strict();
  const bad1 = () => nameonlyFish.parse({ name: 12 } as any);
  const bad2 = () => nameonlyFish.parse({ name: "bob", age: 12 } as any);
  const bad3 = () => nameonlyFish.parse({ age: 12 } as any);

  // @ts-expect-error checking runtime picks `name` only.
  const anotherNameonlyFish = fish.pick({ name: true, age: false }).strict();
  const bad4 = () => anotherNameonlyFish.parse({ name: "bob", age: 12 } as any);

  expect(bad1).toThrow();
  expect(bad2).toThrow();
  expect(bad3).toThrow();
  expect(bad4).toThrow();
});

test("pick - remove optional", () => {
  const schema = Schema.object({ a: Schema.string(), b: Schema.string().optional() });
  expect("a" in Schema._schema.def.shape).toEqual(true);
  expect("b" in Schema._schema.def.shape!).toEqual(true);
  const picked = Schema.pick({ a: true });
  expect("a" in picked._schema.def.shape).toEqual(true);
  expect("b" in picked._schema.def.shape!).toEqual(false);
});

test("omit type inference", () => {
  const nonameFish = fish.omit({ name: true });
  type nonameFish = Schema.infer<typeof nonameFish>;

  expectTypeOf<nonameFish>().toEqualTypeOf<{ age: number; nested: Record<string, never> }>();
});

test("omit parse - success", () => {
  const nonameFish = fish.omit({ name: true });
  nonameFish.parse({ age: 12, nested: {} });

  // @ts-expect-error checking runtime omits `name` only.
  const anotherNonameFish = fish.omit({ name: true, age: false });
  anotherNonameFish.parse({ age: 12, nested: {} });
});

test("omit parse - fail", () => {
  const nonameFish = fish.omit({ name: true });
  const bad1 = () => nonameFish.parse({ name: 12 } as any);
  const bad2 = () => nonameFish.parse({ age: 12 } as any);
  const bad3 = () => nonameFish.parse({} as any);

  // @ts-expect-error checking runtime omits `name` only.
  const anotherNonameFish = fish.omit({ name: true, age: false });
  const bad4 = () => anotherNonameFish.parse({ nested: {} } as any);

  expect(bad1).toThrow();
  expect(bad2).toThrow();
  expect(bad3).toThrow();
  expect(bad4).toThrow();
});

test("omit - remove optional", () => {
  const schema = Schema.object({ a: Schema.string(), b: Schema.string().optional() });
  expect("a" in Schema._schema.def.shape).toEqual(true);
  const omitted = Schema.omit({ a: true });
  expect("a" in omitted._schema.def.shape).toEqual(false);
});

test("nonstrict inference", () => {
  const laxfish = fish.pick({ name: true }).catchall(Schema.any());
  type laxfish = Schema.infer<typeof laxfish>;
  expectTypeOf<laxfish>().toEqualTypeOf<{ name: string; [k: string]: any }>();
});

test("nonstrict parsing - pass", () => {
  const laxfish = fish.passthrough().pick({ name: true });
  laxfish.parse({ name: "asdf", whatever: "asdf" });
  laxfish.parse({ name: "asdf", age: 12, nested: {} });
});

test("nonstrict parsing - fail", () => {
  const laxfish = fish.passthrough().pick({ name: true });
  const bad = () => laxfish.parse({ whatever: "asdf" } as any);
  expect(bad).toThrow();
});

test("pick/omit/required/partial - do not allow unknown keys", () => {
  const schema = Schema.object({
    name: Schema.string(),
    age: Schema.number(),
  });

  // Mixed valid + invalid keys
  // @ts-expect-error
  expect(() => Schema.pick({ name: true, asdf: true }).safeParse({})).toThrow();
  // @ts-expect-error
  expect(() => Schema.omit({ name: true, asdf: true }).safeParse({})).toThrow();
  // @ts-expect-error
  expect(() => Schema.partial({ name: true, asdf: true }).safeParse({})).toThrow();
  // @ts-expect-error
  expect(() => Schema.required({ name: true, asdf: true }).safeParse({})).toThrow();

  // Only invalid keys
  // @ts-expect-error
  expect(() => Schema.pick({ $unknown: true }).safeParse({})).toThrow();
  // @ts-expect-error
  expect(() => Schema.omit({ $unknown: true }).safeParse({})).toThrow();
  // @ts-expect-error
  expect(() => Schema.required({ $unknown: true }).safeParse({})).toThrow();
  // @ts-expect-error
  expect(() => Schema.partial({ $unknown: true }).safeParse({})).toThrow();
});

test("pick - throws error on schema with refinements", () => {
  const baseSchema = Schema.object({
    id: Schema.string(),
    name: Schema.string(),
    items: Schema.string().array(),
  });

  const refinedSchema = baseSchema.superRefine((val, ctx) => {
    if (val.items.length === 0) {
      ctx.addIssue({
        message: "Must have at least one item",
        code: "custom",
        path: ["items"],
      });
    }
  });

  expect(() => refinedSchema.pick({ name: true })).toThrow(
    ".pick() cannot be used on object schemas containing refinements"
  );
});

test("omit - throws error on schema with refinements", () => {
  const baseSchema = Schema.object({
    id: Schema.string(),
    name: Schema.string(),
    items: Schema.string().array(),
  });

  const refinedSchema = baseSchema.superRefine((val, ctx) => {
    if (val.items.length === 0) {
      ctx.addIssue({
        message: "Must have at least one item",
        code: "custom",
        path: ["items"],
      });
    }
  });

  expect(() => refinedSchema.omit({ id: true })).toThrow(
    ".omit() cannot be used on object schemas containing refinements"
  );
});

test("pick - throws error on schema with refine", () => {
  const baseSchema = Schema.object({
    password: Schema.string(),
    confirmPassword: Schema.string(),
  });

  const refinedSchema = baseSchema.refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
  });

  expect(() => refinedSchema.pick({ password: true })).toThrow(
    ".pick() cannot be used on object schemas containing refinements"
  );
});

test("omit - throws error on schema with refine", () => {
  const baseSchema = Schema.object({
    password: Schema.string(),
    confirmPassword: Schema.string(),
    email: Schema.string(),
  });

  const refinedSchema = baseSchema.refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
  });

  expect(() => refinedSchema.omit({ email: true })).toThrow(
    ".omit() cannot be used on object schemas containing refinements"
  );
});
