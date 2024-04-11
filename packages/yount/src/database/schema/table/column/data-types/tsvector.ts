import { StringColumn } from "../column.js";

/**
 * Column that stores a document in a form optimized for text search.
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
 * - Input value must be `string` or `null`.
 * @example
 * ```ts
 * import { schema, table, tsvector } from "yount/pg";
 * import { zodSchema } from "yount/zod";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         description: tsvector(),
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
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-textsearch.html#DATATYPE-TSVECTOR | tsvector}
 */
export function tsvector() {
	return new PgTsvector();
}

export class PgTsvector extends StringColumn {
	/**
	 * @hidden
	 */
	constructor() {
		super("tsvector");
	}
}
