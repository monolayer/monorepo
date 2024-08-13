[monolayer-monorepo](../../index.md) / [pg](../index.md) / MonoLayerPgDatabase

# Class: MonoLayerPgDatabase

## Accessors

### connectionString

> `get` **connectionString**(): `string`

#### Returns

`string`

#### Defined in

[../internal/pg/src/database.ts:39](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/database.ts#L39)

## Constructors

### new MonoLayerPgDatabase()

> **new MonoLayerPgDatabase**(`id`, `config`): [`MonoLayerPgDatabase`](MonoLayerPgDatabase.md)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `config` | `DatabaseConfig` |

#### Returns

[`MonoLayerPgDatabase`](MonoLayerPgDatabase.md)

#### Defined in

[../internal/pg/src/database.ts:29](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/database.ts#L29)

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| `camelCase` | `public` | `boolean` | [../internal/pg/src/database.ts:27](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/database.ts#L27) |
| `extensions?` | `public` | [`PgExtension`](PgExtension.md)[] | [../internal/pg/src/database.ts:26](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/database.ts#L26) |
| `generatePrismaSchema` | `public` | `boolean` | [../internal/pg/src/database.ts:25](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/database.ts#L25) |
| `id` | `public` | `string` | [../internal/pg/src/database.ts:30](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/database.ts#L30) |
| `schemas` | `public` | `AnySchema`[] | [../internal/pg/src/database.ts:24](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/database.ts#L24) |
