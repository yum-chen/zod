import { Validator } from "@seriousme/openapi-schema-validator";
import { describe, expect, test, vi } from "vitest";
import * as Schema   from "schema";
// import * as zCore from "schema/v4/core";

const openAPI30Validator = new Validator();
/** @see https://github.com/colinhacks/schema/issues/5147 */
const validateOpenAPI30Schema = async (schemaJSONSchema: Record<string, unknown>): Promise<true> => {
  const res = await openAPI30Validator.validate({
    openapi: "3.0.0",
    info: {
      title: "SampleApi",
      description: "Sample backend service",
      version: "1.0.0",
    },
    components: { schemas: { test: schemaJSONSchema } },
    paths: {},
  });

  if (!res.valid) {
    // `console.error` should make `vitest` trow an unhandled error printing the validation messages in consoles
    console.error(
      `OpenAPI schema is not valid against ${openAPI30Validator.version}`,
      JSON.stringify(res.errors, null, 2)
    );
  }

  return true;
};

describe("toJSONSchema", () => {
  test("primitive types", () => {
    expect(Schema.toJSONSchema(Schema.string())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.number())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "type": "number",
      }
    `);
    expect(Schema.toJSONSchema(Schema.boolean())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "type": "boolean",
      }
    `);
    expect(Schema.toJSONSchema(Schema.null())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "type": "null",
      }
    `);
    expect(Schema.toJSONSchema(Schema.undefined(), { unrepresentable: "any" })).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
      }
    `);
    expect(Schema.toJSONSchema(Schema.any())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
      }
    `);
    expect(Schema.toJSONSchema(Schema.unknown())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
      }
    `);
    expect(Schema.toJSONSchema(Schema.never())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "not": {},
      }
    `);
    expect(Schema.toJSONSchema(Schema.email())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "email",
        "pattern": "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.iso.datetime())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "date-time",
        "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.iso.date())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "date",
        "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$",
        "type": "string",
      }
    `);
    // only shapes keeping both an offset and seconds may advertise `date-time`, composed onto a string as well as constructed
    expect(Schema.toJSONSchema(Schema.iso.datetime()).format).toEqual("date-time");
    expect(Schema.toJSONSchema(Schema.iso.datetime({ offset: true })).format).toEqual("date-time");
    expect(Schema.toJSONSchema(Schema.iso.datetime({ precision: 0 })).format).toEqual("date-time");
    expect(Schema.toJSONSchema(Schema.iso.datetime({ local: true })).format).toEqual(undefined);
    expect(Schema.toJSONSchema(Schema.iso.datetime({ precision: -1 })).format).toEqual(undefined);
    expect(Schema.toJSONSchema(Schema.string().check(Schema.iso.datetime({ local: true }))).format).toEqual(undefined);
    expect(Schema.toJSONSchema(Schema.string().check(Schema.iso.datetime())).format).toEqual("date-time");
    // the pattern still describes what the schema accepts
    expect(Schema.toJSONSchema(Schema.iso.datetime({ local: true })).pattern).toBeDefined();

    expect(Schema.toJSONSchema(Schema.iso.time())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "pattern": "^(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.iso.time({ precision: -1 }))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "pattern": "^(?:[01]\\d|2[0-3]):[0-5]\\d$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.iso.time({ precision: 0 }))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "pattern": "^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.iso.time({ precision: 3 }))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "pattern": "^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d\\.\\d{3}$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.iso.duration())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "duration",
        "pattern": "^P(?:(\\d+W)|(?!.*W)(?=\\d|T\\d)(\\d+Y)?(\\d+M)?(\\d+D)?(T(?=\\d)(\\d+H)?(\\d+M)?(\\d+([.,]\\d+)?S)?)?)$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.ipv4())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "ipv4",
        "pattern": "^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.ipv6())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "ipv6",
        "pattern": "^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.mac())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "mac",
        "pattern": "^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.mac({ delimiter: ":" }))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "mac",
        "pattern": "^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.mac({ delimiter: "-" }))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "mac",
        "pattern": "^(?:[0-9A-F]{2}-){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}-){5}[0-9a-f]{2}$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.uuid())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "uuid",
        "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.guid())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "uuid",
        "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.url())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "uri",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.base64())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "contentEncoding": "base64",
        "format": "base64",
        "pattern": "^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.base64url())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "contentEncoding": "base64url",
        "format": "base64url",
        "pattern": "^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.cuid())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "cuid",
        "pattern": "^[cC][0-9a-z]{6,}$",
        "type": "string",
      }
    `);
    // expect(Schema.toJSONSchema(Schema.regex(/asdf/))).toMatchInlineSnapshot();
    expect(Schema.toJSONSchema(Schema.emoji())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "emoji",
        "pattern": "^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.nanoid())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "nanoid",
        "pattern": "^[a-zA-Z0-9_-]{21}$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.nanoid({ length: 64 }))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "nanoid",
        "pattern": "^[a-zA-Z0-9_-]{64}$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.cuid2())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "cuid2",
        "pattern": "^[0-9a-z]+$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.ulid())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "ulid",
        "pattern": "^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$",
        "type": "string",
      }
    `);
    // expect(Schema.toJSONSchema(Schema.cidr())).toMatchInlineSnapshot();
    expect(Schema.toJSONSchema(Schema.number())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "type": "number",
      }
    `);
    expect(Schema.toJSONSchema(Schema.int())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "maximum": 9007199254740991,
        "minimum": -9007199254740991,
        "type": "integer",
      }
    `);
    expect(Schema.toJSONSchema(Schema.int32())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "maximum": 2147483647,
        "minimum": -2147483648,
        "type": "integer",
      }
    `);
    expect(Schema.toJSONSchema(Schema.float32())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "maximum": 3.4028234663852886e+38,
        "minimum": -3.4028234663852886e+38,
        "type": "number",
      }
    `);
    expect(Schema.toJSONSchema(Schema.float64())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "maximum": 1.7976931348623157e+308,
        "minimum": -1.7976931348623157e+308,
        "type": "number",
      }
    `);
    expect(Schema.toJSONSchema(Schema.jwt())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "jwt",
        "type": "string",
      }
    `);
  });

  test("unsupported schema types", () => {
    expect(() => Schema.toJSONSchema(Schema.bigint())).toThrow("BigInt cannot be represented in JSON Schema");
    expect(() => Schema.toJSONSchema(Schema.int64())).toThrow("BigInt cannot be represented in JSON Schema");
    expect(() => Schema.toJSONSchema(Schema.symbol())).toThrow("Symbols cannot be represented in JSON Schema");
    expect(() => Schema.toJSONSchema(Schema.void())).toThrow("Void cannot be represented in JSON Schema");
    expect(() => Schema.toJSONSchema(Schema.undefined())).toThrow("Undefined cannot be represented in JSON Schema");
    expect(() => Schema.toJSONSchema(Schema.date())).toThrow("Date cannot be represented in JSON Schema");
    expect(() => Schema.toJSONSchema(Schema.map(Schema.string(), Schema.number()))).toThrow("Map cannot be represented in JSON Schema");
    expect(() => Schema.toJSONSchema(Schema.set(Schema.string()))).toThrow("Set cannot be represented in JSON Schema");
    expect(() => Schema.toJSONSchema(Schema.custom(() => true))).toThrow("Custom types cannot be represented in JSON Schema");

    // Transform
    const transformSchema = Schema.string().transform((val) => Number.parseInt(val));
    expect(() => Schema.toJSONSchema(transformSchema)).toThrow("Transforms cannot be represented in JSON Schema");

    // Static catch values
    const staticCatchSchema = Schema.string().catch(() => "sup");
    expect(Schema.toJSONSchema(staticCatchSchema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "default": "sup",
        "type": "string",
      }
    `);

    // Dynamic catch values
    const dynamicCatchSchema = Schema.string().catch((ctx) => `${ctx.issues.length}`);
    expect(() => Schema.toJSONSchema(dynamicCatchSchema)).toThrow("Dynamic catch values are not supported in JSON Schema");
    expect(Schema.toJSONSchema(dynamicCatchSchema, { unrepresentable: "any" })).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "type": "string",
      }
    `);
  });

  test("string formats", () => {
    expect(Schema.toJSONSchema(Schema.string().email())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "email",
        "pattern": "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.string().uuid())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "uuid",
        "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.iso.datetime())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "date-time",
        "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$",
        "type": "string",
      }
    `);

    expect(Schema.toJSONSchema(Schema.iso.date())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "date",
        "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.iso.time())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "pattern": "^(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.iso.duration())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "duration",
        "pattern": "^P(?:(\\d+W)|(?!.*W)(?=\\d|T\\d)(\\d+Y)?(\\d+M)?(\\d+D)?(T(?=\\d)(\\d+H)?(\\d+M)?(\\d+([.,]\\d+)?S)?)?)$",
        "type": "string",
      }
    `);
    // expect(Schema.toJSONSchema(Schema.string().ip())).toMatchInlineSnapshot(`
    //   {
    //     "pattern": /\\(\\^\\(\\?:\\(\\?:25\\[0-5\\]\\|2\\[0-4\\]\\[0-9\\]\\|1\\[0-9\\]\\[0-9\\]\\|\\[1-9\\]\\[0-9\\]\\|\\[0-9\\]\\)\\\\\\.\\)\\{3\\}\\(\\?:25\\[0-5\\]\\|2\\[0-4\\]\\[0-9\\]\\|1\\[0-9\\]\\[0-9\\]\\|\\[1-9\\]\\[0-9\\]\\|\\[0-9\\]\\)\\$\\)\\|\\(\\^\\(\\(\\[a-fA-F0-9\\]\\{1,4\\}:\\)\\{7\\}\\|::\\(\\[a-fA-F0-9\\]\\{1,4\\}:\\)\\{0,6\\}\\|\\(\\[a-fA-F0-9\\]\\{1,4\\}:\\)\\{1\\}:\\(\\[a-fA-F0-9\\]\\{1,4\\}:\\)\\{0,5\\}\\|\\(\\[a-fA-F0-9\\]\\{1,4\\}:\\)\\{2\\}:\\(\\[a-fA-F0-9\\]\\{1,4\\}:\\)\\{0,4\\}\\|\\(\\[a-fA-F0-9\\]\\{1,4\\}:\\)\\{3\\}:\\(\\[a-fA-F0-9\\]\\{1,4\\}:\\)\\{0,3\\}\\|\\(\\[a-fA-F0-9\\]\\{1,4\\}:\\)\\{4\\}:\\(\\[a-fA-F0-9\\]\\{1,4\\}:\\)\\{0,2\\}\\|\\(\\[a-fA-F0-9\\]\\{1,4\\}:\\)\\{5\\}:\\(\\[a-fA-F0-9\\]\\{1,4\\}:\\)\\{0,1\\}\\)\\(\\[a-fA-F0-9\\]\\{1,4\\}\\|\\(\\(\\(25\\[0-5\\]\\)\\|\\(2\\[0-4\\]\\[0-9\\]\\)\\|\\(1\\[0-9\\]\\{2\\}\\)\\|\\(\\[0-9\\]\\{1,2\\}\\)\\)\\\\\\.\\)\\{3\\}\\(\\(25\\[0-5\\]\\)\\|\\(2\\[0-4\\]\\[0-9\\]\\)\\|\\(1\\[0-9\\]\\{2\\}\\)\\|\\(\\[0-9\\]\\{1,2\\}\\)\\)\\)\\$\\)/,
    //     "type": "string",
    //   }
    // `);
    expect(Schema.toJSONSchema(Schema.ipv4())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "ipv4",
        "pattern": "^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$",
        "type": "string",
      }
    `);

    expect(Schema.toJSONSchema(Schema.ipv6())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "ipv6",
        "pattern": "^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$",
        "type": "string",
      }
    `);

    expect(Schema.toJSONSchema(Schema.mac())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "mac",
        "pattern": "^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.mac({ delimiter: ":" }))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "mac",
        "pattern": "^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.mac({ delimiter: "-" }))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "mac",
        "pattern": "^(?:[0-9A-F]{2}-){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}-){5}[0-9a-f]{2}$",
        "type": "string",
      }
    `);

    expect(Schema.toJSONSchema(Schema.base64())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "contentEncoding": "base64",
        "format": "base64",
        "pattern": "^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.url())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "uri",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.guid())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "uuid",
        "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.string().regex(/asdf/))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "pattern": "asdf",
        "type": "string",
      }
    `);
  });

  test("base64url pattern agrees with parse", () => {
    const schema = Schema.base64url();
    const pattern = new RegExp(Schema.toJSONSchema(schema).pattern!);
    // lengths 1 (mod 4) carry no whole byte; the emitted pattern must reject them like parse does
    for (const s of ["", "A", "AA", "AAA", "AAAA", "AAAAA"]) {
      expect(pattern.test(s)).toBe(Schema.safeParse(s).success);
    }
  });

  test("base64 pattern agrees with parse", () => {
    const schema = Schema.base64();
    const pattern = new RegExp(Schema.toJSONSchema(schema).pattern!);
    // the runtime def.pattern is lax; the emitted pattern must still carry the block structure parse enforces
    for (const s of ["", "A", "AA", "AAA", "AAAA", "AAAAA", "AA==", "AAA=", "A===", "=", "AAAA=="]) {
      expect(pattern.test(s)).toBe(Schema.safeParse(s).success);
    }
  });

  test("looseRecord with a format key emits the exact pattern", () => {
    // recordProcessor reads bag.patterns directly; it must apply the same lax-to-exact swap as stringProcessor
    const json = Schema.toJSONSchema(Schema.looseRecord(Schema.base64url(), Schema.number()));
    expect(Object.keys(json.patternProperties!)).toEqual([Schema.regexes.base64url.source]);
  });

  test("string patterns", () => {
    expect(
      Schema.toJSONSchema(
        z
          .string()
          .startsWith("hello")
          .includes("cruel")
          .includes("dark", { position: 10 })
          .endsWith("world")
          .regex(/stuff/)
      )
    ).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "allOf": [
          {
            "pattern": "^hello.*",
          },
          {
            "pattern": "cruel",
          },
          {
            "pattern": "^.{10,}dark",
          },
          {
            "pattern": ".*world$",
          },
          {
            "pattern": "stuff",
          },
        ],
        "type": "string",
      }
    `);

    expect(
      Schema.toJSONSchema(
        z
          .string()
          .startsWith("hello")
          .includes("cruel")
          .includes("dark", { position: 10 })
          .endsWith("world")
          .regex(/stuff/),
        {
          target: "draft-7",
        }
      )
    ).toMatchInlineSnapshot(`
      {
        "$schema": "http://json-Schema.org/draft-07/schema#",
        "allOf": [
          {
            "pattern": "^hello.*",
            "type": "string",
          },
          {
            "pattern": "cruel",
            "type": "string",
          },
          {
            "pattern": "^.{10,}dark",
            "type": "string",
          },
          {
            "pattern": ".*world$",
            "type": "string",
          },
          {
            "pattern": "stuff",
            "type": "string",
          },
        ],
        "type": "string",
      }
    `);
  });

  test("includes with position emits a pattern matching runtime semantics", () => {
    // String.prototype.includes(sub, position) matches `sub` at `position` OR
    // LATER, so the JSON Schema pattern must allow >= position leading chars.
    const schema = Schema.string().includes("foo", { position: 2 });
    const json = Schema.toJSONSchema(schema) as { pattern?: string };
    expect(json.pattern).toBe("^.{2,}foo");

    const re = new RegExp(json.pattern!);
    for (const input of ["xxfoo", "xxxfoo", "xfoo", "ab"]) {
      expect(re.test(input)).toBe(Schema.safeParse(input).success);
    }
  });

  test("number constraints", () => {
    expect(Schema.toJSONSchema(Schema.number().min(5).max(10))).toMatchInlineSnapshot(
      `
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "maximum": 10,
        "minimum": 5,
        "type": "number",
      }
    `
    );

    expect(Schema.toJSONSchema(Schema.number().gt(5).gt(10))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "exclusiveMinimum": 10,
        "type": "number",
      }
    `);

    expect(Schema.toJSONSchema(Schema.number().gt(5).gte(10))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "minimum": 10,
        "type": "number",
      }
    `);

    expect(Schema.toJSONSchema(Schema.number().lt(5).lt(3))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "exclusiveMaximum": 3,
        "type": "number",
      }
    `);

    expect(Schema.toJSONSchema(Schema.number().lt(5).lt(3).lte(2))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "maximum": 2,
        "type": "number",
      }
    `);

    expect(Schema.toJSONSchema(Schema.number().lt(5).lte(3))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "maximum": 3,
        "type": "number",
      }
    `);

    expect(Schema.toJSONSchema(Schema.number().gt(5).lt(10))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "exclusiveMaximum": 10,
        "exclusiveMinimum": 5,
        "type": "number",
      }
    `);
    expect(Schema.toJSONSchema(Schema.number().gte(5).lte(10))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "maximum": 10,
        "minimum": 5,
        "type": "number",
      }
    `);
    expect(Schema.toJSONSchema(Schema.number().positive())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "exclusiveMinimum": 0,
        "type": "number",
      }
    `);
    expect(Schema.toJSONSchema(Schema.number().negative())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "exclusiveMaximum": 0,
        "type": "number",
      }
    `);
    expect(Schema.toJSONSchema(Schema.number().nonpositive())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "maximum": 0,
        "type": "number",
      }
    `);
    expect(Schema.toJSONSchema(Schema.number().nonnegative())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "minimum": 0,
        "type": "number",
      }
    `);
  });

  test("number constraints draft-4", () => {
    expect(Schema.toJSONSchema(Schema.number().gt(5).lt(10), { target: "draft-4" })).toMatchInlineSnapshot(`
      {
        "$schema": "http://json-Schema.org/draft-04/schema#",
        "exclusiveMaximum": true,
        "exclusiveMinimum": true,
        "maximum": 10,
        "minimum": 5,
        "type": "number",
      }
    `);
  });

  test("number constraints intersection draft-04", () => {
    // When both minimum (from .int()) and exclusiveMinimum (from .positive()) exist, the more restrictive constraint should be used
    expect(Schema.toJSONSchema(Schema.number().int().positive().lte(65535), { target: "draft-04" })).toMatchInlineSnapshot(`
      {
        "$schema": "http://json-Schema.org/draft-04/schema#",
        "exclusiveMinimum": true,
        "maximum": 65535,
        "minimum": 0,
        "type": "integer",
      }
    `);
    // Same for openapi-3.0
    expect(Schema.toJSONSchema(Schema.number().int().positive().lte(65535), { target: "openapi-3.0" })).toMatchInlineSnapshot(`
      {
        "exclusiveMinimum": true,
        "maximum": 65535,
        "minimum": 0,
        "type": "integer",
      }
    `);
    // When inclusive minimum is more restrictive than exclusive minimum
    expect(Schema.toJSONSchema(Schema.number().gt(3).gte(10), { target: "draft-04" })).toMatchInlineSnapshot(`
      {
        "$schema": "http://json-Schema.org/draft-04/schema#",
        "minimum": 10,
        "type": "number",
      }
    `);
    // Same logic for maximum constraints
    expect(Schema.toJSONSchema(Schema.number().int().negative(), { target: "draft-04" })).toMatchInlineSnapshot(`
      {
        "$schema": "http://json-Schema.org/draft-04/schema#",
        "exclusiveMaximum": true,
        "maximum": 0,
        "minimum": -9007199254740991,
        "type": "integer",
      }
    `);
  });

  test("number constraints order independence with int()", () => {
    // .int() applied last should not overwrite the tighter bounds .min()/.max() already stored
    expect(Schema.toJSONSchema(Schema.number().int().min(0).max(23))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "maximum": 23,
        "minimum": 0,
        "type": "integer",
      }
    `);
    expect(Schema.toJSONSchema(Schema.number().min(0).max(23).int())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "maximum": 23,
        "minimum": 0,
        "type": "integer",
      }
    `);
  });

  test("chained multipleOf divisors emit the whole conjunction", () => {
    // runtime rejects 4 (not a multiple of 3), so the emitted schema must too
    expect(Schema.toJSONSchema(Schema.number().multipleOf(2).multipleOf(3))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "allOf": [
          {
            "multipleOf": 3,
          },
        ],
        "multipleOf": 2,
        "type": "number",
      }
    `);
  });

  test("length() does not overwrite a tighter earlier bound", () => {
    // min(8) + length(5) matches nothing at runtime; the emitted bounds stay honest about that
    expect(Schema.toJSONSchema(Schema.string().min(8).length(5))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "maxLength": 5,
        "minLength": 8,
        "type": "string",
      }
    `);
  });

  test("an integer format keeps the emitted type integer whatever format lands last", () => {
    // runtime rejects 1.5 in both orders, so both must emit type integer
    const after = Schema.number().int().check(Schema.float32());
    expect(after.safeParse(1.5).success).toBe(false);
    expect(Schema.toJSONSchema(after).type).toBe("integer");
    expect(Schema.toJSONSchema(Schema.number().check(Schema.float32()).int()).type).toBe("integer");
  });

  test("disjoint mime checks emit a false schema, not an unconstrained file", () => {
    const file = Schema.file().mime("image/png").mime("text/plain");
    expect(Schema.toJSONSchema(file)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "contentEncoding": "binary",
        "format": "binary",
        "not": {},
        "type": "string",
      }
    `);
  });

  test("a custom mime narrowing via onattach intersects with built-in mime checks", () => {
    const check = {
      _schema: {
        def: { check: "custom_mime" },
        onattach: [
          (inst: any) => {
            inst._schema.bag.mime = ["text/plain"];
          },
        ],
        check: () => {},
      },
    };
    const file = z
      .file()
      .mime(["image/png", "text/plain"])
      .check(check as any);
    expect(Schema.toJSONSchema(file).contentMediaType).toBe("text/plain");
  });

  test("a custom check contributing via onattach still lands", () => {
    // third-party checks have no converter handler; their bag writes are merged in as a fallback
    const check = {
      _schema: {
        def: { check: "custom_range" },
        onattach: [
          (inst: any) => {
            const bag = inst._schema.bag;
            if (bag.minimum === undefined || 5 > bag.minimum) bag.minimum = 5;
          },
        ],
        check: () => {},
      },
    };
    expect(Schema.toJSONSchema(Schema.number().check(check as any))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "minimum": 5,
        "type": "number",
      }
    `);
  });

  test("target normalization draft-04 and draft-07", () => {
    // Test that both old (draft-4, draft-7) and new (draft-04, draft-07) target formats work

    // Test draft-04 / draft-4
    expect(Schema.toJSONSchema(Schema.number().gt(5), { target: "draft-04" })).toMatchInlineSnapshot(`
      {
        "$schema": "http://json-Schema.org/draft-04/schema#",
        "exclusiveMinimum": true,
        "minimum": 5,
        "type": "number",
      }
    `);
    expect(Schema.toJSONSchema(Schema.number().gt(5), { target: "draft-4" })).toMatchInlineSnapshot(`
      {
        "$schema": "http://json-Schema.org/draft-04/schema#",
        "exclusiveMinimum": true,
        "minimum": 5,
        "type": "number",
      }
    `);
    // Test draft-07 / draft-7
    expect(Schema.toJSONSchema(Schema.number().gt(5), { target: "draft-07" })).toMatchInlineSnapshot(`
      {
        "$schema": "http://json-Schema.org/draft-07/schema#",
        "exclusiveMinimum": 5,
        "type": "number",
      }
    `);
    expect(Schema.toJSONSchema(Schema.number().gt(5), { target: "draft-7" })).toMatchInlineSnapshot(`
      {
        "$schema": "http://json-Schema.org/draft-07/schema#",
        "exclusiveMinimum": 5,
        "type": "number",
      }
    `);
  });

  test("nullable openapi-3.0", () => {
    const schema = Schema.string().nullable();
    const jsonSchema = Schema.toJSONSchema(schema, { target: "openapi-3.0" });
    validateOpenAPI30Schema(jsonSchema);
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "nullable": true,
        "type": "string",
      }
    `);
  });

  test("union with null openapi-3.0", () => {
    const schema = Schema.union([Schema.string(), Schema.null()]);
    const jsonSchema = Schema.toJSONSchema(schema, { target: "openapi-3.0" });
    validateOpenAPI30Schema(jsonSchema);
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "anyOf": [
          {
            "type": "string",
          },
          {
            "enum": [
              null,
            ],
            "nullable": true,
            "type": "string",
          },
        ],
      }
    `);
  });

  test("number with exclusive min-max openapi-3.0", () => {
    const schema = Schema.number().lt(100).gt(1);
    const jsonSchema = Schema.toJSONSchema(schema, { target: "openapi-3.0" });
    validateOpenAPI30Schema(jsonSchema);
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "exclusiveMaximum": true,
        "exclusiveMinimum": true,
        "maximum": 100,
        "minimum": 1,
        "type": "number",
      }
    `);
  });

  test("arrays", () => {
    expect(Schema.toJSONSchema(Schema.array(Schema.string()))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "items": {
          "type": "string",
        },
        "type": "array",
      }
    `);
  });

  test("unions", () => {
    const schema = Schema.union([Schema.string(), Schema.number()]);
    expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "type": [
          "string",
          "number",
        ],
      }
    `);
  });

  test("nullable compacts to a type array", () => {
    expect(Schema.toJSONSchema(Schema.string().nullable())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "type": [
          "string",
          "null",
        ],
      }
    `);

    // a nested union folds into the outer type array rather than leaving a mixed shape
    expect(Schema.toJSONSchema(Schema.union([Schema.string(), Schema.number()]).nullable())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "type": [
          "string",
          "number",
          "null",
        ],
      }
    `);

    // the null branch is bare but the object branch is not, so this stays an anyOf
    expect(Schema.toJSONSchema(Schema.object({ a: Schema.string() }).nullable())).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "anyOf": [
          {
            "additionalProperties": false,
            "properties": {
              "a": {
                "type": "string",
              },
            },
            "required": [
              "a",
            ],
            "type": "object",
          },
          {
            "type": "null",
          },
        ],
      }
    `);
  });

  test("duplicate branches dedupe, single branch stays a bare type", () => {
    // a `type` array must have unique members, so two branches that erase to the same bare type collapse
    const refined = Schema.union([Schema.string().refine((s) => s.length > 2), Schema.string().refine((s) => s.length < 9)]);
    expect(Schema.toJSONSchema(refined)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "type": "string",
      }
    `);
    expect(Schema.toJSONSchema(Schema.union([Schema.string()]))).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "type": "string",
      }
    `);
  });

  test("compaction runs after overrides and ref extraction", () => {
    // an override decorates the string branch, so it is no longer a bare type and must survive in anyOf
    const decorated = Schema.toJSONSchema(Schema.union([Schema.string(), Schema.number()]), {
      override(ctx) {
        if (ctx.schemaSchema._schema.def.type === "string") ctx.jsonSchema.whatever = "sup";
      },
    });
    expect(decorated).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "anyOf": [
          {
            "type": "string",
            "whatever": "sup",
          },
          {
            "type": "number",
          },
        ],
      }
    `);

    // a branch extracted into $defs is a $ref, not a bare type, so `reused` is not silently bypassed
    const shared = Schema.string();
    expect(
      Schema.toJSONSchema(Schema.object({ a: shared, b: Schema.union([shared, Schema.null()]) }), { reused: "ref" })
    ).toMatchInlineSnapshot(`
      {
        "$defs": {
          "__schema0": {
            "type": "string",
          },
        },
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "properties": {
          "a": {
            "$ref": "#/$defs/__schema0",
          },
          "b": {
            "anyOf": [
              {
                "$ref": "#/$defs/__schema0",
              },
              {
                "type": "null",
              },
            ],
          },
        },
        "required": [
          "a",
          "b",
        ],
        "type": "object",
      }
    `);
  });

  test("openapi-3.0 keeps a single-string type", () => {
    // OpenAPI 3.0 has no type arrays; nullability is spelled with `nullable`
    expect(Schema.toJSONSchema(Schema.string().nullable(), { target: "openapi-3.0" })).toMatchInlineSnapshot(`
      {
        "nullable": true,
        "type": "string",
      }
    `);
  });

  test("union with constrained branch is not compacted", () => {
    const schema = Schema.union([Schema.string().min(1), Schema.number()]);
    expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "anyOf": [
          {
            "minLength": 1,
            "type": "string",
          },
          {
            "type": "number",
          },
        ],
      }
    `);
  });

  test("union of literals is not compacted", () => {
    const schema = Schema.union([Schema.literal("a"), Schema.literal("b")]);
    expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "anyOf": [
          {
            "const": "a",
            "type": "string",
          },
          {
            "const": "b",
            "type": "string",
          },
        ],
      }
    `);
  });

  test("discriminated unions", () => {
    const schema = Schema.discriminatedUnion("type", [
      Schema.object({ type: Schema.literal("success"), data: Schema.string() }),
      Schema.object({ type: Schema.literal("error"), message: Schema.string() }),
    ]);
    expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "oneOf": [
          {
            "additionalProperties": false,
            "properties": {
              "data": {
                "type": "string",
              },
              "type": {
                "const": "success",
                "type": "string",
              },
            },
            "required": [
              "type",
              "data",
            ],
            "type": "object",
          },
          {
            "additionalProperties": false,
            "properties": {
              "message": {
                "type": "string",
              },
              "type": {
                "const": "error",
                "type": "string",
              },
            },
            "required": [
              "type",
              "message",
            ],
            "type": "object",
          },
        ],
      }
    `);
  });

  test("intersections", () => {
    const schema = Schema.intersection(Schema.object({ name: Schema.string() }), Schema.object({ age: Schema.number() }));

    expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "properties": {
          "age": {
            "type": "number",
          },
          "name": {
            "type": "string",
          },
        },
        "required": [
          "name",
          "age",
        ],
        "type": "object",
      }
    `);
  });

  test("record", () => {
    const schema = Schema.record(Schema.string(), Schema.boolean());
    expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": {
          "type": "boolean",
        },
        "propertyNames": {
          "type": "string",
        },
        "type": "object",
      }
    `);
  });

  test("record openapi-3.0", () => {
    const schema = Schema.record(Schema.string(), Schema.boolean());
    const jsonSchema = Schema.toJSONSchema(schema, { target: "openapi-3.0" });
    validateOpenAPI30Schema(jsonSchema);
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "additionalProperties": {
          "type": "boolean",
        },
        "type": "object",
      }
    `);
  });

  test("record with enum keys adds required", () => {
    const schema = Schema.record(Schema.enum(["key1", "key2"]), Schema.number());

    expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": {
          "type": "number",
        },
        "propertyNames": {
          "enum": [
            "key1",
            "key2",
          ],
          "type": "string",
        },
        "required": [
          "key1",
          "key2",
        ],
        "type": "object",
      }
    `);
  });

  test("record with enum keys drops required for an optional-in value under io: input", () => {
    const schema = Schema.record(Schema.enum(["key1", "key2"]), Schema.number().default(0));

    expect(Schema.toJSONSchema(schema, { io: "input" }).required).toBeUndefined();
    expect(Schema.toJSONSchema(schema).required).toEqual(["key1", "key2"]);
    expect(Schema.toJSONSchema(Schema.record(Schema.enum(["key1", "key2"]), Schema.number()), { io: "input" }).required).toEqual([
      "key1",
      "key2",
    ]);
    // A caught value keeps required, matching the input type and Schema.object().
    expect(Schema.toJSONSchema(Schema.record(Schema.enum(["key1", "key2"]), Schema.number().catch(0)), { io: "input" }).required).toEqual([
      "key1",
      "key2",
    ]);
  });

  test("record stringifies numeric enum keys for propertyNames and required", () => {
    enum NumberEnum {
      Zero = 0,
      One = 1,
    }
    const schema = Schema.record(Schema.enum(NumberEnum), Schema.string());

    expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": {
          "type": "string",
        },
        "propertyNames": {
          "enum": [
            "0",
            "1",
          ],
          "type": "string",
        },
        "required": [
          "0",
          "1",
        ],
        "type": "object",
      }
    `);
  });

  test("record with a numeric key emits propertyNames over the numeric-string form", () => {
    expect(Schema.toJSONSchema(Schema.record(Schema.number(), Schema.boolean())).propertyNames).toEqual({
      type: "string",
      pattern: "^-?\\d+(?:\\.\\d+)?$",
    });
    // range checks can't apply to a key, so only the integer shape survives
    expect(Schema.toJSONSchema(Schema.record(Schema.int32(), Schema.boolean())).propertyNames).toEqual({
      type: "string",
      pattern: "^-?\\d+$",
    });
    expect(Schema.toJSONSchema(Schema.record(Schema.literal([1, 2]), Schema.boolean()))).toMatchObject({
      propertyNames: { type: "string", enum: ["1", "2"] },
      required: ["1", "2"],
    });
    expect(Schema.toJSONSchema(Schema.record(Schema.literal(1), Schema.boolean())).propertyNames).toEqual({
      type: "string",
      const: "1",
    });
  });

  test("record key rewrite reaches through wrappers and union branches", () => {
    const numericString = { type: "string", pattern: "^-?\\d+(?:\\.\\d+)?$" };
    // a wrapper only carries its inner type once the refs are flattened, so this is decided after the record itself is emitted
    expect(
      Schema.toJSONSchema(
        Schema.record(
          Schema.lazy(() => Schema.number()),
          Schema.boolean()
        )
      ).propertyNames
    ).toEqual(numericString);
    expect(Schema.toJSONSchema(Schema.record(Schema.number().pipe(Schema.number()), Schema.boolean())).propertyNames).toEqual(numericString);
    expect(Schema.toJSONSchema(Schema.record(Schema.number().readonly(), Schema.boolean())).propertyNames).toMatchObject(numericString);
    expect(Schema.toJSONSchema(Schema.record(Schema.union([Schema.literal("Tuna"), Schema.literal(21)]), Schema.string()))).toMatchObject({
      propertyNames: {
        anyOf: [
          { type: "string", const: "Tuna" },
          { type: "string", const: "21" },
        ],
      },
      required: ["Tuna", "21"],
    });
  });

  test("record with a numeric key inlines an extracted key, and leaves a string one referenced", () => {
    expect(Schema.toJSONSchema(Schema.record(Schema.number().meta({ id: "Num" }), Schema.boolean())).propertyNames).toEqual({
      type: "string",
      pattern: "^-?\\d+(?:\\.\\d+)?$",
    });
    expect(Schema.toJSONSchema(Schema.record(Schema.string().meta({ id: "Str" }), Schema.boolean())).propertyNames).toEqual({
      $ref: "#/$defs/Str",
    });
    // the value position still wants the number form, so the two cannot share one def
    const key = Schema.number().meta({ id: "Shared" });
    expect(Schema.toJSONSchema(Schema.object({ a: key, b: Schema.record(key, Schema.string()) }))).toMatchObject({
      properties: { a: { $ref: "#/$defs/Shared" }, b: { propertyNames: { type: "string" } } },
      $defs: { Shared: { type: "number" } },
    });
  });

  test("record key rewrite reaches a wrapped record", () => {
    // the flatten copies a record's properties onto its wrapper by reference, so the rewrite has to find every copy
    expect(Schema.toJSONSchema(Schema.record(Schema.number(), Schema.boolean()).optional()).propertyNames).toEqual({
      type: "string",
      pattern: "^-?\\d+(?:\\.\\d+)?$",
    });
    expect(Schema.toJSONSchema(Schema.object({ a: Schema.record(Schema.literal([1, 2]), Schema.boolean()).optional() }))).toMatchObject({
      properties: { a: { propertyNames: { type: "string", enum: ["1", "2"] }, required: ["1", "2"] } },
    });
  });

  test("record with a recursive key converts without looping", () => {
    const numeric: any = Schema.lazy(() => Schema.union([Schema.number(), numeric]));
    expect(Schema.toJSONSchema(Schema.record(numeric, Schema.boolean())).propertyNames).toMatchObject({
      anyOf: [{ type: "string", pattern: "^-?\\d+(?:\\.\\d+)?$" }, { $ref: "#/$defs/__schema0" }],
    });
    // a key with nothing to re-express keeps the reference it had
    const stringy: any = Schema.lazy(() => Schema.union([Schema.string(), stringy]));
    expect(Schema.toJSONSchema(Schema.record(stringy, Schema.boolean())).propertyNames).toEqual({ $ref: "#/$defs/__schema0" });
    expect(
      Schema.toJSONSchema(Schema.record(Schema.union([Schema.literal("a"), Schema.literal("b")]).meta({ id: "Keys" }), Schema.boolean()))
        .propertyNames
    ).toEqual({ $ref: "#/$defs/Keys" });
  });

  test("record with a heterogeneous key stringifies only its numeric members", () => {
    // a mixed key carries no `type`, so the numeric members are caught by value rather than by type
    expect(Schema.toJSONSchema(Schema.record(Schema.literal(["a", 1]), Schema.boolean()))).toMatchObject({
      propertyNames: { enum: ["a", "1"] },
      required: ["a", "1"],
    });
    // a member no key can spell is left as it was, since the parser only ever retries a key as a number
    expect(Schema.toJSONSchema(Schema.record(Schema.literal(["a", true]) as any, Schema.boolean())).propertyNames).toEqual({
      enum: ["a", true],
    });
  });

  test("record stringifies required for every target", () => {
    const schema = Schema.record(Schema.literal([1, 2]), Schema.boolean());
    for (const target of ["draft-2020-12", "draft-7", "draft-4", "openapi-3.0"] as const) {
      expect(Schema.toJSONSchema(schema, { target }).required).toEqual(["1", "2"]);
    }
  });

  test("strict record with regex key uses propertyNames", () => {
    const schema = Schema.record(Schema.string().regex(/^label:[a-z]{2}$/), Schema.string());

    expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": {
          "type": "string",
        },
        "propertyNames": {
          "pattern": "^label:[a-z]{2}$",
          "type": "string",
        },
        "type": "object",
      }
    `);
  });

  test("looseRecord with regex key uses patternProperties", () => {
    const schema = Schema.looseRecord(Schema.string().regex(/^label:[a-z]{2}$/), Schema.string());

    expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "patternProperties": {
          "^label:[a-z]{2}$": {
            "type": "string",
          },
        },
        "type": "object",
      }
    `);
  });

  test("looseRecord with multiple regex patterns uses patternProperties", () => {
    const schema = Schema.looseRecord(
      z
        .string()
        .regex(/^prefix_/)
        .regex(/_suffix$/),
      Schema.number()
    );

    expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "patternProperties": {
          "^prefix_": {
            "type": "number",
          },
          "_suffix$": {
            "type": "number",
          },
        },
        "type": "object",
      }
    `);
  });

  test("looseRecord without regex key uses propertyNames", () => {
    // looseRecord with plain string key should still use propertyNames
    const schema = Schema.looseRecord(Schema.string(), Schema.boolean());

    expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": {
          "type": "boolean",
        },
        "propertyNames": {
          "type": "string",
        },
        "type": "object",
      }
    `);
  });

  test("intersection of object with looseRecord uses patternProperties", () => {
    const zLabeled = Schema.object({ label: Schema.string() });
    const zLocalizedLabeled = Schema.looseRecord(Schema.string().regex(/^label:[a-z]{2}$/), Schema.string());
    const schema = zLabeled.and(zLocalizedLabeled);

    expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "allOf": [
          {
            "additionalProperties": false,
            "properties": {
              "label": {
                "type": "string",
              },
            },
            "required": [
              "label",
            ],
            "type": "object",
          },
          {
            "patternProperties": {
              "^label:[a-z]{2}$": {
                "type": "string",
              },
            },
            "type": "object",
          },
        ],
      }
    `);
  });

  test("tuple", () => {
    const schema = Schema.tuple([Schema.string(), Schema.number()]);
    expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "items": false,
        "maxItems": 2,
        "minItems": 2,
        "prefixItems": [
          {
            "type": "string",
          },
          {
            "type": "number",
          },
        ],
        "type": "array",
      }
    `);
  });

  test("tuple with rest", () => {
    const schema = Schema.tuple([Schema.string(), Schema.number()]).rest(Schema.boolean());
    expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "items": {
          "type": "boolean",
        },
        "minItems": 2,
        "prefixItems": [
          {
            "type": "string",
          },
          {
            "type": "number",
          },
        ],
        "type": "array",
      }
    `);
  });

  test("tuple openapi-3.0", () => {
    const schema = Schema.tuple([Schema.string(), Schema.number()]);
    const jsonSchema = Schema.toJSONSchema(schema, { target: "openapi-3.0" });
    validateOpenAPI30Schema(jsonSchema);
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "items": {
          "anyOf": [
            {
              "type": "string",
            },
            {
              "type": "number",
            },
          ],
        },
        "maxItems": 2,
        "minItems": 2,
        "type": "array",
      }
    `);
  });

  test("tuple with rest openapi-3.0", () => {
    const schema = Schema.tuple([Schema.string(), Schema.number()]).rest(Schema.boolean());
    const jsonSchema = Schema.toJSONSchema(schema, { target: "openapi-3.0" });
    validateOpenAPI30Schema(jsonSchema);
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "items": {
          "anyOf": [
            {
              "type": "string",
            },
            {
              "type": "number",
            },
            {
              "type": "boolean",
            },
          ],
        },
        "minItems": 2,
        "type": "array",
      }
    `);
  });

  test("tuple with null openapi-3.0", () => {
    const schema = Schema.tuple([Schema.string(), Schema.number(), Schema.null()]);
    const jsonSchema = Schema.toJSONSchema(schema, { target: "openapi-3.0" });
    validateOpenAPI30Schema(jsonSchema);
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "items": {
          "anyOf": [
            {
              "type": "string",
            },
            {
              "type": "number",
            },
            {
              "enum": [
                null,
              ],
              "nullable": true,
              "type": "string",
            },
          ],
        },
        "maxItems": 3,
        "minItems": 3,
        "type": "array",
      }
    `);
  });

  test("tuple draft-7", () => {
    const schema = Schema.tuple([Schema.string(), Schema.number()]);
    expect(Schema.toJSONSchema(schema, { target: "draft-7", io: "input" })).toMatchInlineSnapshot(`
      {
        "$schema": "http://json-Schema.org/draft-07/schema#",
        "additionalItems": false,
        "items": [
          {
            "type": "string",
          },
          {
            "type": "number",
          },
        ],
        "maxItems": 2,
        "minItems": 2,
        "type": "array",
      }
    `);
  });

  test("tuple with rest draft-7", () => {
    const schema = Schema.tuple([Schema.string(), Schema.number()]).rest(Schema.boolean());
    expect(Schema.toJSONSchema(schema, { target: "draft-7", io: "input" })).toMatchInlineSnapshot(`
      {
        "$schema": "http://json-Schema.org/draft-07/schema#",
        "additionalItems": {
          "type": "boolean",
        },
        "items": [
          {
            "type": "string",
          },
          {
            "type": "number",
          },
        ],
        "minItems": 2,
        "type": "array",
      }
    `);
  });

  test("tuple with rest draft-7 - issue #5151 regression test", () => {
    // This test addresses issue #5151: tuple with rest elements and ids in draft-7 had incorrect internal path handling affecting complex scenarios
    const primarySchema = Schema.string().meta({ id: "primary" });
    const restSchema = Schema.number().meta({ id: "rest" });
    const testSchema = Schema.tuple([primarySchema], restSchema);

    // Test both final output structure AND internal path handling
    const capturedPaths: string[] = [];
    const result = Schema.toJSONSchema(testSchema, {
      target: "draft-7",
      override: (ctx) => capturedPaths.push(ctx.path.join("/")),
    });

    // Verify correct draft-7 structure with metadata extraction
    expect(result).toMatchInlineSnapshot(`
      {
        "$schema": "http://json-Schema.org/draft-07/schema#",
        "additionalItems": {
          "$ref": "#/definitions/rest",
        },
        "definitions": {
          "primary": {
            "type": "string",
          },
          "rest": {
            "type": "number",
          },
        },
        "items": [
          {
            "$ref": "#/definitions/primary",
          },
        ],
        "minItems": 1,
        "type": "array",
      }
    `);

    // Verify internal paths are correct (this was the actual bug)
    expect(capturedPaths).toContain("items/0"); // prefix items should use "items" path
    expect(capturedPaths).toContain("additionalItems"); // rest should use "additionalItems" path
    expect(capturedPaths).not.toContain("prefixItems/0"); // should not use draft-2020-12 paths

    // Structural validations
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.additionalItems).toBeDefined();
  });

  test("closed tuple length constraints - issue #6193", () => {
    const schema = Schema.tuple([Schema.string(), Schema.string(), Schema.object({ lang: Schema.string() })]);

    expect(Schema.safeParse(["a", "b", { lang: "en" }, "extra"]).success).toBe(false);

    const draft2020 = Schema.toJSONSchema(schema, { target: "draft-2020-12" });
    expect(draft2020.items).toBe(false);
    expect(draft2020.minItems).toBe(3);
    expect(draft2020.maxItems).toBe(3);

    const draft7 = Schema.toJSONSchema(schema, { target: "draft-7", io: "input" });
    expect(draft7.additionalItems).toBe(false);
    expect(draft7.minItems).toBe(3);
    expect(draft7.maxItems).toBe(3);

    const openapi = Schema.toJSONSchema(schema, { target: "openapi-3.0" });
    validateOpenAPI30Schema(openapi);
    expect(openapi.minItems).toBe(3);
    expect(openapi.maxItems).toBe(3);
  });

  test("closed tuple with optional trailing items", () => {
    const schema = Schema.tuple([Schema.string(), Schema.number().optional()]);

    const draft2020 = Schema.toJSONSchema(schema, { target: "draft-2020-12" });
    expect(draft2020.items).toBe(false);
    expect(draft2020.minItems).toBe(1);
    expect(draft2020.maxItems).toBe(2);

    const draft7 = Schema.toJSONSchema(schema, { target: "draft-7", io: "input" });
    expect(draft7.additionalItems).toBe(false);
    expect(draft7.minItems).toBe(1);
    expect(draft7.maxItems).toBe(2);
  });

  test("empty closed tuple rejects extra elements", () => {
    const schema = Schema.tuple([]);

    const draft2020 = Schema.toJSONSchema(schema, { target: "draft-2020-12" });
    expect(draft2020.items).toBe(false);
    expect(draft2020.maxItems).toBe(0);

    const draft7 = Schema.toJSONSchema(schema, { target: "draft-7", io: "input" });
    expect(draft7.additionalItems).toBe(false);
    expect(draft7.maxItems).toBe(0);

    const openapi = Schema.toJSONSchema(schema, { target: "openapi-3.0" });
    validateOpenAPI30Schema(openapi);
    expect(openapi.maxItems).toBe(0);
  });

  test("closed tuple length respects io direction with defaults", () => {
    const schema = Schema.tuple([Schema.string(), Schema.string().default("x")]);

    const input = Schema.toJSONSchema(schema, { target: "draft-2020-12", io: "input" });
    expect(input.items).toBe(false);
    expect(input.minItems).toBe(1);
    expect(input.maxItems).toBe(2);

    const output = Schema.toJSONSchema(schema, { target: "draft-2020-12", io: "output" });
    expect(output.items).toBe(false);
    expect(output.minItems).toBe(2);
    expect(output.maxItems).toBe(2);
  });

  test("closed tuple length resolves input optionality past transform and catch", () => {
    const minItems = (schema: Schema.core.$SchemaType, io: "input" | "output") =>
      Schema.toJSONSchema(schema, { target: "draft-2020-12", io }).minItems;

    // Both let the parser observe an absent slot, but declare a required input.
    const pre = Schema.tuple([Schema.string(), Schema.preprocess((v) => v, Schema.string())]);
    expect(minItems(pre, "input")).toBe(2);
    expect(minItems(pre, "output")).toBe(2);

    const caught = Schema.tuple([Schema.string(), Schema.string().catch("x")]);
    expect(minItems(caught, "input")).toBe(2);
    expect(minItems(caught, "output")).toBe(2);

    // Resolution passes through the wrapper rather than stopping at it.
    expect(minItems(Schema.tuple([Schema.string(), Schema.string().optional().catch("x")]), "input")).toBe(1);
  });

  test("promise", () => {
    const schema = Schema.promise(Schema.string());
    expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "type": "string",
      }
    `);
  });

  test("lazy", () => {
    const schema = Schema.lazy(() => Schema.string());
    expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "type": "string",
      }
    `);
  });

  // enum
  test("enum", () => {
    const a = Schema.enum(["a", "b", "c"]);
    expect(Schema.toJSONSchema(a)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "enum": [
          "a",
          "b",
          "c",
        ],
        "type": "string",
      }
    `);

    enum B {
      A = 0,
      B = 1,
      C = 2,
    }

    const b = Schema.enum(B);
    expect(Schema.toJSONSchema(b)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "enum": [
          0,
          1,
          2,
        ],
        "type": "number",
      }
    `);
  });

  // literal
  test("literal", () => {
    const a = Schema.literal("hello");
    expect(Schema.toJSONSchema(a)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "const": "hello",
        "type": "string",
      }
    `);

    const b = Schema.literal(7);
    expect(Schema.toJSONSchema(b)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "const": 7,
        "type": "number",
      }
    `);

    const c = Schema.literal(["hello", undefined, null, 5, BigInt(1324)]);
    expect(() => Schema.toJSONSchema(c)).toThrow();

    const d = Schema.literal(["hello", null, 5]);
    expect(Schema.toJSONSchema(d)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "enum": [
          "hello",
          null,
          5,
        ],
      }
    `);

    const e = Schema.literal(["hello", "schema", "v4"]);
    expect(Schema.toJSONSchema(e)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "enum": [
          "hello",
          "schema",
          "v4",
        ],
        "type": "string",
      }
    `);
  });

  test("literal draft-4", () => {
    const a = Schema.literal("hello");
    expect(Schema.toJSONSchema(a, { target: "draft-4" })).toMatchInlineSnapshot(`
      {
        "$schema": "http://json-Schema.org/draft-04/schema#",
        "enum": [
          "hello",
        ],
        "type": "string",
      }
    `);
  });

  // pipe
  test("pipe", () => {
    const schema = z
      .string()
      .transform((val) => Number.parseInt(val))
      .pipe(Schema.number());
    expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "type": "number",
      }
    `);
  });

  test("simple objects", () => {
    const schema = Schema.object({
      name: Schema.string(),
      age: Schema.number(),
    });

    expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(
      `
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "properties": {
          "age": {
            "type": "number",
          },
          "name": {
            "type": "string",
          },
        },
        "required": [
          "name",
          "age",
        ],
        "type": "object",
      }
    `
    );
  });

  test("additionalproperties in Schema.object", () => {
    const a = Schema.object({
      name: Schema.string(),
    });
    expect(Schema.toJSONSchema(a)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "properties": {
          "name": {
            "type": "string",
          },
        },
        "required": [
          "name",
        ],
        "type": "object",
      }
    `);
    expect(Schema.toJSONSchema(a, { io: "input" })).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "properties": {
          "name": {
            "type": "string",
          },
        },
        "required": [
          "name",
        ],
        "type": "object",
      }
    `);
    expect(
      Schema.toJSONSchema(a, {
        io: "input",
        override(ctx) {
          const def = ctx.schemaSchema._schema.def;
          if (def.type === "object" && !def.catchall) {
            (ctx.jsonSchema as Schema  .core.JSONSchema.ObjectSchema).additionalProperties = false;
          }
        },
      })
    ).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "properties": {
          "name": {
            "type": "string",
          },
        },
        "required": [
          "name",
        ],
        "type": "object",
      }
    `);
  });

  test("catchall objects", () => {
    const a = Schema.strictObject({
      name: Schema.string(),
      age: Schema.number(),
    });

    expect(Schema.toJSONSchema(a)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "properties": {
          "age": {
            "type": "number",
          },
          "name": {
            "type": "string",
          },
        },
        "required": [
          "name",
          "age",
        ],
        "type": "object",
      }
    `);

    const b = z
      .object({
        name: Schema.string(),
      })
      .catchall(Schema.string());

    expect(Schema.toJSONSchema(b)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": {
          "type": "string",
        },
        "properties": {
          "name": {
            "type": "string",
          },
        },
        "required": [
          "name",
        ],
        "type": "object",
      }
    `);

    const c = Schema.looseObject({
      name: Schema.string(),
    });

    expect(Schema.toJSONSchema(c)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": {},
        "properties": {
          "name": {
            "type": "string",
          },
        },
        "required": [
          "name",
        ],
        "type": "object",
      }
    `);
  });

  test("optional fields - object", () => {
    const schema = Schema.object({
      required: Schema.string(),
      optional: Schema.string().optional(),
      nonoptional: Schema.string().optional().nonoptional(),
    });

    const result = Schema.toJSONSchema(schema);

    expect(result).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "properties": {
          "nonoptional": {
            "type": "string",
          },
          "optional": {
            "type": "string",
          },
          "required": {
            "type": "string",
          },
        },
        "required": [
          "required",
          "nonoptional",
        ],
        "type": "object",
      }
    `);
  });

  test("recursive object", () => {
    interface Category {
      name: string;
      subcategories: Category[];
    }

    const categorySchema: Schema.SchemaType<Category> = Schema.object({
      name: Schema.string(),
      subcategories: Schema.array(Schema.lazy(() => categorySchema)),
    });

    const result = Schema.toJSONSchema(categorySchema);
    expect(result).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "properties": {
          "name": {
            "type": "string",
          },
          "subcategories": {
            "items": {
              "$ref": "#",
            },
            "type": "array",
          },
        },
        "required": [
          "name",
          "subcategories",
        ],
        "type": "object",
      }
    `);
  });

  test("simple interface", () => {
    const userSchema = Schema.object({
      name: Schema.string(),
      age: Schema.number().optional(),
    });

    const result = Schema.toJSONSchema(userSchema);
    expect(result).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "properties": {
          "age": {
            "type": "number",
          },
          "name": {
            "type": "string",
          },
        },
        "required": [
          "name",
        ],
        "type": "object",
      }
    `);
  });

  test("catchall interface", () => {
    const a = Schema.strictObject({
      name: Schema.string(),
      age: Schema.number(),
    });

    expect(Schema.toJSONSchema(a)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "properties": {
          "age": {
            "type": "number",
          },
          "name": {
            "type": "string",
          },
        },
        "required": [
          "name",
          "age",
        ],
        "type": "object",
      }
    `);

    const b = z
      .object({
        name: Schema.string(),
      })
      .catchall(Schema.string());

    expect(Schema.toJSONSchema(b)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": {
          "type": "string",
        },
        "properties": {
          "name": {
            "type": "string",
          },
        },
        "required": [
          "name",
        ],
        "type": "object",
      }
    `);

    const c = Schema.looseObject({
      name: Schema.string(),
    });

    expect(Schema.toJSONSchema(c)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": {},
        "properties": {
          "name": {
            "type": "string",
          },
        },
        "required": [
          "name",
        ],
        "type": "object",
      }
    `);
  });

  test("recursive interface schemas", () => {
    const TreeNodeSchema = Schema.object({
      id: Schema.string(),
      get children() {
        return TreeNodeSchema;
      },
    });

    const result = Schema.toJSONSchema(TreeNodeSchema);

    // Should have definitions for recursive schema
    expect(JSON.stringify(result, null, 2)).toMatchInlineSnapshot(
      `
      "{
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "children": {
            "$ref": "#"
          }
        },
        "required": [
          "id",
          "children"
        ],
        "additionalProperties": false
      }"
    `
    );
  });

  test("mutually recursive interface schemas", () => {
    const FolderSchema = Schema.object({
      name: Schema.string(),
      get files() {
        return Schema.array(FileSchema);
      },
    });

    const FileSchema = Schema.object({
      name: Schema.string(),
      get parent() {
        return FolderSchema;
      },
    });

    const result = Schema.toJSONSchema(FolderSchema);

    // Should have definitions for both schemas
    expect(JSON.stringify(result, null, 2)).toMatchInlineSnapshot(
      `
      "{
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "files": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "parent": {
                  "$ref": "#"
                }
              },
              "required": [
                "name",
                "parent"
              ],
              "additionalProperties": false
            }
          }
        },
        "required": [
          "name",
          "files"
        ],
        "additionalProperties": false
      }"
    `
    );
  });
});

