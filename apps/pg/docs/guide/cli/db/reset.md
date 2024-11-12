# `db reset`

## Description

Resets the databas by loading an schema from an existing structure file in `monolayer/dumps`.

The reset process is as follows:

- Drop the database.
- Create the database.
- Loads the database structure file.

::: tip
Use this command to quickly setup additional database environments. It will be faster than running all pending migrations on the database.
:::

## Usage

```bash
# Reset the default database.
npx monolayer-pg db reset

# reset the database with id `stats` instead of the default
npx monolayer-pg db reset --database-id stats

# reset the database loading environment variables from `.env.test`
npx monolayer-pg db reset --env-file .env.test
```

## Options

| Option                   | Description                                                            |
| -------------------------| ---------------------------------------------------------------------- |
| `-d, --database-id <id>` | (*Optional*) Id of an exported database in your databases file to use. |
| `-e, --env-file <path>`  | (*Optional*) Load environment variables from an `.env` file.           |
