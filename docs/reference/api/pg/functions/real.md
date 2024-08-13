[monolayer-monorepo](../../index.md) / [pg](../index.md) / real

# Function: real()

> **real**(): [`PgReal`](../classes/PgReal.md)

Column that stores inexact, variable-precision numeric types.

## Returns

[`PgReal`](../classes/PgReal.md)

## Remarks

Range: around 1E-37 to 1E+37 with a precision of at least 15 digits.

Inexact means that some values cannot be converted exactly to the internal format and are stored as approximations,
so that storing and retrieving a value might show slight discrepancies.

In addition to ordinary numeric values, the floating-point types have several special values:
- `Infinity`
- `-Infinity`
- `NaN`

**Kysely database schema type definition**
```ts
{
  readonly __select__: number | null;
  readonly __insert__: number | string | null | undefined;
  readonly __update__: number | null;
};
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

**Zod Schema**

*Types:*
```ts
{
  input?:  bigint | number | string | null | undefined;
  output?: number | null | undefined;
}
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

*Validations:*
- Explicit `undefined` values are rejected.
- Input value must be `number`, `string`, or `null`.
- Non-null values must be either:
  - coercible to `number`.
  - `NaN`, `Infinity`, or `-Infinity`.
- `number` values:
  - Cannot be lower than -1e37.
  - Cannot be greater than 1e37.

## Example

```ts
import { schema, real, table } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";

const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        number: real(),
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

*PostgreSQL Docs*: [real](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-FLOAT)

## Defined in

[../internal/pg/src/schema/column/data-types/real.ts:73](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/real.ts#L73)
