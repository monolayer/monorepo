import type { ForeignKeyRule } from "../introspection/database/foreign_key_constraint.js";

export function pgForeignKeyConstraint(
	columns: string[],
	targetTable: string,
	targetColumns: string[],
	options?: {
		deleteRule?: Lowercase<ForeignKeyRule>;
		updateRule?: Lowercase<ForeignKeyRule>;
	},
) {
	return new PgForeignKeyConstraint(
		columns,
		targetTable,
		targetColumns,
		options,
	);
}

export class PgForeignKeyConstraint {
	options: {
		deleteRule: ForeignKeyRule;
		updateRule: ForeignKeyRule;
	};
	constructor(
		public columns: string[],
		public targetTable: string,
		public targetColumns: string[],
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
}
