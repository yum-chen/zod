import { describe, expect, test } from "vitest";
import * as Schema   from "schema";

describe("Schema.input / Schema.output", () => {
  test("flat codec: input/output give the right side", () => {
    const c = Schema.codec(Schema.string(), Schema.bigint(), {
      decode: (s) => BigInt(s),
      encode: (n) => n.toString(),
    });
    expect(Schema.input(c).parse("1")).toBe("1");
    expect(Schema.output(c).parse(1n)).toBe(1n);
  });

  test("codec nested in object: output works recursively (regression #5224)", () => {
    const c = Schema.codec(Schema.string(), Schema.bigint(), {
      decode: (s) => BigInt(s),
      encode: (n) => n.toString(),
    });
    const obj = Schema.object({ b: c });

    const decoded = Schema.output(obj);
    expect(decoded.parse({ b: 1n })).toEqual({ b: 1n });

    const encoded = Schema.input(obj);
    expect(encoded.parse({ b: "1" })).toEqual({ b: "1" });
  });

  test("nested across record / map: matches the use case in #5224", () => {
    const keyCodec = Schema.codec(Schema.string(), Schema.enum(["a", "b"]), {
      decode: (s) => (s === "a" || s === "b" ? s : Schema.NEVER),
      encode: (s) => s,
    });
    const valueObject = Schema.object({
      n: Schema.codec(Schema.string(), Schema.bigint(), { decode: (s) => BigInt(s), encode: (n) => n.toString() }),
    });

    const fullCodec = Schema.codec(
      Schema.record(Schema.input(keyCodec), Schema.input(valueObject)),
      Schema.map(Schema.output(keyCodec), Schema.output(valueObject)),
      {
        decode: (input) => {
          const m = new Map<"a" | "b", { n: bigint }>();
          for (const [k, v] of Object.entries(input)) {
            m.set(keyCodec.decode(k), valueObject.decode(v));
          }
          return m;
        },
        encode: (input) => {
          const out: Record<string, { n: string }> = {};
          for (const [k, v] of input.entries()) {
            out[keyCodec.encode(k)] = valueObject.encode(v);
          }
          return out;
        },
      }
    );

    expect(fullCodec.decode({ a: { n: "1" } })).toEqual(new Map([["a", { n: 1n }]]));
    expect(fullCodec.encode(new Map([["b", { n: 2n }]]))).toEqual({ b: { n: "2" } });
  });

  test("schema without pipes is returned with identity (no clone)", () => {
    const s = Schema.object({ a: Schema.string() });
    expect(Schema.input(s)).toBe(s);
    expect(Schema.output(s)).toBe(s);
  });

  test("Schema.output carries checks attached to a pipe", () => {
    const c = z
      .codec(Schema.string(), Schema.number().int(), { decode: Number, encode: String })
      .refine((n) => n > 10, { error: "gt10" });
    const obj = Schema.object({ list: Schema.array(c) });
    const decoded = Schema.output(obj);

    expect(decoded.parse({ list: [50] })).toEqual({ list: [50] });
    // The pipe's own check and the one already on its out side both survive, in that order.
    expect(() => decoded.parse({ list: [5] })).toThrow("gt10");
    expect(() => decoded.parse({ list: [50.5] })).toThrow();
    // A pipe's checks run on the decoded value in both directions, so encode enforces them too.
    expect(() => decoded.encode({ list: [5] })).toThrow("gt10");
    // Carrying them clones the out side rather than mutating it.
    expect(c._schema.def.out._schema.def.checks).toHaveLength(1);
  });

  test("Schema.input drops a pipe's checks, which constrain a value the input side never produces", () => {
    const c = Schema.codec(Schema.string(), Schema.number(), { decode: Number, encode: String }).refine((n) => n > 10);
    expect(Schema.input(c).parse("5")).toBe("5");

    // Control: a check that isn't attached to a pipe is left alone.
    expect(() => Schema.input(Schema.object({ s: Schema.string().min(2) })).parse({ s: "a" })).toThrow();
  });

  test("Schema.input resolves past a preprocess transform, which is not a real input side", () => {
    const p = Schema.preprocess((v) => String(v), Schema.string().min(5));
    const encoded = Schema.input(p);

    expect(encoded.parse("abcde")).toBe("abcde");
    // The bare transform used to come back here: it validated nothing and re-ran the preprocessor.
    expect(() => encoded.parse(1)).toThrow();
    expect(() => encoded.parse("abc")).toThrow();
    // The same resolution the JSON Schema emitter already makes for this Schema.
    expect(Schema.toJSONSchema(p, { io: "input" })).toMatchObject({ type: "string", minLength: 5 });

    // A check on the pipe itself travels with whichever side wins.
    const checked = Schema.preprocess((v) => String(v), Schema.string()).refine((s) => s.startsWith("ok"));
    expect(Schema.input(checked).parse("okay")).toBe("okay");
    expect(() => Schema.input(checked).parse("nope")).toThrow();

    // Control: a codec has two real sides, so its input side is still `in`, by identity.
    const c = Schema.codec(Schema.string(), Schema.number(), { decode: Number, encode: String });
    expect(Schema.input(c)).toBe(c._schema.def.in);
  });

  test("a wrapper's stored value survives only on the side it belongs to", () => {
    const c = Schema.codec(Schema.string(), Schema.number(), { decode: Number, encode: String });

    // A default and a catch hold output-side values, so the input projection sheds them.
    expect(Schema.input(c.default(7)).parse(undefined)).toBe(undefined);
    expect(Schema.input(c.default(7)).parse("1")).toBe("1");
    expect(() => Schema.input(c.catch(9)).parse(123 as any)).toThrow();
    expect(Schema.input(c.catch(9)).parse("1")).toBe("1");
    expect(Schema.output(c.default(7)).parse(undefined)).toBe(7);
    expect(Schema.output(c.catch(9)).parse("zz" as any)).toBe(9);

    // A prefault is fed through the schema, so it is input-side and the output projection sheds it.
    expect(Schema.input(c.prefault("5")).parse(undefined)).toBe("5");
    expect(() => Schema.output(c.prefault("5")).parse(undefined as any)).toThrow();
    expect(Schema.output(c.prefault("5")).parse(3)).toBe(3);
  });

  test("a wrapper over a pipe-free schema keeps both its value and its identity", () => {
    const d = Schema.string().default("x");
    const k = Schema.string().catch("y");
    const f = Schema.string().prefault("z");

    expect(Schema.input(d)).toBe(d);
    expect(Schema.input(d).parse(undefined)).toBe("x");
    expect(Schema.input(k)).toBe(k);
    expect(Schema.output(f)).toBe(f);

    const obj = Schema.object({ a: Schema.string().default("q") });
    expect(Schema.input(obj)).toBe(obj);
    expect(Schema.input(obj).parse({})).toEqual({ a: "q" });
  });

  test("runtime `Schema.input` agrees with type-level `Schema.input<T>`", () => {
    const c = Schema.codec(Schema.string(), Schema.bigint(), {
      decode: (s) => BigInt(s),
      encode: (n) => n.toString(),
    });
    const obj = Schema.object({ b: c });

    // Runtime: parse the input shape.
    const parsed = Schema.input(obj).parse({ b: "1" });
    // Type: matches the declared input type.
    const asType: Schema.input<typeof obj> = parsed;
    expect(asType).toEqual({ b: "1" });
  });
});
