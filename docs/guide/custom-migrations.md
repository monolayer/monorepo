---
sidebar_position: 13
---

# Custom migrations

From time to time, you may need to:
- Create database objects not managed by `monolayer`.
- Perform data migrations.

For those cases, you can write custom migrations.

### 1. Scaffold a new migration

Scaffol a new migration with:

```bash
npx monolayer scaffold
```

This will create a new migration file in the configuration's `migrations` folder with the name of your choice.

```ts title="migrations/${configurationName}/${timestamp}-${migrationName}.ts"
import { Kysely } from "kysely";
import { Migration } from "monolayer/migration";

export const migration: Migration = {
  scaffold: true,
  dependsOn: "2024034553434-previous-migration-name",
};

export async function up(db: Kysely<any>): Promise<void> {
};

export async function down(db: Kysely<any>): Promise<void> {
};
```

### 2. Implement the `up` and `down` functions.

Example:
```ts title="migrations/${configurationName}/${timestamp}-${migrationName}.ts" {10-14,18}}
import { Kysely } from "kysely";
import { Migration } from "monolayer/migration";

export const migration: Migration = {
  scaffold: true,
  dependsOn: "2024034553434-previous-migration-name",
};

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createView('dogs')
    .orReplace()
    .as(db.selectFrom('pet').selectAll().where('species', '=', 'dog'))
    .execute()
};

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropView('dogs').execute();
};
```

:::warning
The `down` function is used to revert the operations performed in the `up` function.

When performing database schema changes, you should implement it to ensure you can safely
go back to a previous state with the [rollback](../cli/rollback.md) command.

:::

### 3. Apply the migration:

You can now apply the migration with:
```bash
npx monolayer migrate
```