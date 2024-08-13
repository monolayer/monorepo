[monolayer-monorepo](../../index.md) / [pg](../index.md) / PgXML

# Class: PgXML

## Extends

- `StringColumn`

## Methods

### default()

> **default**(`value`): [`PgXML`](PgXML.md) & `WithDefaultColumn`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` \| `Expression`\<`unknown`\> |

#### Returns

[`PgXML`](PgXML.md) & `WithDefaultColumn`

#### Inherited from

`StringColumn.default`

#### Defined in

[../internal/pg/src/schema/column/column.ts:81](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/column.ts#L81)

***

### notNull()

> **notNull**(): [`PgXML`](PgXML.md) & `NonNullableColumn`

Adds a not null constraint to the column.

The column is not allowed to contain null values.

#### Returns

[`PgXML`](PgXML.md) & `NonNullableColumn`

#### See

PostgreSQL Docs: [Not-Null Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-NOT-NULL)

#### Inherited from

`StringColumn.notNull`

#### Defined in

[../internal/pg/src/schema/column/column.ts:76](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/column.ts#L76)
