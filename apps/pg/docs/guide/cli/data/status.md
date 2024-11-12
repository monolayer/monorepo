# `data status`

## Description

Displays data migrations status.

## Usage

```bash
# display data migrations status
npx monolayer-pg data status

# display data migrations status for the database with id `stats`
npx monolayer-pg data status --database-id stats

# display data migrations status loading environment variables from `.env.test`
npx monolayer-pg data status --env-file .env.test
```

## Options

| Option                      | Description                                                            |
| --------------------------- | ---------------------------------------------------------------------- |
| `-d, --database-id <id>`    | (*Optional*) Id of an exported database in your databases file to use. |
| `-e, --env-file <path>`     | (*Optional*) Load environment variables from an `.env` file.           |
| `-g, --group <group-name>`  | (*Optional*) Data migration group name (default: "data")               |
