[monolayer-monorepo](../../index.md) / [pg](../index.md) / TriggerOptions

# Type Alias: TriggerOptions\<T\>

> **TriggerOptions**\<`T`\>: `object`

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `string` \| `undefined` |

## Type declaration

### columns?

> `optional` **columns**: `T`[]

Target columns for `update of` events.

### condition?

> `optional` **condition**: `RawBuilder`\<`string`\>

A Boolean expression that determines whether the trigger function will actually be executed.

### events?

> `optional` **events**: (`"insert"` \| `"update"` \| `"delete"` \| `"truncate"` \| `"update of"`)[]

The event that will fire the trigger. Multiple events can be specified.
- `insert`: the trigger is fired on insert events.
- `update`: the trigger is fired on update events.
- `delete`: the trigger is fired on delete events.
- `truncate`: the trigger is fired on truncate events.
- `update of`: the trigger is fired on update events that affect the specified columns.

For `update of` events, you need to specify a list of columns in the `columns` property.
The trigger will only fire if at least one of the listed columns is mentioned as a target of the update
or if one of the listed columns is a generated column that depends on a column that is the target of the update.

### fireWhen

> **fireWhen**: `"before"` \| `"after"` \| `"instead of"`

Controls when the trigger function is called.

- `before`: The function is called before the event.
- `after`: The function is called after the event.
- `instead of`: The function is called instead of the event.

### forEach

> **forEach**: `"row"` \| `"statement"`

Controls whether the trigger function should be fired once for every row affected by the trigger event,
or just once per SQL statement.

### function

> **function**: `object`

Function which is executed when the trigger fires.
Options:
- `name`: The name of the function.
- `args`: Arguments to pass to the function.

### function.args?

> `optional` **args**: (`string` \| `RawBuilder`\<`unknown`\>)[]

List of arguments to pass to the function.
When referencing columns, use the `sql` helper.

### function.name

> **name**: `string`

The name of the function.

### referencingNewTableAs?

> `optional` **referencingNewTableAs**: `string`

Relation name that the trigger can use to access the after-image transition relation
(row sets that include all of the rows inserted, deleted, or modified by the current SQL statement).

Allows triggers to see a global view of what the statement did, not just one row at a time.

### referencingOldTableAs?

> `optional` **referencingOldTableAs**: `string`

Relation name that the trigger can use to access the before-image transition relation
(row sets that include all of the rows inserted, deleted, or modified by the current SQL statement).

Allows triggers to see a global view of what the statement did, not just one row at a time.

## Defined in

[../internal/pg/src/schema/trigger.ts:36](https://github.com/dunkelbraun/monolayer/blob/6bdf3be3c6969418f99f4a76945aeb545cab66bd/internal/pg/src/schema/trigger.ts#L36)
