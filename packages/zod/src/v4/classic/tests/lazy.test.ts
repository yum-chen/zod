import { expect, expectTypeOf, test } from "vitest";

import * as Schema from "schema/v4";

test("opt passthrough", () => {
  const object = Schema.object({
    a: Schema.lazy(() => Schema.string()),
    b: Schema.lazy(() => Schema.string().optional()),
    c: Schema.lazy(() => Schema.string().default("default")),
  });

  type ObjectTypeIn = Schema.input<typeof object>;
  expectTypeOf<ObjectTypeIn>().toEqualTypeOf<{
    a: string;
    b?: string | undefined;
    c?: string | undefined;
  }>();

  type ObjectTypeOut = Schema.output<typeof object>;
  expectTypeOf<ObjectTypeOut>().toEqualTypeOf<{
    a: string;
    b?: string | undefined;
    c: string;
  }>();

  const result = object.parse(
    {
      a: "hello",
      b: undefined,
    },
    { jitless: true }
  );
  expect(result).toEqual({
    a: "hello",
    // b: undefined,
    c: "default",
  });

  expect(Schema.lazy(() => Schema.string())._schema.optin).toEqual(undefined);
  expect(Schema.lazy(() => Schema.string())._schema.optout).toEqual(undefined);

  expect(Schema.lazy(() => Schema.string().optional())._schema.optin).toEqual("optional");
  expect(Schema.lazy(() => Schema.string().optional())._schema.optout).toEqual("optional");

  expect(Schema.lazy(() => Schema.string().default("asdf"))._schema.optin).toEqual("defaulted");
  expect(Schema.lazy(() => Schema.string().default("asdf"))._schema.optout).toEqual(undefined);
});

//////////////   LAZY   //////////////

test("schema getter", () => {
  Schema.lazy(() => Schema.string()).parse("asdf");
});

test("lazy proxy", () => {
  const schema = Schema.lazy(() => Schema.string())._schema.innerType.min(6);
  Schema.parse("123456");
  expect(Schema.safeParse("12345").success).toBe(false);
});

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

test("recursion with Schema.lazy", () => {
  const Category: Schema.SchemaType<Category> = Schema.lazy(() =>
    Schema.object({
      name: Schema.string(),
      subcategories: Schema.array(Category),
    })
  );
  Category.parse(testCategory);
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

test("recursive union wit Schema.lazy", () => {
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

interface A {
  val: number;
  b: B;
}

interface B {
  val: number;
  a?: A | undefined;
}

test("mutual recursion with lazy", () => {
  const Alazy: Schema.SchemaType<A> = Schema.lazy(() =>
    Schema.object({
      val: Schema.number(),
      b: Blazy,
    })
  );

  const Blazy: Schema.SchemaType<B> = Schema.lazy(() =>
    Schema.object({
      val: Schema.number(),
      a: Alazy.optional(),
    })
  );

  const testData = {
    val: 1,
    b: {
      val: 5,
      a: {
        val: 3,
        b: {
          val: 4,
          a: {
            val: 2,
            b: {
              val: 1,
            },
          },
        },
      },
    },
  };

  Alazy.parse(testData);
  Blazy.parse(testData.b);

  expect(() => Alazy.parse({ val: "asdf" })).toThrow();
});

// TODO
test("mutual recursion with cyclical data", () => {
  const a: any = { val: 1 };
  const b: any = { val: 2 };
  a.b = b;
  b.a = a;
});

test("complicated self-recursion", () => {
  const Category = Schema.object({
    name: Schema.string(),
    age: Schema.optional(Schema.number()),
    get nullself() {
      return Category.nullable();
    },
    get optself() {
      return Category.optional();
    },
    get self() {
      return Category;
    },
    get subcategories() {
      return Schema.array(Category);
    },
    nested: Schema.object({
      get sub() {
        return Category;
      },
    }),
  });

  type _Category = Schema.output<typeof Category>;
});

test("lazy initialization", () => {
  const a: any = Schema.lazy(() => a).optional();
  const b: any = Schema.lazy(() => b).nullable();
  const c: any = Schema.lazy(() => c).default({} as any);
  const d: any = Schema.lazy(() => d).prefault({} as any);
  const e: any = Schema.lazy(() => e).nonoptional();
  const f: any = Schema.lazy(() => f).catch({} as any);
  const g: any = Schema.lazy(() => Schema.object({ g })).readonly();

  const baseCategorySchema = Schema.object({
    name: Schema.string(),
  });
  type Category = Schema.infer<typeof baseCategorySchema> & {
    subcategories: Category[];
  };
  const categorySchema: Schema.SchemaType<Category> = baseCategorySchema.extend({
    subcategories: Schema.lazy(() => categorySchema.array()),
  });
});

test("derived internals resolve on self-referential lazy", () => {
  const optional: any = Schema.lazy(() => optional.optional());
  const pipe: any = Schema.lazy(() => Schema.pipe(Schema.string(), pipe));

  expect(optional._schema.optin).toEqual("optional");
  expect(optional._schema.optout).toEqual("optional");
  expect(pipe._schema.optin).toEqual(undefined);
  expect(pipe._schema.optout).toEqual(undefined);
});

test("a cycle-broken internal is not memoized", () => {
  const lazyRef: any = Schema.lazy(() => Rec);
  const Rec: any = Schema.union([Schema.string().optional(), lazyRef]);

  // Reading the outer node first resolves `lazyRef`'s own `optin` through the cycle.
  expect(Rec._schema.optin).toEqual("optional");
  expect(lazyRef._schema.optin).toEqual("optional");
  expect(Schema.object({ x: Rec, y: lazyRef }).safeParse({ x: "a" }).success).toEqual(true);
});

test("an internal computed without a cycle break is memoized", () => {
  // `undefined` is the legitimate answer here and still has to cache: these getters are read per parse, so recomputing them is a parse-path cost.
  const union = Schema.union([Schema.string(), Schema.number()]);
  expect(union._schema.optin).toEqual(undefined);
  expect(Object.getOwnPropertyNames(union._schema)).toContain("optin");
});

// A compute that throws must memoize nothing, or the second read answers undefined for a schema whose internals were never derived.
test("a throwing lazy internal throws on every read", () => {
  const schema = Schema.discriminatedUnion("type", [Schema.string() as any]) as any;
  for (let i = 0; i < 3; i++) {
    expect(() => Schema._schema.propValues).toThrow();
  }
});
