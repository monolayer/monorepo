# Using multiple database schemas

`monolayer-pg` allows you to manage multiple schemas in a single database.

You may want to use multiple schemas to:

- Allow many users to use one database without interfering with each other.
- Organize database objects into logical groups to make them more manageable.
- Put third-party applications in separate schemas to prevent name collision with other database objects.

Simply add schemas to the database configuration:

```ts
import { defineDatabase } from "@monolayer/pg/schema";
import { defaultDbSchema } from "./schema";
import { statsSchema } from "./stats-schema";

export default defineDatabase({
  schemas: [defaultDbSchema], // [!code --]
  schemas: [defaultDbSchema, statsSchema], // [!code ++]
  // Other database configuration options
});
```

## Generated types

You can infer namespaced database types with `inferWithSchemaNamespace`:

```ts
export type StatsDB = typeof statsSchema.inferWithSchemaNamespace;
```

A `users` and `posts` tables defined in the public schema will have the inferred type:

```ts
type DB = {
    "public.users": {
      // columns types
    };
    "public.posts": {
      // column types
    };
}
```

A `visits` table defined in a schema named `stats` will have the inferred type:

```ts
type StatsDB = {
    "stats.visits": {
      // columns types
    };
}
```

You can combine the different generated schema types in the `kysely` database client:

```ts
export const defaultDbClient = new Kysely<DB & StatsDB>({ // [!code highlight]
  dialect: new PostgresDialect({
    pool: new pg.Pool({
      connectionString: process.env.MONO_PG_DEFAULT_DATABASE_URL,
    }),
  }),
  plugins: defaultDb.camelCase ? [new CamelCasePlugin()] : [],
});
```

You can mix inferred types with `infer` and `inferWithSchemaNamespace`, depending on your querying needs.

Read more about working with schemas in the `Kysely` Docs: [Working with schemas](https://kysely.dev/docs/recipes/schemas)

## Mutiple schemas with Prisma

To use multiple database schemas in `Prisma` you need to enable the multiSchema preview feature in the `generator` block of your Prisma Schema:

```ts
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"] // [!code ++]
}
```

Read more about multischema support in Prisma in [How to use Prisma ORM with multiple database schemas](https://www.prisma.io/docs/orm/prisma-schema/data-model/multi-schema)
