# task-sqs-adapter

AWS SQS adapter for task workloads from `@monolayer/workloads`.

## Requirements

- `@monolayer/workloads` package.
- Redis server.

## Usage

- Add package

  ```bash
  npm install @monolayer/task-sqs-adapter
  ```

### Dispatcher

- Set `TASK_DISPATCHER` environment variable to `@monolayer/task-sqs-adapter`

  ```bash
  export TASK_DISPATCHER="@monolayer/task-sqs-adapter"
  ```

- Set the environment variable with the SQS queue URL associated with the task.

  For a task with the following id: `send-email`:

  ```bash
  export MONO_TASK_SEND_EMAIL_SQS_QUEUE_URL=sqs-queue-url
  ```

  Each task has a unique environment variable associated with for its queue: `MONO_TASK_${snakeCase(taskId).toUpperCase()}_SQS_QUEUE_URL`

- Run your application with the task workload.

### Worker

Wrap your task in a worker script.

```js
import { Worker } from "@monolayer/task-sqs-adapter";
import task from "/path/to/task.mjs" // Build output from workloads build

new Worker(task.default);
```

You can stop the worker with:

```js
worker.stop()
```
