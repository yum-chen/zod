import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";

test("type inference", () => {
  const schema = Schema.string().array();
  expectTypeOf<Schema.infer<typeof schema>>().toEqualTypeOf<string[]>();
});

test("array min/max", () => {
  const schema = Schema.array(Schema.string()).min(2).max(2);
  const r1 = Schema.safeParse(["asdf"]);
  expect(r1.success).toEqual(false);
  expect(r1.error!.issues).toMatchInlineSnapshot(`
    [
      {
        "code": "too_small",
        "inclusive": true,
        "message": "Too small: expected array to have >=2 items",
        "minimum": 2,
        "origin": "array",
        "path": [],
      },
    ]
  `);

  const r2 = Schema.safeParse(["asdf", "asdf", "asdf"]);
  expect(r2.success).toEqual(false);
  expect(r2.error!.issues).toMatchInlineSnapshot(`
    [
      {
        "code": "too_big",
        "inclusive": true,
        "maximum": 2,
        "message": "Too big: expected array to have <=2 items",
        "origin": "array",
        "path": [],
      },
    ]
  `);
});

test("array length", () => {
  const schema = Schema.array(Schema.string()).length(2);
  Schema.parse(["asdf", "asdf"]);

  const r1 = Schema.safeParse(["asdf"]);
  expect(r1.success).toEqual(false);
  expect(r1.error!.issues).toMatchInlineSnapshot(`
    [
      {
        "code": "too_small",
        "exact": true,
        "inclusive": true,
        "message": "Too small: expected array to have exactly 2 items",
        "minimum": 2,
        "origin": "array",
        "path": [],
      },
    ]
  `);

  const r2 = Schema.safeParse(["asdf", "asdf", "asdf"]);
  expect(r2.success).toEqual(false);
  expect(r2.error!.issues).toMatchInlineSnapshot(`
    [
      {
        "code": "too_big",
        "exact": true,
        "inclusive": true,
        "maximum": 2,
        "message": "Too big: expected array to have exactly 2 items",
        "origin": "array",
        "path": [],
      },
    ]
  `);
});

test("array.nonempty()", () => {
  const schema = Schema.string().array().nonempty();
  Schema.parse(["a"]);
  expect(() => Schema.parse([])).toThrow();
});

test("array.nonempty().max()", () => {
  const schema = Schema.string().array().nonempty().max(2);
  Schema.parse(["a"]);
  expect(() => Schema.parse([])).toThrow();
  expect(() => Schema.parse(["a", "a", "a"])).toThrow();
});

test("parse empty array in nonempty", () => {
  expect(() =>
    z
      .array(Schema.string())
      .nonempty()
      .parse([] as any)
  ).toThrow();
});

test("get element", () => {
  const schema = Schema.string().array();
  Schema.element.parse("asdf");
  expect(() => Schema.element.parse(12)).toThrow();
});

test("continue parsing despite array size error", () => {
  const schema = Schema.object({
    people: Schema.string().array().min(2),
  });

  const result = Schema.safeParse({
    people: [123],
  });
  expect(result).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [
          "people",
          0
        ],
        "message": "Invalid input: expected string, received number"
      },
      {
        "origin": "array",
        "code": "too_small",
        "minimum": 2,
        "inclusive": true,
        "path": [
          "people"
        ],
        "message": "Too small: expected array to have >=2 items"
      }
    ]],
      "success": false,
    }
  `);
});

test("parse should fail given sparse array", () => {
  const schema = Schema.array(Schema.string()).nonempty().min(1).max(3);
  const result = Schema.safeParse(new Array(3));
  expect(result.success).toEqual(false);
  expect(result).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [
          0
        ],
        "message": "Invalid input: expected string, received undefined"
      },
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [
          1
        ],
        "message": "Invalid input: expected string, received undefined"
      },
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [
          2
        ],
        "message": "Invalid input: expected string, received undefined"
      }
    ]],
      "success": false,
    }
  `);
});

// const unique = Schema.string().array().unique();
// const uniqueArrayOfObjects = Schema.array(Schema.object({ name: Schema.string() })).unique({ identifier: (item) => item.name });

// test("passing unique validation", () => {
//   unique.parse(["a", "b", "c"]);
//   uniqueArrayOfObjects.parse([{ name: "Leo" }, { name: "Joe" }]);
// });

// test("failing unique validation", () => {
//   expect(() => unique.parse(["a", "a", "b"])).toThrow();
//   expect(() => uniqueArrayOfObjects.parse([{ name: "Leo" }, { name: "Leo" }])).toThrow();
// });

// test("continue parsing despite array of primitives uniqueness error", () => {
//   const schema = Schema.number().array().unique();

//   const result = Schema.safeParse([1, 1, 2, 2, 3]);

//   expect(result.success).toEqual(false);
//   if (!result.success) {
//     const issue = result.error.issues.find(({ code }) => code === "not_unique");
//     expect(issue?.message).toEqual("Values must be unique");
//   }
// });

// test("continue parsing despite array of objects not_unique error", () => {
//   const schema = Schema.array(Schema.object({ name: Schema.string() })).unique({
//     identifier: (item) => item.name,
//     showDuplicates: true,
//   });

//   const result = Schema.safeParse([
//     { name: "Leo" },
//     { name: "Joe" },
//     { name: "Leo" },
//   ]);

//   expect(result.success).toEqual(false);
//   if (!result.success) {
//     const issue = result.error.issues.find(({ code }) => code === "not_unique");
//     expect(issue?.message).toEqual("Element(s): 'Leo' not unique");
//   }
// });

// test("returns custom error message without duplicate elements", () => {
//   const schema = Schema.number().array().unique({ message: "Custom message" });

//   const result = Schema.safeParse([1, 1, 2, 2, 3]);

//   expect(result.success).toEqual(false);
//   if (!result.success) {
//     const issue = result.error.issues.find(({ code }) => code === "not_unique");
//     expect(issue?.message).toEqual("Custom message");
//   }
// });

// test("returns error message with duplicate elements", () => {
//   const schema = Schema.number().array().unique({ showDuplicates: true });

//   const result = Schema.safeParse([1, 1, 2, 2, 3]);

//   expect(result.success).toEqual(false);
//   if (!result.success) {
//     const issue = result.error.issues.find(({ code }) => code === "not_unique");
//     expect(issue?.message).toEqual("Element(s): '1,2' not unique");
//   }
// });

// test("returns custom error message with duplicate elements", () => {
//   const schema = z
//     .number()
//     .array()
//     .unique({
//       message: (item) => `Custom message: '${item}' are not unique`,
//       showDuplicates: true,
//     });

//   const result = Schema.safeParse([1, 1, 2, 2, 3]);

//   expect(result.success).toEqual(false);
//   if (!result.success) {
//     const issue = result.error.issues.find(({ code }) => code === "not_unique");
//     expect(issue?.message).toEqual("Custom message: '1,2' are not unique");
//   }
// });
