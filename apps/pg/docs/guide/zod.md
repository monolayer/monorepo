---
aside: true
---

# Zod Schemas

You can generate `Zod` schemas for tables declared with `@monolayer/pg` with the  [`zodSchema`](./../reference/api//schema/functions/zodSchema.md) function before inserting or updating data to the database.

The Zod schemas will take into account:

- The data type of the column.
- The column nullability and its default value.
- Whether the column is a primary key or generated.
- Specific column data type validations that match validations at database level. For example, the range of an `integer` column is: -2147483648 to +2147483647.

## Validating Schemas

```ts
import {
  enumType,
  enumerated,
  integer,
  primaryKey,
  table,
  text,
  timestampWithTimeZone
} from "@monolayer/pg/schema"
import { zodSchema } from "@monolayer/pg/zod"
import { sql } from "kysely";
import z from "zod";

// `users` table
const userRole = enumType("user_role", ["admin", "user"]);
const users = table({
  columns: {
    id: integer().generatedAlwaysAsIdentity(),
    name: text(),
    email: text().notNull(),
    role: enumerated(userRole).notNull(),
    createdAt: timestampWithTimeZone().default(sql`now`).notNull(),
  },
  constraints: {
    primaryKey: primaryKey(["id"]),
  },
});

// Zod Schema for `users`
const schema = zodSchema(users);

// Usage
const user = schema.parse({
  name: "John Smith",
  email: 'john@smith.com',
  role: 'admin',
});

type InputType = z.input<typeof schema>;
//{
//   id: never;
//   name?: string | null | undefined;
//   email: string;
//   role: "user" | "admin";
//   createdAt?: Date | string | undefined;
//}

type OutputType = z.output<typeof schema>;
//{
//   id: never;
//   name?: string | null | undefined;
//   email: string;
//   role: "user" | "admin";
//   createdAt?: Date | undefined;
// }

```

## Extending Schemas

You can use the `Zod` API to customize schemas.

### Example

Adding an email validation to the `email` column in the `users` table from the [previous example](#validating-schemas):

```ts
const schemaWithEmailValidation = zodSchema(users).extend({
  email: schema.shape.email.pipe(z.string().email())
})

type InputTypeEmail = z.input<typeof schemaWithEmailValidation>;
//{
//   id: never;
//   name: string;
//   email: string;
//   role: "user" | "admin";
//   createdAt?: Date | string | undefined;
//}
type OutputTypeEmail = z.output<typeof schemaWithEmailValidation>;
//{
//   id: never;
//   name: string;
//   email: string;
//   role: "user" | "admin";
//   createdAt?: Date | undefined;
// }
```

See: [Zod Objects](https://zod.dev/?id=objects)

## Default input and output types

Each column data type has input and output types in the generated schema:

| Column                | Input                                                           | Output|
| :---                  | :----:                                                          | :----:|
| bigint                | `bigint` &#124; `number` &#124; `string` &#124; `null` &#124; `undefined`| `string` &#124; `null` &#124; `undefined` &#160;|
| bigserial             | `bigint` &#124; `number` &#124; `string`| `string`|
| bit                   | `string` &#124; `null` &#124; `undefined` | `string` &#124; `null` &#124; `undefined` |
| bitVarying            | `string` &#124; `null` &#124; `undefined` | `string` &#124; `null` &#124; `undefined` |
| boolean               | `boolean` &#124; `Boolish`&#124; `null` &#124; `undefined` | `boolean` &#124; `null` &#124; `undefined` |
| bytea                 | `Buffer` &#124; `string` &#124; `null` &#124; `undefined` | `Buffer` &#124; `string` &#124; `null` &#124; `undefined` |
| characterVarying      | `string` &#124; `null` &#124; `undefined` | `string` &#124; `null` &#124; `undefined` |
| character             | `string` &#124; `null` &#124; `undefined` | `string` &#124; `null` &#124; `undefined` |
| cidr                  | `string` &#124; `null` &#124; `undefined` | `string` &#124; `null` &#124; `undefined` |
| date                  | `Date` &#124; `string` &#124; `null` &#124; `undefined` | `Date` &#124; `null` &#124; `undefined` |
| doublePrecision       | `bigint` &#124; `number` &#124; `string` &#124; `null` &#124; `undefined` | `string` &#124; `null` &#124; `undefined` |
| enumerated            | enum values &#124; `null` &#124; `undefined` | enum values &#124; `null` &#124; `undefined` |
| inet                  | `string` &#124; `null` &#124; `undefined` | `string` &#124; `null` &#124; `undefined` |
| integer               | `number` &#124; `string` &#124; `null` &#124; `undefined` | `number` &#124; `null` &#124; `undefined` |
| json                  | `JsonValue`&#124; `null` &#124; `undefined` | `JsonValue`&#124; `null` &#124; `undefined` |
| jsonb                 | `JsonValue`&#124; `null` &#124; `undefined` | `JsonValue`&#124; `null` &#124; `undefined` |
| macaddr               | `string` &#124; `null` &#124; `undefined` | `string` &#124; `null` &#124; `undefined` |
| macaddr8              | `string` &#124; `null` &#124; `undefined` | `string` &#124; `null` &#124; `undefined` |
| numeric               | `bigint` &#124; `number` &#124; `string` &#124; `null` &#124; `undefined` | `number` &#124; `null` &#124; `undefined` |
| real                  | `bigint` &#124; `number` &#124; `string` &#124; `null` &#124; `undefined` | `string` &#124; `null` &#124; `undefined` |
| serial                | `number` &#124; `string`| `number`|
| smallint              | `number` &#124; `string` &#124; `null` &#124; `undefined` | `number` &#124; `null` &#124; `undefined` |
| time                  | `string` &#124; `null` &#124; `undefined` | `string` &#124; `null` &#124; `undefined` |
| timeWithTimeZone      | `string` &#124; `null` &#124; `undefined` | `string` &#124; `null` &#124; `undefined` |
| timestamp             | `Date` &#124; `string` &#124; `null` &#124; `undefined` | `Date` &#124; `null` &#124; `undefined` |
| timestampWithTimeZone | `Date` &#124; `string` &#124; `null` &#124; `undefined` | `Date` &#124; `null` &#124; `undefined` |
| tsquery               | `string` &#124; `null` &#124; `undefined` | `string` &#124; `null` &#124; `undefined` |
| tsvector              | `string` &#124; `null` &#124; `undefined` | `string` &#124; `null` &#124; `undefined` |
| uuid                  | `string` &#124; `null` &#124; `undefined` | `string` &#124; `null` &#124; `undefined` |
| xml                   | `string` &#124; `null` &#124; `undefined` | `string` &#124; `null` &#124; `undefined` |

::: info `Boolish` and `JsonValue` types

```ts
type Boolish = "true" | "false" | "yes" | "no" |
               1 | 0 | "1" | "0" | "on" | "off";

type JsonArray = JsonValue[];
type JsonValue = boolean | number | string |
                 Record<string, unknown> | JsonArray;
```

:::

## Nullability and optionality

Depending on a column constraints (`NOT NULL`, primary key), the default data value, and whether it's generated, input and output types in the schema will change:

 |             Column                                | Input and output types allow `null` | Input and output types allow  `undefined` |
 | :---                                              | :----: | :----: |
 | with default data value                           | N/A    | yes    |
 | with `NOT NULL` constraint                        | no     | no     |
 | with `NOT NULL` constraint and default data value | no     | yes    |
 | primary key                                       | no     | no     |
 | generated by default as identity                  | no     | yes    |
 | serial                                            | no     | yes    |
 | bigserial                                         | no     | yes    |

## Generated always by identity columns

Generated always by identity columns have `never` as input and output type.

## Column Validations

### bigint

Validations:

- Explicit `undefined` values are rejected.
- Value must be a valid `bigint`.
- Value cannot be lower than -9223372036854775808.
- Value cannot be greater than 9223372036854775807.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: bigint | number | string | null | undefined;
  output?: string | null | undefined;
}
```

### bigserial

- Explicit `undefined` values are rejected.
- Value must be a valid `bigint`.
- Value cannot be lower than -9223372036854775808.
- Value cannot be greater than 9223372036854775807.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: bigint | number | string | undefined;
  output?: string | undefined;
}
```

### bit

- Explicit `undefined` values are rejected.
- Value must be a string of 1's and 0's.
- Value must match the `fixedLength` exactly.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

### bit varying

- Explicit `undefined` values are rejected.
- Value must be a string.
- Value can contain only 1 and 0.
- Value cannot exceed `maximumLength`.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

### boolean

- Explicit `undefined` values are rejected.
- Value must be `boolean` or `Boolish`.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: boolean | Boolish | null | undefined;
  output?: boolean | null | undefined;
}
```

### bytea

- Explicit `undefined` values are rejected.
- Value must be a `Buffer`, `string`, or `null`.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: Buffer | string | null | undefined;
  output?: Buffer | string | null | undefined;
}
```

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

::: info
Since [Buffer](https://nodejs.org/api/buffer.html) is a Node.js API, the schema will not coerce the input to Buffer for browser compatibility.
:::

### character

- Explicit `undefined` values are rejected.
- Value must be a `string` or `null`.
- String values cannot exceed `maximumLength`.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

### character varying

- Value must be a `string` or `null`.
- Value cannot exceed `maximumLength` (when specified).

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

### cidr

- Explicit `undefined` values are rejected.
- Value must be `string` or `null`.
- String values must be a valid IPv4 or IPv6 network specification without bits set to the right of the mask.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

### date

- Value must be `Date`, `string`, or `null`.
- Explicit `undefined` values are rejected.
- String values must be coercible to `Date`.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: Date | string | null | undefined;
  output?: Date | null | undefined;
}
```

### double precision

- Input value must be `bigint`, `number`, `string`, or `null`.
- Explicit `undefined` values are rejected.
- Non-null values must be either:
  - Coercible to BigInt.
  - `NaN`
  - `Infinity`
  - `-Infinity`.
- Bigint values must be:
  - Lower than -1e308.
  - Greater than 1e308.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: bigint | number | string | null | undefined;
  output?: string | null | undefined;
}
```

### enum types

- Explicit `undefined` values are rejected.
- Input values must be an enum value, or `null`.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
// enumType("role", ["admin", "user"]);
{
  input?: "admin" | "user" | null | undefined;
  output?: "admin" | "user" | null | undefined;
}
```

### inet

- Explicit `undefined` values are rejected.
- Value must be `string` or `null`.
- String values must be a valid IPv4 or IPv6 host address with optional subnet.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

### integer

- Input value must be `number`, `string`, or `null`.
- Non-null values must be:
  - Coercible to `number`.
  - Greater or equal than -2147483648.
  - Less than 2147483647.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: number | string | null | undefined;
  output?: number | null | undefined;
}
```

### json

- Explicit `undefined` values are rejected.
- Input values must be `JsonValue` or `null`.
- String values must be valid JSON.
- Record values must be convertible to a JSON string.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
// type JsonArray = JsonValue[];
// type JsonValue = boolean | number | string | Record<string, any> | JsonArray;
{
  input?: JsonValue | null | undefined;
  output?: JsonValue | null | undefined;
}
```

### jsonb

- Explicit `undefined` values are rejected.
- Input values must be `JsonValue` or `null`.
- String values must be valid JSON.
- Record values must be convertible to a JSON string.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
// type JsonArray = JsonValue[];
// type JsonValue = boolean | number | string | Record<string, any> | JsonArray;
{
  input?: JsonValue | null | undefined;
  output?: JsonValue | null | undefined;
}
```

### macaddr

- Explicit `undefined` values are rejected.
- Input value must be `string` or `null`.
- String values must be a valid MAC address.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

### macaddr8

- Explicit `undefined` values are rejected.
- Input value must be `string` or `null`.
- String values must be a valid MAC address in EUI-64 format.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

### numeric

- Explicit `undefined` values are rejected.
- Input value must be `bigint`, `number`, `string`, or `null`.
- Non-null values must be either:
  - Coercible to a number.
  - NaN, Infinity, -Infinity
- Precision and scale are enforced when specified.

```ts
{
  input?:  bigint | number | string | null | undefined;
  output?: string | null | undefined;
}
```

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

### real

- Explicit `undefined` values are rejected.
- Input value must be `number`, `string`, or `null`.
- Non-null values must be either:
  - coercible to `number`.
  - `NaN`, `Infinity`, or `-Infinity`.
- `number` values:
  - Cannot be lower than -1e37.
  - Cannot be greater than 1e37.

```ts
{
  input?:  bigint | number | string | null | undefined;
  output?: number | null | undefined;
}
```

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

### serial

- Explicit `undefined` values are rejected.
- Value must be a valid `number`.
- Value cannot be lower than -2147483648.
- Value cannot be greater than 2147483647.

```ts
{
  input?: number | string | undefined;
  output?: number | undefined;
}
```

### smallint

- Input value must be `number`, `string`, or `null`.
- Non-null values:
  - must be coercible to `number`.
  - Cannot be lower than -32768.
  - Cannot be greater than 32767.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?:  number | string | null | undefined;
  output?: number | null | undefined;
}
```

### text

- Explicit `undefined` values are rejected.
- Input value must be `string` or `null`.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

### time

- Explicit `undefined` values are rejected.
- Input value must be `string`, or `null`.
- Non-values must be a valid string that matches a time format.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?:  string | null | undefined;
  output?: string | null | undefined;
}
```

