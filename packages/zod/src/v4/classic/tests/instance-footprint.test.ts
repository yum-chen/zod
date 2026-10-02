import { expect, test } from "vitest";

import * as zm from "schema/mini";
import * as Schema from "schema/v4";
import * as core from "schema/v4/core";

// V8 sizes an instance's property backing store in steps, and schema instances get no in-object slots (their constructor assigns nothing itself): 12 own properties cost 128 bytes, 13 cost 848, 21 cost 1616. Methods therefore live on the prototype and materialize per instance on first read. These bounds are what keeps a schema graph small; crossing one silently multiplies its memory by 6x.
const MAX_OWN_PROPS = 12;

test("schema instances stay under V8's property-count step", () => {
  const cases: Array<[string, object]> = [
    ["string", Schema.string()],
    ["number", Schema.number()],
    ["bigint", Schema.bigint()],
    ["boolean", Schema.boolean()],
    ["date", Schema.date()],
    ["enum", Schema.enum(["a", "b"])],
    ["array", Schema.array(Schema.string())],
    ["object", Schema.object({ a: Schema.string() })],
    ["record", Schema.record(Schema.string(), Schema.string())],
    ["map", Schema.map(Schema.string(), Schema.string())],
    ["set", Schema.set(Schema.string())],
    ["union", Schema.union([Schema.string(), Schema.number()])],
    ["optional", Schema.string().optional()],
    ["pipe", Schema.string().pipe(Schema.string())],
    ["email", Schema.email()],
    ["mini string", zm.string()],
    ["mini object", zm.object({ a: zm.string() })],
  ];

  const over = cases
    .map(([name, schema]) => [name, Reflect.ownKeys(schema).length] as const)
    .filter(([, count]) => count > MAX_OWN_PROPS);

  expect(over).toEqual([]);
});

test("prototype-installed members survive detaching", () => {
  const schema = Schema.string();
  const { parse, safeParse, spa } = schema;

  expect(parse("hi")).toEqual("hi");
  expect(safeParse("hi").success).toEqual(true);
  expect(["a", "b"].map((v) => parse(v))).toEqual(["a", "b"]);
  expect(spa).toBe(Schema.safeParseAsync);

  const email = Schema.email;
  expect(email().safeParse("a@b.co").success).toEqual(true);
});

test("prototype-installed members can be overwritten per instance", () => {
  const schema: any = Schema.string();
  Schema.parse = () => "overridden";

  expect(Schema.parse("anything")).toEqual("overridden");
  expect(Schema.string().parse("untouched")).toEqual("untouched");
});

test("~standard is lazy but complete", () => {
  const schema = Schema.string();

  expect(Object.prototype.hasOwnProperty.call(schema, "~standard")).toEqual(false);
  expect(schema["~standard"].vendor).toEqual("schema");
  expect(schema["~standard"].version).toEqual(1);
  expect(schema["~standard"].validate("hi")).toEqual({ value: "hi" });
  expect((schema["~standard"] as any).jsonSchema.input()).toMatchObject({ type: "string" });
  // Reading it caches on the instance, so the getter runs once.
  expect(Object.prototype.hasOwnProperty.call(schema, "~standard")).toEqual(true);
});

test("caching a lazy member preserves its original enumerability", () => {
  const schema = Schema.string();

  // Methods were enumerable own properties before they moved to the prototype, so touching one still surfaces it to `Object.keys`.
  void Schema.parse;
  void Schema.optional;
  expect(Object.keys(schema)).toContain("parse");
  expect(Object.keys(schema)).toContain("optional");

  // `~standard` never was an own data property, so caching it must not add it to `Object.keys` or to `JSON.stringify` of a Schema.
  void schema["~standard"];
  expect(Object.keys(schema)).not.toContain("~standard");
  expect(JSON.stringify(schema)).not.toContain("~standard");

  // An explicit assignment behaves like one, as before.
  const other: any = Schema.string();
  other["~standard"] = { vendor: "x" };
  expect(Object.keys(other)).toContain("~standard");
});

test("_def stays read-only", () => {
  expect(() => {
    (Schema.string() as any)._def = {};
  }).toThrow(TypeError);
  expect(() => {
    (Schema.function({ input: [Schema.string()], output: Schema.number() }) as any)._def = {};
  }).toThrow(TypeError);
  const schema = Schema.string();
  expect(Schema._def).toBe(Schema._schema.def);
  expect(Schema.object({ a: Schema.string() })._def.type).toEqual("object");
});

test("deferred initializers are released after construction", () => {
  expect(Schema.string()._schema.deferred).toEqual(undefined);
  expect(Schema.object({ a: Schema.string() })._schema.deferred).toEqual(undefined);
});

