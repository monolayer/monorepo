import { PgColumn } from "../column.js";

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
 * **Zod Schema**
 *
 * *Types:*
 * ```ts
 * {
 *   input?: bigint | number | string | null | undefined;
 *   output?: string | null | undefined;
 * }
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * *Validations:* *
 * - Input value must be `bigint`, `number`, `string`, or `null`.
 * - Explicit `undefined` values are rejected.
 * - Non-null values must be either:
 *   - Coercible to BigInt.
 *   - `NaN`, `Infinity`, or `-Infinity`.
 * - Bigint values must be:
 *   - Lower than -1e308.
 *   - Greater than 1e308.
 * @example
 * ```ts
 * import { doublePrecision, pgDatabase, table } from "kysely-kinetic";
 * import { zodSchema } from "kysely-kinetic/zod";
 *
 * const database = pgDatabase({
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
 * type DB = typeof database.infer;
 * // Zod Schema
 * const schema = zodSchema(database.tables.example);
 * ```
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-FLOAT | double precision }
 */
export function doublePrecision() {
	return new PgDoublePrecision();
}

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
