# Validations with Zod

Once you have declared your schema you can access the corresponding [Zod](https://zod.dev) schema for it.

The Zod schema will not only take into account:

- Type of the column.
- Nullability.
- Specific column data type validations that match validations at database level. For example, the range of an `integer` is: -2147483648 to +2147483647.

The schema will also reject explicit `undefined` values when parsing.

You can read more about the specific validations for each column data type in the [Column Types API](./../reference/api/pg/index.md#column-types)

## Retrieving the Zod schema

Zod schemas are made available through the [`zodSchema`](./../reference/api/zod/functions/zodSchema.md) function from `@monolayer/pg/zod`.

```ts
const users = table({
  columns: {
    id: integer().generatedAlwaysAsIdentity(),
    name: text(),
    createdAt: timestampWithTimeZone().default(sql`now`).notNull(),
  },
  constraints: {
    primaryKey: primaryKey(["id"]),
  },
});

const usersZodSchema = zodSchema(users);
```

## Schema Types

Each column has a TypeScript type for input and output values (parsed) in the schema.
The output values match the select type for the column(except `bytea` columns *)

(*) Since [Buffer](https://nodejs.org/api/buffer.html) is a Node.js API, the schema will not coerce the input to Buffer for browser compatibility.
The output type will be the same as the input type.

| Column                | Input                                                           | Output|
| :---                  | :----:                                                          | :----:|
| bigint                | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`string` &#160;&#160;|
| bigserial             | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`string`&#160;&#160;|
| bit                   | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
| bitVarying            | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
| boolean               | &#160;&#160;`boolean` &#124; `Boolish`*&#160;&#160;             | &#160;&#160;`boolean`&#160;&#160;|
| bytea                 | &#160;&#160;`Buffer` &#124; `string`&#160;&#160;                | &#160;&#160;`Buffer` &#124; `string`&#160;&#160;|
| characterVarying      | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
| character             | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
| cidr                  | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
| date                  | &#160;&#160;`Date` &#124; `string`&#160;&#160;                  | &#160;&#160;`Date`&#160;&#160;|
| doublePrecision       | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`string`&#160;&#160;|
| enumerated            | &#160;&#160;enum values&#160;&#160;                             | &#160;&#160;enum values&#160;&#160;|
| inet                  | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
| integer               | &#160;&#160;`number` &#124; `string`&#160;&#160;                | &#160;&#160;`number`&#160;&#160;|
| json                  | &#160;&#160;`JsonValue`*&#160;&#160;                            | &#160;&#160;`JsonValue`*&#160;&#160;|
| jsonb                 | &#160;&#160;`JsonValue`*&#160;&#160;                            | &#160;&#160;`JsonValue`*&#160;&#160;|
| macaddr               | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
| macaddr8              | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
| numeric               | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`number`&#160;&#160;|
| real                  | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`string`&#160;&#160;|
| serial                | &#160;&#160;`number` &#124; `string`&#160;&#160;                | &#160;&#160;`number`&#160;&#160;|
| smallint              | &#160;&#160;`number` &#124; `string`&#160;&#160;                | &#160;&#160;`number`&#160;&#160;|
| time                  | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
| timeWithTimeZone      | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
| timestamp             | &#160;&#160;`Date` &#124; `string`&#160;&#160;                  | &#160;&#160;`Date`&#160;&#160;|
| timestampWithTimeZone | &#160;&#160;`Date` &#124; `string`&#160;&#160;                  | &#160;&#160;`Date`&#160;&#160;|
| tsquery               | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
| tsvector              | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
| uuid                  | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
| xml                   | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|

(*) `Boolish` and `JsonValue` are defined as follows:

```ts
type Boolish = "true" | "false" | "yes" | "no" | 1 | 0 | "1" | "0" | "on" | "off";
type JsonArray = JsonValue[];
type JsonValue = boolean | number | string | Record<string, unknown> | JsonArray;
```

### Example

```ts
const userRole = enumType("user_role", ["admin", "user"]);
const users = table({
  columns: {
    id: integer().generatedAlwaysAsIdentity(),
    name: text(),
    role: enumerated(userRole).notNull(),
    orderCount: integer().notNull().default(0),
    createdAt: timestampWithTimeZone().default(sql`now`).notNull(),
  },
  constraints: {
    primaryKey: primaryKey(["id"]),
  },
});
const schema = zodSchema(users);
type InputType = z.input<typeof schema>;
type OutputType = z.output<typeof schema>;
```

`InputType` will be:

```ts
type InputType = {
  id: never;
  name?: string | null | undefined;
  role: "user" | "admin";
  orderCount: number | string | undefined;
  createdAt?: Date | string | undefined;
}
```

`OutputType` will be:

```ts
type OutputType = {
  id: never;
  name?: string | null | undefined;
  orderCount?: number | undefined;
  role: "user" | "admin";
  createdAt?: Date | undefined;
}
```
