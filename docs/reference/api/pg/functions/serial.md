[monolayer-monorepo](../../index.md) / [pg](../index.md) / serial

# Function: serial()

> **serial**(): [`PgSerial`](../classes/PgSerial.md)

Unique identifier column.

## Returns

[`PgSerial`](../classes/PgSerial.md)

## Remarks

Not a true native PostgreSQL data type. A `serial` column is a column that has:
- an `integer` data type.
- default values assigned from a sequence generator.
- a `NOT NULL` constraint.

**Kysely database schema type definition**
```ts
{
  readonly __select__: number;
  readonly __insert__: number | string | undefined;
  readonly __update__: number | string;
};
```
**Zod Schema**

*Types:*
```ts
{
  input?: number | string | undefined;
  output?: number | undefined;
}
```
*Validations:*
- Explicit `undefined` values are rejected.
- Value must be a valid `number`.
- Value cannot be lower than -2147483648.
- Value cannot be greater than 2147483647.

## Example

```ts
import { schema, serial, table  } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";

const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        id: serial(),
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

*PostgreSQL Docs*: [serial](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-SERIAL)

## Defined in

[../internal/pg/src/schema/column/data-types/serial.ts:59](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/serial.ts#L59)
