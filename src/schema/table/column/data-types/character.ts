import { MaxLengthColumn } from "../column.js";

/**
 * Column that stores a fixed-length, blank-padded string of up to `maximumLength` characters.
 * @param maximumLength - Maximum character length of strings in the column. Must be greater than zero and cannot exceed 10,485,760. Default: 1.
 * @remarks
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
 * - Value must be a `string` or `null`.
 * - String values cannot exceed `maximumLength`.
 * @example
 * ```ts
 * import { char, pgDatabase, table } from "yount";
 * import { zodSchema } from "yount/zod";
 *
 * const database = pgDatabase({
 *   tables: {
 *     example: table({
 *       columns: {
 *         description: char(30),
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
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-character.html#DATATYPE-CHARACTER | character}

 */
export function character(maximumLength?: number) {
	return new PgCharacter("character", maximumLength ? maximumLength : 1);
}

/**
 * Column that stores a fixed-length, blank-padded string of up to `maximumLength` characters.
 * @param maximumLength - Maximum character length of strings in the column. Must be greater than zero and cannot exceed 10,485,760. Default: 1.
 * @remarks
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
 * - Value must be a `string` or `null`.
 * - String values cannot exceed `maximumLength`.
 * @example
 * ```ts
 * import { char, pgDatabase, table } from "yount";
 * import { zodSchema } from "yount/zod";
 *
 * const database = pgDatabase({
 *   tables: {
 *     example: table({
 *       columns: {
 *         description: char(30),
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
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-character.html#DATATYPE-CHARACTER | character}

 */
export function char(maximumLength = 1) {
	return character(maximumLength);
}

export class PgCharacter extends MaxLengthColumn<string, string> {}