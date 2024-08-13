[monolayer-monorepo](../../index.md) / [pg](../index.md) / character

# Function: character()

> **character**(`maximumLength`?): [`PgCharacter`](../classes/PgCharacter.md)

Column that stores a fixed-length, blank-padded string of up to `maximumLength` characters.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `maximumLength`? | `number` | Maximum character length of strings in the column. Must be greater than zero and cannot exceed 10,485,760. Default: 1. |

## Returns

[`PgCharacter`](../classes/PgCharacter.md)

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
- Value must be a `string` or `null`.
- String values cannot exceed `maximumLength`.

## Example

```ts
import { char, schema, table } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";

const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        description: char(30),
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

*PostgreSQL Docs*: [character](https://www.postgresql.org/docs/current/datatype-character.html#DATATYPE-CHARACTER)

## Defined in

[../internal/pg/src/schema/column/data-types/character.ts:58](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/character.ts#L58)
