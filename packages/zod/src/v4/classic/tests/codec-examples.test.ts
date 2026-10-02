import { expect, test } from "vitest";
import * as Schema from "schema/v4";

// ============================================================================
// stringToNumber
// ============================================================================

const stringToNumber = () =>
  Schema.codec(Schema.string(), Schema.number(), {
    decode: (str) => Number.parseFloat(str),
    encode: (num) => num.toString(),
  });

test("stringToNumber codec", () => {
  const codec = stringToNumber();

  // Test decode
  expect(Schema.decode(codec, "42.5")).toBe(42.5);
  expect(Schema.decode(codec, "0")).toBe(0);
  expect(Schema.decode(codec, "-123.456")).toBe(-123.456);

  // Test encode
  expect(Schema.encode(codec, 42.5)).toBe("42.5");
  expect(Schema.encode(codec, 0)).toBe("0");
  expect(Schema.encode(codec, -123.456)).toBe("-123.456");

  // Test round trip
  const original = "3.14159";
  const roundTrip = Schema.encode(codec, Schema.decode(codec, original));
  expect(roundTrip).toBe("3.14159");
});

// ============================================================================
// stringToInt
// ============================================================================

const stringToInt = () =>
  Schema.codec(Schema.string(), Schema.int(), {
    decode: (str) => Number.parseInt(str, 10),
    encode: (num) => num.toString(),
  });

test("stringToInt codec", () => {
  const codec = stringToInt();

  // Test decode
  expect(Schema.decode(codec, "42")).toBe(42);
  expect(Schema.decode(codec, "0")).toBe(0);
  expect(Schema.decode(codec, "-123")).toBe(-123);

  // Test encode
  expect(Schema.encode(codec, 42)).toBe("42");
  expect(Schema.encode(codec, 0)).toBe("0");
  expect(Schema.encode(codec, -123)).toBe("-123");

  // Test round trip
  const original = "999";
  const roundTrip = Schema.encode(codec, Schema.decode(codec, original));
  expect(roundTrip).toBe("999");
});

// ============================================================================
// stringToBigInt
// ============================================================================

const stringToBigInt = () =>
  Schema.codec(Schema.string(), Schema.bigint(), {
    decode: (str) => BigInt(str),
    encode: (bigint) => bigint.toString(),
  });

test("stringToBigInt codec", () => {
  const codec = stringToBigInt();

  // Test decode
  expect(Schema.decode(codec, "123456789012345678901234567890")).toBe(123456789012345678901234567890n);
  expect(Schema.decode(codec, "0")).toBe(0n);
  expect(Schema.decode(codec, "-999")).toBe(-999n);

  // Test encode
  expect(Schema.encode(codec, 123456789012345678901234567890n)).toBe("123456789012345678901234567890");
  expect(Schema.encode(codec, 0n)).toBe("0");
  expect(Schema.encode(codec, -999n)).toBe("-999");

  // Test round trip
  const original = "987654321098765432109876543210";
  const roundTrip = Schema.encode(codec, Schema.decode(codec, original));
  expect(roundTrip).toBe("987654321098765432109876543210");
});

// ============================================================================
// numberToBigInt
// ============================================================================

const numberToBigInt = () =>
  Schema.codec(Schema.int(), Schema.bigint(), {
    decode: (num) => BigInt(num),
    encode: (bigint) => Number(bigint),
  });

test("numberToBigInt codec", () => {
  const codec = numberToBigInt();

  // Test decode
  expect(Schema.decode(codec, 42)).toBe(42n);
  expect(Schema.decode(codec, 0)).toBe(0n);
  expect(Schema.decode(codec, -123)).toBe(-123n);

  // Test encode
  expect(Schema.encode(codec, 42n)).toBe(42);
  expect(Schema.encode(codec, 0n)).toBe(0);
  expect(Schema.encode(codec, -123n)).toBe(-123);

  // Test round trip
  const original = 999;
  const roundTrip = Schema.encode(codec, Schema.decode(codec, original));
  expect(roundTrip).toBe(999);
});

