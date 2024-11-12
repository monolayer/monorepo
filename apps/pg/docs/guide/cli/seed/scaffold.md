# `seed scaffold`

## Description

Scaffolds a seed file

## Usage

```bash
# scaffold a seed file the default database
npx monolayer-pg seed scaffold

# scaffold a seed file for the database with id `stats` instead of the default
npx monolayer-pg seed scaffold --database-id stats
```

## Options

| Option                   | Description                                                            |
| -------------------------| ---------------------------------------------------------------------- |
| `-d, --database-id <id>` | (*Optional*) Id of an exported database in your databases file to use. |
| `-e, --env-file <path>`  | (*Optional*) Load environment variables from an `.env`.file.           |
