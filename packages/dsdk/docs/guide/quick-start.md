---
outline: [2,3,4]
---

# Quick start

## Installation

```bash
npm install @monolayer/dsdk
```

## Configuration

`DSDK` will access the Docker Engine API by connecting to the Docker daemon of your choice.

All you need to do is to configure `DSDK` to use an existing [Docker context](https://docs.docker.com/engine/manage-resources/contexts/) with [setContext](./../reference/api/config/functions/setContext.md).

```ts
import { setContext } from "@monolayer/dsdk/config";

// Will use credentials from the default Docker context
await setContext("default");
```

:tada: That's it. You're ready to go!

::: info
`DSDK` supports Unix sockets and SSH connections.

You have can interact with Docker Engine API endpoints except:

- /_ping
- /session
:::

See selected [examples](./examples.md) to interact with the Docker Engine API.

## Debug API calls

To debug API calls, set the environment variable `DEBUG` to any value.
