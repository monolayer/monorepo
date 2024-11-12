# Pushing schema changes

## Development

In development, run `push dev`:

```bash
npx monolayer-pg push dev
```

`monolayer-pg` will  introspect the schema defined in your application code and the actual database schema in your development database. Then, it will:

- Detect possible table and column renames and prompt you about those.
- Analize the changes to be made.
- Optimize the operations to minimize database blocking and downtime.
- Execute SQL statements against the database to modify the schema to the desired state.
- Rollback changes on error.

## Pushing to production

To push schema changes in production databases use the `push prod` command:

```bash
npx monolayer-pg push prod
```

`push prod` will ensure that any state recorded by `push dev` (such as table or column renames) is taken into account.

## Migration warnings

From time to time, `monolayer-pg` will have to push changes that could be lead to:

- Destructive changes.
- Backwards incompatibility.
- Block the database while applying the migration.
- Potential failures during the migration process.

For this reason, `monolayer-pg` will output a warning message to inform you about the potential issues and possible mitigation steps.
