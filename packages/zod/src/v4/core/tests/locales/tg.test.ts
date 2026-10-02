import { expect, test } from "vitest";
import * as Schema from "schema/v4";

test("locales - tg", () => {
  Schema.config(Schema.locales.tg());

  const invalidType = Schema.number().safeParse("a");
  expect(invalidType.error!.issues[0].code).toBe("invalid_type");
  expect(invalidType.error!.issues[0].message).toBe("Вуруди нодуруст: рақам интизор мерафт, сатр гирифта шуд");

  const invalidType2 = Schema.string().safeParse(1);
  expect(invalidType2.error!.issues[0].code).toBe("invalid_type");
  expect(invalidType2.error!.issues[0].message).toBe("Вуруди нодуруст: сатр интизор мерафт, рақам гирифта шуд");

  const invalidValue = Schema.enum(["a", "b"]).safeParse(1);
  expect(invalidValue.error!.issues[0].code).toBe("invalid_value");
  expect(invalidValue.error!.issues[0].message).toBe('Интихоби нодуруст: яке аз "a"|"b" интизор мерафт');

  const tooBig = Schema.number().max(10).safeParse(15);
  expect(tooBig.error!.issues[0].code).toBe("too_big");
  expect(tooBig.error!.issues[0].message).toBe("Хеле калон: number бояд <=10 бошад");

  const tooSmall = Schema.number().min(10).safeParse(5);
  expect(tooSmall.error!.issues[0].code).toBe("too_small");
  expect(tooSmall.error!.issues[0].message).toBe("Хеле хурд: number бояд >=10 бошад");

  // singular units after numerals in Tajik
  const tooShort = Schema.string().min(5).safeParse("hi");
  expect(tooShort.error!.issues[0].message).toBe("Хеле хурд: string бояд >=5 аломат дошта бошад");

  const tooFewItems = Schema.array(Schema.number()).min(2).safeParse([1]);
  expect(tooFewItems.error!.issues[0].message).toBe("Хеле хурд: array бояд >=2 унсур дошта бошад");

  const invalidEmail = Schema.string().email().safeParse("nope");
  expect(invalidEmail.error!.issues[0].code).toBe("invalid_format");
  expect(invalidEmail.error!.issues[0].message).toBe("суроғаи email-и нодуруст");

  const invalidStart = Schema.string().startsWith("ab").safeParse("xy");
  expect(invalidStart.error!.issues[0].message).toBe('Сатри нодуруст: бояд бо "ab" оғоз шавад');

  const invalidRegex = Schema.string().regex(/abcd/).safeParse("xy");
  expect(invalidRegex.error!.issues[0].message).toContain("мувофиқат кунад");

  const notMultipleOf = Schema.number().multipleOf(5).safeParse(7);
  expect(notMultipleOf.error!.issues[0].message).toBe("Рақами нодуруст: бояд ба 5 бе бақия тақсим шавад");

  const oneUnknownKey = Schema.strictObject({ a: Schema.string() }).safeParse({ a: "x", b: 1 });
  expect(oneUnknownKey.error!.issues[0].message).toBe('Калиди номаълум: "b"');

  const twoUnknownKeys = Schema.strictObject({ a: Schema.string() }).safeParse({ a: "x", b: 1, c: 2 });
  expect(twoUnknownKeys.error!.issues[0].message).toBe('Калидҳои номаълум: "b", "c"');

  const cases: [Schema.SchemaType, unknown, string][] = [
    [Schema.literal("a"), "b", 'Вуруди нодуруст: "a" интизор мерафт'],
    [Schema.boolean(), null, "Вуруди нодуруст: boolean интизор мерафт, null гирифта шуд"],
    [Schema.number(), Number.NaN, "Вуруди нодуруст: рақам интизор мерафт, NaN гирифта шуд"],
    [Schema.number().lt(10), 10, "Хеле калон: number бояд <10 бошад"],
    [Schema.number().gt(10), 10, "Хеле хурд: number бояд >10 бошад"],
    [Schema.string().max(1), "ab", "Хеле калон: string бояд <=1 аломат дошта бошад"],
    [Schema.set(Schema.string()).min(1), new Set(), "Хеле хурд: set бояд >=1 унсур дошта бошад"],
    [Schema.map(Schema.string(), Schema.number()).min(1), new Map(), "Хеле хурд: map бояд >=1 сабт дошта бошад"],
    [Schema.file().min(1), new File([], "empty"), "Хеле хурд: file бояд >=1 байт дошта бошад"],
    [Schema.string().endsWith("ab"), "xy", 'Сатри нодуруст: бояд бо "ab" анҷом ёбад'],
    [Schema.string().includes("ab"), "xy", 'Сатри нодуруст: бояд "ab"-ро дар бар гирад'],
    [Schema.stringFormat("custom", () => false), "xy", "custom-и нодуруст"],
    [Schema.union([Schema.string(), Schema.number()]), null, "Вуруди нодуруст"],
    [
      Schema.discriminatedUnion("kind", [Schema.object({ kind: Schema.literal("a") }), Schema.object({ kind: Schema.literal("b") })]),
      { kind: "c" },
      "Қимати нодурусти дискриминатор: 'a' | 'b' интизор мерафт",
    ],
    [Schema.record(Schema.string().min(2), Schema.number()), { a: 1 }, "Калиди нодуруст дар record"],
    [Schema.map(Schema.string(), Schema.number()), new Map([[{}, 1]]), "Калиди нодуруст дар map"],
    [Schema.map(Schema.object({}), Schema.number()), new Map([[{}, "a"]]), "Қимати нодуруст дар map"],
    [Schema.custom(() => false), "a", "Вуруди нодуруст"],
  ];
  for (const [schema, input, message] of cases) {
    expect(Schema.safeParse(input).error!.issues[0].message).toBe(message);
  }

  expect(Schema.object({ name: Schema.string().min(1), age: Schema.number().min(0) }).parse({ name: "Ali", age: 30 })).toEqual({
    name: "Ali",
    age: 30,
  });
});
