# Reuse Dockerfiles

```ts
import { Dockerfile } from "@monolayer/dw";

const base = new Dockerfile();
base.FROM("node:20-alpine")

const runner = new Dockerfile(base);
```

:::info TIP
Useful when building stages shared across many Dockerfiles.
:::