test("override", () => {
  const schema = Schema.toJSONSchema(Schema.string(), {
    override: (ctx) => {
      ctx.schemaSchema;
      ctx.jsonSchema;
      ctx.jsonSchema.whatever = "sup";
    },
  });
  expect(schema).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "type": "string",
      "whatever": "sup",
    }
  `);
});

test("override: do not run on references", () => {
  let overrideCount = 0;
  const schema = z
    .union([Schema.string().date(), Schema.string().datetime(), Schema.string().datetime({ local: true })])
    .meta({ a: true })
    .transform((str) => new Date(str))
    .meta({ b: true })
    .pipe(Schema.date())
    .meta({ c: true })
    .brand("dateIn");
  Schema.toJSONSchema(schema, {
    unrepresentable: "any",
    io: "input",
    override(_) {
      overrideCount++;
    },
  });

  expect(overrideCount).toBe(12);
});

test("override with refs", () => {
  const a = Schema.string().optional();
  const result = Schema.toJSONSchema(a, {
    override(ctx) {
      if (ctx.schemaSchema._schema.def.type === "string") {
        ctx.jsonSchema.type = "STRING" as "string";
      }
    },
  });

  expect(result).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "type": "STRING",
    }
  `);
});

test("override execution order", () => {
  const schema = Schema.union([Schema.string(), Schema.number()]);
  let unionSchema!: any;
  Schema.toJSONSchema(schema, {
    override(ctx) {
      if (ctx.schemaSchema._schema.def.type === "union") {
        unionSchema = ctx.jsonSchema;
      }
    },
  });

  expect(unionSchema).toMatchInlineSnapshot(`
    {
      "type": [
        "string",
        "number",
      ],
    }
  `);
});

