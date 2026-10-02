// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";

test("object augmentation", () => {
  const Animal = z
    .object({
      species: Schema.string(),
    })
    .augment({
      population: Schema.number(),
    });
  // overwrites `species`
  const ModifiedAnimal = Animal.augment({
    species: Schema.array(Schema.string()),
  });
  ModifiedAnimal.parse({
    species: ["asd"],
    population: 1324,
  });

  const bad = () =>
    ModifiedAnimal.parse({
      species: "asdf",
      population: 1324,
    } as any);
  expect(bad).toThrow();
});
