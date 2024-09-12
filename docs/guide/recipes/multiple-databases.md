---
aside: false
---

# Using multiple databases

You can easily use multiple databases with `monolayer`.

To define multiple databases, you export more than one database definition from the databases file.

::: code-group
```ts [databases.ts]
import { defineDatabase } from "@monolayer/pg/schema";

export default defineDatabase({
  // Database configuration options
});

export const stats = defineDatabase({
  id: "stats",
  // Other database configuration options
});
```
:::

::: warning
When you define multiple databases, make sure each database definition has a [unique identifier](./../schema-definition/databases.md#database-identifiers).
Otherwise, you will have multiple databases with the same `default` identifier.
:::

You can also re-export databases from other files.

::: code-group

```ts [databases.ts]
import { defineDatabase } from "@monolayer/pg/schema";
export { statsDb } from "./stats";

export default defineDatabase({
  // Database configuration options
});
```

```ts [stats.ts]
import { defineDatabase } from "@monolayer/pg/schema";
import { statsSchema } from "./stats-schema";

export const stats = defineDatabase({
  id: "stats",
  schemas: [statsSchema],
  // Other database configuration options
});
```
:::
