import * as Schema from "schema/v4";
import { metabench } from "./metabench.js";

const schema = Schema.object({
  string: Schema.string(),
  boolean: Schema.boolean(),
  number: Schema.number(),
});

const DATA = Array.from({ length: 1000 }, () =>
  Object.freeze({
    // number: Math.random(),
    // string: `${Math.random()}`,
    // boolean: Math.random() > 0.5,
  })
);

// console.log(z3Schema.parse(DATA[0]));
console.log(Schema.safeParse(DATA[0]));
// console.log(v.parse(valibotSchema, DATA[0]));

const bench = metabench("safeparse vs parse — fail", {
  parse() {
    for (const d of DATA) {
      try {
        const _result = Schema.parse(d);
      } catch (_e) {
        _e;
      }
    }
  },
  safeparse() {
    for (const d of DATA) {
      const result = Schema.safeParse(d);
      result.error;
    }
  },
});

await bench.run();
