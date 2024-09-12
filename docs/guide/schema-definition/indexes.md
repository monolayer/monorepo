# Indexes

[Indexes](./glossary.md#index) allow you to speed up the retrieval of data from a [table](./glossary.md#table).

Index are defined with the [`index`](./../../reference/api/pg/functions/index.md) function.

You add an index to a table by adding it to the [`indexes`](./../../reference/api/pg/type-aliases/TableDefinition.md#indexes) property in the table definition.

## Index on column(s)

### Single column

```ts
import { table, text, index } from "@monolayer/pg/schema";

const users = table({
  columns: {
    name: text(),
  },
  indexes: [index(["name"])], // [!code highlight]
});
```

::: warning
The optional `columns` argument of the `index` function is always an array.
:::

### Multiple columns

```ts
import { table, text, index } from "@monolayer/pg/schema";

const users = table({
  columns: {
    email: text(),
    name: text(),
  },
  indexes: [index(["email", "name"])], // [!code highlight]
});
```

## Expression indexes

An expression index allows an index field to be a computed value of one or more columns of the table row.
This  can be used to obtain fast access to data based on some transformation of the basic data.

```ts
import { sql } from "kysely";
import { table, text, index } from "@monolayer/pg/schema";

const users = table({
  columns: {
    name: text(),
  },
  indexes: [index().expression(sql`upper(${sql.ref("name")})`);], // [!code highlight]
});
```

::: danger
It's recommended to reference column names with the `sql.ref` function. This function takes care of:

- Double quote the column name (PostgreSQL lower cases all names unless they are "double quoted" ).
- Transform to the column name to `snake_case` when the `camelCase` option is active.
:::

You can read more about how to build expressions for indexes in the [Kysely Docs](https://kysely-org.github.io/kysely-apidoc/classes/CreateIndexBuilder.html#expression)

## Unique index

An unique index does not allow duplicate values in the table when the index is created (if data already exist) and each time data is added. Attempts to insert or update data which would result in duplicate entries generate an error.

```ts
import { table, text, index } from "@monolayer/pg/schema";

const users = table({
  columns: {
    name: text(),
  },
  indexes: [index(["name"]).unique()], // [!code highlight]
});
```

### Nulls not distinct

In SQL `NULL` values (which represent missing or unknown data) are considered to be distinct. This means that if you index by a column that contains `NULL` values, the unique index will would allow multiple rows with `NULL` in that column.

You may want to change the behaviour and consider `NULL` values as not distinct, only allowing one row with a NULL value. If another row tries to have NULL for the column, it will be rejected because every `NULL` is treated as the same.

```ts
import { table, text, index } from "@monolayer/pg/schema";

const users = table({
  columns: {
    name: text(),
  },
  indexes: [index(["name"]).unique().nullsNotDistinct()], // [!code highlight]
});
```

## Index with a specific index method

You can specify the index to be created with a specific index method.

```ts
import { table, text, index } from "@monolayer/pg/schema";

const users = table({
  columns: {
    name: text(),
  },
  indexes: [index(["name"]).using("gist")], // [!code highlight]
});
```

## Partial index

A partial index is an index that contains entries for only a portion of a table, usually a portion that is more useful for indexing than the rest of the table.

```ts
import { table, integer, index } from "@monolayer/pg/schema";

const users = table({
  columns: {
    age: integer(),
  },
  indexes: [
    index(["name"]).where(sql.ref("age"), ">=", 18) // [!code highlight]
  ],
});
```

Read more about how to buid where expressions in the [Kysely Docs](https://kysely-org.github.io/kysely-apidoc/classes/CreateIndexBuilder.html#where)
