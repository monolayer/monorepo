import { IdentifiableColumn } from "../column.js";

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
 * **Zod Schema**
 *
 * *Types:*
 * ```ts
 * {
 *   input?:  number | string | null | undefined;
 *   output?: number | null | undefined;
 * }
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * *Validations:*
 * - Input value must be `number`, `string`, or `null`.
 * - Non-null values:
 *   - must be coercible to `number`.
 *   - Cannot be lower than -32768.
 *   - Cannot be greater than 32767.
 * @example
 * ```ts
 * import { schema, smallint, table } from "yount";
 * import { zodSchema } from "yount/zod";
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
 */
export function smallint() {
	return new PgSmallint();
}

export class PgSmallint extends IdentifiableColumn<number, number | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("smallint", "smallint");
	}
}
