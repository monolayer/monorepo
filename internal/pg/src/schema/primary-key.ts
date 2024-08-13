/**
 * Defines a column or a group of columns, that can be used as a unique identifier for rows in the table.
 *
 *
 * @remarks
 * A primary key constraint is a special case of a unique contraint that also guarantees that all of the attributes
 * within the primary key do not have null values.
 *
 * A table can have at most one primary key.
 *
 * @example
 * ```ts
 * import { integer, schema, table } from "monolayer/pg";
 *
 * const dbSchema = schema({
 *   tables: {
 *     documents: table({
 *       columns: {
 *         id: integer().generatedAlwasyAsIdentity(),
 *       },
 *       constraints: {
 *         primaryKey: primaryKey(["id"]),
 *       },
 *     }),
 *   },
 * });
 * ```
 *
 * @see
 * *PostgreSQL docs*: {@link https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-PRIMARY-KEYS | Primary Keys }
 *
 * @group Schema Definition
 * @category Indexes and Constraints
 */
export function primaryKey<T extends string, PK extends string>(
	columns: (PK | T)[],
) {
	return new PgPrimaryKey(columns);
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgPrimaryKey<T extends string, PK extends string> {
	/**
	 * @hidden
	 */
	protected isExternal = false;

	/**
	 * @hidden
	 */
	static info(pk: AnyPgPrimaryKey) {
		return {
			columns: pk.columns,
			isExternal: pk.isExternal,
		};
	}

	/**
	 * @hidden
	 */
	constructor(protected columns: (PK | T)[]) {}

	/**
	 * @hidden
	 */
	external() {
		this.isExternal = true;
		return this;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPgPrimaryKey = PgPrimaryKey<any, any>;
