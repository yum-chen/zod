import { expect, test } from "vitest";

test("placeholder test", () => {
  expect(2).toBe(2);
});
// test("overload types", () => {
//   const schema = Schema.string().json();
//   util.assertEqual<typeof schema, Schema.SchemaString>(true);
//   const schema2 = Schema.string().json(Schema.number());
//   util.assertEqual<typeof schema2, Schema.SchemaPipe<Schema.SchemaTransform<any, string>, Schema.SchemaNumber>>(true);
//   const r2 = schema2.parse("12");
//   util.assertEqual<number, typeof r2>(true);
// });
// test("parse string to json", async () => {
//   const Env = Schema.object({
//     myJsonConfig: Schema.string().jsonString(Schema.object({ foo: Schema.number() })),
//     someOtherValue: Schema.string(),
//   });

//   expect(
//     Env.parse({
//       myJsonConfig: '{ "foo": 123 }',
//       someOtherValue: "abc",
//     })
//   ).toEqual({
//     myJsonConfig: { foo: 123 },
//     someOtherValue: "abc",
//   });

//   const invalidValues = Env.safeParse({
//     myJsonConfig: '{"foo": "not a number!"}',
//     someOtherValue: null,
//   });
//   expect(JSON.parse(JSON.stringify(invalidValues))).toEqual({
//     success: false,
//     error: {
//       name: "SchemaError",
//       issues: [
//         {
//           code: "invalid_type",
//           expected: "number",
//           input: "not a number!",
//           received: "string",
//           path: ["myJsonConfig", "foo"],
//           message: "Expected number, received string",
//         },
//         {
//           code: "invalid_type",
//           expected: "string",
//           input: null,
//           received: "null",
//           path: ["someOtherValue"],
//           message: "Expected string, received null",
//         },
//       ],
//     },
//   });

//   const invalidJsonSyntax = Env.safeParse({
//     myJsonConfig: "This is not valid json",
//     someOtherValue: null,
//   });
//   expect(JSON.parse(JSON.stringify(invalidJsonSyntax))).toMatchObject({
//     success: false,
//     error: {
//       name: "SchemaError",
//       issues: [
//         {
//           code: "invalid_string",
//           input: {
//             _def: {
//               catchall: {
//                 _def: {
//                   typeName: "SchemaNever",
//                 },
//               },
//               typeName: "SchemaObject",
//               unknownKeys: "strip",
//             },
//           },
//           validation: "json",
//           message: "Invalid json",
//           path: ["myJsonConfig"],
//         },
//         {
//           code: "invalid_type",
//           expected: "string",
//           input: null,
//           received: "null",
//           path: ["someOtherValue"],
//           message: "Expected string, received null",
//         },
//       ],
//     },
//   });
// });

// test("no argument", () => {
//   const schema = Schema.string().json();
//   util.assertEqual<typeof schema, Schema.SchemaString>(true);
//   Schema.string().json().parse(`{}`);
//   Schema.string().json().parse(`null`);
//   Schema.string().json().parse(`12`);
//   Schema.string().json().parse(`{ "test": "test"}`);
//   expect(() => Schema.string().json().parse(`asdf`)).toThrow();
//   expect(() => Schema.string().json().parse(`{ "test": undefined }`)).toThrow();
//   expect(() => Schema.string().json().parse(`{ "test": 12n }`)).toThrow();
//   expect(() => Schema.string().json().parse(`{ test: "test" }`)).toThrow();
// });
