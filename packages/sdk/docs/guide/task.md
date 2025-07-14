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
