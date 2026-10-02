import { expect, test } from "vitest";
import * as Schema from "schema/v4";

test("locales - uz", () => {
  Schema.config(Schema.locales.uz());

  const invalidType = Schema.number().safeParse("a");
  expect(invalidType.error!.issues[0].code).toBe("invalid_type");
  expect(invalidType.error!.issues[0].message).toBe("Noto‘g‘ri kirish: kutilgan raqam, qabul qilingan string");

  const invalidType2 = Schema.string().safeParse(1);
  expect(invalidType2.error!.issues[0].code).toBe("invalid_type");
  expect(invalidType2.error!.issues[0].message).toBe("Noto‘g‘ri kirish: kutilgan string, qabul qilingan raqam");

  const invalidValue = Schema.enum(["a", "b"]).safeParse(1);
  expect(invalidValue.error!.issues[0].code).toBe("invalid_value");
  expect(invalidValue.error!.issues[0].message).toBe('Noto‘g‘ri variant: quyidagilardan biri kutilgan "a"|"b"');

  const tooBig = Schema.number().max(10).safeParse(15);
  expect(tooBig.error!.issues[0].code).toBe("too_big");
  expect(tooBig.error!.issues[0].message).toBe("Juda katta: kutilgan number <=10");

  const tooSmall = Schema.number().min(10).safeParse(5);
  expect(tooSmall.error!.issues[0].code).toBe("too_small");
  expect(tooSmall.error!.issues[0].message).toBe("Juda kichik: kutilgan number >=10");

  const invalidFormatRegex = Schema.string().regex(/abcd/).safeParse("invalid-string");
  expect(invalidFormatRegex.error!.issues[0].code).toBe("invalid_format");
  expect(invalidFormatRegex.error!.issues[0].message).toContain("shabloniga mos kelishi kerak");

  const invalidFormatStartsWith = Schema.string().startsWith("abcd").safeParse("invalid-string");
  expect(invalidFormatStartsWith.error!.issues[0].code).toBe("invalid_format");
  expect(invalidFormatStartsWith.error!.issues[0].message).toContain('"abcd" bilan boshlanishi kerak');

  const notMultipleOf = Schema.number().multipleOf(3).safeParse(10);
  expect(notMultipleOf.error!.issues[0].code).toBe("not_multiple_of");
  expect(notMultipleOf.error!.issues[0].message).toContain("3 ning karralisi bo‘lishi kerak");

  const unrecognizedKeys = Schema.object({ a: Schema.string(), b: Schema.number() }).strict().safeParse({ a: "a", b: 1, c: 2 });
  expect(unrecognizedKeys.error!.issues[0].code).toBe("unrecognized_keys");
  expect(unrecognizedKeys.error!.issues[0].message).toContain('Noma’lum kalit: "c"');

  const invalidUnion = Schema.union([Schema.string(), Schema.number()]).safeParse(true);
  expect(invalidUnion.error!.issues[0].code).toBe("invalid_union");
  expect(invalidUnion.error!.issues[0].message).toBe("Noto‘g‘ri kirish");

  const tooBigString = Schema.string().max(5).safeParse("too long string");
  expect(tooBigString.error!.issues[0].code).toBe("too_big");
  expect(tooBigString.error!.issues[0].message).toContain("belgi");
  expect(tooBigString.error!.issues[0].message).toContain("bo‘lishi kerak");

  const tooSmallArray = Schema.array(Schema.string()).min(3).safeParse(["a", "b"]);
  expect(tooSmallArray.error!.issues[0].code).toBe("too_small");
  expect(tooSmallArray.error!.issues[0].message).toContain("element");
  expect(tooSmallArray.error!.issues[0].message).toContain("bo‘lishi kerak");

  const invalidFormatEndsWith = Schema.string().endsWith("xyz").safeParse("invalid-string");
  expect(invalidFormatEndsWith.error!.issues[0].code).toBe("invalid_format");
  expect(invalidFormatEndsWith.error!.issues[0].message).toContain('"xyz" bilan tugashi kerak');

  const invalidFormatIncludes = Schema.string().includes("test").safeParse("invalid-string");
  expect(invalidFormatIncludes.error!.issues[0].code).toBe("invalid_format");
  expect(invalidFormatIncludes.error!.issues[0].message).toContain('"test" ni o‘z ichiga olishi kerak');

  const invalidFormatEmail = Schema.string().email().safeParse("invalid-email");
  expect(invalidFormatEmail.error!.issues[0].code).toBe("invalid_format");
  expect(invalidFormatEmail.error!.issues[0].message).toContain("elektron pochta manzili");

  const invalidFormatUrl = Schema.string().url().safeParse("invalid-url");
  expect(invalidFormatUrl.error!.issues[0].code).toBe("invalid_format");
  expect(invalidFormatUrl.error!.issues[0].message).toContain("URL");

  const unrecognizedKeysMultiple = z
    .object({ a: Schema.string(), b: Schema.number() })
    .strict()
    .safeParse({ a: "a", b: 1, c: 2, d: 3 });
  expect(unrecognizedKeysMultiple.error!.issues[0].code).toBe("unrecognized_keys");
  expect(unrecognizedKeysMultiple.error!.issues[0].message).toContain("Noma’lum kalitlar");

  const invalidElement = Schema.array(Schema.string()).safeParse([1, 2, 3]);
  expect(invalidElement.error!.issues[0].code).toBe("invalid_type");
  expect(invalidElement.error!.issues[0].message).toContain("raqam");

  const tooSmallMap = z
    .map(Schema.string(), Schema.string())
    .min(3)
    .safeParse(new Map([["a", "b"]]));
  expect(tooSmallMap.error!.issues[0].code).toBe("too_small");
  expect(tooSmallMap.error!.issues[0].message).toContain("yozuv");
  expect(tooSmallMap.error!.issues[0].message).toContain("bo‘lishi kerak");

  const tooBigMap = z
    .map(Schema.string(), Schema.string())
    .max(2)
    .safeParse(
      new Map([
        ["a", "b"],
        ["c", "d"],
        ["e", "f"],
      ])
    );
  expect(tooBigMap.error!.issues[0].code).toBe("too_big");
  expect(tooBigMap.error!.issues[0].message).toContain("yozuv");
  expect(tooBigMap.error!.issues[0].message).toContain("bo‘lishi kerak");
});
