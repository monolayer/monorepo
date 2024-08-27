---
aside: false
---

# What is monolayer?

[monolayer](https://dunkelbraun.github.io/monolayer) is a [PostgreSQL](https://www.postgresql.org) database schema manager for [TypeScript](https://www.typescriptlang.org) projects built on top of [`kysely`](https://kysely.dev) with:
- Declarative, type-safe database [schema definition](./../schema-definition/databases.md).
- [Type-safe](./../generated-types.md) database client(s) for `kysely` (no *codegen* :tada:).
- An advanced [migration system](./../migration-system/intro.md) with non-blocking migrations by default, migrations by phases, and detailed warnings.
- Comprehensive [Zod validations](./../zod-validations.md) for all supported data types (no *codegen* :tada:) for `kysely`.
- Support for [multiple databases](./../recipes/multiple-databases.md).
- Support for [multiple schemas](./../recipes/multiple-schemas.md) per database.
- Effortless [`Prisma`](https://www.prisma.io) [integration](./querying/prisma.md).

<br>

Here's a taste of how you define database schemas with `monolayer`:
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

Head over to the [Quickstart](./installation.md) and begin using `monolayer`!