// ============================================================================
// isoDatetimeToDate
// ============================================================================

const isoDatetimeToDate = () =>
  Schema.codec(Schema.iso.datetime(), Schema.date(), {
    decode: (isoString) => new Date(isoString),
    encode: (date) => date.toISOString(),
  });

test("isoDatetimeToDate codec", () => {
  const codec = isoDatetimeToDate();

  // Test decode
  const decoded = Schema.decode(codec, "2024-01-15T10:30:00.000Z");
  expect(decoded).toBeInstanceOf(Date);
  expect(decoded.getTime()).toBe(1705314600000);

  // Test encode
  const date = new Date("2024-01-15T10:30:00.000Z");
  expect(Schema.encode(codec, date)).toBe("2024-01-15T10:30:00.000Z");

  // Test round trip
  const original = "2024-12-25T15:45:30.123Z";
  const roundTrip = Schema.encode(codec, Schema.decode(codec, original));
  expect(roundTrip).toBe("2024-12-25T15:45:30.123Z");
});

// ============================================================================
// epochSecondsToDate
// ============================================================================

const epochSecondsToDate = () =>
  Schema.codec(Schema.int().min(0), Schema.date(), {
    decode: (seconds) => new Date(seconds * 1000),
    encode: (date) => Math.floor(date.getTime() / 1000),
  });

test("epochSecondsToDate codec", () => {
  const codec = epochSecondsToDate();

  // Test decode
  const decoded = Schema.decode(codec, 1705314600);
  expect(decoded).toBeInstanceOf(Date);
  expect(decoded.getTime()).toBe(1705314600000);

  // Test encode
  const date = new Date(1705314600000);
  expect(Schema.encode(codec, date)).toBe(1705314600);

  // Test round trip
  const original = 1640995200; // 2022-01-01 00:00:00 UTC
  const roundTrip = Schema.encode(codec, Schema.decode(codec, original));
  expect(roundTrip).toBe(1640995200);
});

// ============================================================================
// epochMillisToDate
// ============================================================================

const epochMillisToDate = () =>
  Schema.codec(Schema.int().min(0), Schema.date(), {
    decode: (millis) => new Date(millis),
    encode: (date) => date.getTime(),
  });

test("epochMillisToDate codec", () => {
  const codec = epochMillisToDate();

  // Test decode
  const decoded = Schema.decode(codec, 1705314600000);
  expect(decoded).toBeInstanceOf(Date);
  expect(decoded.getTime()).toBe(1705314600000);

  // Test encode
  const date = new Date(1705314600000);
  expect(Schema.encode(codec, date)).toBe(1705314600000);

  // Test round trip
  const original = 1640995200123; // 2022-01-01 00:00:00.123 UTC
  const roundTrip = Schema.encode(codec, Schema.decode(codec, original));
  expect(roundTrip).toBe(1640995200123);
});

// ============================================================================
// json
// ============================================================================

const jsonCodec = <T extends Schema.core.$SchemaType>(schema: T) =>
  Schema.codec(Schema.string(), schema, {
    decode: (jsonString, ctx) => {
      try {
        return JSON.parse(jsonString);
      } catch (err: any) {
        ctx.issues.push({
          code: "invalid_format",
          format: "json",
          input: jsonString,
          message: err.message,
        });
        return Schema.NEVER;
      }
    },
    encode: (value) => JSON.stringify(value),
  });

test("json codec", () => {
  const codec = jsonCodec(Schema.object({ name: Schema.string(), age: Schema.number() }));

  // Test decode
  const decoded = Schema.decode(codec, '{"name":"Alice","age":30}');
  expect(decoded).toEqual({ name: "Alice", age: 30 });

  // Test encode
  const encoded = Schema.encode(codec, { name: "Bob", age: 25 });
  expect(encoded).toBe('{"name":"Bob","age":25}');

  // Test round trip
  const original = '{"name":"Charlie","age":35}';
  const parsed = Schema.decode(codec, original);
  const roundTrip = Schema.encode(codec, parsed);
  expect(JSON.parse(roundTrip)).toEqual(JSON.parse(original));
});

