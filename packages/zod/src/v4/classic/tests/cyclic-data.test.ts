import v8 from "node:v8";
import vm from "node:vm";
import { expect, test } from "vitest";
import * as Schema from "schema/v4";

test("parses a self-referential object and preserves identity", () => {
  const Node: any = Schema.object({
    id: Schema.number(),
    get self() {
      return Node;
    },
  });

  const input: any = { id: 1 };
  input.self = input;

  const result = Node.parse(input);
  expect(result.id).toBe(1);
  expect(result.self).toBe(result);
  expect(result).not.toBe(input);
});

test("validates a node against every schema that reaches it", () => {
  const A: any = Schema.object({
    x: Schema.string(),
    get b() {
      return B;
    },
  });
  const B: any = Schema.object({
    y: Schema.number(),
    get a() {
      return A;
    },
  });

  const input: any = { x: "s", y: 1 };
  input.b = input;
  input.a = input;

  const result = A.parse(input);
  expect(Object.keys(result).sort()).toEqual(["b", "x"]);
  expect(Object.keys(result.b).sort()).toEqual(["a", "y"]);
  expect(result.b.y).toBe(1);
  expect(result.b.a).toBe(result);

  const bad: any = { x: "s", y: "not a number" };
  bad.b = bad;
  bad.a = bad;
  expect(A.safeParse(bad).success).toBe(false);
});

test("breaks cycles through every container", () => {
  const cases: [string, () => { schema: any; input: any }][] = [
    [
      "array",
      () => {
        const S: any = Schema.object({
          id: Schema.number(),
          get kids() {
            return Schema.array(S);
          },
        });
        const a: any = { id: 1, kids: [] };
        a.kids.push(a);
        return { schema: S, input: a };
      },
    ],
    [
      "record",
      () => {
        const S: any = Schema.object({
          id: Schema.number(),
          get kids() {
            return Schema.record(Schema.string(), S);
          },
        });
        const a: any = { id: 1, kids: {} };
        a.kids.self = a;
        return { schema: S, input: a };
      },
    ],
    [
      "tuple",
      () => {
        const S: any = Schema.object({
          id: Schema.number(),
          get pair() {
            return Schema.tuple([Schema.number(), S]);
          },
        });
        const a: any = { id: 1 };
        a.pair = [1, a];
        return { schema: S, input: a };
      },
    ],
    [
      "set",
      () => {
        const S: any = Schema.object({
          id: Schema.number(),
          get peers() {
            return Schema.set(S);
          },
        });
        const a: any = { id: 1, peers: new Set() };
        a.peers.add(a);
        return { schema: S, input: a };
      },
    ],
    [
      "map",
      () => {
        const S: any = Schema.object({
          id: Schema.number(),
          get links() {
            return Schema.map(Schema.string(), S);
          },
        });
        const a: any = { id: 1, links: new Map() };
        a.links.set("s", a);
        return { schema: S, input: a };
      },
    ],
    [
      "union",
      () => {
        const S: any = Schema.object({
          id: Schema.number(),
          get self() {
            return Schema.union([Schema.string(), S]);
          },
        });
        const a: any = { id: 1 };
        a.self = a;
        return { schema: S, input: a };
      },
    ],
    [
      "discriminated union",
      () => {
        const S: any = Schema.discriminatedUnion("kind", [
          Schema.object({ kind: Schema.literal("leaf"), v: Schema.number() }),
          Schema.object({
            kind: Schema.literal("branch"),
            get next() {
              return S;
            },
          }),
        ]);
        const a: any = { kind: "branch" };
        a.next = a;
        return { schema: S, input: a };
      },
    ],
    [
      "lazy",
      () => {
        const S: any = Schema.object({ id: Schema.number(), self: Schema.lazy(() => S) });
        const a: any = { id: 1 };
        a.self = a;
        return { schema: S, input: a };
      },
    ],
    [
      "mutual recursion five hops apart",
      () => {
        const A: any = Schema.object({
          get b() {
            return B;
          },
        });
        const B: any = Schema.object({
          get c() {
            return C;
          },
        });
        const C: any = Schema.object({
          get d() {
            return D;
          },
        });
        const D: any = Schema.object({
          get e() {
            return E;
          },
        });
        const E: any = Schema.object({
          get a() {
            return A;
          },
        });
        const a: any = {};
        a.b = { c: { d: { e: { a } } } };
        return { schema: A, input: a };
      },
    ],
  ];

  for (const [name, build] of cases) {
    for (const jitless of [false, true]) {
      const { schema, input } = build();
      expect(() => Schema.parse(input, { jitless }), `${name} (jitless: ${jitless})`).not.toThrow();
    }
  }
});

