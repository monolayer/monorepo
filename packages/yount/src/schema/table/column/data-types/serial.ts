import { SerialColumn } from "../column.js";

/**
 * Unique identifier column.
 * @remarks
 * Not a true native PostgreSQL data type. A `serial` column is a column that has:
 * - an `integer` data type.
 * - default values assigned from a sequence generator.
 * - a `NOT NULL` constraint.
 *
 * **Kysely database schema type definition**
 * ```ts
 * {
 *   readonly __select__: number;
 *   readonly __insert__: number | string | undefined;
 *   readonly __update__: number | string;
 * };
 * ```
 * **Zod Schema**
 *
 * *Types:*
 * ```ts
 * {
 *   input?: number | string | undefined;
 *   output?: number | undefined;
 * }
 * ```
 * *Validations:*
 * - Explicit `undefined` values are rejected.
 * - Value must be a valid `number`.
 * - Value cannot be lower than -2147483648.
 * - Value cannot be greater than 2147483647.
 * @example
 * ```ts
 * import { schema, serial, table  } from "yount/pg";
 * import { zodSchema } from "yount/zod";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         id: serial(),
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
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-SERIAL | serial }
 */
export function serial() {
	return new PgSerial();
}
export class PgSerial extends SerialColumn<number, number | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("serial", "serial");
	}
}
