import { type } from "arktype";
import * as Schema from "schema/v4";
import * as zcore from "schema/v4/core";
import { metabench } from "./metabench.js";

const caseOrder = ["simple", "nested", "array", "array-objects", "du", "intersection", "xor"] as const;
type BenchmarkCase = (typeof caseOrder)[number];

const caseLabels: Record<BenchmarkCase, string> = {
  simple: "simple object",
  nested: "nested object",
  array: "array of numbers",
  "array-objects": "array of objects",
  du: "discriminated union",
  intersection: "intersection",
  xor: "xor",
};

const caseAliases: Record<string, BenchmarkCase | "all"> = {
  all: "all",
  simple: "simple",
  nested: "nested",
  array: "array",
  "array-objects": "array-objects",
  du: "du",
  "discriminated-union": "du",
  intersection: "intersection",
  xor: "xor",
};

type ParsedArgs = {
  cases: BenchmarkCase[];
  list: boolean;
};

function printAvailableCases(): void {
  console.log("Available benchmark cases:");
  for (const caseName of caseOrder) {
    const alias = caseName === "du" ? " (alias: discriminated-union)" : "";
    console.log(`  ${caseName}${alias} - ${caseLabels[caseName]}`);
  }
  console.log("  all - run every benchmark case");
}

function parseCaseValue(value: string): string[] {
  const cases = value
    .split(",")
    .map((caseName) => caseName.trim())
    .filter(Boolean);
  if (cases.length === 0) {
    throw new Error("--case requires a non-empty case name");
  }
  return cases;
}

function parseArgs(argv: string[]): ParsedArgs {
  const requestedCases: string[] = [];
  let list = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--") continue;
    if (arg === "--list") {
      list = true;
      continue;
    }
    if (arg === "--case") {
      const value = argv[++i];
      if (!value || value.startsWith("--")) {
        throw new Error("--case requires a value, e.g. --case simple");
      }
      requestedCases.push(...parseCaseValue(value));
      continue;
    }
    if (arg.startsWith("--case=")) {
      requestedCases.push(...parseCaseValue(arg.slice("--case=".length)));
      continue;
    }
    throw new Error(`Unknown argument "${arg}". Use --case <name> or --list.`);
  }

  if (requestedCases.length === 0) {
    return { cases: [...caseOrder], list };
  }

  const selectedCases = new Set<BenchmarkCase>();
  for (const requestedCase of requestedCases) {
    const caseName = caseAliases[requestedCase];
    if (!caseName) {
      throw new Error(`Unknown benchmark case "${requestedCase}".`);
    }
    if (caseName === "all") {
      return { cases: [...caseOrder], list };
    }
    selectedCases.add(caseName);
  }

  return { cases: caseOrder.filter((caseName) => selectedCases.has(caseName)), list };
}

function parseArgsOrExit(): ParsedArgs {
  try {
    return parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    printAvailableCases();
    process.exit(1);
  }
}

const parsedArgs = parseArgsOrExit();
if (parsedArgs.list) {
  printAvailableCases();
  process.exit(0);
}

const selectedCases = parsedArgs.cases;
const selectedCaseSet = new Set<BenchmarkCase>(selectedCases);

console.log(`Running benchmark cases: ${selectedCases.map((caseName) => caseLabels[caseName]).join(", ")}`);
console.log("");

// ============================================
// SCHEMA DEFINITIONS
// ============================================

// Simple object schema
const schemaSimple = Schema.object({
  name: Schema.string(),
  age: Schema.number(),
});

const arktypeSimple = type({
  name: "string",
  age: "number",
});

// Nested object schema (matches moltar benchmark)
const schemaNested = Schema.strictObject({
  number: Schema.number(),
  negNumber: Schema.number(),
  maxNumber: Schema.number(),
  string: Schema.string(),
  longString: Schema.string(),
  boolean: Schema.boolean(),
  deeplyNested: Schema.strictObject({
    foo: Schema.string(),
    num: Schema.number(),
    bool: Schema.boolean(),
  }),
});

