# Cron

Workload for recurring tasks.

## Description

With this workload you recurring tasks for your application.

A [`Cron`](./../reference/api/main/classes/Cron.md) workload is initialized with a unique id and the following options:

- [schedule](./../reference/api/main/interfaces/CronOptions.md#properties) in [unix-cron](https://man7.org/linux/man-pages/man5/crontab.5.html) format to specify it should run.

- [run](./../reference/api/main/interfaces/CronOptions.md#properties) function with the code that will be executed.

```ts
import { Cron } from "@monolayer/sdk";

const reports = new Cron("reports", {
  schedule: "* * * * *",
  work: () => {
    // Do something;
  },
});

export default reports;
```

:::info **Important**
Export only one `Cron` workload per file as the `default` export.
:::

## Development environment

You can trigger a `Cron` workload on demand with the [trigger cron](./../reference/cli/trigger-cron.md) CLI command.

## Test environment

This workload does not have a test environment.

However, you can test the work function of a `Cron` in your test suite.

:::

## Examples

```ts
import { Cron } from "@monolayer/sdk";

const reports = new Cron("reports", {
  schedule: "* * * * *",
  work: () => {
    // Do something;
  },
});

export default reports;
```
