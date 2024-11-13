import { PgColumn, valueWithHash } from "~pg/schema/column/column.js";

/**
 * Column that stores Universally Unique Identifiers (UUID).
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
 * import { uuid, schema, sql, table } from "@monolayer/pg/schema";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         id: uuid().default(sql`gen_random_uuid()`),
 *       },
 *     }),
 *   },
 * });
 *
 * // Kysely database schema type
 * type DB = typeof dbSchema.infer;
 * ```
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-uuid.html#DATATYPE-UUID | uuid}
 *
 * @group Schema Definition
 * @category Column Types
 */
export function uuid() {
	return new PgUuid();
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgUuid extends PgColumn<string, string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("uuid", "uuid");
	}

	/**
	 * @hidden
	 */
	protected transformDefault(value: string) {
		return valueWithHash(`'${value.toLowerCase()}'::uuid`);
	}
}
