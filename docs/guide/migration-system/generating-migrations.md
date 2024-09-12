# Generating Migrations

To generate schema migrations based on what you have declared are generated using the `monolayer-pg` CLI with the `migrations generate` command:

```bash
npx monolayer migrations generate
```

`monolayer-pg` will then introspect the schema defined in your application code and the actual database schema in your development database. If there are chages to be made it will:

```mermaid
flowchart TD
    A[Categorize the operations into one of: expand, alter, or contract]
    A --> B[Create change operations to achive the desired state]
    B --> C[Optimize the operations to minimize database blocking and downtime]
    C --> D[Prioritize the operations]
    D --> E[Generate migration files with forward and backward operations]
    E --> F[Output warnings about possible failures, backwards incompatible, destrucive, or blocking changes]
```

## Custom migrations

You'll find instructions on how to generate custom migrations in the recipe: [Generating custom migrations](./../recipes/custom-migrations.md).
