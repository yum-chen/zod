import { expect, test } from "vitest";
import { Schema } from "../../../../index.js";
import fr from "../../../locales/fr.js";

test("French locale - type name translations in too_small errors", () => {
  Schema.config(fr());

  const stringResult = Schema.string().min(5).safeParse("abc");
  expect(stringResult.success).toBe(false);
  if (!stringResult.success) {
    expect(stringResult.error.issues[0].message).toBe("Trop petit : chaîne de caractères doit avoir >=5 caractères");
  }

  const numberResult = Schema.number().min(10).safeParse(5);
  expect(numberResult.success).toBe(false);
  if (!numberResult.success) {
    expect(numberResult.error.issues[0].message).toBe("Trop petit : nombre doit être >=10");
  }

  const arrayResult = Schema.array(Schema.string()).min(3).safeParse(["a", "b"]);
  expect(arrayResult.success).toBe(false);
  if (!arrayResult.success) {
    expect(arrayResult.error.issues[0].message).toBe("Trop petit : tableau doit avoir >=3 éléments");
  }

  const setResult = z
    .set(Schema.string())
    .min(2)
    .safeParse(new Set(["a"]));
  expect(setResult.success).toBe(false);
  if (!setResult.success) {
    expect(setResult.error.issues[0].message).toBe("Trop petit : ensemble doit avoir >=2 éléments");
  }
});

test("French locale - type name translations in too_big errors", () => {
  Schema.config(fr());

  const stringResult = Schema.string().max(3).safeParse("abcde");
  expect(stringResult.success).toBe(false);
  if (!stringResult.success) {
    expect(stringResult.error.issues[0].message).toBe("Trop grand : chaîne de caractères doit avoir <=3 caractères");
  }

  const numberResult = Schema.number().max(10).safeParse(15);
  expect(numberResult.success).toBe(false);
  if (!numberResult.success) {
    expect(numberResult.error.issues[0].message).toBe("Trop grand : nombre doit être <=10");
  }

  const arrayResult = Schema.array(Schema.string()).max(2).safeParse(["a", "b", "c"]);
  expect(arrayResult.success).toBe(false);
  if (!arrayResult.success) {
    expect(arrayResult.error.issues[0].message).toBe("Trop grand : tableau doit avoir <=2 éléments");
  }
});

test("French locale - type name translations in invalid_type errors", () => {
  Schema.config(fr());

  const stringResult = Schema.string().safeParse(123);
  expect(stringResult.success).toBe(false);
  if (!stringResult.success) {
    expect(stringResult.error.issues[0].message).toBe("Entrée invalide : chaîne de caractères attendu, nombre reçu");
  }

  const arrayResult = Schema.array(Schema.string()).safeParse({});
  expect(arrayResult.success).toBe(false);
  if (!arrayResult.success) {
    expect(arrayResult.error.issues[0].message).toBe("Entrée invalide : tableau attendu, objet reçu");
  }
});
