# Seeding your database

You can seed your database with initial data though the CLI.

Seeding the database is useful to:
- Reload the data frequently the database in development or test.
- Set initial data in production.

::: info
Migrations can be used to add or modify data to an existing database (`data` migration phase).
:::

## Configuring the seeder function

Each database can be configured with a seeder function.

```ts
import { defineDatabase } from "monolayer/pg";
import { dbSchema } from "./schema";
import { dbSchema } from "./seeds";

export default defineDatabase({
  id: "default",
  schemas: [dbSchema],
  extensions: [],
  camelCase: false,
  seeder: dbSeed, // [!code highlight]
});
```

## Loading seed data

To load the seed data into the database execute the [`db seed`](./../cli.md#db-seed) command:

```bash
npx monolayer db seed
```

This command will call the `seeder` function defined in your database definition.
