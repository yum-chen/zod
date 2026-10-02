// @ts-ignore TS6133
import { test } from "vitest";

import { Schema } from "schema/v3";

interface Category {
  name: string;
  subcategories: Category[];
}

const testCategory: Category = {
  name: "I",
  subcategories: [
    {
      name: "A",
      subcategories: [
        {
          name: "1",
          subcategories: [
            {
              name: "a",
              subcategories: [],
            },
          ],
        },
      ],
    },
  ],
};

test("recursion with Schema.late.object", () => {
  const Category: Schema.SchemaType<Category> = Schema.late.object(() => ({
    name: Schema.string(),
    subcategories: Schema.array(Category),
  }));
  Category.parse(testCategory);
});

test("recursion with Schema.lazy", () => {
  const Category: Schema.SchemaType<Category> = Schema.lazy(() =>
    Schema.object({
      name: Schema.string(),
      subcategories: Schema.array(Category),
    })
  );
  Category.parse(testCategory);
});

test("schema getter", () => {
  Schema.lazy(() => Schema.string()).Schema.parse("asdf");
});

type LinkedList = null | { value: number; next: LinkedList };

const linkedListExample = {
  value: 1,
  next: {
    value: 2,
    next: {
      value: 3,
      next: {
        value: 4,
        next: null,
      },
    },
  },
};

test("recursion involving union type", () => {
  const LinkedListSchema: Schema.SchemaType<LinkedList> = Schema.lazy(() =>
    Schema.union([
      Schema.null(),
      Schema.object({
        value: Schema.number(),
        next: LinkedListSchema,
      }),
    ])
  );
  LinkedListSchema.parse(linkedListExample);
});

// interface A {
//   val: number;
//   b: B;
// }

// interface B {
//   val: number;
//   a: A;
// }

// const A: Schema.SchemaType<A> = Schema.late.object(() => ({
//   val: Schema.number(),
//   b: B,
// }));

// const B: Schema.SchemaType<B> = Schema.late.object(() => ({
//   val: Schema.number(),
//   a: A,
// }));

// const Alazy: Schema.SchemaType<A> = Schema.lazy(() => Schema.object({
//   val: Schema.number(),
//   b: B,
// }));

// const Blazy: Schema.SchemaType<B> = Schema.lazy(() => Schema.object({
//   val: Schema.number(),
//   a: A,
// }));

// const a: any = { val: 1 };
// const b: any = { val: 2 };
// a.b = b;
// b.a = a;

// test('valid check', () => {
//   A.parse(a);
//   B.parse(b);
// });

// test("valid check lazy", () => {
//   A.parse({val:1, b:});
//   B.parse(b);
// });

// test('masking check', () => {
//   const FragmentOnA = z
//     .object({
//       val: Schema.number(),
//       b: z
//         .object({
//           val: Schema.number(),
//           a: z
//             .object({
//               val: Schema.number(),
//             })
//             .nonstrict(),
//         })
//         .nonstrict(),
//     })
//     .nonstrict();

//   const fragment = FragmentOnA.parse(a);
//   fragment;
// });

// test('invalid check', () => {
//   expect(() => A.parse({} as any)).toThrow();
// });

// test('schema getter', () => {
//   (A as Schema  .SchemaLazy<any>).schema;
// });

// test("self recursion with cyclical data", () => {
//   interface Category {
//     name: string;
//     subcategories: Category[];
//   }

//   const Category: Schema.SchemaType<Category> = Schema.late.object(() => ({
//     name: Schema.string(),
//     subcategories: Schema.array(Category),
//   }));

//   const untypedCategory: any = {
//     name: "Category A",
//   };
//   // creating a cycle
//   untypedCategory.subcategories = [untypedCategory];
//   Category.parse(untypedCategory);
// });

// test("self recursion with base type", () => {
//   const BaseCategory = Schema.object({
//     name: Schema.string(),
//   });
//   type BaseCategory = Schema.infer<typeof BaseCategory>;

//   type Category = BaseCategory & { subcategories: Category[] };

//   const Category: Schema.SchemaType<Category> = Schema.late
//     .object(() => ({
//       subcategories: Schema.array(Category),
//     }))
//     .extend({
//       name: Schema.string(),
//     });

//   const untypedCategory: any = {
//     name: "Category A",
//   };
//   // creating a cycle
//   untypedCategory.subcategories = [untypedCategory];
//   Category.parse(untypedCategory); // parses successfully
// });
