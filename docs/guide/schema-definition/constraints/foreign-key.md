---
sidebar_position: 3
---

# Foreign keys

A foreign key constraint specifies that the values in a column (or a group of columns)
must match the values appearing in some row of another table.

With foreign key you can represent relationships between tables while maintaining the referential integrity between them.

You can have more than one foreign key constraint on a table, and a foreign key can reference
the same table it is defined on.

In `monolayer`, foreign keys are defined in the constraints object on a table definition
using the `foreignKey` function.

## On a single column

```ts
import { integer, foreignKey, primaryKey, table } from "monolayer/pg";

const users = table({
  columns: {
    id: integer().generatedAlwaysAsIdentity(),
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

## On multiple of columns

To reference multiple colums, just pass additional columns in the `foreignKey` function:

```ts
import {
  integer,
  foreignKey,
  primaryKey,
  table,
  timestampWithTimeZone
} from "monolayer/pg";

const projects = table({
  columns: {
    id: integer(),
    departmendId: integer(),
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

## Self referencing

To self reference a foreign key, only referencing and referenced columns are
needed in the `foreignKey` function:

```ts
import { integer, foreignKey, primaryKey, table } from "monolayer/pg";

const tree = table({
  columns: {
    nodeId: integer().generatedAlwaysAsIdentity(),
    parentId: integer(),
  },
  constraints: {
    primaryKey: primaryKey(["nodeId"]),
    foreignKeys: [ // [!code highlight]
      foreignKey(["parentId"], ["nodeId"]), // [!code highlight]
    ], // [!code highlight]
  },
});
```
