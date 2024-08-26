# Check constraints

[Check constraints](./../glossary.md#check-constraint) are defined in the constraints object of table definition using the [`check`](./../../../reference/api/pg/functions/check.md) function.

```ts
import { integer, table, check } from "monolayer/pg";

export const books = table({
  columns: {
    id: integer(),
    price: integer(),
  },
  constraints: {
    check: check(sql`${sql.ref("price")} > 0`), // [!code highlight]
  },
});
```

A check constraint can refer also to multiple columns:

```ts
import { integer, table, check } from "monolayer/pg";

export const books = table({
  columns: {
    id: integer(),
    price: integer(),
    discount: integer(),
  },
  constraints: {
    check: check(  // [!code highlight]
      sql`${sql.ref("price")} > 0 AND ${sql.ref("discount")} >= 10`  // [!code highlight]
    ), // [!code highlight]
  },
});
```
