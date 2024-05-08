import type { ForeignKeyRule } from "~/database/schema/introspect-table.js";
import type { AnyPgTable, PgTable } from "../../table.js";

/**
 * Defines a foreign key constraint on a column or a group of columns.
 *
 * Values in the column (or a group of columns) must match the values appearing in some row of another table,
 * maintaining referential integrity between two related tables.
 *
 * @example
 * ```ts
 * import { integer, schema, table } from "monolayer/pg";
 *
 * const users = table({
 *  columns: {
 *    id: integer().generatedAlwaysAsIdentity(),
 *  },
 * });
 *
 * const documents = table({
 *   columns: {
 *     id: integer().generatedAlwaysAsIdentity(),
 *     userId: integer(),
 *   },
 *   constraints: {
 *     foreignKey: foreignKey(["userId"], users, ["id"]),
 *   },
 * });
 *
 * const dbSchema = schema({
 *   tables: {
 *     users,
 *     documents,
 *   },
 * });
 * ```
 *
 * @see
 * *PostgreSQL docs*: {@link https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK | Foreign Keys }
 */
export function foreignKey<T extends string, C extends AnyPgTable>(
	/**
	 * The column or a group of columns that will be constrained by the foreign key.
	 */
	columns: T[],
	/**
	 * The target table that the foreign key references.
	 */
	targetTable: C,
	/**
	 * The column or a group of columns in the target table that the foreign key references.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	targetColumns: C extends PgTable<infer U, any> ? (keyof U)[] : never,
) {
	return new PgForeignKey(columns, targetTable, targetColumns as (keyof C)[]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function foreignKeyOptions<T extends PgForeignKey<any, any>>(
	foreignKey: T,
) {
	assertForeignKeyWithInfo(foreignKey);
	return foreignKey.options;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isExternalForeignKey<T extends PgForeignKey<any, any>>(
	foreignKey: T,
) {
	assertForeignKeyWithInfo(foreignKey);
	return foreignKey.isExternal;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertForeignKeyWithInfo<T extends PgForeignKey<any, any>>(
	val: T,
): asserts val is T & {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	options: ForeignKeyOptions<AnyPgTable>;
	isExternal: boolean;
} {
	true;
}
export type ForeignKeyOptions<T extends AnyPgTable> = {
	columns: string[];
	targetTable: T;
	targetColumns: string[];
	deleteRule: ForeignKeyRule;
	updateRule: ForeignKeyRule;
};

export class PgForeignKey<T extends string, C extends AnyPgTable> {
	/**
	 * @hidden
	 */
	protected isExternal: boolean;

	/**
	 * @hidden
	 */
	protected options: ForeignKeyOptions<C>;

	/**
	 * @hidden
	 */
	constructor(
		/**
		 * @hidden
		 */
		protected columns: T[],
		targetTable: C,
		targetColumns: (keyof C)[],
	) {
		this.isExternal = false;
		this.options = {
			columns: this.columns,
			targetTable,
			targetColumns: targetColumns as string[],
			deleteRule: "NO ACTION",
			updateRule: "NO ACTION",
		};
	}

	deleteRule(rule: Lowercase<ForeignKeyRule>) {
		this.options.deleteRule = rule.toUpperCase() as ForeignKeyRule;
		return this;
	}

	updateRule(rule: Lowercase<ForeignKeyRule>) {
		this.options.updateRule = rule.toUpperCase() as ForeignKeyRule;
		return this;
	}

	external() {
		this.isExternal = true;
		return this;
	}
}

export type AnyPgForeignKey = PgForeignKey<string, AnyPgTable>;
