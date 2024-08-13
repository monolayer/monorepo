[monolayer-monorepo](../../index.md) / [pg](../index.md) / bytea

# Function: bytea()

> **bytea**(): [`PgBytea`](../classes/PgBytea.md)

Column that stores binary strings.

## Returns

[`PgBytea`](../classes/PgBytea.md)

## Remarks

**Kysely database schema type definition**
```ts
{
  readonly __select__: Buffer | null;
  readonly __insert__: Buffer | string | null | undefined;
  readonly __update__: Buffer | string | null;
};
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

**Zod Schema**

*Types:*
```ts
{
  input?: Buffer | string | null | undefined;
  output?: Buffer | string | null | undefined;
}
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

*Validations:*
- Explicit `undefined` values are rejected.
- Value must be a `Buffer`, `string`, or `null`.

*Note*: Since [Buffer](https://nodejs.org/api/buffer.html) is a Node.js API, the schema will not coerce the input to Buffer for browser compatibility.

## Example

```ts
import { schema, table, bytea } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";

const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        image: bytea(),
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

*PostgreSQL Docs*: [bytea](https://www.postgresql.org/docs/current/datatype-binary.html#DATATYPE-BINARY)

## Defined in

[../internal/pg/src/schema/column/data-types/bytea.ts:58](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/bytea.ts#L58)
