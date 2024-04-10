import { PgColumn } from "../column.js";

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
 * **Zod Schema**
 *
 * *Types:*
 * ```ts
 * {
 *   input?:  bigint | number | string | null | undefined;
 *   output?: number | null | undefined;
 * }
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * *Validations:*
 * - Explicit `undefined` values are rejected.
 * - Input value must be `number`, `string`, or `null`.
 * - Non-null values must be either:
 *   - coercible to `number`.
 *   - `NaN`, `Infinity`, or `-Infinity`.
 * - `number` values:
 *   - Cannot be lower than -1e37.
 *   - Cannot be greater than 1e37.
 * @example
 * ```ts
 * import { schema, real, table } from "yount/pg";
 * import { zodSchema } from "yount/zod";
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
 * // Zod Schema
 * const schema = zodSchema(database.tables.example);
 * ```
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-FLOAT | real}
 */
export function real() {
	return new PgReal();
}

export class PgReal extends PgColumn<number, number | bigint | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("real", "real");
	}
}
