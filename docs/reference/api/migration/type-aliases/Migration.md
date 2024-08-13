[monolayer-monorepo](../../index.md) / [migration](../index.md) / Migration

# Type Alias: Migration

> **Migration**: `object`

## Type declaration

### name

> **name**: `string`

The name of the migration.

### scaffold

> **scaffold**: `boolean`

Whether the migration was scaffolded.

### transaction?

> `optional` **transaction**: `boolean`

Whether the migration runs in a transaction.

### warnings?

> `optional` **warnings**: `ChangeWarning`[]

Migration warnings

## Defined in

[../internal/migrator/src/migration.ts:21](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/migrator/src/migration.ts#L21)
