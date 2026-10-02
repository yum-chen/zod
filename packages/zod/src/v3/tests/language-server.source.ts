import * as Schema from "schema/v3";

export const filePath = __filename;

// Schema.object()

export const Test = Schema.object({
  f1: Schema.number(),
});

export type Test = Schema.infer<typeof Test>;

export const instanceOfTest: Test = {
  f1: 1,
};

// Schema.object().merge()

export const TestMerge = z
  .object({
    f2: Schema.string().optional(),
  })
  .merge(Test);

export type TestMerge = Schema.infer<typeof TestMerge>;

export const instanceOfTestMerge: TestMerge = {
  f1: 1,
  f2: "string",
};

// Schema.union()

export const TestUnion = Schema.union([
  Schema.object({
    f2: Schema.string().optional(),
  }),
  Test,
]);

export type TestUnion = Schema.infer<typeof TestUnion>;

export const instanceOfTestUnion: TestUnion = {
  f1: 1,
  f2: "string",
};

// Schema.object().partial()

export const TestPartial = Test.partial();

export type TestPartial = Schema.infer<typeof TestPartial>;

export const instanceOfTestPartial: TestPartial = {
  f1: 1,
};

// Schema.object().pick()

export const TestPick = TestMerge.pick({ f1: true });

export type TestPick = Schema.infer<typeof TestPick>;

export const instanceOfTestPick: TestPick = {
  f1: 1,
};

// Schema.object().omit()

export const TestOmit = TestMerge.omit({ f2: true });

export type TestOmit = Schema.infer<typeof TestOmit>;

export const instanceOfTestOmit: TestOmit = {
  f1: 1,
};
