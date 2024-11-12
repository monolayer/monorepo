# `data scaffold`

## Description

Scaffolds a new data migration file.

## Usage

```bash
# scaffold a data migration file for the default database
npx monolayer-pg seed scaffold

# scaffold a data migration file for the database with id `stats` instead of the default
npx monolayer-pg seed up --database-id stats
```

## Options

| Option                      | Description                                                            |
| --------------------------- | ---------------------------------------------------------------------- |
| `-d, --database-id <id>`    | (*Optional*) Id of an exported database in your databases file to use. |
| `-e, --env-file <path>`     | (*Optional*) Load environment variables from an `.env` file.           |
| `-g, --group <group-name>`  | (*Optional*) Data migration group name (default: "data")               |
