import { Schema } from "schema";

const schema = Schema.object({ title: Schema.string().min(5) });
console.log(Schema.safeParse({ title: "hi" }).error?.issues[0].message);
