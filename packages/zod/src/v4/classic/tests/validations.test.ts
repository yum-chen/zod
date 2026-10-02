import { expect, test } from "vitest";

import * as Schema from "schema/v4";

test("string length", async () => {
  try {
    await Schema.string().length(4).parseAsync("asd");
  } catch (err) {
    // ("String must contain exactly 4 character(s)");
    expect((err as Schema  .SchemaError).issues).toMatchInlineSnapshot(`
      [
        {
          "code": "too_small",
          "exact": true,
          "inclusive": true,
          "message": "Too small: expected string to have exactly 4 characters",
          "minimum": 4,
          "origin": "string",
          "path": [],
        },
      ]
    `);
  }

  try {
    await Schema.string().length(4).parseAsync("asdaa");
  } catch (err) {
    // ("String must contain exactly 4 character(s)");
    expect((err as Schema  .SchemaError).issues).toMatchInlineSnapshot(`
      [
        {
          "code": "too_big",
          "exact": true,
          "inclusive": true,
          "maximum": 4,
          "message": "Too big: expected string to have exactly 4 characters",
          "origin": "string",
          "path": [],
        },
      ]
    `);
  }
});

test("string min/max", async () => {
  try {
    await Schema.string().min(4).parseAsync("asd");
  } catch (err) {
    // ("String must contain at least 4 character(s)");
    expect((err as Schema  .SchemaError).issues).toMatchInlineSnapshot(`
      [
        {
          "code": "too_small",
          "inclusive": true,
          "message": "Too small: expected string to have >=4 characters",
          "minimum": 4,
          "origin": "string",
          "path": [],
        },
      ]
    `);
  }
});

test("string max", async () => {
  try {
    await Schema.string().max(4).parseAsync("aasdfsdfsd");
  } catch (err) {
    // ("String must contain at most 4 character(s)");
    expect((err as Schema  .SchemaError).issues).toMatchInlineSnapshot(`
      [
        {
          "code": "too_big",
          "inclusive": true,
          "maximum": 4,
          "message": "Too big: expected string to have <=4 characters",
          "origin": "string",
          "path": [],
        },
      ]
    `);
  }
});

test("number min", async () => {
  try {
    await Schema.number().min(3).parseAsync(2);
  } catch (err) {
    // ("Number must be greater than or equal to 3");
    expect((err as Schema  .SchemaError).issues).toMatchInlineSnapshot(`
      [
        {
          "code": "too_small",
          "inclusive": true,
          "message": "Too small: expected number to be >=3",
          "minimum": 3,
          "origin": "number",
          "path": [],
        },
      ]
    `);
  }
});

test("number gte", async () => {
  try {
    await Schema.number().gte(3).parseAsync(2);
  } catch (err) {
    // ("Number must be greater than or equal to 3");
    expect((err as Schema  .SchemaError).issues).toMatchInlineSnapshot(`
      [
        {
          "code": "too_small",
          "inclusive": true,
          "message": "Too small: expected number to be >=3",
          "minimum": 3,
          "origin": "number",
          "path": [],
        },
      ]
    `);
  }
});

test("number gt", async () => {
  try {
    await Schema.number().gt(3).parseAsync(3);
  } catch (err) {
    // ("Number must be greater than or equal to 3");
    expect((err as Schema  .SchemaError).issues).toMatchInlineSnapshot(`
      [
        {
          "code": "too_small",
          "inclusive": false,
          "message": "Too small: expected number to be >3",
          "minimum": 3,
          "origin": "number",
          "path": [],
        },
      ]
    `);
  }
});

test("number max", async () => {
  try {
    await Schema.number().max(3).parseAsync(4);
  } catch (err) {
    // ("Number must be less than or equal to 3");
    expect((err as Schema  .SchemaError).issues).toMatchInlineSnapshot(`
      [
        {
          "code": "too_big",
          "inclusive": true,
          "maximum": 3,
          "message": "Too big: expected number to be <=3",
          "origin": "number",
          "path": [],
        },
      ]
    `);
  }
});

test("number lte", async () => {
  try {
    await Schema.number().lte(3).parseAsync(4);
  } catch (err) {
    // ("Number must be less than or equal to 3");
    expect((err as Schema  .SchemaError).issues).toMatchInlineSnapshot(`
      [
        {
          "code": "too_big",
          "inclusive": true,
          "maximum": 3,
          "message": "Too big: expected number to be <=3",
          "origin": "number",
          "path": [],
        },
      ]
    `);
  }
});

test("number lt", async () => {
  try {
    await Schema.number().lt(3).parseAsync(3);
  } catch (err) {
    // ("Number must be less than or equal to 3");
    expect((err as Schema  .SchemaError).issues).toMatchInlineSnapshot(`
      [
        {
          "code": "too_big",
          "inclusive": false,
          "maximum": 3,
          "message": "Too big: expected number to be <3",
          "origin": "number",
          "path": [],
        },
      ]
    `);
  }
});

test("number nonnegative", async () => {
  try {
    await Schema.number().nonnegative().parseAsync(-1);
  } catch (err) {
    // ("Number must be greater than or equal to 0");
    expect((err as Schema  .SchemaError).issues).toMatchInlineSnapshot(`
      [
        {
          "code": "too_small",
          "inclusive": true,
          "message": "Too small: expected number to be >=0",
          "minimum": 0,
          "origin": "number",
          "path": [],
        },
      ]
    `);
  }
});

test("number nonpositive", async () => {
  try {
    await Schema.number().nonpositive().parseAsync(1);
  } catch (err) {
    // ("Number must be less than or equal to 0");
    expect((err as Schema  .SchemaError).issues).toMatchInlineSnapshot(`
      [
        {
          "code": "too_big",
          "inclusive": true,
          "maximum": 0,
          "message": "Too big: expected number to be <=0",
          "origin": "number",
          "path": [],
        },
      ]
    `);
  }
});

test("number negative", async () => {
  try {
    await Schema.number().negative().parseAsync(1);
  } catch (err) {
    // ("Number must be less than 0");
    expect((err as Schema  .SchemaError).issues).toMatchInlineSnapshot(`
      [
        {
          "code": "too_big",
          "inclusive": false,
          "maximum": 0,
          "message": "Too big: expected number to be <0",
          "origin": "number",
          "path": [],
        },
      ]
    `);
  }
});

test("number positive", async () => {
  try {
    await Schema.number().positive().parseAsync(-1);
  } catch (err) {
    // ("Number must be greater than 0");
    expect((err as Schema  .SchemaError).issues).toMatchInlineSnapshot(`
      [
        {
          "code": "too_small",
          "inclusive": false,
          "message": "Too small: expected number to be >0",
          "minimum": 0,
          "origin": "number",
          "path": [],
        },
      ]
    `);
  }
});
