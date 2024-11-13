import { StringColumn } from "~pg/schema/column/column.js";

/**
 * Column that stores a document in a form optimized for a text query.
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
 * @example
 * ```ts
 * import { schema, table, tsquery } from "@monolayer/pg/schema";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         description: tsquery(),
 *       },
 *     }),
 *   },
 * });
 *
 * // Kysely database schema type
 * type DB = typeof dbSchema.infer;
 * ```
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-textsearch.html#DATATYPE-TSQUERY | tsquery}
 *
 * @group Schema Definition
 * @category Column Types
 */
export function tsquery() {
	return new PgTsquery();
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgTsquery extends StringColumn {
	/**
	 * @hidden
	 */
	constructor() {
		super("tsquery");
	}
}
