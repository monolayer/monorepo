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

Each `Cron` will be compiled to JavaScript as an ECMAScript module.

The exported code will be located in `.workloads/cron/${cron-file-name}`.

#### Compilation notes

:::warning
To provide portability across hosting providers, the output code does not include any scheduler.

In the future, we'll provide build presets to tailor the output for different environments, such as node server, Vercel, and AWS Lambda.
:::

- Code is tree shaken.
- Code does include packages (dependencies and peerDependencies).
- A source map is included.
- You can execute the workload by importing it from the [entryPoint] specified in `manifest.json`.

  ```ts
  import reports from "./path/to/reports/cron/index.mjs";
  await reports.work();
  ```

:::warning
The compiler doesn't perform any type checking.
:::

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
