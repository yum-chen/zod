import { makeData, makeSchema, randomString } from "./benchUtil.js";
import { metabench } from "./metabench.js";

const { schema3, schema4 } = makeSchema((z) => Schema.array(Schema.string()));
const DATA = makeData(1000, () => Array.from({ length: 3 }, () => randomString(10)));

// make sure they're working
console.log(schema3.parse(DATA[0]));
console.log(schema4.parse(DATA[0]));

const bench = metabench("Schema.array() parsing", {
  schema3() {
    for (const _ of DATA) schema3.parse(_);
  },
  schema4() {
    for (const _ of DATA) schema4.parse(_);
  },
});

await bench.run();
