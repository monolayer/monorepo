[monolayer-monorepo](../../index.md) / [pg](../index.md) / json

# Function: json()

> **json**\<`T`\>(): [`PgJson`](../classes/PgJson.md)\<`T`, `T`\>

Column that stores JSON data.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `JsonValue` | `JsonValue` |

## Returns

[`PgJson`](../classes/PgJson.md)\<`T`, `T`\>

## Remarks

Data stored is an exact copy of the input text and processing functions must reparse on each execution.

Does not support indexing.

**Kysely database schema type definition**
```ts
type JsonArray = JsonValue[];
type JsonValue = boolean | number | string | Record<string, any> | JsonArray;
{
  readonly __select__: JsonValue | null;
  readonly __insert__: JsonValue | null | undefined;
  readonly __update__: JsonValue | null;
};
```

Nullability and optionality will change according to the column's constraints, generated values, and default data values.

You can customize the data type of the column by providing a type argument to the `json` function.

**Warning**: the Zod schema for a `json` column only validates that data can be conforms to the `JsonValue` type.
When using a custom data type you shoud adapt it. See examples.

**Zod Schema**

*Types:*
```ts
// type JsonArray = JsonValue[];
// type JsonValue = boolean | number | string | Record<string, any> | JsonArray;
{
  input?: JsonValue | null | undefined;
  output?: JsonValue | null | undefined;
}
```

Nullability and optionality will change according to the column's constraints, generated values, and default data values.

*Validations:*
- Explicit `undefined` values are rejected.
- Input values must be `JsonValue` or `null`.
- String values must be valid JSON.
- Record values must be convertible to a JSON string.

## Example

*Default Data Type*
```ts
import { json, schema, table } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";

const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        document: json(),
      },
    }),
  },
});

// Kysely database schema type
type DB = typeof dbSchema.infer;
// Zod Schema
const schema = zodSchema(database.tables.example);
```

*Custom Data Example*
```ts
import { json, schema, table } from "monolayer/pg";
import { zodSchema } from "monolayer/zod";

type Data = { count: number; name: string  };

const dbSchema = schema({
  tables: {
    example: table({
      columns: {
        info: json<Data>(),
      },
    }),
  },
});

// Kysely database schema type
type DB = typeof dbSchema.infer;

// Zod Schema
const schemaShape = zodSchema(database.tables.example).shape;
const schema = z.object({
  ...schemaShape,
  info: schemaShape.id.superRefine((data, ctx) => {
    const objectKeys = Object.keys(data).sort();
    if (
      objectKeys.length !== 2 ||
      objectKeys[0] !== "count" ||
      typeof objectKeys[0] !== "number" ||
      objectKeys[1] !== "name"
      typeof objectKeys[1] !== "string" ||
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid data",
      });
    }
    return z.NEVER;
  }),
});
```

## See

*PostgreSQL Docs*: [json](https://www.postgresql.org/docs/current/datatype-json.html#DATATYPE-JSON)

## Defined in

[../internal/pg/src/schema/column/data-types/json.ts:128](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/column/data-types/json.ts#L128)
