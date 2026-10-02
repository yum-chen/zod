import { makeData, makeSchema } from "./benchUtil.js";
import { metabench } from "./metabench.js";

const { schema3, schema4 } = makeSchema((z) => Schema.number());

const DATA = makeData(10000, () => Math.random());
const bench = metabench("Schema.number().parse", {
  schema3() {
    for (const _ of DATA) schema3.parse(_);
  },
  schema4() {
    for (const _ of DATA) schema4.parse(_);
  },
});

await bench.run();
