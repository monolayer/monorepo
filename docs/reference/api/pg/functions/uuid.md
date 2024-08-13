[monolayer-monorepo](../../index.md) / [pg](../index.md) / uuid

# Function: uuid()

> **uuid**(): [`PgUuid`](../classes/PgUuid.md)

Column that stores Universally Unique Identifiers (UUID).

## Returns

[`PgUuid`](../classes/PgUuid.md)

## Remarks

**Kysely database schema type definition**
```ts
{
  readonly __select__: string | null;
  readonly __insert__: string | null | undefined;
  readonly __update__: string | null;
};
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

**Zod Schema**

*Types:*
```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

*Validations:*
- Explicit `undefined` values are rejected.
- Input value must be `string`, or `null`.
- String values must be a valid UUID.

## Example

```ts
import { uuid, schema, sql, table } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";

const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        id: uuid().default(sql`gen_random_uuid()`),
      },
    }),
  },
});

// Kysely database schema type
type DB = typeof dbSchema.infer;
// Zod Schema
const schema = zodSchema(database.tables.example);
```

## See

*PostgreSQL Docs*: [uuid](https://www.postgresql.org/docs/current/datatype-uuid.html#DATATYPE-UUID)

## Defined in

[../internal/pg/src/schema/column/data-types/uuid.ts:57](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/uuid.ts#L57)
