# Bucket

Workload for AWS S3 compatible storage.

## Description

With this workload, you can define AWS S3 compatible storage.

A [`Bucket`](./../reference/api/main/classes/Bucket.md) workload is initialized with a valid bucket name.

See [examples](#examples).

Each workload has the `ML_AWS_ENDPOINT_URL` environment variable associated with it to hold the endpoint URL for connecting to development and test environments.

## Client

You can use **any** AWS S3 compatible client with the workload, although the [AWS SDK for Javascript](https://aws.amazon.com/sdk-for-javascript/) is recommended.

The client is defined by passing a constructor function when initializing the workload.

You access the client with the [client](./../reference/api/main/classes/Bucket.md#client) accessor. This accessor will call this client constructor function with the workload's environment variable name and memoize its result.

See [examples](#examples).

## Development environment

A Docker container for the dev environment is launched with [`npx monolayer start dev`](./../reference/cli/start-dev.md)

You can stop it with [`npx monolayer stop dev`](./../reference/cli/stop-dev.md).

After the container is started:

- The `ML_AWS_ENDPOINT_URL` environment variable, containing the endpoint URL for the workload's Docker container
will be written to `.env`.
- The bucket will be created if it does not exist.

See [examples](#examples) on how to configure a client for development.

:::info
Check your framework's documentation to see if the `.env` file is loaded automatically.
:::

## Test environment

A Docker container for the test environment is launched with [`npx monolayer start test`](./../reference/cli/start-test.md)

You can stop it with [`npx monolayer stop test`](./../reference/cli/stop-test.md).

- The `ML_AWS_ENDPOINT_URL` environment variable, containing the endpoint URL for the workload's Docker container
will be written to `.env`.
- The bucket will be created if it does not exist.

See the [examples](#examples) on how to configure a client for testing.

:::info
Check your framework's documentation to see if the `.env.test` file is loaded automatically.
:::

## Examples

 ```ts
import { Bucket } from "@monolayer/sdk";

const documents = new Bucket("documents");

export default documents;

// Client configuration

import { S3Client } from "@aws-sdk/client-s3";
import { bucketLocalConfiguration } from "@monolayer/sdk";
export const s3Client = new S3Client({
  ...bucketLocalConfiguration(),
});

// Get Object

const response = await s3Client.send(
  new GetObjectCommand({
    Bucket: documents.name,
    Key: "README.md",
  }),
);
```
