---
sidebar_position: 2
---

# Primary keys

A primary key constraint defines a column or a group of columns, that can be used as a unique identifier for rows in the table.

Is a special case of a unique contraint that also guarantees that all of the attributes within the primary key do not have null values.

At most one primary key can be defined per table.

A primary key is defined in the constraints object on a table definition
by using the `primaryKey` function:

### Primary key on a single column

```ts
import { integer, primaryKey, table } from "monolayer/pg";

export const users = table({
  name: "users",
  columns: {
    id: integer().generatedAlwaysAsIdentity(),
  },
  constraints: {
    primaryKey: primaryKey(["id"]), // [!code highlight]
  },
});
```

### Primary key on mutipliple columns

To reference multiple colums, just pass additional columns names to `primaryKey` function:

```ts
import { integer, primaryKey, table } from "monolayer/pg";

export const books = table({
  columns: {
    id: integer().generatedAlwaysAsIdentity(),
    locationId: integer(),
  },
  constraints: {
    primaryKey: primaryKey(["id", "locationId"]), // [!code highlight]
  },
});
```
