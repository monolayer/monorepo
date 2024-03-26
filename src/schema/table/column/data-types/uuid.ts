import { PgColumn, valueWithHash } from "../column.js";

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
 * - Input value must be `string`, or `null`.
 * - String values must be a valid UUID.
 * @example
 * ```ts
 * import { uuid, pgDatabase, sql, table } from "kysely-kinetic";
 * import { zodSchema } from "kysely-kinetic/zod";
 *
 * const database = pgDatabase({
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
 * type DB = typeof database.infer;
 * // Zod Schema
 * const schema = zodSchema(database.tables.example);
 * ```
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-uuid.html#DATATYPE-UUID | uuid}
 */
export function uuid() {
	return new PgUuid();
}

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