### time with time zone

- Explicit `undefined` values are rejected.
- Input value must be `string`, or `null`.
- Non-values must be a valid string that matches a time format.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?:  string | null | undefined;
  output?: string | null | undefined;
}
```

### timestamp

- Explicit `undefined` values are rejected.
- Input value must be `Date`, `string`, or `null`.
- Non-null values must be:
  - Coercible to a `Date`.
  - Date must be 4713 BC or later.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?:  Date | string | null | undefined;
  output?: Date | null | undefined;
}
```

### timestamp with timezone

- Explicit `undefined` values are rejected.
- Input value must be `Date`, `string`, or `null`.
- Non-null values must be:
  - Coercible to a `Date`.
  - Date must be 4713 BC or later.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?:  Date | string | null | undefined;
  output?: Date | null | undefined;
}
```

### tsquery

- Explicit `undefined` values are rejected.
- Input value must be `string` or `null`.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

### tsvector

- Explicit `undefined` values are rejected.
- Input value must be `string` or `null`.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

### uuid

- Explicit `undefined` values are rejected.
- Input value must be `string`, or `null`.
- String values must be a valid UUID.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```

### xml

- Explicit `undefined` values are rejected.
- Input value must be `string`, or `null`.

[Nullability and optionality](#nullability-and-optionality) will change according to the column's constraints, generated values, and default data values.

```ts
{
  input?: string | null | undefined;
  output?: string | null | undefined;
}
```
