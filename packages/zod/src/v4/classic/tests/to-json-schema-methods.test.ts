import { describe, expect, test } from "vitest";
import * as Schema from "schema/v4";

// Utility functions
function expectMethodMatch(schema: Schema.SchemaType, params?: Schema.core.ToJSONSchemaParams): void {
  const staticResult = Schema.toJSONSchema(schema, params);
  const methodResult = Schema.toJSONSchema(params);
  expect(methodResult).toEqual(staticResult);
}

describe("toJSONSchema method", () => {
  describe("primitive types", () => {
    test("string", () => {
      expectMethodMatch(Schema.string());
    });

    test("number", () => {
      expectMethodMatch(Schema.number());
    });

    test("boolean", () => {
      expectMethodMatch(Schema.boolean());
    });

    test("bigint", () => {
      expectMethodMatch(Schema.bigint(), { unrepresentable: "any" });
    });

    test("symbol", () => {
      expectMethodMatch(Schema.symbol(), { unrepresentable: "any" });
    });

    test("null", () => {
      expectMethodMatch(Schema.null());
    });

    test("undefined", () => {
      expectMethodMatch(Schema.undefined(), { unrepresentable: "any" });
    });

    test("void", () => {
      expectMethodMatch(Schema.void(), { unrepresentable: "any" });
    });

    test("never", () => {
      expectMethodMatch(Schema.never());
    });

    test("any", () => {
      expectMethodMatch(Schema.any());
    });

    test("unknown", () => {
      expectMethodMatch(Schema.unknown());
    });

    test("date", () => {
      expectMethodMatch(Schema.date(), { unrepresentable: "any" });
    });

    test("nan", () => {
      expectMethodMatch(Schema.nan(), { unrepresentable: "any" });
    });
  });

  describe("string formats", () => {
    test("email", () => {
      expectMethodMatch(Schema.email());
    });

    test("url", () => {
      expectMethodMatch(Schema.url());
    });

    test("uuid", () => {
      expectMethodMatch(Schema.uuid());
    });

    test("datetime", () => {
      expectMethodMatch(Schema.iso.datetime());
    });

    test("date", () => {
      expectMethodMatch(Schema.iso.date());
    });

    test("guid", () => {
      expectMethodMatch(Schema.guid());
    });

    test("cuid", () => {
      expectMethodMatch(Schema.cuid());
    });

    test("cuid2", () => {
      expectMethodMatch(Schema.cuid2());
    });

    test("ulid", () => {
      expectMethodMatch(Schema.ulid());
    });

    test("base64", () => {
      expectMethodMatch(Schema.base64());
    });

    test("ipv4", () => {
      expectMethodMatch(Schema.ipv4());
    });

    test("ipv6", () => {
      expectMethodMatch(Schema.ipv6());
    });
  });

  describe("string validations", () => {
    test("min length", () => {
      expectMethodMatch(Schema.string().min(5));
    });

    test("max length", () => {
      expectMethodMatch(Schema.string().max(10));
    });

    test("length", () => {
      expectMethodMatch(Schema.string().length(5));
    });

    test("regex", () => {
      expectMethodMatch(Schema.string().regex(/^[A-Z]+$/));
    });

    test("multiple patterns", () => {
      expectMethodMatch(
        z
          .string()
          .regex(/^[A-Z]+$/)
          .regex(/^[0-9]+$/)
      );
    });

    test("startsWith", () => {
      expectMethodMatch(Schema.string().startsWith("hello"));
    });

    test("endsWith", () => {
      expectMethodMatch(Schema.string().endsWith("world"));
    });

    test("includes", () => {
      expectMethodMatch(Schema.string().includes("test"));
    });
  });

  describe("number validations", () => {
    test("min", () => {
      expectMethodMatch(Schema.number().min(5));
    });

    test("max", () => {
      expectMethodMatch(Schema.number().max(10));
    });

    test("int", () => {
      expectMethodMatch(Schema.int());
    });

    test("positive", () => {
      expectMethodMatch(Schema.number().positive());
    });

    test("negative", () => {
      expectMethodMatch(Schema.number().negative());
    });

    test("multipleOf", () => {
      expectMethodMatch(Schema.number().multipleOf(2));
    });

    test("gte", () => {
      expectMethodMatch(Schema.number().gte(5));
    });

    test("lte", () => {
      expectMethodMatch(Schema.number().lte(10));
    });

    test("gt", () => {
      expectMethodMatch(Schema.number().gt(5));
    });

    test("lt", () => {
      expectMethodMatch(Schema.number().lt(10));
    });
  });

  describe("literals and enums", () => {
    test("literal string", () => {
      expectMethodMatch(Schema.literal("hello"));
    });

    test("literal number", () => {
      expectMethodMatch(Schema.literal(42));
    });

    test("literal boolean", () => {
      expectMethodMatch(Schema.literal(true));
    });

    test("literal null", () => {
      expectMethodMatch(Schema.literal(null));
    });

    test("multiple literals", () => {
      expectMethodMatch(Schema.literal(["a", "b", "c"]));
    });

    test("enum", () => {
      expectMethodMatch(Schema.enum(["red", "green", "blue"]));
    });

    test("nativeEnum", () => {
      enum Colors {
        Red = "red",
        Green = "green",
        Blue = "blue",
      }
      expectMethodMatch(Schema.nativeEnum(Colors));
    });
  });

  describe("composite types", () => {
    test("array", () => {
      expectMethodMatch(Schema.array(Schema.string()));
    });

    test("array with min", () => {
      expectMethodMatch(Schema.array(Schema.string()).min(2));
    });

    test("array with max", () => {
      expectMethodMatch(Schema.array(Schema.string()).max(10));
    });

    test("object", () => {
      expectMethodMatch(Schema.object({ name: Schema.string(), age: Schema.number() }));
    });

    test("object with optional", () => {
      expectMethodMatch(Schema.object({ name: Schema.string(), age: Schema.number().optional() }));
    });

    test("strict object", () => {
      expectMethodMatch(Schema.strictObject({ name: Schema.string() }));
    });

    test("loose object", () => {
      expectMethodMatch(Schema.looseObject({ name: Schema.string() }));
    });

    test("object with catchall", () => {
      expectMethodMatch(Schema.object({ name: Schema.string() }).catchall(Schema.string()));
    });

    test("tuple", () => {
      expectMethodMatch(Schema.tuple([Schema.string(), Schema.number()]));
    });

    test("tuple with rest", () => {
      expectMethodMatch(Schema.tuple([Schema.string()], Schema.number()));
    });

    test("record", () => {
      expectMethodMatch(Schema.record(Schema.string(), Schema.number()));
    });

    test("union", () => {
      expectMethodMatch(Schema.union([Schema.string(), Schema.number()]));
    });

    test("discriminated union", () => {
      expectMethodMatch(
        Schema.discriminatedUnion("type", [
          Schema.object({ type: Schema.literal("a"), value: Schema.string() }),
          Schema.object({ type: Schema.literal("b"), value: Schema.number() }),
        ])
      );
    });

    test("intersection", () => {
      expectMethodMatch(Schema.intersection(Schema.object({ a: Schema.string() }), Schema.object({ b: Schema.number() })));
    });
  });

  describe("wrapper types", () => {
    test("optional", () => {
      expectMethodMatch(Schema.string().optional());
    });

    test("nullable", () => {
      expectMethodMatch(Schema.string().nullable());
    });

    test("nullish", () => {
      expectMethodMatch(Schema.string().nullish());
    });

    test("default", () => {
      expectMethodMatch(Schema.string().default("hello"));
    });

    test("default function", () => {
      expectMethodMatch(Schema.string().default(() => "hello"));
    });

    test("prefault", () => {
      expectMethodMatch(Schema.string().prefault("hello"));
    });

    test("prefault function", () => {
      expectMethodMatch(Schema.string().prefault(() => "hello"));
    });

    test("catch", () => {
      expectMethodMatch(Schema.string().catch("hello"));
    });

    test("readonly", () => {
      expectMethodMatch(Schema.string().readonly());
    });

    test("nonoptional", () => {
      expectMethodMatch(Schema.string().optional().nonoptional());
    });
  });

  describe("special types", () => {
    test("lazy", () => {
      type Node = {
        value: string;
        children?: Node[] | undefined;
      };
      const Node: Schema.SchemaType<Node> = Schema.lazy(() =>
        Schema.object({
          value: Schema.string(),
          children: Schema.array(Node).optional(),
        })
      ) as Schema  .SchemaType<Node>;
      expectMethodMatch(Node);
    });

    test("promise", () => {
      expectMethodMatch(Schema.promise(Schema.string()));
    });

    test("pipe", () => {
      expectMethodMatch(
        z
          .string()
          .transform((val) => val.length)
          .pipe(Schema.number())
      );
    });

    test("transform", () => {
      expectMethodMatch(
        Schema.string().transform((val) => val.length),
        { unrepresentable: "any" }
      );
    });

    test("file", () => {
      expectMethodMatch(Schema.file());
    });

    test("file with mime", () => {
      expectMethodMatch(Schema.file().mime("image/png"));
    });
  });

  describe("parameters", () => {
    test("target draft-7", () => {
      expectMethodMatch(Schema.string(), { target: "draft-7" });
    });

    test("target draft-4", () => {
      expectMethodMatch(Schema.string(), { target: "draft-4" });
    });

    test("target openapi-3.0", () => {
      expectMethodMatch(Schema.string(), { target: "openapi-3.0" });
    });

    test("io input", () => {
      expectMethodMatch(Schema.string().default("hello"), { io: "input" });
    });

    test("cycles throw", () => {
      const schema = Schema.object({
        name: Schema.string(),
        get subcategories() {
          return Schema.array(schema);
        },
      });
      // Both should throw the same error
      expect(() => Schema.toJSONSchema(schema, { cycles: "throw" })).toThrow();
      expect(() => Schema.toJSONSchema({ cycles: "throw" })).toThrow();
    });

    test("reused ref", () => {
      const shared = Schema.string();
      const schema = Schema.object({
        a: shared,
        b: shared,
      });
      expectMethodMatch(schema, { reused: "ref" });
    });
  });

  describe("edge cases with metadata", () => {
    test("schema with id metadata", () => {
      const a = Schema.string().meta({ id: "hi" });
      expectMethodMatch(a);
    });

    test("schema with id then additional metadata", () => {
      const a = Schema.string().meta({ id: "hi2" });
      const b = a.meta({ name: "asdf" });
      expectMethodMatch(b);
    });

    test("nested schema with id", () => {
      const inner = Schema.string().meta({ id: "inner" });
      const outer = Schema.object({ value: inner });
      expectMethodMatch(outer);
    });
  });
});
