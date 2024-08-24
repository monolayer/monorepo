# Database Schemas

Each [PostgreSQL](https://www.postgresql.org) database contains one or more named schemas which contain tables and other database objects.

You can think of schemas as a namespace for SQL objects (i.e tables, types).

Normally, every database in PostgreSQL contains a `public` schema by default, but you can create additional schemas.

## Define the public schema

You define the database public schema with the `schema` function.

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
