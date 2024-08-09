import { MaxLengthColumn } from "~/schema/column/column.js";

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
 * **Zod Schema**
 *
 * *Types:*
 * ```ts
 * {
 *   input?: string | null | undefined;
 *   output?: string | null | undefined;
 * }
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * *Validations:*
 * - Explicit `undefined` values are rejected.
 * - Value must be a string of 1's and 0's.
 * - Value cannot exceed `maximumLength`.
 * @example
 * ```ts
 * import { schema, table, varbit } from "monolayer/pg";
 * import { zodSchema } from "monolayer/zod";
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
 * // Zod Schema
 * const schema = zodSchema(database.tables.example);
 * ```
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-bit.html#DATATYPE-BIT | bit varying(n)}
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
 * **Zod Schema**
 *
 * *Types:*
 * ```ts
 * {
 *   input?: string | null | undefined;
 *   output?: string | null | undefined;
 * }
 * ```
 * Nullability and optionality will be changed by the column's constraints, generated values, and default data values.
 *
 * *Validations:*
 * - Explicit `undefined` values are rejected.
 * - Value must be a string of 1's and 0's.
 * - Value cannot exceed `maximumLength`.
 * @example
 * ```ts
 * import { schema, table, varbit } from "monolayer/pg";
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         code: varbit(),
 *       },
 *     }),
 *   },
 * });
 * ```
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-bit.html#DATATYPE-BIT | bit varying(n)}
 */
export function bitVarying(maximumLength?: number) {
	return varbit(maximumLength);
}

export class PgBitVarying extends MaxLengthColumn<string, string> {
	/**
	 * @hidden
	 */
	constructor(maximumLength?: number) {
		super("bit varying", maximumLength);
	}
}
