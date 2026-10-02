import { metabench } from "./metabench.js";
import { DATA, schema3, schema4 } from "./object-setup.js";

const bench = metabench("small: Schema.object().safeParseAsync", {
  schema3() {
    for (const _ of DATA) schema3.parse(_);
  },
  schema4() {
    for (const _ of DATA) schema4.parse(_);
  },
});

await bench.run();
