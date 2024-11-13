import { MaxLengthColumn } from "~pg/schema/column/column.js";

/**
 * Column that stores bit strings (strings of 1's and 0's) of up to a maximum length.
 * @param maximumLength - Fixed length of the bit string. Must a positive integer.
 *
 * @remarks
 * Without `maximumLength` specified the bit string has unlimited length.
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
 * import { schema, table, varbit } from "@monolayer/pg/schema";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         code: varbit(),
 *       },
 *     }),
 *   },
 * });
 *
 * // Kysely database schema type
 * type DB = typeof dbSchema.infer;
 * ```
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-bit.html#DATATYPE-BIT | bit varying(n)}
 *
 * @group Schema Definition
 * @category Column Types
 */
export function varbit(maximumLength?: number) {
	return new PgBitVarying(maximumLength);
}

/**
 * Column that stores bit strings (strings of 1's and 0's) of up to a maximum length.
 * @param maximumLength - Fixed length of the bit string. Must a positive integer.
 *
 * Without `maximumLength` specified the bit string has unlimited length.
 *
 * **Kysely database schema type definition**
 * ```ts
 * {
 *   readonly __select__: string | null;
 *   readonly __insert__: string | null | undefined;
 *   readonly __update__: string | null;
 * };
 * ```
 * Nullability and optionality will be changed by the column's constraints, generated values, and default data values.
 *
 * @example
 * ```ts
 * import { schema, table, varbit } from "@monolayer/pg/schema";
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         code: varbit(),
 *       },
 *     }),
 *   },
 * });
 *
 * // Kysely database schema type
 * type DB = typeof dbSchema.infer;
 * ```
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-bit.html#DATATYPE-BIT | bit varying(n)}
 */
export function bitVarying(maximumLength?: number) {
	return varbit(maximumLength);
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgBitVarying extends MaxLengthColumn<string, string> {
	/**
	 * @hidden
	 */
	constructor(maximumLength?: number) {
		super("bit varying", maximumLength);
	}
}
