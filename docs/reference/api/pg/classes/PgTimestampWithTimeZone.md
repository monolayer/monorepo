[monolayer-monorepo](../../index.md) / [pg](../index.md) / PgTimestampWithTimeZone

# Class: PgTimestampWithTimeZone

## Extends

- `PgColumn`\<`Date`, `Date` \| `string`\>

## Methods

### default()

> **default**(`value`): [`PgTimestampWithTimeZone`](PgTimestampWithTimeZone.md) & `WithDefaultColumn`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` \| `Expression`\<`unknown`\> \| `Date` |

#### Returns

[`PgTimestampWithTimeZone`](PgTimestampWithTimeZone.md) & `WithDefaultColumn`

#### Inherited from

`PgColumn.default`

#### Defined in

[../internal/pg/src/schema/column/column.ts:81](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/column.ts#L81)

***

### notNull()

> **notNull**(): [`PgTimestampWithTimeZone`](PgTimestampWithTimeZone.md) & `NonNullableColumn`

Adds a not null constraint to the column.

The column is not allowed to contain null values.

#### Returns

[`PgTimestampWithTimeZone`](PgTimestampWithTimeZone.md) & `NonNullableColumn`

#### See

PostgreSQL Docs: [Not-Null Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-NOT-NULL)

#### Inherited from

`PgColumn.notNull`

#### Defined in

[../internal/pg/src/schema/column/column.ts:76](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/column.ts#L76)
