# Cron

Workload for recurring tasks.

## Description

With this workload you recurring tasks for your application.

A [`Cron`](./../reference/api/main/classes/Cron.md) workload is initialized with a unique id and the following options:

- [schedule](./../reference/api/main/interfaces/CronOptions.md#properties) in [unix-cron](https://man7.org/linux/man-pages/man5/crontab.5.html) format to specify it should run.

- [run](./../reference/api/main/interfaces/CronOptions.md#properties) function with the code that will be executed.

```ts
import { Cron } from "@monolayer/workloads";

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

## Production environments

You can deploy the `Cron` workload to production environment using the [build ouput](#build-output)

## Build output

### Compiled code

Each `Cron` will be compiled to a single CommonJS file with bundled dependencies which can be run
through a generated runner script.

The exported code will be located in `.workloads/cron/${cron-file-name}`.

#### Compilation notes

:::warning
To provide portability across hosting providers, the output code does not include any scheduler.

Also, the compiler doesn't perform any type checking.
:::

- Code is tree shaken.
- A source map is included.

### Dockerfile

A Dockerfile for the `Cron` workload is also provided.

Once the image is built, running the container will run the `Cron` workload.

### manifest.json

The `manifest.json` includes a `crons` key with an array of the `Cron` workloads. Each entry has:

- The ID.
- The entryPoint file name.
- The path to the compiled code.
- The schedule.

:::code-group

```json[Cron Workload]
{
  "version": "1",
  "crons": [
    {
      "id": "reports",
      "entryPoint": "index.mjs",
      "path": "crons/reports",
      "schedule": "* * * * *"
    }
  ],
  // ...
}
```

:::

## Examples

```ts
import { Cron } from "@monolayer/workloads";

const reports = new Cron("reports", {
  schedule: "* * * * *",
  work: () => {
    // Do something;
  },
});

export default reports;
```
