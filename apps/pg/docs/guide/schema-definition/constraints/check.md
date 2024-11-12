# Check constraints

[Check constraints](./../glossary.md#check-constraint) are defined in the constraints object of table definition using the [`check`](./../../../reference/api/schema/functions/check.md) function.

```ts
import { integer, table, check } from "@monolayer/pg/schema";
import { sql } from "kysely";

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
import { integer, table, check } from "@monolayer/pg/schema";
import { sql } from "kysely";

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

::: danger
It's recommended to reference column names with the `sql.ref` function. This function takes care of:

- Double quote the column name (PostgreSQL lower cases all names unless they are "double quoted" ).
- Transform to the column name to `snake_case` when the `camelCase` option is active.
:::
