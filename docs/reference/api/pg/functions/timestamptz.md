[monolayer-monorepo](../../index.md) / [pg](../index.md) / timestamptz

# Function: timestamptz()

> **timestamptz**(`precision`?): [`PgTimestampWithTimeZone`](../classes/PgTimestampWithTimeZone.md)

Column that stores both date and time with time zone with an optional precision.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `precision`? | `DateTimePrecision` | Number of fractional digits retained in the seconds field. The allowed range is from 0 to 6. |

## Returns

[`PgTimestampWithTimeZone`](../classes/PgTimestampWithTimeZone.md)

## Remarks

Without `precision` specified, there is no explicit bound on precision.
It can store date / times between 4713 BC and 294276 AD.

The JavaScript [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#the_epoch_timestamps_and_invalid_date) implementation
can represent only a maximum of September 13, 275760 AD.
If you need to read/store dates after this maximum, you'll have to implement a custom type
serializer and parser with [node-pg-types](https://github.com/brianc/node-pg-types).

**Kysely database schema type definition**
```ts
{
  readonly __select__: Date | null;
  readonly __insert__: Date | string | null | undefined;
  readonly __update__: Date | string | null;
};
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

**Zod Schema**

*Types:*
```ts
{
  input?:  Date | string | null | undefined;
  output?: Date | null | undefined;
}
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

*Validations:*
- Explicit `undefined` values are rejected.
- Input value must be `Date`, `string`, or `null`.
- Non-null values must be:
  - Coercible to a `Date`.
  - Date must be 4713 BC or later.

## Example

```ts
import { schema, table, timestamptz } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";

const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        createdAt: timestamptz(),
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

[timestamp without time zone](https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME) (*PostgreSQL Docs*)

## Defined in

[../internal/pg/src/schema/column/data-types/timestamp-with-time-zone.ts:138](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/timestamp-with-time-zone.ts#L138)
