# `db drop`

## Description

Drops the database in the database server.

::: warning Use with caution
This is a destructive action, and you will lose data stored in the specified database.
:::

## Usage

```bash
# drop the default database.
npx monolayer-pg db drop

# drop the database with id `stats` instead of the default
npx monolayer-pg db drop --database-id stats

# loads the environment variables from `.env.test`
npx monolayer-pg db drop --env-file .env.test
```

## Options

| Option                   | Description                                                            |
| -------------------------| ---------------------------------------------------------------------- |
| `-d, --database-id <id>` | (*Optional*) Id of an exported database in your databases file to use. |
| `-e, --env-file <path>`  | (*Optional*) Load environment variables from an `.env` file.           |
