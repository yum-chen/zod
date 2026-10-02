import { makeData } from "./benchUtil.js";
import { metabench } from "./metabench.js";

import * as Schema from "schema/v3";
import * as z4 from "schema/v4";

const a = z4.object({ a: z4.string() });
const b = Schema.object({ a: Schema.string() });

const DATA = makeData(10000, () => ({ b: `${Math.random()}` }));

const bench = metabench("safeparse error", {
  schema4() {
    for (const _ of DATA) {
      try {
        a.safeParse(_);
      } catch (_e) {
        _e;
      }
    }
  },
  schema4new() {
    for (const _ of DATA) {
      try {
        b.safeParse(_);
      } catch (_e) {
        _e;
      }
    }
  },
});

await bench.run();
