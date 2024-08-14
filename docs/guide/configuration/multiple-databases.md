---
sidebar_position: 3
---

# Multiple databases

You can easily use multiple databases with `monolayer`.

### 1. Declare the schema

You can declare the schema for the additional database anywhere you like in your project.
A good place to start is to put it a new file in your designated `db` folder, colocated with the default schema.

Just as in the default schema, we will export the schema and the database types.

```ts title="stats-schema.ts"
import { integer, primaryKey, schema, table } from "monolayer/pg";

const visitors = table({
  columns: {
    id: integer().generatedAlwaysAsIdentity(),
    count: integer(),
  },
  constraints: {
    primaryKey: primaryKey(["id"])
  },
})

export const statsSchema = schema({
  tables: {
    visitors,
  },
});

export type StatsDB = typeof statsSchema.infer;
```

### 2. Add a configuration for the database

In addition to the default configuration, export a new configuration for the additional database in
your `configuration.ts` file associating it with the new schema and database credentials.

```ts title="configuration.ts"
import { type Configuration } from "monolayer/config";
import { dbSchema } from "./schema";
import { dbExtensions } from "./extensions";
// highlight-next-line
import { statsSchema } from "./stats-schema";

export default {
  ...
} satisfies Configuration;

export const stats = { // [!code highlight]
  schemas: [statsSchema], // [!code highlight]
  extensions: [], // [!code highlight]
  connections: { // [!code highlight]
    development: { // [!code highlight]
      // database credentials // [!code highlight]
    }, // [!code highlight]
    production: { // [!code highlight]
      // database credentials // [!code highlight]
    }, // [!code highlight]
  }, // [!code highlight]
} satisfies Configuration; // [!code highlight]
```

### 3. Set up the database client

Export a new client for the database in the `db-client.ts` (recommended but you can put it anywhere you like).

```ts title="db-client.ts.ts"
import { Kysely } from "kysely";
import { kyselyConfig } from "monolayer/config";
// highlight-next-line
import configuration, { stats } from "./configuration";
import { type DB } from "./schema";
// highlight-next-line
import { type StatsDB } from "./statsSchema";

export const db = new Kysely<DB>(
  kyselyConfig(configuration, process.env.NODE_ENV || "development")
);

// highlight-start
export const statsDb = new Kysely<StatsDB>(
  kyselyConfig(stats, process.env.NODE_ENV || "development")
);
// highlight-end
```

### 4. Running CLI commands

Except `scaffold`, you can target configuration in all monolayer CLI commands using the configuration option (short name `c`, long name `--configuration`)

In the following example, we are running the `sync` command targeting the `stats` configuration.

```bash
npx monolayer sync --configuration stats
```
