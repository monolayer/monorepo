[monolayer-monorepo](../../index.md) / [pg](../index.md) / unmanagedForeignKey

# Function: unmanagedForeignKey()

> **unmanagedForeignKey**\<`T`, `C`\>(`columns`, `targetTable`, `targetColumns`): [`PgUnmanagedForeignKey`](../classes/PgUnmanagedForeignKey.md)\<`T`, `C`\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `string` |
| `C` *extends* `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `columns` | `T`[] |
| `targetTable` | `C` |
| `targetColumns` | `string`[] |

## Returns

[`PgUnmanagedForeignKey`](../classes/PgUnmanagedForeignKey.md)\<`T`, `C`\>

## Defined in

[../internal/pg/src/schema/foreign-key.ts:276](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/foreign-key.ts#L276)