// ============================================================================
// utf8ToBytes
// ============================================================================

const utf8ToBytes = () =>
  Schema.codec(Schema.string(), Schema.instanceof(Uint8Array), {
    decode: (str) => new TextEncoder().encode(str),
    encode: (bytes) => new TextDecoder().decode(bytes),
  });

test("utf8ToBytes codec", () => {
  const codec = utf8ToBytes();

  // Test decode
  const decoded = Schema.decode(codec, "Hello, 世界!");
  expect(decoded).toBeInstanceOf(Uint8Array);
  expect(Array.from(decoded)).toEqual([72, 101, 108, 108, 111, 44, 32, 228, 184, 150, 231, 149, 140, 33]);

  // Test encode
  const bytes = new Uint8Array([72, 101, 108, 108, 111]);
  expect(Schema.encode(codec, bytes)).toBe("Hello");

  // Test round trip
  const original = "Hello, 世界! 🚀";
  const roundTrip = Schema.encode(codec, Schema.decode(codec, original));
  expect(roundTrip).toBe(original);
});

// ============================================================================
// bytesToUtf8
// ============================================================================

const bytesToUtf8 = () =>
  Schema.codec(Schema.instanceof(Uint8Array), Schema.string(), {
    decode: (bytes) => new TextDecoder().decode(bytes),
    encode: (str) => new TextEncoder().encode(str),
  });

test("bytesToUtf8 codec", () => {
  const codec = bytesToUtf8();

  // Test decode
  const bytes = new Uint8Array([72, 101, 108, 108, 111]);
  const decoded = Schema.decode(codec, bytes);
  expect(decoded).toBe("Hello");

  // Test encode
  const encoded = Schema.encode(codec, "Hello, 世界!");
  expect(encoded).toBeInstanceOf(Uint8Array);
  expect(Array.from(encoded)).toEqual([72, 101, 108, 108, 111, 44, 32, 228, 184, 150, 231, 149, 140, 33]);

  // Test round trip
  const original = new Uint8Array([72, 101, 108, 108, 111, 44, 32, 228, 184, 150, 231, 149, 140, 33]);
  const roundTrip = Schema.encode(codec, Schema.decode(codec, original));
  expect(roundTrip).toEqual(original);
});

// ============================================================================
// base64
// ============================================================================

const base64 = () =>
  Schema.codec(Schema.base64(), Schema.instanceof(Uint8Array), {
    decode: (base64String) => Schema.util.base64ToUint8Array(base64String),
    encode: (bytes) => Schema.util.uint8ArrayToBase64(bytes),
  });

test("base64 codec", () => {
  const codec = base64();

  // Test decode
  const decoded = Schema.decode(codec, "SGVsbG8=");
  expect(decoded).toBeInstanceOf(Uint8Array);
  expect(Array.from(decoded)).toEqual([72, 101, 108, 108, 111]);

  // Test encode
  const bytes = new Uint8Array([72, 101, 108, 108, 111]);
  expect(Schema.encode(codec, bytes)).toBe("SGVsbG8=");

  // Test round trip
  const original = "SGVsbG8gV29ybGQh";
  const roundTrip = Schema.encode(codec, Schema.decode(codec, original));
  expect(roundTrip).toBe(original);
});

// ============================================================================
// base64urlToBytes
// ============================================================================

const base64urlToBytes = () =>
  Schema.codec(Schema.base64url(), Schema.instanceof(Uint8Array), {
    decode: (base64urlString) => Schema.util.base64urlToUint8Array(base64urlString),
    encode: (bytes) => Schema.util.uint8ArrayToBase64url(bytes),
  });

test("base64urlToBytes codec", () => {
  const codec = base64urlToBytes();

  // Test decode
  const decoded = Schema.decode(codec, "SGVsbG8");
  expect(decoded).toBeInstanceOf(Uint8Array);
  expect(Array.from(decoded)).toEqual([72, 101, 108, 108, 111]);

  // Test encode
  const bytes = new Uint8Array([72, 101, 108, 108, 111]);
  expect(Schema.encode(codec, bytes)).toBe("SGVsbG8");

  // Test round trip with padding case
  const original = "SGVsbG9Xb3JsZA";
  const roundTrip = Schema.encode(codec, Schema.decode(codec, original));
  expect(roundTrip).toBe(original);
});

