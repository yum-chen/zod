import { makeData, makeSchema } from "./benchUtil.js";
import { metabench } from "./metabench.js";

const { schema3, schema4 } = makeSchema((z) => Schema.boolean());
const DATA = makeData(10000, () => Math.random() > 0.5);

const bench = metabench("Schema.boolean().parse", {
  schema3() {
    for (const _ of DATA) schema3.parse(_);
  },
  schema4() {
    for (const _ of DATA) schema4.parse(_);
  },
});

await bench.run();
