# Database Schemas

Each [PostgreSQL](https://www.postgresql.org) [database](./../glossary.md#database) contains one or more named [schemas](./../glossary.md#schema) which contain tables and other database objects.

Normally, every database in PostgreSQL contains a `public` schema by default.

## Define the public schema

You define the database public schema with the [`schema`](./../../reference/api/pg/functions/schema.md) function.

:::code-group
```ts [schema.ts]
export const dbSchema = schema({});
```
:::

See the list of configuration properties in the [DatabaseSchema Reference](./../../reference/api/pg/type-aliases/DatabaseSchema.md#type-declaration)

## Define a named schema

You define a named database schema by giving it a name.

:::code-group
```ts [schema.ts]
export const statsSchema = schema({
  name: "stats", // [!code highlight]
});
```
:::

::: tip
`monolayer` will handle the creation of the schemas other than the default `public`.
:::

## Connecting a schema to a database

In your `databases.ts` file, specify the schema(s) you want to use in a defined database.

::: code-group
```ts [databases.ts]
import { defineDatabase } from "monolayer/pg";
import { dbSchema } from "./schema";

export const defaultDb = defineDatabase({
  schemas: [dbSchema],
});
```
:::
