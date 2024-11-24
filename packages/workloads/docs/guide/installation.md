# Installation

::: info PREREQUISITES

- [Node.js](https://nodejs.org) 18.18 or later.
- [Docker](http://www.docker.io).
- A project developed with TypeScript.
:::

In your project directory root run:

```bash
npm install @monolayer/workloads
```

Create a file named `workloads.config.ts` in the root folder of your project
with the following contents:

```ts [workloads.config.ts]
import type { Configuration } from "@monolayer/workloads";

const workloadsConfig: Configuration = {
  // workloadsPath points to a folder where the workloads with be defined.
  // Change it to relative path of your choice inside your project.
  workloadsPath: "src/workloads",
};

export default workloadsConfig;
```
