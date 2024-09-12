# Generating custom migrations

When you define and evolve your schema, `monolayer-pg` will generate and categorize migrations into a [phase](./../migration-system/intro.md#introduction).

However you may want to generate custom migrations to:

- Add, modify or remove existing data.
- Apply expand and contract (parallel changes) techniques while evolving your database schema.

You create custom migrations with the command [`migrations scaffold`](./../cli.md#migrations-scaffold)

```bash
npx monolayer migrations scaffold --phase expand
```

After entering the name of the migration, a migration file in the phase of your choice will be created:

```ts
import { Kysely } from "kysely";
import { type Migration } from "@monolayer/pg/migration";

export const migration: Migration = {
  name: "{{ migrationName }}",
  transaction: true,
  scaffold: true,
};

export async function up(db: Kysely<any>): Promise<void> {
}

export async function down(db: Kysely<any>): Promise<void> {
}
```

If you want to create a custom migration that does not run in a transaction use the `no-transaction` flag:

```bash
npx monolayer migrations scaffold --phase data --no-transaction
```
