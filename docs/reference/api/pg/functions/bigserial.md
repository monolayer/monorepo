[monolayer-monorepo](../../index.md) / [pg](../index.md) / bigserial

# Function: bigserial()

> **bigserial**(): [`PgBigSerial`](../classes/PgBigSerial.md)

Unique identifier column.

## Returns

[`PgBigSerial`](../classes/PgBigSerial.md)

## Remarks

Not a true native PostgreSQL data type. A `bigserial` column is a column that has:
- a `bigint` data type.
- default values assigned from a sequence generator.
- a `NOT NULL` constraint.

**Kysely database schema type definition**
```ts
{
  readonly __select__: string;
  readonly __insert__: bigint | number | string | undefined;
  readonly __update__: bigint | number | string;
};
```
**Zod Schema**

*Types:*
```ts
{
  input?: bigint | number | string | undefined;
  output?: string | undefined;
}
```
*Validations:*
- Explicit `undefined` values are rejected.
- Value must be a valid `bigint`.
- Value cannot be lower than -9223372036854775808.
- Value cannot be greater than 9223372036854775807.

## Example

```ts
import { bigserial, schema, table } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";

const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        id: bigserial(),
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

*PostgreSQL Docs*: [bigserial](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-SERIAL)

## Defined in

[../internal/pg/src/schema/column/data-types/bigserial.ts:61](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/bigserial.ts#L61)
