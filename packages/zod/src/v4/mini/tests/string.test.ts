import { expect, expectTypeOf, test } from "vitest";
import * as Schema from "schema/mini";

const FAIL = { success: false };

test("Schema.string", async () => {
  const a = Schema.string();
  expect(Schema.parse(a, "hello")).toEqual("hello");
  expect(() => Schema.parse(a, 123)).toThrow();
  expect(() => Schema.parse(a, false)).toThrow();
  type a = Schema.infer<typeof a>;
  expectTypeOf<a>().toEqualTypeOf<string>();
});

// test("Schema.string with description", () => {
//   const a = Schema.string({ description: "string description" });
//   a._def;
//   expect(a._def.description).toEqual("string description");
// });

test("Schema.string with custom error", () => {
  const a = Schema.string({ error: () => "BAD" });
  expect(Schema.safeParse(a, 123).error!.issues[0].message).toEqual("BAD");
});

test("inference in checks", () => {
  const a = Schema.string().check(Schema.refine((val) => val.length));
  Schema.parse(a, "___");
  expect(() => Schema.parse(a, "")).toThrow();
  const b = Schema.string().check(Schema.refine((val) => val.length));
  Schema.parse(b, "___");
  expect(() => Schema.parse(b, "")).toThrow();
  const c = Schema.string().check(Schema.refine((val) => val.length));
  Schema.parse(c, "___");
  expect(() => Schema.parse(c, "")).toThrow();
  const d = Schema.string().check(Schema.refine((val) => val.length));
  Schema.parse(d, "___");
  expect(() => Schema.parse(d, "")).toThrow();
});

test("Schema.string async", async () => {
  // async
  const a = Schema.string().check(Schema.refine(async (val) => val.length));
  expect(await Schema.parseAsync(a, "___")).toEqual("___");
  await expect(() => Schema.parseAsync(a, "")).rejects.toThrowError();
});

test("Schema.uuid", () => {
  const a = Schema.uuid();
  // parse uuid
  Schema.parse(a, "550e8400-e29b-41d4-a716-446655440000");
  Schema.parse(a, "550e8400-e29b-61d4-a716-446655440000");

  // bad uuid
  expect(() => Schema.parse(a, "hello")).toThrow();
  // wrong type
  expect(() => Schema.parse(a, 123)).toThrow();

  const b = Schema.uuidv4();
  Schema.parse(b, "550e8400-e29b-41d4-a716-446655440000");
  expect(Schema.safeParse(b, "550e8400-e29b-61d4-a716-446655440000")).toMatchObject(FAIL);

  const c = Schema.uuidv6();
  Schema.parse(c, "550e8400-e29b-61d4-a716-446655440000");
  expect(Schema.safeParse(c, "550e8400-e29b-41d4-a716-446655440000")).toMatchObject(FAIL);

  const d = Schema.uuidv7();
  Schema.parse(d, "550e8400-e29b-71d4-a716-446655440000");
  expect(Schema.safeParse(d, "550e8400-e29b-41d4-a716-446655440000")).toMatchObject(FAIL);
  expect(Schema.safeParse(d, "550e8400-e29b-61d4-a716-446655440000")).toMatchObject(FAIL);
});

test("Schema.email", () => {
  const a = Schema.email();
  expect(Schema.parse(a, "test@test.com")).toEqual("test@test.com");
  expect(() => Schema.parse(a, "test")).toThrow();
  expect(Schema.safeParse(a, "bad email", { error: () => "bad email" }).error!.issues[0].message).toEqual("bad email");

  const b = Schema.email("bad email");
  expect(Schema.safeParse(b, "bad email").error!.issues[0].message).toEqual("bad email");

  const c = Schema.email({ error: "bad email" });
  expect(Schema.safeParse(c, "bad email").error!.issues[0].message).toEqual("bad email");

  const d = Schema.email({ error: () => "bad email" });
  expect(Schema.safeParse(d, "bad email").error!.issues[0].message).toEqual("bad email");
});

