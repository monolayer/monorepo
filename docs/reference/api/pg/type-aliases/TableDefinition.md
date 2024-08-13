[monolayer-monorepo](../../index.md) / [pg](../index.md) / TableDefinition

# Type Alias: TableDefinition\<T, PK\>

> **TableDefinition**\<`T`, `PK`\>: `object`

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `PK` *extends* `string` |

## Type declaration

### columns

> **columns**: `T` *extends* `ColumnRecord` ? `T` : `never`

### constraints?

> `optional` **constraints**: `object`

### constraints.checks?

> `optional` **checks**: ([`PgCheck`](../classes/PgCheck.md) \| [`PgUnmanagedCheck`](../classes/PgUnmanagedCheck.md))[]

### constraints.foreignKeys?

> `optional` **foreignKeys**: keyof `T` *extends* `string` ? ([`PgForeignKey`](../classes/PgForeignKey.md)\<keyof `T`, `any`\> \| `PgSelfReferentialForeignKey`\<keyof `T`, `any`\> \| [`PgUnmanagedForeignKey`](../classes/PgUnmanagedForeignKey.md)\<keyof `T`, `any`\>)[] : []

### constraints.primaryKey?

> `optional` **primaryKey**: keyof `T` *extends* `string` ? `PK`[] *extends* keyof `T`[] ? [`PgPrimaryKey`](../classes/PgPrimaryKey.md)\<keyof `T`, `PK`\> : [`PgPrimaryKey`](../classes/PgPrimaryKey.md)\<keyof `T`, `PK`\> : `never`

### constraints.unique?

> `optional` **unique**: keyof `T` *extends* `string` ? [`PgUnique`](../classes/PgUnique.md)\<keyof `T`\>[] : []

### indexes?

> `optional` **indexes**: keyof `T` *extends* `string` ? ([`PgIndex`](../classes/PgIndex.md)\<keyof `T`\> \| [`PgUnmanagedIndex`](../classes/PgUnmanagedIndex.md))[] : `never`

### triggers?

> `optional` **triggers**: ([`PgTrigger`](../classes/PgTrigger.md)\<keyof `T` *extends* `string` ? keyof `T` : `never`\> \| [`PgTrigger`](../classes/PgTrigger.md)\<`never`\> \| [`PgUnmanagedTrigger`](../classes/PgUnmanagedTrigger.md))[]

## Defined in

[../internal/pg/src/schema/table.ts:19](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/table.ts#L19)
