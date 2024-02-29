import type { ForeignKeyRule } from "../introspection/database/foreign_key_constraint.js";
import type { AnyPgTable, PgTable } from "./pg_table.js";

export function foreignKey<T, C = AnyPgTable>(
	columns: T,
	targetTable: C,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	targetColumns: C extends PgTable<infer U, any>
		? (keyof U)[] | keyof U
		: never,
	options?: {
		deleteRule?: Lowercase<ForeignKeyRule>;
		updateRule?: Lowercase<ForeignKeyRule>;
	},
) {
	return new PgForeignKey(columns, targetTable, targetColumns, options);
}

export class PgForeignKey<T, C = AnyPgTable> {
	cols: T;
	targetTable: C;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	targetCols: C extends PgTable<infer U, any> ? (keyof U)[] | keyof U : never;
	options: {
		deleteRule: ForeignKeyRule;
		updateRule: ForeignKeyRule;
	};

	constructor(
		cols: T,
		targetTable: C,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		targetCols: C extends PgTable<infer U, any> ? (keyof U)[] | keyof U : never,
		options?: {
			deleteRule?: Lowercase<ForeignKeyRule>;
			updateRule?: Lowercase<ForeignKeyRule>;
		},
	) {
		this.cols = cols;
		this.targetTable = targetTable;
		this.targetCols = targetCols;
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