test("Schema.url", () => {
  const a = Schema.url();
  // valid URLs
  expect(a.parse("http://example.com")).toEqual("http://example.com");
  expect(a.parse("https://example.com")).toEqual("https://example.com");
  expect(a.parse("ftp://example.com")).toEqual("ftp://example.com");
  expect(a.parse("http://sub.example.com")).toEqual("http://sub.example.com");
  expect(a.parse("https://example.com/path?query=123#fragment")).toEqual("https://example.com/path?query=123#fragment");
  expect(a.parse("http://localhost")).toEqual("http://localhost");
  expect(a.parse("https://localhost")).toEqual("https://localhost");
  expect(a.parse("http://localhost:3000")).toEqual("http://localhost:3000");
  expect(a.parse("https://localhost:3000")).toEqual("https://localhost:3000");

  // test trimming
  expect(a.parse("  http://example.com  ")).toEqual("http://example.com");
  expect(a.parse("  http://example.com/")).toEqual("http://example.com/");
  expect(a.parse("  http://example.com")).toEqual("http://example.com");
  expect(a.parse("  http://example.com//")).toEqual("http://example.com//");

  // invalid URLs
  expect(() => a.parse("not-a-url")).toThrow();
  // expect(() => a.parse("http:/example.com")).toThrow();
  expect(() => a.parse("://example.com")).toThrow();
  expect(() => a.parse("http://")).toThrow();
  expect(() => a.parse("example.com")).toThrow();

  // wrong type
  expect(() => a.parse(123)).toThrow();
  expect(() => a.parse(null)).toThrow();
  expect(() => a.parse(undefined)).toThrow();
});

test("Schema.url with optional hostname regex", () => {
  const a = Schema.url({ hostname: /example\.com$/ });
  expect(a.parse("http://example.com")).toEqual("http://example.com");
  expect(a.parse("https://sub.example.com")).toEqual("https://sub.example.com");
  expect(() => a.parse("http://examples.com")).toThrow();
  expect(() => a.parse("http://example.org")).toThrow();
  expect(() => a.parse("asdf")).toThrow();
});

test("Schema.url - file urls", () => {
  // file URLs
  const a = Schema.url({ hostname: /.*/ }); // allow any hostname
  expect(a.parse("file:///path/to/file.txt")).toEqual("file:///path/to/file.txt");
  expect(a.parse("file:///C:/path/to/file.txt")).toEqual("file:///C:/path/to/file.txt");
  expect(a.parse("file:///C:/path/to/file.txt?query=123#fragment")).toEqual(
    "file:///C:/path/to/file.txt?query=123#fragment"
  );
});
test("Schema.url with optional protocol regex", () => {
  const a = Schema.url({ protocol: /^https?$/ });
  expect(a.parse("http://example.com")).toEqual("http://example.com");
  expect(a.parse("https://example.com")).toEqual("https://example.com");
  expect(() => a.parse("ftp://example.com")).toThrow();
  expect(() => a.parse("mailto:example@example.com")).toThrow();
  expect(() => a.parse("asdf")).toThrow();
});

test("Schema.url with both hostname and protocol regexes", () => {
  const a = Schema.url({ hostname: /example\.com$/, protocol: /^https$/ });
  expect(a.parse("https://example.com")).toEqual("https://example.com");
  expect(a.parse("https://sub.example.com")).toEqual("https://sub.example.com");
  expect(() => a.parse("http://example.com")).toThrow();
  expect(() => a.parse("https://example.org")).toThrow();
  expect(() => a.parse("ftp://example.com")).toThrow();
  expect(() => a.parse("asdf")).toThrow();
});

