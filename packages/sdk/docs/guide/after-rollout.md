---
level: 4
---

# AfterRollout

Workload to run an script to before a new application version has been deployed.

## Description

With this workload you can define an npm script to run after rolling out a new application version.

A [`AfterRollout`](./../reference/api/main/classes/AfterRollout.md) workload is initialized with an id an a script name.

```ts
import { AfterRollout } from "@monolayer/sdk";

const afterRollout = new AfterRollout("after-rollout", {
  script: "notify", // Script name in package.json
});

export default afterRollout;
```
