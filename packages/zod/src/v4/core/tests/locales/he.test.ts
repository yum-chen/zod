import { beforeEach, describe, expect, test } from "vitest";
import { Schema } from "../../../../index.js";
import he from "../../../locales/he.js";

describe("Hebrew localization", () => {
  beforeEach(() => {
    Schema.config(he());
  });

  describe("too_small errors with definite article and gendered verbs", () => {
    test("string type (feminine - צריכה)", () => {
      const schema = Schema.string().min(3);
      const result = Schema.safeParse("ab");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("קצר מדי: המחרוזת צריכה להכיל 3 תווים או יותר");
      }
    });

    test("number type (masculine - צריך)", () => {
      const schema = Schema.number().min(10);
      const result = Schema.safeParse(5);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("קטן מדי: המספר צריך להיות גדול או שווה ל-10");
      }
    });

    test("array type (masculine - צריך)", () => {
      const schema = Schema.array(Schema.string()).min(1);
      const result = Schema.safeParse([]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("קטן מדי: המערך צריך להכיל לפחות פריט אחד");
      }
    });

    test("set type (feminine - צריכה)", () => {
      const schema = Schema.set(Schema.string()).min(2);
      const result = Schema.safeParse(new Set(["a"]));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("קטן מדי: הקבוצה (Set) צריכה להכיל 2 פריטים או יותר");
      }
    });
  });

  describe("too_big errors with definite article and gendered verbs", () => {
    test("string type (feminine - צריכה)", () => {
      const schema = Schema.string().max(3);
      const result = Schema.safeParse("abcde");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("ארוך מדי: המחרוזת צריכה להכיל 3 תווים או פחות");
      }
    });

    test("number type (masculine - צריך)", () => {
      const schema = Schema.number().max(365);
      const result = Schema.safeParse(400);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("גדול מדי: המספר צריך להיות קטן או שווה ל-365");
      }
    });

    test("array max", () => {
      const schema = Schema.array(Schema.string()).max(2);
      const result = Schema.safeParse(["a", "b", "c"]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("גדול מדי: המערך צריך להכיל 2 פריטים או פחות");
      }
    });
  });

  describe("invalid_type errors with definite article and gendered verbs", () => {
    test("string expected (feminine), number received", () => {
      const schema = Schema.string();
      const result = Schema.safeParse(123);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("קלט לא תקין: צריך להיות מחרוזת, התקבל מספר");
      }
    });

    test("number expected (masculine), string received", () => {
      const schema = Schema.number();
      const result = Schema.safeParse("abc");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("קלט לא תקין: צריך להיות מספר, התקבל מחרוזת");
      }
    });

    test("boolean expected (masculine), null received", () => {
      const schema = Schema.boolean();
      const result = Schema.safeParse(null);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("קלט לא תקין: צריך להיות ערך בוליאני, התקבל ערך ריק (null)");
      }
    });

    test("array expected (masculine), object received", () => {
      const schema = Schema.array(Schema.string());
      const result = Schema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("קלט לא תקין: צריך להיות מערך, התקבל אובייקט");
      }
    });

    test("object expected (masculine), array received", () => {
      const schema = Schema.object({ a: Schema.string() });
      const result = Schema.safeParse([]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("קלט לא תקין: צריך להיות אובייקט, התקבל מערך");
      }
    });

    test("function expected (feminine), string received", () => {
      const schema = Schema.function();
      const result = Schema.safeParse("not a function");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("קלט לא תקין: צריך להיות פונקציה, התקבל מחרוזת");
      }
    });
  });

  describe("gendered verbs consistency", () => {
    test("feminine types use צריכה", () => {
      const feminineTypes = [
        { schema: Schema.string().min(5), input: "abc" },
        { schema: Schema.set(Schema.string()).min(2), input: new Set(["a"]) },
      ];

      for (const { schema, input } of feminineTypes) {
        const result = Schema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("צריכה");
        }
      }
    });

    test("masculine types use צריך", () => {
      const masculineTypes = [
        { schema: Schema.number().min(10), input: 5 },
        { schema: Schema.array(Schema.string()).min(2), input: ["a"] },
      ];

      for (const { schema, input } of masculineTypes) {
        const result = Schema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("צריך");
        }
      }
    });
  });

  describe("invalid_value with enum", () => {
    test("single value", () => {
      const schema = Schema.enum(["a"]);
      const result = Schema.safeParse("b");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('ערך לא תקין: הערך חייב להיות "a"');
      }
    });

    test("two values", () => {
      const schema = Schema.enum(["a", "b"]);
      const result = Schema.safeParse("c");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('ערך לא תקין: האפשרויות המתאימות הן "a" או "b"');
      }
    });

    test("multiple values", () => {
      const schema = Schema.enum(["a", "b", "c"]);
      const result = Schema.safeParse("d");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('ערך לא תקין: האפשרויות המתאימות הן "a", "b" או "c"');
      }
    });
  });

  describe("other error types", () => {
    test("not_multiple_of", () => {
      const schema = Schema.number().multipleOf(3);
      const result = Schema.safeParse(10);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("מספר לא תקין: חייב להיות מכפלה של 3");
      }
    });

    test("unrecognized_keys - single key", () => {
      const schema = Schema.object({ a: Schema.string() }).strict();
      const result = Schema.safeParse({ a: "test", b: "extra" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('מפתח לא מזוהה: "b"');
      }
    });

    test("unrecognized_keys - multiple keys", () => {
      const schema = Schema.object({ a: Schema.string() }).strict();
      const result = Schema.safeParse({ a: "test", b: "extra", c: "more" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('מפתחות לא מזוהים: "b", "c"');
      }
    });

    test("invalid_union", () => {
      const schema = Schema.union([Schema.string(), Schema.number()]);
      const result = Schema.safeParse(true);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("קלט לא תקין");
      }
    });

    test("invalid_key in object", () => {
      const schema = Schema.record(Schema.number(), Schema.string());
      const result = Schema.safeParse({ notANumber: "value" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("שדה לא תקין באובייקט");
      }
    });
  });

  describe("invalid_format with string checks", () => {
    test("startsWith", () => {
      const schema = Schema.string().startsWith("hello");
      const result = Schema.safeParse("world");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('המחרוזת חייבת להתחיל ב "hello"');
      }
    });

    test("endsWith", () => {
      const schema = Schema.string().endsWith("world");
      const result = Schema.safeParse("hello");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('המחרוזת חייבת להסתיים ב "world"');
      }
    });

    test("includes", () => {
      const schema = Schema.string().includes("test");
      const result = Schema.safeParse("hello world");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('המחרוזת חייבת לכלול "test"');
      }
    });

    test("regex", () => {
      const schema = Schema.string().regex(/^[a-z]+$/);
      const result = Schema.safeParse("ABC123");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("המחרוזת חייבת להתאים לתבנית /^[a-z]+$/");
      }
    });
  });

  describe("invalid_format with common formats", () => {
    test("email", () => {
      const schema = Schema.string().email();
      const result = Schema.safeParse("not-an-email");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("כתובת אימייל לא תקינה");
      }
    });

    test("url", () => {
      const schema = Schema.string().url();
      const result = Schema.safeParse("not-a-url");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("כתובת רשת לא תקינה");
      }
    });

    test("uuid", () => {
      const schema = Schema.string().uuid();
      const result = Schema.safeParse("not-a-uuid");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("UUID לא תקין");
      }
    });
  });

  describe("tuple validation", () => {
    test("invalid element type in tuple shows full error message", () => {
      const schema = Schema.tuple([Schema.string(), Schema.number()]);
      const result = Schema.safeParse(["abc", "not a number"]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("קלט לא תקין: צריך להיות מספר, התקבל מחרוזת");
      }
    });
  });

  describe("inclusive vs exclusive bounds", () => {
    test("inclusive minimum (>=)", () => {
      const schema = Schema.number().min(10);
      const result = Schema.safeParse(5);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("קטן מדי: המספר צריך להיות גדול או שווה ל-10");
      }
    });

    test("exclusive minimum (>)", () => {
      const schema = Schema.number().gt(10);
      const result = Schema.safeParse(10);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("קטן מדי: המספר צריך להיות גדול מ-10");
      }
    });

    test("inclusive maximum (<=)", () => {
      const schema = Schema.number().max(10);
      const result = Schema.safeParse(15);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("גדול מדי: המספר צריך להיות קטן או שווה ל-10");
      }
    });

    test("exclusive maximum (<)", () => {
      const schema = Schema.number().lt(10);
      const result = Schema.safeParse(10);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("גדול מדי: המספר צריך להיות קטן מ-10");
      }
    });
  });

  describe("all type names with definite article", () => {
    test("verifies all type translations are correct", () => {
      const types = [
        { schema: Schema.string(), expected: "מחרוזת", input: 123 },
        { schema: Schema.number(), expected: "מספר", input: "abc" },
        { schema: Schema.boolean(), expected: "ערך בוליאני", input: "abc" },
        { schema: Schema.bigint(), expected: "BigInt", input: "abc" },
        { schema: Schema.date(), expected: "תאריך", input: "abc" },
        { schema: Schema.array(Schema.any()), expected: "מערך", input: "abc" },
        { schema: Schema.object({}), expected: "אובייקט", input: "abc" },
        { schema: Schema.function(), expected: "פונקציה", input: "abc" },
      ];

      for (const { schema, expected, input } of types) {
        const result = Schema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain(expected);
        }
      }
    });
  });
});
