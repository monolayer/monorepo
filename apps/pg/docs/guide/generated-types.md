# Generated Types

Each column in a schema has a TypeScript type for type-safe select, insert, and update queries with [`Kysely`](https://kysely.dev).

Types for a schema can be retrieved using the `infer` method on the schema.

Consider the following table definition:

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
```

When we infer the types with:

```ts
type DB = typeof dbSchema.infer;
```

The `DB` type will be:

 ```ts
 type DB = {
   users: {
     id: {
       readonly __select__: number;
       readonly __insert__: never;
       readonly __update__: never;
     };
     name: {
       readonly __select__: string;
       readonly __insert__: string | null | undefined;
       readonly __update__: string | null;
     },
     createdAt: {
       readonly __select__: Date;
       readonly __insert__: Date | undefined;
       readonly __update__: Date;
     },
   };
 };
```

The types are inferred according to the column data types, constraints, default values and if the column is generated.

## Column data types

Here's a table for select, insert, and update types for each column type:

 | Column                | Select       | Insert                                    | Update|
 | :---                  | :----:       | :----:                                    | :----:|
 | bigint                | `string`     | `bigint` &#124; `number` &#124; `string`  | `bigint` &#124; `number` &#124; `string`|
 | bigserial             | `string`     | `bigint` &#124; `number` &#124; `string`  | `bigint` &#124; `number` &#124; `string`|
 | bit                   | `string`     | `string`                                  | `string`|
 | bitVarying            | `string`     | `string`                                  | `string`|
 | boolean               | `boolean`    | `boolean` &#124; `Boolish`*               | `boolean` &#124; `Boolish`*|
 | bytea                 | `Buffer`     | `Buffer` &#124; `string`                  | `Buffer` &#124; `string`|
 | characterVarying      | `string`     | `string`                                  | `string`|
 | character             | `string`     | `string`                                  | `string`|
 | cidr                  | `string`     | `string`                                  | `string`|
 | date                  | `Date`       | `Date` &#124; `string`                    | `Date` &#124; `string`|
 | doublePrecision       | `string`     | `bigint` &#124; `number` &#124; `string`  | `bigint` &#124; `number` &#124; `string`|
 | enumerated            | enum values  | enum values                               | enum values|
 | inet                  | `string`     | `string`                                  | `string`|
 | integer               | `number`     | `number` &#124; `string`                  | `number` &#124; `string`|
 | json                  | `JsonValue`* | `JsonValue`*                              | `JsonValue`*|
 | jsonb                 | `JsonValue`* | `JsonValue`*                              | `JsonValue`*|
 | macaddr               | `string`     | `string`                                  | `string`|
 | macaddr8              | `string`     | `string`                                  | `string`|
 | numeric               | `string`     | `bigint` &#124; `number` &#124; `string`  | `bigint` &#124; `number` &#124; `string`|
 | real                  | `number`     | `bigint` &#124; `number` &#124; `string`  | `bigint` &#124; `number` &#124; `string`|
 | serial                | `number`     | `number` &#124; `string`                  | `number` &#124; `string`|
 | smallint              | `number`     | `number` &#124; `string`                  | `number` &#124; `string`|
 | time                  | `string`     | `string`                                  | `string`|
 | timeWithTimeZone      | `string`     | `string`                                  | `string`|
 | timestamp             | `Date`       | `Date` &#124; `string`                    | `Date` &#124; `string`|
 | timestampWithTimeZone | `Date`       | `Date` &#124; `string`                    | `Date` &#124; `string`|
 | tsquery               | `string`     | `string`                                  | `string`|
 | tsvector              | `string`     | `string`                                  | `string`|
 | uuid                  | `string`     | `string`                                  | `string`|
 | xml                   | `string`     | `string`                                  | `string`|

 (*) `Boolish` and `JsonValue` are defined as follows:

 ```ts
 type Boolish = "true" | "false" | "yes" | "no" | 1 | 0 | "1" | "0" | "on" | "off";
 type JsonArray = JsonValue[];
 type JsonValue = boolean | number | string | Record<string, unknown> | JsonArray;
 ```

## Optionality and nullability

By default, columns have:

- Nullable selects, inserts and updates.
- Optional inserts and updates.

 Columns will have their optionality and nullability changed accordingly to the
 constraints they have, their default data value, and if they are generated:

 |             Column                                                    | Optional | Nullable |
 | :---                                                                  | :----:   | :----:   |
 | with default data value                                               | yes      | yes      |
 | with `NOT NULL` constraint                                            | no       | no       |
 | with `NOT NULL` constraint with default data value                    | yes      | no       |
 | `serial`                                                              | yes      | no       |
 | `bigserial`                                                           | yes      | no       |
 | generated by default as identity                                      | yes      | no       |
 | primary key                                                           | no       | no       |
 | `serial`, `bigserial` generated by default as identity  primary key   | yes      | no       |

### Examples

Type of an `integer` column named id:

 ```ts
 type id = {
   readonly __select__: number | null;
   readonly __insert__: number | string | null | undefined;
   readonly __update__: number | string | null;
 };
 ```

Generated always as identity will not accept inserts or updates:

 ```ts
 type id = {
   readonly __select__: number;
   readonly __insert__: never;
   readonly __update__: never;
 };
 ```

Type of an `integer` column with a `NOT NULL` constraint:

 ```ts
 type id = {
   readonly __select__: number;
   readonly __insert__: number | string;
   readonly __update__: number | string;
 };
 ```

Type of an `integer` column with a default data value and a `NOT NULL` constraint:

 ```ts
 type id = {
   readonly __select__: number;
   readonly __insert__: number | string | undefined;
   readonly __update__: number | string;
 };
 ```

 Type of an `bigint` column generated by default as identity:

 ```ts
 type id = {
   readonly __select__: string;
   readonly __insert__: bigint | number | string | undefined;
   readonly __update__: bigint | number | string;
 };
 ```