const arktypeNested = type({
  number: "number",
  negNumber: "number",
  maxNumber: "number",
  string: "string",
  longString: "string",
  boolean: "boolean",
  deeplyNested: {
    foo: "string",
    num: "number",
    bool: "boolean",
  },
});

// Array schema
const schemaArray = Schema.array(Schema.number());
const arktypeArray = type("number[]");

// Array of objects
const schemaArrayOfObjects = Schema.array(Schema.object({ id: Schema.number(), name: Schema.string() }));
const arktypeArrayOfObjects = type({ id: "number", name: "string" }).array();

// Discriminated union
const schemaDiscriminated = Schema.discriminatedUnion("kind", [
  Schema.object({ kind: Schema.literal("text"), value: Schema.string() }),
  Schema.object({ kind: Schema.literal("count"), value: Schema.number() }),
  Schema.object({ kind: Schema.literal("flag"), value: Schema.boolean() }),
]);

const arktypeDiscriminated = type({
  kind: "'text'",
  value: "string",
})
  .or({ kind: "'count'", value: "number" })
  .or({ kind: "'flag'", value: "boolean" });

// Intersection / deep merge
const schemaIntersection = Schema.intersection(
  Schema.object({ nested: Schema.object({ a: Schema.string() }) }),
  Schema.object({ nested: Schema.object({ b: Schema.number() }) })
);

const schemaXor = Schema.xor([Schema.string(), Schema.number(), Schema.boolean()]);

// Compiled Schema schemas (public API) + raw fast paths (lower-level primitive)
const schemaSimpleCompiled = zcore.compile(schemaSimple);
const schemaNestedCompiled = zcore.compile(schemaNested);
const schemaArrayCompiled = zcore.compile(schemaArray);
const schemaArrayOfObjectsCompiled = zcore.compile(schemaArrayOfObjects);
const schemaDiscriminatedCompiled = zcore.compile(schemaDiscriminated);
const schemaIntersectionCompiled = zcore.compile(schemaIntersection);
// Schema.xor forces a fallback by design, so compiling it throws. Keep the case runnable: measure the runtime path the fallback would have used.
const schemaXorCompiled = (() => {
  try {
    return zcore.compile(schemaXor);
  } catch {
    return schemaXor;
  }
})();

const schemaSimpleFn = zcore.compileFn(schemaSimple);
const schemaNestedFn = zcore.compileFn(schemaNested);
const schemaArrayFn = zcore.compileFn(schemaArray);
const schemaArrayOfObjectsFn = zcore.compileFn(schemaArrayOfObjects);
const schemaDiscriminatedFn = zcore.compileFn(schemaDiscriminated);
const schemaIntersectionFn = zcore.compileFn(schemaIntersection);
const schemaXorFn = (() => {
  try {
    return zcore.compileFn(schemaXor);
  } catch {
    return (d: unknown) => schemaXor.safeParse(d);
  }
})() as any;

// ============================================
// TEST DATA
// ============================================

const simpleData = { name: "Alice", age: 30 };

const nestedData = {
  number: 1,
  negNumber: -1,
  maxNumber: Number.MAX_VALUE,
  string: "string",
  longString:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  boolean: true,
  deeplyNested: {
    foo: "bar",
    num: 1,
    bool: false,
  },
};

