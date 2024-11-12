# `db create`

## Description

Creates the database in the database server.

## Usage

```bash
# create the default database
npx monolayer-pg db create

# create the database with id `stats`
npx monolayer-pg db create --database-id stats

# create the database loading environment variables from `.env.test`
npx monolayer-pg db create --env-file .env.test
```

## Options

| Option                   | Description                                                            |
| -------------------------| ---------------------------------------------------------------------- |
| `-d, --database-id <id>` | (*Optional*) Id of an exported database in your databases file to use. |
| `-e, --env-file <path>`  | (*Optional*) Load environment variables from an `.env` file.           |
