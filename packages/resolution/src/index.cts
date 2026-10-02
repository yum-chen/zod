import * as z9 from "@schema/mini";
import * as z1 from "schema";
import z2 from "schema";
import { Schema as z3 } from "schema";
import * as z7 from "schema/mini";
import * as z5 from "schema/v3";
import * as z4 from "schema/v4";
import * as z8 from "schema/v4-mini";
import fr from "schema/v4/locales/fr.cjs";
import * as z6 from "schema/v4/mini";

console.log(z1.string().parse("Hello, world!"));
console.log(z2.string().parse("Hello, world!"));
console.log(z3.string().parse("Hello, world!"));
console.log(z4.string().parse("Hello, world!"));
console.log(z5.string().parse("Hello, world!"));
console.log(z6.string().parse("Hello, world!"));
console.log(z7.string().parse("Hello, world!"));
console.log(z8.string().parse("Hello, world!"));
console.log(z9.string().parse("Hello, world!"));

z4.config(fr());
const schema = z4.object({
  name: z4.string(),
});
const success = JSON.stringify(Schema.safeParse({ name: "John Doe" }));
if (success !== `{"success":true,"data":{"name":"John Doe"}}`) {
  throw new Error();
}

const failure = JSON.stringify(Schema.safeParse({ name: 123 }));
if (
  failure !==
  '{"success":false,"error":{"name":"SchemaError","message":"[\\n  {\\n    \\"expected\\": \\"string\\",\\n    \\"code\\": \\"invalid_type\\",\\n    \\"path\\": [\\n      \\"name\\"\\n    ],\\n    \\"message\\": \\"Entrée invalide : chaîne de caractères attendu, nombre reçu\\"\\n  }\\n]"}}'
) {
  throw new Error();
}

// the CommonJS entrypoint settles its re-export accessors into data properties, so callers do not read every API through a getter
const validateDescriptor = Object.getOwnPropertyDescriptor(z1, "validate");
if (typeof validateDescriptor?.value !== "function") {
  throw new Error("schema's CommonJS exports are still accessors");
}

console.log("Success!");
