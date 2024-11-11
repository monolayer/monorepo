# Foreign keys

[Foreign keys](./../glossary.md#foreign-key) are defined in the constraints object of table definition using the [`foreignKey`](./../../../reference/api/schema/functions/foreignKey.md) function.

## Single column

```ts
import { integer, foreignKey, primaryKey, table } from "@monolayer/pg/schema";

const users = table({ // [!code highlight]
  columns: {
    id: integer().generatedAlwaysAsIdentity(), // [!code highlight]
  },
  constraints: {
    primaryKey: primaryKey(["id"]),
  },
});

const documents = table({
  columns: {
    id: integer().generatedAlwaysAsIdentity(),
    userId: integer(),
  },
  constraints: {
    primaryKey: primaryKey(["id"]),
    foreignKeys: [ // [!code highlight]
      foreignKey(["userId"], users, ["id"]), // [!code highlight]
    ], // [!code highlight]
  },
});
```

## Multiple of columns

```ts
import {
  integer,
  foreignKey,
  primaryKey,
  table,
  timestampWithTimeZone
} from "@monolayer/pg/schema";

const projects = table({ // [!code highlight]
  columns: {
    id: integer(), // [!code highlight]
    departmendId: integer(), // [!code highlight]
  },
  constraints: {
    primaryKey: primaryKey(["id", "departmentId"]),
  },
});

const assignments = table({
  columns: {
    dueDate: timestampWithTimeZone(),
    projectId: integer().generatedAlwaysAsIdentity(),
    departmentId: integer(),
  },
  constraints: {
    foreignKeys: [ // [!code highlight]
      foreignKey( // [!code highlight]
        ["projectId", "departmentId"], // [!code highlight]
        projects, // [!code highlight]
        ["id", "departmentId"] // [!code highlight]
      ),// [!code highlight]
    ], // [!code highlight]
  },
});
```

## With actions

When you define a foreign key constraint, you can specify actions to taken when the referenced row in the parent table is deleted or updated. There are five actions that you can set when a referenced row is updated or deleted:

| ACTION      | Behavior     |
| :------------:| :----------- |
| CASCADE     | When a referenced row is deleted, row(s) referencing it should be automatically deleted as well |
| SET NULL    | Referencing column(s) in the referencing row(s) will be set to `NULL` when the referenced row is deleted or when the referenced row key is updated |
| SET DEFAULT | Referencing column(s) in the referencing row(s) will be set to their default value when the referenced row is deleted or when the referenced row key is updated |
| RESTRICT    | Prevents the deletion of a referenced row up updated of a referenced key |
| NO ACTION   | If any referencing rows still exist when the constraint is checked, an error is raised. Similar to `RESTRICT`. The difference is that `NO ACTION` allows the check to be deferred until later in the transaction, whereas `RESTRICT` does not |

::: info
The default action for a foreign key is  `NO ACTION`.
:::

Read more about foreign keys in [PostgreSQL - Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)

Use the modifiers `deleteRule` and `updateRule` to specify the foreign key actions:

```ts

const documents = table({
  columns: {
    id: integer().generatedAlwaysAsIdentity(),
    userId: integer(),
  },
  constraints: {
    primaryKey: primaryKey(["id"]),
    foreignKeys: [
      foreignKey(["userId"], users, ["id"]) // [!code highlight]
        .deleteRule("set null") // [!code highlight]
        .updateRule("cascade"), // [!code highlight]
    ],
  },
});
```

## Self-referential

```ts
import { integer, foreignKey, primaryKey, table } from "@monolayer/pg/schema";

const tree = table({
  columns: {
    nodeId: integer().generatedAlwaysAsIdentity(), // [!code highlight]
    parentId: integer(), // [!code highlight]
  },
  constraints: {
    primaryKey: primaryKey(["nodeId"]),
    foreignKeys: [ // [!code highlight]
      foreignKey(["parentId"], ["nodeId"]), // [!code highlight]
    ], // [!code highlight]
  },
});
```
