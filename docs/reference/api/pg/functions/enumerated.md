[monolayer-monorepo](../../index.md) / [pg](../index.md) / enumerated

# Function: enumerated()

> **enumerated**\<`Value`\>(`enumerated`): `PgEnum`\<`Value`\>

Column that stores a static, ordered set of values.

## Type Parameters

| Type Parameter |
| ------ |
| `Value` *extends* `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `enumerated` | [`EnumType`](../classes/EnumType.md)\<`Value`\> |

## Returns

`PgEnum`\<`Value`\>

## Remarks

**Kysely database schema type definition**
```ts
const role = enumType("role", ["admin", "user"]);
const roleColumn = enumerated(role);
type RoleColumn = {
  readonly __select__: "admin" | "user" | null;
  readonly __insert__: "admin" | "user" | null | undefined;
  readonly __update__: "admin" | "user" | null;
};
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

**Zod Schema**

*Types:*
```ts
// enumType("role", ["admin", "user"]);
{
  input?: "admin" | "user" | null | undefined;
  output?: "admin" | "user" | null | undefined;
}
```
Nullability and optionality will change according to the column's constraints, generated values, and default data values.

*Validations:*
- Explicit `undefined` values are rejected.
- Input values must be an enum value, or `null`.

## Example

```ts
import { enumerated, enumType, schema, table } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";

const role = enumType("role", ["admin", "user"]);
const dbSchema = schema({
  types: [role],
  tables: {
    example: table({
      columns: {
        role: enumerated(role),
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

*PostgreSQL Docs*: [enumerated types](https://www.postgresql.org/docs/current/datatype-enum.html#DATATYPE-ENUM)

## Defined in

[../internal/pg/src/schema/column/data-types/enumerated.ts:63](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/enumerated.ts#L63)
