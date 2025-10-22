# Broadcast

Workload for implementing live-updating user interfaces.

## Description

With this workload you can efficiently publish data from the server to connected clients, instead of continually polling the server for data changes from the client.

A [`Broadcast`](./../reference/api/main/classes/Broadcast.md) is initialized with the following arguments:

- [session](./../reference/api/main/classes/Broadcast.md#param): A function to set the client session.

- [channels](./../reference/api/main/classes/Broadcast.md#param-1): An object where keys are route strings, and values are objects defining the channel and optional authorization logic.

```ts
import { Broadcast, Channel } from "@monolayer/sdk";
import type { Todos } from "@prisma/client";

export type TodosData = Todos & { action: "add" | "delete" };

const broadcast = new Broadcast(
  async () => {
    return {};
  },
  {
    "/todos": {
      channel: new Channel<TodosData>(),
    },
  },
);

export default broadcast;
export type Channels = typeof broadcast.channels;
```

:::info **Important**
Export the `Broadcast` workload as the `default` export, and ensure there is only one `Broadcast` workload across all workload files.
:::

::: code-group

```tsx [layout.tsx]
// Add Broadcast provider to your layout

import { BroadcastProvider } from "@monolayer/sdk";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body>
        <BroadcastProvider>
          {children}
        </BroadcastProvider>
      </body>
    </html>
  );
}
```

```tsx [todos.tsx]
import type { Todos } from "@prisma/client";
import type { TodosData } from "@/workloads/broadcast";
import { useSubscription } from "./client";

interface TodosProps {
  todos: Todos[] & { action?: TodosData["action"] }
}

export function Todos({ todos }: TodosProps) {
  const subscription = useSubscription("/todos", {});
  const todosToDisplay = combineTodos(todos, subscription.all);

  return todosToDisplay.map((todo, idx) => <p key="idx">{todo.text}</p>)
}

function combineTodos(todos: Todos[], subscription: TodosData[]) {
  const allTodos = todos.concat(subscription.all);
  return Object.values(
    allTodos.reduce<Record<string, TodosData>>((acc, val) => {
      if (acc[val.id] === undefined || new Date(acc[val.id].updatedAt) <= new Date(val.updatedAt)) {
        acc[val.id] = val;
      }
      return acc;
    }, {}),
  ).filter((i) => i.action === undefined || i.action !== "delete");
}
```

```ts [client.ts]
// Create type-safe client

import type { Channels } from "@/workloads/broadcast";
import { broadcastClient } from "@monolayer/sdk";

export const { useSubscription } = broadcastClient<Channels>();
```

```ts [action.ts]
"use server";

import type { Channels, TodosData } from "@/workloads/broadcast";
import type { Todos } from "@prisma/client";
import { BroadcastPublisher } from "@monolayer/sdk";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";

export async function saveTodo(todo: Todos) {
  const createdTodo = await prisma.todos.create({ data: { text } });
  const publisher = new BroadcastPublisher<Channels>(); // [!code highlight]
  revalidatePath("/");
  await publisher.publishTo("/todos", {}, [{ ...createdTodo, action: "add" }]); // [!code highlight]
}

async function publishBucketUpdate(items: TodosData[]) {
  const publisher = new BroadcastPublisher<Channels>();
  await publisher.publishTo("/todos", {}, items);
}
```

:::

## Development environment

A Docker container for the dev environment is launched with [`npx monolayer start dev`](./../reference/cli/start-dev.md)

You can stop it with [`npx monolayer stop dev`](./../reference/cli/stop-dev.md).

After the container is started:

- The environment variable with the connection string for the workload's Docker container
will be written to `.env.local`.

:::info
Check your framework's documentation to see if the `.env.local` file is loaded automatically.
:::

## Test environment

A Docker container for the test environment is launched with [`npx monolayer start test`](./../reference/cli/start-test.md)

You can stop it with [`npx monolayer stop test`](./../reference/cli/stop-test.md).

- The environment variable with the connection string for the workload's Docker container
will be written to `.env.test.local`.

:::info
Check your framework's documentation to see if the `.env.test.local` file is loaded automatically.
:::
