# MongoDatabase

Workload for PostgreSQL databases.

## Description

With this workload you define MongoDB databases.

A [`MongoDatabase`](./../reference/api/main/classes/MongoDatabase.md) workload is initialized with a valid database name and the following options:

- A [client constructor function](./../reference/api/main/interfaces/DatabaseOptions.md#properties) providing the client of your choice.
- An optional [serverId](./../reference/api/main/interfaces/DatabaseOptions.md#properties) to reference the database server where the database is located.

See [examples](#examples).

Each workload has an environment variable name associated with it to hold the connection
string for the database named after the workloads' [`databaseName`](./../reference/api/main/classes/MongoDatabase.md#properties) and [`databaseId`](./../reference/api/main/classes/MongoDatabase.md#databaseid). For example:

- database name `products`: `MONO_MONGODB_PRODUCTS_DATABASE_URL`.
- database name `products` and server ID `main`: `MONO_MONGODB_MAIN_PRODUCTS_DATABASE_URL`.

## Client

You can use **any** MongoDB database client with the workload.

The database client is defined by passing a constructor function when initializing the workload.

You access the client with the [client](./../reference/api/main/classes/MongoDatabase.md#client) accessor. This accessor will call this client constructor function with the workload's environment variable name and memoize its result.

See [examples](#examples).

## Server

By default, each `MongoDatabase` is associated to a different database server.

To associate multiple workloads to the same database server, pass in a stable `serverId`to the [constructor options](./../reference/api/main/classes/MongoDatabase.md#constructors).

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

The workload assumes that a MongoDB server will be avaliable.

At deployment time, make sure to configure the environment variable name for the workload
with the connection string for the PostgreSQL database.

## Build output

The build output for the workload is located in the `mongoDb` of the `manifest.json`
and it includes:

- The database name.
- The server ID.
- The environment variable name.

:::code-group

```json[Workload without a serverId]
{
  "version": "1",
  "mongoDb": [
    {
      "name": "products",
      "serverId": "products",
      "connectionStringEnvVar": "MONO_MONGODB_PRODUCTS_DATABASE_URL"
    }
  ],
  // ...
}
```

```json[Multiple workloads with the same serverId]
{
  "version": "1",
  "mongoDb": [
    {
      "name": "products",
      "serverId": "main",
      "connectionStringEnvVar": "MONO_MONGODB_MAIN_PRODUCTS_DATABASE_URL"
    },
    {
      "name": "documents",
      "serverId": "main",
      "connectionStringEnvVar": "MONO_MONGODB_MAIN_DOCUMENTS_DATABASE_URL"
    }
  ],
  // ...
}
```

:::

## Examples

### Workloads on different database servers

```ts
import { MongoDatabase } from "@monolayer/workloads";
import { MongoClient } from "mongodb";

// Workloads on different database servers
const producsDb = new MongoDatabase("products", {
 // envVarName -> MONO_MONGODB_PRODUCTS_DATABASE_URL
 client: (envVarName) =>
   new MongoClient(process.env[envVarName]),
});

const analyticsDb = new MongoDatabase("analytics", {
 // envVarName -> MONO_MONGODB_ANALYTICS_DATABASE_URL
 client: (envVarName) =>
   new MongoClient(process.env[envVarName]),
});
```

### Workloads on the same database servers

```ts
const producsDbMain = new MongoDatabase("products", {
 serverId: "main",
 // envVarName -> MONO_MONGODB_MAIL_PRODUCTS_DATABASE_URL
 client: (envVarName) =>
   new MongoClient(process.env[envVarName]),
});

const analyticsDbMain = new MongoDatabase("analytics", {
 serverId: "main",
 // envVarName -> MONO_MONGODB_MAIL_ANALYTICS_DATABASE_URL
 client: (envVarName) =>
   new MongoClient(process.env[envVarName]),
);
```
