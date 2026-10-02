import { randomString, schema4, schemaNext } from "./benchUtil.js";
import { metabench } from "./metabench.js";

console.log("Single item union");

const z4LibSchema = schema4.union([schema4.object({ value: schema4.string() })]);

const z4Schema = schemaNext.union([schemaNext.object({ value: schemaNext.string() })]);

const DATA = Array.from({ length: 100 }, () => ({ value: randomString(15) }));

console.log(z4Schema.parse(DATA[0]));
console.log(z4LibSchema.parse(DATA[0]));

const bench = metabench("single item union", {
  schemaNext() {
    z4LibSchema.parse({ value: "asdfadfs" });
  },
  schema4() {
    z4Schema.parse({ value: "asdfadfs" });
  },
});

await bench.run();
