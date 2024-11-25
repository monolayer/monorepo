# MySqlDatabase

Workload for PostgreSQL databases.

## Description

With this workload you define MySQL databases.

A [`MySqlDatabase`](./../reference/api/main/classes/MySqlDatabase.md) workload is initialized with a valid database name and the following options:

- A [client constructor function](./../reference/api/main/interfaces/DatabaseOptions.md#properties) providing the client of your choice.
- An optional [serverId](./../reference/api/main/interfaces/DatabaseOptions.md#properties) to reference the database server where the database is located.

See [examples](#examples).

Each workload has an environment variable name associated with it to hold the connection
string for the database named after the workloads' [`databaseName`](./../reference/api/main/classes/MySqlDatabase.md#properties) and [`databaseId`](./../reference/api/main/classes/MySqlDatabase.md#databaseid). For example:

- database name `products`: `MONO_MYSQL_PRODUCTS_DATABASE_URL`.
- database name `products` and server ID `main`: `MONO_MYSQL_MAIN_PRODUCTS_DATABASE_URL`.

## Client

You can use **any** MySQL database client with the workload.

The database client is defined by passing a constructor function when initializing the workload.

You access the client with the [client](./../reference/api/main/classes/MySqlDatabase.md#client) accessor. This accessor will call this client constructor function with the workload's environment variable name and memoize its result.

See [examples](#examples).

## Server

By default, each `MySqlDatabase` is associated to a different database server.

To associate multiple workloads to the same database server, pass in a stable `serverId`to the [constructor options](./../reference/api/main/classes/MySqlDatabase.md#constructors).

## Development environment

A docker container for the dev environment is launched with [`npx workloads start dev`](./../reference/cli/start-dev.md)

You can stop it with [`npx workloads stop dev`](./../reference/cli/stop-dev.md).

After the container is started:

- The environment variable with the connection string for the workload's Docker container
will be written to `.env`.
- The database will be created in the database server if it does not exist.

:::info
Check your framework documentation to see it the `.env` file is loaded automatically.
:::

## Test environment

A docker container for the test environment is launched with [`npx workloads start test`](./../reference/cli/start-test.md)

You can stop it with [`npx workloads stop test`](./../reference/cli/stop-test.md).

- The environment variable with the connection string for the workload's Docker container
will be written to `.env.test`.
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
- The server ID.
- The environment variable name.

:::code-group

```json[Workload without a serverId]
{
  "version": "1",
  "mysqlDatabase": [
    {
      "name": "products",
      "serverId": "products",
      "connectionStringEnvVar": "MONO_MYSQL_PRODUCTS_DATABASE_URL"
    }
  ],
  // ...
}
```

```json[Multiple workloads with the same serverId]
{
  "version": "1",
  "mysqlDatabase": [
    {
      "name": "products",
      "serverId": "main",
      "connectionStringEnvVar": "MONO_MYSQL_MAIN_PRODUCTS_DATABASE_URL"
    },
    {
      "name": "documents",
      "serverId": "main",
      "connectionStringEnvVar": "MONO_MYSQL_MAIN_DOCUMENTS_DATABASE_URL"
    }
  ],
  // ...
}
```

:::

## Examples

### Workloads on different database servers

```ts
import { MySqlDatabase } from "@monolayer/workloads";
import mysql from 'mysql2/promise';

// Workloads on different database servers

export const productsDb = new MySqlDatabase(
  "products",
  {
    // envVarName -> MONO_MYSQL_PRODUCTS_DATABASE_URL
    client: async (envVarName) =>
      await mysql.createConnection(process.env[envVarName]!)
    ),
  }
);

export const analyticsDb = new MySqlDatabase(
  "analytics",
  {
    // envVarName -> MONO_MYSQL_ANALYTICS_DATABASE_URL
    client: async (envVarName) =>
      await mysql.createConnection(process.env[envVarName]!)
    ),
  }
);
```

### Workloads on the same database server

```ts
import { MySqlDatabase } from "@monolayer/workloads";
import mysql from 'mysql2/promise';

export const productsDbMain = new MySqlDatabase(
  "products",
  {
    serverId: "main",
    // envVarName -> MONO_MYSQL_MAIN_PRODUCTS_DATABASE_URL
    client: async (envVarName) =>
      await mysql.createConnection(process.env[envVarName]!)
    ),
  }
);

export const analyticsDbMain = new MySqlDatabase(
  "analytics",
  {
    serverId: "main",
    // envVarName -> MONO_MYSQL_MAIN_ANALYTICS_DATABASE_URL
    client: async (envVarName) =>
      await mysql.createConnection(process.env[envVarName]!)
    ),
  }

// client calls the client constructor
analyticsDbMain.client.query("SELECT 1")
// Successive calls to client will get the same client
analyticsDbMain.client.query("SELECT 2")
```
