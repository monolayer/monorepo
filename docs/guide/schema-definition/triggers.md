# Triggers

You can add [triggers](./glossary.md#trigger) to a table in its definition with the [`trigger`](./../../reference/api/pg/functions/trigger.md) function:

```ts
const users = table({
  columns: {
  	id: integer(),
  	updatedAt: timestamp().default(sql`now()`),
  	updatedAtTwo: timestamp().default(sql`now()`),
  },
  triggers: [ // [!code highlight]
    trigger({ // [!code highlight]
	    fireWhen: "before", // [!code highlight]
	    events: ["update"], // [!code highlight]
	    forEach: "row", // [!code highlight]
	    function: { // [!code highlight]
		    name: "moddatetime", // [!code highlight]
		    args: [sql.ref("updatedAt")], // [!code highlight]
	    }, // [!code highlight]
    }) // [!code highlight]
  ], // [!code highlight]
});
```

You can read more about the different options to configure a trigger in [TriggerOptions](./../../reference/api//pg/type-aliases/TriggerOptions.md).


For the official PostgreSQL documentation on triggers visit [CREATE TRIGGER](https://www.postgresql.org/docs/current/sql-createtrigger.html)


