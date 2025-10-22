# Getting Started

## Add a configuration file

Create a file named `monolayer.config.ts` in the root folder of your project
with the following contents:

:::code-group

```ts [monolayer.config.ts]
import type { Configuration } from "@monolayer/sdk";

const config: Configuration = {
  // `workloadsPath` points to the folder where the workloads will be defined.
  // Change it to a relative path of your choice within your project.
  workloadsPath: "src/workloads",
};

export default config;
```

:::

## Define workloads

We'll define a `PostgresDatabase` workload that represents a PostgreSQL database.

:::code-group

```ts[src/workloads/postgres.ts]
import { PostgreSQL } from "@monolayer/sdk";
import pg from "pg";

export const productsDb = new PostgresDatabase("products");
```

:::

## Launching workloads

```bash
npx monolayer start dev
```

\
In this example, running `npx monolayer start dev` will:

1. Launch a Docker container with a PostgreSQL database
2. Create the `products` database if it does not already exist.
3. Write the connection string for the server to the `.env.local` file.

\
You can check the status of the workloads with:

```bash
npx monolayer status dev
```

## Using workloads

You can configure your database client with the created connection string.

```ts
import { productsDb } from "src/workloads/postgres";
import pg from "pg";

// Skip if your web framework already loads the `.env` file.
import dotenv from "dotenv";
dotenv.config();

const client = new pg.Pool({
  // The environment variable is set when you launch `npx monolayer start dev`
  connectionString: process.env[productsDb.connectionStringEnvVar],
});

// Querying the products database.
await client.query("SELECT 1");
```
