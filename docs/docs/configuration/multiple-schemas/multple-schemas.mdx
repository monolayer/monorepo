---
sidebar_position: 2
---

# Multiple schemas

Each PostgreSQL database contains one or more named schemas (a namespace for SQL objects)
which contain tables and other database object.

By default tables (and other objects) are in a database automatically put into a schema
named “public” but you can create additional schemas.

`monolayer` allows you to manage multiple schemas in a single database.

There are several reasons to use schemas:

- To allow many users to use one database without interfering with each other.
- To organize database objects into logical groups to make them more manageable.
- Third-party applications can be put into separate schemas so they do not collide with the names of other objects.

These reasons require different access patterns and need the schema and database client types to be configured
differently


### Organize tables into logical groups

### Allow many users to use the same database

(multitenant)

### Separate schemas to prevent name collisions

Depending on the access pattern to the new schema, you'll need to configure the types database client differently.
Generally there are common patterns:
-
**Option 1** You want to organize tables into logical groups to make them more manageable.

Besides the default `public` schema, we want tables related with users and permissions
to have their own schema (namespace): `user` and `permission`

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

### 1. Declare the schema

You can declare the a new schema anywhere you like in your project.
A good place to start is to put it in a new file in your designated `db` folder, colocated with the default schema.

You'll need to configure the schema with the name of your choice although it cannot clash
with any other schema defined in the database. (nameless schemas are by default assigned to `public`)

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

### 4. Setting the database schema types for the database client

Depending on the access pattern to the new schema, you'll need to configure the types database client differently.

**Option 1** You want to organize tables into logical groups to make them more manageable.

Besides the default `public` schema, we want tables related with users and permissions
to have their own schema (namespace): `user` and `permission`

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

**Option 2** To allow many users to use one database without interfering with each other. (multitenant)

Example: we want to to have a `users` schema for each tenant.

Each tenant will have a database schema with the same tables but with different data.

Creating multiple copies of the same schema
In this case, the inferred types for the user and permission schemas can generated with `infer`.

```ts title="db-client.ts"
Then, we configure the client types by intersecting the respective schema types.

```ts
// Example query
db.selectFrom('users')
  .selectAll()
  .limit(1)
  .execute();

db.selectFrom('stats.visitors')
  .selectAll()
  .limit(1)
  .execute();
```

- Separate tables in schemas so they do not collide with their names (access the same tables across schemas)
You have two choices for queries to default (public) schema and the new schema at the type level.

```ts
// Each tenant has a schema
db.withSchema(tenant)
  .selectFrom('user')
  .where("email", "=", "john@example.com")
  .selectAll()
```


Option A: You want you want to access the new schema tables under a "namespace"

```ts
// Example query
db.selectFrom('users').selectAll().limit(1).execute();
db.selectFrom('stats.visitors').selectAll().limit(1).execute();
```

Option B: You want  the same namespace for all tables in the database.

```ts
// Example query
db.withSchema("stats").selectFrom('stats.visitors').selectAll().limit(1).execute();
db.selectFrom('stats.visitors').selectAll().limit(1).execute();
```

For example all tables directly related to users could live under a user schema.and the new schema in the same client unde, you can add the new schema to the existing client.
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
