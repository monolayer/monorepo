# Column default values

Default columns values can be automatically assigned by the database to the column when a new row is inserted into the table, and no specific value is provided for that column.

You can define a default on a column with the `default` column modifier. The value can be a literal value or an expression.

```ts
import { sql } from "kysely";
import { boolean, table, timestampWithTimeZone } from "monolayer/pg";

const users = table({
  columns: {
    active: boolean().default(false), //  [!code highlight]
    createdAt: timestampWithTimeZone().default(sql`NOW()`), //  [!code highlight]
  },
});
```
