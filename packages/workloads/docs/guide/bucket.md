# Bucket

Workload for AWS S3 compatible storage.

## Description

With this workload you define AWS S3 compatible storages.

A [`Bucket`](./../reference/api/main/classes/Bucket.md) workload is initialized with a valid bucket name a [client constructor function](./../reference/api/main/interfaces/DatabaseOptions.md#properties) providing the client of your choice.

See [examples](#examples).

Each workload has the `MONO_AWS_ENDPOINT_URL` environment variable name associated with it to hold the endpoint url to connect to development and test environments.

## Client

You can use **any** AWS S3 compatible client with the workload, although the [AWS SDK for Javascript](https://aws.amazon.com/sdk-for-javascript/) is recommended.

The client is defined by passing a constructor function when initializing the workload.

You access the client with the [client](./../reference/api/main/classes/Bucket.md#client) accessor. This accessor will call this client constructor function with the workload's environment variable name and memoize its result.

See [examples](#examples).

## Development environment

A docker container for the dev environment is launched with [`npx workloads start dev`](./../reference/cli/start-dev.md)

You can stop it with [`npx workloads stop dev`](./../reference/cli/stop-dev.md).

After the container is started:

- The `MONO_AWS_ENDPOINT_URL` environment variable with the endpoint URL to the workload's Docker container
will be written to `.env`.
- The bucket will be created if it does not exist.

See [examples](#examples) on how to configure a client for development.

:::info
Check your framework documentation to see it the `.env` file is loaded automatically.
:::

## Test environment

A docker container for the test environment is launched with [`npx workloads start test`](./../reference/cli/start-test.md)

You can stop it with [`npx workloads stop test`](./../reference/cli/stop-test.md).

- The `MONO_AWS_ENDPOINT_URL` environment variable with the endpoint URL to the workload's Docker container
will be written to `.env`.
- The bucket will be created if it does not exist.

See [examples](#examples) on how to configure a client for test.

:::info
Check your framework documentation to see it the `.env.test` file is loaded automatically.
:::

## Production environments

The workload assumes that an AWS S3 compatible storage will be avaliable.

## Build output

The build output for the workload is located in the `bucket` of the `manifest.json`
and it includes:

- The bucket name.

:::code-group

```json[Bucket Workload]
{
  "version": "1",
  "bucket": [
    {
      "name": "images",
    }
  ],
  // ...
}
```

:::

## Examples

```ts
import { Bucket } from "@monolayer/workloads";
import { S3Client } from "@aws-sdk/client-s3";

const imagesBucket = new Bucket(
  "workloads-images",
  () =>
    new S3Client({
     // Configure forcePathStyle and endpoint
     // when the dev or test container is running
     ...(process.env.MONO_AWS_ENDPOINT_URL
       ? {
           forcePathStyle: true,
           endpoint: process.env.MONO_AWS_ENDPOINT_URL,
         }
       : {}),
     // Other configuration options
   }),
);
```