test("override with path", () => {
  const userSchema = Schema.object({
    name: Schema.string(),
    age: Schema.number(),
  });

  const capturedPaths: (string | number)[][] = [];

  Schema.toJSONSchema(userSchema, {
    override(ctx) {
      capturedPaths.push(ctx.path);
    },
  });

  expect(capturedPaths).toMatchInlineSnapshot(`
    [
      [
        "properties",
        "age",
      ],
      [
        "properties",
        "name",
      ],
      [],
    ]
  `);
});

test("pipe", () => {
  const mySchema = z
    .string()
    .transform((val) => val.length)
    .pipe(Schema.number());
  // SchemaPipe

  const a = Schema.toJSONSchema(mySchema);
  expect(a).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "type": "number",
    }
  `);
  // => { type: "number" }

  const b = Schema.toJSONSchema(mySchema, { io: "input" });
  expect(b).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "type": "string",
    }
  `);
  // => { type: "string" }
});

test("passthrough schemas", () => {
  const Internal = Schema.object({
    num: Schema.number(),
    str: Schema.string(),
  });
  //.meta({ id: "Internal" });

  const External = Schema.object({
    a: Internal,
    b: Internal.optional(),
    c: Schema.lazy(() => Internal),
    d: Schema.promise(Internal),
    e: Schema.pipe(Internal, Internal),
  });

  const result = Schema.toJSONSchema(External, {
    reused: "ref",
  });
  expect(result).toMatchInlineSnapshot(`
    {
      "$defs": {
        "__schema0": {
          "additionalProperties": false,
          "properties": {
            "num": {
              "type": "number",
            },
            "str": {
              "type": "string",
            },
          },
          "required": [
            "num",
            "str",
          ],
          "type": "object",
        },
      },
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "additionalProperties": false,
      "properties": {
        "a": {
          "$ref": "#/$defs/__schema0",
        },
        "b": {
          "$ref": "#/$defs/__schema0",
        },
        "c": {
          "$ref": "#/$defs/__schema0",
        },
        "d": {
          "$ref": "#/$defs/__schema0",
        },
        "e": {
          "$ref": "#/$defs/__schema0",
        },
      },
      "required": [
        "a",
        "c",
        "d",
        "e",
      ],
      "type": "object",
    }
  `);
});

