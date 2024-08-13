[monolayer-monorepo](../../index.md) / [pg](../index.md) / PgBigInt

# Class: PgBigInt

## Extends

- `IdentifiableColumn`\<`string`, `number` \| `bigint` \| `string`\>

## Methods

### default()

> **default**(`value`): [`PgBigInt`](PgBigInt.md) & `WithDefaultColumn`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` \| `number` \| `bigint` \| `Expression`\<`unknown`\> |

#### Returns

[`PgBigInt`](PgBigInt.md) & `WithDefaultColumn`

#### Inherited from

`IdentifiableColumn.default`

#### Defined in

[../internal/pg/src/schema/column/column.ts:81](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/column.ts#L81)

***

### generatedAlwaysAsIdentity()

> **generatedAlwaysAsIdentity**(): [`PgBigInt`](PgBigInt.md) & `GeneratedAlwaysColumn`

#### Returns

[`PgBigInt`](PgBigInt.md) & `GeneratedAlwaysColumn`

#### Inherited from

`IdentifiableColumn.generatedAlwaysAsIdentity`

#### Defined in

[../internal/pg/src/schema/column/column.ts:143](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/column.ts#L143)

***

### generatedByDefaultAsIdentity()

> **generatedByDefaultAsIdentity**(): [`PgBigInt`](PgBigInt.md) & `GeneratedColumn`

#### Returns

[`PgBigInt`](PgBigInt.md) & `GeneratedColumn`

#### Inherited from

`IdentifiableColumn.generatedByDefaultAsIdentity`

#### Defined in

[../internal/pg/src/schema/column/column.ts:137](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/column.ts#L137)

***

### notNull()

> **notNull**(): [`PgBigInt`](PgBigInt.md) & `NonNullableColumn`

Adds a not null constraint to the column.

The column is not allowed to contain null values.

#### Returns

[`PgBigInt`](PgBigInt.md) & `NonNullableColumn`

#### See

PostgreSQL Docs: [Not-Null Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-NOT-NULL)

#### Inherited from

`IdentifiableColumn.notNull`

#### Defined in

[../internal/pg/src/schema/column/column.ts:76](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/column.ts#L76)
