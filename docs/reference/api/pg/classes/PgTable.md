[monolayer-monorepo](../../index.md) / [pg](../index.md) / PgTable

# Class: PgTable\<T, PK\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `ColumnRecord` |
| `PK` *extends* `string` |

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| `infer` | `DrainOuterGeneric`\<\{ \[K in string \| number \| symbol\]: DrainOuterGeneric\<\{ \[K in string \| number \| symbol\]: (PrimaryKeyColumns\<T, PK\> & NonPrimaryKeyColumns\<T, PK\>)\[K\] \}\>\[K\] \}\> | [../internal/pg/src/schema/table.ts:65](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/table.ts#L65) |
