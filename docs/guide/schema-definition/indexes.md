---
sidebar_position: 4
---

# Indexes

Indexes allows you to speed up the retrieval of data from a table.

## Defining indexes

Indexes are defined in the `indexes` field of a table definition with the `index` function.
The `indexes` attribute is an array of index definitions.

```ts
import { table, text, index } from "monolayer/pg";

const users = table({
  columns: {
    name: text(),
  },
  indexes: [index(["name"])],
});
```

You can also define indexes on multiple columns:
```ts
import { table, text, index } from "monolayer/pg";

const users = table({
  columns: {
    email: text(),
    name: text(),
  },
  indexes: [index(["email", "name"])],
});
```

Additionaly, the `index` function has available the following modifers that mimic the schema index builder from `kysely`:

- [`expression`](https://kysely-org.github.io/kysely-apidoc/classes/CreateIndexBuilder.html#expression)
- [`nullsNotDistinct`](https://kysely-org.github.io/kysely-apidoc/classes/CreateIndexBuilder.html#nullsNotDistinct)
- [`unique`](https://kysely-org.github.io/kysely-apidoc/classes/CreateIndexBuilder.html#unique)
- [`using`](https://kysely-org.github.io/kysely-apidoc/classes/CreateIndexBuilder.html#using)
- [`where`](https://kysely-org.github.io/kysely-apidoc/classes/CreateIndexBuilder.html#where)