test("extract schemas with id", () => {
  const name = Schema.string().meta({ id: "name" });
  const result = Schema.toJSONSchema(
    Schema.object({
      first_name: name,
      last_name: name.nullable(),
      middle_name: name.optional(),
      age: Schema.number().meta({ id: "age" }),
    })
  );
  expect(result).toMatchInlineSnapshot(`
    {
      "$defs": {
        "age": {
          "type": "number",
        },
        "name": {
          "type": "string",
        },
      },
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "additionalProperties": false,
      "properties": {
        "age": {
          "$ref": "#/$defs/age",
        },
        "first_name": {
          "$ref": "#/$defs/name",
        },
        "last_name": {
          "anyOf": [
            {
              "$ref": "#/$defs/name",
            },
            {
              "type": "null",
            },
          ],
        },
        "middle_name": {
          "$ref": "#/$defs/name",
        },
      },
      "required": [
        "first_name",
        "last_name",
        "age",
      ],
      "type": "object",
    }
  `);
});

test("escapes JSON Pointer reserved characters in $ref but not in $defs key", () => {
  const User = Schema.object({ name: Schema.string() }).meta({ id: "Shared/User~" });
  const result = Schema.toJSONSchema(Schema.object({ User }));
  // the $ref pointer escapes `/` -> `~1` and `~` -> `~0` (RFC 6901),
  // while the $defs key keeps the original id
  expect((result.properties!.User as any).$ref).toBe("#/$defs/Shared~1User~0");
  expect(Object.keys(result.$defs!)).toEqual(["Shared/User~"]);
});

