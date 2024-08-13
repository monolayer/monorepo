[monolayer-monorepo](../../index.md) / [pg](../index.md) / PgInteger

# Class: PgInteger

## Extends

- `IdentifiableColumn`\<`number`, `number` \| `string`\>

## Methods

### default()

> **default**(`value`): [`PgInteger`](PgInteger.md) & `WithDefaultColumn`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` \| `number` \| `Expression`\<`unknown`\> |

#### Returns

[`PgInteger`](PgInteger.md) & `WithDefaultColumn`

#### Overrides

`IdentifiableColumn.default`

#### Defined in

[../internal/pg/src/schema/column/data-types/integer.ts:84](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/integer.ts#L84)

***

### generatedAlwaysAsIdentity()

> **generatedAlwaysAsIdentity**(): [`PgInteger`](PgInteger.md) & `GeneratedAlwaysColumn`

#### Returns

[`PgInteger`](PgInteger.md) & `GeneratedAlwaysColumn`

#### Inherited from

`IdentifiableColumn.generatedAlwaysAsIdentity`

#### Defined in

[../internal/pg/src/schema/column/column.ts:143](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/column.ts#L143)

***

### generatedByDefaultAsIdentity()

> **generatedByDefaultAsIdentity**(): [`PgInteger`](PgInteger.md) & `GeneratedColumn`

#### Returns

[`PgInteger`](PgInteger.md) & `GeneratedColumn`

#### Inherited from

`IdentifiableColumn.generatedByDefaultAsIdentity`

#### Defined in

[../internal/pg/src/schema/column/column.ts:137](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/column.ts#L137)

***

### notNull()

> **notNull**(): [`PgInteger`](PgInteger.md) & `NonNullableColumn`

Adds a not null constraint to the column.

The column is not allowed to contain null values.

#### Returns

[`PgInteger`](PgInteger.md) & `NonNullableColumn`

#### See

PostgreSQL Docs: [Not-Null Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-NOT-NULL)

#### Inherited from

`IdentifiableColumn.notNull`

#### Defined in

[../internal/pg/src/schema/column/column.ts:76](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/column.ts#L76)
