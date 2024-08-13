[monolayer-monorepo](../../index.md) / [pg](../index.md) / table

# Function: table()

> **table**\<`T`, `PK`\>(`definition`): [`PgTable`](../classes/PgTable.md)\<`T`, `PK`\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `ColumnRecord` |
| `PK` *extends* `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `definition` | [`TableDefinition`](../type-aliases/TableDefinition.md)\<`T`, `PK`\> |

## Returns

[`PgTable`](../classes/PgTable.md)\<`T`, `PK`\>

## Defined in

[../internal/pg/src/schema/table.ts:54](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/table.ts#L54)