test("checks run once per node and never against a half-built object", () => {
  const seen: number[] = [];
  const Node: any = z
    .object({
      id: Schema.number(),
      get self() {
        return Node;
      },
    })
    .refine((value: any) => {
      seen.push(Object.keys(value).length);
      return true;
    });

  const input: any = { id: 1 };
  input.self = input;
  Node.parse(input);

  expect(seen).toEqual([2]);
});

test("reports a failing check inside a cycle", () => {
  const Node: any = z
    .object({
      id: Schema.number(),
      get self() {
        return Node;
      },
    })
    .refine((value: any) => value.id > 100, "too small");

  const input: any = { id: 1 };
  input.self = input;
  expect(Node.safeParse(input).success).toBe(false);
});

test("reports an invalid value inside a cycle once, at its own path", () => {
  const Node: any = Schema.object({
    id: Schema.number(),
    get self() {
      return Node;
    },
  });

  const input: any = { id: "nope" };
  input.self = input;

  const result = Node.safeParse(input);
  expect(result.success).toBe(false);
  expect(result.error!.issues).toHaveLength(1);
  expect(result.error!.issues[0].path).toEqual(["id"]);
});

test("rejects a cycle that closes through a transform", () => {
  const Inner: any = Schema.object({
    name: Schema.string(),
    get self() {
      return Wrapped;
    },
  });
  const Wrapped: any = Inner.transform((value: any) => ({ wrapped: value }));

  const input: any = { name: "x" };
  input.self = input;

  expect(() => Wrapped.parse(input)).toThrow(/reference cycle/);
});

test("leaves a transform that is not on the cycle alone", () => {
  const Node: any = Schema.object({
    n: Schema.number().transform((value: number) => value * 2),
    get self() {
      return Node;
    },
  });

  const input: any = { n: 21 };
  input.self = input;

  const result = Node.parse(input);
  expect(result.n).toBe(42);
  expect(result.self).toBe(result);
});

test("encodes through a cycle", () => {
  const Stringified = Schema.codec(Schema.string(), Schema.number(), {
    decode: (value) => Number(value),
    encode: (value) => String(value),
  });
  const Node: any = Schema.object({
    n: Stringified,
    get self() {
      return Node;
    },
  });

  const input: any = { n: 5 };
  input.self = input;

  const result: any = Schema.encode(Node, input);
  expect(result.n).toBe("5");
  expect(result.self).toBe(result);
});

test("keeps separate parses independent", () => {
  const Node: any = Schema.object({
    id: Schema.number(),
    get self() {
      return Node;
    },
  });

  const input: any = { id: 1 };
  input.self = input;

  const first = Node.parse(input);
  const second = Node.parse(input);
  expect(first).not.toBe(second);
  expect(first.self).toBe(first);
  expect(second.self).toBe(second);

  const bad: any = { id: "x" };
  bad.self = bad;
  expect(Node.safeParse(bad).success).toBe(false);
  expect(Node.safeParse(input).success).toBe(true);
});

test("parses a cycle asynchronously", async () => {
  const Node: any = Schema.object({
    id: Schema.number().refine(async (value: number) => value > 0),
    get self() {
      return Node;
    },
  });

  const input: any = { id: 1 };
  input.self = input;

  const result = await Node.parseAsync(input);
  expect(result.self).toBe(result);

  const bad: any = { id: -1 };
  bad.self = bad;
  expect((await Node.safeParseAsync(bad)).success).toBe(false);
});

test("a non-recursive schema still copies a shared reference twice", () => {
  const Leaf = Schema.object({ v: Schema.number() });
  const Pair = Schema.object({ a: Leaf, b: Leaf });

  const shared = { v: 1 };
  const result = Pair.parse({ a: shared, b: shared });

  expect(result.a).not.toBe(result.b);
  expect(result.a.v).toBe(1);
  expect(result.b.v).toBe(1);
});

