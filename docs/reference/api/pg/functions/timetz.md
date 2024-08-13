[monolayer-monorepo](../../index.md) / [pg](../index.md) / timetz

# Function: timetz()

> **timetz**(`precision`?): [`PgTimeWithTimeZone`](../classes/PgTimeWithTimeZone.md)

Column that stores times of day (no date) with time zone.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `precision`? | `DateTimePrecision` | Number of fractional digits retained in the seconds field. The allowed range is from 0 to 6. |

## Returns

[`PgTimeWithTimeZone`](../classes/PgTimeWithTimeZone.md)

## Remarks

Without `precision` specified, there is no explicit bound on precision.

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
  input?:  string | null | undefined;
  output?: string | null | undefined;
}
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

*Validations:*
- Explicit `undefined` values are rejected.
- Input value must be `string`, or `null`.
- Non-values must be a valid string that matches a time format.

## Example

```ts
import { schema, table, timetz } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";

const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        start: timetz(),
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

[time with time zone](https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME) (*PostgreSQL Docs*)

## Defined in

[../internal/pg/src/schema/column/data-types/time-with-time-zone.ts:122](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/time-with-time-zone.ts#L122)
