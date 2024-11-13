import { PgColumn } from "~pg/schema/column/column.js";

/**
 * Column that can store numbers with a very large number of digits.
 * @param precision - Total count of significant digits in the whole number (number of digits to both sides of the decimal point). Must be positive.
 * @param scale - Count of decimal digits in the fractional part, to the right of the decimal point. Can be positive or negative.
 * @remarks
 * Without any precision or scale numeric values of any length can be stored, up to the implementation limits.
 *
 * In addition to ordinary numeric values, it can store several special values:
 * * Infinity
 * * -Infinity
 * * NaN
 *
 * **Kysely database schema type definition**
 * ```ts
 * {
 *   readonly __select__: string | null;
 *   readonly __insert__: bigint | number | string | null | undefined;
 *   readonly __update__: bigint | number | string | string | null;
 * };
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * @example
 * ```ts
 * import { schema, numeric, table } from "@monolayer/pg/schema";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         amount: numeric(),
 *       },
 *     }),
 *   },
 * });
 *
 * // Kysely database schema type
 * type DB = typeof dbSchema.infer;
 * ```
 * @see
 * {@link https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-NUMERIC | numeric } (*PostgreSQL Docs*)
 *
 * @group Schema Definition
 * @category Column Types
 */
export function numeric(precision?: number, scale?: number) {
	return new PgNumeric(precision, scale);
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgNumeric extends PgColumn<string, number | bigint | string> {
	/**
	 * @hidden
	 */
	constructor(precision?: number, scale = 0) {
		if (precision !== undefined) {
			super(`numeric(${precision}, ${scale})`, "numeric");
			this.info.numericPrecision = precision;
			this.info.numericScale = scale;
		} else {
			super("numeric", "numeric");
		}
	}
}
