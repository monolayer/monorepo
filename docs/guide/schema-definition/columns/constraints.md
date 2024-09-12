# Column constraints

## Not-null constraints

A not-null constraint simply specifies that a column must not assume the `NULL` value.

You can define a not-null constraint to a column with the `notNull` column modifier:

```ts
import { table, text } from "@monolayer/pg/schema";

const users = table({
  columns: {
    name: text().notNull(), //  [!code highlight]
  },
});
```

## Other contraints

Other column constraints are defined at the table level. Read more in:
- [Primary key](./../constraints/primary-key.md)
- [Foreign key](./../constraints/foreign-key.md)
- [Unique constraint](./../constraints/unique.md)
- [Check constraint](./../constraints/check.md)
