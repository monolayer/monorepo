import { PgColumn } from "~pg/schema/column/column.js";

/**
 * Column that stores inexact, variable-precision numeric types.
 *
 * @remarks
 * Range: around 1E-37 to 1E+37 with a precision of at least 15 digits.
 *
 * Inexact means that some values cannot be converted exactly to the internal format and are stored as approximations,
 * so that storing and retrieving a value might show slight discrepancies.
 *
 * In addition to ordinary numeric values, the floating-point types have several special values:
 * - `Infinity`
 * - `-Infinity`
 * - `NaN`
 *
 * **Kysely database schema type definition**
 * ```ts
 * {
 *   readonly __select__: number | null;
 *   readonly __insert__: number | string | null | undefined;
 *   readonly __update__: number | null;
 * };
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * @example
 * ```ts
 * import { schema, real, table } from "@monolayer/pg/schema";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         number: real(),
 *       },
 *     }),
 *   },
 * });
 *
 * // Kysely database schema type
 * type DB = typeof dbSchema.infer;
 * ```
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-FLOAT | real}
 *
 * @group Schema Definition
 * @category Column Types
 */
export function real() {
	return new PgReal();
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgReal extends PgColumn<number, number | bigint | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("real", "real");
	}
}
