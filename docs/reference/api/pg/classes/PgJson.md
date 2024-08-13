[monolayer-monorepo](../../index.md) / [pg](../index.md) / PgJson

# Class: PgJson\<S, I\>

## Extends

- `PgColumn`\<`S`, `I`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `S` *extends* `JsonValue` | `JsonValue` |
| `I` | `S` |

## Methods

### default()

> **default**(`value`): [`PgJson`](PgJson.md)\<`S`, `I`\> & `WithDefaultColumn`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `Expression`\<`unknown`\> \| `I` |

#### Returns

[`PgJson`](PgJson.md)\<`S`, `I`\> & `WithDefaultColumn`

#### Overrides

`PgColumn.default`

#### Defined in

[../internal/pg/src/schema/column/data-types/json.ts:156](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/json.ts#L156)

***

### notNull()

> **notNull**(): [`PgJson`](PgJson.md)\<`S`, `I`\> & `NonNullableColumn`

Adds a not null constraint to the column.

The column is not allowed to contain null values.

#### Returns

[`PgJson`](PgJson.md)\<`S`, `I`\> & `NonNullableColumn`

#### See

PostgreSQL Docs: [Not-Null Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-NOT-NULL)

#### Inherited from

`PgColumn.notNull`

#### Defined in

[../internal/pg/src/schema/column/column.ts:76](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/column.ts#L76)
