# Getting Started

## Add a configuration file

Create a file named `workloads.config.ts` in the root folder of your project
with the following contents:

:::code-group

```ts [workloads.config.ts]
import type { Configuration } from "@monolayer/workloads";

const workloadsConfig: Configuration = {
  // workloadsPath points to a folder where the workloads with be defined.
  // Change it to relative path of your choice inside your project.
  workloadsPath: "src/workloads",
};

export default workloadsConfig;
```

:::

## Define workloads

We'll define a `PostgresDatabase` workload that represents a PostgreSQL database.

:::code-group

```ts[src/workloads/postgres.ts]
import { PostgreSQL } from "@monolayer/workloads";
import pg from "pg";

export const producstDb = new PostgresDatabase("products",
  {
    client: (envVarName) =>
      new pg.Pool({ connectionString: process.env[envVarName],}),
  }
);
```

:::

## Launching workloads

```bash
npx workload start dev
```

\
In this example, running `workloads start dev` will:

1. Launch a docker container with a `PostgresSQL` database
2. Create the database `products` if it does not exist.
3. Write the connection string for the server to the `.env` file.

\
You can get the status of the workloads with:

```bash
npx workloads status dev
```

## Using workloads

You can access your workload client with the `client` accessor in your codebase.

```ts
import { producstDb } from "src/workloads/postgres";

// Skip if your web framework already loads the `.env` file.
import dotenv from "dotenv";
dotenv.config();

// Querying the products database.
await producstDb.client.query("SELECT 1");
```