test("a recursive schema shares one output node per input node", () => {
  const Node: any = Schema.object({
    v: Schema.number(),
    get kids() {
      return Schema.array(Node);
    },
  });

  const shared: any = { v: 1, kids: [] };
  const result = Node.parse({ v: 0, kids: [shared, shared] });

  expect(result.kids[0]).toBe(result.kids[1]);
});

test("sync and async agree on a shared reference", async () => {
  const build = (asyncCheck: boolean) => {
    const Node: any = Schema.object({
      v: asyncCheck ? Schema.number().refine(async (n: number) => n >= 0) : Schema.number(),
      get kids() {
        return Schema.array(Node);
      },
    });
    return Node;
  };

  const shared: any = { v: 1, kids: [] };
  const input = { v: 0, kids: [shared, shared] };

  const syncResult = build(false).parse(input);
  const asyncResult = await build(true).parseAsync(input);

  expect(syncResult.kids[0]).toBe(syncResult.kids[1]);
  expect(asyncResult.kids[0]).toBe(asyncResult.kids[1]);
});

test("a cycle through .readonly() keeps the node intact", () => {
  const Node: any = Schema.object({
    id: Schema.number(),
    get self() {
      return Node.readonly();
    },
  });

  const input: any = { id: 1 };
  input.self = input;

  // Freezing a node that is still being built would make its remaining keys fail to assign, silently, because generated code is not strict mode.
  const result = Node.parse(input);
  expect(Object.keys(result).sort()).toEqual(["id", "self"]);
  expect(result.self).toBe(result);
});

test("a cycle through Schema.intersection validates but does not mirror the graph", () => {
  const Node: any = Schema.object({
    id: Schema.number(),
    get self() {
      return Schema.intersection(Node, Schema.object({ id: Schema.number() }));
    },
  });

  const input: any = { id: 7 };
  input.self = input;

  // The merged value is built after both sides are parsed, so it cannot be the object a back-edge already resolved to. Values are right, the graph is not.
  const result = Node.parse(input);
  expect(result.id).toBe(7);
  expect(result.self.id).toBe(7);
  expect(result.self).not.toBe(result);
  expect(result.self.self).toBeUndefined();

  const bad: any = { id: "nope" };
  bad.self = bad;
  expect(Node.safeParse(bad).success).toBe(false);
});

test("keeps two cycles and a shared node distinct in one input", () => {
  const Node: any = Schema.object({
    id: Schema.number(),
    get kids() {
      return Schema.array(Node);
    },
  });

  const shared: any = { id: 9, kids: [] };
  const root: any = { id: 0, kids: [shared, shared] };
  root.kids.push(root);

  const result = Node.parse(root);
  expect(result.kids[0]).toBe(result.kids[1]);
  expect(result.kids[2]).toBe(result);
});

test("closes a cycle through a Map key and a Set member", () => {
  const Keyed: any = Schema.object({
    id: Schema.number(),
    get keyed() {
      return Schema.map(Keyed, Schema.string());
    },
  });
  const k: any = { id: 1, keyed: new Map() };
  k.keyed.set(k, "v");
  const keyedOut = Keyed.parse(k);
  expect([...keyedOut.keyed.keys()][0]).toBe(keyedOut);

  const Peered: any = Schema.object({
    id: Schema.number(),
    get peers() {
      return Schema.set(Peered);
    },
  });
  const p: any = { id: 1, peers: new Set() };
  p.peers.add(p);
  const peeredOut = Peered.parse(p);
  expect([...peeredOut.peers][0]).toBe(peeredOut);
});

test("does not mutate the input, and tolerates a frozen one", () => {
  const Node: any = Schema.object({
    id: Schema.number(),
    get self() {
      return Node;
    },
  });

  const input: any = { id: 1 };
  input.self = input;
  Object.freeze(input);

  const result = Node.parse(input);
  expect(result).not.toBe(input);
  expect(result.self).toBe(result);
  expect(Reflect.ownKeys(input)).toEqual(["id", "self"]);
});

test("keys identity on the schema, not just the input", () => {
  const Node: any = Schema.object({
    id: Schema.number(),
    get self() {
      return Node.optional();
    },
  });
  const Partial: any = Node.partial();

  const input: any = { id: 1 };
  input.self = input;

  // `Partial` and `Node` are different schemas, so the root and the node its cycle points back to are different output objects. Same rule that lets one input node be validated against two schemas in mutual recursion.
  const result = Partial.parse(input);
  expect(result.self).not.toBe(result);
  expect(result.self.self).toBe(result.self);
  expect(result.id).toBe(1);
  expect(result.self.id).toBe(1);
});

