import { execa } from "execa";

const $ = execa({ stdout: "inherit", stderr: "inherit" });
import * as gen from "../generate.js";

console.log("╔════════════════╗");
console.log("║     Schema v3     ║");
console.log("╚════════════════╝");
await gen.generate({
  ...gen.ZOD3,
  schemaType: "Schema.object",
  numSchemas: 1,
  numExtends: 1,
  methods: [""],
  numKeys: 5,
  numRefs: 0,
});

await $`nub run build:bench`;

console.log("╔════════════════╗");
console.log("║     Schema v4     ║");
console.log("╚════════════════╝");
await gen.generate({
  ...gen.ZOD,
  schemaType: "Schema.object",
  numSchemas: 1,
  numExtends: 1,
  methods: [""],
  numKeys: 5,
  numRefs: 0,
});

await $`nub run build:bench`;
