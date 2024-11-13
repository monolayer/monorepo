# Welcome to monolayer-pg

[monolayer-pg](https://monolayer.github.io/pg-docs/) is a [PostgreSQL](https://www.postgresql.org) database schema manager for [TypeScript](https://www.typescriptlang.org) projects built on top of [`kysely`](https://kysely.dev) with:

- Declarative, type-safe database schema definition.
- Schema management without migrations.
- Type-safe database client(s) for [`kysely`](https://kysely.dev) (no *codegen* :tada:).
- Data migrations decoupled from your schema management.
- Support for multiple databases.
- Support for multiple schemas per database.
- Effortless [`Prisma`](https://www.prisma.io) integration.
- Comprehensive [Zod](https://zod.dev) validations for all supported data types (no *codegen* :tada:) for [`kysely`](https://kysely.dev).

To get started, open a new shell and run:

```sh
npx @monolayer/create-pg@latest
```

Then follow the prompts you see in your terminal.