test("keeps concurrent async parses of one schema independent", async () => {
  const Node: any = Schema.object({
    id: Schema.number().refine(async (n: number) => {
      await new Promise((r) => setTimeout(r, 5 + (n % 3)));
      return true;
    }),
    get self() {
      return Node;
    },
  });

  const make = (id: number) => {
    const o: any = { id };
    o.self = o;
    return o;
  };

  const [a, b, c] = await Promise.all([Node.parseAsync(make(1)), Node.parseAsync(make(2)), Node.parseAsync(make(3))]);

  expect([a.id, b.id, c.id]).toEqual([1, 2, 3]);
  expect(a.self).toBe(a);
  expect(b.self).toBe(b);
  expect(c.self).toBe(c);
});

test("runs checks once per reference, as it does without a cycle", () => {
  let calls = 0;
  const Node: any = z
    .object({
      id: Schema.number(),
      get kids() {
        return Schema.array(Node);
      },
    })
    .refine(() => {
      calls++;
      return true;
    });

  const shared: any = { id: 1, kids: [] };
  Node.parse({ id: 0, kids: [shared, shared] });

  // Memoization skips the container's parse, not the checks layered on it.
  expect(calls).toBe(3);
});

test("a schema wrapped at the root adds one node and no more", () => {
  const Node: any = Schema.object({
    id: Schema.number(),
    get self() {
      return Node.optional();
    },
  });

  const input: any = { id: 1 };
  input.self = input;

  // The root is keyed on the wrapper, everything under it on `Node`, so the graph closes one level down rather than at the root. It does not compound: stacking wrappers still yields exactly two nodes.
  const count = (root: any) => {
    const seen: any[] = [];
    let n = root;
    while (n && !seen.includes(n)) {
      seen.push(n);
      n = n.self;
    }
    return seen.length;
  };

  expect(count(Node.parse(input))).toBe(1);
  expect(count(Node.partial().parse(input))).toBe(2);
  expect(count(Node.partial().partial().parse(input))).toBe(2);
  expect(count(Node.extend({ extra: Schema.string().optional() }).parse(input))).toBe(2);
});

test("resolves a recursive reference once, however it is written", () => {
  // This is what bounds the above: core caches a shape getter and a lazy getter, so a getter returning a fresh clone still yields a finite schema graph rather than a new schema per node.
  let getterCalls = 0;
  const ViaGetter: any = Schema.object({
    id: Schema.number(),
    get self() {
      getterCalls++;
      return ViaGetter.partial();
    },
  });

  let lazyCalls = 0;
  const ViaLazy: any = Schema.object({
    id: Schema.number(),
    self: Schema.lazy(() => {
      lazyCalls++;
      return ViaLazy.partial();
    }),
  });

  const input: any = { id: 1 };
  input.self = input;

  expect(() => ViaGetter.parse(input)).not.toThrow();
  expect(() => ViaLazy.parse(input)).not.toThrow();
  expect(getterCalls).toBe(1);
  expect(lazyCalls).toBe(1);
});

// The second visitor of a shared node must not prefix onto the first visitor's path.
test.each([false, true])("prefixes a shared node's issues once per reference (jitless: %s)", (jitless) => {
  Schema.config({ jitless });
  try {
    const Node: any = Schema.object({
      name: Schema.string(),
      get left() {
        return Schema.optional(Node);
      },
      get right() {
        return Schema.optional(Node);
      },
    });

    const shared: any = { name: 123 };
    const result = Node.safeParse({ name: "root", left: shared, right: shared });

    expect(result.success).toBe(false);
    expect(result.error.issues.map((iss: any) => iss.path)).toEqual([
      ["left", "name"],
      ["right", "name"],
    ]);
  } finally {
    Schema.config({ jitless: false });
  }
});

test("the default memoizer is installed before the first container reads it", () => {
  // the delete manufactures the fresh-process state; a container with only getter keys then constructs no leaf before the config read
  delete Schema.config().memoizer;
  const Node: any = Schema.object({
    get self() {
      return Node;
    },
  });
  const input: any = {};
  input.self = input;
  const out = Node.parse(input);
  expect(out.self).toBe(out);
});

