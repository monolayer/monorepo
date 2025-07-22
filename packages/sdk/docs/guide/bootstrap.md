---
level: 4
---

# Bootstrap

Workload to run an script to bootstrap an application.

## Description

With this workload you can define an npm script to run when rolling out a fresh application.

A [`Bootstrap`](./../reference/api/main/classes/Bootstrap.md) workload is initialized with an id an a script name.

```ts
import { Bootstrap } from "@monolayer/sdk";

const bootstrap = new Bootstrap("bootstrap", {
  script: "db:create", // Script name in package.json
});

export default bootstrap;
```
