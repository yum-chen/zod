import { expect, expectTypeOf, test } from "vitest";
import { Schema } from "schema/mini";

test("recursive object schema type aliases", () => {
  type ObjectField = Schema.SchemaMiniObject<{ [k: string]: ObjectField }>;
  type Field = Schema.SchemaMiniString<string> | Schema.SchemaMiniObject<{ [k: string]: Field }>;
  type ObjectValue = { [k: string]: ObjectValue };
  type Value = string | { [k: string]: Value };
  expectTypeOf<Schema.input<ObjectField>>().toEqualTypeOf<ObjectValue>();
  expectTypeOf<Schema.output<ObjectField>>().toEqualTypeOf<ObjectValue>();
  expectTypeOf<keyof Schema.input<ObjectField>>().toEqualTypeOf<string>();
  expectTypeOf<keyof Schema.output<ObjectField>>().toEqualTypeOf<string>();
  expectTypeOf<Schema.input<Field>>().toEqualTypeOf<Value>();
  expectTypeOf<Schema.output<Field>>().toEqualTypeOf<Value>();
  const schema: Field = Schema.object({ nested: Schema.object({ name: Schema.string() }) });
  expect(Schema.parse({ nested: { name: "a", extra: true } })).toEqual({ nested: { name: "a" } });
  expect(Schema.safeParse({ nested: { name: 123 } }).success).toBe(false);
});

