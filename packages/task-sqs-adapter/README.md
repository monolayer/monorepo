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

- Set `MONO_TASK_MODE` environment variable to `sqs`

  ```bash
  export MONO_TASK_MODE=sqs
  ```

- Set the environment variable with the SQS queue URL associated with the task.

  For a task with the following id: `send-email`:

  ```bash
  export MONO_TASK_SEND_EMAIL_SQS_QUEUE_URL=sqs-queue-url
  ```

  Each task has a unique environment variable associated with for its queue: `MONO_TASK_${snakeCase(taskId).toUpperCase()}_SQS_QUEUE_URL`

### Dispatcher

Run your application with the task workload.

### Worker

Wrap your task in a worker script.

```js
import { Worker } from "@monolayer/task-sqs-adapter";
import task from "/path/to/task.js" // Build output from workloads build

new Worker(task.default);
```

You can stop the worker with:

```js
worker.stop()
```
