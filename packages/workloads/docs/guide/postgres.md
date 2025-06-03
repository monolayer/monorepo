---
level: 4
---

# PostgresDatabase

Workload for PostgreSQL databases.

## Description

With this workload you define PostgreSQL databases.

A [`PostgresDatabase`](./../reference/api/main/classes/PostgresDatabase.md) workload is initialized with a valid database name.

See [examples](#examples).

Each workload has an environment variable name associated with it to hold the connection
string for the database named after the workloads' [`databaseName`](./../reference/api/main/classes/PostgresDatabase.md#properties). For example:

- database name `products`: `ML_PG_PRODUCTS_DATABASE_URL`.

## Client

You can use **any** PostgreSQL database client with the workload.

See [examples](#examples).

## Server

By default, each `PostgresDatabase` is associated to a different database server.

## Development environment

A docker container for the dev environment is launched with [`npx workloads start dev`](./../reference/cli/start-dev.md)

You can stop it with [`npx workloads stop dev`](./../reference/cli/stop-dev.md).

After the container is started:

- The environment variable with the connection string for the workload's Docker container
will be written to `.env.local`.
- The database will be created in the database server if it does not exist.

:::info
Check your framework documentation to see it the `.env.local` file is loaded automatically.
:::

## Test environment

A docker container for the test environment is launched with [`npx workloads start test`](./../reference/cli/start-test.md)

You can stop it with [`npx workloads stop test`](./../reference/cli/stop-test.md).

- The environment variable with the connection string for the workload's Docker container
will be written to `.env.test.local`.
- The database will be created in the database server if it does not exist.

:::info
Check your framework documentation to see it the `.env.test.local` file is loaded automatically.
:::

## Production environments

The workload assumes that a PostgreSQL server will be avaliable.

At deployment time, make sure to configure the environment variable name for the workload
with the connection string for the PostgreSQL database.

## Build output

The build output for the workload is located in the `postgresDatabase` of the `manifest.json`
and it includes:

- The database name.
- The environment variable name.

```json
{
  "version": "2",
  "postgresDatabase": [
    {
      "name": "products",
      "connectionStringEnvVar": "ML_PG_PRODUCTS_DATABASE_URL"
    }
  ],
  // ...
}
```

## Examples

### Workloads in the same database server

```ts
import { PostgreSQL } from "@monolayer/workloads";
import pg from "pg";

export const producsDbMain = new PostgresDatabase("products");

const client = new pg.Pool({
  // Assumes the environment variable is set
  connectionString: process.env[productsDb.connectionStringEnvVar],
});

client.query("SELECT 1");
```
