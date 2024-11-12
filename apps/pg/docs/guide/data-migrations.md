# Data migrations

You can easily generate data migrations for your database.

The data migrations are decoupled from your schema declaration, and you decide when to run them, before or after pushing your schema changes.

## Generate a data migration

Generate a data migraion file with [`data scaffold`](./cli/data/scaffold.md) command:

```bash
npx monolayer-pg data scaffold
```

The data migration file exports two functions:

- `up` for applying the data migration (with [`data apply`](./cli/data/apply.md) or [`data up`](./cli/data/up.md))

- `down` to revert the data migration. (with [`data down`](./cli/data/down.md))

A `Kysely` client for the database is made available but you can import and use the client of your choice inside the function.

## Applying data migrations

You can apply all pending data migrations with [`data apply`](./cli/data/apply.md) command:

```bash
npx monolayer-pg data apply
```

You can apply a single pending data migrations with [`data up`](./cli/data/up.md) command:

```bash
npx monolayer-pg data up
```

## Reverting data migrations

You can revert an applied data migration with [`data down`](./cli/data/down.md) command:

```bash
npx monolayer-pg data down
```

## Data migrations groups

By default, data migrations are placed and run in the data folder for your defined database: `monolayer/[database-id]/data/`.

Data migrations groups allows you to create different sets of data migrations that you can apply independently from each other.

You can create and use data migrations groups by using `-g` option on CLI commands.

### Example

Let's say you want to have two sets of data migrations:

- One set to apply before pushing schema changes.
- Another set to apply after pushing schema changes.

### Before group

```bash
# Scaffold a data migration file in monolayer/[database-id]/data/before
npx monolayer-pg data scaffold -g before

# Revert a data migrations in monolayer/[database-id]/data/before
npx monolayer-pg data up -g before

# Apply data migrations in monolayer/[database-id]/data/before
npx monolayer-pg data down -g before

# Get the data migrations status in monolayer/[database-id]/data/before
npx monolayer-pg data status -g before
```

### After group

```bash
# Scaffold a data migration file in monolayer/[database-id]/data/after
npx monolayer-pg data scaffold -g after

# Revert a data migrations in monolayer/[database-id]/data/after
npx monolayer-pg data up -g after

# Apply data migrations in monolayer/[database-id]/data/after
npx monolayer-pg data down -g after

# Get the data migrations status in monolayer/[database-id]/data/after
npx monolayer-pg data status -g after
```
