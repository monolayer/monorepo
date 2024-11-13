import { StringColumn } from "~pg/schema/column/column.js";

/**
 * Column that stores MAC addresses.
 * @remarks
 * **Kysely database schema type definition**
 * ```ts
 * {
 *   readonly __select__: string | null;
 *   readonly __insert__: string | null | undefined;
 *   readonly __update__: string | null;
 * };
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * @example
 * ```ts
 * import { macaddr, schema, table } from "@monolayer/pg/schema";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         address: macaddr(),
 *       },
 *     }),
 *   },
 * });
 *
 * // Kysely database schema type
 * type DB = typeof dbSchema.infer;
 * ```
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-net-types.html#DATATYPE-MACADDR | macaddr}
 *
 * @group Schema Definition
 * @category Column Types
 */
export function macaddr() {
	return new PgMacaddr();
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgMacaddr extends StringColumn {
	/**
	 * @hidden
	 */
	constructor() {
		super("macaddr");
	}
}
