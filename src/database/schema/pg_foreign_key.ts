import type { ForeignKeyRule } from "../introspection/database/foreign_key_constraint.js";
import type { AnyPgTable, PgTable } from "./pg_table.js";

export type PgForeignKey<T, C = AnyPgTable> = {
	cols: T;
	targetTable: C;
	targetCols: C extends PgTable<infer U> ? (keyof U)[] | keyof U : never;
	options: {
		deleteRule: ForeignKeyRule;
		updateRule: ForeignKeyRule;
	};
	columns: string[];
	targetColumns: string[];
};

export function pgForeignKey<T, C = AnyPgTable>(
	columns: T,
	targetTable: C,
	targetColumns: C extends PgTable<infer U> ? (keyof U)[] | keyof U : never,
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
