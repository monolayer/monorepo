---
aside: false
---
<!-- markdownlint-disable MD033 -->

# What is monolayer-pg?

[monolayer-pg](https://dunkelbraun.github.io/monolayer-pg) is a [PostgreSQL](https://www.postgresql.org) database schema manager for [TypeScript](https://www.typescriptlang.org) projects built on top of [`kysely`](https://kysely.dev) with:

- Declarative, type-safe database [schema definition](./../schema-definition/databases.md).
- [Type-safe](./../generated-types.md) database client(s) for `kysely` (no *codegen* :tada:).
- [Schema management](./../pushing-schema-changes.md) without migrations.
- Support for [multiple databases](./../recipes/multiple-databases.md).
- Support for [multiple schemas](./../recipes/multiple-schemas.md) per database.
- Effortless [`Prisma`](https://www.prisma.io) [integration](./querying/prisma.md).
- Detailed warnings on backwards-incompatible, blocking,unsafe, or destructive changes.
- Data migrations decoupled from your schema management.
- Comprehensive Zod validations for all supported data types (no *codegen* :tada:) for [`kysely`](https://kysely.dev).

<br>

Here's a taste of how you define database schemas with `monolayer-pg`:

```ts
const users = table({
  columns: {
    id: integer().generatedAlwaysAsIdentity(),
    email: text().notNull(),
    name: text(),
  },
  constraints: {
    primaryKey: primaryKey(["id"]),
    unique: [unique(["email"])],
  },
  indexes: [index(["email"])],
});

const posts = table({
  columns: {
    id: integer().generatedAlwaysAsIdentity(),
    title: text().notNull(),
    content: text(),
    published: boolean().default(false),
    authorId: integer(),
    createdAt: timestampWithTimeZone().notNull().default(sql`now()`),
    updatedAt: timestampWithTimeZone().notNull().default(sql`now()`),
  },
  constraints: {
    primaryKey: primaryKey(["id"]),
    foreignKeys: [
      foreignKey(["authorId"], users, ["id"])
        .deleteRule("set null")
        .updateRule("cascade"),
    ],
  },
  indexes: [index(["authorId"])],
});

export const dbSchema = schema({
  tables: {
    users,
    posts,
  },
});
```

<br>

Head over to the [Quickstart](./installation.md) and begin using `monolayer-pg`!
