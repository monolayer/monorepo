# Installation

::: info PREREQUISITES
- [Node.js](https://nodejs.org) 18.18 or later.
- A [PostgreSQL](https://postgresql.org) database server running.
:::

## Create a TypeScript project

::: info
You can [skip](#add-monolayer-to-your-typescript-project) this step if you already have an existing Typescript project to work with.
:::

Create a project directory and navigate into it:

```bash
mkdir hello-monolayer
cd hello-monolayer
```

Then, initialize a TypeScript project:

```bash
npm init -y
npm install typescript
npx tsc --init
```

This will create a `package.json` with an initial setup for your TypeScript app and a `tsconfig.json` with a Typescript configuration.

## Add monolayer to your Typescript project

Run the installer with the following command and follow the prompts:

```bash
npx create-monolayer
```

You will be greeted to enter the relative path to create the `db` folder:

<<< @/snippets/create-monolayer.txt

## File Structure

The installer should have installed all necesary dependencies and added the following files to your project directory:

```text
🗂️ hello-monolayer
└ 📁 app (chosen directory)
  └ 📁 db
    ├ 📄 client.ts
    ├ 📄 databases.ts
    ├ 📄 schema.ts
    ├ 📄 seeds.ts
├ 📄 .env
└ 📄 monolayer.ts
```

::: details Generated code &nbsp; 🔎
::: code-group

```ts [monolayer.ts]
import { defineConfig } from "monolayer/config";

export default defineConfig({
  databases: "app/db/databases.ts",
});
```

```ts [databases.ts]
import { defineDatabase } from "monolayer/pg";
import { dbSchema } from "./schema";
import { dbSchema } from "./seeds";

export default defineDatabase({
  id: "default",
  schemas: [dbSchema],
  extensions: [],
  camelCase: false,
  seeder: dbSeed,
});
```

```ts [schema.ts]
import { schema } from "monolayer/pg";

export const dbSchema = schema({});

export type DB = typeof dbSchema.infer;
```

```ts [client.ts]
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import defaultDb from "./databases";
import { type DB } from "./schema";

export const defaultDbClient = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: defaultDb.connectionString}),
  }),
  plugins: defaultDb.camelCase? [new CamelCasePlugin()] : [],
});
```

```ts [seed.ts]
import { sql, type Kysely } from "kysely";
import type { DB } from "./schema";

export async function dbSeed(db: Kysely<DB>) {
  const currentDatabase = await sql<{
    current_database: string;
  }>`SELECT CURRENT_DATABASE()`.execute(db);

  console.log("Current database:", currentDatabase.rows[0].current_database);
}
```

```text [.env]

# Inserted by \`create-monolayer\`
# MONO_PG_DEFAULT_DATABASE_URL=postgresql://user:password@dbserver:5432/dbName
```
:::

## Configure your environment

Now, open the `.env` file in the root of the project directory and uncomment the line with `MONO_PG_DEFAULT_DATABASE_URL`, and replace its value with your database connection URL.