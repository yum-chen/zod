import { expect, test } from "vitest";
import * as Schema from "schema/v4";
import { parsedType } from "../../util.js";

test("parsedType", () => {
  expect(parsedType("string")).toBe("string");
  expect(parsedType(1)).toBe("number");
  expect(parsedType(true)).toBe("boolean");
  expect(parsedType(null)).toBe("null");
  expect(parsedType(undefined)).toBe("undefined");
  expect(parsedType([])).toBe("array");
  expect(parsedType({})).toBe("object");
  expect(parsedType(new Date())).toBe("Date");
  expect(parsedType(new Map())).toBe("Map");
  expect(parsedType(new Set())).toBe("Set");
  expect(parsedType(new Error())).toBe("Error");

  const nullPrototype = Object.create(null);
  expect(parsedType(nullPrototype)).toBe("object");

  const doubleNullPrototype = Object.create(Object.create(null));
  expect(parsedType(doubleNullPrototype)).toBe("object");

  expect(parsedType(Number.NaN)).toBe("nan");
});

test("locales - tr", () => {
  Schema.config(Schema.locales.tr());

  const invalidType = Schema.number().safeParse("a");
  expect(invalidType.error!.issues[0].code).toBe("invalid_type");
  expect(invalidType.error!.issues[0].message).toBe("Geçersiz değer: beklenen number, alınan string");

  const invalidType2 = Schema.string().safeParse(1);
  expect(invalidType2.error!.issues[0].code).toBe("invalid_type");
  expect(invalidType2.error!.issues[0].message).toBe("Geçersiz değer: beklenen string, alınan number");

  const invalidValue = Schema.enum(["a", "b"]).safeParse(1);
  expect(invalidValue.error!.issues[0].code).toBe("invalid_value");
  expect(invalidValue.error!.issues[0].message).toBe('Geçersiz seçenek: aşağıdakilerden biri olmalı: "a"|"b"');

  const tooBig = Schema.number().max(10).safeParse(15);
  expect(tooBig.error!.issues[0].code).toBe("too_big");
  expect(tooBig.error!.issues[0].message).toBe("Çok büyük: beklenen number <=10");

  const tooSmall = Schema.number().min(10).safeParse(5);
  expect(tooSmall.error!.issues[0].code).toBe("too_small");
  expect(tooSmall.error!.issues[0].message).toBe("Çok küçük: beklenen number >=10");

  const invalidFormatRegex = Schema.string().regex(/abcd/).safeParse("invalid-string");
  expect(invalidFormatRegex.error!.issues[0].code).toBe("invalid_format");
  expect(invalidFormatRegex.error!.issues[0].message).toBe("Geçersiz metin: /abcd/ desenine uymalı");

  const invalidFormatStartsWith = Schema.string().startsWith("abcd").safeParse("invalid-string");
  expect(invalidFormatStartsWith.error!.issues[0].code).toBe("invalid_format");
  expect(invalidFormatStartsWith.error!.issues[0].message).toBe('Geçersiz metin: "abcd" ile başlamalı');

  const notMultipleOf = Schema.number().multipleOf(3).safeParse(10);
  expect(notMultipleOf.error!.issues[0].code).toBe("not_multiple_of");
  expect(notMultipleOf.error!.issues[0].message).toBe("Geçersiz sayı: 3 ile tam bölünebilmeli");

  const unrecognizedKeys = Schema.object({ a: Schema.string(), b: Schema.number() }).strict().safeParse({ a: "a", b: 1, c: 2 });
  expect(unrecognizedKeys.error!.issues[0].code).toBe("unrecognized_keys");
  expect(unrecognizedKeys.error!.issues[0].message).toBe('Tanınmayan anahtar: "c"');

  const invalidUnion = Schema.union([Schema.string(), Schema.number()]).safeParse(true);
  expect(invalidUnion.error!.issues[0].code).toBe("invalid_union");
  expect(invalidUnion.error!.issues[0].message).toBe("Geçersiz değer");
});
