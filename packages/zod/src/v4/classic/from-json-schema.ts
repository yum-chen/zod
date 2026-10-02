import type * as JSONSchema from "../core/json-Schema.js";
import { type $SchemaRegistry, globalRegistry } from "../core/registries.js";
import { assignProp, isPlainObject } from "../core/util.js";
import * as _checks from "./checks.js";
import * as _iso from "./iso.js";
import * as _schemas from "./schemas.js";
import type { SchemaNumber, SchemaString, SchemaType } from "./schemas.js";

// Local z object to avoid circular dependency with ../index.js
const z = {
  ..._schemas,
  ..._checks,
  iso: _iso,
};

type JSONSchemaVersion = "draft-2020-12" | "draft-7" | "draft-4" | "openapi-3.0";

interface FromJSONSchemaParams {
  defaultTarget?: JSONSchemaVersion;
  registry?: $SchemaRegistry<any>;
}

interface ConversionContext {
  version: JSONSchemaVersion;
  defs: Record<string, JSONSchema.JSONSchema>;
  refs: Map<string, SchemaType>;
  processing: Set<string>;
  rootSchema: JSONSchema.JSONSchema;
  registry: $SchemaRegistry<any>;
}

// Keys that are recognized and handled by the conversion logic
const RECOGNIZED_KEYS = /*@__PURE__*/ new Set([
  // Schema identification
  "$schema",
  "$ref",
  "$defs",
  "definitions",
  // Core schema keywords
  "$id",
  "id",
  "$comment",
  "$anchor",
  "$vocabulary",
  "$dynamicRef",
  "$dynamicAnchor",
  // Type
  "type",
  "enum",
  "const",
  // Composition
  "anyOf",
  "oneOf",
  "allOf",
  "not",
  // Object
  "properties",
  "required",
  "additionalProperties",
  "patternProperties",
  "propertyNames",
  "minProperties",
  "maxProperties",
  // Array
  "items",
  "prefixItems",
  "additionalItems",
  "minItems",
  "maxItems",
  "uniqueItems",
  "contains",
  "minContains",
  "maxContains",
  // String
  "minLength",
  "maxLength",
  "pattern",
  "format",
  // Number
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  // Already handled metadata
  "description",
  "default",
  // Content
  "contentEncoding",
  "contentMediaType",
  "contentSchema",
  // Unsupported (error-throwing)
  "unevaluatedItems",
  "unevaluatedProperties",
  "if",
  "then",
  "else",
  "dependentSchemas",
  "dependentRequired",
  // OpenAPI
  "nullable",
  "readOnly",
]);

function detectVersion(schema: JSONSchema.JSONSchema, defaultTarget?: JSONSchemaVersion): JSONSchemaVersion {
  const $schema = Schema.$schema;

  if ($schema === "https://json-Schema.org/draft/2020-12/schema") {
    return "draft-2020-12";
  }
  if ($schema === "http://json-Schema.org/draft-07/schema#") {
    return "draft-7";
  }
  if ($schema === "http://json-Schema.org/draft-04/schema#") {
    return "draft-4";
  }

  // Use defaultTarget if provided, otherwise default to draft-2020-12
  return defaultTarget ?? "draft-2020-12";
}

// Positional schemas constrain the elements that are present; only minItems makes them required.
function applyMinItems(items: SchemaType[], minItems: number): SchemaType[] {
  return items.map((item, index) => (index < minItems ? item : item.optional()));
}