test("Schema.url with invalid regex patterns", () => {
  const a = Schema.url({ hostname: /a+$/, protocol: /^ftp$/ });
  a.parse("ftp://a");
  a.parse("ftp://aaaaaaaa");
  expect(() => a.parse("http://aaa")).toThrow();
  expect(() => a.parse("https://example.com")).toThrow();
  expect(() => a.parse("ftp://asdfasdf")).toThrow();
  expect(() => a.parse("ftp://invalid")).toThrow();
});

test("Schema.emoji", () => {
  const a = Schema.emoji();
  expect(Schema.parse(a, "😀")).toEqual("😀");
  expect(() => Schema.parse(a, "hello")).toThrow();
});

test("Schema.nanoid", () => {
  const a = Schema.nanoid();
  expect(Schema.parse(a, "8FHZpIxleEK3axQRBNNjN")).toEqual("8FHZpIxleEK3axQRBNNjN");
  expect(() => Schema.parse(a, "abc")).toThrow();
});

test("Schema.nanoid custom length", () => {
  const a = Schema.nanoid({ length: 64 });
  const id = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  expect(Schema.parse(a, id)).toEqual(id);
  expect(() => Schema.parse(a, "8FHZpIxleEK3axQRBNNjN")).toThrow();
});

test("Schema.cuid", () => {
  const a = Schema.cuid();
  expect(Schema.parse(a, "cixs7y0c0000f7x3b1z6m3w6r")).toEqual("cixs7y0c0000f7x3b1z6m3w6r");
  expect(() => Schema.parse(a, "abc")).toThrow();
});

test("Schema.cuid2", () => {
  const a = Schema.cuid2();
  expect(Schema.parse(a, "cixs7y0c0000f7x3b1z6m3w6r")).toEqual("cixs7y0c0000f7x3b1z6m3w6r");
  expect(() => Schema.parse(a, 123)).toThrow();
});

test("Schema.ulid", () => {
  const a = Schema.ulid();
  expect(Schema.parse(a, "01ETGRM9QYVX6S9V2F3B6JXG4N")).toEqual("01ETGRM9QYVX6S9V2F3B6JXG4N");
  expect(() => Schema.parse(a, "abc")).toThrow();
});

test("Schema.xid", () => {
  const a = Schema.xid();
  expect(Schema.parse(a, "9m4e2mr0ui3e8a215n4g")).toEqual("9m4e2mr0ui3e8a215n4g");
  expect(() => Schema.parse(a, "abc")).toThrow();
});

test("Schema.ksuid", () => {
  const a = Schema.ksuid();
  expect(Schema.parse(a, "2naeRjTrrHJAkfd3tOuEjw90WCA")).toEqual("2naeRjTrrHJAkfd3tOuEjw90WCA");
  expect(() => Schema.parse(a, "abc")).toThrow();
});

// test("Schema.ip", () => {
//   const a = Schema.ip();
//   expect(Schema.parse(a, "127.0.0.1")).toEqual("127.0.0.1");
//   expect(Schema.parse(a, "2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toEqual("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
//   expect(() => Schema.parse(a, "abc")).toThrow();
// });

test("Schema.ipv4", () => {
  const a = Schema.ipv4();
  // valid ipv4
  expect(Schema.parse(a, "192.168.1.1")).toEqual("192.168.1.1");
  expect(Schema.parse(a, "255.255.255.255")).toEqual("255.255.255.255");
  // invalid ipv4
  expect(() => Schema.parse(a, "999.999.999.999")).toThrow();
  expect(() => Schema.parse(a, "256.256.256.256")).toThrow();
  expect(() => Schema.parse(a, "192.168.1")).toThrow();
  expect(() => Schema.parse(a, "hello")).toThrow();
  // wrong type
  expect(() => Schema.parse(a, 123)).toThrow();
});

