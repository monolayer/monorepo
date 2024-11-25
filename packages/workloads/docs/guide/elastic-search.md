# ElasticSearch

Workload for ElasticSearch search engines.

## Description

With this workload you define ElasticSearch search engines.

A [`ElasticSearch`](./../reference/api/main/classes/ElasticSearch.md) workload is initialized with a stable ID and a [client constructor function](./../reference/api/main/interfaces/DatabaseOptions.md#properties) providing the client of your choice.

See [examples](#examples).

Each workload has an environment variable name associated with it to hold the connection
string for the database named after the workloads' [`id`](./../reference/api/main/classes/Redis.md#properties). For example:

- id `documents`: `MONO_ELASTICSEARCH_DOCUMENTS_URL`.

## Client

You can use **any** ElasticSearch client with the workload.

The client is defined by passing a constructor function when initializing the workload.

You access the client with the [client](./../reference/api/main/classes/ElasticSearch.md#client) accessor. This accessor will call this client constructor function with the workload's environment variable name and memoize its result.

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

The workload assumes that an ElasticSearch server will be avaliable.

At deployment time, make sure to configure the environment variable name for the workload
with the connection string for the ElasticSearch server.

## Build output

The build output for the workload is located in the `elasticSearch` of the `manifest.json`
and it includes:

- The ID.
- The environment variable name.

:::code-group

```json[ElasticSearch Workload]
{
  "version": "1",
  "elasticSearch": [
    {
      "id": "products",
      "connectionStringEnvVar": "MONO_ELASTICSEARC_PRODUCTS_DATABASE_URL"
    }
  ],
  // ...
}
```

:::

## Examples

```ts
import { ElasticSearch } from "@monolayer/workloads";
import { Client } from "@elastic/elasticsearch';

const elastic = new ElasticSearch("products", (envVarName) =>
  new Client({
    // envVarName = MONO_ELASTIC_SEARCH_PRODUCTS_URL
    node: process.env[envVarName],
  }),
);
```
