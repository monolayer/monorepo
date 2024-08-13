[monolayer-monorepo](../../index.md) / [pg](../index.md) / xml

# Function: xml()

> **xml**(): [`PgXML`](../classes/PgXML.md)

Column that stores XML data.

## Returns

[`PgXML`](../classes/PgXML.md)

## Remarks

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
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

*Validations:*
- Explicit `undefined` values are rejected.
- Input value must be `string`, or `null`.

## Example

```ts
import { schema, table, xml } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";

const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        doc: xml(),
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

*PostgreSQL Docs*: [xml](https://www.postgresql.org/docs/current/datatype-xml.html#DATATYPE-XML)

## Defined in

[../internal/pg/src/schema/column/data-types/xml.ts:56](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/xml.ts#L56)
