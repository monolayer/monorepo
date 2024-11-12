# `push dev`

## Description

Push schema changes to the database (development).

## Usage

```bash
# push changes
npx monolayer-pg dev prod

# push changes of database with id `stats`
npx monolayer-pg dev prod --database-id stats

# push changes loading environment variables from `.env.test`
npx monolayer-pg dev prod --env-file .env.test
```

## Options

| Option                   | Description                                                            |
| -------------------------| ---------------------------------------------------------------------- |
| `-d, --database-id <id>` | (*Optional*) Id of an exported database in your databases file to use. |
| `-e, --env-file <path>`  | (*Optional*) Load environment variables from an `.env` file.           |
| `-q, --quiet`            | (*Optional*) Do not display SQL statements. |
