# Redis

Workload for Redis API compatible key-value stores.

## Description

With this workload you define Redis key-value stores.

A [`Redis`](./../reference/api/main/classes/Redis.md) workload is initialized with a stable ID.

See [examples](#examples).

Each workload has an environment variable name associated with it to hold the connection
string for the database named after the workloads' [`id`](./../reference/api/main/classes/Redis.md#properties). For example:

- id `documents`: `ML_REDIS_DOCUMENTS_URL`.

## Client

You can use **any** Redis client with the workload.

The client is defined by passing a constructor function when initializing the workload.

You access the client with the [client](./../reference/api/main/classes/Redis.md#client) accessor. This accessor will call this client constructor function with the workload's environment variable name and memoize its result.

See [examples](#examples).

## Development environment

A docker container for the dev environment is launched with [`npx workloads start dev`](./../reference/cli/start-dev.md)

You can stop it with [`npx workloads stop dev`](./../reference/cli/stop-dev.md).

After the container is started:

- The environment variable with the connection string for the workload's Docker container
will be written to `.env`.

:::info
Check your framework documentation to see it the `.env` file is loaded automatically.
:::

## Test environment

A docker container for the test environment is launched with [`npx workloads start test`](./../reference/cli/start-test.md)

You can stop it with [`npx workloads stop test`](./../reference/cli/stop-test.md).

- The environment variable with the connection string for the workload's Docker container
will be written to `.env.test`.

:::info
Check your framework documentation to see it the `.env.test` file is loaded automatically.
:::

## Production environments

The workload assumes that a server compatible with the Redis API will be avaliable.

At deployment time, make sure to configure the environment variable name for the workload
with the connection string for the Redis server.

## Build output

The build output for the workload is located in the `redis` of the `manifest.json`
and it includes:

- The ID.
- The environment variable name.

:::code-group

```json[Redis Workload]
{
  "version": "2",
  "redis": [
    {
      "id": "products",
      "connectionStringEnvVar": "ML_REDIS_PRODUCTS_DATABASE_URL"
    }
  ],
  // ...
}
```

:::

## Example

```ts
import { Redis } from "@monolayer/sdk";
import { Redis as IORedis } from "ioredis";

const cache = new Redis("cache", (envVarName) =>
  new IORedis(process.env[envVarName]!)
);
```
