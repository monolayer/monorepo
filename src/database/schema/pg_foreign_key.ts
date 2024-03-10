import type { ForeignKeyRule } from "../introspection/database/foreign_key_constraint.js";
import type { AnyPgTable, PgTable } from "./pg_table.js";

export type PgForeignKey<T extends string, C> = {
	deleteRule: (rule: Lowercase<ForeignKeyRule>) => PgForeignKey<T, C>;
	updateRule: (rule: Lowercase<ForeignKeyRule>) => PgForeignKey<T, C>;
};

export function pgForeignKey<T extends string, C extends AnyPgTable>(
	columns: T[],
	targetTable: C,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	targetColumns: C extends PgTable<infer U, any> ? (keyof U)[] : never,
) {
	const options: ForeignKeyOptions = {
		columns,
		targetTable,
		targetColumns,
		deleteRule: "NO ACTION",
		updateRule: "NO ACTION",
	};
	const foreignKey: PgForeignKey<T, C> = {
		deleteRule: (rule: Lowercase<ForeignKeyRule>) => {
			options.deleteRule = rule.toUpperCase() as ForeignKeyRule;
			return foreignKey as PgForeignKey<T, C>;
		},
		updateRule: (rule: Lowercase<ForeignKeyRule>) => {
			options.updateRule = rule.toUpperCase() as ForeignKeyRule;
			return foreignKey as PgForeignKey<T, C>;
		},
	};
	Object.defineProperty(foreignKey, "options", {
		value: options,
		writable: false,
	});
	return foreignKey;
}

type ForeignKeyOptions = {
	columns: string[];
	targetTable: AnyPgTable;
	targetColumns: string[];
	deleteRule: ForeignKeyRule;
	updateRule: ForeignKeyRule;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function foreignKeyOptions<T extends PgForeignKey<any, any>>(
	foreignKey: T,
) {
	assertForeignKeyWithOptions(foreignKey);
	return foreignKey.options;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertForeignKeyWithOptions<T extends PgForeignKey<any, any>>(
	val: T,
): asserts val is T & { options: ForeignKeyOptions } {
	true;
}
