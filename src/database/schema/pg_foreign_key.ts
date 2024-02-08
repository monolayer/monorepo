import type { ForeignKeyRule } from "../introspection/database/foreign_key_constraint.js";
import type { PgTable } from "./pg_table.js";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function foreignKey<T, C = PgTable<string, any>>(
	columns: T,
	targetTable: C,
	targetColumns: C extends PgTable<string, infer U>
		? (keyof U)[] | keyof U
		: never,
	options?: {
		deleteRule?: Lowercase<ForeignKeyRule>;
		updateRule?: Lowercase<ForeignKeyRule>;
	},
) {
	return new PgForeignKey(columns, targetTable, targetColumns, options);
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export class PgForeignKey<T, C = PgTable<string, any>> {
	options: {
		deleteRule: ForeignKeyRule;
		updateRule: ForeignKeyRule;
	};

	constructor(
		private cols: T,
		public targetTable: C,
		private targetCols: C extends PgTable<string, infer U>
			? (keyof U)[] | keyof U
			: never,
		options?: {
			deleteRule?: Lowercase<ForeignKeyRule>;
			updateRule?: Lowercase<ForeignKeyRule>;
		},
	) {
		this.options = {
			deleteRule: (options?.deleteRule?.toUpperCase() ??
				"NO ACTION") as ForeignKeyRule,
			updateRule: (options?.updateRule?.toUpperCase() ??
				"NO ACTION") as ForeignKeyRule,
		};
	}

	get columns() {
		const colArray = [] as string[];
		if (typeof this.cols === "string") {
			colArray.push(this.cols);
		} else {
			colArray.push(...(this.cols as unknown as string[]));
		}
		return colArray;
	}

	get targetColumns() {
		const colsArray = [] as string[];
		if (typeof this.targetCols === "string") {
			colsArray.push(this.targetCols);
		} else {
			colsArray.push(...(this.targetCols as unknown as string[]));
		}
		return colsArray;
	}
}
