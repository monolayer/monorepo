---
sidebar_position: 5
---

# Check constraints

A check constraint is the most generic constraint type.
It allows you to specify that the value in a certain column must satisfy a Boolean (truth-value) expression.

A type of constraint defined on a relation which restricts the values allowed in one or more attributes.
The check constraint can make reference to any attribute of the same row in the relation,
but cannot reference other rows of the same relation or other relations.

```ts
import { integer, table, check } from "monolayer/pg";

export const books = table({
  columns: {
    id: integer(),
    price: integer(),
  },
  // highlight-start
  constraints: {
    check: check(sql`${sql.ref("price")} > 0`),
  },
  // highlight-end
});
```


A check constraint can refer also to multiple columns:

```ts
import { integer, table, check } from "monolayer/pg";

export const books = table({
  columns: {
    id: integer(),
    price: integer(),
    discount: integer(),
  },
  // highlight-start
  constraints: {
    check: check(sql`${sql.ref("price")} > 0 AND ${sql.ref("discount")} >= 10`),
  },
  // highlight-end
});
```
