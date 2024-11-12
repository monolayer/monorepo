# Using multiple databases

You can easily use multiple databases with `monolayer-pg`.

## Defining multiple databases

To define multiple databases, you export more than one database definition from the databases file.

::: code-group

```ts [databases.ts]
import { defineDatabase } from "@monolayer/pg/schema";

export default defineDatabase({
  // Database configuration options
});

export const stats = defineDatabase({
  id: "stats",
  // Other database configuration options
});
```

:::

::: warning
When you define multiple databases, make sure each database definition has a [unique identifier](./../schema-definition/databases.md#database-identifiers).
Otherwise, you will have multiple databases with the same `default` identifier.
:::

You can also re-export databases from other files.

::: code-group

```ts [databases.ts]
import { defineDatabase } from "@monolayer/pg/schema";
export { statsDb } from "./stats";

export default defineDatabase({
  // Database configuration options
});
```

```ts [stats.ts]
import { defineDatabase } from "@monolayer/pg/schema";
import { statsSchema } from "./stats-schema";

export const stats = defineDatabase({
  id: "stats",
  schemas: [statsSchema],
  // Other database configuration options
});
```

:::

## Database connection URL

`monolyer-pg` will be able to connect to the database by fetching the database connection URL from an environment variable in the format: `MONO_PG_${DATABASE_ID_TO_SNAKE_CASE_AND_UPPER_CASE}_DATABASE_URL`.

::: info EXAMPLE
For a database with the unique identifier `user_stats`, the expected environment variable containing the database connection URL is: **`MONO_PG_USER_STATS_DATABASE_URL`**.
:::

::: tip
`monolayer-pg` will also try to fetch environment variable from the `.env` file in your project root, if present.
:::

## CLI

In the CLI, you can target databases by their identifier with the `-d` or `--database-id` option:

```bash
# pushing changes to the database with id stats
npx monolayer-pg push dev --database-id stats
```