// ============================================================================
// hexToBytes
// ============================================================================

const hexToBytes = () =>
  Schema.codec(Schema.hex(), Schema.instanceof(Uint8Array), {
    decode: (hexString) => Schema.util.hexToUint8Array(hexString),
    encode: (bytes) => Schema.util.uint8ArrayToHex(bytes),
  });

test("hexToBytes codec", () => {
  const codec = hexToBytes();

  // Test decode
  const decoded = Schema.decode(codec, "48656c6c6f");
  expect(decoded).toBeInstanceOf(Uint8Array);
  expect(Array.from(decoded)).toEqual([72, 101, 108, 108, 111]);

  // Note: Schema.hex() doesn't accept 0x prefix, but our utility function can handle it
  // const decodedWithPrefix = Schema.decode(codec, "0x48656c6c6f");
  // expect(Array.from(decodedWithPrefix)).toEqual([72, 101, 108, 108, 111]);

  // Test encode
  const bytes = new Uint8Array([72, 101, 108, 108, 111]);
  expect(Schema.encode(codec, bytes)).toBe("48656c6c6f");

  // Test round trip
  const original = "deadbeef";
  const roundTrip = Schema.encode(codec, Schema.decode(codec, original));
  expect(roundTrip).toBe("deadbeef");
});

// ============================================================================
// stringToURL
// ============================================================================

const stringToURL = () =>
  Schema.codec(Schema.url(), Schema.instanceof(URL), {
    decode: (urlString) => new URL(urlString),
    encode: (url) => url.href,
  });

test("stringToURL codec", () => {
  const codec = stringToURL();

  // Test decode
  const decoded = Schema.decode(codec, "https://example.com/path?query=value");
  expect(decoded).toBeInstanceOf(URL);
  expect(decoded.hostname).toBe("example.com");
  expect(decoded.pathname).toBe("/path");
  expect(decoded.search).toBe("?query=value");

  // Test encode
  const url = new URL("https://example.com/path?query=value");
  expect(Schema.encode(codec, url)).toBe("https://example.com/path?query=value");

  // Test round trip
  const original = "https://test.com/api/v1?foo=bar&baz=qux";
  const roundTrip = Schema.encode(codec, Schema.decode(codec, original));
  expect(roundTrip).toBe(original);
});

// ============================================================================
// stringToHttpURL
// ============================================================================

const stringToHttpURL = () =>
  Schema.codec(Schema.httpUrl(), Schema.instanceof(URL), {
    decode: (urlString) => new URL(urlString),
    encode: (url) => url.href,
  });

test("stringToHttpURL codec", () => {
  const codec = stringToHttpURL();

  // Test decode HTTPS
  const decodedHttps = Schema.decode(codec, "https://example.com/path");
  expect(decodedHttps).toBeInstanceOf(URL);
  expect(decodedHttps.protocol).toBe("https:");

  // Test decode HTTP
  const decodedHttp = Schema.decode(codec, "http://example.com/path");
  expect(decodedHttp).toBeInstanceOf(URL);
  expect(decodedHttp.protocol).toBe("http:");

  // Test encode
  const url = new URL("https://example.com/path");
  expect(Schema.encode(codec, url)).toBe("https://example.com/path");

  // Test round trip
  const original = "http://api.example.com/v1/users";
  const roundTrip = Schema.encode(codec, Schema.decode(codec, original));
  expect(roundTrip).toBe(original);
});

// ============================================================================
// uriComponent
// ============================================================================

const uriComponent = () =>
  Schema.codec(Schema.string(), Schema.string(), {
    decode: (encodedString) => decodeURIComponent(encodedString),
    encode: (decodedString) => encodeURIComponent(decodedString),
  });