test("Schema.ipv6", () => {
  const a = Schema.ipv6();
  // valid ipv6
  expect(Schema.parse(a, "2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toEqual("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
  expect(Schema.parse(a, "::1")).toEqual("::1");
  // invalid ipv6
  expect(() => Schema.parse(a, "2001:db8::85a3::8a2e:370:7334")).toThrow();
  expect(() => Schema.parse(a, "2001:db8:85a3:0:0:8a2e:370g:7334")).toThrow();
  expect(() => Schema.parse(a, "hello")).toThrow();
  // wrong type
  expect(() => Schema.parse(a, 123)).toThrow();
});

test("Schema.mac", () => {
  const a = Schema.mac();
  // valid mac
  expect(Schema.parse(a, "00:1A:2B:3C:4D:5E")).toEqual("00:1A:2B:3C:4D:5E");
  // invalid mac (dash delimiter not accepted by default)
  expect(() => Schema.parse(a, "01-23-45-67-89-AB")).toThrow();
  expect(() => Schema.parse(a, "00:1A:2B::4D:5E")).toThrow();
  expect(() => Schema.parse(a, "00:1a-2B:3c-4D:5e")).toThrow();
  expect(() => Schema.parse(a, "hello")).toThrow();
  // wrong type
  expect(() => Schema.parse(a, 123)).toThrow();
});

test("Schema.mac with custom delimiter", () => {
  const a = Schema.mac({ delimiter: ":" });
  // valid mac with colon
  expect(Schema.parse(a, "00:1A:2B:3C:4D:5E")).toEqual("00:1A:2B:3C:4D:5E");
  // invalid mac with dash
  expect(() => Schema.parse(a, "00-1A-2B-3C-4D-5E")).toThrow();

  const b = Schema.mac({ delimiter: "-" });
  // valid mac with dash
  expect(Schema.parse(b, "00-1A-2B-3C-4D-5E")).toEqual("00-1A-2B-3C-4D-5E");
  // invalid mac with colon
  expect(() => Schema.parse(b, "00:1A:2B:3C:4D:5E")).toThrow();

  const c = Schema.mac({ delimiter: ":" });
  // colon-only mac
  expect(Schema.parse(c, "00:1A:2B:3C:4D:5E")).toEqual("00:1A:2B:3C:4D:5E");
  expect(() => Schema.parse(c, "00-1A-2B-3C-4D-5E")).toThrow();
});

test("Schema.base64", () => {
  const a = Schema.base64();
  // valid base64
  expect(Schema.parse(a, "SGVsbG8gd29ybGQ=")).toEqual("SGVsbG8gd29ybGQ=");
  expect(Schema.parse(a, "U29tZSBvdGhlciBzdHJpbmc=")).toEqual("U29tZSBvdGhlciBzdHJpbmc=");
  // invalid base64
  expect(() => Schema.parse(a, "SGVsbG8gd29ybGQ")).toThrow();
  expect(() => Schema.parse(a, "U29tZSBvdGhlciBzdHJpbmc")).toThrow();
  expect(() => Schema.parse(a, "hello")).toThrow();
  // whitespace is not allowed (atob would otherwise strip it)
  expect(() => Schema.parse(a, "123 ")).toThrow();
  expect(() => Schema.parse(a, "SGVsbG8gd29ybGQ= ")).toThrow();
  expect(() => Schema.parse(a, "SGVsbG8gd29ybGQ=\n")).toThrow();
  expect(() => Schema.parse(a, "SGVs bG8gd29ybGQ=")).toThrow();
  // wrong type
  expect(() => Schema.parse(a, 123)).toThrow();
});

// test("Schema.jsonString", () => {
//   const a = Schema.jsonString();
//   // valid JSON string
//   expect(Schema.parse(a, '{"key":"value"}')).toEqual('{"key":"value"}');
//   expect(Schema.parse(a, '["item1", "item2"]')).toEqual('["item1", "item2"]');
//   // invalid JSON string
//   expect(() => Schema.parse(a, '{"key":value}')).toThrow();
//   expect(() => Schema.parse(a, '["item1", "item2"')).toThrow();
//   expect(() => Schema.parse(a, "hello")).toThrow();
//   // wrong type
//   expect(() => Schema.parse(a, 123)).toThrow();
// });

test("Schema.e164", () => {
  const a = Schema.e164();
  // valid e164
  expect(Schema.parse(a, "+1234567890")).toEqual("+1234567890");
  expect(Schema.parse(a, "+19876543210")).toEqual("+19876543210");
  // invalid e164
  expect(() => Schema.parse(a, "1234567890")).toThrow();
  expect(() => Schema.parse(a, "+12345")).toThrow();
  expect(() => Schema.parse(a, "hello")).toThrow();
  // wrong type
  expect(() => Schema.parse(a, 123)).toThrow();
});

test("Schema.creditCard", () => {
  const a = Schema.creditCard();
  // valid credit card
  expect(Schema.parse(a, "4111111111111111")).toEqual("4111111111111111");
  expect(Schema.parse(a, "4111 1111 1111 1111")).toEqual("4111 1111 1111 1111");
  // failed Luhn checksum
  expect(() => Schema.parse(a, "4111111111111112")).toThrow();
  // outside the 12-19 digit range
  expect(() => Schema.parse(a, "40000000006")).toThrow();
  expect(() => Schema.parse(a, "hello")).toThrow();
  // wrong type
  expect(() => Schema.parse(a, 123)).toThrow();
});

test("Schema.iban", () => {
  const a = Schema.iban();
  // valid iban
  expect(Schema.parse(a, "DE89370400440532013000")).toEqual("DE89370400440532013000");
  expect(Schema.parse(a, "NO9386011117947")).toEqual("NO9386011117947");
  // failed mod 97 checksum
  expect(() => Schema.parse(a, "DE89370400440532013001")).toThrow();
  // formatting violations
  expect(() => Schema.parse(a, "de89370400440532013000")).toThrow();
  expect(() => Schema.parse(a, "DE89 3704 0044 0532 0130 00")).toThrow();
  expect(() => Schema.parse(a, "NO938601111794")).toThrow();
  expect(() => Schema.parse(a, "hello")).toThrow();
  // wrong type
  expect(() => Schema.parse(a, 123)).toThrow();
});

test("Schema.jwt", () => {
  const a = Schema.jwt();
  // valid jwt
  expect(
    Schema.parse(
      a,
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    )
  ).toEqual(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
  );
  // invalid jwt
  expect(() => Schema.parse(a, "invalid.jwt.token")).toThrow();
  expect(() => Schema.parse(a, "hello")).toThrow();
  // wrong type
  expect(() => Schema.parse(a, 123)).toThrow();
});

test("Schema.hash generic format", () => {
  expect(Schema.hash("sha256").parse("a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3")).toBe(
    "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"
  );

  // --- Type-level checks (ensure the literal format string is encoded in the return type)
  expectTypeOf(Schema.hash("md5")).toEqualTypeOf<Schema.SchemaMiniCustomStringFormat<"md5_hex">>();
  expectTypeOf(Schema.hash("sha1")).toEqualTypeOf<Schema.SchemaMiniCustomStringFormat<"sha1_hex">>();
  expectTypeOf(Schema.hash("sha256", { enc: "base64" as const })).toEqualTypeOf<
    Schema.SchemaMiniCustomStringFormat<"sha256_base64">
  >();
  expectTypeOf(Schema.hash("sha384", { enc: "base64url" as const })).toEqualTypeOf<
    Schema.SchemaMiniCustomStringFormat<"sha384_base64url">
  >();
});

test("Schema.currencyCode", () => {
  const a = Schema.currencyCode();
  expectTypeOf(a).toEqualTypeOf<Schema.SchemaMiniCustomStringFormat<"currency_code">>();
  expect(Schema.parse(a, "EUR")).toBe("EUR");
  expect(Schema.safeParse(a, "eur")).toMatchObject(FAIL);
});
