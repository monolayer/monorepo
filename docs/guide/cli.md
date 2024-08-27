# Command Line Interface

## `db create`

Creates the database in the database server.

### Usage

```bash
# create the default database
npx monolayer db create

# create the database with id `stats`
npx monolayer db create --database-id stats

# create the database loading environment variables from `.env.test`
npx monolayer db create --env-file .env.test
```

### Options

| Option                   | Description                                                            |
| -------------------------| ---------------------------------------------------------------------- |
| `-d, --database-id <id>` | (*Optional*) Id of an exported database in your databases file to use. |
| `-e, --env-file <path>`  | (*Optional*) Load environment variables from an `.env` file.           |

## `db drop`

Drops the database in the database server.

::: warning Use with caution
This is a destructive action, and you will lose data stored in the specified database.
:::

### Usage

```bash
# drop the default database.
npx monolayer db drop

# drop the database with id `stats` instead of the default
npx monolayer db drop --database-id stats

# loads the environment variables from `.env.test`
npx monolayer db drop --env-file .env.test
```

### Options

| Option                   | Description                                                            |
| -------------------------| ---------------------------------------------------------------------- |
| `-d, --database-id <id>` | (*Optional*) Id of an exported database in your databases file to use. |
| `-e, --env-file <path>`  | (*Optional*) Load environment variables from an `.env` file.           |

## `db import`

Imports an existing database by connecting to the database and adding a database schema that reflects the current database schema.

### Usage

```bash
# impot a database
npx monolayer db import
```

## `db reset`

Resets the databas by loading an schema from an existing structure file in `monolayer/dumps`.

The reset process is as follows:
- Drop the database.
- Create the database.
- Load the database structure file.

::: warning
This command does not run migrations. It will only use the contents of the `monolayer/dumps/structure.${database-id}.sql` file.
:::

::: tip
Use this command to quickly setup additional database environments. It will be faster than running all pending migrations on the database.
:::


### Usage

```bash
# Reset the default database.
npx monolayer db reset

# reset the database with id `stats` instead of the default
npx monolayer db reset --database-id stats

# reset the database loading environment variables from `.env.test`
npx monolayer db reset --env-file .env.test
```

### Options

| Option                   | Description                                                            |
| -------------------------| ---------------------------------------------------------------------- |
| `-d, --database-id <id>` | (*Optional*) Id of an exported database in your databases file to use. |
| `-e, --env-file <path>`  | (*Optional*) Load environment variables from an `.env` file.           |


## `db seed`

Seeds the database.

### Usage

```bash
# seed the default database
npx monolayer db seed

# seed the database with id `stats` instead of the default
npx monolayer db seed --database-id stats

# seed the database loading environment variables from `.env.test`
npx monolayer db create --env-file .env.test
```

### Options

| Option                   | Description                                                            |
| -------------------------| ---------------------------------------------------------------------- |
| `-d, --database-id <id>` | (*Optional*) Id of an exported database in your databases file to use. |
| `-e, --env-file <path>`  | (*Optional*) Load environment variables from an `.env` file.           |

## `migrations apply`

Applies pending migrations.

### Usage

```bash
# apply all pending migrations to the default database
npx monolayer migrations apply --phase all

# apply pending expand migrations to the default database
npx monolayer migrations apply --phase expand

# apply all pending migrations to the database with id `stats` instead of the default
npx monolayer migrations apply --phase all --database-id stats

# apply all pending migrations loading environment variables from `.env.test`
npx monolayer migrations apply --phase all --env-file .env.test
```

### Options

| Option                   | Description                                                                 |
| -------------------------| --------------------------------------------------------------------------- |
| `-d, --database-id <id>` | (*Optional*) Id of an exported database in your databases file to use.      |
| `-e, --env-file <path>`  | (*Optional*) Load environment variables from an `.env` file.                |
| `-p, --phase <name>`     | (*Required*) Phase to apply (`all` \| `alter` \| `contract` \| `data` \| `expand`). |
| `-m, --migration <name>` | (*Optional*) Migration to apply. Only for `contract` phase.                 |

## `migrations generate`

Generates migrations based on your database schema definition.

### Usage

```bash
# generate migrations for the default database
npx monolayer migrations generate

# generate migrations for the database with id `stats` instead of the default
npx monolayer migrations generate --database-id stats

# generate migrations loading environment variables from `.env.test`
npx monolayer migrations generate --env-file .env.test
```

### Options

| Option                   | Description                                                                 |
| -------------------------| --------------------------------------------------------------------------- |
| `-d, --database-id <id>` | (*Optional*) Id of an exported database in your databases file to use.      |
| `-e, --env-file <path>`  | (*Optional*) Load environment variables from an `.env` file.                |

## `migrations pending`

Lists pending migrations.

### Usage

```bash
# list pending migrations for the default database
npx monolayer migrations pending

# list all pending migrations for the database with id `stats` instead of the default
npx monolayer migrations pending --database-id stats

# list all pending migrations loading environment variables from `.env.test`
npx monolayer migrations pending --env-file .env.test
```

### Options

| Option                   | Description                                                                 |
| -------------------------| --------------------------------------------------------------------------- |
| `-d, --database-id <id>` | (*Optional*) Id of an exported database in your databases file to use.      |
| `-e, --env-file <path>`  | (*Optional*) Load environment variables from an `.env` file.                |

## `migrations rollback`

Rolls back applied migrations to a previous base migration.

::: warning Recommended only for development
You should use this command only while developing your application.

In the event that migrations fail in production environments, it's best to always move forward by fixing the underlying issue and then either re-apply migrations or generate new ones.
:::

### Usage

```bash
# rollback applied migrations of the default database
npx monolayer migrations rollback

# rollback applied migrations of the database with id `stats` instead of the default
npx monolayer migrations rollback --database-id stats

# rollback migrations loading environment variables from `.env.test`
npx monolayer migrations rollback --env-file .env.test
```

### Options

| Option                   | Description                                                                 |
| -------------------------| --------------------------------------------------------------------------- |
| `-d, --database-id <id>` | (*Optional*) Id of an exported database in your databases file to use.      |
| `-e, --env-file <path>`  | (*Optional*) Load environment variables from an `.env` file.                |

## `migrations scaffold`

Scaffolds a custom migration that you can customize.

### Usage

```bash
# scaffold an expand migration.
npx monolayer scaffold --phase expand

# scaffold an alter migration.
npx monolayer scaffold --phase alter

# scaffold an expand migration for the database with id `stats`.
npx monolayer scaffold --phase expand --database-id stats

# scaffold an expand migration loading environment variables from `.env.test`
npx monolayer scaffold --phase expand --env-file .env.test
```

### Options

| Option                   | Description                                                                 |
| -------------------------| --------------------------------------------------------------------------- |
| `-d, --database-id <id>` | (*Optional*) Id of an exported database in your databases file to use.      |
| `-e, --env-file <path>`  | (*Optional*) Load environment variables from an `.env` file.                |
| `-n, --no-transaction`   | (*Optional*) Configure migration to not run in a transaction. |
| `-p, --phase <name>`     | (*Required*) Phase to scaffold (`alter` \| `contract` \| `data`  \| `expand`). |
