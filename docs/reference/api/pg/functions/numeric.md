[monolayer-monorepo](../../index.md) / [pg](../index.md) / numeric

# Function: numeric()

> **numeric**(`precision`?, `scale`?): [`PgNumeric`](../classes/PgNumeric.md)

Column that can store numbers with a very large number of digits.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `precision`? | `number` | Total count of significant digits in the whole number (number of digits to both sides of the decimal point). Must be positive. |
| `scale`? | `number` | Count of decimal digits in the fractional part, to the right of the decimal point. Can be positive or negative. |

## Returns

[`PgNumeric`](../classes/PgNumeric.md)

## Remarks

Without any precision or scale numeric values of any length can be stored, up to the implementation limits.

In addition to ordinary numeric values, it can store several special values:
* Infinity
* -Infinity
* NaN

**Kysely database schema type definition**
```ts
{
  readonly __select__: string | null;
  readonly __insert__: bigint | number | string | null | undefined;
  readonly __update__: bigint | number | string | string | null;
};
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

**Zod Schema**

*Types:*
```ts
{
  input?:  bigint | number | string | null | undefined;
  output?: string | null | undefined;
}
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

*Validations:*
- Explicit `undefined` values are rejected.
- Input value must be `bigint`, `number`, `string`, or `null`.
- Non-null values must be either:
  - Coercible to a number.
  - NaN, Infinity, -Infinity
- Precision and scale are enforced when specified.

## Example

```ts
import { schema, numeric, table } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";

const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        amount: numeric(),
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

[numeric](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-NUMERIC) (*PostgreSQL Docs*)

## Defined in

[../internal/pg/src/schema/column/data-types/numeric.ts:69](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/numeric.ts#L69)
