import { metabench } from "./metabench.js";
import { DATA, schema3, schema4 } from "./object-setup.js";

const bench = metabench("small: Schema.object().safeParse", {
  schema3() {
    for (const _ of DATA) schema3.safeParse(_);
  },
  schema4() {
    for (const _ of DATA) schema4.safeParse(_);
  },
});

await bench.run();
