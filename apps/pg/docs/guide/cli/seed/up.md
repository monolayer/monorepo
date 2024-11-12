# `seed up`

## Description

Seeds the database.

### Usage

```bash
# seed the default database
npx monolayer-pg seed up

# seed the database with id `stats` instead of the default
npx monolayer-pg seed up --database-id stats

# seed the database loading environment variables from `.env.test`
npx monolayer-pg seed up --env-file .env.test
```

### Options

| Option                   | Description                                                            |
| -------------------------| ---------------------------------------------------------------------- |
| `-d, --database-id <id>` | (*Optional*) Id of an exported database in your databases file to use. |
| `-e, --env-file <path>`  | (*Optional*) Load environment variables from an `.env`.file.           |
| `-f, --file <seed-file>`  | (*Optional*) Path to seed file. |
| `-r, --replant`  | (*Optional*) Truncate tables before seeding |
| `-n, --disable-warnings`  | (*Optional*) disable truncation warnings |
