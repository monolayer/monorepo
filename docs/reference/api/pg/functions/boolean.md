[monolayer-monorepo](../../index.md) / [pg](../index.md) / boolean

# Function: boolean()

> **boolean**(): [`PgBoolean`](../classes/PgBoolean.md)

Column that stores booleans.

## Returns

[`PgBoolean`](../classes/PgBoolean.md)

## Remarks

Can have several states: "true", "false", or "unknown" (represented by null).

**Kysely database schema type definition**
```ts
type Boolish = "true" | "false" | "yes" | "no" | 1 | 0 | "1" | "0" | "on" | "off";
{
  readonly __select__: boolean | null;
  readonly __insert__: boolean | Boolish | null | undefined;
  readonly __update__: boolean | Boolish | null;
};
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

**Zod Schema**

*Types:*
```ts
{
  input?: boolean | Boolish | null | undefined;
  output?: boolean | null | undefined;
}
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

*Validations:*
- Explicit `undefined` values are rejected.
- Value must be `boolean` or `Boolish`.

## Example

```ts
import { boolean, schema, table } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";

const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        active: boolean(),
      },
    }),
  },
});
```

// Kysely database schema type
type DB = typeof dbSchema.infer;
// Zod Schema
const schema = zodSchema(database.tables.example);

## See

*PostgreSQL native data type*: [boolean](https://www.postgresql.org/docs/current/datatype-boolean.html#DATATYPE-BOOLEAN)

## Defined in

[../internal/pg/src/schema/column/data-types/boolean.ts:59](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/boolean.ts#L59)
