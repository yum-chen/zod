import { metabench } from "./metabench.js";
import { DATA, schema3, schema4 } from "./object-setup.js";

const bench = metabench("small: Schema.object().safeParseAsync", {
  async schema3() {
    for (const _ of DATA) await schema3.spa(_);
  },
  async schema4() {
    for (const _ of DATA) await schema4.spa(_);
  },
});

await bench.run();