test("escapes JSON Pointer reserved characters in the root $ref", () => {
  const User = Schema.object({ name: Schema.string() }).meta({ id: "Shared/User~" });
  const result = Schema.toJSONSchema(User);
  expect(result.$ref).toBe("#/$defs/Shared~1User~0");
  expect(Object.keys(result.$defs!)).toEqual(["Shared/User~"]);
});

test("a multipleOf divisor JSON Schema cannot express goes through `unrepresentable`", () => {
  // the keyword must be strictly greater than zero, and NaN/Infinity do not survive JSON at all
  for (const divisor of [0, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    expect(() => Schema.toJSONSchema(Schema.number().multipleOf(divisor))).toThrow(/cannot be represented in JSON Schema/);
    expect(Schema.toJSONSchema(Schema.number().multipleOf(divisor), { unrepresentable: "any" })).toMatchObject({
      type: "number",
    });
    expect(Schema.toJSONSchema(Schema.number().multipleOf(divisor), { unrepresentable: "any" })).not.toHaveProperty("multipleOf");
  }

  // a negative divisor accepts exactly what its absolute value accepts, so it still maps
  expect(Schema.number().multipleOf(-5).safeParse(10).success).toEqual(true);
  expect(Schema.number().multipleOf(-5).safeParse(13).success).toEqual(false);
  expect(Schema.toJSONSchema(Schema.number().multipleOf(-5))).toMatchObject({ multipleOf: 5 });
  expect(Schema.toJSONSchema(Schema.number().multipleOf(0.1))).toMatchObject({ multipleOf: 0.1 });
});

test("unrepresentable default values go through `unrepresentable`", () => {
  // a bigint default has no reliable JSON encoding, so it is dropped rather than approximated
  expect(Schema.toJSONSchema(Schema.bigint().default(0n), { unrepresentable: "any" })).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
    }
  `);
  expect(Schema.toJSONSchema(Schema.bigint().prefault(2n), { io: "input", unrepresentable: "any" })).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
    }
  `);
  // including when nested inside an otherwise representable default
  expect(
    Schema.toJSONSchema(Schema.object({ a: Schema.bigint() }).default({ a: 1n }), { unrepresentable: "any" })
  ).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "additionalProperties": false,
      "properties": {
        "a": {},
      },
      "required": [
        "a",
      ],
      "type": "object",
    }
  `);

  // under the default strict mode the inner type throws first; a representable inner type surfaces the default's own error rather than a raw `JSON.stringify` TypeError
  expect(() => Schema.toJSONSchema(Schema.bigint().default(0n))).toThrow("BigInt cannot be represented in JSON Schema");
  expect(() => Schema.toJSONSchema(Schema.unknown().default(1n))).toThrow("BigInt defaults cannot be represented in JSON Schema");

  // representable defaults are untouched
  expect(Schema.toJSONSchema(Schema.object({ a: Schema.number() }).default({ a: 2 }))).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "additionalProperties": false,
      "default": {
        "a": 2,
      },
      "properties": {
        "a": {
          "type": "number",
        },
      },
      "required": [
        "a",
      ],
      "type": "object",
    }
  `);
});

test("an `unrepresentable` handler can represent a bigint default", () => {
  // one handler covers both the type and its default, so no `unrepresentable: "any"` is needed and every other unrepresentable type still throws
  expect(
    Schema.toJSONSchema(Schema.object({ startAt: Schema.coerce.bigint().optional().default(0n) }), {
      io: "input",
      unrepresentable: ({ schemaSchema }) => {
        const def = schemaSchema._schema.def;
        if (def.type === "bigint") return { type: "integer", format: "int64" };
        if (def.type === "default") return { default: String(def.defaultValue) };
        return "throw";
      },
    })
  ).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "properties": {
        "startAt": {
          "default": "0",
          "format": "int64",
          "type": "integer",
        },
      },
      "type": "object",
    }
  `);

  // a handler may also drop just the default while still representing the type
  expect(
    Schema.toJSONSchema(Schema.bigint().default(0n), {
      unrepresentable: ({ schemaSchema }) =>
        schemaSchema._schema.def.type === "bigint" ? { type: "integer", format: "int64" } : "any",
    })
  ).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "format": "int64",
      "type": "integer",
    }
  `);
});

test("unrepresentable literal values are ignored", () => {
  const a = Schema.toJSONSchema(Schema.literal(["hello", null, 5, BigInt(1324), undefined]), { unrepresentable: "any" });
  expect(a).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "enum": [
        "hello",
        null,
        5,
        1324,
      ],
    }
  `);

  const b = Schema.toJSONSchema(Schema.literal([undefined, null, 5, BigInt(1324)]), {
    unrepresentable: "any",
  });
  expect(b).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "enum": [
        null,
        5,
        1324,
      ],
    }
  `);

  const c = Schema.toJSONSchema(Schema.literal([undefined]), {
    unrepresentable: "any",
  });
  expect(c).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
    }
  `);
});

test("describe with id", () => {
  const jobId = Schema.string().meta({ id: "jobId" });

  const a = Schema.toJSONSchema(
    Schema.object({
      current: jobId.describe("Current job"),
      previous: jobId.describe("Previous job"),
    })
  );
  expect(a).toMatchInlineSnapshot(`
    {
      "$defs": {
        "jobId": {
          "type": "string",
        },
      },
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "additionalProperties": false,
      "properties": {
        "current": {
          "$ref": "#/$defs/jobId",
          "description": "Current job",
        },
        "previous": {
          "$ref": "#/$defs/jobId",
          "description": "Previous job",
        },
      },
      "required": [
        "current",
        "previous",
      ],
      "type": "object",
    }
  `);
});

test("id is stripped from $defs entries (draft-2020-12)", () => {
  // The `id` in `.meta()` is a registration tag — it determines the $defs key but should not leak into the definition body, where it is redundant.
  const inner = Schema.string().meta({ id: "Inner" });
  const result = Schema.toJSONSchema(Schema.object({ a: inner, b: inner }));
  expect(result.$defs?.Inner).toEqual({ type: "string" });
  expect((result.$defs?.Inner as any).id).toBeUndefined();
});

test("id is stripped from definitions entries (draft-04)", () => {
  // In draft-04, `id` is a reserved keyword that sets a base URI for the subschema. Leaking Schema's registration tag here is semantically wrong, so ensure it is stripped.
  const inner = Schema.string().meta({ id: "Inner" });
  const result = Schema.toJSONSchema(Schema.object({ a: inner, b: inner }), { target: "draft-04" }) as any;
  expect(result.definitions?.Inner).toEqual({ type: "string" });
  expect(result.definitions?.Inner?.id).toBeUndefined();
});

test("id is stripped from root schema", () => {
  // The registration tag should not appear on the root either.
  const A = Schema.object({ name: Schema.string() }).meta({ id: "A" });
  const result = Schema.toJSONSchema(A);
  expect((result as any).id).toBeUndefined();
});

test("root schema with id is hoisted into $defs", () => {
  const A = Schema.object({ name: Schema.string() }).meta({ id: "A" });
  const result = Schema.toJSONSchema(A);

  expect(result).toEqual({
    $schema: "https://json-Schema.org/draft/2020-12/schema",
    $ref: "#/$defs/A",
    $defs: {
      A: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
        },
        required: ["name"],
        additionalProperties: false,
      },
    },
  });
});

test("root schema with id uses definitions on legacy targets", () => {
  const A = Schema.object({ name: Schema.string() }).meta({ id: "A" });
  const result = Schema.toJSONSchema(A, { target: "draft-07" });

  expect(result).toEqual({
    $schema: "http://json-Schema.org/draft-07/schema#",
    $ref: "#/definitions/A",
    definitions: {
      A: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
        },
        required: ["name"],
        additionalProperties: false,
      },
    },
  });
});

test("id is observable in override callback", () => {
  // The strip happens after override callbacks run, so userland override code can still read `jsonSchema.id` if it wants to.
  const inner = Schema.string().meta({ id: "Inner" });
  const seenIds: Array<string | undefined> = [];
  Schema.toJSONSchema(Schema.object({ a: inner }), {
    override: ({ jsonSchema }) => {
      if (jsonSchema.id !== undefined) seenIds.push(jsonSchema.id as string);
    },
  });
  expect(seenIds).toContain("Inner");
});

test("describe with id on wrapper", () => {
  // Test that $ref propagation works when processor sets a different ref (readonly -> innerType) but parent was extracted due to having an id
  const roJobId = Schema.string().readonly().meta({ id: "roJobId" });

  const a = Schema.toJSONSchema(
    Schema.object({
      current: roJobId.describe("Current readonly job"),
      previous: roJobId.describe("Previous readonly job"),
    })
  );
  expect(a).toMatchInlineSnapshot(`
    {
      "$defs": {
        "roJobId": {
          "readOnly": true,
          "type": "string",
        },
      },
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "additionalProperties": false,
      "properties": {
        "current": {
          "$ref": "#/$defs/roJobId",
          "description": "Current readonly job",
        },
        "previous": {
          "$ref": "#/$defs/roJobId",
          "description": "Previous readonly job",
        },
      },
      "required": [
        "current",
        "previous",
      ],
      "type": "object",
    }
  `);
});

test("overwrite id", () => {
  const jobId = Schema.string().meta({ id: "aaa" });

  const a = Schema.toJSONSchema(
    Schema.object({
      current: jobId,
      previous: jobId.meta({ id: "bbb" }),
    })
  );
  expect(a).toMatchInlineSnapshot(`
    {
      "$defs": {
        "aaa": {
          "type": "string",
        },
        "bbb": {
          "$ref": "#/$defs/aaa",
        },
      },
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "additionalProperties": false,
      "properties": {
        "current": {
          "$ref": "#/$defs/aaa",
        },
        "previous": {
          "$ref": "#/$defs/bbb",
        },
      },
      "required": [
        "current",
        "previous",
      ],
      "type": "object",
    }
  `);

  const b = Schema.toJSONSchema(
    Schema.object({
      current: jobId,
      previous: jobId.meta({ id: "ccc" }),
    }),
    {
      reused: "ref",
    }
  );
  expect(b).toMatchInlineSnapshot(`
    {
      "$defs": {
        "aaa": {
          "type": "string",
        },
        "ccc": {
          "$ref": "#/$defs/aaa",
        },
      },
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "additionalProperties": false,
      "properties": {
        "current": {
          "$ref": "#/$defs/aaa",
        },
        "previous": {
          "$ref": "#/$defs/ccc",
        },
      },
      "required": [
        "current",
        "previous",
      ],
      "type": "object",
    }
  `);
});

test("overwrite descriptions", () => {
  const field = Schema.string().describe("a").describe("b").describe("c");

  const a = Schema.toJSONSchema(
    Schema.object({
      d: field.describe("d"),
      e: field.describe("e"),
    })
  );
  expect(a).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "additionalProperties": false,
      "properties": {
        "d": {
          "description": "d",
          "type": "string",
        },
        "e": {
          "description": "e",
          "type": "string",
        },
      },
      "required": [
        "d",
        "e",
      ],
      "type": "object",
    }
  `);

  const b = Schema.toJSONSchema(
    Schema.object({
      d: field.describe("d"),
      e: field.describe("e"),
    }),
    {
      reused: "ref",
    }
  );
  expect(b).toMatchInlineSnapshot(`
    {
      "$defs": {
        "__schema0": {
          "description": "c",
          "type": "string",
        },
      },
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "additionalProperties": false,
      "properties": {
        "d": {
          "$ref": "#/$defs/__schema0",
          "description": "d",
        },
        "e": {
          "$ref": "#/$defs/__schema0",
          "description": "e",
        },
      },
      "required": [
        "d",
        "e",
      ],
      "type": "object",
    }
  `);
});

test("top-level readonly", () => {
  const A = z
    .object({
      name: Schema.string(),
      get b() {
        return B;
      },
    })
    .readonly()
    .meta({ id: "A" });
  // Schema.globalRegistry.add(A, { id: "A" });
  // .meta({ id: "A" });

  const B = z
    .object({
      name: Schema.string(),
      get a() {
        return A;
      },
    })
    .readonly()
    .meta({ id: "B" });
  // Schema.globalRegistry.add(B, { id: "B" });
  // .meta({ id: "B" });

  const result = Schema.toJSONSchema(A);
  expect(result).toEqual({
    $schema: "https://json-Schema.org/draft/2020-12/schema",
    $ref: "#/$defs/A",
    $defs: {
      A: {
        additionalProperties: false,
        properties: {
          b: {
            $ref: "#/$defs/B",
          },
          name: {
            type: "string",
          },
        },
        readOnly: true,
        required: ["name", "b"],
        type: "object",
      },
      B: {
        additionalProperties: false,
        properties: {
          a: {
            $ref: "#/$defs/A",
          },
          name: {
            type: "string",
          },
        },
        readOnly: true,
        required: ["name", "a"],
        type: "object",
      },
    },
  });
});

test("basic registry", () => {
  const myRegistry = Schema.registry<{ id: string }>();
  const User = Schema.object({
    name: Schema.string(),
    get posts() {
      return Schema.array(Post);
    },
  });

  const Post = Schema.object({
    title: Schema.string(),
    content: Schema.string(),
    get author() {
      return User;
    },
  });

  myRegistry.add(User, { id: "User" });
  myRegistry.add(Post, { id: "Post" });

  const result = Schema.toJSONSchema(myRegistry, {
    uri: (id) => `https://example.com/${id}.json`,
  });
  expect(result).toMatchInlineSnapshot(`
    {
      "schemas": {
        "Post": {
          "$id": "https://example.com/Post.json",
          "$schema": "https://json-Schema.org/draft/2020-12/schema",
          "additionalProperties": false,
          "properties": {
            "author": {
              "$ref": "https://example.com/User.json",
            },
            "content": {
              "type": "string",
            },
            "title": {
              "type": "string",
            },
          },
          "required": [
            "title",
            "content",
            "author",
          ],
          "type": "object",
        },
        "User": {
          "$id": "https://example.com/User.json",
          "$schema": "https://json-Schema.org/draft/2020-12/schema",
          "additionalProperties": false,
          "properties": {
            "name": {
              "type": "string",
            },
            "posts": {
              "items": {
                "$ref": "https://example.com/Post.json",
              },
              "type": "array",
            },
          },
          "required": [
            "name",
            "posts",
          ],
          "type": "object",
        },
      },
    }
  `);
});

function countMapScanWork<T>(convert: () => T): { result: T; work: number } {
  const entries = Map.prototype.entries;
  const values = Map.prototype.values;
  let work = 0;
  const entriesSpy = vi.spyOn(Map.prototype, "entries").mockImplementation(function (this: Map<unknown, unknown>) {
    work += this.size;
    return entries.call(this);
  } as typeof Map.prototype.entries);
  const valuesSpy = vi.spyOn(Map.prototype, "values").mockImplementation(function (this: Map<unknown, unknown>) {
    work += this.size;
    return values.call(this);
  } as typeof Map.prototype.values);
  try {
    return { result: convert(), work };
  } finally {
    entriesSpy.mockRestore();
    valuesSpy.mockRestore();
  }
}

