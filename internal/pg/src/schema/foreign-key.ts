import type { AnyPgTable, PgTable } from "~/schema/table.js";

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
 * You can also create self-referential foreign keys, by ommiting the target table:
 *
 * ```ts
 * import { integer, schema, table } from "monolayer/pg";
 *
 * const tree = table({
 *   columns: {
 *     nodeId: integer().generatedAlwaysAsIdentity(),
 *     parentId: integer(),
 *   },
 *   constraints: {
 *     foreignKey: foreignKey(["parentId"], ["nodeId"]),
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
	 * The column or a group of columns in the target table that the foreign key references.
	 */
	targetColumns: T[],
): PgForeignKey<T, C>;
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
): PgForeignKey<T, C>;
export function foreignKey<T extends string, C extends AnyPgTable>(
	...args: unknown[]
): PgForeignKey<T, C> | PgSelfReferentialForeignKey<T, T> {
	if (args[2] !== undefined) {
		return new PgForeignKey(
			args[0] as T[],
			args[1] as C,
			args[2] as (keyof C)[],
		);
	} else {
		return new PgSelfReferentialForeignKey(args[0] as T[], args[1] as T[]);
	}
}

export function foreignKeyOptions<
	T extends
		| AnyPgForeignKey
		| AnyPgSelfReferentialForeignKey
		| AnyPgExternalForeignKey,
>(foreignKey: T) {
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

function assertForeignKeyWithInfo<
	T extends
		| AnyPgForeignKey
		| AnyPgSelfReferentialForeignKey
		| AnyPgExternalForeignKey,
>(
	val: T,
): asserts val is T & {
	options: ForeignKeyOptions<AnyPgTable>;
	isExternal: boolean;
} {}

export type ForeignKeyOptions<T extends AnyPgTable> = {
	columns: string[];
	targetTable: T | string;
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

export type SelfReferentialForeignKeyOptions = {
	columns: string[];
	targetColumns: string[];
	deleteRule: ForeignKeyRule;
	updateRule: ForeignKeyRule;
};

export class PgSelfReferentialForeignKey<T extends string, C extends string> {
	/**
	 * @hidden
	 */
	protected isExternal = false;

	/**
	 * @hidden
	 */
	protected options: SelfReferentialForeignKeyOptions;

	/**
	 * @hidden
	 */
	constructor(
		/**
		 * @hidden
		 */
		protected columns: T[],
		/**
		 * @hidden
		 */
		protected targetColumns: C[],
	) {
		this.isExternal = false;
		this.options = {
			columns: this.columns,
			targetColumns: this.targetColumns,
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

export type AnyPgSelfReferentialForeignKey = PgSelfReferentialForeignKey<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	any
>;

export type PgExternalForeignKeyOptions = {
	columns: string[];
	targetTable: string;
	targetColumns: string[];
	deleteRule: ForeignKeyRule;
	updateRule: ForeignKeyRule;
};

export function unmanagedForeignKey<T extends string, C extends string>(
	columns: T[],
	targetTable: C,
	targetColumns: string[],
) {
	return new PgUnmanagedForeignKey(columns, targetTable, targetColumns);
}

export class PgUnmanagedForeignKey<T extends string, C extends string> {
	/**
	 * @hidden
	 */
	protected isExternal: boolean;

	/**
	 * @hidden
	 */
	protected options: PgExternalForeignKeyOptions;

	/**
	 * @hidden
	 */
	constructor(
		/**
		 * @hidden
		 */
		protected columns: T[],
		targetTable: C,
		targetColumns: string[],
	) {
		this.isExternal = true;
		this.options = {
			columns: this.columns,
			targetTable,
			targetColumns: targetColumns,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPgExternalForeignKey = PgUnmanagedForeignKey<any, any>;

export type ForeignKeyRule =
	| "CASCADE"
	| "SET NULL"
	| "SET DEFAULT"
	| "RESTRICT"
	| "NO ACTION";
