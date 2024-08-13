[monolayer-monorepo](../../index.md) / [pg](../index.md) / integer

# Function: integer()

> **integer**(): [`PgInteger`](../classes/PgInteger.md)

Column that stores whole numbers.

## Returns

[`PgInteger`](../classes/PgInteger.md)

## Remarks

Range: -2147483648 to +2147483647.
**Kysely database schema type definition**
```ts
{
  readonly __select__: number | null;
  readonly __insert__: number | string | null | undefined;
  readonly __update__: number | string | null;
};
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

**Zod Schema**

*Types:*
```ts
{
  input?: number | string | null | undefined;
  output?: number | null | undefined;
}
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

*Validations:*
- Input value must be `number`, `string`, or `null`.
- Non-null values must be:
  - Coercible to `number`.
  - Greater or equal than -2147483648.
  - Less than 2147483647.

## Example

```ts
import { integer, schema, table } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";

const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        id: integer(),
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

*PostgreSQL Docs*: [integer](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-INT)

## Defined in

[../internal/pg/src/schema/column/data-types/integer.ts:68](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/integer.ts#L68)
