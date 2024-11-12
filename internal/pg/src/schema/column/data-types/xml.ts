import { StringColumn } from "~pg/schema/column/column.js";

/**
 * Column that stores XML data.
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
 * import { schema, table, xml } from "@monolayer/pg/schema";
 * import { zodSchema } from "@monolayer/pg/zod";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         doc: xml(),
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
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-xml.html#DATATYPE-XML | xml}
 *
 * @group Schema Definition
 * @category Column Types
 */
export function xml() {
	return new PgXML();
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgXML extends StringColumn {
	/**
	 * @hidden
	 */
	constructor() {
		super("xml");
	}
}
