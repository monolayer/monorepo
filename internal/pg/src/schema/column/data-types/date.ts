import { PgColumn, valueWithHash } from "~pg/schema/column/column.js";

/**
 * Column that stores dates (without time of day).
 * @remarks
 * Range: 4713 BC and 5874897 AD.
 *
 * The JavaScript [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#the_epoch_timestamps_and_invalid_date) implementation
 * can represent only a maximum of September 13, 275760 AD.
 * If you need to read/store dates after this maximum, you'll have to implement a custom type
 * serializer and parser with [node-pg-types](https://github.com/brianc/node-pg-types).

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
 * **Zod Schema**
 *
 * *Types:*
 * ```ts
 * {
 *   input?: Date | string | null | undefined;
 *   output?: Date | null | undefined;
 * }
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * *Validations:* *
 * - Value must be `Date`, `string`, or `null`.
 * - Explicit `undefined` values are rejected.
 * - String values must be coercible to `Date`.
 * @example
 * ```ts
 * import { date, schema, table } from "monolayer/pg";
 * import { zodSchema } from "monolayer/zod";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         createdAt: date(),
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
 * *PostgreSQL Doc*: {@link https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME | date}
 *
 * @group Schema Definition
 * @category Column Types
 */
export function date() {
	return new PgDate();
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgDate extends PgColumn<Date, Date | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("date", "date");
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
		return valueWithHash(
			`'${val.split("T")[0] || ""}'::${this._native_data_type}`,
		);
	}
}
