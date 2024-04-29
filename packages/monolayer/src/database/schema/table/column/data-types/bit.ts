import { MaxLengthColumn } from "../column.js";

/**
 * Column that stores bit strings (strings of 1's and 0's) of fixed length.
 * @param fixedLength - Fixed length of the bit string. Must a positive integer. Default: 1.
 * @remarks
 * The bit string to be stored must match the `fixedLength` exactly.
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
 * - Value must match the `fixedLength` exactly.
 * @example
 * ```ts
 * import { bit, schema, table } from "monolayer/pg";
 * import { zodSchema } from "monolayer/zod";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         code: bit(),
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
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-bit.html#DATATYPE-BIT | bit(n)}
 */
export function bit(fixedLength = 1) {
	return new PgBit(fixedLength);
}

export class PgBit extends MaxLengthColumn<string, string> {
	/**
	 * @hidden
	 */
	constructor(fixedLength?: number) {
		super("bit", fixedLength ?? 1);
	}
}
