---
sidebar_position: 4
---

# Unique constraints

Unique constraints ensure that the data contained in a column, or a group of columns,
is unique among all the rows in the table.

You can define a unique constraint with the `unique` function.

### Unique constraint on a single column

```ts
import { table, text, unique } from "monolayer/pg";

export const users = table({
  columns: {
    name: text(),
    email: text(),
  },
  // highlight-start
  constraints: {
    unique: unique(["name"]),
  },
  // highlight-end
});
```

### Unique constraint on multiple columns

```ts
import { table, text, unique } from "monolayer/pg";

export const users = table({
  columns: {
    name: text(),
    email: text(),
  },
  // highlight-start
  constraints: {
    unique: unique(["name", "email"]),
  },
  // highlight-end
});
```

### Unique constraint with not null columns

Because null values are not considered equal to each other,
multiple duplicated rows with null values on the constrained column(s) are allowed to exist without violating the unique constraint.
If you want to prevent this, you can use the `nullsNotDistinct` consider null values a not distinct.

```ts
import { table, text, unique } from "monolayer/pg";

export const users = table({
  columns: {
    name: text(),
    email: text(),
  },
  // highlight-start
  constraints: {
    unique: unique(["name"]).nullsNotDistinct(),
  },
  // highlight-end
});
```
