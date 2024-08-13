---
sidebar_position: 3
---

# Organize tables into logical groups

By logically grouping related objects into schemas you can, for example, separating reporting,
user data, and administrative functions into different schemas to clarify the system architecture.

Let's walkthrough the implementation of this pattern with monolayer with an example.

### Scenario

Besides the default `public` schema, we want tables related with users and permissions
to have their own schema (namespace): `user` and `permission`.

### Declaring additional schemas

You can declare the a new schema anywhere you like in your project.
A good place to start is to put it in a new file in your designated `db` folder, colocated with the default schema.

You'll need to configure the schema with the name of your choice.

:::warning
Schame names must be unique across the database. In `monolayer`, the default name for a schema is `public`.
:::

Just as in the default schema, we will export the schema and the database types (either with `infer` or with `inferWithNamespace`)

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
  name: "stats",
  tables: {
    visitors,
  },
});

export type StatsDB = typeof statsSchema.infer;
```

### 2. Add the schema to the configuration

Add the new schema to the configuration in your `configuration.ts` file.

```ts title="configuration.ts"
import { type Configuration } from "monolayer/config";
import { dbSchema } from "./schema";
import { dbExtensions } from "./extensions";
// highlight-next-line
import { statsSchema } from "./stats-schema";

export default {
  schemas: [dbSchema, statsSchema],
  ...
} satisfies Configuration;
```

### Query access pattern

By separating the user and permission tables into their own schemas, queries with the `Kysely` client
would normally look like this:

```ts title="Example query to get users with admin permissions"
db.selectFrom('user.users')
  .innerJoin('permission.user_permissions', 'users.users.id', 'permissions.user_permissions.user_id')
  .where('permissions.user_permissions.role', '=', "admin")
  .selectAll()
  .execute();
```

References to tables writen with their *qualified name*: the schema name and table name separated by a dot.

to write type-safe queries in this manner we configure the database schema types for the `Kysely` client types to reflect the schema structure.

In this case, the inferred types for the user and permission schemas need to be generated
with `inferWithSchemaNamespace` as oppossed to `infer`.

Then, we configure the client types by intersecting the respective schema types.

```ts title="db-client.ts"
import { Kysely } from "kysely";
import { kyselyConfig } from "monolayer/config";
import configuration from "./configuration";
import { type DB } from "./schema";
import { type UsersDb } from "./users-schema";
import { type StatsDB } from "./stats-schema";

export const db = new Kysely<DB & UsersDB & StatsDB>(
  kyselyConfig(configuration, process.env.NODE_ENV || "development")
);
```

Here's an example query that uses these pattern:

```ts
// Getting all users with admin permissions
db.selectFrom('user.users')
  .innerJoin('permission.user_permissions', 'users.users.id', 'permissions.user_permissions.user_id')
  .where('permissions.user_permissions.role', '=', "admin")
  .selectAll()
  .execute();
```



Enhanced Maintainability: By logically grouping related objects into schemas,
database maintenance tasks such as backups, migrations, and updates can be more easily managed.
For instance, a schema dedicated to accounting functions can encapsulate all related tables,
views, and stored procedures.
Clearer Structure for Complex Systems: In complex systems, having a well-defined schema structure
helps new developers and DBAs understand the database layout. For example, separating reporting,
user data, and administrative functions into different schemas can clarify system architecture.
Performance Optimization: Although schemas themselves do not impact performance directly, the
organization they provide helps in implementing performance optimizations at a more granular
level (e.g., indexing strategies, partitioning).
