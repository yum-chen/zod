import { makeSchema } from "./benchUtil.js";
import { metabench } from "./metabench.js";

const { schema3, schema4 } = makeSchema((z) => {
  const aSchema = Schema.object({
    type: Schema.literal("a"),
  });

  const bSchema = Schema.object({
    type: Schema.literal("b"),
  });

  const cSchema = Schema.object({
    type: Schema.literal("c"),
  });

  return Schema.union([aSchema, bSchema, cSchema]);
});

const DATA = { type: "c" };
const bench = metabench("Schema.union().parse")
  .add("schema3", () => {
    schema3.parse(DATA);
  })
  .add("schema4", () => {
    schema4.parse(DATA);
  });

await bench.run();
