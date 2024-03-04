import { type RawBuilder } from "kysely";

export type TriggerFiringTime = "before" | "after" | "instead of";

export type TriggerEvent =
	| "insert"
	| "update"
	| "delete"
	| "truncate"
	| "update of";

export interface PgTriggerFunctionOptions {
	firingTime: TriggerFiringTime;
	events: TriggerEvent[];
	columns?: string[];
	referencingNewTableAs?: string;
	referencingOldTableAs?: string;
	condition?: RawBuilder<string>;
	forEach: "row" | "statement";
	functionName: string;
	functionArgs?: {
		value: string;
		columnName?: true;
	}[];
}

export function pgTrigger() {
	return new PgTrigger();
}

export class PgTrigger {
	#compileArgs: Partial<PgTriggerFunctionOptions>;

	constructor() {
		this.#compileArgs = {};
	}

	events(events: Pick<PgTriggerFunctionOptions, "events">["events"]) {
		this.#compileArgs.events = events;
		return this;
	}

	fireWhen(
		fireWhen: Pick<PgTriggerFunctionOptions, "firingTime">["firingTime"],
	) {
		this.#compileArgs.firingTime = fireWhen;
		return this;
	}

	referencingNewTableAs(
		newTable: Pick<
			PgTriggerFunctionOptions,
			"referencingNewTableAs"
		>["referencingNewTableAs"],
	) {
		this.#compileArgs.referencingNewTableAs = newTable;
		return this;
	}

	referencingOldTableAs(
		oldTable: Pick<
			PgTriggerFunctionOptions,
			"referencingOldTableAs"
		>["referencingOldTableAs"],
	) {
		this.#compileArgs.referencingOldTableAs = oldTable;
		return this;
	}

	columns(columns: Pick<PgTriggerFunctionOptions, "columns">["columns"]) {
		this.#compileArgs.columns = columns;
		return this;
	}

	condition(
		condition: Pick<PgTriggerFunctionOptions, "condition">["condition"],
	) {
		this.#compileArgs.condition = condition;
		return this;
	}

	forEach(forEach: Pick<PgTriggerFunctionOptions, "forEach">["forEach"]) {
		this.#compileArgs.forEach = forEach;
		return this;
	}

	function(
		functionName: Pick<
			PgTriggerFunctionOptions,
			"functionName"
		>["functionName"],
		functionArgs?: Pick<
			PgTriggerFunctionOptions,
			"functionArgs"
		>["functionArgs"],
	) {
		this.#compileArgs.functionName = functionName;
		this.#compileArgs.functionArgs = functionArgs;
		return this;
	}

	compileArgs() {
		return this.#compileArgs;
	}
}
