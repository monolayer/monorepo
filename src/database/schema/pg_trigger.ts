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

export type PgTrigger = {
	events: (events: PgTriggerFunctionOptions["events"]) => PgTrigger;
	fireWhen: (fireWhen: PgTriggerFunctionOptions["firingTime"]) => PgTrigger;
	referencingNewTableAs: (
		newTable: PgTriggerFunctionOptions["referencingNewTableAs"],
	) => PgTrigger;
	referencingOldTableAs: (
		oldTable: PgTriggerFunctionOptions["referencingOldTableAs"],
	) => PgTrigger;
	columns: (columns: PgTriggerFunctionOptions["columns"]) => PgTrigger;
	condition: (condition: PgTriggerFunctionOptions["condition"]) => PgTrigger;
	forEach: (forEach: PgTriggerFunctionOptions["forEach"]) => PgTrigger;
	function: (
		functionName: PgTriggerFunctionOptions["functionName"],
		functionArgs?: PgTriggerFunctionOptions["functionArgs"],
	) => PgTrigger;
	compileArgs: () => Partial<PgTriggerFunctionOptions>;
};

export function pgTrigger() {
	const compileArgs: Partial<PgTriggerFunctionOptions> = {};
	const trigger: PgTrigger = {
		events: (events) => {
			compileArgs.events = events;
			return trigger;
		},
		fireWhen: (fireWhen) => {
			compileArgs.firingTime = fireWhen;
			return trigger;
		},
		referencingNewTableAs: (newTable) => {
			compileArgs.referencingNewTableAs = newTable;
			return trigger;
		},
		referencingOldTableAs: (oldTable) => {
			compileArgs.referencingOldTableAs = oldTable;
			return trigger;
		},
		columns: (columns) => {
			compileArgs.columns = columns;
			return trigger;
		},
		condition: (condition) => {
			compileArgs.condition = condition;
			return trigger;
		},
		forEach: (forEach) => {
			compileArgs.forEach = forEach;
			return trigger;
		},
		function: (functionName, functionArgs) => {
			compileArgs.functionName = functionName;
			compileArgs.functionArgs = functionArgs;
			return trigger;
		},
		compileArgs: () => compileArgs,
	};
	return trigger;
}
