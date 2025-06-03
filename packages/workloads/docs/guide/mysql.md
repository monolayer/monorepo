# MySqlDatabase

Workload for PostgreSQL databases.

## Description

With this workload you define MySQL databases.

A [`MySqlDatabase`](./../reference/api/main/classes/MySqlDatabase.md) workload is initialized with a valid database name.

See [examples](#examples).

Each workload has an environment variable name associated with it to hold the connection
string for the database named after the workloads' [`databaseName`](./../reference/api/main/classes/MySqlDatabase.md#properties). For example:

- database name `products`: `MONO_MYSQL_PRODUCTS_DATABASE_URL`.

## Client

You can use **any** MySQL database client with the workload.

See [examples](#examples).

## Server

By default, each `MySqlDatabase` is associated to a different database server.

To associate multiple workloads to the same database server, pass in a stable `serverId`to the [constructor options](./../reference/api/main/classes/MySqlDatabase.md#constructors).

## Development environment

A docker container for the dev environment is launched with [`npx workloads start dev`](./../reference/cli/start-dev.md)

You can stop it with [`npx workloads stop dev`](./../reference/cli/stop-dev.md).

After the container is started:

- The environment variable with the connection string for the workload's Docker container
will be written to `.env.local`.
- The database will be created in the database server if it does not exist.

:::info
Check your framework documentation to see it the `.env` file is loaded automatically.
:::

## Test environment

A docker container for the test environment is launched with [`npx workloads start test`](./../reference/cli/start-test.md)

You can stop it with [`npx workloads stop test`](./../reference/cli/stop-test.md).

- The environment variable with the connection string for the workload's Docker container
will be written to `.env.test.local`.
- The database will be created in the database server if it does not exist.

:::info
Check your framework documentation to see it the `.env.test` file is loaded automatically.
:::

## Production environments

The workload assumes that a MySQL server will be avaliable.

At deployment time, make sure to configure the environment variable name for the workload
with the connection string for the MySQL database.

## Build output

The build output for the workload is located in the `mysqlDatabase` of the `manifest.json`
and it includes:

- The database name.
- The environment variable name.

```json
{
  "version": "1",
  "mysqlDatabase": [
    {
      "name": "products",
      "connectionStringEnvVar": "MONO_MYSQL_PRODUCTS_DATABASE_URL"
    }
  ],
  // ...
}
```

## Examples

### Workloads on the same database server

```ts
import { MySqlDatabase } from "@monolayer/workloads";
import mysql from 'mysql2/promise';

// Workloads on different database servers

export const productsDb = new MySqlDatabase("products");

export const dbClient = async () => {
  // Assumes the environment variable is set
  return await mysql.createConnection(process.env[productsDb.connectionStringEnvVar]!)
}

dbClient().then((client) => {
  client.query("SELECT 2");
  client.query("SELECT 1");
})
```
