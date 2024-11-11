# Primary key

The [primary key](./../glossary.md#primary-key) is defined in the constraints object of table definition using the [`primaryKey`](./../../../reference/api/schema/functions/primaryKey.md) function.

## Single column

```ts
import { integer, primaryKey, table } from "@monolayer/pg/schema";

export const users = table({
  name: "users",
  columns: {
    id: integer().generatedAlwaysAsIdentity(), // [!code highlight]
  },
  constraints: {
    primaryKey: primaryKey(["id"]), // [!code highlight]
  },
});
```

## Multiple columns

```ts
import { integer, primaryKey, table } from "@monolayer/pg/schema";

export const books = table({
  columns: {
    id: integer().generatedAlwaysAsIdentity(), // [!code highlight]
    locationId: integer(), // [!code highlight]
  },
  constraints: {
    primaryKey: primaryKey(["id", "locationId"]), // [!code highlight]
  },
});
```
