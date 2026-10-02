import { expect, expectTypeOf, test } from "vitest";
import { Schema } from "schema/v4";

test("recursive object schema type aliases", () => {
  type ObjectField = Schema.SchemaObject<{ [k: string]: ObjectField }>;
  type MixedField = Schema.SchemaString | Schema.SchemaObject<{ [k: string]: MixedField }>;
  expectTypeOf<ObjectField>().toExtend<Schema.SchemaType>();
  expectTypeOf<MixedField>().toExtend<Schema.SchemaType>();

  type ObjectValue = { [k: string]: ObjectValue };
  type MixedValue = string | { [k: string]: MixedValue };
  expectTypeOf<Schema.input<ObjectField>>().toEqualTypeOf<ObjectValue>();
  expectTypeOf<Schema.output<ObjectField>>().toEqualTypeOf<ObjectValue>();
  expectTypeOf<Schema.input<MixedField>>().toEqualTypeOf<MixedValue>();
  expectTypeOf<Schema.output<MixedField>>().toEqualTypeOf<MixedValue>();

  const schema: MixedField = Schema.object({ name: Schema.string(), nested: Schema.object({ name: Schema.string() }) });
  expect(Schema.parse({ name: "a", nested: { name: "b", extra: true } })).toEqual({
    name: "a",
    nested: { name: "b" },
  });
  expect(Schema.safeParse({ name: "a", nested: { name: 123 } }).success).toBe(false);

  type CoreField = Schema.core.$SchemaString<string> | Schema.core.$SchemaObject<{ [k: string]: CoreField }>;
  expectTypeOf<Schema.input<CoreField>>().toEqualTypeOf<MixedValue>();
  expectTypeOf<Schema.output<CoreField>>().toEqualTypeOf<MixedValue>();
});

test("recursive object aliases preserve distinct input and output", () => {
  type Field = Schema.SchemaPipe<Schema.SchemaString, Schema.SchemaTransform<number, string>> | Schema.SchemaObject<{ [k: string]: Field }>;
  type Input = string | { [k: string]: Input };
  type Output = number | { [k: string]: Output };
  expectTypeOf<Schema.input<Field>>().toEqualTypeOf<Input>();
  expectTypeOf<Schema.output<Field>>().toEqualTypeOf<Output>();
  const schema: Field = Schema.object({ nested: Schema.object({ length: Schema.string().transform((s) => s.length) }) });
  expect(Schema.parse({ nested: { length: "abc" } })).toEqual({ nested: { length: 3 } });
  expect(Schema.safeParse({ nested: { length: 3 } }).success).toBe(false);
});

test("indexed object inference preserves string keys", () => {
  type Indexed = Schema.SchemaObject<Record<string, Schema.SchemaString>>;
  type Recursive = Schema.SchemaObject<Record<string, Recursive>>;
  expectTypeOf<keyof Schema.input<Indexed>>().toEqualTypeOf<string>();
  expectTypeOf<keyof Schema.output<Indexed>>().toEqualTypeOf<string>();
  expectTypeOf<keyof Schema.input<Recursive>>().toEqualTypeOf<string>();
  expectTypeOf<keyof Schema.output<Recursive>>().toEqualTypeOf<string>();
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
    get subcategories() {
      return Schema.array(Category).optional().nullable();
    },
  });
  type Category = Schema.infer<typeof Category>;
  interface _Category {
    name: string;
    subcategories?: _Category[] | undefined | null;
  }
  expectTypeOf<Category>().toEqualTypeOf<_Category>();
  Category.parse(data);
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
    get next() {
      return LL.nullable();
    },
  });
  type LL = Schema.infer<typeof LL>;
  type _LL = {
    value: number;
    next: _LL | null;
  };
  expectTypeOf<LL>().toEqualTypeOf<_LL>();

  LL.parse(data);
});

