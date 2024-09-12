<!-- markdownlint-disable MD026 -->
# Welcome to monolayer-pg!

[monolayer](https://dunkelbraun.github.io/monolayer) is a [PostgreSQL](https://www.postgresql.org) database schema manager for [TypeScript](https://www.typescriptlang.org) projects built on top of [`kysely`](https://kysely.dev) with:

- Declarative, type-safe database schema definition.
- Type-safe database client(s) for [`kysely`](https://kysely.dev) (no *codegen* :tada:).
- Comprehensive Zod validations for all supported data types (no *codegen* :tada:) for [`kysely`](https://kysely.dev).
- An advanced migration system with non-blocking migrations by default, migrations by phases, and detailed warnings.
- Support for multiple databases.
- Support for multiple schemas per database.
- Effortless [`Prisma`](https://www.prisma.io) integration.

To get started, open a new shell and run:

```sh
npx create-monolayer@latest
```

Then follow the prompts you see in your terminal.
