# Configuration

You can configure the SDK in the main configuration file, `monolayer.config.ts`, located in the root of your project.

## Workloads location

You can change the location of your workloads with the `workloadsPath` property.

```ts
import type { Configuration } from "@monolayer/sdk";

const config: Configuration = {
  workloadsPath: "lib/workloads",
};

export default config;
```

## Environment variables

To change the dotenv file names, add the desired file name to the `envFileName` property.

```ts
import type { Configuration } from "@monolayer/sdk";

const config: Configuration = {
  workloadsPath: "lib/workloads",
  envFileName: {
    development: ".env.development",
    test: ".env.test.local",
  },
};

export default config;
```

## Container images

Each workload uses a [default](./../reference/api/main/interfaces/Configuration.md) Docker container image by default.

You can change this in the `containers` property.

```ts
import type { Configuration } from "@monolayer/sdk";

const config: Configuration = {
  workloadsPath: "lib/workloads",
  containers: {
    postgresDatabase: {
      imageName: "postgres:16.5-alpine3.20",
    }
  }
};

export default config;
```

## Workload container ports

Each Docker container for a workload publishes container ports to the host by [default](./../reference/api/main/interfaces/Configuration.md).

You can change this in the `containers` property.

```ts
import type { Configuration } from "@monolayer/sdk";

const config: Configuration = {
  workloadsPath: "lib/workloads",
  containers: {
    postgresDatabase: {
      exposedPorts: [{
        container: 5432,
        host: 5543,
      }]
    }
  }
};

export default config;
```
