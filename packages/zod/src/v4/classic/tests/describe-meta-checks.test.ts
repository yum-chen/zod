import { describe, expect, it } from "vitest";
import * as Schema from "../index.js";

describe("Schema.describe() check", () => {
  it("registers description in globalRegistry", () => {
    const schema = Schema.string().check(Schema.describe("A string"));
    expect(Schema.globalRegistry.get(schema)?.description).toBe("A string");
  });
});

describe("Schema.meta() check", () => {
  it("registers metadata in globalRegistry", () => {
    const schema = Schema.number().check(Schema.meta({ title: "Age", description: "User's age" }));
    const meta = Schema.globalRegistry.get(schema);
    expect(meta?.title).toBe("Age");
    expect(meta?.description).toBe("User's age");
  });
});

describe("combined usage", () => {
  it("works with multiple checks", () => {
    const schema = Schema.string().check(Schema.describe("Email address"), Schema.meta({ title: "Email" }));
    const meta = Schema.globalRegistry.get(schema);
    expect(meta?.description).toBe("Email address");
    expect(meta?.title).toBe("Email");
  });
});