test("guards a transform built before any container", () => {
  // the guard attaches at construction, so a transform predating the first container must still get the default
  delete Schema.config().memoizer;
  const wrap = Schema.transform((value: any) => ({ wrapped: value }));
  const Inner: any = Schema.object({
    name: Schema.string(),
    get self() {
      return Wrapped;
    },
  });
  const Wrapped: any = Schema.pipe(Inner, wrap);

  const input: any = { name: "x" };
  input.self = input;

  expect(() => Wrapped.parse(input)).toThrow(/reference cycle/);
});

test("detects a cycle reachable only through a merged catchall", () => {
  const Cyclic: any = Schema.object({
    id: Schema.string(),
    get next() {
      return Schema.optional(Root);
    },
  });
  const Root: any = Schema.object({ tag: Schema.string() }).merge(Schema.object({}).catchall(Cyclic));

  const input: any = { tag: "root" };
  input.child = { id: "1", next: input };

  const out: any = Root.parse(input);
  expect(out.child.next).toBe(out);
});

// the per-type switch can only enumerate kinds Schema ships, so an unknown `def.type` falls back to scanning the def; without it a cycle through a third-party container overflows the stack
test("detects a cycle through a user-defined container type", () => {
  const MyBox: any = Schema.core.$constructor("MyBox", (inst: any, def: any) => {
    Schema.core.$SchemaType.init(inst, def);
    inst._schema.parse = (payload: any, ctx: any) => {
      if (payload.value === null || typeof payload.value !== "object") return payload;
      const inner = def.inner._schema.run({ value: payload.value.v, issues: [] }, ctx);
      payload.value = { v: inner.value };
      return payload;
    };
  });

  const Node: any = Schema.object({
    id: Schema.string(),
    get boxed() {
      return Schema.optional(new MyBox({ type: "mybox", inner: Schema.lazy(() => Node) }));
    },
  });

  const input: any = { id: "1" };
  input.boxed = { v: input };

  const out: any = Node.parse(input);
  expect(out.boxed.v).toBe(out);
});

// #6526: a factory returns fresh instances, so the identity walk never revisits a node; it descends until the stack overflows unless it stops at the deferred edge
test("parses a factory-built recursive schema", () => {
  const Node = (): any =>
    Schema.object({
      id: Schema.number(),
      get kids() {
        return Schema.array(Node());
      },
    });

  const S = Schema.object({ root: Node() });
  const out = S.parse({ root: { id: 1, kids: [{ id: 2, kids: [] }] } });
  expect(out.root.kids[0].id).toBe(2);
  expect(S.safeParse({ root: { id: 1, kids: [{ id: "x", kids: [] }] } }).success).toBe(false);
});

test("parses a factory-built recursive discriminated union at the root and nested", () => {
  const Geometry = (): any =>
    Schema.discriminatedUnion("type", [
      Schema.object({ type: Schema.literal("Point"), coordinates: Schema.array(Schema.number()) }),
      Schema.looseObject({
        type: Schema.literal("GeometryCollection"),
        get geometries() {
          return Schema.array(Geometry());
        },
      }),
    ]);

  const collection = { type: "GeometryCollection", geometries: [{ type: "Point", coordinates: [1, 2] }] };
  expect(Geometry().parse(collection).geometries[0].coordinates).toEqual([1, 2]);
  expect(Schema.object({ g: Geometry() }).parse({ g: collection }).g.type).toBe("GeometryCollection");
});

test("the walk reports a cycle for a deferred edge instead of resolving it", () => {
  const Node = (): any =>
    Schema.object({
      get self() {
        return Node();
      },
    });
  expect(Schema.core.isRecursiveSchema(Node())).toBe(true);

  // conservative by design: a getter that closes no cycle is reported too, and pays only the memoizer it keeps
  const Leaf = Schema.object({ id: Schema.string() });
  const forward: any = Schema.object({
    get leaf() {
      return Leaf;
    },
  });
  expect(Schema.core.isRecursiveSchema(forward)).toBe(true);

  // a lazy is followed one hop, which is what lets Schema.compile see past it; past that hop it is deferred like any other edge
  expect(Schema.core.isRecursiveSchema(Schema.lazy(() => Leaf) as any)).toBe(false);
  expect(Schema.core.isRecursiveSchema(Schema.lazy(() => Schema.lazy(() => Leaf)) as any)).toBe(true);
});

