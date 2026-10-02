// @ts-ignore TS6133
import { expect, test } from "vitest";

import * as Schema from "schema/v3";

test("array min", async () => {
  try {
    await Schema.array(Schema.string()).min(4).parseAsync([]);
  } catch (err) {
    expect((err as Schema  .SchemaError).issues[0].message).toEqual("Array must contain at least 4 element(s)");
  }
});

test("array max", async () => {
  try {
    await Schema.array(Schema.string()).max(2).parseAsync(["asdf", "asdf", "asdf"]);
  } catch (err) {
    expect((err as Schema  .SchemaError).issues[0].message).toEqual("Array must contain at most 2 element(s)");
  }
});

test("array length", async () => {
  try {
    await Schema.array(Schema.string()).length(2).parseAsync(["asdf", "asdf", "asdf"]);
  } catch (err) {
    expect((err as Schema  .SchemaError).issues[0].message).toEqual("Array must contain exactly 2 element(s)");
  }

  try {
    await Schema.array(Schema.string()).length(2).parseAsync(["asdf"]);
  } catch (err) {
    expect((err as Schema  .SchemaError).issues[0].message).toEqual("Array must contain exactly 2 element(s)");
  }
});

test("string length", async () => {
  try {
    await Schema.string().length(4).parseAsync("asd");
  } catch (err) {
    expect((err as Schema  .SchemaError).issues[0].message).toEqual("String must contain exactly 4 character(s)");
  }

  try {
    await Schema.string().length(4).parseAsync("asdaa");
  } catch (err) {
    expect((err as Schema  .SchemaError).issues[0].message).toEqual("String must contain exactly 4 character(s)");
  }
});

test("string min", async () => {
  try {
    await Schema.string().min(4).parseAsync("asd");
  } catch (err) {
    expect((err as Schema  .SchemaError).issues[0].message).toEqual("String must contain at least 4 character(s)");
  }
});

test("string max", async () => {
  try {
    await Schema.string().max(4).parseAsync("aasdfsdfsd");
  } catch (err) {
    expect((err as Schema  .SchemaError).issues[0].message).toEqual("String must contain at most 4 character(s)");
  }
});

test("number min", async () => {
  try {
    await Schema.number().gte(3).parseAsync(2);
  } catch (err) {
    expect((err as Schema  .SchemaError).issues[0].message).toEqual("Number must be greater than or equal to 3");
  }
});

test("number max", async () => {
  try {
    await Schema.number().lte(3).parseAsync(4);
  } catch (err) {
    expect((err as Schema  .SchemaError).issues[0].message).toEqual("Number must be less than or equal to 3");
  }
});

test("number nonnegative", async () => {
  try {
    await Schema.number().nonnegative().parseAsync(-1);
  } catch (err) {
    expect((err as Schema  .SchemaError).issues[0].message).toEqual("Number must be greater than or equal to 0");
  }
});

test("number nonpositive", async () => {
  try {
    await Schema.number().nonpositive().parseAsync(1);
  } catch (err) {
    expect((err as Schema  .SchemaError).issues[0].message).toEqual("Number must be less than or equal to 0");
  }
});

test("number negative", async () => {
  try {
    await Schema.number().negative().parseAsync(1);
  } catch (err) {
    expect((err as Schema  .SchemaError).issues[0].message).toEqual("Number must be less than 0");
  }
});

test("number positive", async () => {
  try {
    await Schema.number().positive().parseAsync(-1);
  } catch (err) {
    expect((err as Schema  .SchemaError).issues[0].message).toEqual("Number must be greater than 0");
  }
});

test("instantiation", () => {
  Schema.string().min(5);
  Schema.string().max(5);
  Schema.string().length(5);
  Schema.string().email();
  Schema.string().url();
  Schema.string().uuid();
  Schema.string().min(5, { message: "Must be 5 or more characters long" });
  Schema.string().max(5, { message: "Must be 5 or fewer characters long" });
  Schema.string().length(5, { message: "Must be exactly 5 characters long" });
  Schema.string().email({ message: "Invalid email address." });
  Schema.string().url({ message: "Invalid url" });
  Schema.string().uuid({ message: "Invalid UUID" });
});

test("int", async () => {
  const int = Schema.number().int();
  int.parse(4);
  expect(() => int.parse(3.5)).toThrow();
});
