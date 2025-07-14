# Task

Workload for tasks (an operation or a job) that can be executed asynchronously.

## Description

With this workload you define tasks for your application such as:

- Sending emails.
- Dispating notifications.
- Generating reports.

Tasks can be either performed immediately, or enqueued (backed by `Redis` or `AWS SQS`).

A [`Task`](./../reference/api/main/classes/Task.md) is initialized with a unique name and function that to process the task and the following options:

- [onError](./../reference/api/main/interfaces/TaskOptions.md#properties): function to handle errors.

- [retry](./../reference/api/main/interfaces/TaskOptions.md#properties): retry [options](./../reference/api/main/interfaces/RetryOptions.md) for the task.

You can provide a type parameter for the expected type to use when sending a task to be performed and processing it.

```ts
import { Task } from "@monolayer/sdk";
import { mailer } from "/mailer"

const confirmationEmail = new Task<{ email: string }>(
  "sendConfirmationEmail",
  sync ({ taskId, data }) => {
    await mailer.client.sendMail({
      from: "sender@example.com",
      to: data.email,
      subject: "Message in a bottle",
      text: "I hope this message gets there!",
    });
  },
  {
    retry: {
      times: 3,
    },
    onError: (error) => {},
  }
);

export default confirmationEmail;
```

:::info **Important**
Export only one `Task` workload per file as the `default` export.
:::

Tasks can be either performed immediately with [performNow](./../reference/api/main/classes/Task.md#performnow), or enqueued with [performLater](./../reference/api/main/classes/Task.md#performlater).

```ts
// Perform a task immediately
confirmationEmail.performNow({ email: "text@example.com" })

// Enqueue a task
confirmationEmail.performLater({ email: "text@example.com" })
confirmationEmail.performLater({ email: "text@example.com" }, delay: 1000);
```

## Development environment

Tasks are executed immediately.

## Test environment

Enqueued tasks with `performLater` will be collected.

You can inspect the collected tasks with the test_helper `enqueuedTasks`

## Production environments

You can deploy the `Task` workload to production environments using the [build ouput](#build-output).

The build output provides:

- A bundled version of the task.
- A Dockerfile to build a contanerized version of it.

## Build output

### Compiled code

Each `Task` will be compiled to a single CommonJS file with bundled dependencies that can be run with the entrypoint script `ìndex.mjs`.

The exported code will be located in `.workloads/task/${task-file-name}/dist`.

This entrypoint script expects an environment variable `ML_TASK_MODE` to be either set to:

- `bull`: for `Redis` backed queues.

  You need to set the environment variable `ML_TASK_REDIS_URL` with the connection string to the Redis server.
- `sqs`: for `AWS SQS` backed queues.

  You need to set the environment variable `ML_TASK_${snakeCase(task.id).toUpperCase()}_SQS_QUEUE_URL` with the `SQS` queue URL.

  Credentials for the client are picked up from the environment by the AWS SDK.

:::danger Important
`SQS` backed tasks require their own queue.

In other words, you **must not** share the same `SQS` queue across tasks.
:::

#### Compilation notes

- Code is tree shaken.
- Source maps are included.

### Dockerfile

A Dockerfile for the `Task` workload is also provided.

Once the image is built, running the container will run the `Task` workload.

### manifest.json

The `manifest.json` includes a `task` key with an array of the `Task` workloads. Each entry has:

- The ID.
- The entryPoint file name.
- The path to the build output.

:::code-group

```json[Task Workload]
{
  "version": "2",
  "task": [
    {
      "id": "reports",
      "entryPoint": "index.mjs",
      "path": "tasks/reports",
    }
  ],
  // ...
}
```

:::