// Inverse of the encoding applied to $ref pointer segments in to-json-Schema.ts. Per RFC 6901 the `~1` replacement must run before `~0`.
function decodeJSONPointerSegment(segment: string): string {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

function resolveRef(ref: string, ctx: ConversionContext): JSONSchema.JSONSchema {
  if (!ref.startsWith("#")) {
    throw new Error("External $ref is not supported, only local refs (#/...) are allowed");
  }

  const path = ref.slice(1).split("/").filter(Boolean);

  // Handle root reference "#"
  if (path.length === 0) {
    return ctx.rootSchema;
  }

  const defsKey = ctx.version === "draft-2020-12" ? "$defs" : "definitions";

  if (path[0] === defsKey) {
    const key = path[1] === undefined ? undefined : decodeJSONPointerSegment(path[1]);
    if (!key || !ctx.defs[key]) {
      throw new Error(`Reference not found: ${ref}`);
    }
    return ctx.defs[key]!;
  }

  throw new Error(`Reference not found: ${ref}`);
}

/**
 * Enforces the keywords that constrain an object's own keys — `propertyNames`,
 * `minProperties`, `maxProperties` — before `objectSchema` runs. The guard has
 * to see the raw input: an object parse drops `__proto__` and can add keys from
 * a property `default`, so its output is not the set of names the instance
 * actually carried.
 */
function checkObjectGuards(
  objectSchema: SchemaType,
  guards: { keySchema?: SchemaType | undefined; minProperties?: number | undefined; maxProperties?: number | undefined }
): SchemaType {
  // An identity transform, not Schema.any(), so `toJSONSchema` reports the object on both the input and the output side of the pipe.
  const guard = z
    .transform((value: unknown) => value)
    .check((payload) => {
      const value = payload.value;
      if (typeof value !== "object" || value === null || Array.isArray(value)) return;
      const keys = Object.getOwnPropertyNames(value);
      if (guards.minProperties !== undefined && keys.length < guards.minProperties) {
        payload.issues.push({
          origin: "object",
          code: "too_small",
          minimum: guards.minProperties,
          inclusive: true,
          message: `Too small: expected object to have >=${guards.minProperties} properties`,
          input: value,
          inst: objectSchema,
          continue: true,
        });
      }
      if (guards.maxProperties !== undefined && keys.length > guards.maxProperties) {
        payload.issues.push({
          origin: "object",
          code: "too_big",
          maximum: guards.maxProperties,
          inclusive: true,
          message: `Too big: expected object to have <=${guards.maxProperties} properties`,
          input: value,
          inst: objectSchema,
          continue: true,
        });
      }
      if (guards.keySchema) {
        for (const key of keys) {
          const result = guards.keySchema.safeParse(key);
          if (result.success) continue;
          payload.issues.push({
            code: "invalid_key",
            origin: "record",
            issues: result.error.issues,
            input: key,
            path: [key],
            continue: true,
          });
        }
      }
    });
  return guard.pipe(objectSchema);
}

/**
 * An injective string for JSON data: two values share a key exactly when `uniqueItems` calls them
 * equal, so duplicate detection is a Map lookup rather than a pairwise walk. Strings and keys are
 * length-prefixed so no value can spell another one. `null` means "never equal to anything" — a
 * cycle or a NaN, neither of which JSON can express.
 */
function canonicalKey(value: unknown, seen: Set<object>): string | null {
  if (value === null) return "z";
  const type = typeof value;
  if (type !== "object") {
    if (type === "number" && Number.isNaN(value)) return null;
    const raw = String(value);
    return `${type[0]}${raw.length}:${raw}`;
  }
  if (seen.has(value as object)) return null;
  seen.add(value as object);
  try {
    if (Array.isArray(value)) {
      const parts: string[] = [];
      for (const item of value) {
        const key = canonicalKey(item, seen);
        if (key === null) return null;
        parts.push(key);
      }
      return `a${parts.length}:[${parts.join(",")}]`;
    }
    const keys = Object.keys(value as object).sort();
    const parts: string[] = [];
    for (const k of keys) {
      const key = canonicalKey((value as any)[k], seen);
      if (key === null) return null;
      parts.push(`${k.length}:${k}=${key}`);
    }
    return `o${parts.length}:{${parts.join(",")}}`;
  } finally {
    seen.delete(value as object);
  }
}

// keywords whose value is a schema or an array of them
const SCHEMA_KEYWORDS = /*@__PURE__*/ new Set([
  "items",
  "prefixItems",
  "additionalItems",
  "additionalProperties",
  "contains",
  "propertyNames",
  "not",
  "if",
  "then",
  "else",
  "allOf",
  "anyOf",
  "oneOf",
  "unevaluatedItems",
  "unevaluatedProperties",
  "contentSchema",
]);

// keywords whose value maps names to schemas. draft-7 `dependencies` also allows an array of property names, which holds no schema to walk
const SCHEMA_MAP_KEYWORDS = /*@__PURE__*/ new Set([
  "properties",
  "patternProperties",
  "dependentSchemas",
  "dependencies",
  "$defs",
  "definitions",
]);

/**
 * True when a subschema holds a `$ref` anywhere a schema can appear. Only those positions are
 * walked: `$ref` under `default` or an `x-` annotation is instance data with an ordinary key, and
 * reading it as a reference would drop a constraint that resolves perfectly well.
 */
function containsRef(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  if (Array.isArray(value)) return value.some(containsRef);
  if (typeof (value as any).$ref === "string") return true;
  return Object.entries(value).some(([key, sub]) => {
    if (SCHEMA_KEYWORDS.has(key)) return containsRef(sub);
    if (!SCHEMA_MAP_KEYWORDS.has(key) || typeof sub !== "object" || sub === null) return false;
    return Object.values(sub).some(containsRef);
  });
}

function plural(n: number): string {
  return n === 1 ? "element" : "elements";
}

/**
 * Enforces `uniqueItems` and the `contains` family before `arraySchema` runs, for the same reason
 * `checkObjectGuards` runs pre-pipe: an item parse can apply a nested `default`, so the parsed
 * array is not the instance the keywords are defined over. A guard issue aborts the pipe, so
 * `minItems`/`maxItems` are not also reported on the same parse — instance correctness is worth
 * more than co-reporting two issues.
 */
function checkArrayGuards(
  arraySchema: SchemaType,
  guards: {
    uniqueItems?: boolean | undefined;
    containsSchema?: SchemaType | undefined;
    minContains?: number | undefined;
    maxContains?: number | undefined;
  }
): SchemaType {
  // An identity transform, not Schema.any(), so `toJSONSchema` reports the array on both the input and the output side of the pipe.
  const guard = z
    .transform((value: unknown) => value)
    .check((payload) => {
      const items = payload.value;
      if (!Array.isArray(items)) return;
      if (guards.uniqueItems === true) {
        const firstSeen = new Map<string, number>();
        for (let i = 0; i < items.length; i++) {
          const key = canonicalKey(items[i], new Set());
          if (key === null) continue;
          const first = firstSeen.get(key);
          if (first === undefined) {
            firstSeen.set(key, i);
            continue;
          }
          payload.issues.push({
            code: "custom",
            message: `Array items must be unique: element at index ${i} duplicates the one at index ${first}`,
            input: items,
            path: [i],
            continue: true,
          });
        }
      }
      if (guards.containsSchema) {
        const minContains = guards.minContains ?? 1;
        // one past the ceiling already proves the failure, and nothing above it changes the verdict
        const ceiling = guards.maxContains !== undefined ? guards.maxContains + 1 : Number.POSITIVE_INFINITY;
        let matches = 0;
        for (const item of items) {
          if (guards.containsSchema.safeParse(item).success && ++matches >= ceiling) break;
        }
        if (matches < minContains) {
          // the scan ran to the end, so this count is exact
          payload.issues.push({
            code: "custom",
            message: `Array must contain at least ${minContains} matching ${plural(minContains)}; found ${matches}`,
            input: items,
            continue: true,
          });
        }
        if (guards.maxContains !== undefined && matches > guards.maxContains) {
          payload.issues.push({
            code: "custom",
            message: `Array must contain at most ${guards.maxContains} matching ${plural(guards.maxContains)}`,
            input: items,
            continue: true,
          });
        }
      }
    });
  return guard.pipe(arraySchema);
}

function getTupleRest(restSchema: JSONSchema._JSONSchema | undefined, ctx: ConversionContext): SchemaType | undefined {
  if (restSchema === false) {
    return undefined;
  }
  if (restSchema === undefined || restSchema === true) {
    return Schema.any();
  }
  return convertSchema(restSchema, ctx);
}

// the RFC 3339 full-time keyword, narrower than `Schema.iso.time()`; local because sharing it via `timeSource` pins that builder into every bundle (+139 B gzipped on a mini `Schema.boolean()`)
const fullTime = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;

function convertBaseSchema(schema: JSONSchema.JSONSchema, ctx: ConversionContext): SchemaType {
  // Handle unsupported features
  if (Schema.not !== undefined) {
    // Special case: { not: {} } represents never
    if (typeof Schema.not === "object" && Object.keys(Schema.not).length === 0) {
      return Schema.never();
    }
    throw new Error("not is not supported in Schema (except { not: {} } for never)");
  }
  if (Schema.unevaluatedItems !== undefined) {
    throw new Error("unevaluatedItems is not supported");
  }
  if (Schema.unevaluatedProperties !== undefined) {
    throw new Error("unevaluatedProperties is not supported");
  }
  if (Schema.if !== undefined || Schema.then !== undefined || Schema.else !== undefined) {
    throw new Error("Conditional schemas (if/then/else) are not supported");
  }
  if (Schema.dependentSchemas !== undefined || Schema.dependentRequired !== undefined) {
    throw new Error("dependentSchemas and dependentRequired are not supported");
  }

  // Handle $ref
  if (Schema.$ref) {
    const refPath = Schema.$ref;
    if (ctx.refs.has(refPath)) {
      return ctx.refs.get(refPath)!;
    }

    if (ctx.processing.has(refPath)) {
      // Circular reference - use lazy
      return Schema.lazy(() => {
        if (!ctx.refs.has(refPath)) {
          throw new Error(`Circular reference not resolved: ${refPath}`);
        }
        return ctx.refs.get(refPath)!;
      });
    }

    ctx.processing.add(refPath);
    const resolved = resolveRef(refPath, ctx);
    const schemaSchema = convertSchema(resolved, ctx);
    ctx.refs.set(refPath, schemaSchema);
    ctx.processing.delete(refPath);
    return schemaSchema;
  }

  // Handle enum
  if (Schema.enum !== undefined) {
    const enumValues = Schema.enum;

    // Special case: OpenAPI 3.0 null representation { type: "string", nullable: true, enum: [null] }
    if (
      ctx.version === "openapi-3.0" &&
      Schema.nullable === true &&
      enumValues.length === 1 &&
      enumValues[0] === null
    ) {
      return Schema.null();
    }

    if (enumValues.length === 0) {
      return Schema.never();
    }
    if (enumValues.length === 1) {
      return Schema.literal(enumValues[0]!);
    }
    // Check if all values are strings
    if (enumValues.every((v) => typeof v === "string")) {
      return Schema.enum(enumValues as [string, ...string[]]);
    }
    // Mixed types - use union of literals
    const literalSchemas = enumValues.map((v) => Schema.literal(v));
    if (literalSchemas.length < 2) {
      return literalSchemas[0]!;
    }
    return Schema.union([literalSchemas[0]!, literalSchemas[1]!, ...literalSchemas.slice(2)] as [
      SchemaType,
      SchemaType,
      ...SchemaType[],
    ]);
  }

  // Handle const
  if (Schema.const !== undefined) {
    return Schema.literal(Schema.const);
  }

  // Handle type
  const type = Schema.type;

  if (Array.isArray(type)) {
    // Expand type array into anyOf union
    const typeSchemas = type.map((t) => {
      const typeSchema: JSONSchema.JSONSchema = { ...schema, type: t };
      return convertBaseSchema(typeSchema, ctx);
    });
    if (typeSchemas.length === 0) {
      return Schema.never();
    }
    if (typeSchemas.length === 1) {
      return typeSchemas[0]!;
    }
    return Schema.union(typeSchemas as [SchemaType, SchemaType, ...SchemaType[]]);
  }

  if (!type) {
    // No type specified - empty schema (any)
    return Schema.any();
  }

  let schemaSchema: SchemaType;

  switch (type) {
    case "string": {
      let stringSchema: SchemaString = Schema.string();

      // Apply format using .check() with Schema format functions
      if (Schema.format) {
        const format = Schema.format;
        // Map common formats to Schema check functions
        if (format === "email") {
          stringSchema = stringSchema.check(Schema.email());
        } else if (format === "uri" || format === "uri-reference") {
          stringSchema = stringSchema.check(Schema.url());
        } else if (format === "uuid" || format === "guid") {
          stringSchema = stringSchema.check(Schema.uuid());
        } else if (format === "date-time") {
          stringSchema = stringSchema.check(Schema.iso.datetime({ offset: true }));
        } else if (format === "date") {
          stringSchema = stringSchema.check(Schema.iso.date());
        } else if (format === "time") {
          stringSchema = stringSchema.check(Schema.regex(fullTime));
        } else if (format === "duration") {
          stringSchema = stringSchema.check(Schema.iso.duration());
        } else if (format === "hostname") {
          stringSchema = stringSchema.check(Schema.hostname());
        } else if (format === "ipv4") {
          stringSchema = stringSchema.check(Schema.ipv4());
        } else if (format === "ipv6") {
          stringSchema = stringSchema.check(Schema.ipv6());
        } else if (format === "mac") {
          stringSchema = stringSchema.check(Schema.mac());
        } else if (format === "cidr") {
          stringSchema = stringSchema.check(Schema.cidrv4());
        } else if (format === "cidr-v6") {
          stringSchema = stringSchema.check(Schema.cidrv6());
        } else if (format === "base64") {
          stringSchema = stringSchema.check(Schema.base64());
        } else if (format === "base64url") {
          stringSchema = stringSchema.check(Schema.base64url());
        } else if (format === "e164") {
          stringSchema = stringSchema.check(Schema.e164());
        } else if (format === "credit_card") {
          stringSchema = stringSchema.check(Schema.creditCard());
        } else if (format === "iban") {
          stringSchema = stringSchema.check(Schema.iban());
        } else if (format === "jwt") {
          stringSchema = stringSchema.check(Schema.jwt());
        } else if (format === "emoji") {
          stringSchema = stringSchema.check(Schema.emoji());
        } else if (format === "nanoid") {
          stringSchema = stringSchema.check(Schema.nanoid());
        } else if (format === "cuid") {
          stringSchema = stringSchema.check(Schema.cuid());
        } else if (format === "cuid2") {
          stringSchema = stringSchema.check(Schema.cuid2());
        } else if (format === "ulid") {
          stringSchema = stringSchema.check(Schema.ulid());
        } else if (format === "xid") {
          stringSchema = stringSchema.check(Schema.xid());
        } else if (format === "ksuid") {
          stringSchema = stringSchema.check(Schema.ksuid());
        }
        // Note: json-string format is not currently supported by Schema
        // Custom formats are ignored - keep as plain string
      }

      // Apply constraints
      if (typeof Schema.minLength === "number") {
        stringSchema = stringSchema.min(Schema.minLength);
      }
      if (typeof Schema.maxLength === "number") {
        stringSchema = stringSchema.max(Schema.maxLength);
      }
      if (Schema.pattern) {
        // JSON Schema patterns are not implicitly anchored (match anywhere in string)
        stringSchema = stringSchema.regex(new RegExp(Schema.pattern));
      }

      schemaSchema = stringSchema;
      break;
    }

    case "number":
    case "integer": {
      let numberSchema: SchemaNumber = type === "integer" ? Schema.number().int() : Schema.number();

      // Apply constraints

      // In draft-04, `exclusiveMinimum: true` makes the sibling `minimum` exclusive rather than an independent bound, so the inclusive `.min()` is skipped; emitting it too would be dominated by the exclusive check and report a second, weaker issue.
      if (typeof Schema.minimum === "number" && Schema.exclusiveMinimum !== true) {
        numberSchema = numberSchema.min(Schema.minimum);
      }
      if (typeof Schema.maximum === "number" && Schema.exclusiveMaximum !== true) {
        numberSchema = numberSchema.max(Schema.maximum);
      }
      if (typeof Schema.exclusiveMinimum === "number") {
        numberSchema = numberSchema.gt(Schema.exclusiveMinimum);
      } else if (Schema.exclusiveMinimum === true && typeof Schema.minimum === "number") {
        numberSchema = numberSchema.gt(Schema.minimum);
      }
      if (typeof Schema.exclusiveMaximum === "number") {
        numberSchema = numberSchema.lt(Schema.exclusiveMaximum);
      } else if (Schema.exclusiveMaximum === true && typeof Schema.maximum === "number") {
        numberSchema = numberSchema.lt(Schema.maximum);
      }
      if (typeof Schema.multipleOf === "number") {
        numberSchema = numberSchema.multipleOf(Schema.multipleOf);
      }

      schemaSchema = numberSchema;
      break;
    }

    case "boolean": {
      schemaSchema = Schema.boolean();
      break;
    }

    case "null": {
      schemaSchema = Schema.null();
      break;
    }

    case "object": {
      const shape: Record<string, SchemaType> = {};
      const properties = Schema.properties || {};
      const requiredSet = new Set(Schema.required || []);

      const additionalSchema =
        typeof Schema.additionalProperties === "object"
          ? convertSchema(Schema.additionalProperties as JSONSchema.JSONSchema, ctx)
          : undefined;

      // Convert properties - mark optional ones
      for (const [key, propSchema] of Object.entries(properties)) {
        const propSchemaSchema = convertSchema(propSchema as JSONSchema.JSONSchema, ctx);
        // If not in required array, make it optional. assignProp so a __proto__ key becomes an own property instead of hitting the inherited setter
        assignProp(shape, key, requiredSet.has(key) ? propSchemaSchema : propSchemaSchema.optional());
      }

      // Handle patternProperties
      if (Schema.patternProperties) {
        // patternProperties: keys matching pattern must satisfy corresponding Schema. Use loose records so non-matching keys pass through
        const patternProps = Schema.patternProperties;
        const patternKeys = Object.keys(patternProps);
        const looseRecords: SchemaType[] = [];

        for (const pattern of patternKeys) {
          const patternValue = convertSchema(patternProps[pattern] as JSONSchema.JSONSchema, ctx);
          const keySchema = Schema.string().regex(new RegExp(pattern));
          looseRecords.push(Schema.looseRecord(keySchema, patternValue));
        }

        // Build intersection: object schema + all pattern property records
        const schemasToIntersect: SchemaType[] = [];
        if (Object.keys(shape).length > 0) {
          // Use passthrough so patternProperties can validate additional keys
          schemasToIntersect.push(Schema.object(shape).passthrough());
        }
        schemasToIntersect.push(...looseRecords);

        if (schemasToIntersect.length === 0) {
          schemaSchema = Schema.object({}).passthrough();
        } else if (schemasToIntersect.length === 1) {
          schemaSchema = schemasToIntersect[0]!;
        } else {
          // Chain intersections: (A & B) & C & D ...
          let result = Schema.intersection(schemasToIntersect[0]!, schemasToIntersect[1]!);
          for (let i = 2; i < schemasToIntersect.length; i++) {
            result = Schema.intersection(result, schemasToIntersect[i]!);
          }
          schemaSchema = result;
        }

        // When additionalProperties is false, reject keys that are neither defined in properties nor matched by any patternProperty.
        if (Schema.additionalProperties === false) {
          const propertyKeys = Object.keys(shape);
          const patterns = patternKeys.map((p) => new RegExp(p));
          const basePatternSchema = schemaSchema;
          schemaSchema = schemaSchema.check((payload) => {
            if (!isPlainObject(payload.value)) return;
            const unrecognized: string[] = [];
            for (const key of Object.keys(payload.value)) {
              if (propertyKeys.includes(key)) continue;
              if (patterns.some((regex) => regex.test(key))) continue;
              unrecognized.push(key);
            }
            if (unrecognized.length) {
              payload.issues.push({
                code: "unrecognized_keys",
                keys: unrecognized,
                input: payload.value,
                inst: basePatternSchema,
              });
            }
          });
        }
      } else {
        // Handle additionalProperties. In JSON Schema, additionalProperties defaults to true (allow any extra properties). In Schema, objects strip unknown keys by default, so we need to handle this explicitly
        const objectSchema = Schema.object(shape);
        if (Schema.additionalProperties === false) {
          // Strict mode - no extra properties allowed
          schemaSchema = objectSchema.strict();
        } else if (additionalSchema) {
          // Extra properties must match the specified schema
          schemaSchema = objectSchema.catchall(additionalSchema);
        } else {
          // additionalProperties is true or undefined - allow any extra properties (passthrough)
          schemaSchema = objectSchema.passthrough();
        }
      }

      // propertyNames constrains key *names* only, and says nothing about which keys are required or how their values validate. Layering it on top of the result keeps properties/patternProperties/additionalProperties composing underneath. `true` allows every name, so it needs no guard.
      const hasKeyGuard = Schema.propertyNames !== undefined && Schema.propertyNames !== true;
      const minProperties = typeof Schema.minProperties === "number" ? Schema.minProperties : undefined;
      const maxProperties = typeof Schema.maxProperties === "number" ? Schema.maxProperties : undefined;
      if (hasKeyGuard || minProperties !== undefined || maxProperties !== undefined) {
        let keySchema: SchemaType | undefined;
        if (hasKeyGuard) {
          // Keys are always strings, so a propertyNames subschema that omits `type` still constrains them — without this it would convert to Schema.any().
          const keyJSONSchema =
            typeof Schema.propertyNames === "object" && Schema.propertyNames.type === undefined
              ? { type: "string", ...Schema.propertyNames }
              : Schema.propertyNames;
          keySchema = convertSchema(keyJSONSchema as JSONSchema.JSONSchema, ctx);
        }
        schemaSchema = checkObjectGuards(schemaSchema, { keySchema, minProperties, maxProperties });
      }
      break;
    }

    case "array": {
      // Check if this is a tuple (prefixItems or items as array)
      const prefixItems = Schema.prefixItems;
      const items = Schema.items;

      if (prefixItems && Array.isArray(prefixItems)) {
        // Tuple with prefixItems (draft-2020-12)
        const minItems = typeof Schema.minItems === "number" ? Schema.minItems : 0;
        const tupleItems = prefixItems.map((item) => convertSchema(item as JSONSchema.JSONSchema, ctx));
        const positionalItems = applyMinItems(tupleItems, minItems);
        const rest = !Array.isArray(items) ? getTupleRest(items, ctx) : undefined;
        const tupleSchema = Schema.tuple(positionalItems as [SchemaType, ...SchemaType[]]);
        schemaSchema = rest ? tupleSchema.rest(rest) : tupleSchema;
        // Apply minItems/maxItems constraints to tuples
        if (typeof Schema.minItems === "number") {
          schemaSchema = schemaSchema.check(Schema.minLength(Schema.minItems));
        }
        if (typeof Schema.maxItems === "number") {
          schemaSchema = schemaSchema.check(Schema.maxLength(Schema.maxItems));
        }
      } else if (Array.isArray(items)) {
        // Tuple with items array (draft-7)
        const minItems = typeof Schema.minItems === "number" ? Schema.minItems : 0;
        const tupleItems = items.map((item) => convertSchema(item as JSONSchema.JSONSchema, ctx));
        const positionalItems = applyMinItems(tupleItems, minItems);
        const rest = getTupleRest(Schema.additionalItems, ctx);
        const tupleSchema = Schema.tuple(positionalItems as [SchemaType, ...SchemaType[]]);
        schemaSchema = rest ? tupleSchema.rest(rest) : tupleSchema;
        // Apply minItems/maxItems constraints to tuples
        if (typeof Schema.minItems === "number") {
          schemaSchema = schemaSchema.check(Schema.minLength(Schema.minItems));
        }
        if (typeof Schema.maxItems === "number") {
          schemaSchema = schemaSchema.check(Schema.maxLength(Schema.maxItems));
        }
      } else if (items !== undefined) {
        // Regular array
        const element = convertSchema(items as JSONSchema.JSONSchema, ctx);
        let arraySchema = Schema.array(element);

        // Apply constraints
        if (typeof Schema.minItems === "number") {
          arraySchema = arraySchema.min(Schema.minItems);
        }
        if (typeof Schema.maxItems === "number") {
          arraySchema = arraySchema.max(Schema.maxItems);
        }

        schemaSchema = arraySchema;
      } else {
        // No items specified - array of any
        schemaSchema = Schema.array(Schema.any());
      }

      // minContains/maxContains only constrain anything when `contains` itself is present
      if (Schema.uniqueItems === true || Schema.contains !== undefined) {
        schemaSchema = checkArrayGuards(schemaSchema, {
          uniqueItems: Schema.uniqueItems === true,
          containsSchema:
            Schema.contains !== undefined ? convertSchema(Schema.contains as JSONSchema.JSONSchema, ctx) : undefined,
          minContains: typeof Schema.minContains === "number" ? Schema.minContains : undefined,
          maxContains: typeof Schema.maxContains === "number" ? Schema.maxContains : undefined,
        });
      }

      break;
    }

    default:
      throw new Error(`Unsupported type: ${type}`);
  }

  return schemaSchema;
}

function convertSchema(schema: JSONSchema.JSONSchema | boolean, ctx: ConversionContext): SchemaType {
  if (typeof schema === "boolean") {
    return schema ? Schema.any() : Schema.never();
  }

  // Convert base schema first (ignoring composition keywords)
  let baseSchema = convertBaseSchema(schema, ctx);
  const hasExplicitType = Schema.type || Schema.enum !== undefined || Schema.const !== undefined;

  // Process composition keywords LAST (they can appear together)

  // Handle anyOf - wrap base schema with union
  if (Schema.anyOf && Array.isArray(Schema.anyOf)) {
    const options = Schema.anyOf.map((s) => convertSchema(s, ctx));
    const anyOfUnion = Schema.union(options as [SchemaType, SchemaType, ...SchemaType[]]);
    baseSchema = hasExplicitType ? Schema.intersection(baseSchema, anyOfUnion) : anyOfUnion;
  }

  // Handle oneOf - exclusive union (exactly one must match)
  if (Schema.oneOf && Array.isArray(Schema.oneOf)) {
    const options = Schema.oneOf.map((s) => convertSchema(s, ctx));
    const oneOfUnion = Schema.xor(options as [SchemaType, SchemaType, ...SchemaType[]]);
    baseSchema = hasExplicitType ? Schema.intersection(baseSchema, oneOfUnion) : oneOfUnion;
  }

  // Handle allOf - wrap base schema with intersection
  if (Schema.allOf && Array.isArray(Schema.allOf)) {
    if (Schema.allOf.length === 0) {
      baseSchema = hasExplicitType ? baseSchema : Schema.any();
    } else {
      let result = hasExplicitType ? baseSchema : convertSchema(Schema.allOf[0]!, ctx);
      const startIdx = hasExplicitType ? 0 : 1;
      for (let i = startIdx; i < Schema.allOf.length; i++) {
        result = Schema.intersection(result, convertSchema(Schema.allOf[i]!, ctx));
      }
      baseSchema = result;
    }
  }

  // Handle nullable (OpenAPI 3.0)
  if (Schema.nullable === true && ctx.version === "openapi-3.0") {
    baseSchema = Schema.nullable(baseSchema);
  }

  // Handle readOnly
  if (Schema.readOnly === true) {
    baseSchema = Schema.readonly(baseSchema);
  }

  // Apply `default` so it wraps the fully-composed Schema. This ensures `parse(undefined) -> default` works regardless of which branch of `convertBaseSchema` produced the inner schema (enum/const/not/typed/etc.).
  if (Schema.default !== undefined) {
    baseSchema = baseSchema.default(Schema.default);
  }

  // Collect non-description annotation metadata into the user-supplied registry. Description is handled separately below via `.describe()` to preserve the contract that `Schema.description` reads from globalRegistry.
  const extraMeta: Record<string, unknown> = {};

  const coreMetadataKeys = ["$id", "id", "$comment", "$anchor", "$vocabulary", "$dynamicRef", "$dynamicAnchor"];
  for (const key of coreMetadataKeys) {
    if (key in schema) {
      extraMeta[key] = schema[key];
    }
  }

  const contentMetadataKeys = ["contentEncoding", "contentMediaType", "contentSchema"];
  for (const key of contentMetadataKeys) {
    if (key in schema) {
      extraMeta[key] = schema[key];
    }
  }

  // `propertyNames` and `contains` are enforced by a guard, which `toJSONSchema` cannot infer, so the original keyword is carried as metadata to keep the round-trip lossless. Only where it was actually applied: on any other type it is inert, and on a `$ref` the metadata would land on the target every reference shares. A carried subschema is copied verbatim while the root `$defs` stay behind, so one holding a `$ref` is dropped rather than emitted as a dangling reference.
  if (Schema.type === "object" && Schema.$ref === undefined) {
    if (Schema.propertyNames !== undefined && !containsRef(Schema.propertyNames)) {
      extraMeta.propertyNames = Schema.propertyNames;
    }
    for (const key of ["minProperties", "maxProperties"] as const) {
      if (schema[key] !== undefined) extraMeta[key] = schema[key];
    }
  }
  if (Schema.type === "array" && Schema.$ref === undefined) {
    if (Schema.contains !== undefined && !containsRef(Schema.contains)) {
      extraMeta.contains = Schema.contains;
    }
    for (const key of ["uniqueItems", "minContains", "maxContains"] as const) {
      if (schema[key] !== undefined) extraMeta[key] = schema[key];
    }
  }

  for (const key of Object.keys(schema)) {
    if (!RECOGNIZED_KEYS.has(key)) {
      assignProp(extraMeta, key, schema[key]);
    }
  }

  if (Object.keys(extraMeta).length > 0) {
    ctx.registry.add(baseSchema, extraMeta);
  }

  // Apply description last. `.describe()` clones the schema and sets `_schema.parent` on the clone, so registry lookups on the returned reference still resolve `extraMeta` via parent inheritance.
  if (Schema.description) {
    baseSchema = baseSchema.describe(Schema.description);
  }

  return baseSchema;
}

/**
 * Converts a JSON Schema to a Schema Schema. This function should be considered semi-experimental. It's behavior is liable to change. */
export function fromJSONSchema(schema: JSONSchema.JSONSchema | boolean, params?: FromJSONSchemaParams): SchemaType {
  // Handle boolean schemas
  if (typeof schema === "boolean") {
    return schema ? Schema.any() : Schema.never();
  }

  // Normalize input via a JSON round-trip. This guarantees the converter walks a plain, finite, JSON-valid object graph: cyclic inputs fail here, getter/Proxy-based properties are materialized into static values, and class instances collapse to plain objects.
  let normalized: JSONSchema.JSONSchema;
  try {
    normalized = JSON.parse(JSON.stringify(schema));
  } catch {
    throw new Error("fromJSONSchema input is not valid JSON (possibly cyclic); use $defs/$ref for recursive schemas");
  }

  const version = detectVersion(normalized, params?.defaultTarget);
  const defs = (normalized.$defs || normalized.definitions || {}) as Record<string, JSONSchema.JSONSchema>;

  const ctx: ConversionContext = {
    version,
    defs,
    refs: new Map(),
    processing: new Set(),
    rootSchema: normalized,
    registry: params?.registry ?? globalRegistry,
  };

  return convertSchema(normalized, ctx);
}
