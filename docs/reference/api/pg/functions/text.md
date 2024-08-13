[monolayer-monorepo](../../index.md) / [pg](../index.md) / text

# Function: text()

> **text**(): [`PgText`](../classes/PgText.md)

Column that stores variable unlimited length strings.

## Returns

[`PgText`](../classes/PgText.md)

## Remarks

In any case, the longest possible character string that can be stored is about 1 GB.

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
- Input value must be `string` or `null`.

## Example

```ts
import { schema, table, text } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";

const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        description: text(),
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

*PostgreSQL Docs*: [text](https://www.postgresql.org/docs/current/datatype-character.html#DATATYPE-CHARACTER)

## Defined in

[../internal/pg/src/schema/column/data-types/text.ts:58](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/text.ts#L58)