test("mutual recursion - native", () => {
  const Alazy = Schema.object({
    val: Schema.number(),
    get b() {
      return Blazy;
    },
  });

  const Blazy = Schema.object({
    val: Schema.number(),
    get a() {
      return Alazy.optional();
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

  type Alazy = Schema.infer<typeof Alazy>;
  type Blazy = Schema.infer<typeof Blazy>;
  interface _Alazy {
    val: number;
    b: _Blazy;
  }
  interface _Blazy {
    val: number;
    a?: _Alazy | undefined;
  }
  expectTypeOf<Alazy>().toEqualTypeOf<_Alazy>();
  expectTypeOf<Blazy>().toEqualTypeOf<_Blazy>();
  Alazy.parse(testData);
  Blazy.parse(testData.b);

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

  // Shape should not surface `readonly` modifiers from getter-defined keys. object/strictObject/looseObject all pass shape through util.Writeable<T>.
  type Shape = (typeof Category)["shape"];
  expectTypeOf<Shape>().toEqualTypeOf<{ name: Schema.SchemaString; subcategories: Schema.SchemaArray<typeof Category> }>();

  const PickedCategory = Category.pick({ name: true });
  const OmittedCategory = Category.omit({ subcategories: true });

  const picked = { name: "test" };
  const omitted = { name: "test" };

  PickedCategory.parse(picked);
  OmittedCategory.parse(omitted);

  expect(() => PickedCategory.parse({ name: "test", subcategories: [] })).toThrow();
  expect(() => OmittedCategory.parse({ name: "test", subcategories: [] })).toThrow();
});

test("shape stays writeable through extend/safeExtend/partial/required", () => {
  const Base = Schema.object({ name: Schema.string() });

  const Extended = Base.extend({
    get sub() {
      return Schema.array(Extended);
    },
  });
  type ExtendedShape = (typeof Extended)["shape"];
  expectTypeOf<ExtendedShape>().toEqualTypeOf<{
    name: Schema.SchemaString;
    sub: Schema.SchemaArray<typeof Extended>;
  }>();

  const SafeExt = Base.safeExtend({ extra: Schema.string() } as const);
  type SafeExtShape = (typeof SafeExt)["shape"];
  expectTypeOf<SafeExtShape>().toEqualTypeOf<{
    name: Schema.SchemaString;
    extra: Schema.SchemaString;
  }>();

  const FromConst = Base.extend({ a: Schema.string(), b: Schema.number() } as const);
  type FromConstShape = (typeof FromConst)["shape"];
  expectTypeOf<FromConstShape>().toEqualTypeOf<{
    name: Schema.SchemaString;
    a: Schema.SchemaString;
    b: Schema.SchemaNumber;
  }>();

  const PartialExtended = Extended.partial();
  type PartialShape = (typeof PartialExtended)["shape"];
  expectTypeOf<PartialShape>().toEqualTypeOf<{
    name: Schema.SchemaOptional<Schema.SchemaString>;
    sub: Schema.SchemaOptional<Schema.SchemaArray<typeof Extended>>;
  }>();

  const RequiredExtended = Extended.required();
  type RequiredShape = (typeof RequiredExtended)["shape"];
  expectTypeOf<RequiredShape>().toEqualTypeOf<{
    name: Schema.SchemaNonOptional<Schema.SchemaString>;
    sub: Schema.SchemaNonOptional<Schema.SchemaArray<typeof Extended>>;
  }>();
});

test("deferred self-recursion", () => {
  const Feature = Schema.object({
    title: Schema.string(),
    get features(): Schema.SchemaOptional<Schema.SchemaArray<typeof Feature>> {
      return Schema.optional(Schema.array(Feature)); //.optional();
    },
  });
  // type Feature = Schema.infer<typeof Feature>;

  const Output = Schema.object({
    id: Schema.int(), //.nonnegative(),
    name: Schema.string(),
    get features(): Schema.SchemaArray<typeof Feature> {
      return Feature.array();
    },
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

  // expectTypeOf<Feature>().toEqualTypeOf<_Feature>();
  expectTypeOf<Output>().toEqualTypeOf<_Output>();
});

test("deferred mutual recursion", () => {
  const Slot = Schema.object({
    slotCode: Schema.string(),

    get blocks() {
      return Schema.array(Block);
    },
  });
  type Slot = Schema.infer<typeof Slot>;

  const Block = Schema.object({
    blockCode: Schema.string(),
    get slots() {
      return Schema.array(Slot).optional();
    },
  });
  type Block = Schema.infer<typeof Block>;

  const Page = Schema.object({
    slots: Schema.array(Slot),
  });
  type Page = Schema.infer<typeof Page>;

  type _Slot = {
    slotCode: string;
    blocks: _Block[];
  };
  type _Block = {
    blockCode: string;
    slots?: _Slot[] | undefined;
  };
  type _Page = {
    slots: _Slot[];
  };
  expectTypeOf<Slot>().toEqualTypeOf<_Slot>();
  expectTypeOf<Block>().toEqualTypeOf<_Block>();
  expectTypeOf<Page>().toEqualTypeOf<_Page>();
});

test("mutual recursion with meta", () => {
  const A = z
    .object({
      name: Schema.string(),
      get b() {
        return B;
      },
    })
    .readonly()
    .meta({ id: "A" })
    .optional();

  const B = z
    .object({
      name: Schema.string(),
      get a() {
        return A;
      },
    })
    .readonly()
    .meta({ id: "B" });

  type A = Schema.infer<typeof A>;
  type B = Schema.infer<typeof B>;

  type _A =
    | Readonly<{
        name: string;
        b: _B;
      }>
    | undefined;
  // | undefined;
  type _B = Readonly<{
    name: string;
    a?: _A;
  }>;
  expectTypeOf<A>().toEqualTypeOf<_A>();
  expectTypeOf<B>().toEqualTypeOf<_B>();
});

test("intersection with recursive types", () => {
  const A = Schema.discriminatedUnion("type", [
    Schema.object({
      type: Schema.literal("CONTAINER"),
    }),
    Schema.object({
      type: Schema.literal("SCREEN"),
      config: Schema.object({ x: Schema.number(), y: Schema.number() }),
    }),
  ]);
  // type A = Schema.infer<typeof A>;

  const B = Schema.object({
    get children() {
      return Schema.array(C).optional();
    },
  });
  // type B = Schema.infer<typeof B>;

  const C = Schema.intersection(A, B);
  type C = Schema.infer<typeof C>;

  type _C = (
    | {
        type: "CONTAINER";
      }
    | {
        type: "SCREEN";
        config: {
          x: number;
          y: number;
        };
      }
  ) & {
    children?: _C[] | undefined;
  };
  expectTypeOf<C>().toEqualTypeOf<_C>();
});

test("object utilities with recursive types", () => {
  const NodeBase = Schema.object({
    id: Schema.string(),
    name: Schema.string(),
    get children() {
      return Schema.array(Node).optional();
    },
  });

  // Test extend with new keys (extend throws when overwriting existing keys)
  const NodeOne = NodeBase.extend({
    name: Schema.literal("nodeOne"),
    get children() {
      return Schema.array(Node);
    },
  });

  const NodeTwo = NodeBase.extend({
    name: Schema.literal("nodeTwo"),
    get children() {
      return Schema.array(Node);
    },
  });

  // Test pick
  const PickedNode = NodeBase.pick({ id: true, name: true });

  // Test omit
  const OmittedNode = NodeBase.omit({ children: true });

  // Test merge
  const ExtraProps = {
    metadata: Schema.string(),
    get parent() {
      return Node.optional();
    },
  };
  const MergedNode = NodeBase.extend(ExtraProps);

  // Test partial
  const PartialNode = NodeBase.partial();
  const PartialMaskedNode = NodeBase.partial({ name: true });

  // Test required (assuming NodeBase has optional fields)
  const OptionalNodeBase = Schema.object({
    id: Schema.string().optional(),
    name: Schema.string().optional(),
    get children() {
      return Schema.array(Node).optional();
    },
  });
  const RequiredNode = OptionalNodeBase.required();
  const RequiredMaskedNode = OptionalNodeBase.required({ id: true });

  const Node = Schema.union([
    NodeOne,
    NodeTwo,
    PickedNode,
    OmittedNode,
    MergedNode,
    PartialNode,
    PartialMaskedNode,
    RequiredNode,
    RequiredMaskedNode,
  ]);
});

test("tuple with recursive types", () => {
  const TaskListNodeSchema = Schema.strictObject({
    type: Schema.literal("taskList"),
    get content() {
      return Schema.array(Schema.tuple([TaskListNodeSchema, Schema.union([TaskListNodeSchema])])).min(1);
    },
  });
  type TaskListNodeSchema = Schema.infer<typeof TaskListNodeSchema>;
  type _TaskListNodeSchema = {
    type: "taskList";
    content: [_TaskListNodeSchema, _TaskListNodeSchema][];
  };
  expectTypeOf<TaskListNodeSchema>().toEqualTypeOf<_TaskListNodeSchema>();
});

test("recursion compatibility", () => {
  // array
  const A = Schema.object({
    get array() {
      return A.array();
    },
    get optional() {
      return A.optional();
    },
    get nullable() {
      return A.nullable();
    },
    get nonoptional() {
      return A.nonoptional();
    },
    get readonly() {
      return A.readonly();
    },
    get describe() {
      return A.describe("A recursive type");
    },
    get meta() {
      return A.meta({ description: "A recursive type" });
    },
    get pipe() {
      return A.pipe(Schema.any());
    },
    get strict() {
      return A.strict();
    },
    get tuple() {
      return Schema.tuple([A, A]);
    },
    get object() {
      return z
        .object({
          subcategories: A,
        })
        .strict()
        .loose();
    },
    get union() {
      return Schema.union([A, A]);
    },
    get intersection() {
      return Schema.intersection(A, A);
    },
    get record() {
      return Schema.record(Schema.string(), A);
    },
    get map() {
      return Schema.map(Schema.string(), A);
    },
    get set() {
      return Schema.set(A);
    },
    get lazy() {
      return Schema.lazy(() => A);
    },
    get promise() {
      return Schema.promise(A);
    },
  });
});

test("recursive object with .check()", () => {
  const Category = z
    .object({
      id: Schema.string(),
      name: Schema.string(),
      get subcategories() {
        return Schema.array(Category).optional();
      },
    })
    .check((ctx) => {
      // Check for duplicate IDs among direct subcategories
      if (ctx.value.subcategories) {
        const siblingIds = new Set<string>();
        ctx.value.subcategories.forEach((sub, index) => {
          if (siblingIds.has(sub.id)) {
            ctx.issues.push({
              code: "custom",
              message: `Duplicate sibling ID found: ${sub.id}`,
              path: ["subcategories", index, "id"],
              input: ctx.value,
            });
          }
          siblingIds.add(sub.id);
        });
      }
    });

  // Valid - siblings have unique IDs
  const validData = {
    id: "electronics",
    name: "Electronics",
    subcategories: [
      {
        id: "computers",
        name: "Computers",
        subcategories: [
          { id: "laptops", name: "Laptops" },
          { id: "desktops", name: "Desktops" },
        ],
      },
      {
        id: "phones",
        name: "Phones",
      },
    ],
  };

  // Invalid - duplicate sibling IDs
  const invalidData = {
    id: "electronics",
    name: "Electronics",
    subcategories: [
      { id: "computers", name: "Computers" },
      { id: "phones", name: "Phones" },
      { id: "computers", name: "Computers Again" }, // Duplicate at index 2
    ],
  };

  expect(() => Category.parse(validData)).not.toThrow();
  expect(() => Category.parse(invalidData)).toThrow();
});

// biome-ignore lint/suspicious/noExportsInTest: unexported it trips noUnusedVariables instead
export type RecursiveA = Schema.SchemaUnion<
  [
    Schema.SchemaObject<{
      a: Schema.SchemaDefault<RecursiveA>;
      b: Schema.SchemaPrefault<RecursiveA>;
      c: Schema.SchemaNonOptional<RecursiveA>;
      d: Schema.SchemaOptional<RecursiveA>;
      e: Schema.SchemaNullable<RecursiveA>;
      g: Schema.SchemaReadonly<RecursiveA>;
      h: Schema.SchemaPipe<RecursiveA, Schema.SchemaString>;
      i: Schema.SchemaArray<RecursiveA>;
      j: Schema.SchemaSet<RecursiveA>;
      k: Schema.SchemaMap<RecursiveA, RecursiveA>;
      l: Schema.SchemaRecord<Schema.SchemaString, RecursiveA>;
      m: Schema.SchemaUnion<[RecursiveA, RecursiveA]>;
      n: Schema.SchemaIntersection<RecursiveA, RecursiveA>;
      o: Schema.SchemaLazy<RecursiveA>;
      p: Schema.SchemaPromise<RecursiveA>;
      q: Schema.SchemaCatch<RecursiveA>;
      r: Schema.SchemaSuccess<RecursiveA>;
      s: Schema.SchemaTransform<RecursiveA, string>;
      t: Schema.SchemaTuple<[RecursiveA, RecursiveA]>;
      u: Schema.SchemaObject<{
        a: RecursiveA;
      }>;
    }>,
  ]
>;

test("recursive type with `id` meta", () => {
  const AType = Schema.object({
    type: Schema.literal("a"),
    name: Schema.string(),
  });

  const BType = Schema.object({
    type: Schema.literal("b"),
    name: Schema.string(),
  });

  const CType = Schema.object({
    type: Schema.literal("c"),
    name: Schema.string(),
  });

  const Schema = Schema.object({
    type: Schema.literal("special").meta({ description: "Type" }),
    config: Schema.object({
      title: Schema.string().meta({ description: "Title" }),
      get elements() {
        return Schema.array(Schema.discriminatedUnion("type", [AType, BType, CType])).meta({
          id: "SpecialElements",
          title: "SpecialElements",
          description: "Array of elements",
        });
      },
    }),
  });

  Schema.parse({
    type: "special",
    config: {
      title: "Special",
      elements: [
        { type: "a", name: "John" },
        { type: "b", name: "Jane" },
        { type: "c", name: "Jim" },
      ],
    },
  });
});

test("mutual recursion through discriminatedUnion getter", () => {
  const variantA = Schema.object({
    kind: Schema.literal("a"),
    get child() {
      return tree.optional();
    },
  });

  const variantB = Schema.object({
    kind: Schema.literal("b"),
    get sibling() {
      return tree.optional();
    },
  });

  const tree = Schema.discriminatedUnion("kind", [variantA, variantB]);

  type _Tree = { kind: "a"; child?: _Tree | undefined } | { kind: "b"; sibling?: _Tree | undefined };

  const treeUnion = Schema.union([variantA, variantB]);

  expectTypeOf<Schema.input<typeof tree>>().toEqualTypeOf<_Tree>();
  expectTypeOf<Schema.input<typeof tree>>().not.toBeAny();
  expectTypeOf<Schema.input<typeof tree>>().toEqualTypeOf<Schema.input<typeof treeUnion>>();

  expect(tree.parse({ kind: "a", child: { kind: "b", sibling: { kind: "a" } } })).toEqual({
    kind: "a",
    child: { kind: "b", sibling: { kind: "a" } },
  });
  expect(() => tree.parse({ kind: "c" })).toThrow();
});
