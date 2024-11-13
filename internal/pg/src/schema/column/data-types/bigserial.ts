import { SerialColumn } from "~pg/schema/column/column.js";

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
 *
 * @example
 * ```ts
 * import { bigserial, schema, table } from "@monolayer/pg/schema";
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
 * ```
 * @see
 *
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-SERIAL | bigserial}
 *
 * @group Schema Definition
 * @category Column Types
 */
export function bigserial() {
	return new PgBigSerial();
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
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
