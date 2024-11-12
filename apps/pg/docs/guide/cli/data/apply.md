# `data apply`

## Description

Applies all pending data migrations.

## Usage

```bash
# create the default database
npx monolayer-pg data apply

# create the database with id `stats`
npx monolayer-pg data apply --database-id stats

# create the database loading environment variables from `.env.test`
npx monolayer-pg data apply --env-file .env.test
```

## Options

| Option                      | Description                                                            |
| --------------------------- | ---------------------------------------------------------------------- |
| `-d, --database-id <id>`    | (*Optional*) Id of an exported database in your databases file to use. |
| `-e, --env-file <path>`     | (*Optional*) Load environment variables from an `.env` file.           |
| `-g, --group <group-name>`  | (*Optional*) Data migration group name (default: "data")               |
