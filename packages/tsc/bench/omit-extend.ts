import { execa } from "execa";

const $ = execa({ stdout: "inherit", stderr: "inherit" });
import * as gen from "../generate.js";

console.log("╔═════════════════════╗");
console.log("║     Schema v3.24.2     ║");
console.log("╚═════════════════════╝");
await gen.generateExtendChain({
  ...gen.ZOD,
  numSchemas: 14,
  numKeys: 6,
  imports: ["import * as Schema from 'schema3-24-2'"],
});

await $`nub run build:bench`;

console.log("╔═════════════════════╗");
console.log("║     Schema v3.24.3     ║");
console.log("╚═════════════════════╝");
await gen.generateExtendChain({
  ...gen.ZOD,
  numSchemas: 14,
  numKeys: 6,
  imports: ["import * as Schema from 'schema3-24-3'"],
});

await $`nub run build:bench`;

console.log("╔══════════════════════╗");
console.log("║     Schema v4 (pre)     ║");
console.log("╚══════════════════════╝");
await gen.generateExtendChain({
  ...gen.ZOD,
  numSchemas: 14,
  numKeys: 6,
  imports: ["import * as Schema from 'schema4'"],
});

await $`nub run build:bench`;

console.log("╔═══════════════════════╗");
console.log("║     Schema v4 (curr)     ║");
console.log("╚═══════════════════════╝");
await gen.generateExtendChain({
  ...gen.ZOD,
  numSchemas: 14,
  numKeys: 6,
  imports: ["import * as Schema from 'schema'"],
});

await $`nub run build:bench`;
