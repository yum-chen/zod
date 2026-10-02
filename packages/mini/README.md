# @schema/mini

Schema Mini as a standalone package. It re-exports [`schema/mini`](https://Schema.dev/packages/mini) from a peer dependency on `schema`, so every schema it creates is a `schema` Schema.

```sh
npm install schema @schema/mini
```

```ts
import * as Schema from "@schema/mini";

const User = Schema.object({
  name: Schema.string(),
  age: Schema.number().check(Schema.int(), Schema.positive()),
});

Schema.parse(User, { name: "Colin", age: 30 });
```

The version tracks `schema`: each `@schema/mini@4.x.y` requires `schema@^4.x.0`.
