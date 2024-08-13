[monolayer-monorepo](../../index.md) / [pg](../index.md) / characterVarying

# Function: characterVarying()

> **characterVarying**(`maximumLength`?): [`PgCharacterVarying`](../classes/PgCharacterVarying.md)

Column that stores variable-length string with an optional maximum length.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `maximumLength`? | `number` | Maximum character length of strings in the column. Must be greater than zero and cannot exceed 10,485,760. |

## Returns

[`PgCharacterVarying`](../classes/PgCharacterVarying.md)

## Remarks

Without a `maximumLength` specified, the column accepts strings of any length.
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
- Value must be a `string` or `null`.
- Value cannot exceed `maximumLength` (when specified).

## Example

```ts
import { characteVarying, schema, table } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";

const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        name: characteVarying(),
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

*PostgreSQL Docs*: [character varying](https://www.postgresql.org/docs/current/datatype-character.html#DATATYPE-CHARACTER)

## Defined in

[../internal/pg/src/schema/column/data-types/character-varying.ts:60](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/character-varying.ts#L60)
