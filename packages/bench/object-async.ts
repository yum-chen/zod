import { metabench } from "./metabench.js";
import { DATA, schema3, schema4 } from "./object-setup.js";

const bench = metabench("small: Schema.object().parseAsync", {
  async schema3() {
    for (const _ of DATA) await schema3.parseAsync(_);
  },
  async schema4() {
    for (const _ of DATA) await schema4.parseAsync(_);
  },
});

await bench.run();