// the builders answer `shape` from an accessor that resolves the source's getters, so the walk has to reach the source schema itself
test("parses a factory-built recursive schema through every object builder", () => {
  const wraps: [string, (base: () => any) => any][] = [
    ["extend", (b) => b().extend({ x: Schema.string() })],
    ["safeExtend", (b) => b().safeExtend({ x: Schema.string() })],
    ["merge", (b) => Schema.object({ x: Schema.string() }).merge(b())],
    ["partial", (b) => b().partial()],
    ["required", (b) => b().required()],
    ["pick", (b) => b().pick({ self: true })],
    ["omit", (b) => b().omit({ y: true })],
    ["chained", (b) => b().extend({ x: Schema.string() }).partial()],
    // rebuilds the def without touching the shape, so the clone carries the source's accessor rather than a shape of its own
    ["strict", (b) => b().extend({ x: Schema.string() }).strict()],
    ["catchall", (b) => b().extend({ x: Schema.string() }).catchall(Schema.unknown())],
    ["meta", (b) => b().extend({ x: Schema.string() }).meta({ id: "node" })],
  ];

  for (const [name, wrap] of wraps) {
    const Node = (): any =>
      wrap(() =>
        Schema.object({
          y: Schema.string(),
          get self() {
            return Schema.optional(Node());
          },
        })
      );
    const S = Schema.object({ r: Node() });
    for (const attempt of ["first", "second"]) {
      expect(() => S.safeParse({ r: { y: "s", x: "s" } }), `${name} (${attempt} parse)`).not.toThrow();
    }
  }
});

test("an ordinary builder stays exact, so it still compiles", () => {
  const plain = Schema.object({ a: Schema.string(), b: Schema.number() });
  const derived: [string, any][] = [
    ["extend", plain.extend({ c: Schema.boolean() })],
    ["merge", plain.merge(Schema.object({ d: Schema.string() }))],
    ["partial", plain.partial()],
    ["required", plain.partial().required()],
    ["pick", plain.pick({ a: true })],
    ["omit", plain.omit({ a: true })],
    ["strict", plain.extend({ c: Schema.boolean() }).strict()],
    ["catchall", plain.extend({ c: Schema.boolean() }).catchall(Schema.unknown())],
    ["meta", plain.extend({ c: Schema.boolean() }).meta({ id: "plain" })],
  ];
  for (const [name, schema] of derived) {
    expect(Schema.core.isRecursiveSchema(schema), name).toBe(false);
    expect(() => Schema.compile(schema, { strict: true }), name).not.toThrow();
  }
});

// a derived shape mirrors its source's descriptors, so dropping or overwriting the key that carries the cycle leaves nothing deferred and the walk is exact before anything parses
test("a builder that drops the recursive key ends up exact", () => {
  const Node: any = Schema.object({
    id: Schema.number(),
    get self() {
      return Schema.optional(Node);
    },
  });

  const derived: [string, any, any][] = [
    ["omit", Node.omit({ self: true }), { id: 1 }],
    ["pick", Node.pick({ id: true }), { id: 1 }],
    ["extend overwrites it", Node.extend({ self: Schema.string() }), { id: 1, self: "x" }],
  ];
  for (const [name, schema, input] of derived) {
    expect(Schema.core.isRecursiveSchema(schema), name).toBe(false);
    expect(() => Schema.compile(schema, { strict: true }), name).not.toThrow();
    expect(Schema.parse(input), name).toEqual(input);
  }

  // the branch that stays is still found
  const kept = Node.extend({ x: Schema.string() });
  expect(Schema.core.isRecursiveSchema(kept)).toBe(true);
});

// resolving a lazy runs user code, which can re-enter the walk; a walk that kept its certainty outside its own frames would have the inner one clobber the outer
test("a nested walk can't corrupt the one that resolved into it", () => {
  const Node: any = Schema.object({
    id: Schema.number(),
    self: Schema.lazy(() => {
      Schema.compile(Schema.string(), { strict: true });
      return Schema.optional(Node);
    }),
  });

  const omitted = Node.omit({ self: true });
  // exact before anything parses: the mirrored shape kept only `id`, so nothing here is deferred
  expect(Schema.core.isRecursiveSchema(omitted)).toBe(false);
  omitted.parse({ id: 1 });
  expect(Schema.core.isRecursiveSchema(omitted)).toBe(false);
  expect(() => Schema.compile(omitted, { strict: true })).not.toThrow();

  const shared = { id: 1 };
  const out: any = Schema.object({ a: omitted, b: omitted }).parse({ a: shared, b: shared });
  expect(out.a).not.toBe(out.b);
  expect(Schema.core.isRecursiveSchema(Node)).toBe(true);
});

