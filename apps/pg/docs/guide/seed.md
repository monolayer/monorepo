# Seeding your database

You can seed your database with initial data though the CLI.

## Generate a seed file

Generate a seed file with [`seed scaffold`](./cli/seed/scaffold.md) command:

```bash
npx monolayer-pg seed scaffold
```

The seed file exports a `seed` function, that will be executed when seeding the database.
A `Kysely` client for the database is made available but you can import and use the client of your choice inside the function.

## Load seed data

To load the seed data into the database execute the [`seed up`](./cli/seed/up.md) command:

```bash
npx monolayer-pg seed up
```
