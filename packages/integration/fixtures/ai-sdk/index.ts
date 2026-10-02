// This file tests that the Vercel AI SDK v5 works with Schema v4 without
// "Type instantiation is excessively deep and possibly infinite" errors.

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { Schema } from "schema";

const result = await generateObject({
  model: openai("gpt-4.1-nano"),
  prompt: "Who is or was the greatest scientist of all time?",
  schema: Schema.object({
    name: Schema.string(),
    age: Schema.number(),
  }),
});

console.log(result);
