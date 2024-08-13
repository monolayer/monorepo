[monolayer-monorepo](../../index.md) / [pg](../index.md) / bigint

# Function: bigint()

> **bigint**(): [`PgBigInt`](../classes/PgBigInt.md)

Column that stores whole numbers.

## Returns

[`PgBigInt`](../classes/PgBigInt.md)

## Remarks

Range: -9223372036854775808 to +9223372036854775807.

**Kysely database schema type definition**
```ts
{
  readonly __select__: string | null;
  readonly __insert__: bigint | number | string | null | undefined;
  readonly __update__: bigint | number | string | null;
};
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

**Zod Schema**

*Types:*
```ts
{
  input?: bigint | number | string | null | undefined;
  output?: string | null | undefined;
}
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

*Validations:*
- Explicit `undefined` values are rejected.
- Value must be a valid `bigint`.
- Value cannot be lower than -9223372036854775808.
- Value cannot be greater than 9223372036854775807.

## Example

```ts
import { bigint, schema, table } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";

const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        id: bigint(),
      },
    }),
  },
});

// Kysely database schema type
type DB = typeof dbSchema.infer;
// Zod Schema
const schema = zodSchema(dbSchema.tables.example);
```

## See

*PostgreSQL Docs*: [bigint](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-INT)

## Defined in

[../internal/pg/src/schema/column/data-types/bigint.ts:61](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/bigint.ts#L61)
