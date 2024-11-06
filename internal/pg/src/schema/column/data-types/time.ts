import { PgColumn } from "~pg/schema/column/column.js";
import type { DateTimePrecision } from "~pg/schema/column/types.js";

/**
 * Column that stores times of day (no date) without time zone.
 * @param precision - Number of fractional digits retained in the seconds field. The allowed range is from 0 to 6.
 * @remarks
 * Without `precision` specified, there is no explicit bound on precision.
 *
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
 * import { schema, table, time } from "monolayer/pg";
 * import { zodSchema } from "monolayer/zod";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         start: time(),
 *       },
 *     }),
 *   },
 * });
 *
 * // Kysely database schema type
 * type DB = typeof dbSchema.infer;
 * // Zod Schema
 * const schema = zodSchema(database.tables.example);
 * ```
 * @see
 * {@link https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME | time without time zone} (*PostgreSQL Docs*)
 *
 * @group Schema Definition
 * @category Column Types
 */
export function time(precision?: DateTimePrecision) {
	return new PgTime(precision);
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgTime extends PgColumn<string, string> {
	/**
	 * @hidden
	 */
	constructor(precision?: DateTimePrecision) {
		if (precision !== undefined) {
			super(`time(${precision})`, `time without time zone`);
			this.info.datetimePrecision = precision;
		} else {
			super("time", `time without time zone`);
		}
	}
}
