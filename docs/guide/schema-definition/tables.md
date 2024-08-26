# Tables

You can define a [`table`](./glossary.md#table) with the [`table`](./../../reference/api/pg/functions/table.md) function.

```ts
import { table, text } from "monolayer/pg";

const users = table({ // [!code highlight]
  columns: { // [!code highlight]
    name: text(), // [!code highlight]
  }, // [!code highlight]
});// [!code highlight]
```

See the full list of configuration options in [TableDefinition](./../../reference/api/pg/type-aliases/TableDefinition.md#type-declaration)

## Adding tables to schemas

To add a table to and schema you pass the table definition to the [schema](./../../reference/api/pg/functions/schema.md) definition.

```ts
import { table, schema, text } from "monolayer/pg";

const users = table({
  columns: {
    name: text(),
  },
});

export const dbSchema = schema({
  tables: { // [!code highlight]
    users, // [!code highlight]
  }, // [!code highlight]
});
```

## Table names

The table name is defined at the `schema` level, based on the key in the `tables` object.

In the the following example, is `users`:

```ts
export const dbSchema = schema({
  tables: {
    users, // [!code highlight]
  },
});
```

::: info How?
In `TypeScript` and `Javascript`, you can assign a property to an object as a shorthand property by mentioning the variable in the object literal. The key name is the variable name.
:::

In the following example:

```ts
import { table, schema, text } from "monolayer/pg";

const users = table({
  columns: {
    name: text(),
  },
});

export const dbSchema = schema({
  tables: {
    users, // [!code --]
    accounts: users, // [!code ++]
  },
});
```

The table name in the schema will be `accounts`.
