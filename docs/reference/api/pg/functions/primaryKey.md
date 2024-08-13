[monolayer-monorepo](../../index.md) / [pg](../index.md) / primaryKey

# Function: primaryKey()

> **primaryKey**\<`T`, `PK`\>(`columns`): [`PgPrimaryKey`](../classes/PgPrimaryKey.md)\<`T` \| `PK`, `T` \| `PK`\>

Defines a column or a group of columns, that can be used as a unique identifier for rows in the table.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `string` |
| `PK` *extends* `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `columns` | (`T` \| `PK`)[] |

## Returns

[`PgPrimaryKey`](../classes/PgPrimaryKey.md)\<`T` \| `PK`, `T` \| `PK`\>

## Remarks

A primary key constraint is a special case of a unique contraint that also guarantees that all of the attributes
within the primary key do not have null values.

A table can have at most one primary key.

## Example

```ts
import { integer, schema, table } from "monolayer/pg";

const dbSchema = schema({
  tables: {
    documents: table({
      columns: {
        id: integer().generatedAlwasyAsIdentity(),
      },
      constraints: {
        primaryKey: primaryKey(["id"]),
      },
    }),
  },
});
```

## See

*PostgreSQL docs*: [Primary Keys](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-PRIMARY-KEYS)

## Defined in

[../internal/pg/src/schema/primary-key.ts:35](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/primary-key.ts#L35)
