import { IdentifiableColumn } from "~pg/schema/column/column.js";

/**
 * Column that stores whole numbers.
 * @remarks
 * Range: -9223372036854775808 to +9223372036854775807.
 *
 * **Kysely database schema type definition**
 * ```ts
 * {
 *   readonly __select__: string | null;
 *   readonly __insert__: bigint | number | string | null | undefined;
 *   readonly __update__: bigint | number | string | null;
 * };
 * ```
 *
 * @example
 * ```ts
 * import { bigint, schema, table } from "@monolayer/pg/schema";
 * import { zodSchema } from "@monolayer/pg/zod";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         id: bigint(),
 *       },
 *     }),
 *   },
 * });
 *
 * // Kysely database schema type
 * type DB = typeof dbSchema.infer;
 * // Zod Schema
 * const schema = zodSchema(dbSchema.tables.example);
 * ```
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-INT | bigint}
 *
 * @group Schema Definition
 * @category Column Types
 */
export function bigint() {
	return new PgBigInt();
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgBigInt extends IdentifiableColumn<
	string,
	number | bigint | string
> {
	/**
	 * @hidden
	 */
	constructor() {
		super("bigint", "bigint");
	}
}
