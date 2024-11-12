# `data down`

## Description

Reverts a specific data migration.

## Usage

```bash
# revert a data migration
npx monolayer-pg data down

# revert a data migration for the database with id `stats`
npx monolayer-pg data down --database-id stats

# revert a data migration loading environment variables from `.env.test`
npx monolayer-pg data down --env-file .env.test

# revert an arbitrary data migration loading environment variables from `.env.test`
npx monolayer-pg data down --name 2xxxx-my-data --env-file .env.test
```

## Options

| Option                      | Description                                                            |
| --------------------------- | ---------------------------------------------------------------------- |
| `-d, --database-id <id>`    | (*Optional*) Id of an exported database in your databases file to use. |
| `-e, --env-file <path>`     | (*Optional*) Load environment variables from an `.env` file.           |
| `-g, --group <group-name>`  | (*Optional*) Data migration group name (default: "data")               |
| `-n, --name <data-migration-name>`| (*Optional*) Name of the migration to revert.                    |
