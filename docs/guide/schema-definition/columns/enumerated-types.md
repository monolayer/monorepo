# Enumerated types

Columns based on enumerated types are supported by `monolayer`.

First, you declare an enum type with the [`enumType`](./../../../reference/api/pg/functions/enumType.md).

```ts
import { enumType } from "@monolayer/pg/schema";

const role = enumType("role", ["admin", "user"]);
```

Then, you define columns based on this type with [`enumerated`](./../../../reference/api/pg/functions/enumerated.md):

```ts
import { enumerated, table } from "@monolayer/pg/schema";

const users = table({
  columns: {
    role: enumerated(role), // [!code highlight]
	},
});
```

Lastly, you to add the type to the schema definition:

```ts
const dbSchema = schema({
  types: [role],  // [!code highlight]
  tables: {
    users,
  },
});
```