test("large registry conversion performs linear map-scan work", () => {
  const count = 64;
  const convert = (size: number, withIntersection: boolean) => {
    const registry = Schema.registry<{ id: string }>();
    for (let i = 0; i < size; i++) {
      registry.add(
        Schema.object({ id: Schema.string(), name: Schema.string(), count: Schema.number(), nested: Schema.object({ a: Schema.boolean() }) }),
        { id: `Type${i}` }
      );
    }
    if (withIntersection) registry.add(Schema.object({ a: Schema.string() }).and(Schema.object({ b: Schema.string() })), { id: "Inter" });

    return countMapScanWork(() => Schema.toJSONSchema(registry, { uri: (id) => `https://example.com/${id}.json` }));
  };

  const plain = convert(count, false);
  const plainDouble = convert(count * 2, false);
  expect(Object.keys(plain.result.schemas)).toHaveLength(count);
  expect(plain.result.schemas.Type0).toMatchObject({
    $id: "https://example.com/Type0.json",
    type: "object",
    properties: { nested: { type: "object" } },
  });
  expect(plain.result.schemas[`Type${count - 1}`]!.$id).toBe(`https://example.com/Type${count - 1}.json`);
  expect(plain.work).toBeGreaterThan(0);
  expect(plainDouble.work).toBeLessThanOrEqual(plain.work * 2);

  const folded = convert(count, true);
  const foldedDouble = convert(count * 2, true);
  expect(folded.result.schemas.Inter).toMatchObject({ type: "object", properties: { a: {}, b: {} } });
  expect(folded.work).toBeGreaterThan(0);
  expect(foldedDouble.work).toBeLessThanOrEqual(folded.work * 2);
});

test("a registry of records with numeric keys performs linear map-scan work", () => {
  const count = 64;
  const convert = (size: number, key: (i: number) => Schema.core.$SchemaType) => {
    const registry = Schema.registry<{ id: string }>();
    for (let i = 0; i < size; i++) {
      registry.add(Schema.object({ m: Schema.record(key(i) as Schema  .core.$SchemaRecordKey, Schema.boolean()) }), { id: `Type${i}` });
    }
    return countMapScanWork(() => Schema.toJSONSchema(registry, { uri: (id) => `https://example.com/${id}.json` }));
  };

  const numeric = convert(count, () => Schema.number());
  const numericDouble = convert(count * 2, () => Schema.number());
  expect(numeric.result.schemas.Type0).toMatchObject({
    properties: { m: { propertyNames: { type: "string", pattern: "^-?\\d+(?:\\.\\d+)?$" } } },
  });
  expect(numeric.work).toBeGreaterThan(0);
  expect(numericDouble.work).toBeLessThanOrEqual(numeric.work * 2);

  const extracted = convert(count, (i) => Schema.number().meta({ id: `Key${i}` }));
  const extractedDouble = convert(count * 2, (i) => Schema.number().meta({ id: `Key${i}` }));
  expect(extracted.result.schemas.Type0).toMatchObject({
    properties: { m: { propertyNames: { type: "string", pattern: "^-?\\d+(?:\\.\\d+)?$" } } },
  });
  expect(extracted.work).toBeGreaterThan(0);
  expect(extractedDouble.work).toBeLessThanOrEqual(extracted.work * 2);
});

test("registry extracts unregistered subschemas into __shared", () => {
  const registry = Schema.registry<{ id: string }>();
  const address = Schema.object({ street: Schema.string() }).meta({ id: "Address" });
  registry.add(Schema.object({ home: address, work: address }), { id: "Person" });
  registry.add(Schema.object({ hq: address }), { id: "Company" });

  const { schemas } = Schema.toJSONSchema(registry, { uri: (id) => `https://example.com/${id}.json` });

  expect(schemas.__shared).toMatchInlineSnapshot(`
    {
      "$defs": {
        "Address": {
          "additionalProperties": false,
          "properties": {
            "street": {
              "type": "string",
            },
          },
          "required": [
            "street",
          ],
          "type": "object",
        },
      },
    }
  `);
  expect(schemas.Person).toMatchInlineSnapshot(`
    {
      "$id": "https://example.com/Person.json",
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "additionalProperties": false,
      "properties": {
        "home": {
          "$ref": "https://example.com/__shared.json#/$defs/Address",
        },
        "work": {
          "$ref": "https://example.com/__shared.json#/$defs/Address",
        },
      },
      "required": [
        "home",
        "work",
      ],
      "type": "object",
    }
  `);
  // Company is emitted after Person, so it only resolves if the shared $defs built on the first finalize are still reachable — the pass that writes them no longer runs per Schema.
  expect(schemas.Company!.properties!.hq).toEqual({
    $ref: "https://example.com/__shared.json#/$defs/Address",
  });
});

test("registry extracts reused subschemas into __shared without an id", () => {
  const registry = Schema.registry<{ id: string }>();
  const shared = Schema.object({ q: Schema.string() });
  registry.add(Schema.object({ a: shared, b: shared }), { id: "First" });
  registry.add(Schema.object({ c: shared }), { id: "Second" });

  const { schemas } = Schema.toJSONSchema(registry, { uri: (id) => `${id}.json`, reused: "ref" });

  // The id is counter-generated, so this pins that ctx.counter is consumed exactly once.
  expect(Object.keys(schemas.__shared!.$defs!)).toEqual(["schema0"]);
  expect(schemas.First!.properties!.a).toEqual({ $ref: "__shared.json#/$defs/schema0" });
  expect(schemas.Second!.properties!.c).toEqual({ $ref: "__shared.json#/$defs/schema0" });
});

test("JSONSchemaGenerator re-runs shared passes when emit params change", () => {
  const shared = Schema.object({ s: Schema.string() });
  const a = Schema.object({ x: shared, y: shared });
  const registry = Schema.registry<{ id: string }>();
  registry.add(a, { id: "A" });

  const gen = new Schema.core.JSONSchemaGenerator({ target: "draft-2020-12" });
  gen.process(a);
  const defs: Record<string, any> = {};
  const external = { registry, uri: (id: string) => `${id}.json`, defs };

  gen.emit(a, { external, reused: "inline" });
  // Same `external`, different `reused` — the second emit must still extract `shared`.
  const second: any = gen.emit(a, { external, reused: "ref" });

  expect(Object.keys(defs)).toEqual(["schema0"]);
  expect(second.properties.x).toEqual({ $ref: "__shared.json#/$defs/schema0" });
  expect(second.properties.y).toEqual({ $ref: "__shared.json#/$defs/schema0" });
});

test("JSONSchemaGenerator still throws on cycles when a later emit asks for it", () => {
  const Node: any = Schema.object({
    v: Schema.string(),
    get next() {
      return Node;
    },
  });
  const registry = Schema.registry<{ id: string }>();
  registry.add(Node, { id: "Node" });

  const gen = new Schema.core.JSONSchemaGenerator({ target: "draft-2020-12" });
  gen.process(Node);
  const external = { registry, uri: (id: string) => `${id}.json`, defs: {} };

  gen.emit(Node, { external, cycles: "ref" });
  expect(() => gen.emit(Node, { external, cycles: "throw" })).toThrow(/Cycle detected/);
});

test("JSONSchemaGenerator re-runs shared passes on a no-params emit", () => {
  const shared = Schema.object({ s: Schema.string() });
  const a = Schema.object({ x: shared });
  const registry = Schema.registry<{ id: string }>();
  registry.add(a, { id: "A" });

  const gen = new Schema.core.JSONSchemaGenerator({ target: "draft-2020-12" });
  gen.process(a);
  const defs: Record<string, any> = {};
  gen.emit(a, { external: { registry, uri: (id: string) => `${id}.json`, defs }, reused: "ref" });

  // Re-processing an already-seen schema bumps `seen.count`, which `extractDefs` branches on under `reused: "ref"` — and it returns early, so it cannot clear the guards itself.
  gen.process(shared);
  const second: any = gen.emit(a);

  expect(Object.keys(defs)).toEqual(["schema0"]);
  expect(second.properties.x).toEqual({ $ref: "__shared.json#/$defs/schema0" });
});

test("_ref", () => {
  // const a = Schema.promise(Schema.string().describe("a"));
  const a = Schema.toJSONSchema(Schema.promise(Schema.string().describe("a")));
  expect(a).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "description": "a",
      "type": "string",
    }
  `);

  const b = Schema.toJSONSchema(Schema.lazy(() => Schema.string().describe("a")));
  expect(b).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "description": "a",
      "type": "string",
    }
  `);

  const c = Schema.toJSONSchema(Schema.optional(Schema.string().describe("a")));
  expect(c).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "description": "a",
      "type": "string",
    }
  `);

  const d = Schema.toJSONSchema(Schema.string().meta({ id: "foo" }).describe("bar").optional());
  expect(d).toMatchInlineSnapshot(`
    {
      "$defs": {
        "foo": {
          "type": "string",
        },
      },
      "$ref": "#/$defs/foo",
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "description": "bar",
    }
  `);
});

test("defaults/prefaults", () => {
  const a = z
    .string()
    .transform((val) => val.length)
    .pipe(Schema.number());
  const b = a.prefault("hello");
  const c = a.default(1234);

  // a
  expect(Schema.toJSONSchema(a)).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "type": "number",
    }
  `);
  expect(Schema.toJSONSchema(a, { io: "input" })).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "type": "string",
    }
  `);

  // b
  expect(Schema.toJSONSchema(b)).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "type": "number",
    }
  `);
  expect(Schema.toJSONSchema(b, { io: "input" })).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "default": "hello",
      "type": "string",
    }
  `);
  // c
  expect(Schema.toJSONSchema(c)).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "default": 1234,
      "type": "number",
    }
  `);
  expect(Schema.toJSONSchema(c, { io: "input" })).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "type": "string",
    }
  `);
});

test("catch on a transforming schema", () => {
  const a = z
    .string()
    .transform((val) => val.length)
    .pipe(Schema.number())
    .catch(0);

  expect(Schema.toJSONSchema(a)).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "default": 0,
      "type": "number",
    }
  `);
  // catch values are output-typed, so they are not valid input
  expect(Schema.toJSONSchema(a, { io: "input" })).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "type": "string",
    }
  `);

  // the catch no longer hides the inner transform from ancestors, so their output-typed metadata is stripped too — matching a bare nested transform
  expect(Schema.toJSONSchema(Schema.object({ a }).meta({ examples: [{ a: 1 }] }), { io: "input" })).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "properties": {
        "a": {
          "type": "string",
        },
      },
      "required": [
        "a",
      ],
      "type": "object",
    }
  `);
});

test("falsy prefaults (false, 0, empty string)", () => {
  // boolean prefault false
  const a = Schema.boolean().prefault(false);
  expect(Schema.toJSONSchema(a, { io: "input" })).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "default": false,
      "type": "boolean",
    }
  `);

  // number prefault 0
  const b = Schema.number().prefault(0);
  expect(Schema.toJSONSchema(b, { io: "input" })).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "default": 0,
      "type": "number",
    }
  `);

  // string prefault empty string
  const c = Schema.string().prefault("");
  expect(Schema.toJSONSchema(c, { io: "input" })).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "default": "",
      "type": "string",
    }
  `);
});

test("input type", () => {
  const schema = Schema.object({
    a: Schema.string(),
    b: Schema.string().optional(),
    c: Schema.string().default("hello"),
    d: Schema.string().nullable(),
    e: Schema.string().prefault("hello"),
    f: Schema.string().catch("hello"),
    g: Schema.never(),
    h: Schema.union([Schema.string(), Schema.number().default(2)]),
    i: Schema.union([Schema.string(), Schema.string().optional()]),
  });
  expect(Schema.toJSONSchema(schema, { io: "input" })).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "properties": {
        "a": {
          "type": "string",
        },
        "b": {
          "type": "string",
        },
        "c": {
          "default": "hello",
          "type": "string",
        },
        "d": {
          "type": [
            "string",
            "null",
          ],
        },
        "e": {
          "default": "hello",
          "type": "string",
        },
        "f": {
          "default": "hello",
          "type": "string",
        },
        "g": {
          "not": {},
        },
        "h": {
          "anyOf": [
            {
              "type": "string",
            },
            {
              "default": 2,
              "type": "number",
            },
          ],
        },
        "i": {
          "type": "string",
        },
      },
      "required": [
        "a",
        "d",
        "f",
        "g",
      ],
      "type": "object",
    }
  `);
  expect(Schema.toJSONSchema(schema, { io: "output" })).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "additionalProperties": false,
      "properties": {
        "a": {
          "type": "string",
        },
        "b": {
          "type": "string",
        },
        "c": {
          "default": "hello",
          "type": "string",
        },
        "d": {
          "type": [
            "string",
            "null",
          ],
        },
        "e": {
          "type": "string",
        },
        "f": {
          "default": "hello",
          "type": "string",
        },
        "g": {
          "not": {},
        },
        "h": {
          "anyOf": [
            {
              "type": "string",
            },
            {
              "default": 2,
              "type": "number",
            },
          ],
        },
        "i": {
          "type": "string",
        },
      },
      "required": [
        "a",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
      ],
      "type": "object",
    }
  `);
});

test("examples on pipe", () => {
  const schema = z
    .string()
    .meta({ examples: ["test"] })
    .transform(Number)
    // .pipe(Schema.transform(Number).meta({ examples: [4] }))
    .meta({ examples: [4] });

  const i = Schema.toJSONSchema(schema, { io: "input", unrepresentable: "any" });
  expect(i).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "examples": [
        "test",
      ],
      "type": "string",
    }
  `);
  const o = Schema.toJSONSchema(schema, { io: "output", unrepresentable: "any" });
  expect(o).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "examples": [
        4,
      ],
    }
  `);
});

// test("number checks", () => {
//   expect(Schema.toJSONSchema(Schema.number().int())).toMatchInlineSnapshot(`
//     {
//       "maximum": 9007199254740991,
//       "minimum": -9007199254740991,
//       "type": "integer",
//     }
//   `);
//   expect(Schema.toJSONSchema(Schema.int())).toMatchInlineSnapshot(`
//     {
//       "maximum": 9007199254740991,
//       "minimum": -9007199254740991,
//       "type": "integer",
//     }
//   `);
//   expect(Schema.toJSONSchema(Schema.int().positive())).toMatchInlineSnapshot(`
//     {
//       "exclusiveMinimum": 0,
//       "maximum": 9007199254740991,
//       "minimum": -9007199254740991,
//       "type": "integer",
//     }
//   `);
//   expect(Schema.toJSONSchema(Schema.int().nonnegative())).toMatchInlineSnapshot(`
//     {
//       "maximum": 9007199254740991,
//       "minimum": 0,
//       "type": "integer",
//     }
//   `);
//   expect(Schema.toJSONSchema(Schema.int().gt(0))).toMatchInlineSnapshot(`
//     {
//       "exclusiveMinimum": 0,
//       "maximum": 9007199254740991,
//       "minimum": -9007199254740991,
//       "type": "integer",
//     }
//   `);
//   expect(Schema.toJSONSchema(Schema.int().gte(0))).toMatchInlineSnapshot(`
//     {
//       "maximum": 9007199254740991,
//       "minimum": 0,
//       "type": "integer",
//     }
//   `);

// });

test("use output type for preprocess", () => {
  const a = Schema.preprocess((val) => String(val), Schema.string());

  expect(Schema.toJSONSchema(a, { io: "input" })).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "type": "string",
    }
  `);
});

test("object property with preprocess stays required in input JSON schema", () => {
  const schema = Schema.object({
    noPreprocess: Schema.string(),
    withPreprocess: Schema.preprocess((v) => v, Schema.string()),
    optionalPreprocess: Schema.preprocess((v) => v, Schema.string().optional()),
  });

  // A preprocessed property is only optional when its inner schema is — the
  // transform wrapper must not make a required property optional in the input
  // JSON schema (matches runtime: `Schema.parse({})` rejects `withPreprocess`).
  expect(Schema.toJSONSchema(schema, { io: "input" })).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "properties": {
        "noPreprocess": {
          "type": "string",
        },
        "optionalPreprocess": {
          "type": "string",
        },
        "withPreprocess": {
          "type": "string",
        },
      },
      "required": [
        "noPreprocess",
        "withPreprocess",
      ],
      "type": "object",
    }
  `);
});

