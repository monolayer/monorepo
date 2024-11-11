import { StringColumn } from "~pg/schema/column/column.js";

/**
 * Column that stores an IPv4 or IPv6 host address, and optionally its subnet.
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
 * import { inet, schema, table } from "@monolayer/pg/schema";
 * import { zodSchema } from "monolayer/zod";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         host: inet(),
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
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-net-types.html#DATATYPE-INET | inet}
 *
 * @group Schema Definition
 * @category Column Types
 */
export function inet() {
	return new PgInet();
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgInet extends StringColumn {
	/**
	 * @hidden
	 */
	constructor() {
		super("inet");
	}
}
