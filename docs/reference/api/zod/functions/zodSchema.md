[monolayer-monorepo](../../index.md) / [zod](../index.md) / zodSchema

# Function: zodSchema()

> **zodSchema**\<`T`\>(`table`): `TableSchema`\<`T`\>

Return a Zod schema for the table.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`PgTable`](../../pg/classes/PgTable.md)\<`any`, `any`\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `table` | `T` |

## Returns

`TableSchema`\<`T`\>

## Remarks

The schema will be for all columns defined in the table.
You can use `extend`, `pick`, `omit`, or `shape` to adapt/expand the schema.

**Schema validations for all columns**
- Input and output values are optional by default.
- Input and output types will be automatically inferred.
- Explicit `undefined` values will result in an error.
- Each column type has extended validation rules to allow only accepted values for the column type.
Refer to each columm documentation for a description on the specific validation rules.
For example, the schema for an `integer` column:
  - Will not allow values lower than -2147483648.
  - Will not allow values greater that 2147483647.
- The schema will take into account account constraints, generated values and default data values.
For example, a non-nullable, primary key column:
  - Can't be null.
  - Input value and output values are required.

**Schema Types**

Each column has a Typescript type for input and output values (parsed) in the schema.
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

## Example

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

## Defined in

[../internal/pg/src/schema/zod/zod\_schema.ts:201](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/zod/zod_schema.ts#L201)
