---
prev: false
---

# Databases

`monolayer` will be aware of all your [databases](./../glossary.md#database) through exported database defintions from a single databases file.

You can think of the databases file as the entrypoint for all the databases and schemas you want to manage with `monolayer`.

As a starting point, you are given a default folder/file structure for the `db` folder and a `databases.ts` file it.

```text
🗂️ <project-root>
└ 📁 <chosen-db-location>
  └ 📁 db
    ├ 📄 client.ts
    ├ 📄 databases.ts
    ├ 📄 schema.ts
    ├ 📄 seeds.ts
```

However, you can move and rename files as you see fit and modularize your code to your own conventions.

::: warning
Don't forget to update the configuration in `monolayer.config.ts`, when the change your databases file name or its location.
:::

## Define a single database

After importing [`defineDatabase`](./../../reference/api//pg/functions/defineDatabase.md) from `monolayer/pg`, you export a default database definition.

::: code-group
```ts [databases.ts]
import { defineDatabase } from "monolayer/pg";
import { dbSchema } from "./schema";

export default defineDatabase({
  schemas: [dbSchema], // Schemas in the database
  // Other configuration options
});
```
:::

See the list of config options in the [PgDatabaseConfig Reference](./../../reference/api/pg/type-aliases/PgDatabaseConfig.md).

## Define multiple databases

To define multiple databases, you export more than one database definition from the databases file.

::: code-group
```ts [databases.ts]
import { defineDatabase } from "monolayer/pg";

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
When you define multiple databases, make sure each database definition has a [unique identifier](#database-identifiers).
Otherwise, you will have multiple databases with the same `default` identifier.
:::

You can also re-export databases from other files.

::: code-group

```ts [databases.ts]
import { defineDatabase } from "monolayer/pg";
export { statsDb } from "./stats";

export default defineDatabase({
  // Database configuration options
});
```

```ts [stats.ts]
import { defineDatabase } from "monolayer/pg";
import { statsSchema } from "./stats-schema";

export const stats = defineDatabase({
  id: "stats",
  schemas: [statsSchema],
  // Other database configuration options
});
```
:::

## Database identifiers

Each database has a configurable unique identifier (`id`), and the default `id` is `default`.

The unique identifier is used internally by `monolayer` to resolve:
1) The current database context when running CLI commands.
2) The environment variable name that will contain the database connection URL.

## Database connection URL

Based on the defined database `id`, `monolayer` will be able to connect to the database by fetching the database connection URL from an environment variable in the format: `MONO_PG_${DATABASE_ID_TO_SNAKE_CASE_AND_UPPER_CASE}_DATABASE_URL`.

::: info EXAMPLE
For a database with the unique identifier `user_stats`, the expected environment variable containing the database connection URL is: **`MONO_PG_USER_STATS_DATABASE_URL`**.
:::

::: tip
`monolayer` will also try to fetch environment variable from the `.env` file in your project root.
:::

Read more about database connection URLs in the [PostgreSQL Documentation](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING-URIS)

