# `push prod`

## Description

Push schema changes to the database (development)

## Usage

```bash
# push changes
npx monolayer-pg push prod

# push changes of database with id `stats`
npx monolayer-pg push prod --database-id stats

# push changes loading environment variables from `.env.test`
npx monolayer-pg push prod --env-file .env.test
```

## Options

| Option                   | Description                                                            |
| -------------------------| ---------------------------------------------------------------------- |
| `-d, --database-id <id>` | (*Optional*) Id of an exported database in your databases file to use. |
| `-e, --env-file <path>`  | (*Optional*) Load environment variables from an `.env` file.           |
| `-v, --verbose`          | (*Optional*) Display SQL statements.                                   |
