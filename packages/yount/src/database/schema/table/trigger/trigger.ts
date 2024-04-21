import { type RawBuilder } from "kysely";

export type TriggerFiringTime = "before" | "after" | "instead of";

export type TriggerEvent =
	| "insert"
	| "update"
	| "delete"
	| "truncate"
	| "update of";

type TriggerOptions<T> = {
	fireWhen: "before" | "after" | "instead of";
	events?: ("insert" | "update" | "delete" | "truncate" | "update of")[];
	columns?: T[];
	referencingNewTableAs?: string;
	referencingOldTableAs?: string;
	condition?: RawBuilder<string>;
	forEach: "row" | "statement";
	function: {
		name: string;
		args?: (string | { column: T })[];
	};
};

export function trigger<T extends string>(triggerOtions: TriggerOptions<T>) {
	return new PgTrigger<T>(triggerOtions);
}

export class PgTrigger<T extends string> {
	/**
	 * @hidden
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static info(trigger: PgTrigger<any>) {
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
