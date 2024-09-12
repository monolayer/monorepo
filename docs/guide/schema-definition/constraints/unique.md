# Unique constraints

[Unique constraints](./../glossary.md#unique-constraint) are defined in the constraints object of table definition using the [`unique`](./../../../reference/api/pg/functions/unique.md) function.

## Single column

```ts
import { table, text, unique } from "@monolayer/pg/schema";

export const users = table({
  columns: {
    name: text(), // [!code highlight]
    email: text(),
  },
  constraints: {
    unique: unique(["name"]), // [!code highlight]
  },
});
```

## Multiple columns

```ts
import { table, text, unique } from "@monolayer/pg/schema";

export const users = table({
  columns: {
    name: text(), // [!code highlight]
    email: text(), // [!code highlight]
  },
  constraints: {
    unique: unique(["name", "email"]), // [!code highlight]
  },
});
```

## With `NULLS NOT DISTINCT`

Since `NULL` values are not considered equal to each other, multiple duplicated rows with `NULL` values on the constrained column(s) are allowed to exist without violating the unique constraint.

If you want to prevent this, you can use the `nullsNotDistinct` to consider null values `NOT DISTINCT`.

```ts
import { table, text, unique } from "@monolayer/pg/schema";

export const users = table({
  columns: {
    name: text(), // [!code highlight]
    email: text(),
  },
  constraints: {
    unique: unique(["name"]).nullsNotDistinct(), // [!code highlight]
  },
});
```