test("trait initializers run once per instance across repeated entry", () => {
  const calls: string[] = [];
  const Base: core.$constructor<any> = core.$constructor<any>("CountedBase", () => calls.push("base"));
  const Child: core.$constructor<any> = core.$constructor<any>("CountedChild", (inst, def) => {
    calls.push("child");
    Base.init(inst, def);
    Base.init(inst, def);
  });
  const constructed = new Child({});
  Child.init(constructed, {});
  const direct = Object.create({});
  Child.init(direct, {});
  Child.init(direct, {});
  expect(calls).toEqual(["child", "base", "child", "base"]);
  for (const inst of [constructed, direct]) {
    expect([...inst._schema.traits]).toEqual(["CountedChild", "CountedBase"]);
    expect(inst instanceof Base).toBe(true);
    expect(inst instanceof Child).toBe(true);
  }
  expect(constructed._schema.traits).not.toBe(direct._schema.traits);
});

test("a trait initializer called directly still installs its members", () => {
  // a direct `init` installs onto the receiver's own prototype, since it is not below the constructor's
  Schema.string();

  const proto = {};
  const inst = Object.create(proto) as Schema  .SchemaString;
  Schema.SchemaString.init(inst, { type: "string" });

  expect(typeof inst.email).toBe("function");
  expect(typeof inst.optional).toBe("function");
  expect(Object.prototype.hasOwnProperty.call(proto, "email")).toBe(true);
});

test("a nested init during a repeat construction still installs its members", () => {
  // the install used to read a module-level flag the outer construction set, so a nested `init` on an unrelated receiver inherited an answer that was not about it
  const seen: string[] = [];

  // an assertion signature needs the call target explicitly annotated
  const Nested: core.$constructor<any> = core.$constructor<any>("Nested", () => {}, {
    tag() {
      return "nested";
    },
  });
  const Outer = core.$constructor<any>("Outer", (_inst, def) => {
    if (!def.nest) return;
    // not a plain `{}`: the install target would resolve to `Object.prototype` and leak `tag` into every object the worker touches
    const plain: any = Object.create({});
    Nested.init(plain, {});
    seen.push(typeof plain.tag);
  });

  new Outer({ nest: false });
  new Outer({ nest: true });

  expect(seen).toEqual(["function"]);
});

test("a derived trait's members win over the ones it composes", () => {
  // Classic installs a richer `~standard` over core's. Trait dedupe is what orders them: core's initializer runs once, at the first `init` that reaches it, so classic's always lands second.
  expect(typeof (Schema.string()["~standard"] as any).jsonSchema.input).toBe("function");
});

test("a live member keeps the descriptor a prototype member had", () => {
  // An object literal's getter is enumerable; the `defineProperty` it replaced was not. `for..in` over a schema is public surface, and the construction path walks the prototype with it.
  const proto = Object.getPrototypeOf(Schema.string());
  expect(Object.getOwnPropertyDescriptor(proto, "description")?.enumerable).toBe(false);
  expect(Object.getOwnPropertyDescriptor(proto, "_def")?.enumerable).toBe(false);
  // a derived member installs like a literal's accessor: not enumerable, still configurable
  expect(Object.getOwnPropertyDescriptor(proto, "minLength")).toMatchObject({ enumerable: false, configurable: true });

  // the derived metadata members live on the prototype and shadow as own data on first read
  const schema = Schema.string();
  const keys: string[] = [];
  for (const k in schema) keys.push(k);
  expect(keys).toEqual(["def", "type"]);
  expect(Schema.minLength).toBe(null);
  expect(Object.keys(schema)).toContain("minLength");
});

test("a live member is not cached per instance", () => {
  const schema = Schema.string();

  expect(Schema.description).toBe(undefined);
  core.globalRegistry.add(schema, { description: "later" });
  expect(Schema.description).toBe("later");
  expect(Object.prototype.hasOwnProperty.call(schema, "description")).toBe(false);
});

test("constructing through a subclass does not strip the base prototype", () => {
  // `super(def)` gives `this` a prototype of `new.target.prototype`, so a constructor can complete a construction without having built its own prototype.
  const MyString: new (def: { type: "string" }) => Schema.SchemaString = class extends (Schema.SchemaString as any) {} as any;
  new MyString({ type: "string" });

  const plain = Schema.string();
  expect(plain.parse("x")).toBe("x");
  expect(typeof plain.email).toBe("function");
  expect(typeof new MyString({ type: "string" }).email).toBe("function");
});

