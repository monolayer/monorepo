import { SerialColumn } from "~/schema/column/column.js";

/**
 * Unique identifier column.
 * @remarks
 * Not a true native PostgreSQL data type. A `bigserial` column is a column that has:
 * - a `bigint` data type.
 * - default values assigned from a sequence generator.
 * - a `NOT NULL` constraint.
 *
 * **Kysely database schema type definition**
 * ```ts
 * {
 *   readonly __select__: string;
 *   readonly __insert__: bigint | number | string | undefined;
 *   readonly __update__: bigint | number | string;
 * };
 * ```
 * **Zod Schema**
 *
 * *Types:*
 * ```ts
 * {
 *   input?: bigint | number | string | undefined;
 *   output?: string | undefined;
 * }
 * ```
 * *Validations:*
 * - Explicit `undefined` values are rejected.
 * - Value must be a valid `bigint`.
 * - Value cannot be lower than -9223372036854775808.
 * - Value cannot be greater than 9223372036854775807.
 *
 * @example
 * ```ts
 * import { bigserial, schema, table } from "monolayer/pg";
 * import { zodSchema } from "monolayer/zod";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         id: bigserial(),
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
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-SERIAL | bigserial}
 */
export function bigserial() {
	return new PgBigSerial();
}
export class PgBigSerial extends SerialColumn<
	string,
	number | bigint | string
> {
	/**
	 * @hidden
	 */
	constructor() {
		super("bigserial", "bigserial");
	}
}
