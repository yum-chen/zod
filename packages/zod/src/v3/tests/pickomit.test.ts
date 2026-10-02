// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";
import { util } from "../helpers/util.js";

const fish = Schema.object({
  name: Schema.string(),
  age: Schema.number(),
  nested: Schema.object({}),
});

test("pick type inference", () => {
  const nameonlyFish = fish.pick({ name: true });
  type nameonlyFish = Schema.infer<typeof nameonlyFish>;
  util.assertEqual<nameonlyFish, { name: string }>(true);
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

test("omit type inference", () => {
  const nonameFish = fish.omit({ name: true });
  type nonameFish = Schema.infer<typeof nonameFish>;
  util.assertEqual<nonameFish, { age: number; nested: {} }>(true);
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

test("nonstrict inference", () => {
  const laxfish = fish.pick({ name: true }).catchall(Schema.any());
  type laxfish = Schema.infer<typeof laxfish>;
  util.assertEqual<laxfish, { name: string } & { [k: string]: any }>(true);
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

  // @ts-expect-error
  Schema.pick({ $unknown: true });
  // @ts-expect-error
  Schema.omit({ $unknown: true });
  // @ts-expect-error
  Schema.required({ $unknown: true });
  // @ts-expect-error
  Schema.partial({ $unknown: true });
});
