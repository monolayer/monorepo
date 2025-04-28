# task-bullmq-adapter

BullMQ adapter for task workloads from `@monolayer/workloads`.

## Requirements

- `@monolayer/workloads` package.
- Redis server.

## Usage

- Add package

  ```bash
  npm install @monolayer/task-bullmq-adapter
  ```

- Set `MONO_TASK_MODE` environment variable to `bull`

  ```bash
  export MONO_TASK_MODE=bull
  ```

- Set `MONO_TASK_REDIS_URL` environment variable with the Redis instance connection string

  ```bash
  export MONO_TASK_REDIS_URL=redis-connection-string
  ```

### Dispatcher

Run your application with the task workload.

### Worker

Wrap your task in a worker script.

```js
import { Worker } from "@monolayer/task-bullmq-adapter";
import task from "/path/to/task.js" // Build output from workloads build

new Worker(task.default);
```

You can stop the worker with:

```js
worker.stop()
```
