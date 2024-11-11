<!-- markdownlint-disable MD033 -->
# Your first schema

By the end of this section we'll have defined and migrated a database where we can store users and users' posts.

## Defining the `users` table

Let's build a simple schema with a single table called `users`.

Change your `schema.ts` file with the following code:

::: code-group

```ts [schema.ts]
import {
  index, integer,
  primaryKey, schema, table, text, unique,
} from "@monolayer/pg/schema";

const users = table({
  columns: {
    id: integer().generatedAlwaysAsIdentity(),
    email: text().notNull(),
    name: text(),
  },
  constraints: {
    primaryKey: primaryKey(["id"]),
    unique: [unique(["email"])],
  },
  indexes: [index(["email"])],
});

export const dbSchema = schema({
  tables: {
    users,
  },
});

export type DB = typeof dbSchema.infer;
```

:::

::: tip
Schema definition in `monolayer-pg` is type-safe.

Change the `unique` constraint column to a non existing one and see what happens! :exploding_head:
:::

In this schema, we have defined a table called `users` with:

- An `id` column as an integer, always generated identity column (auto-incremented column).
- A `email` column as a non-nullable text.
- A `name` column as nullable text.
- A primary key constraint on the `id` column.
- A unique constraint on the `email` column.
- An index on the `email` column.

## Defining the `posts` table

Now, let's define a `posts` table where we'll store the user's posts.

Change your schema.ts file with the following code:

::: code-group

```ts [schema.ts]
import { sql } from "kysely";
import {
  index, integer,
  primaryKey, schema, table, text, unique,
  boolean, foreignKey, timestampWithTimeZone
} from "@monolayer/pg/schema";
import {
  updateTimestampOnRecordUpdate,
} from "@monolayer/pg/helpers/timestamps";

const users = table({
  columns: {
    id: integer().generatedAlwaysAsIdentity(),
    email: text().notNull(),
    name: text(),
  },
  constraints: {
    primaryKey: primaryKey(["id"]),
    unique: [unique(["email"])],
  },
  indexes: [index(["email"])],
});

const posts = table({
  columns: {
    id: integer().generatedAlwaysAsIdentity(),
    title: text().notNull(),
    content: text(),
    published: boolean().default(false),
    authorId: integer(),
    createdAt: timestampWithTimeZone().notNull().default(sql`now()`),
    updatedAt: timestampWithTimeZone().notNull().default(sql`now()`),
  },
  constraints: {
    primaryKey: primaryKey(["id"]),
    foreignKeys: [
      foreignKey(["authorId"], users, ["id"])
        .deleteRule("set null")
        .updateRule("cascade"),
     ],
  },
  indexes: [index(["authorId"])],
  triggers: [updateTimestampOnRecordUpdate("updatedAt")],
});

export const dbSchema = schema({
  tables: {
    users,
    posts,
  },
});

export type DB = typeof dbSchema.infer;
```

:::

The `posts` table what we added to the schema has:

- An `id` column as an integer, always generated identity column (auto-incremented column).
- An `title` column as a non-nullable text.
- An `content` column as a nullable text.
- An `published` column as an integer, always generated identity column (auto-incremented column).
- An `authorId` column as a nullable integer.
- An `createdAt` column as a timestamp with time zone, non-nullable, and with the current timestamp as default.
- An `updatedAt` column as a timestamp with time zone, non-nullable, and with the current timestamp as default.
- A primary key constraint on the `id` column.
- A foreign key constraint on `authorId` that references `users`.`id`. When deleting the referenced user, `authorId` will be set to `NULL`. Updating `users`.`id` will update `authorId`.
- An index on the `authorId` column.
- A trigger that will update the `updatedAt` column whenever a record is updated.

::: info
The trigger will enable us to use native `PostgreSQL` capabilities to update the `updatedAt` column, no ORM needed! :tada:.
:::

## Adding an extension to the database

In order for the trigger to work, we need to add the [`moddatetime`](https://www.postgresql.org/docs/current/contrib-spi.html#CONTRIB-SPI-MODDATETIME) extension to the database. Modify the database definition in `database.ts` with the following code:

::: code-group

```ts [databases.ts]
import { defineDatabase, extension } from "@monolayer/pg/schema";
import { dbSchema } from "./schema";
import { dbSeed } from "./seed";

export default defineDatabase({
  schemas: [dbSchema],
  extensions: [extension("moddatetime")],
  camelCase: false,
  seeder: dbSeed,
});
```

:::

We've added the `moddatetime` extension to our database definition.

## Create the database

::: info
You can [skip](#generate-migrations) this step if the database is already created
:::

Create the database with the `monolayer-pg` CLI:

:::code-group

```bash [command]
npx monolayer db create
```

```text [sample output]
┌  Create Database
│
◇  Create database hello-monolayer ✓
│
└  Done
```

:::

## Generate migrations

To update the database to reflect the schema that we have defined, we'll first generate migrations:

```bash [Command]
npx monolayer migrations generate
```

The command will prompt you to select a migration name

<<< @/snippets/migrations-generate.txt

This command will generate a migration file of your chosen name with the schema changes to apply in your project under the `monolayer-pg` directory.

```text [Generated files]
🗂️ hello-monolayer (project root)
└ 📁 monolayer
  └ 📁 migrations
    └ 📁 expand
      └ 📄 ${timestamp}-${migration-name}.ts
```

::: warning
The folder `monolayer-pg` **SHOULD BE** added to version control.
:::

## Apply migrations

Now we'll apply the migrations to the database:

```bash [Command]
npx monolayer migrations apply --phase all
```

The command should output something similar to the following:

```text
┌  Migrate all pending migrations (expand, alter, data, contract)
│
◆   APPLIED  ${migration-name}
│
◇  Dump database structure ✓
│
└  Done
```

After running the command, the current database structure will be also dumped to a file in `monolayer/dumps`

```text [Generated files]
// Generated migration file
🗂️ hello-monolayer (project root)
└ 📁 monolayer
  └ 📁 dumps
    └ 📄 structure.default.sql
```

<br>

You've defined a schema and applied it to a newly created the database! :tada:
