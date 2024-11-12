import { StringColumn } from "~pg/schema/column/column.js";

/**
 * Column that stores MAC addresses in EUI-64 format.
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
 * import { macaddr8, schema, table } from "@monolayer/pg/schema";
 * import { zodSchema } from "@monolayer/pg/zod";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         address: macaddr8(),
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
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-net-types.html#DATATYPE-MACADDR | macaddr8}
 *
 * @group Schema Definition
 * @category Column Types
 */
export function macaddr8() {
	return new PgMacaddr8();
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgMacaddr8 extends StringColumn {
	/**
	 * @hidden
	 */
	constructor() {
		super("macaddr8");
	}
}
