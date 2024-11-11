import { type Expression, type RawBuilder } from "kysely";

/**
 * @group Schema Definition
 * @category Other
 */
export function trigger<T extends { columns?: string[] }>(
	triggerOptions: T & TriggerOptions<InferColumns<T>>,
): PgTrigger<InferColumns<T>> {
	return new PgTrigger<InferColumns<T>>(triggerOptions);
}

/**
 * @group Classes, Types, and Interfaces
 * @category Types and Interfaces
 */
export type TriggerFiringTime = "before" | "after" | "instead of";

/**
 * @group Classes, Types, and Interfaces
 * @category Types and Interfaces
 */
export type TriggerEvent =
	| "insert"
	| "update"
	| "delete"
	| "truncate"
	| "update of";

type InferColumns<T> = T extends { columns: (infer C)[] } ? C : never;

/**
 * @group Classes, Types, and Interfaces
 * @category Types and Interfaces
 */
export type TriggerOptions<T extends string | undefined> = {
	/**
	 * Controls when the trigger function is called.
	 *
	 * - `before`: The function is called before the event.
	 * - `after`: The function is called after the event.
	 * - `instead of`: The function is called instead of the event.
	 */
	fireWhen: "before" | "after" | "instead of";
	/**
	 * The event that will fire the trigger. Multiple events can be specified.
	 * - `insert`: the trigger is fired on insert events.
	 * - `update`: the trigger is fired on update events.
	 * - `delete`: the trigger is fired on delete events.
	 * - `truncate`: the trigger is fired on truncate events.
	 * - `update of`: the trigger is fired on update events that affect the specified columns.
	 *
	 * For `update of` events, you need to specify a list of columns in the `columns` property.
	 * The trigger will only fire if at least one of the listed columns is mentioned as a target of the update
	 * or if one of the listed columns is a generated column that depends on a column that is the target of the update.
	 */
	events?: ("insert" | "update" | "delete" | "truncate" | "update of")[];
	/**
	 * Target columns for `update of` events.
	 */
	columns?: T[];
	/**
	 * Relation name that the trigger can use to access the after-image transition relation
	 * (row sets that include all of the rows inserted, deleted, or modified by the current SQL statement).
	 *
	 * Allows triggers to see a global view of what the statement did, not just one row at a time.
	 */
	referencingNewTableAs?: string;
	/**
	 * Relation name that the trigger can use to access the before-image transition relation
	 * (row sets that include all of the rows inserted, deleted, or modified by the current SQL statement).
	 *
	 * Allows triggers to see a global view of what the statement did, not just one row at a time.
	 */
	referencingOldTableAs?: string;
	/**
	 * A Boolean expression that determines whether the trigger function will actually be executed.
	 */
	condition?: RawBuilder<string>;
	/**
	 * Controls whether the trigger function should be fired once for every row affected by the trigger event,
	 * or just once per SQL statement.
	 */
	forEach: "row" | "statement";
	/**
	 * Function which is executed when the trigger fires.
	 * Options:
	 * - `name`: The name of the function.
	 * - `args`: Arguments to pass to the function.
	 */
	function: {
		/**
		 * The name of the function.
		 */
		name: string;
		/**
		 * List of arguments to pass to the function.
		 * When referencing columns, use the `sql` helper.
		 */
		args?: (string | RawBuilder<unknown>)[];
	};
};

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgTrigger<T extends string | never> {
	/**
	 * @hidden
	 */
	static info(trigger: AnyTrigger) {
		return {
			firingTime: trigger.options.fireWhen,
			events: trigger.options.events,
			columns: trigger.options.columns,
			referencingNewTableAs: trigger.options.referencingNewTableAs,
			referencingOldTableAs: trigger.options.referencingOldTableAs,
			condition: trigger.options.condition,
			forEach: trigger.options.forEach,
			functionName: trigger.options.function.name,
			functionArgs: trigger.options.function.args,
			isExternal: trigger.isExternal,
		};
	}
	/**
	 * @hidden
	 */
	protected isExternal: boolean;

	constructor(protected options: TriggerOptions<T>) {
		this.isExternal = false;
	}
}

/**
 * @group Schema Definition
 * @category Unmanaged
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mappedTrigger(name: string, definition: Expression<any>) {
	return new PgMappedTrigger(name, definition);
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgMappedTrigger {
	constructor(
		public name: string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		protected expression: Expression<any>,
	) {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyTrigger = PgTrigger<any>;
