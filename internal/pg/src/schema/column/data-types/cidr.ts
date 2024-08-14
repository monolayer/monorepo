import { StringColumn } from "~pg/schema/column/column.js";

/**
 * Column that stores an IPv4 or IPv6 network specification.
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
 * - Value must be `string` or `null`.
 * - String values must be a valid IPv4 or IPv6 network specification without bits set to the right of the mask.
 * @example
 * ```ts
 * import { cidr, schema, table } from "monolayer/pg";
 * import { zodSchema } from "monolayer/zod";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         network: cidr(),
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
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-net-types.html#DATATYPE-CIDR | cidr}
 *
 * @group Schema Definition
 * @category Column Types
 */
export function cidr() {
	return new PgCIDR();
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgCIDR extends StringColumn {
	/**
	 * @hidden
	 */
	constructor() {
		super("cidr");
	}
}
