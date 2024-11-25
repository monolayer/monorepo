# Mailer

Workload for SMTP mailers.

## Description

With this workload you define SMPT mailers.

A [`Mailer`](./../reference/api/main/classes/Mailer.md) workload is initialized with a stable ID a [client constructor function](./../reference/api/main/interfaces/DatabaseOptions.md#properties) providing the client of your choice.

See [examples](#examples).

Each workload has an environment variable name associated with it to hold the connection
string for the SMTP server named after the workloads' [`id`](./../reference/api/main/classes/Mailer.md#properties). For example:

- id `transactional`: `MONO_MAILER_TRANSACTIONAL_URL`.

## Client

You can use **any** SMTP client with the workload, although [Nodemailer](https://nodemailer.com) is recommended.

The client is defined by passing a constructor function when initializing the workload.

You access the client with the [client](./../reference/api/main/classes/Mailer.md#client) accessor. This accessor will call this client constructor function with the workload's environment variable name and memoize its result.

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

The workload assumes that a SMTP server will be avaliable.

At deployment time, make sure to configure the environment variable name for the workload
with the connection string for the SMPT server.

## Build output

The build output for the workload is located in the `mailer` of the `manifest.json`
and it includes:

- The mailer ID.
- The environment variable name.

:::code-group

```json[Mailer Workload]
{
  "version": "1",
  "mailer": [
    {
      "id": "transactional",
      "connectionStringEnvVar": "MONO_MAILER_TRANSACTIONAL_DATABASE_URL"
    }
  ],
  // ...
}
```

:::

## Example

```ts
import { Mailer } from "@monolayer/workloads";
import nodemailer from 'nodemailer';

const mailer = new Mailer("transactional", (envVarName) =>
  nodemailer.createTransport(process.env[envVarName]),
);

// Sending an email
await mailer.client.sendMail({
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Message in a bottle",
  text: "I hope this message gets there!",
});
```