test("uriComponent codec", () => {
  const codec = uriComponent();

  // Test decode
  const decoded = Schema.decode(codec, "Hello%20World%21");
  expect(decoded).toBe("Hello World!");

  // Test encode
  const encoded = Schema.encode(codec, "Hello World!");
  expect(encoded).toBe("Hello%20World!");

  // Test round trip
  const original = "Hello%20World%21%20%26%20More";
  const roundTrip = Schema.encode(codec, Schema.decode(codec, original));
  expect(roundTrip).toBe("Hello%20World!%20%26%20More");

  // Test complex characters
  const complex = "café & résumé";
  const encodedComplex = Schema.encode(codec, complex);
  const decodedComplex = Schema.decode(codec, encodedComplex);
  expect(decodedComplex).toBe(complex);
});

// ============================================================================
// stringToBoolean
// ============================================================================

const stringToBoolean = (options?: { truthy?: string[]; falsy?: string[] }) => Schema.stringbool(options);

test("stringToBoolean codec", () => {
  const codec = stringToBoolean();

  // Test decode - default truthy values
  expect(Schema.decode(codec, "true")).toBe(true);
  expect(Schema.decode(codec, "yes")).toBe(true);
  expect(Schema.decode(codec, "1")).toBe(true);

  // Test decode - default falsy values
  expect(Schema.decode(codec, "false")).toBe(false);
  expect(Schema.decode(codec, "no")).toBe(false);
  expect(Schema.decode(codec, "0")).toBe(false);

  // Test encode - default behavior
  expect(Schema.encode(codec, true)).toBe("true");
  expect(Schema.encode(codec, false)).toBe("false");

  // Test custom options
  const customCodec = stringToBoolean({ truthy: ["yes", "y"], falsy: ["no", "n"] });
  expect(Schema.decode(customCodec, "yes")).toBe(true);
  expect(Schema.decode(customCodec, "y")).toBe(true);
  expect(Schema.decode(customCodec, "no")).toBe(false);
  expect(Schema.decode(customCodec, "n")).toBe(false);
  expect(Schema.encode(customCodec, true)).toBe("yes");
  expect(Schema.encode(customCodec, false)).toBe("no");
});

// ============================================================================
// Error Handling Tests
// ============================================================================

// Test error cases - these test input validation, not transform errors
test("codec input validation", () => {
  // Test invalid base64 format
  const base64Codec = base64();
  const invalidBase64Result = Schema.safeDecode(base64Codec, "invalid!@#");
  expect(invalidBase64Result.success).toBe(false);

  // Test invalid hex format
  const hexCodec = hexToBytes();
  const invalidHexResult = Schema.safeDecode(hexCodec, "gg");
  expect(invalidHexResult.success).toBe(false);

  // Test invalid URL format
  const urlCodec = stringToURL();
  const invalidUrlResult = Schema.safeDecode(urlCodec, "not a url");
  expect(invalidUrlResult.success).toBe(false);

  // Test invalid HTTP URL format
  const httpUrlCodec = stringToHttpURL();
  const invalidHttpResult = Schema.safeDecode(httpUrlCodec, "ftp://example.com");
  expect(invalidHttpResult.success).toBe(false);
});

// Test transform errors - these test errors added by transform functions
test("codec transform error handling", () => {
  // JSON codec that can fail during transform
  const anyJSON = jsonCodec(Schema.json());

  // Test successful JSON parsing
  const validResult = Schema.safeDecode(anyJSON, '{"valid": "json"}');
  expect(validResult.success).toBe(true);
  if (validResult.success) {
    expect(validResult.data).toEqual({ valid: "json" });
  }

  // Test invalid JSON that should create a single "invalid_format" issue. Verifies that the transform error aborts before reaching the output schema
  const invalidResult = Schema.safeDecode(anyJSON, '{"invalid":,}');
  expect(invalidResult.success).toBe(false);
  if (!invalidResult.success) {
    expect(invalidResult.error.issues).toMatchInlineSnapshot(`
      [
        {
          "code": "invalid_format",
          "format": "json",
          "message": "Unexpected token ',', "{"invalid":,}" is not valid JSON",
          "path": [],
        },
      ]
    `);
  }
});
