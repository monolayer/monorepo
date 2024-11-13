import { MaxLengthColumn } from "../column.js";

/**
 * Column that stores variable-length string with an optional maximum length.
 * @param maximumLength - Maximum character length of strings in the column. Must be greater than zero and cannot exceed 10,485,760.
 * @remarks
 * Without a `maximumLength` specified, the column accepts strings of any length.
 * In any case, the longest possible character string that can be stored is about 1 GB.
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
 * import { characteVarying, schema, table } from "@monolayer/pg/schema";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         name: characteVarying(),
 *       },
 *     }),
 *   },
 * });
 *
 * // Kysely database schema type
 * type DB = typeof dbSchema.infer;
 * ```
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-character.html#DATATYPE-CHARACTER | character varying }
 *
 * @group Schema Definition
 * @category Column Types
 */
export function characterVarying(maximumLength?: number) {
	return new PgCharacterVarying("character varying", maximumLength);
}

/**
 * Column that stores variable-length string with an optional maximum length.
 * @param maximumLength - Maximum character length of strings in the column. Must be greater than zero and cannot exceed 10,485,760.
 * @remarks
 * Without a `maximumLength` specified, the column accepts strings of any length.
 * In any case, the longest possible character string that can be stored is about 1 GB.
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
 * import { characteVarying, schema, table } from "@monolayer/pg/schema";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         name: characteVarying(),
 *       },
 *     }),
 *   },
 * });
 *
 * // Kysely database schema type
 * type DB = typeof dbSchema.infer;
 * ```
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-character.html#DATATYPE-CHARACTER | character varying }
 *
 * @group Schema Definition
 * @category Column Types
 */
export function varchar(maximumLength?: number) {
	return characterVarying(maximumLength);
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgCharacterVarying extends MaxLengthColumn<string, string> {}
