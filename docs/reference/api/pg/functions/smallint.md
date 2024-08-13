[monolayer-monorepo](../../index.md) / [pg](../index.md) / smallint

# Function: smallint()

> **smallint**(): [`PgSmallint`](../classes/PgSmallint.md)

Column that stores small-range integers.

## Returns

[`PgSmallint`](../classes/PgSmallint.md)

## Remarks

Range: -32768 to +32767.

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
  input?:  number | string | null | undefined;
  output?: number | null | undefined;
}
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

*Validations:*
- Input value must be `number`, `string`, or `null`.
- Non-null values:
  - must be coercible to `number`.
  - Cannot be lower than -32768.
  - Cannot be greater than 32767.

## Example

```ts
import { schema, smallint, table } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";

const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        id: smallint(),
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

[smallint](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-INT) (*PostgreSQL Docs*)

## Defined in

[../internal/pg/src/schema/column/data-types/smallint.ts:61](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/smallint.ts#L61)
