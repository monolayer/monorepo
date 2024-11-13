import { PgColumn } from "~pg/schema/column/column.js";

/**
 * Column that stores inexact, variable-precision numeric types.
 * @remarks
 * Range: around 1E-307 to 1E+308 with a precision of at least 15 digits.
 *
 * Inexact means that some values cannot be converted exactly to the internal format and are stored as approximations,
 * so that storing and retrieving a value might show slight discrepancies.
 *
 * It also accepts have several special values:
 * - `Infinity`
 * - `-Infinity`
 * - `NaN`
 *
 * **Kysely database schema type definition**
 * ```ts
 * {
 *   readonly __select__: string | null;
 *   readonly __insert__: bigint | number | string | null | undefined;
 *   readonly __update__: bigint | number | string | null;
 * };
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * @example
 * ```ts
 * import { doublePrecision, schema, table } from "@monolayer/pg/schema";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         value: doublePrecision(),
 *       },
 *     }),
 *   },
 * });
 *
 * // Kysely database schema type
 * type DB = typeof dbSchema.infer;
 * ```
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-FLOAT | double precision }
 *
 * @group Schema Definition
 * @category Column Types
 */
export function doublePrecision() {
	return new PgDoublePrecision();
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgDoublePrecision extends PgColumn<
	string,
	number | bigint | string
> {
	/**
	 * @hidden
	 */
	constructor() {
		super("double precision", "double precision");
	}
}
