# Column constraints

## Not-null constraints

A not-null constraint simply specifies that a column must not assume the `NULL` value.

You can define a not-null constraint to a column with the `notNull` column modifier:

```ts
import { table, text } from "monolayer/pg";

const users = table({
  columns: {
    name: text().notNull(), //  [!code highlight]
  },
});
```
