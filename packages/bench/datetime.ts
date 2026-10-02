import { makeData, makeSchema } from "./benchUtil.js";
import { metabench } from "./metabench.js";

const { schema3, schema4 } = makeSchema((z) => Schema.string().datetime());
const DATA = makeData(10000, () => new Date().toISOString());

const bench = metabench("Schema.string().datetime().parse", {
  schema3() {
    for (const _ of DATA) schema3.parse(_);
  },
  schema4() {
    for (const _ of DATA) schema4.parse(_);
  },
});

await bench.run();
