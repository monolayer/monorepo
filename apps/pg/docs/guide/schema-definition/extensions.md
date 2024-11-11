# Extensions

`monolayer-pg` manages [extensions](./glossary.md#extension) through the [`extensions`](./../../reference/api/schema/type-aliases/PgDatabaseConfig.md#extensions) property in your database definition.

You add an extension to your database by using the [`extension`](./../../reference/api/schema/functions/extension.md) function.

:::code-group

```ts [databases.ts]
import { defineDatabase, extension } from "@monolayer/pg/schema";
import { dbSchema } from "./schema";

export default defineDatabase({
  schemas: [dbSchema],
  extensions: [extension("moddatetime")], // [!code highlight]
});
```

:::

When `monolayer-pg` generates migrations, extensions will be added, kept, or removed according to what's defined in the `extensions` property and what the database currently has installed:

| Extension   | When                                                    |
| :---------: | :------------------------------------------------------ |
| **added**   | extension is in your definition but not in the database |
| **kept**    | extension is in your definition and in the database     |
| **removed** | extension is the database but not in your definition    |

::: warning
If you want to add extensions that are not part of the [default PostgreSQL installation](https://www.postgresql.org/docs/current/contrib.html), make sure they are installed in the PostgreSQL server before applying migrations.
:::

::: warning
Some extensions need a user with superuser privileges to load them into the database. You should check the extension documentation accordingly.
:::
