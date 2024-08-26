# CamelCase to snake_case

By default table and column names defined in your schema will keep the same name.

For example, with  this schema defintion:

```ts
import { table, text } from "monolayer/pg";

const usersTable = table({ // [!code highlight]
  columns: {
    firstName: text(), // [!code highlight]
  },
});

export const dbSchema = schema({
  tables: {
    usersTable,
  },
});
```

The table name in the database will be `usersTable`, and the column in the `usersTable` will be named `firstName`.

You can convert those names to snake_case at the database level by setting `camelCase` to `true` when defining the database:

:::code-group
```ts [databases.ts]
import { defineDatabase } from "monolayer/pg";
import { dbSchema } from "./schema";

export default defineDatabase({
  schemas: [dbSchema],
  camelCase: true, // [!code ++]
});
```
:::

::: warning
You should set the camelCase option before generating and applying migrations to the database.
Changing the option after having applied migrations will lead to a *broken* state.
:::

Generating and applying migrations, will convert table and column names to snake_case:
- The table name in the database will be `users_table`
- The column in the `users_table` will be named `first_name`.


