import { describe, expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/v4";

const isoDateCodec = Schema.codec(
  Schema.iso.datetime(), // Input: ISO string (validates to string)
  Schema.date(), // Output: Date object
  {
    decode: (isoString) => new Date(isoString), // Forward: ISO string → Date
    encode: (date) => date.toISOString(), // Backward: Date → ISO string
  }
);

test("instanceof", () => {
  expect(isoDateCodec instanceof Schema.SchemaCodec).toBe(true);
  expect(isoDateCodec instanceof Schema.SchemaPipe).toBe(true);
  expect(isoDateCodec instanceof Schema.SchemaType).toBe(true);
  expect(isoDateCodec instanceof Schema.core.$SchemaCodec).toBe(true);
  expect(isoDateCodec instanceof Schema.core.$SchemaPipe).toBe(true);
  expect(isoDateCodec instanceof Schema.core.$SchemaType).toBe(true);

  expectTypeOf(isoDateCodec.def).toEqualTypeOf<Schema.core.$SchemaCodecDef<Schema.SchemaISODateTime, Schema.SchemaDate>>();
});

test("codec basic functionality", () => {
  // ISO string -> Date codec using Schema.iso.datetime() for input validation

  const testIsoString = "2024-01-15T10:30:00.000Z";
  const testDate = new Date("2024-01-15T10:30:00.000Z");

  // Forward decoding (ISO string -> Date)
  const decodedResult = Schema.decode(isoDateCodec, testIsoString);
  expect(decodedResult).toBeInstanceOf(Date);
  expect(decodedResult.toISOString()).toMatchInlineSnapshot(`"2024-01-15T10:30:00.000Z"`);

  // Backward encoding (Date -> ISO string)
  const encodedResult = Schema.encode(isoDateCodec, testDate);
  expect(typeof encodedResult).toBe("string");
  expect(encodedResult).toMatchInlineSnapshot(`"2024-01-15T10:30:00.000Z"`);
});

test("codec round trip", () => {
  const isoDateCodec = Schema.codec(Schema.iso.datetime(), Schema.date(), {
    decode: (isoString) => new Date(isoString),
    encode: (date) => date.toISOString(),
  });

  const original = "2024-12-25T15:45:30.123Z";
  const toDate = Schema.decode(isoDateCodec, original);
  const backToString = Schema.encode(isoDateCodec, toDate);

  expect(backToString).toMatchInlineSnapshot(`"2024-12-25T15:45:30.123Z"`);
  expect(toDate).toBeInstanceOf(Date);
  expect(toDate.getTime()).toMatchInlineSnapshot(`1735141530123`);
});

test("codec with refinement", () => {
  const isoDateCodec = z
    .codec(Schema.iso.datetime(), Schema.date(), {
      decode: (isoString) => new Date(isoString),
      encode: (date) => date.toISOString(),
    })
    .refine((val) => val.getFullYear() === 2024, { error: "Year must be 2024" });

  // Valid 2024 date
  const validDate = Schema.decode(isoDateCodec, "2024-01-15T10:30:00.000Z");
  expect(validDate.getFullYear()).toMatchInlineSnapshot(`2024`);
  expect(validDate.getTime()).toMatchInlineSnapshot(`1705314600000`);

  // Invalid year should fail safely
  const invalidYearResult = Schema.safeDecode(isoDateCodec, "2023-01-15T10:30:00.000Z");
  expect(invalidYearResult.success).toBe(false);
  if (!invalidYearResult.success) {
    expect(invalidYearResult.error.issues).toMatchInlineSnapshot(`
      [
        {
          "code": "custom",
          "message": "Year must be 2024",
          "path": [],
        },
      ]
    `);
  }
});

test("safe codec operations", () => {
  const isoDateCodec = Schema.codec(Schema.iso.datetime(), Schema.date(), {
    decode: (isoString) => new Date(isoString),
    encode: (date) => date.toISOString(),
  });

  // Safe decode with invalid input
  const safeDecodeResult = Schema.safeDecode(isoDateCodec, "invalid-date");
  expect(safeDecodeResult.success).toBe(false);
  if (!safeDecodeResult.success) {
    expect(safeDecodeResult.error.issues).toMatchInlineSnapshot(`
      [
        {
          "code": "invalid_format",
          "format": "datetime",
          "message": "Invalid ISO datetime",
          "origin": "string",
          "path": [],
          "pattern": "/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$/",
        },
      ]
    `);
  }

  // Safe decode with valid input
  const safeDecodeValid = Schema.safeDecode(isoDateCodec, "2024-01-15T10:30:00.000Z");
  expect(safeDecodeValid.success).toBe(true);
  if (safeDecodeValid.success) {
    expect(safeDecodeValid.data).toBeInstanceOf(Date);
    expect(safeDecodeValid.data.getTime()).toMatchInlineSnapshot(`1705314600000`);
  }

  // Safe encode with valid input
  const safeEncodeResult = Schema.safeEncode(isoDateCodec, new Date("2024-01-01"));
  expect(safeEncodeResult.success).toBe(true);
  if (safeEncodeResult.success) {
    expect(safeEncodeResult.data).toMatchInlineSnapshot(`"2024-01-01T00:00:00.000Z"`);
  }
});

test("codec with different types", () => {
  // String -> Number codec
  const stringNumberCodec = Schema.codec(Schema.string(), Schema.number(), {
    decode: (str) => Number.parseFloat(str),
    encode: (num) => num.toString(),
  });

  const decodedNumber = Schema.decode(stringNumberCodec, "42.5");
  expect(decodedNumber).toMatchInlineSnapshot(`42.5`);
  expect(typeof decodedNumber).toBe("number");

  const encodedString = Schema.encode(stringNumberCodec, 42.5);
  expect(encodedString).toMatchInlineSnapshot(`"42.5"`);
  expect(typeof encodedString).toBe("string");
});

test("async codec operations", async () => {
  const isoDateCodec = Schema.codec(Schema.iso.datetime(), Schema.date(), {
    decode: (isoString) => new Date(isoString),
    encode: (date) => date.toISOString(),
  });

  // Async decode
  const decodedResult = await Schema.decodeAsync(isoDateCodec, "2024-01-15T10:30:00.000Z");
  expect(decodedResult).toBeInstanceOf(Date);
  expect(decodedResult.getTime()).toMatchInlineSnapshot(`1705314600000`);

  // Async encode
  const encodedResult = await Schema.encodeAsync(isoDateCodec, new Date("2024-01-15T10:30:00.000Z"));
  expect(typeof encodedResult).toBe("string");
  expect(encodedResult).toMatchInlineSnapshot(`"2024-01-15T10:30:00.000Z"`);

  // Safe async operations
  const safeDecodeResult = await Schema.safeDecodeAsync(isoDateCodec, "2024-01-15T10:30:00.000Z");
  expect(safeDecodeResult.success).toBe(true);
  if (safeDecodeResult.success) {
    expect(safeDecodeResult.data.getTime()).toMatchInlineSnapshot(`1705314600000`);
  }

  const safeEncodeResult = await Schema.safeEncodeAsync(isoDateCodec, new Date("2024-01-15T10:30:00.000Z"));
  expect(safeEncodeResult.success).toBe(true);
  if (safeEncodeResult.success) {
    expect(safeEncodeResult.data).toMatchInlineSnapshot(`"2024-01-15T10:30:00.000Z"`);
  }
});

test("codec type inference", () => {
  const codec = Schema.codec(Schema.string(), Schema.number(), {
    decode: (str) => Number.parseInt(str),
    encode: (num) => num.toString(),
  });

  // These should compile without type errors
  const decoded: number = Schema.decode(codec, "123");
  const encoded: string = Schema.encode(codec, 123);

  expect(decoded).toMatchInlineSnapshot(`123`);
  expect(encoded).toMatchInlineSnapshot(`"123"`);
});

test("nested codec with object containing codec property", () => {
  // Nested schema: object containing a codec as one of its properties, with refinements at all levels
  const waypointSchema = z
    .object({
      name: Schema.string().min(1, "Waypoint name required"),
      difficulty: Schema.enum(["easy", "medium", "hard"]),
      coordinate: z
        .codec(
          z
            .string()
            .regex(/^-?\d+,-?\d+$/, "Must be 'x,y' format"), // Input: coordinate string
          z
            .object({ x: Schema.number(), y: Schema.number() })
            .refine((coord) => coord.x >= 0 && coord.y >= 0, { error: "Coordinates must be non-negative" }), // Output: coordinate object
          {
            decode: (coordString: string) => {
              const [x, y] = coordString.split(",").map(Number);
              return { x, y };
            },
            encode: (coord: { x: number; y: number }) => `${coord.x},${coord.y}`,
          }
        )
        .refine((coord) => coord.x <= 1000 && coord.y <= 1000, { error: "Coordinates must be within bounds" }),
    })
    .refine((waypoint) => waypoint.difficulty !== "hard" || waypoint.coordinate.x >= 100, {
      error: "Hard waypoints must be at least 100 units from origin",
    });

  // Test data
  const inputWaypoint = {
    name: "Summit Point",
    difficulty: "medium" as const,
    coordinate: "150,200",
  };

  // Forward decoding (object with string coordinate -> object with coordinate object)
  const decodedWaypoint = Schema.decode(waypointSchema, inputWaypoint);
  expect(decodedWaypoint).toMatchInlineSnapshot(`
    {
      "coordinate": {
        "x": 150,
        "y": 200,
      },
      "difficulty": "medium",
      "name": "Summit Point",
    }
  `);

  // Backward encoding (object with coordinate object -> object with string coordinate)
  const encodedWaypoint = Schema.encode(waypointSchema, decodedWaypoint);
  expect(encodedWaypoint).toMatchInlineSnapshot(`
    {
      "coordinate": "150,200",
      "difficulty": "medium",
      "name": "Summit Point",
    }
  `);

  // Test refinements at all levels

  // String validation (empty waypoint name)
  const emptyNameResult = Schema.safeDecode(waypointSchema, {
    name: "",
    difficulty: "easy",
    coordinate: "10,20",
  });
  expect(emptyNameResult.success).toBe(false);
  if (!emptyNameResult.success) {
    expect(emptyNameResult.error.issues).toMatchInlineSnapshot(`
      [
        {
          "code": "too_small",
          "inclusive": true,
          "message": "Waypoint name required",
          "minimum": 1,
          "origin": "string",
          "path": [
            "name",
          ],
        },
      ]
    `);
  }

  // Enum validation (invalid difficulty)
  const invalidDifficultyResult = Schema.safeDecode(waypointSchema, {
    name: "Test Point",
    difficulty: "impossible" as any,
    coordinate: "10,20",
  });
  expect(invalidDifficultyResult.success).toBe(false);
  if (!invalidDifficultyResult.success) {
    expect(invalidDifficultyResult.error.issues).toMatchInlineSnapshot(`
      [
        {
          "code": "invalid_value",
          "message": "Invalid option: expected one of "easy"|"medium"|"hard"",
          "path": [
            "difficulty",
          ],
          "values": [
            "easy",
            "medium",
            "hard",
          ],
        },
      ]
    `);
  }

  // Codec string format validation (invalid coordinate format)
  const invalidFormatResult = Schema.safeDecode(waypointSchema, {
    name: "Test Point",
    difficulty: "easy",
    coordinate: "invalid",
  });
  expect(invalidFormatResult.success).toBe(false);
  if (!invalidFormatResult.success) {
    expect(invalidFormatResult.error.issues).toMatchInlineSnapshot(`
      [
        {
          "code": "invalid_format",
          "format": "regex",
          "message": "Must be 'x,y' format",
          "origin": "string",
          "path": [
            "coordinate",
          ],
          "pattern": "/^-?\\d+,-?\\d+$/",
        },
      ]
    `);
  }

  // Codec object refinement (negative coordinates)
  const negativeCoordResult = Schema.safeDecode(waypointSchema, {
    name: "Test Point",
    difficulty: "easy",
    coordinate: "-5,10",
  });
  expect(negativeCoordResult.success).toBe(false);
  if (!negativeCoordResult.success) {
    expect(negativeCoordResult.error.issues).toMatchInlineSnapshot(`
      [
        {
          "code": "custom",
          "message": "Coordinates must be non-negative",
          "path": [
            "coordinate",
          ],
        },
      ]
    `);
  }

  // Codec-level refinement (coordinates out of bounds)
  const outOfBoundsResult = Schema.safeDecode(waypointSchema, {
    name: "Test Point",
    difficulty: "easy",
    coordinate: "1500,2000",
  });
  expect(outOfBoundsResult.success).toBe(false);
  if (!outOfBoundsResult.success) {
    expect(outOfBoundsResult.error.issues).toMatchInlineSnapshot(`
      [
        {
          "code": "custom",
          "message": "Coordinates must be within bounds",
          "path": [
            "coordinate",
          ],
        },
      ]
    `);
  }

  // Object-level refinement (hard waypoint too close to origin)
  const hardWaypointResult = Schema.safeDecode(waypointSchema, {
    name: "Expert Point",
    difficulty: "hard",
    coordinate: "50,60", // x < 100, but hard waypoints need x >= 100
  });
  expect(hardWaypointResult.success).toBe(false);
  if (!hardWaypointResult.success) {
    expect(hardWaypointResult.error.issues).toMatchInlineSnapshot(`
      [
        {
          "code": "custom",
          "message": "Hard waypoints must be at least 100 units from origin",
          "path": [],
        },
      ]
    `);
  }

  // Round trip test
  const roundTripResult = Schema.encode(waypointSchema, Schema.decode(waypointSchema, inputWaypoint));
  expect(roundTripResult).toMatchInlineSnapshot(`
    {
      "coordinate": "150,200",
      "difficulty": "medium",
      "name": "Summit Point",
    }
  `);
});

test("mutating refinements", () => {
  const A = Schema.codec(Schema.string(), Schema.string().trim(), {
    decode: (val) => val,
    encode: (val) => val,
  });

  expect(Schema.decode(A, " asdf ")).toMatchInlineSnapshot(`"asdf"`);
  expect(Schema.encode(A, " asdf ")).toMatchInlineSnapshot(`"asdf"`);

  const B = z
    .codec(Schema.string(), Schema.string(), {
      decode: (val) => val,
      encode: (val) => val,
    })
    .check(Schema.trim(), Schema.maxLength(4));

  expect(Schema.decode(B, " asdf ")).toMatchInlineSnapshot(`"asdf"`);
  expect(Schema.encode(B, " asdf ")).toMatchInlineSnapshot(`"asdf"`);
});

test("codec type enforcement - correct encode/decode signatures", () => {
  // Test that codec functions have correct type signatures
  const stringToNumberCodec = Schema.codec(Schema.string(), Schema.number(), {
    decode: (value: string) => Number(value), // core.output<A> -> core.input<B>
    encode: (value: number) => String(value), // core.input<B> -> core.output<A>
  });

  // These should compile without errors - correct types (async support)
  expectTypeOf<(value: string, payload: Schema.core.ParsePayload<string>) => Schema.core.util.MaybeAsync<number>>(
    stringToNumberCodec.def.transform
  ).toBeFunction();
  expectTypeOf<(value: number, payload: Schema.core.ParsePayload<number>) => Schema.core.util.MaybeAsync<string>>(
    stringToNumberCodec.def.reverseTransform
  ).toBeFunction();

  // Test that decode parameter type is core.output<A> (string)
  const validDecode = (value: string) => Number(value);
  expectTypeOf(validDecode).toMatchTypeOf<(value: string) => number>();

  // Test that encode parameter type is core.input<B> (number)
  const validEncode = (value: number) => String(value);
  expectTypeOf(validEncode).toMatchTypeOf<(value: number) => string>();

  Schema.codec(Schema.string(), Schema.number(), {
    // @ts-expect-error - decode should NOT accept core.input<A> as parameter
    decode: (value: never, _payload) => Number(value), // Wrong: should be string, not unknown
    encode: (value: number, _payload) => String(value),
  });

  Schema.codec(Schema.string(), Schema.number(), {
    decode: (value: string) => Number(value),
    // @ts-expect-error - encode should NOT accept core.output<B> as parameter
    encode: (value: never) => String(value), // Wrong: should be number, not unknown
  });

  Schema.codec(Schema.string(), Schema.number(), {
    // @ts-expect-error - decode return type should be core.input<B>
    decode: (value: string) => String(value), // Wrong: should return number, not string
    encode: (value: number) => String(value),
  });

  Schema.codec(Schema.string(), Schema.number(), {
    decode: (value: string) => Number(value),
    // @ts-expect-error - encode return type should be core.output<A>
    encode: (value: number) => Number(value), // Wrong: should return string, not number
  });
});

test("codec type enforcement - complex types", () => {
  type User = { id: number; name: string };
  type UserInput = { id: string; name: string };

  const userCodec = Schema.codec(
    Schema.object({ id: Schema.string(), name: Schema.string() }),
    Schema.object({ id: Schema.number(), name: Schema.string() }),
    {
      decode: (input: UserInput) => ({ id: Number(input.id), name: input.name }),
      encode: (user: User) => ({ id: String(user.id), name: user.name }),
    }
  );

  // Verify correct types are inferred (async support)
  expectTypeOf<(input: UserInput, payload: Schema.core.ParsePayload<UserInput>) => Schema.core.util.MaybeAsync<User>>(
    userCodec.def.transform
  ).toBeFunction();
  expectTypeOf<(user: User, payload: Schema.core.ParsePayload<User>) => Schema.core.util.MaybeAsync<UserInput>>(
    userCodec.def.reverseTransform
  ).toBeFunction();

  Schema.codec(
    Schema.object({
      id: Schema.string(),
      name: Schema.string(),
    }),
    Schema.object({ id: Schema.number(), name: Schema.string() }),
    {
      // @ts-expect-error - decode parameter should be UserInput, not User
      decode: (input: User) => ({ id: Number(input.id), name: input.name }), // Wrong type
      encode: (user: User) => ({ id: String(user.id), name: user.name }),
    }
  );

  Schema.codec(
    Schema.object({
      id: Schema.string(),
      name: Schema.string(),
    }),
    Schema.object({ id: Schema.number(), name: Schema.string() }),
    {
      decode: (input: UserInput) => ({ id: Number(input.id), name: input.name }),
      // @ts-expect-error - encode parameter should be User, not UserInput
      encode: (user: UserInput) => ({ id: String(user.id), name: user.name }), // Wrong type
    }
  );
});

test("codec with overwrites", () => {
  const stringPlusA = Schema.string().overwrite((val) => val + "a");
  const A = z
    .codec(stringPlusA, stringPlusA, {
      decode: (val) => val,
      encode: (val) => val,
    })
    .overwrite((val) => val + "a");

  expect(Schema.decode(A, "")).toEqual("aaa");
  expect(Schema.encode(A, "")).toEqual("aaa");

  // @ts-expect-error
  expect(Schema.safeEncode(A, Symbol("a"))).toMatchInlineSnapshot(`
    {
      "error": [SchemaError: [
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [],
        "message": "Invalid input: expected string, received symbol"
      }
    ]],
      "success": false,
    }
  `);
});

test("async codec functionality", async () => {
  // Test that async encode/decode functions work properly
  const asyncCodec = Schema.codec(Schema.string(), Schema.number(), {
    decode: async (str) => {
      await new Promise((resolve) => setTimeout(resolve, 1)); // Simulate async work
      return Number.parseFloat(str);
    },
    encode: async (num) => {
      await new Promise((resolve) => setTimeout(resolve, 1)); // Simulate async work
      return num.toString();
    },
  });

  // Test async decode/encode
  const decoded = await Schema.decodeAsync(asyncCodec, "42.5");
  expect(decoded).toBe(42.5);

  const encoded = await Schema.encodeAsync(asyncCodec, 42.5);
  expect(encoded).toBe("42.5");

  // Test that both sync and async work
  const mixedCodec = Schema.codec(Schema.string(), Schema.number(), {
    decode: async (str) => Number.parseFloat(str),
    encode: (num) => num.toString(), // sync encode
  });

  const mixedResult = await Schema.decodeAsync(mixedCodec, "123");
  expect(mixedResult).toBe(123);
});

test("invertCodec basic", () => {
  const inverted = Schema.invertCodec(isoDateCodec);

  const testDate = new Date("2024-01-15T10:30:00.000Z");
  const decoded = Schema.decode(inverted, testDate);
  expect(typeof decoded).toBe("string");
  expect(decoded).toBe("2024-01-15T10:30:00.000Z");

  const encoded = Schema.encode(inverted, "2024-01-15T10:30:00.000Z");
  expect(encoded).toBeInstanceOf(Date);
  expect(encoded.toISOString()).toBe("2024-01-15T10:30:00.000Z");
});

test("invertCodec round trip", () => {
  const inverted = Schema.invertCodec(isoDateCodec);
  const testDate = new Date("2024-06-01T12:00:00.000Z");

  const toStr = Schema.decode(inverted, testDate);
  const backToDate = Schema.encode(inverted, toStr);
  expect(backToDate.toISOString()).toBe(testDate.toISOString());
});

test("invertCodec types", () => {
  const inverted = Schema.invertCodec(isoDateCodec);

  type InvIn = Schema.input<typeof inverted>;
  type InvOut = Schema.output<typeof inverted>;
  expectTypeOf<InvIn>().toEqualTypeOf<Date>();
  expectTypeOf<InvOut>().toEqualTypeOf<string>();
});

test("invertCodec is its own inverse", () => {
  const doubleInverted = Schema.invertCodec(Schema.invertCodec(isoDateCodec));
  const testIsoString = "2024-03-10T08:00:00.000Z";

  const decoded = Schema.decode(doubleInverted, testIsoString);
  expect(decoded).toBeInstanceOf(Date);
  expect(decoded.toISOString()).toBe(testIsoString);

  const encoded = Schema.encode(doubleInverted, decoded);
  expect(encoded).toBe(testIsoString);
});

test("invertCodec with custom codec", () => {
  const intToString = Schema.codec(Schema.int(), Schema.string().regex(/^\d+$/), {
    decode: (num) => num.toString(),
    encode: (str) => Number.parseInt(str, 10),
  });

  const stringToInt = Schema.invertCodec(intToString);
  const result = Schema.decode(stringToInt, "42");
  expect(result).toBe(42);

  const back = Schema.encode(stringToInt, 42);
  expect(back).toBe("42");
});

describe("context immutability", () => {
  test("decode/encode", () => {
    const stringToDateCodec = Schema.codec(Schema.iso.datetime(), Schema.date(), {
      decode: (isoString) => new Date(isoString),
      encode: (date) => date.toISOString(),
    });

    const ctx = { reportInput: true } as const;

    const result1 = Schema.decode(stringToDateCodec, "2024-01-15T10:30:00.000Z", ctx);
    expect(result1).toBeInstanceOf(Date);

    expect(ctx).toEqual({ reportInput: true });
    expect("async" in ctx).toBe(false);
    expect("direction" in ctx).toBe(false);

    const result2 = Schema.decode(stringToDateCodec, "2024-12-25T15:45:30.123Z", ctx);
    expect(result2).toBeInstanceOf(Date);

    expect(ctx).toEqual({ reportInput: true });
    expect("async" in ctx).toBe(false);
    expect("direction" in ctx).toBe(false);

    Schema.encode(stringToDateCodec, new Date("2024-01-01T00:00:00.000Z"), ctx);
    expect(ctx).toEqual({ reportInput: true });
    expect("direction" in ctx).toBe(false);

    Schema.safeEncode(stringToDateCodec, new Date("2024-01-01T00:00:00.000Z"), ctx);
    expect(ctx).toEqual({ reportInput: true });
    expect("direction" in ctx).toBe(false);
  });

  test("parse functions", () => {
    const schema = Schema.string().min(1);
    const ctx = { reportInput: true } as const;

    Schema.parse(schema, "asdf", ctx);
    expect(ctx).toEqual({ reportInput: true });
    expect("async" in ctx).toBe(false);

    Schema.safeParse(schema, "asdf", ctx);
    expect(ctx).toEqual({ reportInput: true });
    expect("async" in ctx).toBe(false);
  });

  test("async functions", async () => {
    const stringToDateCodec = Schema.codec(Schema.iso.datetime(), Schema.date(), {
      decode: (isoString) => new Date(isoString),
      encode: (date) => date.toISOString(),
    });

    const ctx = { reportInput: true } as const;

    const schema = Schema.string();
    await Schema.parseAsync(schema, "asdf", ctx);
    expect(ctx).toEqual({ reportInput: true });
    expect("async" in ctx).toBe(false);

    await Schema.safeParseAsync(schema, "asdf", ctx);
    expect(ctx).toEqual({ reportInput: true });
    expect("async" in ctx).toBe(false);

    await Schema.decodeAsync(stringToDateCodec, "2024-01-15T10:30:00.000Z", ctx);
    expect(ctx).toEqual({ reportInput: true });
    expect("async" in ctx).toBe(false);
    expect("direction" in ctx).toBe(false);

    await Schema.encodeAsync(stringToDateCodec, new Date("2024-01-01T00:00:00.000Z"), ctx);
    expect(ctx).toEqual({ reportInput: true });
    expect("async" in ctx).toBe(false);
    expect("direction" in ctx).toBe(false);

    await Schema.safeDecodeAsync(stringToDateCodec, "2024-01-15T10:30:00.000Z", ctx);
    expect(ctx).toEqual({ reportInput: true });
    expect("async" in ctx).toBe(false);
    expect("direction" in ctx).toBe(false);

    await Schema.safeEncodeAsync(stringToDateCodec, new Date("2024-01-01T00:00:00.000Z"), ctx);
    expect(ctx).toEqual({ reportInput: true });
    expect("async" in ctx).toBe(false);
    expect("direction" in ctx).toBe(false);
  });
});
