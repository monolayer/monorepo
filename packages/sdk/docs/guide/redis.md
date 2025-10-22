# Redis

Workload for Redis API compatible key-value stores.

## Description

With this workload, you can define Redis key-value stores.

A [`Redis`](./../reference/api/main/classes/Redis.md) workload is initialized with a stable ID.

See [examples](#examples).

Each workload has an environment variable name associated with it that holds the connection
string for the database. The variable is named after the workload's [`id`](./../reference/api/main/classes/Redis.md#properties). For example:

- id `documents`: `ML_REDIS_DOCUMENTS_URL`.

## Client

You can use **any** Redis client with the workload.

The client is defined by passing a constructor function when initializing the workload.

You access the client with the [client](./../reference/api/main/classes/Redis.md#client) accessor. This accessor will call this client constructor function with the workload's environment variable name and memoize its result.

See [examples](#examples).

## Development environment

A Docker container for the dev environment is launched with [`npx monolayer start dev`](./../reference/cli/start-dev.md)

You can stop it with [`npx monolayer stop dev`](./../reference/cli/stop-dev.md).

After the container is started:

- The environment variable with the connection string for the workload's Docker container
will be written to `.env.local`.

:::info
Check your framework's documentation to see if the `.env.local` file is loaded automatically.
:::

## Test environment

A Docker container for the test environment is launched with [`npx monolayer start test`](./../reference/cli/start-test.md)

You can stop it with [`npx monolayer stop test`](./../reference/cli/stop-test.md).

- The environment variable with the connection string for the workload's Docker container
will be written to `.env.test.local`.

:::info
Check your framework's documentation to see if the `.env.test.local` file is loaded automatically.
:::

## Example

```ts
import { Redis } from "@monolayer/sdk";
import { Redis as IORedis } from "ioredis";

const cache = new Redis("cache", (envVarName) =>
  new IORedis(process.env[envVarName]!)
);
```