test("recursion with Schema.lazy", () => {
  const data = {
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

  const Category = Schema.object({
    name: Schema.string(),
    get subcategories(): Schema.SchemaMiniOptional<Schema.SchemaMiniArray<typeof Category>> {
      return Schema.optional(Schema.array(Category));
    },
  });
  Category.parse(data);

  type Category = Schema.infer<typeof Category>;
  interface _Category {
    name: string;
    subcategories?: _Category[] | undefined;
  }
  expectTypeOf<Category>().toEqualTypeOf<_Category>();
});

test("recursion involving union type", () => {
  const data = {
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

  const LL = Schema.object({
    value: Schema.number(),
    get next(): Schema.SchemaMiniNullable<typeof LL> {
      return Schema.nullable(LL);
    },
  });

  LL.parse(data);
  type LL = Schema.infer<typeof LL>;
  type _LL = {
    value: number;
    next: _LL | null;
  };
  expectTypeOf<LL>().toEqualTypeOf<_LL>();
});

test("mutual recursion - native", () => {
  const Alazy = Schema.object({
    val: Schema.number(),
    get b() {
      return Schema.optional(Blazy);
    },
  });

  const Blazy = Schema.object({
    val: Schema.number(),
    get a() {
      return Schema.optional(Alazy);
    },
  });
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

  type Alazy = Schema.infer<typeof Alazy>;
  type Blazy = Schema.infer<typeof Blazy>;
  interface _Alazy {
    val: number;
    b?: _Blazy | undefined;
  }
  interface _Blazy {
    val: number;
    a?: _Alazy | undefined;
  }
  expectTypeOf<Alazy>().toEqualTypeOf<_Alazy>();
  expectTypeOf<Blazy>().toEqualTypeOf<_Blazy>();

  expect(() => Alazy.parse({ val: "asdf" })).toThrow();
});

test("pick and omit with getter", () => {
  const Category = Schema.strictObject({
    name: Schema.string(),
    get subcategories() {
      return Schema.array(Category);
    },
  });

  type Category = Schema.infer<typeof Category>;
  interface _Category {
    name: string;
    subcategories: _Category[];
  }
  expectTypeOf<Category>().toEqualTypeOf<_Category>();

  const PickedCategory = Schema.pick(Category, { name: true });
  const OmittedCategory = Schema.omit(Category, { subcategories: true });
  type PickedCategory = Schema.infer<typeof PickedCategory>;
  type OmittedCategory = Schema.infer<typeof OmittedCategory>;
  interface _PickedCategory {
    name: string;
  }
  interface _OmittedCategory {
    name: string;
  }
  expectTypeOf<PickedCategory>().toEqualTypeOf<_PickedCategory>();
  expectTypeOf<OmittedCategory>().toEqualTypeOf<_OmittedCategory>();

  const picked = { name: "test" };
  const omitted = { name: "test" };

  PickedCategory.parse(picked);
  OmittedCategory.parse(omitted);

  expect(() => PickedCategory.parse({ name: "test", subcategories: [] })).toThrow();
  expect(() => OmittedCategory.parse({ name: "test", subcategories: [] })).toThrow();
});

test("deferred self-recursion", () => {
  const Feature = Schema.object({
    title: Schema.string(),
    get features(): Schema.SchemaMiniOptional<Schema.SchemaMiniArray<typeof Feature>> {
      return Schema.optional(Schema.array(Feature)); //.optional();
    },
  });
  type Feature = Schema.infer<typeof Feature>;

  const Output = Schema.object({
    id: Schema.int(), //.nonnegative(),
    name: Schema.string(),
    features: Schema.array(Feature), //.array(), // <—
  });

  type Output = Schema.output<typeof Output>;

  type _Feature = {
    title: string;
    features?: _Feature[] | undefined;
  };

  type _Output = {
    id: number;
    name: string;
    features: _Feature[];
  };

  expectTypeOf<Feature>().toEqualTypeOf<_Feature>();
  expectTypeOf<Output>().toEqualTypeOf<_Output>();
});

test("recursion compatibility", () => {
  // array
  const A = Schema.object({
    get subcategories() {
      return Schema.array(A);
    },
  });
  // tuple
  const B = Schema.object({
    get subcategories() {
      return Schema.tuple([B, B]);
    },
  });
  // object
  const C = Schema.object({
    get subcategories() {
      return Schema.object({
        subcategories: C,
      });
    },
  });
  // union
  const D = Schema.object({
    get subcategories() {
      return Schema.union([D, Schema.string()]);
    },
  });
  // intersection
  const E = Schema.object({
    get subcategories() {
      return Schema.intersection(E, E);
    },
  });
  // record
  const F = Schema.object({
    get subcategories() {
      return Schema.record(Schema.string(), F);
    },
  });
  // map
  const G = Schema.object({
    get subcategories() {
      return Schema.map(Schema.string(), G);
    },
  });
  // set
  const H = Schema.object({
    get subcategories() {
      return Schema.set(H);
    },
  });
  // optional
  const I = Schema.object({
    get subcategories() {
      return Schema.optional(I);
    },
  });
  // nullable
  const J = Schema.object({
    get subcategories() {
      return Schema.nullable(J);
    },
  });
  // optional
  const L = Schema.object({
    get subcategories() {
      return Schema.optional(L);
    },
  });
  // nullable
  const M = Schema.object({
    get subcategories() {
      return Schema.nullable(M);
    },
  });
  // nonoptional
  const N = Schema.object({
    get subcategories() {
      return Schema.nonoptional(N);
    },
  });
});

test("shape stays writeable through object/strictObject/looseObject/extend with getters", () => {
  const Cat = Schema.object({
    name: Schema.string(),
    get sub(): Schema.SchemaMiniArray<typeof Cat> {
      return Schema.array(Cat);
    },
  });
  type CatShape = (typeof Cat)["shape"];
  expectTypeOf<CatShape>().toEqualTypeOf<{
    name: Schema.SchemaMiniString<string>;
    sub: Schema.SchemaMiniArray<typeof Cat>;
  }>();

  const StrictCat = Schema.strictObject({
    name: Schema.string(),
    get sub(): Schema.SchemaMiniArray<typeof StrictCat> {
      return Schema.array(StrictCat);
    },
  });
  type StrictShape = (typeof StrictCat)["shape"];
  expectTypeOf<StrictShape>().toEqualTypeOf<{
    name: Schema.SchemaMiniString<string>;
    sub: Schema.SchemaMiniArray<typeof StrictCat>;
  }>();

  const LooseCat = Schema.looseObject({
    name: Schema.string(),
    get sub(): Schema.SchemaMiniArray<typeof LooseCat> {
      return Schema.array(LooseCat);
    },
  });
  type LooseShape = (typeof LooseCat)["shape"];
  expectTypeOf<LooseShape>().toEqualTypeOf<{
    name: Schema.SchemaMiniString<string>;
    sub: Schema.SchemaMiniArray<typeof LooseCat>;
  }>();

  const Base = Schema.object({ name: Schema.string() });
  const Extended = Schema.extend(Base, {
    get sub(): Schema.SchemaMiniArray<typeof Extended> {
      return Schema.array(Extended);
    },
  });
  type ExtendedShape = (typeof Extended)["shape"];
  expectTypeOf<ExtendedShape>().toEqualTypeOf<{
    name: Schema.SchemaMiniString<string>;
    sub: Schema.SchemaMiniArray<typeof Extended>;
  }>();
});