const arrayData = Array.from({ length: 100 }, (_, i) => i);
const arrayOfObjectsData = Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Item ${i}` }));
const discriminatedData = { kind: "count", value: 123 };
const intersectionData = { nested: { a: "x", b: 123 } };
const xorData = "hello";

// ============================================
// HANDWRITTEN VALIDATORS (baseline)
// ============================================

const INVALID = Symbol("invalid");

function handwrittenSimple(input: unknown): { name: string; age: number } | typeof INVALID {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return INVALID;
  const obj = input as Record<string, unknown>;
  if (typeof obj.name !== "string") return INVALID;
  if (typeof obj.age !== "number" || Number.isNaN(obj.age)) return INVALID;
  return { name: obj.name, age: obj.age };
}

function handwrittenNested(input: unknown): any | typeof INVALID {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return INVALID;
  const obj = input as Record<string, unknown>;
  if (typeof obj.number !== "number" || Number.isNaN(obj.number)) return INVALID;
  if (typeof obj.negNumber !== "number" || Number.isNaN(obj.negNumber)) return INVALID;
  if (typeof obj.maxNumber !== "number" || Number.isNaN(obj.maxNumber)) return INVALID;
  if (typeof obj.string !== "string") return INVALID;
  if (typeof obj.longString !== "string") return INVALID;
  if (typeof obj.boolean !== "boolean") return INVALID;
  const dn = obj.deeplyNested;
  if (typeof dn !== "object" || dn === null || Array.isArray(dn)) return INVALID;
  const dnObj = dn as Record<string, unknown>;
  if (typeof dnObj.foo !== "string") return INVALID;
  if (typeof dnObj.num !== "number" || Number.isNaN(dnObj.num)) return INVALID;
  if (typeof dnObj.bool !== "boolean") return INVALID;
  return {
    number: obj.number,
    negNumber: obj.negNumber,
    maxNumber: obj.maxNumber,
    string: obj.string,
    longString: obj.longString,
    boolean: obj.boolean,
    deeplyNested: { foo: dnObj.foo, num: dnObj.num, bool: dnObj.bool },
  };
}

function handwrittenArray(input: unknown): number[] | typeof INVALID {
  if (!Array.isArray(input)) return INVALID;
  const result = new Array(input.length);
  for (let i = 0; i < input.length; i++) {
    if (typeof input[i] !== "number" || Number.isNaN(input[i])) return INVALID;
    result[i] = input[i];
  }
  return result;
}

// ============================================
// VERIFY CORRECTNESS & CHECK OBJECT IDENTITY
// ============================================

if (selectedCaseSet.has("simple") || selectedCaseSet.has("nested")) {
  console.log("=== Correctness Check ===");
  if (selectedCaseSet.has("simple")) {
    console.log("Schema safeParse simple:", schemaSimple.safeParse(simpleData).success);
    console.log("Schema.compile() simple:", schemaSimpleCompiled.safeParse(simpleData).success);
    console.log("Schema.compileFn() simple:", schemaSimpleFn(simpleData) !== zcore.INVALID);
    console.log("Arktype simple:", !(arktypeSimple(simpleData) instanceof type.errors));
    console.log("Handwritten simple:", handwrittenSimple(simpleData) !== INVALID);
    console.log("");
  }
  if (selectedCaseSet.has("nested")) {
    console.log("Schema safeParse nested:", schemaNested.safeParse(nestedData).success);
    console.log("Schema.compile() nested:", schemaNestedCompiled.safeParse(nestedData).success);
    console.log("Schema.compileFn() nested:", schemaNestedFn(nestedData) !== zcore.INVALID);
    console.log("Arktype nested:", !(arktypeNested(nestedData) instanceof type.errors));
    console.log("Handwritten nested:", handwrittenNested(nestedData) !== INVALID);
    console.log("");
  }
}

// Check if arktype returns the same object or a new one
if (selectedCaseSet.has("simple") || selectedCaseSet.has("nested")) {
  console.log("=== Object Identity Check ===");
  if (selectedCaseSet.has("simple")) {
    const arktypeResult = arktypeSimple(simpleData);
    const schemaResult = schemaSimple.safeParse(simpleData);
    const handwrittenResult = handwrittenSimple(simpleData);

    console.log("Arktype returns same object:", arktypeResult === simpleData);
    console.log("Schema returns same object:", schemaResult.success && schemaResult.data === simpleData);
    console.log("Handwritten returns same object:", handwrittenResult === simpleData);
    console.log("");
  }

  // Check nested too
  if (selectedCaseSet.has("nested")) {
    const arktypeNestedResult = arktypeNested(nestedData);
    const schemaNestedResult = schemaNested.safeParse(nestedData);
    console.log("Arktype nested returns same object:", arktypeNestedResult === nestedData);
    console.log("Schema nested returns same object:", schemaNestedResult.success && schemaNestedResult.data === nestedData);
    console.log("");
  }
}

// ============================================
// BENCHMARKS
// ============================================

const benchmarkCases: Record<BenchmarkCase, () => Promise<void>> = {
  async simple() {
    await metabench("simple object { name, age }", {
      handwritten() {
        return handwrittenSimple(simpleData);
      },
      arktype() {
        return arktypeSimple(simpleData);
      },
      "Schema.compile().safeParse"() {
        return schemaSimpleCompiled.safeParse(simpleData);
      },
      "Schema.compileFn()"() {
        return schemaSimpleFn(simpleData);
      },
      "schema safeParse"() {
        return schemaSimple.safeParse(simpleData);
      },
    }).run();
  },
  async nested() {
    await metabench("nested object (moltar schema)", {
      handwritten() {
        return handwrittenNested(nestedData);
      },
      arktype() {
        return arktypeNested(nestedData);
      },
      "Schema.compile().safeParse"() {
        return schemaNestedCompiled.safeParse(nestedData);
      },
      "Schema.compileFn()"() {
        return schemaNestedFn(nestedData);
      },
      "schema safeParse"() {
        return schemaNested.safeParse(nestedData);
      },
    }).run();
  },
  async array() {
    await metabench("array of 100 numbers", {
      handwritten() {
        return handwrittenArray(arrayData);
      },
      arktype() {
        return arktypeArray(arrayData);
      },
      "Schema.compile().safeParse"() {
        return schemaArrayCompiled.safeParse(arrayData);
      },
      "Schema.compileFn()"() {
        return schemaArrayFn(arrayData);
      },
      "schema safeParse"() {
        return schemaArray.safeParse(arrayData);
      },
    }).run();
  },
  async "array-objects"() {
    await metabench("array of 50 objects", {
      arktype() {
        return arktypeArrayOfObjects(arrayOfObjectsData);
      },
      "Schema.compile().safeParse"() {
        return schemaArrayOfObjectsCompiled.safeParse(arrayOfObjectsData);
      },
      "Schema.compileFn()"() {
        return schemaArrayOfObjectsFn(arrayOfObjectsData);
      },
      "schema safeParse"() {
        return schemaArrayOfObjects.safeParse(arrayOfObjectsData);
      },
    }).run();
  },
  async du() {
    await metabench("discriminated union (3 branches)", {
      arktype() {
        return arktypeDiscriminated(discriminatedData);
      },
      "Schema.compile().safeParse"() {
        return schemaDiscriminatedCompiled.safeParse(discriminatedData);
      },
      "Schema.compileFn()"() {
        return schemaDiscriminatedFn(discriminatedData);
      },
      "schema safeParse"() {
        return schemaDiscriminated.safeParse(discriminatedData);
      },
    }).run();
  },
  async intersection() {
    await metabench("intersection deep merge", {
      "Schema.compile().safeParse"() {
        return schemaIntersectionCompiled.safeParse(intersectionData);
      },
      "Schema.compileFn()"() {
        return schemaIntersectionFn(intersectionData);
      },
      "schema safeParse"() {
        return schemaIntersection.safeParse(intersectionData);
      },
    }).run();
  },
  async xor() {
    await metabench("xor union (3 branches, one match)", {
      "Schema.compile().safeParse"() {
        return schemaXorCompiled.safeParse(xorData);
      },
      "Schema.compileFn()"() {
        return schemaXorFn(xorData);
      },
      "schema safeParse"() {
        return schemaXor.safeParse(xorData);
      },
    }).run();
  },
};

for (const caseName of selectedCases) {
  console.log(`=== Running case: ${caseName} (${caseLabels[caseName]}) ===`);
  await benchmarkCases[caseName]();
}