test("a subclass's own members survive the install", () => {
  // The members go on the prototype of the constructor that built the instance, so a subclass's own prototype keeps what it declared. `Schema.symbol()` is constructed nowhere else here, which puts the subclass before its base — the ordering the install has to get right. Asserted rather than assumed, so warming it elsewhere fails the test instead of hollowing it out.
  expect(Object.prototype.hasOwnProperty.call((Schema.SchemaSymbol as any).prototype, "parse")).toBe(false);
  const First = class extends (Schema.SchemaSymbol as any) {
    parse() {
      return "PARSE";
    }
    optional() {
      return "OPTIONAL";
    }
  } as any;
  const first = new First({ type: "symbol" });
  expect(first.parse(Symbol())).toBe("PARSE");
  expect(first.optional()).toBe("OPTIONAL");
  const sym = Symbol();
  expect(Schema.symbol().parse(sym)).toBe(sym);

  // and the other way round, with the base prototype already built by one of the `Schema.number()` calls above. Asserted for the same reason: warm it nowhere and this block quietly becomes a second copy of the cold case.
  expect(Object.prototype.hasOwnProperty.call((Schema.SchemaNumber as any).prototype, "parse")).toBe(true);
  const Second = class extends (Schema.SchemaNumber as any) {
    parse() {
      return "SECOND";
    }
  } as any;
  expect(new Second({ type: "number" }).parse(1)).toBe("SECOND");

  // two levels deep: neither prototype takes a copy, so the inherited member is one function
  const Third = class extends (Second as any) {} as any;
  new Third({ type: "number" });
  expect(Second.prototype.parse).toBe(Third.prototype.parse);
});

test("a hand-written getter member accepts assignment", () => {
  // Every member was an accessor with a setter before they moved onto `proto`, so a getter written by hand needs one too.
  const schema: any = Schema.string();
  Schema.spa = () => "SPA";
  Schema.toJSONSchema = () => "JSON";
  expect(Schema.spa()).toBe("SPA");
  expect(Schema.toJSONSchema()).toBe("JSON");

  const mini: any = zm.string();
  mini.with = () => "WITH";
  expect(mini.with()).toBe("WITH");

  // a derived metadata member accepts assignment before its first read, as it did as an own property
  const derived = Schema.number().min(2);
  derived.minValue = 99;
  expect(derived.minValue).toBe(99);
  expect(Object.keys(derived)).toContain("minValue");

  // and, like every prototype member, recomputes after deletion rather than staying absent
  delete (derived as any).minValue;
  expect(derived.minValue).toBe(2);
});

test("shape is lazy and stays out of Object.keys", () => {
  const schema = Schema.object({ a: Schema.string() });

  expect(Object.prototype.hasOwnProperty.call(schema, "shape")).toEqual(false);
  expect("shape" in schema).toEqual(true);
  expect(Object.keys(schema)).not.toContain("shape");
  expect({ ...schema }).not.toHaveProperty("shape");

  expect(Object.keys(Schema.shape)).toEqual(["a"]);

  // Reading caches a non-enumerable own data property. An own accessor here would put every later object schema into V8 dictionary mode.
  expect(Object.prototype.hasOwnProperty.call(schema, "shape")).toEqual(true);
  expect(Object.getOwnPropertyDescriptor(schema, "shape")).toMatchObject({
    writable: true,
    enumerable: false,
    configurable: true,
  });
  expect(Object.keys(schema)).not.toContain("shape");

  const mini = zm.object({ a: zm.string() });
  expect(Object.prototype.hasOwnProperty.call(mini, "shape")).toEqual(false);
  expect(Object.keys(mini.shape)).toEqual(["a"]);
  expect(Object.keys(mini)).not.toContain("shape");
});

test("shape accepts repeated assignment and recomputes after deletion", () => {
  const schema: any = Schema.object({ a: Schema.string() });

  Schema.shape = { b: Schema.number() };
  expect(Object.keys(Schema.shape)).toEqual(["b"]);
  // The cached property stays writable, so a second assignment does not throw in strict mode.
  Schema.shape = { c: Schema.boolean() };
  expect(Object.keys(Schema.shape)).toEqual(["c"]);

  // Deleting clears the memo rather than removing the property, since the accessor lives on the prototype.
  delete Schema.shape;
  expect(Object.keys(Schema.shape)).toEqual(["a"]);
});

test("a self-referential shape getter breaks the cycle instead of recursing", () => {
  const Self: any = Schema.object({
    a: Schema.string(),
    get b() {
      return Schema.array(Schema.object(Self.shape));
    },
  });
  expect(Object.keys(Self.shape)).toEqual(["a", "b"]);

  const Mini: any = zm.object({
    a: zm.string(),
    get b() {
      return zm.array(zm.object(Mini.shape));
    },
  });
  expect(Object.keys(Mini.shape)).toEqual(["a", "b"]);
});
