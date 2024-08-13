[monolayer-monorepo](../../index.md) / [pg](../index.md) / foreignKey

# Function: foreignKey()

## foreignKey(columns, targetColumns)

> **foreignKey**\<`T`, `C`\>(`columns`, `targetColumns`): [`PgForeignKey`](../classes/PgForeignKey.md)\<`T`, `C`\>

Defines a foreign key constraint on a column or a group of columns.

Values in the column (or a group of columns) must match the values appearing in some row of another table,
maintaining referential integrity between two related tables.

### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `string` |
| `C` *extends* `AnyPgTable` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `columns` | `T`[] | The column or a group of columns that will be constrained by the foreign key. |
| `targetColumns` | `T`[] | The column or a group of columns in the target table that the foreign key references. |

### Returns

[`PgForeignKey`](../classes/PgForeignKey.md)\<`T`, `C`\>

### Example

```ts
import { integer, schema, table } from "monolayer/pg";

const users = table({
 columns: {
   id: integer().generatedAlwaysAsIdentity(),
 },
});

const documents = table({
  columns: {
    id: integer().generatedAlwaysAsIdentity(),
    userId: integer(),
  },
  constraints: {
    foreignKey: foreignKey(["userId"], users, ["id"]),
  },
});

const dbSchema = schema({
  tables: {
    users,
    documents,
  },
});
```

You can also create self-referential foreign keys, by ommiting the target table:

```ts
import { integer, schema, table } from "monolayer/pg";

const tree = table({
  columns: {
    nodeId: integer().generatedAlwaysAsIdentity(),
    parentId: integer(),
  },
  constraints: {
    foreignKey: foreignKey(["parentId"], ["nodeId"]),
  },
});

const dbSchema = schema({
  tables: {
    users,
    documents,
  },
});
```

### See

*PostgreSQL docs*: [Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)

### Defined in

[../internal/pg/src/schema/foreign-key.ts:66](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/foreign-key.ts#L66)

## foreignKey(columns, targetTable, targetColumns)

> **foreignKey**\<`T`, `C`\>(`columns`, `targetTable`, `targetColumns`): [`PgForeignKey`](../classes/PgForeignKey.md)\<`T`, `C`\>

### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `string` |
| `C` *extends* `AnyPgTable` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `columns` | `T`[] | The column or a group of columns that will be constrained by the foreign key. |
| `targetTable` | `C` | The target table that the foreign key references. |
| `targetColumns` | `C` *extends* [`PgTable`](../classes/PgTable.md)\<`U`, `any`\> ? keyof `U`[] : `never` | The column or a group of columns in the target table that the foreign key references. |

### Returns

[`PgForeignKey`](../classes/PgForeignKey.md)\<`T`, `C`\>

### Defined in

[../internal/pg/src/schema/foreign-key.ts:76](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/foreign-key.ts#L76)
