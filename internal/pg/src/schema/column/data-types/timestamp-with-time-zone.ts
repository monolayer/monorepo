import { PgColumn, valueWithHash } from "~pg/schema/column/column.js";
import type { DateTimePrecision } from "~pg/schema/column/types.js";

/**
 * Column that stores both date and time with time zone with an optional precision.
 * @param precision - Number of fractional digits retained in the seconds field. The allowed range is from 0 to 6.
 * @remarks
 * Without `precision` specified, there is no explicit bound on precision.
 * It can store date / times between 4713 BC and 294276 AD.
 *
 * The JavaScript [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#the_epoch_timestamps_and_invalid_date) implementation
 * can represent only a maximum of September 13, 275760 AD.
 * If you need to read/store dates after this maximum, you'll have to implement a custom type
 * serializer and parser with [node-pg-types](https://github.com/brianc/node-pg-types).
 *
 * **Kysely database schema type definition**
 * ```ts
 * {
 *   readonly __select__: Date | null;
 *   readonly __insert__: Date | string | null | undefined;
 *   readonly __update__: Date | string | null;
 * };
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * @example
 * ```ts
 * import { schema, table, timestampWithTimeZone } from "@monolayer/pg/schema";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         createdAt: timestampWithTimeZone(),
 *       },
 *     }),
 *   },
 * });
 *
 * // Kysely database schema type
 * type DB = typeof dbSchema.infer;
 * ```
 * @see
 * {@link https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME | timestamp without time zone} (*PostgreSQL Docs*)
 *
 * @group Schema Definition
 * @category Column Types
 */
export function timestampWithTimeZone(precision?: DateTimePrecision) {
	return new PgTimestampWithTimeZone(precision);
}

/**
 * Column that stores both date and time with time zone with an optional precision.
 * @param precision - Number of fractional digits retained in the seconds field. The allowed range is from 0 to 6.
 * @remarks
 * Without `precision` specified, there is no explicit bound on precision.
 * It can store date / times between 4713 BC and 294276 AD.
 *
 * The JavaScript [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#the_epoch_timestamps_and_invalid_date) implementation
 * can represent only a maximum of September 13, 275760 AD.
 * If you need to read/store dates after this maximum, you'll have to implement a custom type
 * serializer and parser with [node-pg-types](https://github.com/brianc/node-pg-types).
 *
 * **Kysely database schema type definition**
 * ```ts
 * {
 *   readonly __select__: Date | null;
 *   readonly __insert__: Date | string | null | undefined;
 *   readonly __update__: Date | string | null;
 * };
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * @example
 * ```ts
 * import { schema, table, timestamptz } from "@monolayer/pg/schema";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         createdAt: timestamptz(),
 *       },
 *     }),
 *   },
 * });
 *
 * // Kysely database schema type
 * type DB = typeof dbSchema.infer;
 * ```
 * @see
 * {@link https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME | timestamp without time zone} (*PostgreSQL Docs*)
 *
 * @group Schema Definition
 * @category Column Types
 */
export function timestamptz(precision?: DateTimePrecision) {
	return timestampWithTimeZone(precision);
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgTimestampWithTimeZone extends PgColumn<Date, Date | string> {
	/**
	 * @hidden
	 */
	constructor(precision?: DateTimePrecision) {
		if (precision !== undefined) {
			super(
				`timestamp(${precision}) with time zone`,
				`timestamp with time zone`,
			);
			this.info.datetimePrecision = precision;
		} else {
			super("timestamp with time zone", `timestamp with time zone`);
		}
	}

	/**
	 * @hidden
	 */
	protected transformDefault(value: string | Date) {
		let val: string;
		if (value instanceof Date) {
			val = value.toISOString();
		} else {
			val = value;
		}
		return valueWithHash(`'${val}'::${this._native_data_type}`);
	}
}
