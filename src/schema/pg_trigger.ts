import { type RawBuilder } from "kysely";

export type TriggerFiringTime = "before" | "after" | "instead of";

export type TriggerEvent =
	| "insert"
	| "update"
	| "delete"
	| "truncate"
	| "update of";

export class PgTrigger {
	/**
	 * @hidden
	 */
	static info(trigger: PgTrigger) {
		return {
			firingTime: trigger.#firingTime,
			events: trigger.#events,
			columns: trigger.#columns,
			referencingNewTableAs: trigger.#referencingNewTableAs,
			referencingOldTableAs: trigger.#referencingOldTableAs,
			condition: trigger.#condition,
			forEach: trigger.#forEach,
			functionName: trigger.#functionName,
			functionArgs: trigger.#functionArgs,
		};
	}

	/**
	 * @hidden
	 */
	#firingTime = "";
	/**
	 * @hidden
	 */
	#events?: string[];
	/**
	 * @hidden
	 */
	#columns?: string[];
	/**
	 * @hidden
	 */
	#referencingNewTableAs?: string;
	/**
	 * @hidden
	 */
	#referencingOldTableAs?: string;
	/**
	 * @hidden
	 */
	#condition?: RawBuilder<string>;
	/**
	 * @hidden
	 */
	#forEach = "statement";
	/**
	 * @hidden
	 */
	#functionName = "";
	/**
	 * @hidden
	 */
	#functionArgs?: {
		value: string;
		columnName?: true;
	}[] = [];

	/**
	 * @hidden
	 */
	constructor() {}

	events(events: TriggerEvent[]) {
		this.#events = events;
		return this;
	}

	fireWhen(fireWhen: TriggerFiringTime) {
		this.#firingTime = fireWhen;
		return this;
	}

	referencingNewTableAs(newTable: string) {
		this.#referencingNewTableAs = newTable;
		return this;
	}

	referencingOldTableAs(oldTable: string) {
		this.#referencingOldTableAs = oldTable;
		return this;
	}

	columns(columns: string[]) {
		this.#columns = columns;
		return this;
	}

	condition(condition: RawBuilder<string>) {
		this.#condition = condition;
		return this;
	}

	forEach(forEach: "row" | "statement") {
		this.#forEach = forEach;
		return this;
	}

	function(
		functionName: string,
		functionArgs?: {
			value: string;
			columnName?: true;
		}[],
	) {
		this.#functionName = functionName;
		this.#functionArgs = functionArgs;
		return this;
	}
}

export function trigger() {
	return new PgTrigger();
}
