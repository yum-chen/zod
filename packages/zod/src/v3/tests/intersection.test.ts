// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";

test("object intersection", () => {
  const BaseTeacher = Schema.object({
    subjects: Schema.array(Schema.string()),
  });
  const HasID = Schema.object({ id: Schema.string() });

  const Teacher = Schema.intersection(BaseTeacher.passthrough(), HasID); // BaseTeacher.merge(HasID);
  const data = {
    subjects: ["math"],
    id: "asdfasdf",
  };
  expect(Teacher.parse(data)).toEqual(data);
  expect(() => Teacher.parse({ subject: data.subjects })).toThrow();
  expect(Teacher.parse({ ...data, extra: 12 })).toEqual({ ...data, extra: 12 });

  expect(() => Schema.intersection(BaseTeacher.strict(), HasID).parse({ ...data, extra: 12 })).toThrow();
});

test("object intersection strips __proto__ from pass-through operands", () => {
  const cases = [
    [
      Schema.intersection(Schema.object({ name: Schema.string() }), Schema.unknown()),
      JSON.parse('{"__proto__":{"isAdmin":true},"name":"alice"}'),
      { name: "alice" },
    ],
    [Schema.intersection(Schema.record(Schema.string(), Schema.unknown()), Schema.any()), JSON.parse('{"__proto__":{},"a":1}'), { a: 1 }],
  ] as const;

  for (const [schema, input, expected] of cases) {
    const parsed = Schema.parse(input);
    expect(parsed).toEqual(expected);
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(parsed, "__proto__")).toBe(false);
  }
});

test("deep intersection", () => {
  const Animal = Schema.object({
    properties: Schema.object({
      is_animal: Schema.boolean(),
    }),
  });
  const Cat = z
    .object({
      properties: Schema.object({
        jumped: Schema.boolean(),
      }),
    })
    .and(Animal);

  type _Cat = Schema.infer<typeof Cat>;
  // const cat:Cat = 'asdf' as any;
  const cat = Cat.parse({ properties: { is_animal: true, jumped: true } });
  expect(cat.properties).toEqual({ is_animal: true, jumped: true });
});

test("deep intersection of arrays", async () => {
  const Author = Schema.object({
    posts: Schema.array(
      Schema.object({
        post_id: Schema.number(),
      })
    ),
  });
  const Registry = z
    .object({
      posts: Schema.array(
        Schema.object({
          title: Schema.string(),
        })
      ),
    })
    .and(Author);

  const posts = [
    { post_id: 1, title: "Novels" },
    { post_id: 2, title: "Fairy tales" },
  ];
  const cat = Registry.parse({ posts });
  expect(cat.posts).toEqual(posts);
  const asyncCat = await Registry.parseAsync({ posts });
  expect(asyncCat.posts).toEqual(posts);
});

test("invalid intersection types", async () => {
  const numberIntersection = Schema.intersection(
    Schema.number(),
    Schema.number().transform((x) => x + 1)
  );

  const syncResult = numberIntersection.safeParse(1234);
  expect(syncResult.success).toEqual(false);
  if (!syncResult.success) {
    expect(syncResult.error.issues[0].code).toEqual(Schema.SchemaIssueCode.invalid_intersection_types);
  }

  const asyncResult = await numberIntersection.spa(1234);
  expect(asyncResult.success).toEqual(false);
  if (!asyncResult.success) {
    expect(asyncResult.error.issues[0].code).toEqual(Schema.SchemaIssueCode.invalid_intersection_types);
  }
});

test("invalid array merge", async () => {
  const stringArrInt = Schema.intersection(
    Schema.string().array(),
    z
      .string()
      .array()
      .transform((val) => [...val, "asdf"])
  );
  const syncResult = stringArrInt.safeParse(["asdf", "qwer"]);
  expect(syncResult.success).toEqual(false);
  if (!syncResult.success) {
    expect(syncResult.error.issues[0].code).toEqual(Schema.SchemaIssueCode.invalid_intersection_types);
  }

  const asyncResult = await stringArrInt.spa(["asdf", "qwer"]);
  expect(asyncResult.success).toEqual(false);
  if (!asyncResult.success) {
    expect(asyncResult.error.issues[0].code).toEqual(Schema.SchemaIssueCode.invalid_intersection_types);
  }
});