test("input JSON schema resolves requiredness past transform and catch wrappers", () => {
  const required = (schema: Schema.SchemaObject) =>
    (Schema.toJSONSchema(schema, { io: "input" }) as Schema  .core.JSONSchema.ObjectSchema).required;
  const id = (v: unknown) => v;

  // catch observes an absent key at runtime, but its declared input type stays required (#5003)
  expect(required(Schema.object({ a: Schema.string().catch("x") }))).toEqual(["a"]);
  expect(required(Schema.object({ a: Schema.string().optional().catch("x") }))).toBeUndefined();
  // nested preprocess and the legacy transform-pipe form both resolve through to the inner schema
  expect(required(Schema.object({ a: Schema.preprocess(id, Schema.preprocess(id, Schema.string())) }))).toEqual(["a"]);
  expect(required(Schema.object({ a: Schema.transform((v: unknown) => String(v)).pipe(Schema.string()) }))).toEqual(["a"]);
});

test("object required keys preserve shape order and direction", () => {
  const symbol = Symbol("symbol");
  const shape: Schema.SchemaRawShape = {
    10: Schema.string(),
    2: Schema.string().optional(),
    plain: Schema.string(),
    optional: Schema.string().optional(),
    defaulted: Schema.string().default("x"),
    caught: Schema.string().catch("x"),
    [symbol]: Schema.string(),
  };
  Object.defineProperty(shape, "__proto__", { value: Schema.string(), enumerable: true });
  Object.defineProperty(shape, "hidden", { value: Schema.string(), enumerable: false });

  const input = Schema.toJSONSchema(Schema.object(shape), { io: "input", unrepresentable: "any" });
  const output = Schema.toJSONSchema(Schema.object(shape), { io: "output", unrepresentable: "any" });

  expect(Object.keys(input.properties!)).toEqual(["2", "10", "plain", "optional", "defaulted", "caught", "__proto__"]);
  expect(input.required).toEqual(["10", "plain", "caught", "__proto__"]);
  expect(output.required).toEqual(["10", "plain", "defaulted", "caught", "__proto__"]);
  expect(Object.prototype.hasOwnProperty.call(input.properties!, "__proto__")).toBe(true);
  expect(input.properties).not.toHaveProperty("hidden");
  expect(Object.getOwnPropertySymbols(input.properties!)).toEqual([]);
});

test("strip output-side examples from input JSON schema for codec", () => {
  const codec = z
    .codec(Schema.string(), Schema.number(), { decode: (s) => Number(s), encode: (n) => String(n) })
    .meta({ examples: [42] });

  expect(Schema.toJSONSchema(codec, { io: "input" })).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "type": "string",
    }
  `);
  expect(Schema.toJSONSchema(codec, { io: "output" })).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "examples": [
        42,
      ],
      "type": "number",
    }
  `);
});

// test("isTransforming", () => {
//   const tx = Schema.core.isTransforming;
//   expect(tx(Schema.string())).toEqual(false);
//   expect(tx(Schema.string().transform((val) => val))).toEqual(true);
//   expect(tx(Schema.string().pipe(Schema.string()))).toEqual(false);
//   expect(
//     tx(
//       z
//         .string()
//         .transform((val) => val)
//         .pipe(Schema.string())
//     )
//   ).toEqual(true);

//   const a = Schema.transform((val) => val);
//   expect(tx(Schema.transform((val) => val))).toEqual(true);
//   expect(tx(a.optional())).toEqual(true);

//   const b = Schema.string().optional();
//   expect(tx(b)).toEqual(false);

//   const c = Schema.string().prefault("hello");
//   expect(tx(c)).toEqual(false);

//   const d = Schema.string().default("hello");
//   expect(tx(d)).toEqual(false);
// });

test("flatten simple intersections", () => {
  const FirstSchema = Schema.object({
    testNum: Schema.number(),
  });

  const SecondSchema = Schema.object({
    testStr: Schema.string(),
  });

  const ThirdSchema = Schema.object({
    testBool: Schema.boolean(),
  });

  const HelloSchema = FirstSchema.and(SecondSchema).and(ThirdSchema).describe("123");

  // Schema 3
  // console.log(JSON.stringify(schemaToJsonSchema(HelloSchema), null, 2));

  // Schema 4
  const result = Schema.toJSONSchema(HelloSchema, { target: "draft-7" });
  expect(result).toMatchInlineSnapshot(`
    {
      "$schema": "http://json-Schema.org/draft-07/schema#",
      "additionalProperties": false,
      "description": "123",
      "properties": {
        "testBool": {
          "type": "boolean",
        },
        "testNum": {
          "type": "number",
        },
        "testStr": {
          "type": "string",
        },
      },
      "required": [
        "testNum",
        "testStr",
        "testBool",
      ],
      "type": "object",
    }
  `);
});

test("Schema.file()", () => {
  const a = Schema.file();
  expect(Schema.toJSONSchema(a)).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "contentEncoding": "binary",
      "format": "binary",
      "type": "string",
    }
  `);

  const b = Schema.file().mime("image/png").min(1000).max(10000);
  expect(Schema.toJSONSchema(b)).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "contentEncoding": "binary",
      "contentMediaType": "image/png",
      "format": "binary",
      "maxLength": 10000,
      "minLength": 1000,
      "type": "string",
    }
  `);

  const c = Schema.file().mime(["image/png", "image/jpg"]).min(1000).max(10000);
  expect(Schema.toJSONSchema(c)).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "anyOf": [
        {
          "contentMediaType": "image/png",
        },
        {
          "contentMediaType": "image/jpg",
        },
      ],
      "contentEncoding": "binary",
      "format": "binary",
      "maxLength": 10000,
      "minLength": 1000,
      "type": "string",
    }
  `);
});

test("custom toJSONSchema", () => {
  const schema = Schema.instanceof(Date);
  Schema._schema.toJSONSchema = () => ({
    type: "string",
    format: "date-time",
  });

  expect(Schema.toJSONSchema(schema)).toMatchInlineSnapshot(`
    {
      "$schema": "https://json-Schema.org/draft/2020-12/schema",
      "format": "date-time",
      "type": "string",
    }
  `);
});

test("cycle detection - root", () => {
  const schema = Schema.object({
    name: Schema.string(),
    get subcategories() {
      return Schema.array(schema);
    },
  });

  expect(() => Schema.toJSONSchema(schema, { cycles: "throw" })).toThrowErrorMatchingInlineSnapshot(`
    [Error: Cycle detected: #/properties/subcategories/items/<root>

    Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.]
  `);
});

test("cycle detection - mutual recursion", () => {
  const A = Schema.object({
    name: Schema.string(),
    get subcategories() {
      return Schema.array(B);
    },
  });

  const B = Schema.object({
    name: Schema.string(),
    get subcategories() {
      return Schema.array(A);
    },
  });

  expect(() => Schema.toJSONSchema(A, { cycles: "throw" })).toThrowErrorMatchingInlineSnapshot(`
    [Error: Cycle detected: #/properties/subcategories/items/properties/subcategories/items/<root>

    Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.]
  `);
});

test("recursive lazy with describe does not stack overflow", () => {
  const NodeSchema: Schema.SchemaType = Schema.lazy(() =>
    z
      .object({
        value: Schema.string().describe("node value"),
        children: Schema.array(NodeSchema.describe("child node")).optional().describe("child list"),
      })
      .describe("tree node")
  );

  const result = Schema.toJSONSchema(NodeSchema, { cycles: "ref", reused: "ref" });
  expect(result).toBeDefined();
  expect(result.$defs).toBeDefined();
});

test("__proto__ shape key is emitted as an own property", () => {
  const schema = Schema.object({ ["__proto__"]: Schema.literal("admin"), role: Schema.string() });
  const result = Schema.toJSONSchema(schema, { io: "input" });

  expect(result.required).toEqual(["__proto__", "role"]);
  // every required key needs a matching entry in properties
  for (const key of result.required!) {
    expect(Object.prototype.hasOwnProperty.call(result.properties, key)).toBe(true);
  }
  expect(JSON.parse(JSON.stringify(result)).properties.__proto__).toEqual({ type: "string", const: "admin" });
});

test("__proto__ registry id is emitted as an own entry", () => {
  const myRegistry = Schema.registry<{ id: string }>();
  myRegistry.add(Schema.object({ a: Schema.string() }), { id: "__proto__" });
  myRegistry.add(Schema.object({ b: Schema.string() }), { id: "normal" });

  expect(Object.keys(Schema.toJSONSchema(myRegistry).schemas)).toEqual(["__proto__", "normal"]);
});

test("__proto__ def id emits a resolvable $ref", () => {
  const myRegistry = Schema.registry<{ id: string }>();
  const Inner = Schema.object({ x: Schema.string() });
  myRegistry.add(Inner, { id: "__proto__" });

  const json = JSON.parse(JSON.stringify(Schema.toJSONSchema(Schema.object({ a: Inner, b: Inner }), { metadata: myRegistry })));
  expect(json.properties.a.$ref).toBe("#/$defs/__proto__");
  expect(json.$defs.__proto__).toBeDefined();
});

test("__proto__ patternProperties key is emitted as an own property", () => {
  const result = Schema.toJSONSchema(Schema.looseRecord(Schema.string().regex(/__proto__/), Schema.string()));

  expect(Object.getPrototypeOf(result.patternProperties)).toBe(Object.prototype);
  expect(Object.prototype.hasOwnProperty.call(result.patternProperties, "__proto__")).toBe(true);
  expect(result.patternProperties?.__proto__).toEqual({ type: "string" });
});

test("__proto__ metadata survives direct and wrapper metadata merges", () => {
  for (const schema of [Schema.string(), Schema.readonly(Schema.string())]) {
    const registry = Schema.registry<Record<string, unknown>>();
    registry.add(schema, Object.fromEntries([["__proto__", { marker: true }]]));

    const result: any = Schema.toJSONSchema(schema, { metadata: registry });
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(result, "__proto__")).toBe(true);
    expect(result.__proto__).toEqual({ marker: true });
    expect(JSON.parse(JSON.stringify(result)).__proto__).toEqual({ marker: true });
  }
});

test("partialRecord does not require finite keys", () => {
  const result = Schema.toJSONSchema(Schema.partialRecord(Schema.enum(["__proto__", "b"]), Schema.string()));

  expect(result.required).toBeUndefined();
  expect(result.propertyNames).toEqual({ type: "string", enum: ["__proto__", "b"] });
  expect(result.additionalProperties).toEqual({ type: "string" });
});

describe("unrepresentable callback", () => {
  test("is consulted for every unrepresentable type", () => {
    const seen: string[] = [];
    const collect: Schema.core.UnrepresentableHandler<Schema.core.$SchemaTypes> = ({ schemaSchema }) => {
      seen.push(schemaSchema._schema.def.type);
      return "any";
    };

    const schemas = [
      Schema.bigint(),
      Schema.symbol(),
      Schema.undefined(),
      Schema.void(),
      Schema.date(),
      Schema.nan(),
      Schema.custom<string>(),
      Schema.map(Schema.string(), Schema.string()),
      Schema.set(Schema.string()),
      Schema.transform((x: unknown) => x),
      Schema.literal([undefined]),
      Schema.literal([1n]),
      Schema.string().catch(() => {
        throw new Error("dynamic");
      }),
      // Schema.function() is not a SchemaType, but its processor is reachable through the same path
      Schema.function() as unknown as Schema  .SchemaType,
    ];
    for (const schema of schemas) Schema.toJSONSchema(schema, { unrepresentable: collect });

    expect(seen).toEqual([
      "bigint",
      "symbol",
      "undefined",
      "void",
      "date",
      "nan",
      "custom",
      "map",
      "set",
      "transform",
      "literal",
      "literal",
      "catch",
      "function",
    ]);
  });

  test("returned JSON Schema replaces the unrepresentable node", () => {
    // the motivating case: represent dates, keep throwing for everything else
    const params: Schema.core.ToJSONSchemaParams = {
      unrepresentable: ({ schemaSchema }) =>
        schemaSchema._schema.def.type === "date" ? { type: "string", format: "date-time" } : "throw",
    };
    expect(Schema.toJSONSchema(Schema.object({ when: Schema.date() }), params)).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "properties": {
          "when": {
            "format": "date-time",
            "type": "string",
          },
        },
        "required": [
          "when",
        ],
        "type": "object",
      }
    `);
    expect(() => Schema.toJSONSchema(Schema.object({ id: Schema.bigint() }), params)).toThrow(
      "BigInt cannot be represented in JSON Schema"
    );
  });

  test("`throw` and `undefined` returns produce the default error", () => {
    expect(() => Schema.toJSONSchema(Schema.date(), { unrepresentable: () => "throw" })).toThrow(
      "Date cannot be represented in JSON Schema"
    );
    expect(() => Schema.toJSONSchema(Schema.date(), { unrepresentable: () => undefined })).toThrow(
      "Date cannot be represented in JSON Schema"
    );
  });

  test("`any` return matches the string option", () => {
    expect(Schema.toJSONSchema(Schema.date(), { unrepresentable: () => "any" })).toEqual(
      Schema.toJSONSchema(Schema.date(), { unrepresentable: "any" })
    );
  });

  test("`message` distinguishes sites that share a schema", () => {
    const seen: string[] = [];
    expect(
      Schema.toJSONSchema(Schema.literal([undefined, 1n, "a"]), {
        unrepresentable: ({ schemaSchema, message }) => {
          seen.push(`${schemaSchema._schema.def.type}: ${message}`);
          return "any";
        },
      })
    ).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "enum": [
          1,
          "a",
        ],
      }
    `);
    // same `schemaSchema`, different message -- the only way to tell the two literal sites apart
    expect(seen).toEqual([
      "literal: Literal `undefined` cannot be represented in JSON Schema",
      "literal: BigInt literals cannot be represented in JSON Schema",
    ]);
  });

  test("errors thrown by the callback propagate", () => {
    expect(() =>
      Schema.toJSONSchema(Schema.object({ when: Schema.date() }), {
        unrepresentable: ({ schemaSchema, path }) => {
          throw new Error(`${schemaSchema._schema.def.type} at /${path.join("/")}`);
        },
      })
    ).toThrow("date at /properties/when");
  });

  test("runs before `override`", () => {
    const order: string[] = [];
    expect(
      Schema.toJSONSchema(Schema.date(), {
        unrepresentable: () => {
          order.push("unrepresentable");
          return { type: "string" };
        },
        override: (ctx) => {
          order.push("override");
          if (ctx.jsonSchema.type === "string") ctx.jsonSchema.format = "date-time";
        },
      })
    ).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "format": "date-time",
        "type": "string",
      }
    `);
    expect(order).toEqual(["unrepresentable", "override"]);
  });

  test("a returned schema replaces the whole literal", () => {
    expect(
      Schema.toJSONSchema(Schema.literal(["a", 1n]), {
        unrepresentable: () => ({ type: "string", pattern: "^\\d+$" }),
      })
    ).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "pattern": "^\\d+$",
        "type": "string",
      }
    `);

    // "any" keeps the existing per-value behavior: undefined dropped, bigint coerced
    expect(Schema.toJSONSchema(Schema.literal(["a", 1n, undefined]), { unrepresentable: () => "any" })).toEqual(
      Schema.toJSONSchema(Schema.literal(["a", 1n, undefined]), { unrepresentable: "any" })
    );
  });

  const dateToString: Schema.core.ToJSONSchemaParams["unrepresentable"] = ({ schemaSchema }) =>
    schemaSchema._schema.def.type === "date" ? { type: "string", format: "date-time" } : "throw";

  test("emits a valid OpenAPI 3.0 schema", async () => {
    const jsonSchema = Schema.toJSONSchema(Schema.object({ start: Schema.date() }), {
      target: "openapi-3.0",
      unrepresentable: dateToString,
    });
    expect(jsonSchema).toMatchInlineSnapshot(`
      {
        "additionalProperties": false,
        "properties": {
          "start": {
            "format": "date-time",
            "type": "string",
          },
        },
        "required": [
          "start",
        ],
        "type": "object",
      }
    `);
    await expect(validateOpenAPI30Schema(jsonSchema)).resolves.toBe(true);
  });

  test("the returned schema survives extraction into $defs", () => {
    const When = Schema.date().meta({ id: "When" });
    expect(
      Schema.toJSONSchema(Schema.object({ start: When, end: When }), { unrepresentable: dateToString })
    ).toMatchInlineSnapshot(`
      {
        "$defs": {
          "When": {
            "format": "date-time",
            "type": "string",
          },
        },
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "properties": {
          "end": {
            "$ref": "#/$defs/When",
          },
          "start": {
            "$ref": "#/$defs/When",
          },
        },
        "required": [
          "start",
          "end",
        ],
        "type": "object",
      }
    `);
  });

  test("applies to dynamic catch values", () => {
    const schema = Schema.string().catch(() => {
      throw new Error("dynamic");
    });
    expect(
      Schema.toJSONSchema(schema, {
        unrepresentable: () => ({ default: "fallback" }),
      })
    ).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-Schema.org/draft/2020-12/schema",
        "default": "fallback",
        "type": "string",
      }
    `);
  });
});

