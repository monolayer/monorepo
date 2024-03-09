import type { ForeignKeyRule } from "../introspection/database/foreign_key_constraint.js";
import type { PgTable } from "./pg_table.js";

export type PgForeignKey<T, C> = {
	cols: T;
	targetTable: C;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	targetCols: C extends PgTable<infer U, any> ? (keyof U)[] | keyof U : never;
	options: {
		deleteRule: ForeignKeyRule;
		updateRule: ForeignKeyRule;
	};
	columns: string[];
	targetColumns: string[];
};

export function pgForeignKey<T, C>(
	columns: T,
	targetTable: C,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	targetColumns: C extends PgTable<infer U, any>
		? (keyof U)[] | keyof U
		: never,
	options?: {
		deleteRule?: Lowercase<ForeignKeyRule>;
		updateRule?: Lowercase<ForeignKeyRule>;
	},
) {
	const foreignKey: PgForeignKey<T, C> = {
		cols: columns,
		targetTable,
		targetCols: targetColumns,
		options: {
			deleteRule: (options?.deleteRule?.toUpperCase() ??
				"NO ACTION") as ForeignKeyRule,
			updateRule: (options?.updateRule?.toUpperCase() ??
				"NO ACTION") as ForeignKeyRule,
		},
		columns: columns as string[],
		targetColumns:
			typeof targetColumns === "string"
				? [targetColumns]
				: (targetColumns as string[]),
	};
	return foreignKey;
}
