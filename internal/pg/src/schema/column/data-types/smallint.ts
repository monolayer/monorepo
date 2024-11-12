import { IdentifiableColumn } from "~pg/schema/column/column.js";

/**
 * Column that stores small-range integers.
 * @remarks
 * Range: -32768 to +32767.
 *
 * **Kysely database schema type definition**
 * ```ts
 * {
 *   readonly __select__: number | null;
 *   readonly __insert__: number | string | null | undefined;
 *   readonly __update__: number | string | null;
 * };
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * @example
 * ```ts
 * import { schema, smallint, table } from "@monolayer/pg/schema";
 * import { zodSchema } from "@monolayer/pg/zod";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         id: smallint(),
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
 * {@link https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-INT | smallint} (*PostgreSQL Docs*)
 *
 * @group Schema Definition
 * @category Column Types
 */
export function smallint() {
	return new PgSmallint();
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgSmallint extends IdentifiableColumn<number, number | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("smallint", "smallint");
	}
}
