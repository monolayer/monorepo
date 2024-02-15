import { Kysely, PostgresDialect, type RawBuilder } from "kysely";
import pg from "pg";

export function trigger(options: PgTriggerFunctionOptions): PgTrigger {
	return new PgTrigger(options);
}

export type TriggerFiringTime = "before" | "after" | "instead of";

export type TriggerEvent =
	| "insert"
	| "update"
	| "delete"
	| "truncate"
	| "update of";

interface PgTriggerFunctionOptions {
	firingTime: TriggerFiringTime;
	events: TriggerEvent[];
	columns?: string[];
	referencingNewTableAs?: string;
	referencingOldTableAs?: string;
	condition?: RawBuilder<string>;
	forEach: "row" | "statement";
	functionName: string;
	functionArgs?: string[];
}

export class PgTrigger {
	#functionCall: string;
	#events: string[];
	#referencing: {
		newTable: string | null;
		oldTable: string | null;
	};
	#fireWhen: string;
	#condition: RawBuilder<string> | null;
	#execute: string | null;

	constructor(options: PgTriggerFunctionOptions) {
		this.#events = options.events.map((event) => {
			if (event === "update of" && options.columns !== undefined) {
				return `UPDATE OF ${options.columns.join(", ")}`;
			}
			return event.toUpperCase();
		});
		this.#functionCall = options.firingTime.toUpperCase();
		this.#referencing = {
			newTable: options.referencingNewTableAs || null,
			oldTable: options.referencingOldTableAs || null,
		};
		this.#fireWhen = `FOR EACH ${options.forEach.toUpperCase()}`;
		this.#condition = options.condition || null;
		this.#execute =
			options.functionArgs !== undefined
				? `${options.functionName}(${options.functionArgs.join(", ")})`
				: `${options.functionName}`;
	}

	compile(triggerName: string, tableName: string) {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const kysely = new Kysely<any>({
			dialect: new PostgresDialect({
				pool: new pg.Pool({}),
			}),
		});

		return [
			`CREATE OR REPLACE TRIGGER ${triggerName}`,
			`${this.#functionCall} ${this.#events.join(" OR ")} ON ${tableName}`,
			`${
				this.#referencing.newTable !== null &&
				this.#referencing.oldTable !== null
					? `REFERENCING NEW TABLE AS ${this.#referencing.newTable} OLD TABLE AS ${this.#referencing.oldTable}`
					: this.#referencing.newTable !== null
					  ? `REFERENCING NEW TABLE AS ${this.#referencing.newTable}`
					  : this.#referencing.oldTable !== null
						  ? `REFERENCING OLD TABLE AS ${this.#referencing.oldTable}`
						  : ""
			}`,
			`${this.#fireWhen}`,
			`${
				this.#condition !== null
					? `WHEN ${this.#condition.compile(kysely).sql}`
					: ""
			}`,
			`EXECUTE FUNCTION ${this.#execute}`,
		]
			.filter((part) => part !== "")
			.join("\n");
	}
}
