# Not-null Constraints

A not-null constraint simply specifies that a column must not assume the `NULL` value.

You can define a not-null constraint with the `notNull` column modifier:

```ts
import { table, text } from "@monolayer/pg/schema";

export const users = table({
  columns: {
    name: text().notNull(), // [!code highlight]
  },
});
```
