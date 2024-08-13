---
sidebar_position: 1
---

# Introduction

Monolayer is a tool that facilitates database schema management and migrations in a TypeScript environment.

## Installation

Open a terminal window into your project root folder and run the following command:

```bash
npx create-monolayer
```

The installer will prompt you to:

&nbsp;&nbsp;1️⃣ Select the package manager you are using (`npm`, `pnpm`, `yarn`, or `bun`).

&nbsp;&nbsp;2️⃣ Enter the desired location for your `db` folder.

After the installation is complete, you will have the necessary files and structure in place to start using `monolayer`. Assuming you have chosen `app/db` as your `db` folder directory structure, these are the created files and folders in your project:

```plaintext
🗂️ <project-root>
├ monolayer.ts
└ 📁 app
  └ 📁 db
    ├ 📄 configuration.ts
    ├ 📄 db-client.ts
    ├ 📄 extensions.ts
    ├ 📄 schema.ts
    ├ 📄 seed.ts
    └ 📁 migrations
      └ 📄 .gitkeep
```

## Configuration

The `configuration.ts` file is the entry point for your database configuration.

Enter your database credentials for the development configuration in the `connections` property.

This object accepts the same properties as the
[Client Config](https://node-postgres.com/apis/client#new-client) and
[Pool Config](https://node-postgres.com/apis/pool#new-pool) objects
from the [`node-postgres`](https://node-postgres.com) library.

<Tabs>
  <TabItem value="extensions.ts" label="Database credentials" default>
```ts title="extensions.ts"
import { type Configuration } from "monolayer/config";
import { dbSchema, } from "./schema.ts";
import { dbExtensions } from "./extensions.ts";

export default {
  schemas: [dbSchema],
  extensions: dbExtensions,
  connections: {
    // highlight-start
    development: {
      database: "example_development",
      user: "your-username",
      password: "your-password",
      host: "your-host",
      port: portNumber,
    },
    // highlight-end
    production: {
      connectionString: process.env.NODE_ENV,
    }
  },
} satisfies Configuration;
```
  </TabItem>
  <TabItem value="configuration.ts" label="Connection String" default>
```ts title="configuration.ts"
import { type Configuration } from "monolayer/config";
import { dbSchema, } from "./schema.ts";
import { dbExtensions } from "./extensions.ts";

export default {
  schemas: [dbSchema],
  extensions: dbExtensions,
  connections: {
    // highlight-start
    development: {
      connectionString: "postgresql://your-username:your-password@your-host:portNumber/example_development",
    },
    // highlight-end
    production: {
      connectionString: process.env.NODE_ENV,
    }
  },
} satisfies Configuration;
```
  </TabItem>
</Tabs>

## Create database

:::note
If your database is already created, you can skip this step.
:::

In your terminal run the following command to create your database in the server:

```bash
npx monolayer db:create
```

## Creating your first schema

Let's build a simple schema with a single table called `notes`.

Change your `schema.ts` file with the following code:

```ts title="schema.ts"
import { index, integer, numeric, primaryKey, schema, text } from "monolayer/pg";

const notes = table({
  columns: {
    id: integer().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    content: text().notNull(),
  },
  constraints: {
    primaryKey: primaryKey(["id"]),
  },
  indexes: [
    index(["name"]),
  ]
});

export const dbSchema = schema({
  tables: {
    notes,
  },
});

export type DB = typeof dbSchema.infer;
```

In this schema, we have defined a table called `countries` with the following columns:
- `id` as an integer, always generated identity column (auto-incremented column).
- `name` as a non-nullable text field.
- `content` as a non-nullable text field.

Also we have defined a primary key constraint on the `id` column and an index on the `name` column.

## Syncing your schema

To sync your schema to the database, run the following command in your terminal (you will
be  prompted to give a name to the migration):

```bash
npx monolayer sync
```

After running this command, your database will have a new table called `notes`
and a new migration file in the `migrations` folder in your `db` folder.

## Querying the database

To query the database, you can use the exported client, `db`, in the `db-client.ts` file.

The client is a `Kysely` instance with the database types inferred from your schema.

```ts title="example query"
import { db } from "./db-client.ts";

const allNotes = await db
  .selectFrom("notes")
  .selectAll()
  .execute();
```

## Seed data

At this point, the `countries` table contains no records.

`monolayer` provides a way to seed your database with data using the `seed.ts` file.

Open it and add the following code:

```ts title="seed.ts"
import type { Kysely } from "kysely";
import type { DB } from "./schema";

export async function seed(db: Kysely<DB>){
  // highlight-start
  const notes = [
    { name: "Note 1", content: "Content of note 1" },
    { name: "Note 2", content: "Content of note 2" },
    { name: "Note 3", content: "Content of note 3" },
  ];
  await db.insertInto("notes").values(notes).execute();
  // highlight-end
}
```

In your terminal run this command to seed your database:

```bash
npx monolayer seed
```

Now your `notes` table will have three records.

