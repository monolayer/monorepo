---
level: 4
---

# BeforeRollout

Workload to run an script to before a new application version has been deployed.

## Description

With this workload you can define an npm script to run before rolling out a new application version.

A [`BeforeRollout`](./../reference/api/main/classes/BeforeRollout.md) workload is initialized with an id an a script name.

```ts
import { BeforeRollout } from "@monolayer/sdk";

const beforeRollout = new BeforeRollout("before-rollout", {
  script: "db:migrate", // Script name in package.json
});

export default beforeRollout;
```
