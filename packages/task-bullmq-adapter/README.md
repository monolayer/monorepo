# task-bullmq-adapter

BullMQ adapter for task workloads from `@monolayer/workloads`.

## Requirements

- `@monolayer/workloads` package.
- Redis server.

## Usage

### Dispatcher

- Add package

  ```bash
  npm install @monolayer/task-bullmq-adapter
  ```

- Set `TASK_DISPATCHER` environment variable to `@monolayer/task-bullmq-adapter`

  ```bash
  export ML_TASK_MODE="@monolayer/task-bullmq-adapter"
  ```

- Set `TASK_BULLMQ_ADAPTER_REDIS_URL` environment variable with the Redis instance connection string

  ```bash
  export TASK_BULLMQ_ADAPTER_REDIS_URL=redis-connection-string
  ```

- Run your application with the task workload.

### Worker

Wrap your task in a worker script.

```js
import { Worker } from "@monolayer/task-bullmq-adapter";
import task from "/path/to/task.mjs" // Build output from workloads build

new Worker(task.default);
```

You can stop the worker with:

```js
worker.stop()
```
