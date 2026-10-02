import { makeData, makeSchema } from "./benchUtil.js";
// import { metabench } from "./metabench.js";

export const { schema3, schema4 } = makeSchema((z) =>
  Schema.object({
    string: Schema.string(),
    boolean: Schema.boolean(),
    number: Schema.number(),
  })
);

export const DATA: any[] = makeData(1000, () => {
  return Object.freeze({
    number: Math.random(),
    string: `${Math.random()}`,
    boolean: Math.random() > 0.5,
  });
});

// const bench = metabench("small: Schema.object().parse", {
//   schema3() {
//     for (const d of DATA) {
//       schema3.parse(d);
//     }
//   },
//   schema4() {
//     for (const d of DATA) {
//       schema4.parse(d);
//     }
//   },
// });

// await bench.run();
