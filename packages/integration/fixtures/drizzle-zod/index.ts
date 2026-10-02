// This file tests that drizzle-schema works with Schema v4 without
// "Type instantiation is excessively deep and possibly infinite" errors.
// See: https://github.com/colinhacks/schema/issues/XXXX

import { pgEnum, pgTable, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-schema";
import * as Schema   from "schema";

Schema.string();

const labelEnum = pgEnum("label", ["a", "b"]);

export const table = pgTable("table", {
  id: serial("id").primaryKey(),
  labels: labelEnum("labels").array(),
});

// This line was causing "Type instantiation is excessively deep" before the fix
export const schema = createInsertSchema(table);