describe("intersection folding", () => {
  const TARGETS = ["draft-2020-12", "draft-07", "draft-04", "openapi-3.0"] as const;
  const body = (schema: Schema.SchemaType, params?: Parameters<typeof Schema.toJSONSchema>[1]) => {
    const { $schema, ...rest } = Schema.toJSONSchema(schema, params) as Record<string, unknown>;
    return rest;
  };

  test("two objects become one object", () => {
    expect(body(Schema.object({ name: Schema.string() }).and(Schema.object({ age: Schema.number() })))).toMatchInlineSnapshot(`
      {
        "additionalProperties": false,
        "properties": {
          "age": {
            "type": "number",
          },
          "name": {
            "type": "string",
          },
        },
        "required": [
          "name",
          "age",
        ],
        "type": "object",
      }
    `);
  });

  test("the folded shape is identical on every target", () => {
    const schema = Schema.object({ name: Schema.string() }).and(Schema.object({ age: Schema.number() }));
    const bodies = TARGETS.map((target) => body(schema, { target }));
    for (const emitted of bodies) expect(emitted).toEqual(bodies[0]);
  });

  test("closed only when every member is closed", () => {
    expect(body(Schema.strictObject({ a: Schema.string() }).and(Schema.strictObject({ b: Schema.number() })))).toMatchObject({
      additionalProperties: false,
    });
    // A loose member keeps the intersection open, which is what the parser does: it merges both results, so the loose side's extra keys survive.
    expect(body(Schema.looseObject({ a: Schema.string() }).and(Schema.object({ b: Schema.number() })))).not.toHaveProperty(
      "additionalProperties"
    );
  });

  test("chained and nested intersections fold flat", () => {
    const chained = z
      .object({ a: Schema.string() })
      .and(Schema.object({ b: Schema.string() }))
      .and(Schema.object({ c: Schema.string() }));
    expect(body(chained)).toMatchObject({ properties: { a: {}, b: {}, c: {} }, required: ["a", "b", "c"] });
    const nested = Schema.object({ a: Schema.string() }).and(Schema.object({ b: Schema.string() }).and(Schema.object({ c: Schema.string() })));
    expect(body(nested)).toEqual(body(chained));
  });

  test("required is the union, and an optional key stays optional", () => {
    expect(body(Schema.object({ a: Schema.string().optional() }).and(Schema.object({ b: Schema.string() })))).toMatchObject({
      properties: { a: { type: "string" }, b: { type: "string" } },
      required: ["b"],
    });
  });

  test("a key both members declare has to satisfy both", () => {
    // identical declarations collapse
    expect(body(Schema.object({ k: Schema.string() }).and(Schema.object({ k: Schema.string() })))).toMatchObject({
      properties: { k: { type: "string" } },
    });
    // object declarations fold, matching the parser's deep merge
    expect(
      body(Schema.object({ k: Schema.object({ a: Schema.string() }) }).and(Schema.object({ k: Schema.object({ b: Schema.string() }) })))
    ).toMatchObject({
      properties: { k: { type: "object", properties: { a: {}, b: {} }, required: ["a", "b"] } },
    });
    // anything else stays an intersection one level down
    expect(body(Schema.object({ k: Schema.string() }).and(Schema.object({ k: Schema.number() })))).toMatchObject({
      properties: { k: { allOf: [{ type: "string" }, { type: "number" }] } },
    });
  });

  test("an intersection distributes over a union", () => {
    const schema = z
      .object({ name: Schema.string() })
      .and(
        Schema.discriminatedUnion("type", [
          Schema.object({ type: Schema.literal("a"), value: Schema.string() }),
          Schema.object({ type: Schema.literal("b"), count: Schema.number() }),
        ])
      );
    expect(body(schema)).toMatchObject({
      oneOf: [
        { type: "object", properties: { name: {}, type: {}, value: {} }, additionalProperties: false },
        { type: "object", properties: { name: {}, type: {}, count: {} }, additionalProperties: false },
      ],
    });
    const inclusive = z
      .object({ name: Schema.string() })
      .and(Schema.union([Schema.object({ v: Schema.string() }), Schema.object({ c: Schema.number() })]));
    expect(body(inclusive)).toMatchObject({
      anyOf: [{ properties: { name: {}, v: {} } }, { properties: { name: {}, c: {} } }],
    });
  });

  test("input conversion has nothing to close", () => {
    expect(body(Schema.object({ a: Schema.string() }).and(Schema.object({ b: Schema.string() })), { io: "input" })).toEqual({
      type: "object",
      properties: { a: { type: "string" }, b: { type: "string" } },
      required: ["a", "b"],
    });
  });

  test("folds through a property and through Schema.lazy", () => {
    expect(body(Schema.object({ inner: Schema.object({ a: Schema.string() }).and(Schema.object({ b: Schema.string() })) }))).toMatchObject({
      properties: { inner: { type: "object", properties: { a: {}, b: {} } } },
    });
    const self: Schema.SchemaType = Schema.lazy(() => Schema.object({ a: Schema.string() }).and(Schema.object({ next: Schema.optional(self) })));
    expect(body(self)).toMatchObject({ type: "object", properties: { a: {}, next: { $ref: "#" } } });
  });

  test("metadata on the intersection itself survives", () => {
    expect(
      body(
        z
          .object({ a: Schema.string() })
          .and(Schema.object({ b: Schema.string() }))
          .meta({ title: "T" })
      )
    ).toMatchObject({
      title: "T",
      type: "object",
      properties: { a: {}, b: {} },
    });
  });

  test("a catchall constrains the sibling's keys too", () => {
    // The catchall member does not declare `b`, so its `additionalProperties` is what it demands of `b`. Folding `b` into `properties` has to carry that demand across, or the key would escape it.
    const schema = z
      .object({ a: Schema.string() })
      .catchall(Schema.number())
      .and(Schema.object({ b: Schema.string() }));
    expect(body(schema)).toEqual({
      type: "object",
      properties: { a: { type: "string" }, b: { allOf: [{ type: "number" }, { type: "string" }] } },
      required: ["a", "b"],
      additionalProperties: { type: "number" },
    });
  });

  test("two catchalls both constrain the keys neither declares", () => {
    const schema = z
      .object({})
      .catchall(Schema.number())
      .and(Schema.object({}).catchall(Schema.number().min(0)));
    expect(body(schema)).toEqual({
      type: "object",
      properties: {},
      additionalProperties: { allOf: [{ type: "number" }, { type: "number", minimum: 0 }] },
    });
    expect(Schema.safeParse({ zz: 5 }).success).toBe(true);
    expect(Schema.safeParse({ zz: -1 }).success).toBe(false);
  });

  test("the emitted openness agrees with the parser for every pair of object modes", () => {
    const modes = {
      strip: (shape: Schema.SchemaRawShape) => Schema.object(shape),
      strict: (shape: Schema.SchemaRawShape) => Schema.strictObject(shape),
      loose: (shape: Schema.SchemaRawShape) => Schema.looseObject(shape),
      catchall: (shape: Schema.SchemaRawShape) => Schema.object(shape).catchall(Schema.number()),
    };
    const grid: Record<string, unknown> = {};
    for (const [leftName, left] of Object.entries(modes)) {
      for (const [rightName, right] of Object.entries(modes)) {
        const schema = left({ a: Schema.string() }).and(right({ b: Schema.number() }));
        const emitted = body(schema) as { additionalProperties?: unknown };
        grid[`${leftName} & ${rightName}`] = emitted.additionalProperties ?? "open";

        // Whatever the emitted keyword says, it has to agree with what the parser does with a key neither member declares.
        const parsed = Schema.safeParse({ a: "s", b: 1, zz: 7 });
        const keepsUnknown = parsed.success && Object.prototype.hasOwnProperty.call(parsed.data, "zz");
        if (keepsUnknown) expect(emitted.additionalProperties).not.toBe(false);
      }
    }
    expect(grid).toMatchInlineSnapshot(`
      {
        "catchall & catchall": {
          "type": "number",
        },
        "catchall & loose": {
          "type": "number",
        },
        "catchall & strict": {
          "type": "number",
        },
        "catchall & strip": {
          "type": "number",
        },
        "loose & catchall": {
          "type": "number",
        },
        "loose & loose": "open",
        "loose & strict": "open",
        "loose & strip": "open",
        "strict & catchall": {
          "type": "number",
        },
        "strict & loose": "open",
        "strict & strict": false,
        "strict & strip": false,
        "strip & catchall": {
          "type": "number",
        },
        "strip & loose": "open",
        "strip & strict": false,
        "strip & strip": false,
      }
    `);
  });

  test("a __proto__ key stays an own property", () => {
    const folded = body(Schema.object({ ["__proto__"]: Schema.string() }).and(Schema.object({ b: Schema.number() }))) as any;
    expect(Object.prototype.hasOwnProperty.call(folded.properties, "__proto__")).toBe(true);
    expect(folded.required).toEqual(["__proto__", "b"]);
  });
});

describe("intersection folding declines", () => {
  // Every case here keeps the `allOf` it produces today. The fold only understands the four object keywords, so a member carrying anything else is left alone rather than having a constraint dropped or an annotation re-scoped.
  const allOf = (schema: Schema.SchemaType, params?: Parameters<typeof Schema.toJSONSchema>[1]) =>
    (Schema.toJSONSchema(schema, params) as any).allOf;

  test("a member that is a reference keeps its reference", () => {
    const named = Schema.object({ a: Schema.string() }).meta({ id: "Named" });
    expect(allOf(named.and(Schema.object({ b: Schema.string() })))[0]).toEqual({ $ref: "#/$defs/Named" });

    const shared = Schema.object({ c: Schema.string() });
    const reused = Schema.toJSONSchema(Schema.object({ x: shared.and(Schema.object({ d: Schema.string() })), y: shared }), {
      reused: "ref",
    }) as any;
    expect(reused.properties.x.allOf[0]).toEqual({ $ref: "#/$defs/__schema0" });

    const cyclic: any = Schema.object({
      get next() {
        return Schema.optional(cyclic);
      },
      n: Schema.string(),
    });
    expect(allOf(cyclic.and(Schema.object({ m: Schema.string() })))[0].$ref).toBe("#/$defs/__schema0");
  });

  test("an annotated member keeps its place", () => {
    expect(
      allOf(
        z
          .object({ a: Schema.string() })
          .describe("A")
          .and(Schema.object({ b: Schema.string() }))
      )[0]
    ).toMatchObject({
      description: "A",
    });
  });

  test("members that are not plain objects are left alone", () => {
    expect(allOf(Schema.intersection(Schema.string().min(2), Schema.string().max(5)))).toHaveLength(2);
    expect(allOf(Schema.object({ a: Schema.string() }).and(Schema.nullable(Schema.object({ b: Schema.string() }))))).toHaveLength(2);
    expect(
      allOf(Schema.object({ label: Schema.string() }).and(Schema.looseRecord(Schema.string().regex(/^label:[a-z]{2}$/), Schema.string())))
    ).toHaveLength(2);
  });

  test("a shared member is never rewritten for its other uses", () => {
    const shared = Schema.object({ c: Schema.string() });
    const result = Schema.toJSONSchema(Schema.object({ x: shared.and(Schema.object({ d: Schema.string() })), y: shared })) as any;
    expect(result.properties.x).toMatchObject({ properties: { c: {}, d: {} }, additionalProperties: false });
    // `y` is the same Schema schema, emitted separately, and keeps the closedness it had on its own.
    expect(result.properties.y).toEqual({
      type: "object",
      properties: { c: { type: "string" } },
      required: ["c"],
      additionalProperties: false,
    });
  });

  test("registry conversion keeps its cross-references", () => {
    const registry = Schema.registry<{ id: string }>();
    const left = Schema.object({ p: Schema.string() });
    const right = Schema.object({ q: Schema.string() });
    registry.add(left, { id: "P" });
    registry.add(right, { id: "Q" });
    registry.add(left.and(right), { id: "PQ" });
    expect((Schema.toJSONSchema(registry) as any).schemas.PQ.allOf).toEqual([{ $ref: "P" }, { $ref: "Q" }]);
  });

  test("override still runs, and sees the intersection before it folds", () => {
    const schema = Schema.object({ a: Schema.string() }).and(Schema.object({ b: Schema.string() }));
    const result = Schema.toJSONSchema(schema, {
      override(ctx) {
        if ((ctx.jsonSchema as any).allOf) (ctx.jsonSchema as any).title = "intersection";
      },
    }) as any;
    expect(result).toMatchObject({ title: "intersection", type: "object", properties: { a: {}, b: {} } });
  });

  test("an override that writes object keywords wins over the fold", () => {
    // The override runs first, so anything it puts on the intersection is deliberate. Folding would overwrite it silently, so the fold stands down instead.
    const result = Schema.toJSONSchema(Schema.object({ a: Schema.string() }).and(Schema.object({ b: Schema.string() })), {
      override(ctx) {
        if ((ctx.jsonSchema as any).allOf) (ctx.jsonSchema as any).additionalProperties = true;
      },
    }) as any;
    expect(result.additionalProperties).toBe(true);
    expect(result.allOf).toHaveLength(2);
  });

  test("more than one union member is left alone rather than multiplied out", () => {
    // The second union lands among the members the first is distributed across, and a union is not an object, so every branch fails to fold and the whole intersection stands down.
    const schema = z
      .object({ a: Schema.string() })
      .and(Schema.union([Schema.object({ v: Schema.string() }), Schema.object({ w: Schema.string() })]))
      .and(Schema.union([Schema.object({ x: Schema.string() }), Schema.object({ y: Schema.string() })]));
    expect(allOf(schema)).toHaveLength(3);
  });
});

test("currency code", () => {
  expect(Schema.toJSONSchema(Schema.currencyCode())).toEqual({
    $schema: "https://json-Schema.org/draft/2020-12/schema",
    type: "string",
    format: "currency_code",
    pattern: Schema.regexes.currencyCode.source,
  });
});
