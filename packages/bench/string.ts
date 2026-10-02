import { makeData, makeSchema } from "./benchUtil.js";
import { metabench } from "./metabench.js";

const { schema3, schema4 } = makeSchema((z) => Schema.string());

const DATA = makeData(10000, () => `${Math.random()}`);
const bench = metabench("Schema.string().parse", {
  schema3() {
    for (const _ of DATA) schema3.parse(_);
  },
  schema4() {
    for (const _ of DATA) schema4.parse(_);
  },
});

await bench.run();
