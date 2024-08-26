# Other column data types

Column data types other than the default [data types](./data-types.md) provided by `monolayer` can be defined with the [columnWithType](./../../../reference/api/pg/functions/columnWithType.md) function.

```ts
const accounts = table({
  amount: columnWithType<string, string>("money"), // [!code highlight]
});
```

You need specify the Select and Insert types to the function, otherwise the inferred type will be any.

::: warning
If you use `Kysely` as your query builder, these types should map to the types that PostgreSQL driver ([node-postgres](https://node-postgres.com/features/types)) will expect and return on queries.
:::
