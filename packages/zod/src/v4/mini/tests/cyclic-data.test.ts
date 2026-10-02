import { beforeEach, expect, test } from "vitest";
import * as Schema from "schema/mini";

// the config object lives on globalThis, so only file isolation protects it; pin the unset precondition explicitly
beforeEach(() => {
  delete Schema.config().memoizer;
});

const cyclic = (): any => {
  const input: any = { id: 1 };
  input.self = input;
  return input;
};

test("cyclic input needs the memoizer opt-in", () => {
  const Before: any = Schema.object({
    id: Schema.number(),
    get self() {
      return Before;
    },
  });
  expect(() => Before.parse(cyclic())).toThrow(RangeError);

  Schema.config({ memoizer: Schema.memoizer() });
  const After: any = Schema.object({
    id: Schema.number(),
    get self() {
      return After;
    },
  });
  const out = After.parse(cyclic());
  expect(out.self).toBe(out);
  expect(out).not.toBe(cyclic());
  // read at construction, so a schema built before the opt-in keeps none
  expect(() => Before.parse(cyclic())).toThrow(RangeError);
});

test("the opt-in reaches every core container", () => {
  Schema.config({ memoizer: Schema.memoizer() });
  const Arr: any = Schema.array(Schema.lazy(() => Arr));
  const input: any = [];
  input.push(input);
  const out = Arr.parse(input);
  expect(out[0]).toBe(out);
});

test("rejects a cycle that closes through a transform", () => {
  Schema.config({ memoizer: Schema.memoizer() });
  const Inner: any = Schema.object({
    name: Schema.string(),
    get self() {
      return Wrapped;
    },
  });
  const Wrapped: any = Schema.pipe(
    Inner,
    Schema.transform((value: any) => ({ wrapped: value }))
  );

  const input: any = { name: "x" };
  input.self = input;

  expect(() => Wrapped.parse(input)).toThrow(/reference cycle/);
});

test("leaves a transform that is not on the cycle alone", () => {
  Schema.config({ memoizer: Schema.memoizer() });
  const Node: any = Schema.object({
    n: Schema.pipe(
      Schema.number(),
      Schema.transform((value: number) => value * 2)
    ),
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