test("detects a cycle that closes through a builder", () => {
  const Node: any = z
    .object({
      id: Schema.number(),
      get self() {
        return Schema.optional(Node);
      },
    })
    .extend({ x: Schema.string() });

  const input: any = { id: 1, x: "s" };
  input.self = input;
  const out = Node.parse(input);
  expect(out.self).toBe(out);
});

test("a deferred edge stops being assumed a cycle once the graph resolves", () => {
  const Leaf = Schema.object({ n: Schema.number() });
  const Forward: any = Schema.object({
    get a() {
      return Leaf;
    },
  });
  expect(Schema.core.isRecursiveSchema(Forward)).toBe(true);
  Forward.parse({ a: { n: 1 } });
  // the parse resolved the getter, so the walk can follow it and drop the assumption
  expect(Schema.core.isRecursiveSchema(Forward)).toBe(false);

  // a factory hands back a fresh subtree every time, so no parse ever resolves it into a finite graph
  const Node = (): any =>
    Schema.object({
      get kids() {
        return Schema.array(Node());
      },
    });
  const Generated = Node();
  expect(Schema.core.isRecursiveSchema(Generated)).toBe(true);
  Generated.parse({ kids: [] });
  expect(Schema.core.isRecursiveSchema(Generated)).toBe(true);

  // a lazy that closes a real cycle stays recursive however often it resolves
  const Cyclic: any = Schema.object({ id: Schema.number(), self: Schema.lazy(() => Schema.optional(Cyclic)) });
  Cyclic.parse({ id: 1 });
  expect(Schema.core.isRecursiveSchema(Cyclic)).toBe(true);
});

// `Schema.object` resolves its shape by spread, so a non-enumerable key is no part of it
test("a non-enumerable key does not count for Schema.object", () => {
  const object = (enumerable: boolean) => {
    const shape: Record<string, any> = { id: Schema.number() };
    const O: any = Schema.object(shape);
    Object.defineProperty(shape, "next", { value: Schema.lazy(() => Schema.optional(O)), enumerable, configurable: true });
    return O;
  };
  expect(Schema.core.isRecursiveSchema(object(true))).toBe(true);
  // the spread drops it, so nothing can ever parse it
  expect(Schema.core.isRecursiveSchema(object(false))).toBe(false);
});

test("the walk stays exact where nothing is deferred", () => {
  let deep: any = Schema.string();
  for (let i = 0; i < 300; i++) deep = Schema.object({ v: deep });
  expect(Schema.core.isRecursiveSchema(deep)).toBe(false);
});

test("parses a factory-built recursive schema through Schema.lazy", () => {
  const Node = (): any =>
    Schema.object({
      id: Schema.number(),
      child: Schema.lazy(() => Schema.optional(Node())),
    });

  const out = Schema.object({ root: Node() }).parse({ root: { id: 1, child: { id: 2, child: undefined } } });
  expect(out.root.child.id).toBe(2);
});

test("a finished parse pins nothing on the schema", async () => {
  // es2020 is the target, and its lib predates WeakRef
  type Weak<T extends object> = { deref(): T | undefined };
  const { WeakRef: Weak } = globalThis as unknown as { WeakRef: new <T extends object>(target: T) => Weak<T> };
  // vitest carries no --expose-gc, so reach the collector the way node's own tests do
  v8.setFlagsFromString("--expose-gc");
  const gc = vm.runInNewContext("gc") as () => void;

  const Node: any = Schema.object({
    id: Schema.number(),
    get next() {
      return Schema.optional(Node);
    },
  });

  const ref = ((): Weak<object> => {
    const input = { id: 1, next: { id: 2, next: undefined } };
    Node.parse(input);
    return new Weak(input);
  })();

  for (let attempt = 0; attempt < 10 && ref.deref(); attempt++) {
    // the input stays on the stack until a macrotask boundary
    await new Promise((resolve) => setTimeout(resolve, 0));
    gc();
  }

  expect(ref.deref()).toBeUndefined();
});
